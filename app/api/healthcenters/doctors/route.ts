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
    const { userId, name, specialization } = body

    if (!userId || !name || !specialization) {
      return NextResponse.json({ error: 'Missing required doctor fields' }, { status: 400 })
    }

    const context = await getCenterForUser(userId)
    if (!context) {
      return NextResponse.json({ error: 'Health center not found' }, { status: 404 })
    }

    const doctor = await Doctor.create({
      healthCenterId: context.center._id,
      name,
      email: body.email || '',
      phone: body.phone || '',
      specialization,
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
    })

    return NextResponse.json({ success: true, doctor })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create doctor', details: error.message }, { status: 500 })
  }
}
