import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Consultation from "@/lib/models/Consultation";
import Doctor from "@/lib/models/Doctor";
import { generateToken04 } from "./generateToken";

function makeRoomId() {
  return `vc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorUserId = searchParams.get("doctorUserId");
    const patientId = searchParams.get("patientId");

    await connectDB();

    const query: Record<string, string> = {};
    if (doctorUserId) query.doctorUserId = doctorUserId;
    if (patientId) query.patientId = patientId;

    const consultations = await Consultation.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(consultations);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch consultations", details: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const roomID = body.roomID || makeRoomId();
    const doctorName = body.doctorName || "Doctor";
    const patientName = body.patientName || "Patient";
    const doctorId = body.doctorId || null;
    const patientId = body.patientId || null;

    const doctor = doctorId ? await Doctor.findById(doctorId).lean() : null;

    const appID = Number(process.env.ZEGOCLOUD_APP_ID);
    const serverSecret = process.env.ZEGOCLOUD_SERVER_SECRET;

    if (!appID || !serverSecret) {
      return NextResponse.json(
        { error: "Zego config missing (APP_ID or SERVER_SECRET)" },
        { status: 500 },
      );
    }

    // ✅ SAFE USER IDs (VERY IMPORTANT)
    const doctorUserID = doctor?.userId?.toString() || `doctor_${Date.now()}`;
    const patientUserID = patientId?.toString() || `patient_${Date.now()}`;
    console.log("IDSd", doctorUserID, patientUserID);
    // ✅ GENERATE TOKENS
    const doctorToken = generateToken04(
      appID,
      doctorUserID,
      serverSecret,
      3600,
      "",
    );

    const patientToken = generateToken04(
      appID,
      patientUserID,
      serverSecret,
      3600,
      "",
    );
    console.log("token", doctorToken, patientToken);
    if (doctorToken == "" || patientToken === "") {
      console.log("Token does not made sucessfully ");
      return;
    }

    // ✅ SAVE IN DB
    const consultation = await Consultation.create({
      roomID,

      doctorId,
      doctorUserId: doctorUserID,
      doctorName,

      patientId: patientUserID,
      patientName,
      doctorToken,
      patientToken,

      healthCenterId: doctor?.healthCenterId || body.healthCenterId || null,

      callType: body.callType === "voice" ? "voice" : "video",
      status: "requested",

      symptoms: Array.isArray(body.symptoms) ? body.symptoms : [],
      recommendations: Array.isArray(body.recommendations)
        ? body.recommendations
        : [],
      suggestedAction: body.suggestedAction || "",
      notes: body.notes || "",
    });

    // ✅ RESPONSE
    return NextResponse.json({
      success: true,
      consultationId: consultation._id,
      roomID,
      token: patientToken,
      userID: patientUserID,
      zegoEnabled: Boolean(
        process.env.ZEGOCLOUD_APP_ID && process.env.ZEGOCLOUD_SERVER_URL,
      ),

      doctor: {
        userID: doctorUserID,
        token: doctorToken,
        name: doctorName,
      },

      patient: {
        userID: patientUserID,
        token: patientToken,
        name: patientName,
      },

      message: "Consultation room created successfully",
    });
  } catch (error: any) {
    console.error("Consultation error:", error);

    return NextResponse.json(
      {
        error: "Failed to create consultation room",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
