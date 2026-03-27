import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'
import Doctor from '@/lib/models/Doctor'
import MedicalReport from '@/lib/models/MedicalReport'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.userId) {
      return NextResponse.json({ error: 'Doctor user ID required' }, { status: 400 })
    }

    await connectDB()

    const user: any = await User.findById(body.userId).lean()
    if (!user) {
      return NextResponse.json({ error: 'Doctor user not found' }, { status: 404 })
    }

    const doctor: any = await Doctor.findOne({
      $or: [
        { userId: body.userId },
        { _id: user.doctorProfileId || null },
        { email: user.email },
      ],
    }).lean()

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const report = await MedicalReport.findByIdAndUpdate(
      id,
      {
        assignedDoctorId: doctor._id,
        doctorUserId: body.userId,
        doctorName: user.name,
        doctorNotes: body.doctorNotes || '',
        doctorSummary: body.doctorSummary || '',
        isVerified: body.isVerified === true,
        verifiedBy: body.isVerified === true ? body.userId : undefined,
      },
      { new: true }
    )

    return NextResponse.json({ success: true, report })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update report', details: error.message },
      { status: 500 }
    )
  }
}
