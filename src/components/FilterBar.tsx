"use client";

import { Link as LinkIcon, X } from "lucide-react";

const MEDIA_TYPES = [
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "voice", label: "Voice" },
  { value: "document", label: "Docs" },
  { value: "location", label: "Locations" },
];

export function FilterBar({
  hasLinks,
  mediaType,
  onChange,
}: {
  hasLinks: boolean;
  mediaType?: string;
  onChange: (next: { hasLinks?: boolean; mediaType?: string }) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-2 dark:border-gray-800">
      <button
        onClick={() => onChange({ hasLinks: !hasLinks })}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
          hasLinks
            ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
            : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        }`}
      >
        <LinkIcon size={12} /> Has links
      </button>
      {MEDIA_TYPES.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange({ mediaType: mediaType === m.value ? undefined : m.value })}
          className={`rounded-full border px-3 py-1 text-xs transition ${
            mediaType === m.value
              ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          }`}
        >
          {m.label}
        </button>
      ))}
      {(hasLinks || mediaType) && (
        <button
          onClick={() => onChange({ hasLinks: false, mediaType: undefined })}
          className="ml-auto inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <X size={12} /> Clear
        </button>
      )}
    </div>
  );
}
