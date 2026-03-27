import mongoose from 'mongoose';

const riskAlertSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        riskType: {
            type: String,
            currentValue: Number,
            unit: String,
        },

        // Recommendations
        recommendations: [String],
        suggestedAction: String,
        requiresImmediateAttention: Boolean,

        // Status
        status: {
            type: String,
            enum: ['active', 'acknowledged', 'resolved'],
            default: 'active',
        },

        acknowledgedAt: Date,
        acknowledgedBy: mongoose.Schema.Types.ObjectId,

        // Follow-up
        followUpDate: Date,
        isFollowedUp: Boolean,

        // Notification sent
        notificationSent: Boolean,
        notificationSentAt: Date,
    },
    { timestamps: true }
);

export default mongoose.models.RiskAlert || mongoose.model('RiskAlert', riskAlertSchema);
