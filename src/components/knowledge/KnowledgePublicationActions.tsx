
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  publishKnowledge,
  reindexKnowledge,
} from "@/lib/knowledge/actions/publish";
import { unpublishKnowledge } from "@/lib/knowledge/actions/unpublish";
import type { KnowledgeStatus } from "@/types/knowledge";

interface KnowledgePublicationActionsProps {
  id: string;
  status: KnowledgeStatus;
  indexingStatus: string;
  primaryClassName: string;
  secondaryClassName: string;
}

export function KnowledgePublicationActions({
  id,
  status,
  indexingStatus,
  primaryClassName,
  secondaryClassName,
}: KnowledgePublicationActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isPublished = status === "published";
  const needsReindex =
    indexingStatus === "stale" || indexingStatus === "failed";

  function handleAction() {
    setError("");
    setSuccess("");

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

  function handleReindex() {
    setError("");
    setSuccess("");

    startTransition(async () => {
      const result = await reindexKnowledge(id);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuccess("Knowledge successfully re-indexed.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {needsReindex && (
        <button
          type="button"
          onClick={handleReindex}
          disabled={isPending}
          className={secondaryClassName}
        >
          {isPending ? "Re-indexing..." : "Re-index"}
        </button>
      )}

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

      {success && (
        <p className="max-w-xs text-right text-sm text-emerald-600">
          {success}
        </p>
      )}

      {error && (
        <p className="max-w-xs text-right text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
