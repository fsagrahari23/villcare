import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from "@/lib/db"
import MedicalReport from "@/lib/models/MedicalReport"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDB()
    const report = await MedicalReport.findById(id)
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }
    return NextResponse.json(report)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch report', details: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDB()

    const report = await MedicalReport.findById(id)
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    if (report.cloudinaryId) {
      await cloudinary.uploader.destroy(report.cloudinaryId)
    }

    await MedicalReport.findByIdAndDelete(id)

    return NextResponse.json({ success: true, message: "Report deleted successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete report", details: error.message }, { status: 500 })
  }
}
