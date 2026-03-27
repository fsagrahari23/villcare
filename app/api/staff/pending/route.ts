import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from "@/lib/db"
import HealthCenter from "@/lib/models/HealthCenter"

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const pendingHospitals = await HealthCenter.find({ status: 'pending' }).sort({ createdAt: -1 })
    
    return NextResponse.json(pendingHospitals)
  } catch (error: any) {
    console.error("Fetch pending error:", error)
    return NextResponse.json(
      { message: 'Failed to fetch pending applications', details: error.message },
      { status: 500 }
    )
  }
}
