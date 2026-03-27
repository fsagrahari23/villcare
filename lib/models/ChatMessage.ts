import mongoose, { Schema } from "mongoose";

const chatMessageSchema = new Schema(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        messageType: {
            type: String,
            enum: ["user", "ai", "system"],
            default: "user",
        },
        content: {
            type: String,
            required: true,
        },
        usesContext: {
            type: Boolean,
            default: true,
        },
        contextData: {
            previousCases: [String],
            medicalHistory: [String],
            recommendations: [String],
        },
        responseTime: Number,
        modelUsed: {
            type: String,
            enum: ["gemini", "llm"],
            default: "gemini",
        },
        sentiment: String,
        intent: String,
        isVoiceMessage: {
            type: Boolean,
            default: false,
        },
        voiceUrl: String,
        transcription: String,
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: Date,
    },
    { timestamps: true }
);

chatMessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.models.ChatMessage ||
    mongoose.model("ChatMessage", chatMessageSchema);