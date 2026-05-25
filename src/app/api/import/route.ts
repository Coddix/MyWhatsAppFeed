import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseWhatsAppExport } from "@/lib/parser";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const name = (formData.get("name") as string | null)?.trim();
  const isGroup = formData.get("isGroup") === "true";

  if (!file) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const conversationName = name || file.name.replace(/\.txt$/i, "").replace(/^WhatsApp Chat with\s+/i, "");
  const text = await file.text();
  const parsed = parseWhatsAppExport(text, conversationName, isGroup);

  if (parsed.messages.length === 0) {
    return NextResponse.json({ error: "No messages found. Is this a WhatsApp .txt export?" }, { status: 400 });
  }

  const conversation = await prisma.conversation.upsert({
    where: { name: parsed.conversationName },
    update: { isGroup },
    create: { name: parsed.conversationName, isGroup },
  });

  await prisma.message.deleteMany({ where: { conversationId: conversation.id } });

  const CHUNK = 500;
  for (let i = 0; i < parsed.messages.length; i += CHUNK) {
    const chunk = parsed.messages.slice(i, i + CHUNK).map((m) => ({
      conversationId: conversation.id,
      sender: m.sender,
      content: m.content,
      timestamp: m.timestamp,
      mediaType: m.mediaType,
      hasLinks: m.hasLinks,
    }));
    await prisma.message.createMany({ data: chunk });
  }

  return NextResponse.json({
    conversationId: conversation.id,
    name: conversation.name,
    messageCount: parsed.messages.length,
  });
}
