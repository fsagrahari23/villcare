import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'
import HealthCenter from '@/lib/models/HealthCenter'
import Doctor from '@/lib/models/Doctor'

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
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const center = await HealthCenter.findOne({
      $or: [
        { ownerUserId: userId },
        { _id: user.healthCenterId || null },
      ],
    }).lean()

    if (!center) {
      return NextResponse.json({ error: 'Health center not found' }, { status: 404 })
    }

    const doctors = await Doctor.find({ healthCenterId: center._id }).sort({ createdAt: -1 }).lean()

    return NextResponse.json({
      user,
      center,
      doctors,
    })
  } catch (error: any) {
    console.error('Health center profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch health center profile', details: error.message },
      { status: 500 }
    )
  }
}
