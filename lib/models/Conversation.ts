import mongoose, { Schema } from "mongoose";

const conversationSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            default: "New Chat",
        },
        chatMode: {
            type: String,
            enum: ["general", "medical"],
            default: "general",
        },
        status: {
            type: String,
            enum: ["active", "archived", "deleted"],
            default: "active",
            index: true,
        },
        pinned: {
            type: Boolean,
            default: false,
        },
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: "ChatMessage",
        },
        lastOpenedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        metadata: {
            type: Map,
            of: String,
        },
    },
    { timestamps: true }
);

conversationSchema.index({ userId: 1, pinned: -1, lastOpenedAt: -1 });

export default mongoose.models.Conversation ||
    mongoose.model("Conversation", conversationSchema);