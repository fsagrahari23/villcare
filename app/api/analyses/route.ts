import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SymptomAnalysis from "@/lib/models/SymptomAnalysis";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    await connectDB();

    const analyses = await SymptomAnalysis.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(analyses);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch symptom analyses", details: error.message },
      { status: 500 },
    );
  }
}
