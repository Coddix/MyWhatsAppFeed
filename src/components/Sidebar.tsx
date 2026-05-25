"use client";

import useSWR from "swr";
import { useState } from "react";
import { MessageSquare, Users, Star, Upload, Inbox } from "lucide-react";
import { ImportDialog } from "./ImportDialog";
import type { ConversationSummary } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function Sidebar({
  activeConversationId,
  showBookmarked,
  onSelectConversation,
  onToggleBookmarked,
}: {
  activeConversationId?: string;
  showBookmarked: boolean;
  onSelectConversation: (id: string | undefined) => void;
  onToggleBookmarked: () => void;
}) {
  const { data: conversations, mutate } = useSWR<ConversationSummary[]>("/api/conversations", fetcher);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <aside className="flex h-full w-72 flex-col border-r border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50">
      <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-800">
        <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-50">
          MyWhatsAppFeed
        </h1>
      </div>

      <div className="flex flex-col gap-1 p-2">
        <button
          onClick={() => {
            onSelectConversation(undefined);
            if (showBookmarked) onToggleBookmarked();
          }}
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
            !activeConversationId && !showBookmarked
              ? "bg-gray-200 font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-50"
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          <Inbox size={16} /> All Messages
        </button>
        <button
          onClick={onToggleBookmarked}
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
            showBookmarked
              ? "bg-yellow-100 font-medium text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-200"
              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
        >
          <Star size={16} /> Bookmarked
        </button>
      </div>

      <div className="border-t border-gray-200 px-4 pt-3 dark:border-gray-800">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Conversations
        </h2>
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        {conversations && conversations.length === 0 && (
          <p className="px-3 py-4 text-xs text-gray-500">No conversations yet. Import a chat to get started.</p>
        )}
        {conversations?.map((conv) => (
          <button
            key={conv.id}
            onClick={() => {
              onSelectConversation(conv.id);
              if (showBookmarked) onToggleBookmarked();
            }}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
              activeConversationId === conv.id
                ? "bg-gray-200 font-medium text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            {conv.isGroup ? <Users size={16} /> : <MessageSquare size={16} />}
            <span className="flex-1 truncate">{conv.name}</span>
            <span className="text-xs text-gray-400">{conv.messageCount}</span>
          </button>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-2 dark:border-gray-800">
        <button
          onClick={() => setImportOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          <Upload size={16} /> Import Chat
        </button>
      </div>

      {importOpen && (
        <ImportDialog
          onClose={() => setImportOpen(false)}
          onImported={() => {
            setImportOpen(false);
            mutate();
          }}
        />
      )}
    </aside>
  );
}
