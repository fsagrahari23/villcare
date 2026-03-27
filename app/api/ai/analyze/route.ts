import { GoogleGenerativeAI } from "@google/generative-ai"
import { SarvamAIClient } from "sarvamai"
import { connectDB } from "@/lib/db"
import SymptomAnalysis from "@/lib/models/SymptomAnalysis"

export async function POST(request: Request) {
  try {
    const { transcript, userId, location } = await request.json()
    if (!transcript) {
      return Response.json({ error: "No transcript provided" }, { status: 400 })
    }

    await connectDB()

    const sarvamClient = new SarvamAIClient({
      apiSubscriptionKey: process.env.SARVAM_API_KEY || "",
    })

    // Pre-process: Translate the transcript to English for better Gemini analysis
    let englishTranscript = transcript
    try {
      const translationRes = await sarvamClient.text.translate({
        input: transcript,
        source_language_code: "auto",
        target_language_code: "en-IN",
      })
      if (translationRes?.translated_text) {
        englishTranscript = translationRes.translated_text
      }
    } catch (err) {
      console.warn("Translation to English failed, falling back to original transcript:", err)
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    })

    const prompt = `As a medical professional, analyze these symptoms and provide:
    1. Identified symptoms (list)
    2. Risk level (one of: "low", "medium", "high")
    3. Recommendations (at least 3 items)
    4. Suggested action
    5. When to seek emergency care
    6. Likely doctor specialties to consult
    7. Search keywords for nearby health centers and doctors

    Symptoms: ${englishTranscript}

    Respond strictly in JSON format matching this structure:
    {
      "symptoms": ["symptom1", "symptom2"],
      "riskLevel": "high/medium/low",
      "recommendations": ["rec1", "rec2", "rec3"],
      "suggestedAction": "text",
      "emergencyCare": "text",
      "careSpecialties": ["general physician", "pulmonologist"],
      "diseaseKeywords": ["fever", "cough"]
    }`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    if (!text) {
      throw new Error("Empty response from AI")
    }

    const analysisResult = JSON.parse(text)
    
    // Save to Database
    const savedAnalysis = await SymptomAnalysis.create({
      userId: userId || null,
      originalTranscript: transcript,
      englishTranscript: englishTranscript,
      analysis: analysisResult,
      location: location || null,
    })

    return Response.json({
      ...analysisResult,
      id: savedAnalysis._id,
      originalTranscript: transcript,
      englishTranscript: englishTranscript
    })
  } catch (error: any) {
    console.error("AI Analysis Error:", error)
    return Response.json({ error: "Failed to analyze symptoms", details: error.message }, { status: 500 })
  }
}
