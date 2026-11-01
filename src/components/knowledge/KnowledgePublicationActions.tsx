"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishKnowledge } from "@/lib/knowledge/actions/publish";
import { unpublishKnowledge } from "@/lib/knowledge/actions/unpublish";
import type { KnowledgeStatus } from "@/types/knowledge";

interface KnowledgePublicationActionsProps {
  id: string;
  status: KnowledgeStatus;
  primaryClassName: string;
  secondaryClassName: string;
}

export function KnowledgePublicationActions({
  id,
  status,
  primaryClassName,
  secondaryClassName,
}: KnowledgePublicationActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const isPublished = status === "published";

  function handleAction() {
    setError("");

    startTransition(async () => {
      const result = isPublished
        ? await unpublishKnowledge(id)
        : await publishKnowledge(id);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleAction}
        disabled={isPending}
        className={isPublished ? secondaryClassName : primaryClassName}
      >
        {isPending
          ? isPublished
            ? "Unpublishing..."
            : "Publishing..."
          : isPublished
            ? "Unpublish"
            : "Publish"}
      </button>

      {error && (
        <p className="max-w-xs text-right text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}