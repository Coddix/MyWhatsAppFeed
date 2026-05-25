import { Image as ImageIcon, Video, FileText, Mic, MapPin } from "lucide-react";

const STYLES: Record<string, { Icon: typeof ImageIcon; label: string; classes: string }> = {
  image: { Icon: ImageIcon, label: "Image", classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  video: { Icon: Video, label: "Video", classes: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  document: { Icon: FileText, label: "Doc", classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  voice: { Icon: Mic, label: "Voice", classes: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  location: { Icon: MapPin, label: "Location", classes: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
};

export function MediaBadge({ type }: { type: string | null }) {
  if (!type || !STYLES[type]) return null;
  const { Icon, label, classes } = STYLES[type];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}
    >
      <Icon size={12} />
      {label}
    </span>
  );
}
