import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'
import HealthCenter from '@/lib/models/HealthCenter'
import Doctor from '@/lib/models/Doctor'

async function canManageDoctor(userId: string, doctorId: string) {
  const user: any = await User.findById(userId).lean()
  if (!user) return null

  const doctor: any = await Doctor.findById(doctorId).lean()
  if (!doctor) return null

  const center = await HealthCenter.findOne({
    _id: doctor.healthCenterId,
    $or: [
      { ownerUserId: userId },
      { _id: user.healthCenterId || null },
    ],
  }).lean()

  if (!center) return null
  return { user, center, doctor }
}

function parseList(value: unknown) {
  if (!value) return []
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const body = await request.json()

    if (!body.userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const context = await canManageDoctor(body.userId, id)
    if (!context) {
      return NextResponse.json({ error: 'Doctor not found or access denied' }, { status: 404 })
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      id,
      {
        name: body.name,
        email: body.email,
        phone: body.phone,
        specialization: body.specialization,
        qualifications: parseList(body.qualifications),
        experienceYears: Number(body.experienceYears || 0),
        diseasesHandled: parseList(body.diseasesHandled),
        careNeeds: parseList(body.careNeeds),
        languages: parseList(body.languages),
        availableModes: Array.isArray(body.availableModes) && body.availableModes.length > 0
          ? body.availableModes
          : ['in_person'],
        availability: body.availability || {},
        consultationFee: body.consultationFee ? Number(body.consultationFee) : undefined,
        imageUrl: body.imageUrl || '',
        isAvailable: body.isAvailable !== false,
      },
      { new: true }
    )

    return NextResponse.json({ success: true, doctor: updatedDoctor })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update doctor', details: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const context = await canManageDoctor(userId, id)
    if (!context) {
      return NextResponse.json({ error: 'Doctor not found or access denied' }, { status: 404 })
    }

    await Doctor.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete doctor', details: error.message }, { status: 500 })
  }
}
