import Dexie, { type EntityTable } from "dexie";
import { encryptString, decryptString } from "./crypto";

export type ConversationRow = {
  id: string;
  nameEnc: string;
  isGroup: boolean;
  createdAt: number;
};

export type MessageRow = {
  id: string;
  conversationId: string;
  senderEnc: string;
  contentEnc: string;
  timestamp: number;
  mediaType: string | null;
  hasLinks: boolean;
  createdAt: number;
};

export type BookmarkRow = {
  id: string;
  messageId: string;
  noteEnc: string | null;
  createdAt: number;
};

export type DecryptedConversation = {
  id: string;
  name: string;
  isGroup: boolean;
  createdAt: number;
  messageCount?: number;
};

export type DecryptedMessage = {
  id: string;
  conversationId: string;
  conversationName: string;
  conversationIsGroup: boolean;
  sender: string;
  content: string;
  timestamp: number;
  mediaType: string | null;
  hasLinks: boolean;
  createdAt: number;
  bookmark: { id: string; note: string | null } | null;
};

class AppDatabase extends Dexie {
  conversations!: EntityTable<ConversationRow, "id">;
  messages!: EntityTable<MessageRow, "id">;
  bookmarks!: EntityTable<BookmarkRow, "id">;

  constructor() {
    super("mywhatsappfeed");
    this.version(1).stores({
      conversations: "id, createdAt",
      messages: "id, conversationId, timestamp, hasLinks, mediaType, [conversationId+timestamp]",
      bookmarks: "id, messageId",
    });
  }
}

export const db = new AppDatabase();

function makeId(): string {
  return crypto.randomUUID();
}

export async function listConversations(key: CryptoKey): Promise<DecryptedConversation[]> {
  const rows = await db.conversations.orderBy("createdAt").reverse().toArray();
  const result: DecryptedConversation[] = [];
  for (const row of rows) {
    const count = await db.messages.where("conversationId").equals(row.id).count();
    result.push({
      id: row.id,
      name: await decryptString(key, row.nameEnc),
      isGroup: row.isGroup,
      createdAt: row.createdAt,
      messageCount: count,
    });
  }
  return result;
}

export async function findConversationByName(
  key: CryptoKey,
  name: string
): Promise<ConversationRow | null> {
  const all = await db.conversations.toArray();
  for (const row of all) {
    if ((await decryptString(key, row.nameEnc)) === name) return row;
  }
  return null;
}

export async function importMessages(
  key: CryptoKey,
  conversationName: string,
  isGroup: boolean,
  messages: Array<{
    sender: string;
    content: string;
    timestamp: Date;
    mediaType: string | null;
    hasLinks: boolean;
  }>
): Promise<{ conversationId: string; messageCount: number }> {
  const existing = await findConversationByName(key, conversationName);
  let conversationId: string;
  if (existing) {
    conversationId = existing.id;
    await db.conversations.update(conversationId, { isGroup });
    await db.messages.where("conversationId").equals(conversationId).delete();
  } else {
    conversationId = makeId();
    await db.conversations.add({
      id: conversationId,
      nameEnc: await encryptString(key, conversationName),
      isGroup,
      createdAt: Date.now(),
    });
  }

  const rows: MessageRow[] = [];
  for (const m of messages) {
    rows.push({
      id: makeId(),
      conversationId,
      senderEnc: await encryptString(key, m.sender),
      contentEnc: await encryptString(key, m.content),
      timestamp: m.timestamp.getTime(),
      mediaType: m.mediaType,
      hasLinks: m.hasLinks,
      createdAt: Date.now(),
    });
  }

  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await db.messages.bulkAdd(rows.slice(i, i + CHUNK));
  }

  return { conversationId, messageCount: rows.length };
}

export type MessageFilters = {
  conversationId?: string;
  search?: string;
  hasLinks?: boolean;
  mediaType?: string;
  bookmarked?: boolean;
};

export async function queryMessages(
  key: CryptoKey,
  filters: MessageFilters
): Promise<DecryptedMessage[]> {
  let coll = filters.conversationId
    ? db.messages.where("conversationId").equals(filters.conversationId)
    : db.messages.toCollection();

  if (filters.hasLinks) {
    coll = coll.filter((m) => m.hasLinks === true);
  }
  if (filters.mediaType) {
    coll = coll.filter((m) => m.mediaType === filters.mediaType);
  }

  let rows = await coll.toArray();
  rows.sort((a, b) => b.timestamp - a.timestamp);

  if (filters.bookmarked) {
    const ids = new Set((await db.bookmarks.toArray()).map((b) => b.messageId));
    rows = rows.filter((m) => ids.has(m.id));
  }

  const bookmarksByMsg = new Map<string, BookmarkRow>();
  for (const b of await db.bookmarks.toArray()) bookmarksByMsg.set(b.messageId, b);

  const convMap = new Map<string, { name: string; isGroup: boolean }>();
  for (const c of await db.conversations.toArray()) {
    convMap.set(c.id, {
      name: await decryptString(key, c.nameEnc),
      isGroup: c.isGroup,
    });
  }

  const decrypted: DecryptedMessage[] = [];
  const searchLower = filters.search?.toLowerCase();
  for (const row of rows) {
    const content = await decryptString(key, row.contentEnc);
    if (searchLower && !content.toLowerCase().includes(searchLower)) continue;
    const bookmark = bookmarksByMsg.get(row.id);
    const conv = convMap.get(row.conversationId);
    decrypted.push({
      id: row.id,
      conversationId: row.conversationId,
      conversationName: conv?.name ?? "Unknown",
      conversationIsGroup: conv?.isGroup ?? false,
      sender: await decryptString(key, row.senderEnc),
      content,
      timestamp: row.timestamp,
      mediaType: row.mediaType,
      hasLinks: row.hasLinks,
      createdAt: row.createdAt,
      bookmark: bookmark
        ? {
            id: bookmark.id,
            note: bookmark.noteEnc ? await decryptString(key, bookmark.noteEnc) : null,
          }
        : null,
    });
  }
  return decrypted;
}

export async function setBookmark(key: CryptoKey, messageId: string, note?: string) {
  const existing = await db.bookmarks.where("messageId").equals(messageId).first();
  if (existing) {
    await db.bookmarks.update(existing.id, {
      noteEnc: note ? await encryptString(key, note) : null,
    });
    return;
  }
  await db.bookmarks.add({
    id: makeId(),
    messageId,
    noteEnc: note ? await encryptString(key, note) : null,
    createdAt: Date.now(),
  });
}

export async function removeBookmark(messageId: string) {
  await db.bookmarks.where("messageId").equals(messageId).delete();
}

export async function wipeAll() {
  await db.transaction("rw", db.conversations, db.messages, db.bookmarks, async () => {
    await db.conversations.clear();
    await db.messages.clear();
    await db.bookmarks.clear();
  });
}
