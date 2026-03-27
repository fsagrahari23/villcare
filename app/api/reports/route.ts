import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from "@/lib/db"
import MedicalReport from "@/lib/models/MedicalReport"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    await connectDB()

    const reports = await MedicalReport.find({ userId }).sort({ createdAt: -1 })
    
    return NextResponse.json(reports)
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch reports", details: error.message }, { status: 500 })
  }
}
