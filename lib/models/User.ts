import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        phone: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['patient', 'staff', 'admin', 'healthcenter'],
            default: 'patient',
        },
        // Patient specific fields
        dateOfBirth: String,
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
        },
        address: String,
        city: String,
        state: String,
        zipCode: String,

        // Location fields
        latitude: Number,
        longitude: Number,

        // Medical history
        bloodType: String,
        allergies: [String],
        medications: [String],
        chronicDiseases: [String],

        // Staff specific fields
        staffId: String,
        assignedHealthCenter: mongoose.Schema.Types.ObjectId,
        departmentName: String,
        healthCenterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HealthCenter',
        },

        // Profile
        profilePhoto: String,
        bio: String,

        // Preferences
        language: {
            type: String,
            enum: ['en', 'hi', 'ta'],
            default: 'en',
        },
        notificationPreferences: {
            emailNotifications: { type: Boolean, default: true },
            smsNotifications: { type: Boolean, default: true },
            pushNotifications: { type: Boolean, default: true },
        },

        // Status
        isActive: {
            type: Boolean,
            default: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationToken: String,

        // Family linking (bonus feature)
        familyMembers: [
            {
                userId: mongoose.Schema.Types.ObjectId,
                relationship: String,
                addedAt: Date,
            },
        ],
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (this: any) {
    if (!this.isModified('password')) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw error;
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from response
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.verificationToken;
    return user;
};

export default mongoose.models.User || mongoose.model('User', userSchema);
