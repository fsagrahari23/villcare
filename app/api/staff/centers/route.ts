import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from "@/lib/db"
import HealthCenter from "@/lib/models/HealthCenter"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const centers = await HealthCenter.find({}).lean()

    return NextResponse.json(centers.map(c => ({
      id: c._id,
      name: c.name,
      lat: (c as any).latitude,
      lon: (c as any).longitude,
      status: c.status,
      type: (c as any).type.charAt(0).toUpperCase() + (c as any).type.slice(1)
    })))
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch centers", details: error.message }, { status: 500 })
  }
}
