import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'
import HealthCenter from '@/lib/models/HealthCenter'
import Doctor from '@/lib/models/Doctor'

async function getCenterForUser(userId: string) {
  const user: any = await User.findById(userId).lean()
  if (!user) return null

  const center = await HealthCenter.findOne({
    $or: [
      { ownerUserId: userId },
      { _id: user.healthCenterId || null },
    ],
  }).lean()

  if (!center) return null

  return { user, center }
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const healthCenterId = searchParams.get('healthCenterId')

    if (!userId && !healthCenterId) {
      return NextResponse.json({ error: 'User ID or health center ID required' }, { status: 400 })
    }

    await connectDB()

    let centerId = healthCenterId
    if (!centerId && userId) {
      const context = await getCenterForUser(userId)
      if (!context) {
        return NextResponse.json({ error: 'Health center not found' }, { status: 404 })
      }
      centerId = String(context.center._id)
    }

    const doctors = await Doctor.find({ healthCenterId: centerId }).sort({ createdAt: -1 }).lean()
    return NextResponse.json(doctors)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch doctors', details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    const { userId, name, specialization, email, phone, portalPassword } = body

    if (!userId || !name || !specialization || !email || !phone || !portalPassword) {
      return NextResponse.json({ error: 'Missing required doctor fields' }, { status: 400 })
    }

    if (String(portalPassword).length < 8) {
      return NextResponse.json({ error: 'Doctor login password must be at least 8 characters' }, { status: 400 })
    }

    const context = await getCenterForUser(userId)
    if (!context) {
      return NextResponse.json({ error: 'Health center not found' }, { status: 404 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const existingUser: any = await User.findOne({ email: normalizedEmail })
    if (existingUser && existingUser.role !== 'doctor') {
      return NextResponse.json({ error: 'This email is already used by a different account role' }, { status: 400 })
    }

    const existingDoctorWithEmail = await Doctor.findOne({ email: normalizedEmail }).lean()
    if (
      existingDoctorWithEmail &&
      String(existingDoctorWithEmail.healthCenterId || '') !== String(context.center._id)
    ) {
      return NextResponse.json({ error: 'This doctor email is already linked to another health center' }, { status: 400 })
    }
    if (existingDoctorWithEmail) {
      return NextResponse.json({ error: 'A doctor profile already exists for this email in your health center' }, { status: 400 })
    }

    let doctorUser = existingUser
    if (!doctorUser) {
      doctorUser = await User.create({
        name,
        email: normalizedEmail,
        phone,
        password: portalPassword,
        role: 'doctor',
        healthCenterId: context.center._id,
        assignedHealthCenter: context.center._id,
        specialization,
      })
    }

    const doctor = await Doctor.create({
      healthCenterId: context.center._id,
      userId: doctorUser._id,
      name,
      email: normalizedEmail,
      phone,
      specialization,
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
    })

    doctorUser.name = name
    doctorUser.phone = phone
    doctorUser.role = 'doctor'
    doctorUser.healthCenterId = context.center._id
    doctorUser.assignedHealthCenter = context.center._id
    doctorUser.doctorProfileId = doctor._id
    doctorUser.specialization = specialization
    await doctorUser.save()

    return NextResponse.json({
      success: true,
      doctor,
      doctorUser: {
        id: doctorUser._id,
        email: doctorUser.email,
        role: doctorUser.role,
      },
      message: 'Doctor added and login access created successfully',
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create doctor', details: error.message }, { status: 500 })
  }
}
