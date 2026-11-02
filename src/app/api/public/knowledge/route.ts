import { NextResponse, type NextRequest } from "next/server";
import { getPublicKnowledgeList } from "@/lib/public/knowledge";

// GET /api/public/knowledge?destination=<slug>&language=id|en&category=<nama>&page=1&pageSize=12
// Endpoint publik: hanya mengembalikan knowledge Published dari destinasi Published.
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const destination = sp.get("destination")?.trim() ?? "";

  if (!destination) {
    return NextResponse.json({ error: "The 'destination' parameter is required." }, { status: 400 });
  }

  try {
    const result = await getPublicKnowledgeList({
      destinationSlug: destination,
      language: sp.get("language") ?? undefined,
      category: sp.get("category") ?? undefined,
      page: Number(sp.get("page")) || 1,
      pageSize: Number(sp.get("pageSize")) || undefined,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not load knowledge." }, { status: 500 });
  }
}
