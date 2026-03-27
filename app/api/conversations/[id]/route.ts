import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Conversation from "@/lib/models/Conversation";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await params;
        const body = await request.json();

        const update: Record<string, any> = {};

        if (body.title !== undefined) update.title = body.title;
        if (body.chatMode !== undefined) update.chatMode = body.chatMode;
        if (body.pinned !== undefined) update.pinned = body.pinned;
        if (body.status !== undefined) update.status = body.status;

        update.lastOpenedAt = new Date();

        const conversation = await Conversation.findByIdAndUpdate(id, update, {
            new: true,
        });

        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(conversation);
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to update conversation", details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { id } = await params;

        const conversation = await Conversation.findByIdAndUpdate(
            id,
            { status: "deleted" },
            { new: true }
        );

        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { error: "Failed to delete conversation", details: error.message },
            { status: 500 }
        );
    }
}