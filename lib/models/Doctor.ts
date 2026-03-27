import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
    {
        healthCenterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HealthCenter',
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            sparse: true,
        },
        name: {
            type: String,
            required: true,
        },
        email: String,
        phone: String,
        specialization: {
            type: String,
            required: true,
        },
        qualifications: [String],
        experienceYears: {
            type: Number,
            default: 0,
        },
        diseasesHandled: [String],
        careNeeds: [String],
        languages: [String],
        availableModes: {
            type: [String],
            enum: ['in_person', 'video', 'voice'],
            default: ['in_person'],
        },
        availability: {
            monday: String,
            tuesday: String,
            wednesday: String,
            thursday: String,
            friday: String,
            saturday: String,
            sunday: String,
        },
        consultationFee: Number,
        imageUrl: String,
        isAvailable: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

doctorSchema.index({ specialization: 1 });
doctorSchema.index({ diseasesHandled: 1 });
doctorSchema.index({ careNeeds: 1 });

export default mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema);
