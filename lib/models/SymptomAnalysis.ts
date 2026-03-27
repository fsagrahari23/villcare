import mongoose from 'mongoose';

const symptomAnalysisSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false, // Optional for guests
        },
        originalTranscript: {
            type: String,
            required: true,
        },
        englishTranscript: {
            type: String,
            required: true,
        },
        languageCode: {
            type: String,
            default: 'en-IN',
        },
        analysis: {
            riskLevel: {
                type: String,
                enum: ['low', 'medium', 'high'],
                required: true,
            },
            symptoms: [String],
            recommendations: [String],
            suggestedAction: String,
            emergencyCare: String,
        },
        location: {
            latitude: Number,
            longitude: Number,
        },
        status: {
            type: String,
            enum: ['pending', 'reviewed', 'resolved'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

export default mongoose.models.SymptomAnalysis || mongoose.model('SymptomAnalysis', symptomAnalysisSchema);
