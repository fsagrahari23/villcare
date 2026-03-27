import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from "@/lib/db"
import HealthCenter from "@/lib/models/HealthCenter"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const [pending, approved, rejected] = await Promise.all([
      HealthCenter.countDocuments({ status: 'pending' }),
      HealthCenter.countDocuments({ status: 'approved' }),
      HealthCenter.countDocuments({ status: 'rejected' })
    ])

    const total = pending + approved + rejected
    const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : "0.0"

    return NextResponse.json({
      pending,
      approved,
      rejected,
      approvalRate: parseFloat(approvalRate)
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch staff stats", details: error.message }, { status: 500 })
  }
}
