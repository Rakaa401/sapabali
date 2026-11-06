"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteKnowledge } from "@/lib/knowledge/actions/delete";

export default function DeleteKnowledgeButton({
  id,
  title,
  redirectTo,
className =
  "rounded-sm text-red-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
}: {
  id: string;
  title: string;
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const ok = window.confirm(
      `Delete "${title}"?\n\nIts chunks and embeddings are deleted too. This cannot be undone.`,
    );
    if (!ok) return;

    startTransition(async () => {
      const result = await deleteKnowledge(id);
      if (!result.ok) {
        window.alert(`Could not delete: ${result.error}`);
        return;
      }
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending} className={className}>
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}
