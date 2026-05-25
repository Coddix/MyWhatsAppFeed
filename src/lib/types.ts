export type ConversationSummary = {
  id: string;
  name: string;
  isGroup: boolean;
  messageCount: number;
};

export type MessageWithRelations = {
  id: string;
  conversationId: string;
  sender: string;
  content: string;
  timestamp: string;
  mediaType: string | null;
  hasLinks: boolean;
  createdAt: string;
  bookmark: { id: string; note: string | null } | null;
  conversation: { id: string; name: string; isGroup: boolean };
};

export type MessagesResponse = {
  messages: MessageWithRelations[];
  nextCursor: string | null;
};

export type OgMetadata = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  publisher?: string;
};
