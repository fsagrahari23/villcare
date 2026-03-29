import { GoogleGenerativeAI } from "@google/generative-ai";
import { SarvamAIClient } from "sarvamai";
import { connectDB } from "@/lib/db";
import SymptomAnalysis from "@/lib/models/SymptomAnalysis";
import HealthCenter from "@/lib/models/HealthCenter";
import Doctor from "@/lib/models/Doctor";

function normalizeTerms(values: unknown[]) {
  return values
    .map((item) =>
      String(item || "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);
}

async function backfillGeoLocations() {
  const centersWithoutGeo = await HealthCenter.find({
    $or: [
      { location: { $exists: false } },
      { "location.coordinates.0": { $exists: false } },
    ],
    latitude: { $type: "number" },
    longitude: { $type: "number" },
  })
    .select("_id latitude longitude")
    .lean();

  if (centersWithoutGeo.length === 0) return;

  await HealthCenter.bulkWrite(
    centersWithoutGeo.map((center: any) => ({
      updateOne: {
        filter: { _id: center._id },
        update: {
          $set: {
            location: {
              type: "Point",
              coordinates: [center.longitude, center.latitude],
            },
          },
        },
      },
    })),
  );
}
async function findNearbyHealthCenters(params: {
  latitude?: number | null;
  longitude?: number | null;
  diseaseKeywords?: string[];
  careSpecialties?: string[];
}) {
  const {
    latitude,
    longitude,
    diseaseKeywords = [],
    careSpecialties = [],
  } = params;

  const diseaseTerms = normalizeTerms(diseaseKeywords);
  const needTerms = normalizeTerms(careSpecialties);
  const activeTerms = diseaseTerms.length > 0 ? diseaseTerms : needTerms;

  const hasCoordinates =
    Number.isFinite(latitude) && Number.isFinite(longitude);

  const baseQuery = {
    isActive: true,
    status: "approved",
  };

  let centers: any[] = [];

  try {
    if (hasCoordinates) {
      centers = await HealthCenter.aggregate([
        {
          $geoNear: {
            key: "location",
            near: {
              type: "Point",
              coordinates: [longitude as number, latitude as number],
            },
            distanceField: "distance",
            spherical: true,
            maxDistance: 50000,
            query: {
              ...baseQuery,
              location: { $exists: true },
            },
          },
        },
        { $limit: 50 },
      ]);
    } else {
      centers = await HealthCenter.find({
        ...baseQuery,
        location: { $exists: true },
      })
        .limit(50)
        .lean();
    }
  } catch (error) {
    console.error("Geo query failed, fallback:", error);
    centers = await HealthCenter.find({
      ...baseQuery,
      location: { $exists: true },
    })
      .limit(50)
      .lean();
  }

  if (!centers.length) return [];

  const centerIds = centers.map((c: any) => c._id);

  const doctors = await Doctor.find({
    healthCenterId: { $in: centerIds },
    isAvailable: true,
  }).lean();

  const scoredDoctors = doctors.map((doctor: any) => {
    const scoreTerms =
      diseaseTerms.length > 0
        ? [...(doctor.diseasesHandled || [])]
        : [
            doctor.specialization,
            ...(doctor.diseasesHandled || []),
            ...(doctor.careNeeds || []),
          ];

    const normalizedScoreTerms = scoreTerms
      .map((item) => String(item || "").toLowerCase())
      .filter(Boolean);

    const termMatches = activeTerms.filter((term) =>
      normalizedScoreTerms.some(
        (candidate) => candidate.includes(term) || term.includes(candidate),
      ),
    ).length;

    return {
      doctor,
      matchScore: termMatches,
      isMatched: activeTerms.length === 0 ? true : termMatches > 0,
    };
  });

  const matchedDoctors = scoredDoctors.filter((item) => item.isMatched);

  // If nothing matches the AI keywords, fall back to all available doctors
  const doctorsToUse =
    matchedDoctors.length > 0 ? matchedDoctors : scoredDoctors;

  const doctorMap = new Map<string, any[]>();

  for (const item of doctorsToUse) {
    const doctor = item.doctor;
    const centerId = String(doctor.healthCenterId);

    if (!doctorMap.has(centerId)) doctorMap.set(centerId, []);

    doctorMap.get(centerId)!.push({
      id: doctor._id,
      name: doctor.name,
      specialization: doctor.specialization,
      diseasesHandled: doctor.diseasesHandled || [],
      careNeeds: doctor.careNeeds || [],
      languages: doctor.languages || [],
      availableModes: doctor.availableModes || [],
      availability: doctor.availability || {},
      imageUrl: doctor.imageUrl || null,
      matchScore: item.matchScore,
    });
  }

  const results = centers
    .map((center: any) => {
      const matchedDoctorsForCenter = doctorMap.get(String(center._id)) || [];

      const distanceKm =
        typeof center.distance === "number" ? center.distance / 1000 : null;

      const lat =
        typeof center?.location?.coordinates?.[1] === "number"
          ? center.location.coordinates[1]
          : typeof center.latitude === "number"
            ? center.latitude
            : null;

      const lng =
        typeof center?.location?.coordinates?.[0] === "number"
          ? center.location.coordinates[0]
          : typeof center.longitude === "number"
            ? center.longitude
            : null;

      return {
        id: center._id,
        name: center.name,
        type: center.type,
        address: center.address,
        city: center.city,
        state: center.state,
        phone: center.phone,
        imageUrl: center.imageUrl || null,

        distance:
          distanceKm === null
            ? "Location unavailable"
            : `${distanceKm.toFixed(1)} km`,

        distanceKm,
        coordinate: lat !== null && lng !== null ? [lat, lng] : null,

        requiredNeeds: center.requiredNeeds || [],
        specializations: center.specializations || [],

        doctors: matchedDoctorsForCenter.sort(
          (a, b) => b.matchScore - a.matchScore,
        ),
      };
    })
    .sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      return b.doctors.length - a.doctors.length;
    })
    .slice(0, 10);

  return results;
}

