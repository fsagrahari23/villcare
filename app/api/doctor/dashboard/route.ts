import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'
import Doctor from '@/lib/models/Doctor'
import Consultation from '@/lib/models/Consultation'
import MedicalReport from '@/lib/models/MedicalReport'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    await connectDB()

    const user: any = await User.findById(userId).lean()
    if (!user) {
      return NextResponse.json({ error: 'Doctor user not found' }, { status: 404 })
    }

    const doctor = await Doctor.findOne({
      $or: [
        { userId },
        { _id: user.doctorProfileId || null },
        { email: user.email },
      ],
    }).lean()

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }

    const consultations = await Consultation.find({
      $or: [
        { doctorUserId: userId },
        { doctorId: doctor._id },
      ],
    }).sort({ createdAt: -1 }).lean()

    const patientIds = consultations
      .map((consultation: any) => consultation.patientId)
      .filter(Boolean)

    const reports = await MedicalReport.find({
      $or: [
        { assignedDoctorId: doctor._id },
        { doctorUserId: userId },
        ...(patientIds.length > 0 ? [{ userId: { $in: patientIds } }] : []),
      ],
    }).sort({ createdAt: -1 }).lean()

    return NextResponse.json({
      user,
      doctor,
      consultations,
      reports,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch doctor dashboard', details: error.message },
      { status: 500 }
    )
  }
}
