import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectDB } from "@/lib/db";
import ChatMessage from "@/lib/models/ChatMessage";
import Conversation from "@/lib/models/Conversation";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const GENERAL_PROMPT =
  "You are a helpful general assistant. Answer clearly, concisely, and naturally.";

const MEDICAL_PROMPT =
  "You are a helpful medical assistant. Give safe, general medical information, avoid diagnosis certainty, and always advise a doctor for serious, urgent, or uncertain cases.";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const conversationId = searchParams.get("conversationId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    let conversation: any = null;

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId,
        status: { $ne: "deleted" },
      });
    } else {
      conversation = await Conversation.findOne({
        userId,
        status: { $ne: "deleted" },
      }).sort({ pinned: -1, lastOpenedAt: -1, updatedAt: -1 });
    }

    if (!conversation) {
      return NextResponse.json({
        conversationId: null,
        conversation: null,
        messages: [],
      });
    }

    await Conversation.findByIdAndUpdate(conversation._id, {
      lastOpenedAt: new Date(),
    });

    const messages = await ChatMessage.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });

    return NextResponse.json({
      conversationId: conversation._id,
      conversation,
      messages,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch messages", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { content, userId, conversationId, chatMode } = await request.json();

    if (!content || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let conversation = null;

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId,
        status: { $ne: "deleted" },
      });
    }

    if (!conversation) {
      conversation = await Conversation.create({
        userId,
        title: content.substring(0, 32) || "New Chat",
        chatMode: chatMode || "general",
        lastOpenedAt: new Date(),
      });
    }

    const activeConversationId = conversation._id;

    const userMessage = await ChatMessage.create({
      conversationId: activeConversationId,
      userId,
      messageType: "user",
      content,
    });

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction:
        conversation.chatMode === "medical" ? MEDICAL_PROMPT : GENERAL_PROMPT,
    });

    const historyDocs = await ChatMessage.find({
      conversationId: activeConversationId,
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    const history = historyDocs.reverse().map((m) => ({
      role: m.messageType === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: history.slice(0, -1),
    });

    const result = await chat.sendMessage(content);
    const aiContent = result.response.text();

    const aiMessage = await ChatMessage.create({
      conversationId: activeConversationId,
      userId,
      messageType: "ai",
      content: aiContent,
      modelUsed: "gemini",
    });

    await Conversation.findByIdAndUpdate(activeConversationId, {
      lastMessage: aiMessage._id,
      lastOpenedAt: new Date(),
      title:
        conversation.title === "New Chat"
          ? content.substring(0, 32) || "New Chat"
          : conversation.title,
    });

    return NextResponse.json({
      userMessage,
      aiMessage,
      conversationId: activeConversationId,
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Chat failed", details: error.message },
      { status: 500 }
    );
  }
}