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

function normalizeModes(value: unknown) {
  if (!Array.isArray(value)) return ['in_person']
  const allowed = new Set(['in_person', 'video', 'voice'])
  const modes = value
    .map((item) => String(item).trim())
    .filter((item) => allowed.has(item))
  return modes.length > 0 ? modes : ['in_person']
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

    const normalizedEmail = String(body.email || '').trim().toLowerCase()
    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Doctor email is required' }, { status: 400 })
    }

    const conflictingUser: any = await User.findOne({ email: normalizedEmail })
    if (
      conflictingUser &&
      String(conflictingUser._id) !== String(context.doctor.userId || '') &&
      conflictingUser.role !== 'doctor'
    ) {
      return NextResponse.json({ error: 'This email is already used by another account role' }, { status: 400 })
    }

    const updatedDoctor = await Doctor.findByIdAndUpdate(
      id,
      {
        name: body.name,
        email: normalizedEmail,
        phone: body.phone,
        specialization: body.specialization,
        qualifications: parseList(body.qualifications),
        experienceYears: Number(body.experienceYears || 0),
        diseasesHandled: parseList(body.diseasesHandled),
        careNeeds: parseList(body.careNeeds),
        languages: parseList(body.languages),
        availableModes: normalizeModes(body.availableModes),
        availability: body.availability || {},
        consultationFee: body.consultationFee ? Number(body.consultationFee) : undefined,
        imageUrl: body.imageUrl || '',
        isAvailable: body.isAvailable !== false,
      },
      { new: true }
    )

    let doctorUser: any = null
    if (context.doctor.userId) {
      doctorUser = await User.findById(context.doctor.userId)
    }
    if (!doctorUser && conflictingUser?.role === 'doctor') {
      doctorUser = conflictingUser
    }

    if (doctorUser) {
      doctorUser.name = body.name
      doctorUser.email = normalizedEmail
      doctorUser.phone = body.phone
      doctorUser.role = 'doctor'
      doctorUser.healthCenterId = context.center._id
      doctorUser.assignedHealthCenter = context.center._id
      doctorUser.doctorProfileId = updatedDoctor?._id
      doctorUser.specialization = body.specialization
      if (body.portalPassword && String(body.portalPassword).length >= 8) {
        doctorUser.password = body.portalPassword
      }
      await doctorUser.save()
    }

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

    if (context.doctor.userId) {
      await User.findByIdAndUpdate(context.doctor.userId, {
        $unset: {
          doctorProfileId: 1,
          healthCenterId: 1,
          assignedHealthCenter: 1,
          specialization: 1,
        },
      })
    }

    await Doctor.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete doctor', details: error.message }, { status: 500 })
  }
}
