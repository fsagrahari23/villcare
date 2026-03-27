import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from "@/lib/db"
import HealthCenter from "@/lib/models/HealthCenter"
import ApprovalLog from "@/lib/models/ApprovalLog"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    const { reason = "", staffId } = await request.json()

    if (!staffId) {
      return NextResponse.json(
        { message: 'Staff ID is required for rejection' },
        { status: 400 }
      )
    }

    if (!reason) {
      return NextResponse.json(
        { message: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    // Update HealthCenter status
    const hospital = await HealthCenter.findByIdAndUpdate(
      id,
      { 
        status: 'rejected',
        rejectionReason: reason
      },
      { new: true }
    )

    if (!hospital) {
      return NextResponse.json(
        { message: 'Hospital not found' },
        { status: 404 }
      )
    }

    // Create ApprovalLog
    await ApprovalLog.create({
      healthCenterId: id,
      staffId: staffId,
      statusBefore: 'pending',
      statusAfter: 'rejected',
      feedbackToCenter: reason,
      isVerified: true
    })
    
    return NextResponse.json({
      success: true,
      message: `Hospital ${hospital.name} rejected`,
      reason: reason,
      rejectionDate: new Date()
    })
  } catch (error: any) {
    console.error("Rejection error:", error)
    return NextResponse.json(
      { message: 'Rejection failed', details: error.message },
      { status: 500 }
    )
  }
}
