import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  dotClassName?: string;
  className?: string;
};

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  dotClassName,
  className,
}: StatCardProps) {
  return (
    <div className={cn("bg-white px-5 py-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {dotClassName && (
            <span className={cn("size-1.5 rounded-full", dotClassName)} />
          )}
          <p className="text-sm text-zinc-500">{title}</p>
        </div>
        <Icon size={15} className="text-zinc-300" />
      </div>

      <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight text-zinc-950">
        {typeof value === "number" ? value.toLocaleString("id-ID") : value}
      </p>
      <p className="mt-1 text-xs text-zinc-400">{description}</p>
    </div>
  );
}