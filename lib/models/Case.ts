import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // Symptoms
        symptoms: [
            {
                symptom: String,
                severity: {
                    type: String,
                    enum: ['mild', 'moderate', 'severe'],
                },
                duration: String,
            },
        ],

        // AI Analysis from Gemini
        aiAnalysis: {
            assessment: String,
            possibleConditions: [String],
            riskLevel: {
                type: String,
                enum: ['low', 'moderate', 'high'],
            },
            recommendedAction: String,
            requiresImmediateCare: Boolean,
        },

        // Triage results
        triageCategory: {
            type: String,
            enum: ['emergency', 'urgent', 'standard', 'minor'],
        },

        // Voice input
        voiceTranscript: String,
        voiceFilePath: String,

        // Medical reports attached
        attachedReports: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'MedicalReport',
            },
        ],

        // Follow-up actions
        suggestedFollowUp: String,
        recommendedSpecialist: String,

        // Status
        status: {
            type: String,
            enum: ['open', 'closed', 'pending_followup'],
            default: 'open',
        },

        // Doctor assignment (if needed)
        assignedDoctor: mongoose.Schema.Types.ObjectId,

        notes: String,
    },
    { timestamps: true }
);

export default mongoose.models.Case || mongoose.model('Case', caseSchema);
