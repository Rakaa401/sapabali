import Link from "next/link";
import type { ChatMessage } from "@/types/chat";

const isHttp = (url: string) => /^https?:\/\//i.test(url);

export default function MessageBubble({
  message,
  sourcesLabel,
  openSourceLabel,
}: {
  message: ChatMessage;
  sourcesLabel: string;
  openSourceLabel: string;
}) {
  const isUser = message.role === "user";
  const sources = !isUser ? (message.sources ?? []) : [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${
          isUser
            ? "rounded-br-sm bg-emerald-700 text-white"
            : "rounded-bl-sm border border-stone-200 bg-white text-stone-800"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>

        {sources.length > 0 && (
          <div className="mt-3 border-t border-stone-100 pt-2">
            <p className="text-xs font-medium text-stone-500">{sourcesLabel}</p>
            <ul className="mt-1 space-y-1.5">
              {sources.map((s) => (
                <li key={s.id} className="text-xs text-stone-600">
                  {s.href ? (
                    <Link href={s.href} className="font-medium text-emerald-700 hover:underline">
                      {s.title}
                    </Link>
                  ) : (
                    <span className="font-medium text-stone-800">{s.title}</span>
                  )}
                  {s.source_name && <span> &middot; {s.source_name}</span>}
                  {s.source_url && isHttp(s.source_url) && (
                    <>
                      {" "}
                      <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">
                        {openSourceLabel}
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function TypingBubble({ label }: { label: string }) {
  return (
    <div className="flex justify-start" role="status">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-stone-200 bg-white px-4 py-3">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-2 w-2 animate-bounce rounded-full bg-stone-400"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
