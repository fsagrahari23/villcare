import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/db";
import MedicalReport from "@/lib/models/MedicalReport";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import PDFParser from "pdf2json";
import { join } from "path";
import { GoogleGenAI } from "@google/genai";


// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Pinecone config
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || "",
});

const indexName = "medical";
const pineconeIndex = pc.index(indexName);



// Gemini model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

async function extractTextFromPdf(file: File): Promise<string> {
  const fileName = uuidv4();
  const tempFilePath = join("/tmp", `${fileName}.pdf`);

  // ✅ convert File → Buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // ✅ write to temp file
  await fs.writeFile(tempFilePath, buffer);

  try {
    const parsedText: string = await new Promise((resolve, reject) => {
      const pdfParser = new (PDFParser as any)(null, 1);

      pdfParser.on("pdfParser_dataError", (errData: any) => {
        reject(errData.parserError);
      });

      pdfParser.on("pdfParser_dataReady", () => {
        const raw = (pdfParser as any).getRawTextContent();

        // ✅ CLEAN TEXT
        const cleaned = raw
          .replace(/Page \(\d+\) Break/g, "")
          .replace(/([a-zA-Z])(\d)/g, "$1 $2")
          .replace(/\s+/g, " ")
          .trim();

        resolve(cleaned);
      });

      pdfParser.loadPDF(tempFilePath);
    });

    return parsedText;

  } finally {
    // ✅ cleanup
    await fs.unlink(tempFilePath).catch(() => { });
  }
}

async function indexInPinecone(
  text: string,
  docId: string,
  metadata: Record<string, string>
) {
  // ✅ Clean text
  const cleanedText = text
    .replace(/Page \(\d+\) Break/g, "")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanedText || cleanedText.length < 20) {
    console.log("⚠️ Text too small → skipping");
    return;
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });

  const docs = await splitter.createDocuments([cleanedText]);

  const validDocs = docs.filter(
    (doc) => doc.pageContent && doc.pageContent.trim().length > 20
  );

  console.log("📄 Valid chunks:", validDocs.length);

  if (validDocs.length === 0) {
    console.log("⚠️ No valid docs");
    return;
  }

  const vectors = [];

  for (const doc of validDocs) {
    try {
      const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: doc.pageContent,
      });

      const embedding = response.embeddings?.[0]?.values;

      if (!embedding || embedding.length === 0) {
        console.log("⚠️ Empty embedding");
        continue;
      }

      vectors.push({
        id: `${docId}_${Math.random()}`,
        values: embedding,
        metadata: {
          text: doc.pageContent,
          ...metadata,
        },
      });

    } catch (err) {
      console.log("❌ Embedding failed:", err);
    }
  }

  console.log("📦 Vectors ready:", vectors.length);

  if (vectors.length === 0) {
    console.log("⚠️ No vectors → skipping Pinecone");
    return;
  }

  await pineconeIndex.upsert({
    records: vectors,
  });

  console.log("✅ Pinecone indexing done");
}
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const userId = (formData.get("userId") as string | null) || null;
    const title =
      ((formData.get("title") as string) || file.name || "Untitled Report").trim();
    const reportType = (formData.get("reportType") as string) || "Other";

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1) Upload to Cloudinary
    const cloudinaryResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "voicecare/reports",
          resource_type: "auto",
        },
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(buffer);
    });

    // 2) Extract raw text (only for PDF, images will rely fully on Gemini)
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    let rawText = "";

    if (isPdf) {
      rawText = await extractTextFromPdf(file);
    }

    // 3) Structured extraction with Gemini
    let extractedData: any = {
      testName: title,
      analysis: {
        findings: "",
        normalValues: [],
        abnormalValues: [],
        riskFactors: [],
      },
      hospitalName: "",
      doctorName: "",
      testDate: null,
      reportDate: null,
    };

    if (rawText.trim().length > 0 || isImage) {
      try {
        // Fallback to gemini-1.5-flash as 2.0-flash causes 429 quota errors in the free tier
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
Analyze this medical report and extract structured information in JSON format.

Return only valid JSON with this exact structure:
{
  "testName": "Name of the test",
  "analysis": {
    "findings": "A concise professional summary",
    "normalValues": ["Normal test results"],
    "abnormalValues": ["Abnormal or concerning values"],
    "riskFactors": ["Identified health risk factors"]
  },
  "hospitalName": "Name of the clinic or hospital",
  "doctorName": "Name of the presiding doctor",
  "testDate": "YYYY-MM-DD",
  "reportDate": "YYYY-MM-DD"
}
`.trim();

        const result = isImage
          ? await model.generateContent([
            prompt,
            {
              inlineData: {
                data: buffer.toString("base64"),
                mimeType: file.type,
              },
            },
          ])
          : await model.generateContent([prompt, rawText]);

        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        console.error("Gemini analysis failed:", err);
      }
    }

    // 4) Chunk + embed + store in Pinecone
    let pineconeDocId = "";
    const textToIndex = [rawText, extractedData.analysis?.findings, extractedData.testName]
    const cleanedText = textToIndex
      .filter(Boolean)
      .join("\n\n")
      .replace(/Page \(\d+\) Break/g, "")
      .replace(/\s+/g, " ")
      .trim();

    console.log(cleanedText)

    if (cleanedText.length > 0) {
      try {
        pineconeDocId = `report_${Date.now()}`;
        await indexInPinecone(cleanedText, pineconeDocId, {
          userId: userId || "anonymous",
          title,
          reportType,
        });
      } catch (pineconeError) {
        console.error("Pinecone indexing failed:", pineconeError);
      }
    } else {
      return NextResponse.json({ error: "No text to index" }, { status: 400 });
    }

    // 5) Save to MongoDB
    await connectDB();

    const report = await MedicalReport.create({
      userId,
      title,
      reportType,
      fileUrl: cloudinaryResult.secure_url,
      cloudinaryId: cloudinaryResult.public_id,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,

      testName: extractedData.testName,
      analysis: extractedData.analysis,
      hospitalName: extractedData.hospitalName,
      doctorName: extractedData.doctorName,
      testDate: extractedData.testDate ? new Date(extractedData.testDate) : null,
      reportDate: extractedData.reportDate ? new Date(extractedData.reportDate) : null,

      ocrStatus: "completed",
      pineconeDocId,
    });

    return NextResponse.json({
      success: true,
      report,
      rag: {
        chunked: true,
        vectorStored: !!pineconeDocId,
      },
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
