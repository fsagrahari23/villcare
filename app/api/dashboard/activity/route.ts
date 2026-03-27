import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from "@/lib/db"
import SymptomAnalysis from "@/lib/models/SymptomAnalysis"
import MedicalReport from "@/lib/models/MedicalReport"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    await connectDB()

    const analyses = await SymptomAnalysis.find({ userId }).sort({ createdAt: -1 }).limit(5).lean()
    const reports = await MedicalReport.find({ userId }).sort({ createdAt: -1 }).limit(5).lean()

    const activities = [
      ...analyses.map(a => ({
        id: (a as any)._id,
        date: new Date((a as any).createdAt).toLocaleDateString(),
        action: 'Voice checkup recorded',
        status: 'Analyzed',
        type: 'voice'
      })),
      ...reports.map(r => ({
        id: (r as any)._id,
        date: new Date((r as any).createdAt).toLocaleDateString(),
        action: 'Medical report uploaded',
        status: 'Processed',
        type: 'report'
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

    return NextResponse.json(activities)
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch activity", details: error.message }, { status: 500 })
  }
}
