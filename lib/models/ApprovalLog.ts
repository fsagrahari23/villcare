import mongoose from 'mongoose';

const approvalLogSchema = new mongoose.Schema(
    {
        healthCenterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HealthCenter',
            required: true,
        },
        staffId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        documentsReviewed: [String],

        // Status before and after
        statusBefore: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
        },
        statusAfter: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
        },

        // Additional info
        reviewDuration: Number, // minutes
        feedbackToCenter: String,

        // Verification
        isVerified: Boolean,
        verificationNotes: String,
    },
    { timestamps: true }
);

export default mongoose.models.ApprovalLog || mongoose.model('ApprovalLog', approvalLogSchema);
