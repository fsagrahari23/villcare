import mongoose from "mongoose";

const consultationSchema = new mongoose.Schema(
  {
    roomID: {
      type: String,
      required: true,
      unique: true,
    },

    // ✅ Only these tokens
    doctorToken: String,
    patientToken: String,

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },

    // ✅ Use STRING (important)
    doctorUserId: String,
    patientId: String,

    doctorName: String,
    patientName: String,

    healthCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HealthCenter",
    },

    callType: {
      type: String,
      enum: ["video", "voice"],
      default: "video",
    },

    status: {
      type: String,
      enum: ["requested", "active", "completed", "cancelled"],
      default: "requested",
    },

    symptoms: [String],
    recommendations: [String],
    suggestedAction: String,
    notes: String,
  },
  { timestamps: true },
);
consultationSchema.index({ doctorUserId: 1, createdAt: -1 });
consultationSchema.index({ patientId: 1, createdAt: -1 });

export default mongoose.models.Consultation ||
  mongoose.model("Consultation", consultationSchema);
