"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MessageList } from "@/components/MessageList";
import { SearchBar } from "@/components/SearchBar";
import { FilterBar } from "@/components/FilterBar";

export default function Home() {
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [hasLinks, setHasLinks] = useState(false);
  const [mediaType, setMediaType] = useState<string | undefined>();
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      <Sidebar
        activeConversationId={conversationId}
        showBookmarked={bookmarked}
        onSelectConversation={setConversationId}
        onToggleBookmarked={() => setBookmarked((b) => !b)}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <SearchBar value={search} onChange={setSearch} />
        </header>
        <FilterBar
          hasLinks={hasLinks}
          mediaType={mediaType}
          onChange={({ hasLinks: nextLinks, mediaType: nextMedia }) => {
            if (nextLinks !== undefined) setHasLinks(nextLinks);
            setMediaType(nextMedia);
          }}
        />
        <div className="flex-1 overflow-y-auto">
          <MessageList
            conversationId={conversationId}
            search={search || undefined}
            hasLinks={hasLinks}
            mediaType={mediaType}
            bookmarked={bookmarked}
          />
        </div>
      </main>
    </div>
  );
}