export async function POST(request: Request) {
  try {
    const { transcript, userId, location, language } = await request.json();
    if (!transcript) {
      return Response.json(
        { error: "No transcript provided" },
        { status: 400 },
      );
    }

    await connectDB();

    const sarvamClient = new SarvamAIClient({
      apiSubscriptionKey: process.env.SARVAM_API_KEY || "",
    });

    // Pre-process: Translate the transcript to English for better Gemini analysis
    let englishTranscript = transcript;
    try {
      const translationRes = await sarvamClient.text.translate({
        input: transcript,
        source_language_code: "auto",
        target_language_code: "en-IN",
      });
      if (translationRes?.translated_text) {
        englishTranscript = translationRes.translated_text;
      }
    } catch (err) {
      console.warn(
        "Translation to English failed, falling back to original transcript:",
        err,
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

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
    }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (!text) {
      throw new Error("Empty response from AI");
    }

    const analysisResult = JSON.parse(text);
    const safeLocation =
      location &&
      Number.isFinite(Number(location.latitude)) &&
      Number.isFinite(Number(location.longitude))
        ? {
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
          }
        : null;

    const nearbyHealthCenters = await findNearbyHealthCenters({
      latitude: safeLocation?.latitude,
      longitude: safeLocation?.longitude,
      diseaseKeywords: Array.isArray(analysisResult.diseaseKeywords)
        ? analysisResult.diseaseKeywords
        : [],
      careSpecialties: Array.isArray(analysisResult.careSpecialties)
        ? analysisResult.careSpecialties
        : [],
    });

    // Save to Database
    const savedAnalysis = await SymptomAnalysis.create({
      userId: userId || null,
      originalTranscript: transcript,
      englishTranscript: englishTranscript,
      languageCode: language || "en-IN",
      analysis: analysisResult,
      location: safeLocation,
    });

    return Response.json({
      ...analysisResult,
      id: savedAnalysis._id,
      originalTranscript: transcript,
      englishTranscript: englishTranscript,
      location: safeLocation,
      nearbyHealthCenters,
    });
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return Response.json(
      { error: "Failed to analyze symptoms", details: error.message },
      { status: 500 },
    );
  }
}
