import { NextRequest, NextResponse } from 'next/server'

function makeRoomId() {
  return `vc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const roomID = body.roomID || makeRoomId()
    const patientName = body.patientName || 'Patient'
    const doctorName = body.doctorName || 'Doctor'

    return NextResponse.json({
      success: true,
      roomID,
      token: process.env.ZEGO_SERVER_ASSIST_TOKEN || '',
      zegoEnabled: Boolean(process.env.NEXT_PUBLIC_ZEGO_APP_ID),
      participants: {
        patientName,
        doctorName,
      },
      message: process.env.NEXT_PUBLIC_ZEGO_APP_ID
        ? 'Consultation room created.'
        : 'Consultation room created. Install and configure Zego SDK keys to enable live calling.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create consultation room', details: error.message },
      { status: 500 }
    )
  }
}
