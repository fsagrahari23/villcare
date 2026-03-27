import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from "@/lib/db"
import User from "@/lib/models/User"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    await connectDB()
    const user = await User.findById(userId).select('-password')

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch profile", details: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, ...updateData } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    await connectDB()
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password')

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, user })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update profile", details: error.message }, { status: 500 })
  }
}
