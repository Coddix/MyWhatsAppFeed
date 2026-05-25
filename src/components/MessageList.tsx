"use client";

import { useEffect, useRef } from "react";
import useSWRInfinite from "swr/infinite";
import { format, isSameDay } from "date-fns";
import { MessageCard } from "./MessageCard";
import type { MessagesResponse, MessageWithRelations } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function buildKey(
  pageIndex: number,
  previousPageData: MessagesResponse | null,
  filters: Record<string, string | undefined>
): string | null {
  if (previousPageData && previousPageData.nextCursor === null) return null;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v) params.set(k, v);
  }
  if (pageIndex > 0 && previousPageData?.nextCursor) {
    params.set("cursor", previousPageData.nextCursor);
  }
  return `/api/messages?${params.toString()}`;
}

export function MessageList({
  conversationId,
  search,
  hasLinks,
  mediaType,
  bookmarked,
}: {
  conversationId?: string;
  search?: string;
  hasLinks?: boolean;
  mediaType?: string;
  bookmarked?: boolean;
}) {
  const filters = {
    conversationId,
    search,
    hasLinks: hasLinks ? "true" : undefined,
    mediaType,
    bookmarked: bookmarked ? "true" : undefined,
  };

  const { data, size, setSize, isValidating } = useSWRInfinite<MessagesResponse>(
    (i, prev) => buildKey(i, prev, filters),
    fetcher,
    { revalidateFirstPage: false }
  );

  const messages: MessageWithRelations[] = data ? data.flatMap((d) => d.messages) : [];
  const hasMore = data ? data[data.length - 1]?.nextCursor !== null : true;
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isValidating) {
          setSize((s) => s + 1);
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isValidating, setSize]);

  if (!data && isValidating) {
    return (
      <div className="space-y-4 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 py-16 text-center text-gray-500">
        <p className="text-sm">No messages found.</p>
        <p className="mt-1 text-xs">Try adjusting your filters or import a chat.</p>
      </div>
    );
  }

  const grouped: Array<{ date: Date; messages: MessageWithRelations[] }> = [];
  for (const msg of messages) {
    const d = new Date(msg.timestamp);
    const last = grouped[grouped.length - 1];
    if (last && isSameDay(last.date, d)) last.messages.push(msg);
    else grouped.push({ date: d, messages: [msg] });
  }

  return (
    <div>
      {grouped.map((group) => (
        <section key={group.date.toISOString()}>
          <h2 className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 px-4 py-2 text-xs font-medium uppercase tracking-wider text-gray-500 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
            {format(group.date, "EEEE, MMM d, yyyy")}
          </h2>
          {group.messages.map((m) => (
            <MessageCard key={m.id} message={m} showConversation={!conversationId} />
          ))}
        </section>
      ))}
      <div ref={loaderRef} className="py-8 text-center text-xs text-gray-400">
        {hasMore ? (isValidating ? "Loading…" : "") : "End of messages"}
      </div>
    </div>
  );
}
