"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { setBookmark, removeBookmark } from "@/lib/db-client";
import { useEncryptionKey } from "@/contexts/AuthContext";

export function BookmarkButton({
  messageId,
  initiallyBookmarked,
  onChange,
}: {
  messageId: string;
  initiallyBookmarked: boolean;
  onChange?: (bookmarked: boolean) => void;
}) {
  const key = useEncryptionKey();
  const [bookmarked, setBookmarkedState] = useState(initiallyBookmarked);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !bookmarked;
    setBookmarkedState(next);
    try {
      if (next) await setBookmark(key, messageId);
      else await removeBookmark(messageId);
      onChange?.(next);
    } catch {
      setBookmarkedState(!next);
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
