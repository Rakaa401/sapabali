import { getAdminClient } from "@/lib/knowledge/server-utils";
import { splitIntoChunks } from "./chunking";
import { generateEmbedding } from "./embeddings";

export async function indexKnowledge(knowledgeId: string) {
  const admin = await getAdminClient();

  if ("error" in admin) {
    throw new Error(admin.error);
  }

  const { supabase } = admin;

  const { data: knowledge, error: knowledgeError } = await supabase
    .from("knowledge_items")
    .select("id, title, content")
    .eq("id", knowledgeId)
    .maybeSingle();

  if (knowledgeError || !knowledge) {
    throw new Error(knowledgeError?.message || "Knowledge not found.");
  }

  const chunks = splitIntoChunks(knowledge.content);

  if (chunks.length === 0) {
    throw new Error("Knowledge content is empty.");
  }

  const { error: statusError } = await supabase
    .from("knowledge_items")
    .update({ indexing_status: "indexing" })
    .eq("id", knowledgeId);

  if (statusError) {
    throw new Error(statusError.message);
  }

  try {
    const records = [];

    for (let index = 0; index < chunks.length; index++) {
      const embedding = await generateEmbedding(chunks[index]);

      records.push({
        chunk_index: index,
        content: chunks[index],
        embedding,
        metadata: {
          title: knowledge.title,
          chunk_index: index,
        },
      });
    }

    const { error: replaceError } = await supabase.rpc(
      "replace_knowledge_chunks",
      {
        p_knowledge_item_id: knowledgeId,
        p_chunks: records,
      },
    );

    if (replaceError) {
      throw new Error(replaceError.message);
    }

    const { error: updateError } = await supabase
      .from("knowledge_items")
      .update({ indexing_status: "indexed" })
      .eq("id", knowledgeId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { chunks: chunks.length };
  } catch (error) {
    await supabase
      .from("knowledge_items")
      .update({ indexing_status: "failed" })
      .eq("id", knowledgeId);

    throw error;
  }
}