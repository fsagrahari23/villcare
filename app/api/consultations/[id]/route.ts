import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Consultation from '@/lib/models/Consultation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    await connectDB()

    const consultation: any = await Consultation.findById(id).lean()
    if (!consultation) {
      return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
    }

    const doctorUserId = consultation.doctorUserId ? String(consultation.doctorUserId) : ''
    const patientUserId = consultation.patientId ? String(consultation.patientId) : ''
    const isDoctor = Boolean(userId && userId === doctorUserId)
    const isPatient = Boolean(userId && userId === patientUserId)
    const resolvedUserID = isDoctor
      ? doctorUserId
      : isPatient
        ? patientUserId
        : userId || patientUserId || doctorUserId || ''
    const resolvedToken = isDoctor
      ? consultation.doctorToken || ''
      : isPatient
        ? consultation.patientToken || ''
        : consultation.patientToken || consultation.doctorToken || consultation.token || ''

    return NextResponse.json({
      consultation,
      zego: {
        appID: process.env.ZEGOCLOUD_APP_ID ? Number(process.env.ZEGOCLOUD_APP_ID) : 0,
        server: process.env.ZEGOCLOUD_SERVER_URL || '',
        token: resolvedToken,
        userID: resolvedUserID,
        role: isDoctor ? 'doctor' : isPatient ? 'patient' : 'viewer',
        enabled: Boolean(process.env.ZEGOCLOUD_APP_ID && process.env.ZEGOCLOUD_SERVER_URL),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch consultation', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDB()

    const body = await request.json()
    const consultation = await Consultation.findByIdAndUpdate(
      id,
      {
        status: body.status,
        notes: body.notes,
      },
      { new: true }
    )

    return NextResponse.json({ success: true, consultation })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update consultation', details: error.message },
      { status: 500 }
    )
  }
}
