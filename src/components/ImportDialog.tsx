"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { parseWhatsAppExport } from "@/lib/parser";
import { importMessages } from "@/lib/db-client";
import { useEncryptionKey } from "@/contexts/AuthContext";

export function ImportDialog({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const key = useEncryptionKey();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const text = await file.text();
      const conversationName =
        name.trim() ||
        file.name.replace(/\.txt$/i, "").replace(/^WhatsApp Chat with\s+/i, "");
      const parsed = parseWhatsAppExport(text, conversationName, isGroup);
      if (parsed.messages.length === 0) {
        throw new Error("No messages found. Is this a WhatsApp .txt export?");
      }
      await importMessages(key, parsed.conversationName, isGroup, parsed.messages);
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Import WhatsApp Chat</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          In WhatsApp, open a chat → tap the contact name → <strong>Export Chat</strong> → <strong>Without Media</strong>. Then upload the .txt file here.
        </p>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Chat file (.txt)</span>
            <input
              type="file"
              accept=".txt,text/plain"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/40 dark:file:text-emerald-300"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Conversation name (optional — defaults to file name)
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Notes"
              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={isGroup} onChange={(e) => setIsGroup(e.target.checked)} className="rounded" />
            This is a group chat
          </label>

          {error && (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!file || uploading}
              className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Upload size={14} />
              {uploading ? "Importing…" : "Import"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
