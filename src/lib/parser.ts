import { hasUrl } from "./link-utils";

export type MediaType = "image" | "video" | "document" | "voice" | "location" | null;

export type ParsedMessage = {
  sender: string;
  content: string;
  timestamp: Date;
  mediaType: MediaType;
  hasLinks: boolean;
};

export type ParsedExport = {
  conversationName: string;
  isGroup: boolean;
  messages: ParsedMessage[];
};

const ANDROID_LINE = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*[-–]\s*(.+)$/;
const IOS_LINE = /^\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(?:AM|PM|a\.\s?m\.|p\.\s?m\.)?\]\s*(.+)$/i;

const MEDIA_PATTERNS: Array<{ pattern: RegExp; type: MediaType }> = [
  { pattern: /<attached:\s*[^>]*\.(jpe?g|png|gif|webp|heic)>/i, type: "image" },
  { pattern: /<attached:\s*[^>]*\.(mp4|mov|avi|mkv|webm)>/i, type: "video" },
  { pattern: /<attached:\s*[^>]*\.(opus|ogg|m4a|aac|mp3|wav)>/i, type: "voice" },
  { pattern: /<attached:\s*[^>]*\.(pdf|docx?|xlsx?|pptx?|txt|zip)>/i, type: "document" },
  { pattern: /\bimage omitted\b/i, type: "image" },
  { pattern: /\bvideo omitted\b/i, type: "video" },
  { pattern: /\b(audio|voice) omitted\b/i, type: "voice" },
  { pattern: /\b(document|file) omitted\b/i, type: "document" },
  { pattern: /\bsticker omitted\b/i, type: "image" },
  { pattern: /\bgif omitted\b/i, type: "image" },
  { pattern: /location:\s*https?:\/\/maps\./i, type: "location" },
  { pattern: /\blive location shared\b/i, type: "location" },
];

function detectMediaType(content: string): MediaType {
  for (const { pattern, type } of MEDIA_PATTERNS) {
    if (pattern.test(content)) return type;
  }
  return null;
}

function buildTimestamp(
  day: number,
  month: number,
  year: number,
  hour: number,
  minute: number,
  second: number,
  monthFirst: boolean
): Date {
  const fullYear = year < 100 ? 2000 + year : year;
  const m = monthFirst ? day : month;
  const d = monthFirst ? month : day;
  return new Date(fullYear, m - 1, d, hour, minute, second);
}

function detectMonthFirst(samples: Array<[number, number]>): boolean {
  let dayFirstScore = 0;
  let monthFirstScore = 0;
  for (const [first, second] of samples) {
    if (first > 12) dayFirstScore++;
    if (second > 12) monthFirstScore++;
  }
  return monthFirstScore > dayFirstScore;
}

export function parseWhatsAppExport(text: string, conversationName: string, isGroup = false): ParsedExport {
  const lines = text.split(/\r?\n/);
  const messages: ParsedMessage[] = [];
  let current: ParsedMessage | null = null;

  const dateSamples: Array<[number, number]> = [];
  for (const line of lines) {
    const cleaned = line.replace(/^‎/, "");
    const m = cleaned.match(ANDROID_LINE) ?? cleaned.match(IOS_LINE);
    if (m) {
      dateSamples.push([parseInt(m[1], 10), parseInt(m[2], 10)]);
      if (dateSamples.length >= 30) break;
    }
  }
  const monthFirst = detectMonthFirst(dateSamples);

  for (const rawLine of lines) {
    const line = rawLine.replace(/^‎/, "");
    const androidMatch = line.match(ANDROID_LINE);
    const iosMatch = line.match(IOS_LINE);
    const match = androidMatch ?? iosMatch;

    if (match) {
      if (current) messages.push(current);

      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      const hour = parseInt(match[4], 10);
      const minute = parseInt(match[5], 10);
      const second = match[6] ? parseInt(match[6], 10) : 0;
      const remainder = match[7];

      const colonIdx = remainder.indexOf(": ");
      let sender = "__system__";
      let content = remainder;
      if (colonIdx > 0) {
        sender = remainder.slice(0, colonIdx).trim();
        content = remainder.slice(colonIdx + 2);
      }

      const timestamp = buildTimestamp(day, month, year, hour, minute, second, monthFirst);
      current = {
        sender,
        content,
        timestamp,
        mediaType: detectMediaType(content),
        hasLinks: hasUrl(content),
      };
    } else if (current && line.trim().length > 0) {
      current.content += "\n" + line;
      if (!current.mediaType) current.mediaType = detectMediaType(current.content);
      if (!current.hasLinks) current.hasLinks = hasUrl(current.content);
    }
  }

  if (current) messages.push(current);

  return {
    conversationName,
    isGroup,
    messages: messages.filter((m) => m.sender !== "__system__"),
  };
}
