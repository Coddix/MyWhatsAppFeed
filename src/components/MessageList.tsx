"use client";

import { useEffect, useState } from "react";
import { format, isSameDay } from "date-fns";
import { MessageCard } from "./MessageCard";
import { queryMessages, type DecryptedMessage } from "@/lib/db-client";
import { useEncryptionKey } from "@/contexts/AuthContext";

export function MessageList({
  conversationId,
  search,
  hasLinks,
  mediaType,
  bookmarked,
  refreshKey,
  onDataChanged,
}: {
  conversationId?: string;
  search?: string;
  hasLinks?: boolean;
  mediaType?: string;
  bookmarked?: boolean;
  refreshKey: number;
  onDataChanged: () => void;
}) {
  const key = useEncryptionKey();
  const [messages, setMessages] = useState<DecryptedMessage[] | null>(null);

  useEffect(() => {
    let active = true;
    setMessages(null);
    queryMessages(key, { conversationId, search, hasLinks, mediaType, bookmarked }).then(
      (data) => {
        if (active) setMessages(data);
      }
    );
    return () => {
      active = false;
    };
  }, [key, conversationId, search, hasLinks, mediaType, bookmarked, refreshKey]);

  if (messages === null) {
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

  const grouped: Array<{ date: Date; messages: DecryptedMessage[] }> = [];
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
            <MessageCard
              key={m.id}
              message={m}
              showConversation={!conversationId}
              onBookmarkChanged={onDataChanged}
            />
          ))}
        </section>
      ))}
      <div className="py-8 text-center text-xs text-gray-400">
        {messages.length} message{messages.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}
