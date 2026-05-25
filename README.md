# MyWhatsAppFeed

A modern, clean web app to browse, search, and filter your WhatsApp chat exports.

## Features

- **Import WhatsApp exports** — Upload `.txt` chat exports (Settings → Export Chat → Without Media)
- **Filter by conversation** — Browse a single chat or all messages
- **Full-text search** — Find any message by keyword
- **Social media link detection** — YouTube, X, Instagram, TikTok, Facebook, LinkedIn, Reddit, Spotify, GitHub, WhatsApp links get platform icons
- **Link previews** — Open Graph metadata (title, description, thumbnail) loaded in a side column
- **Media badges** — Visual badges for images, videos, voice notes, documents, and locations
- **Bookmark messages** — Star important messages and filter by them

## Tech stack

- Next.js 16 (App Router) + Tailwind CSS
- SQLite via Prisma
- SWR for data fetching
- react-icons for brand logos
- microlink.io for client-side OG metadata

## Setup

```bash
npm install
npx prisma migrate dev
npm run dev
```

Open <http://localhost:3000>, click **Import Chat**, and upload a WhatsApp `.txt` export.

## How to export a WhatsApp chat

1. Open the chat in WhatsApp
2. Tap the contact/group name to open chat info
3. Scroll down and tap **Export Chat**
4. Choose **Without Media**
5. Save the `.txt` file and upload it in MyWhatsAppFeed
