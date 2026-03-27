import { NextRequest, NextResponse } from "next/server";
import { SarvamAIClient } from "sarvamai";
import fs from "fs";
import path from "path";
import os from "os";

const client = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio_file") as File;
    const language = (formData.get("language_code") as string) || "en-IN";

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Convert the File/Blob to a temporary file because the SDK expects a ReadStream
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const tempFilePath = path.join(os.tmpdir(), `recording-${Date.now()}.webm`);
    fs.writeFileSync(tempFilePath, buffer);

    const audioStream = fs.createReadStream(tempFilePath);

    const response = await client.speechToText.transcribe({
      file: audioStream,
      model: "saaras:v3",
      mode: "transcribe",
      language_code: language as any,
    });

    // Cleanup temp file
    try {
      fs.unlinkSync(tempFilePath);
    } catch (cleanupErr) {
      console.warn("Could not delete temp file:", cleanupErr);
    }

    // The SDK response format might vary, but we expect the transcript
    return NextResponse.json({ 
      transcript: response.transcript || (response as any).text || "" 
    });

  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Transcription failed", details: error.message },
      { status: 500 }
    );
  }
}
