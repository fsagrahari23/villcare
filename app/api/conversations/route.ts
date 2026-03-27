import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Conversation from "@/lib/models/Conversation";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const conversations = await Conversation.find({
      userId,
      status: { $ne: "deleted" },
    })
      .sort({ pinned: -1, lastOpenedAt: -1, updatedAt: -1 })
      .populate("lastMessage")
      .lean();

    return NextResponse.json(conversations);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch conversations", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { userId, title, chatMode } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const conversation = await Conversation.create({
      userId,
      title: title || "New Chat",
      chatMode: chatMode || "general",
      lastOpenedAt: new Date(),
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create conversation", details: error.message },
      { status: 500 }
    );
  }
}