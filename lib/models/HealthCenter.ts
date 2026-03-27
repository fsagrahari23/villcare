import mongoose from "mongoose";

const healthCenterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["hospital", "uhc", "clinic"],
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    website: String,

    // Address
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zipCode: String,

    // Location coordinates
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },

    // Registration details
    registrationNumber: String,
    licenseNumber: String,
    licenseExpiry: Date,
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    imageUrl: String,
    imageCloudinaryId: String,

    // Documents
    documents: [
      {
        type: {
          type: String, // 👈 FIX (nested type)
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        publicId: {
          type: String,
        },
      },
    ],

    // Approval status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: mongoose.Schema.Types.ObjectId, // User ID of staff who approved
    approvedAt: Date,
    rejectionReason: String,

    // Contact person
    contactPersonName: String,
    contactPersonRole: String,
    contactPersonPhone: String,

    // Specializations
    specializations: [String],

    // Services offered
    services: [String],
    requiredNeeds: [String],

    // Operating hours
    operatingHours: {
      monday: String,
      tuesday: String,
      wednesday: String,
      thursday: String,
      friday: String,
      saturday: String,
      sunday: String,
    },

    // Rating & reviews (bonus feature)
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },

    // Approval notes
    approvalNotes: String,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Index for geospatial queries
healthCenterSchema.index({ latitude: 1, longitude: 1 });
healthCenterSchema.index({ ownerUserId: 1 });

export default mongoose.models.HealthCenter ||
  mongoose.model("HealthCenter", healthCenterSchema);
