import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");
  const search = searchParams.get("search");
  const hasLinks = searchParams.get("hasLinks");
  const mediaType = searchParams.get("mediaType");
  const bookmarked = searchParams.get("bookmarked");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  const where: Record<string, unknown> = {};
  if (conversationId) where.conversationId = conversationId;
  if (search) where.content = { contains: search };
  if (hasLinks === "true") where.hasLinks = true;
  if (mediaType) where.mediaType = mediaType;
  if (bookmarked === "true") where.bookmark = { isNot: null };

  const messages = await prisma.message.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ timestamp: "desc" }, { id: "desc" }],
    include: {
      bookmark: true,
      conversation: { select: { id: true, name: true, isGroup: true } },
    },
  });

  const hasMore = messages.length > limit;
  const items = hasMore ? messages.slice(0, limit) : messages;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ messages: items, nextCursor });
}
