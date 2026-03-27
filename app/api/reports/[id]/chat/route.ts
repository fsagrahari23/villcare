import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import MedicalReport from '@/lib/models/MedicalReport'
import { Pinecone } from '@pinecone-database/pinecone'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleGenAI } from '@google/genai'

export const runtime = 'nodejs'

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || '' })
const pineconeIndex = pc.index('quickstart')
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { question } = await request.json()

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    await connectDB()
    const report = await MedicalReport.findById(id)
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // 1. Retrieve relevant chunks from Pinecone using LangChain similarity search
    let ragContext = ''
    if (report.pineconeDocId) {
      try {
        // Generate embedding for the question
        const resp = await ai.models.embedContent({
          model: 'gemini-embedding-001',
          contents: question,
        });

        const queryEmbedding = resp.embeddings?.[0]?.values;

        if (queryEmbedding && queryEmbedding.length > 0) {
          // Query Pinecone natively
          const queryResponse = await pineconeIndex.namespace(report.pineconeDocId).query({
            vector: queryEmbedding,
            topK: 4,
            includeMetadata: true,
          });

          ragContext = queryResponse.matches
            .filter((m) => (m.score || 0) > 0.5)
            .map((m) => m.metadata?.text)
            .join('\n\n');
        }
      } catch (err) {
        console.error('Pinecone retrieval failed:', err)
      }
    }

    // 2. Build structured context from DB schema fields
    const structuredContext = `
REPORT: ${report.testName || report.title || 'Unknown'}
TYPE: ${report.reportType}
TEST DATE: ${report.testDate ? new Date(report.testDate).toLocaleDateString() : 'N/A'}
REPORT DATE: ${report.reportDate ? new Date(report.reportDate).toLocaleDateString() : 'N/A'}
HOSPITAL: ${report.hospitalName || 'N/A'}
DOCTOR: ${report.doctorName || 'N/A'}
FINDINGS: ${report.analysis?.findings || 'None'}
NORMAL VALUES: ${(report.analysis?.normalValues || []).join(', ') || 'None'}
ABNORMAL VALUES: ${(report.analysis?.abnormalValues || []).join(', ') || 'None'}
RISK FACTORS: ${(report.analysis?.riskFactors || []).join(', ') || 'None'}
NOTES: ${report.notes || 'None'}
`.trim()

    // 3. Combine: RAG chunks (if any) + structured summary
    const fullContext = ragContext
      ? `--- Retrieved Report Chunks ---\n${ragContext}\n\n--- Structured Summary ---\n${structuredContext}`
      : structuredContext

    // 4. Generate answer with Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const prompt = `You are a knowledgeable and empathetic medical AI assistant.
Use the provided medical report context to answer the patient's question accurately.
If the information isn't in the context, say so clearly rather than guessing.
Always recommend consulting a doctor for medical decisions.

CONTEXT:
${fullContext}

PATIENT QUESTION: ${question}

Provide a clear, helpful, structured answer. If values are abnormal, explain what they might mean.`

    const result = await model.generateContent(prompt)
    const answer = result.response.text()

    return NextResponse.json({
      answer,
      sources: {
        ragChunks: ragContext ? ragContext.split('\n\n').length : 0,
        structuredContext: true,
        namespace: report.pineconeDocId || null,
      },
    })
  } catch (error: any) {
    console.error('RAG chat error:', error)
    return NextResponse.json({ error: 'Chat failed', details: error.message }, { status: 500 })
  }
}
