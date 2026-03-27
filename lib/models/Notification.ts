import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        // Recommendation data
        recommendationData: {
            diet: [String],
            medicines: [String],
            lifestyle: [String],
            baseSource: String,
        },

        // Action link
        actionUrl: String,
        actionLabel: String,

        // Status
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: Date,

        // Delivery methods
        sentViaEmail: {
            type: Boolean,
            default: false,
        },
        sentViaSMS: {
            type: Boolean,
            default: false,
        },
        sentViaPush: {
            type: Boolean,
            default: false,
        },

        // Priority
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
        },

        // Expiration
        expiresAt: Date,
    },
    { timestamps: true }
);

// Auto-delete expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
