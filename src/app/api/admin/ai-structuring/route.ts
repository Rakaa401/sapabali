import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGeminiErrorMessage } from "@/lib/ai/gemini";
import { structureKnowledge } from "@/lib/ai/structuring";

export const runtime = "nodejs";
export const maxDuration = 120;

function getErrorStatus(message: string): number {
  if (/rate limit|quota/i.test(message)) return 429;
  if (/timed out|timeout/i.test(message)) return 504;
  if (/high demand|temporarily unavailable|service_unavailable|overloaded/i.test(message)) {
    return 503;
  }
  return 500;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (adminError || !admin) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;

    const content =
      typeof input.content === "string" ? input.content.trim() : "";

    const destinationId =
      typeof input.destination_id === "string" ? input.destination_id : "";

    const language = input.language;

    const sourceName =
      typeof input.source_name === "string" ? input.source_name.trim() : "";

    const sourceUrl =
      typeof input.source_url === "string" ? input.source_url.trim() : "";

    if (content.length < 20 || content.length > 20000) {
      return NextResponse.json(
        { error: "Content must contain between 20 and 20,000 characters." },
        { status: 400 },
      );
    }

    if (!destinationId) {
      return NextResponse.json(
        { error: "Destination is required." },
        { status: 400 },
      );
    }

    if (language !== "id" && language !== "en") {
      return NextResponse.json({ error: "Invalid language." }, { status: 400 });
    }

    if (sourceName.length > 200 || sourceUrl.length > 2048) {
      return NextResponse.json(
        { error: "Source information is too long." },
        { status: 400 },
      );
    }

    if (sourceUrl) {
      try {
        const url = new URL(sourceUrl);

        if (url.protocol !== "http:" && url.protocol !== "https:") {
          throw new Error("Invalid protocol.");
        }
      } catch {
        return NextResponse.json(
          { error: "Enter a valid HTTP or HTTPS source URL." },
          { status: 400 },
        );
      }
    }

    const { data: destination, error: destinationError } = await supabase
      .from("destinations")
      .select("id, name")
      .eq("id", destinationId)
      .maybeSingle();

    if (destinationError || !destination) {
      return NextResponse.json(
        { error: "Selected destination was not found." },
        { status: 404 },
      );
    }

    const startedAt = Date.now();

    const usage = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };

    // Updated by structureKnowledge so the log shows the model actually used
    // (primary or fallback).
    let modelUsed = process.env.GEMINI_MODEL || "gemini-3.6-flash";

    const logRequest = async (values: {
      response?: string | null;
      status: "success" | "error";
      error_message?: string | null;
    }) => {
      const { error } = await supabase.rpc("log_ai_request", {
        p_query: content,
        p_response: values.response ?? null,
        p_model: modelUsed,
        p_provider: "gemini",
        p_prompt_tokens: usage.prompt_tokens,
        p_completion_tokens: usage.completion_tokens,
        p_total_tokens: usage.total_tokens,
        p_latency_ms: Date.now() - startedAt,
        p_status: values.status,
        p_error_message: values.error_message ?? null,
        p_metadata: {
          feature: "ai_structuring",
          destination_id: destination.id,
          destination_name: destination.name,
          language,
          source_name: sourceName || null,
          source_url: sourceUrl || null,
        },
      });

      if (error) {
        console.error("[AI LOGGING ERROR]", error);
      }
    };

    try {
      const result = await structureKnowledge(
        {
          content,
          source_name: sourceName,
          source_url: sourceUrl,
          destination_name: destination.name,
          language,
        },
        (tokenUsage) => {
          usage.prompt_tokens = tokenUsage.prompt_tokens;
          usage.completion_tokens = tokenUsage.completion_tokens;
          usage.total_tokens = tokenUsage.total_tokens;
        },
        (model) => {
          modelUsed = model;
        },
      );

      await logRequest({
        response: JSON.stringify(result),
        status: "success",
      });

      return NextResponse.json({ data: result });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : getGeminiErrorMessage(error);

      await logRequest({
        status: "error",
        error_message: message,
      });

      // Single place where this error is logged.
      console.error("[AI STRUCTURING ERROR]", error);

      const status = getErrorStatus(message);

      return NextResponse.json(
        { error: message },
        {
          status,
          headers:
            status === 503 || status === 429 ? { "Retry-After": "30" } : {},
        },
      );
    }
  } catch (error) {
    console.error("[AI STRUCTURING ROUTE ERROR]", error);

    return NextResponse.json(
      { error: "AI structuring request could not be processed." },
      { status: 500 },
    );
  }
}