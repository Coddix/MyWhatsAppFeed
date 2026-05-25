"use client";

import { format } from "date-fns";
import { extractUrls, detectPlatform } from "@/lib/link-utils";
import { MediaBadge } from "./MediaBadge";
import { BookmarkButton } from "./BookmarkButton";
import { LinkPreview } from "./LinkPreview";
import { PlatformIcon } from "./PlatformIcon";
import type { MessageWithRelations } from "@/lib/types";

function senderColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const colors = [
    "text-rose-600 dark:text-rose-400",
    "text-amber-600 dark:text-amber-400",
    "text-emerald-600 dark:text-emerald-400",
    "text-sky-600 dark:text-sky-400",
    "text-violet-600 dark:text-violet-400",
    "text-pink-600 dark:text-pink-400",
    "text-cyan-600 dark:text-cyan-400",
    "text-indigo-600 dark:text-indigo-400",
  ];
  return colors[Math.abs(hash) % colors.length];
}

function renderContent(content: string, urls: string[]) {
  if (urls.length === 0) return content;
  const parts: Array<{ type: "text" | "url"; value: string }> = [];
  let remaining = content;
  for (const url of urls) {
    const idx = remaining.indexOf(url);
    if (idx === -1) continue;
    if (idx > 0) parts.push({ type: "text", value: remaining.slice(0, idx) });
    parts.push({ type: "url", value: url });
    remaining = remaining.slice(idx + url.length);
  }
  if (remaining) parts.push({ type: "text", value: remaining });
  return parts.map((p, i) =>
    p.type === "url" ? (
      <a
        key={i}
        href={p.value}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
      >
        {p.value}
      </a>
    ) : (
      <span key={i}>{p.value}</span>
    )
  );
}

export function MessageCard({ message, showConversation }: { message: MessageWithRelations; showConversation?: boolean }) {
  const urls = extractUrls(message.content);
  const platforms = Array.from(new Set(urls.map(detectPlatform).filter(Boolean)));
  const time = format(new Date(message.timestamp), "HH:mm");

  return (
    <article className="group grid grid-cols-1 gap-4 border-b border-gray-100 px-4 py-3 transition hover:bg-gray-50/60 md:grid-cols-[1fr_300px] dark:border-gray-800 dark:hover:bg-gray-900/40">
      <div className="min-w-0">
        <header className="mb-1 flex items-center gap-2 text-xs">
          <span className={`font-semibold ${senderColor(message.sender)}`}>{message.sender}</span>
          <span className="text-gray-400">{time}</span>
          {showConversation && (
            <span className="truncate text-gray-400">· {message.conversation.name}</span>
          )}
          {message.mediaType && <MediaBadge type={message.mediaType} />}
          {platforms.length > 0 && (
            <span className="flex items-center gap-1">
              {platforms.map((p) => (
                <PlatformIcon key={p} platform={p} size={14} />
              ))}
            </span>
          )}
          <div className="ml-auto opacity-0 transition group-hover:opacity-100">
            <BookmarkButton messageId={message.id} initiallyBookmarked={!!message.bookmark} />
          </div>
        </header>
        <p className="whitespace-pre-wrap break-words text-sm text-gray-800 dark:text-gray-200">
          {renderContent(message.content, urls)}
        </p>
      </div>
      {urls.length > 0 && (
        <div className="space-y-2">
          {urls.slice(0, 3).map((url) => (
            <LinkPreview key={url} url={url} />
          ))}
        </div>
      )}
    </article>
  );
}
