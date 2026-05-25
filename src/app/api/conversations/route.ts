import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const conversations = await prisma.conversation.findMany({
    include: { _count: { select: { messages: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    conversations.map((c) => ({
      id: c.id,
      name: c.name,
      isGroup: c.isGroup,
      messageCount: c._count.messages,
    }))
  );
}
