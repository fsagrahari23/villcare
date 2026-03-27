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

    const voiceCheckupsCount = await SymptomAnalysis.countDocuments({ userId })
    const reportsCount = await MedicalReport.countDocuments({ userId })
    
    // Latest analysis for risk level
    const latestAnalysis = await SymptomAnalysis.findOne({ userId }).sort({ createdAt: -1 })
    const actualRiskLevel = latestAnalysis?.analysis?.riskLevel || 'low'

    // Simple health score calculation: 
    // Start at 100, -10 if high risk, -5 if med risk, +5 per report (max 20), +2 per checkup (max 10)
    let healthScore = 80 // Default
    if (actualRiskLevel === 'high') healthScore -= 20
    else if (actualRiskLevel === 'medium') healthScore -= 10
    else healthScore += 5

    healthScore += Math.min(reportsCount * 5, 20)
    healthScore += Math.min(voiceCheckupsCount * 2, 10)
    healthScore = Math.min(Math.max(healthScore, 0), 100)

    return NextResponse.json({
      voiceCheckups: voiceCheckupsCount,
      medicalReports: reportsCount,
      riskLevel: actualRiskLevel,
      healthScore
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch stats", details: error.message }, { status: 500 })
  }
}
