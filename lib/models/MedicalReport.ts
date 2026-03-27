import mongoose from 'mongoose';

const medicalReportSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // Report details
        reportType: {
            type: String,
            enum: ['blood_test', 'xray', 'ultrasound', 'ct_scan', 'prescription', 'Other'],
            required: true,
        },

        testName: String,

        // File upload
        fileUrl: {
            type: String,
            required: true,
        },
        fileName: String,
        fileSize: Number,
        fileType: String,

        ocrStatus: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending',
        },

        // Analysis
        analysis: {
            findings: String,
            normalValues: [String],
            abnormalValues: [String],
            riskFactors: [String],
        },

        // Metadata
        hospitalName: String,
        doctorName: String,
        assignedDoctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor',
        },
        doctorUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        doctorNotes: String,
        doctorSummary: String,
        testDate: Date,
        reportDate: Date,

        // Status
        isVerified: {
            type: Boolean,
            default: false,
        },
        verifiedBy: mongoose.Schema.Types.ObjectId,

        // Privacy
        isPrivate: {
            type: Boolean,
            default: true,
        },

        tags: [String],
        notes: String,
        pineconeDocId: String,
    },
    { timestamps: true }
);

export default mongoose.models.MedicalReport || mongoose.model('MedicalReport', medicalReportSchema);
