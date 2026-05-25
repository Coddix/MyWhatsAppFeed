export type Platform =
  | "youtube"
  | "twitter"
  | "instagram"
  | "tiktok"
  | "facebook"
  | "linkedin"
  | "reddit"
  | "spotify"
  | "github"
  | "whatsapp";

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+[^\s<>"{}|\\^`\[\].,;:!?)]/g;

const PLATFORM_HOSTS: Record<string, Platform> = {
  "youtube.com": "youtube",
  "www.youtube.com": "youtube",
  "m.youtube.com": "youtube",
  "youtu.be": "youtube",
  "twitter.com": "twitter",
  "x.com": "twitter",
  "mobile.twitter.com": "twitter",
  "instagram.com": "instagram",
  "www.instagram.com": "instagram",
  "tiktok.com": "tiktok",
  "www.tiktok.com": "tiktok",
  "vm.tiktok.com": "tiktok",
  "facebook.com": "facebook",
  "www.facebook.com": "facebook",
  "m.facebook.com": "facebook",
  "fb.com": "facebook",
  "fb.watch": "facebook",
  "linkedin.com": "linkedin",
  "www.linkedin.com": "linkedin",
  "reddit.com": "reddit",
  "www.reddit.com": "reddit",
  "old.reddit.com": "reddit",
  "spotify.com": "spotify",
  "open.spotify.com": "spotify",
  "github.com": "github",
  "wa.me": "whatsapp",
  "chat.whatsapp.com": "whatsapp",
};

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX);
  return matches ? Array.from(new Set(matches)) : [];
}

export function detectPlatform(url: string): Platform | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return PLATFORM_HOSTS[host] ?? null;
  } catch {
    return null;
  }
}

export function hasUrl(text: string): boolean {
  URL_REGEX.lastIndex = 0;
  return URL_REGEX.test(text);
}
