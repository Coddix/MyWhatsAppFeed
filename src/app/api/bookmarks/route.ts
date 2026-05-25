import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const bookmarks = await prisma.bookmark.findMany({
    include: {
      message: {
        include: {
          conversation: { select: { id: true, name: true, isGroup: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(bookmarks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messageId, note } = body as { messageId: string; note?: string };

  if (!messageId) {
    return NextResponse.json({ error: "messageId required" }, { status: 400 });
  }

  const bookmark = await prisma.bookmark.upsert({
    where: { messageId },
    update: { note: note ?? null },
    create: { messageId, note: note ?? null },
  });

  return NextResponse.json(bookmark);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get("messageId");
  if (!messageId) {
    return NextResponse.json({ error: "messageId required" }, { status: 400 });
  }

  await prisma.bookmark.deleteMany({ where: { messageId } });
  return NextResponse.json({ success: true });
}
