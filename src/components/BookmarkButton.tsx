"use client";

import { Star } from "lucide-react";
import { useState } from "react";

export function BookmarkButton({
  messageId,
  initiallyBookmarked,
  onChange,
}: {
  messageId: string;
  initiallyBookmarked: boolean;
  onChange?: (bookmarked: boolean) => void;
}) {
  const [bookmarked, setBookmarked] = useState(initiallyBookmarked);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !bookmarked;
    setBookmarked(next);
    try {
      if (next) {
        await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId }),
        });
      } else {
        await fetch(`/api/bookmarks?messageId=${messageId}`, { method: "DELETE" });
      }
      onChange?.(next);
    } catch {
      setBookmarked(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark message"}
      className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-yellow-500 dark:hover:bg-gray-800"
    >
      <Star
        size={16}
        className={bookmarked ? "fill-yellow-400 text-yellow-500" : ""}
      />
    </button>
  );
}
