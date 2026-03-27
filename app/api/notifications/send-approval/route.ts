import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import { connectDB } from "@/lib/db";
import Notification from "@/lib/models/Notification";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { hospitalEmail, hospitalName, status, userId } = await request.json();

    if (!hospitalEmail || !hospitalName || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const msg = {
      to: hospitalEmail,
      from: process.env.SENDGRID_FROM_EMAIL || "notifications@voicecare.ai",
      subject: `Hospital Registration ${status}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0066cc;">VoiceCare AI - Hospital Registration ${status}</h2>
          <p>Dear ${hospitalName},</p>
          <p>We are pleased to inform you that your hospital registration has been <strong>${status}</strong>.</p>
          <p>Login to VoiceCare AI to view more details and start using our services.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">This is an automated message. Please do not reply to this email.</p>
        </div>
      `,
    };

    await sgMail.send(msg);

    // Save Notification to Database
    if (userId) {
      await connectDB();
      await Notification.create({
        userId,
        title: `Registration ${status}`,
        message: `Your hospital registration for ${hospitalName} has been ${status}.`,
        sentViaEmail: true,
        priority: status === 'approved' ? 'medium' : 'high'
      });
    }

    return NextResponse.json({ success: true, message: `Notification sent to ${hospitalEmail}` });
  } catch (error: any) {
    console.error("Notification error:", error.response?.body || error.message);
    return NextResponse.json(
      { error: "Notification failed", details: error.response?.body || error.message },
      { status: 500 }
    );
  }
}
