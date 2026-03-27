import { NextRequest, NextResponse } from "next/server";
import { SarvamAIClient } from "sarvamai";

export async function POST(request: NextRequest) {
  try {
    const { text, language } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const client = new SarvamAIClient({
      apiSubscriptionKey: process.env.SARVAM_API_KEY || "",
    });

    // Step 1: Translate the analysis text to the target language
    // Using source_language_code: "auto" as requested
    const translationResponse = await client.text.translate({
      input: text,
      source_language_code: "auto",
      target_language_code: language || "en-IN",
      speaker_gender: "Female",
    });

    const translatedText = translationResponse.translated_text;

    if (!translatedText) {
      throw new Error("Translation failed to return text");
    }

    // Step 2: Convert the translated text to speech
    const ttsResponse = await client.textToSpeech.convert({
      text: translatedText,
      target_language_code: language || "en-IN",
    });

    // The SDK returns the audio content in the response (usually base64)
    // We assume the first audio in the response is the one we want
    const audioData = Array.isArray(ttsResponse.audios) ? ttsResponse.audios[0] : (ttsResponse as any).audioContent;

    return NextResponse.json({
      audioContent: audioData,
      translatedText: translatedText
    });
  } catch (error: any) {
    console.error("Synthesis/Translation error:", error);
    return NextResponse.json(
      { error: "Process failed", details: error.message },
      { status: 500 }
    );
  }
}
