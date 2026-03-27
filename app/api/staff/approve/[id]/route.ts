import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import HealthCenter from "@/lib/models/HealthCenter";
import ApprovalLog from "@/lib/models/ApprovalLog";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const { staffId } = await request.json();
    if (!staffId) {
      return NextResponse.json(
        { message: "Staff ID is required for approval" },
        { status: 400 },
      );
    }

    // Update HealthCenter status
    const hospital = await HealthCenter.findByIdAndUpdate(
      id,
      {
        status: "approved",
        approvedBy: staffId,
        approvedAt: new Date(),
      },
      { new: true },
    );

    if (!hospital) {
      return NextResponse.json(
        { message: "Hospital not found" },
        { status: 404 },
      );
    }

    // Create ApprovalLog
    await ApprovalLog.create({
      healthCenterId: id,
      staffId: staffId,
      statusBefore: "pending",
      statusAfter: "approved",
      isVerified: true,
      verificationNotes: "Approved via staff administrative panel",
    });

    return NextResponse.json({
      success: true,
      message: `Hospital ${hospital.name} approved successfully`,
      approvalDate: hospital.approvedAt,
    });
  } catch (error: any) {
    console.error("Approval error:", error);
    return NextResponse.json(
      { message: "Approval failed", details: error.message },
      { status: 500 },
    );
  }
}
