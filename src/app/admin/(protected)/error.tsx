"use client";

import ErrorState from "@/components/ui/error-state";
import Button from "@/components/ui/button";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Unable to load dashboard"
      description="Something went wrong while retrieving dashboard data."
      action={
        <Button onClick={reset}>
          Try again
        </Button>
      }
    />
  );
}