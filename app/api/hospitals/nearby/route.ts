import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import HealthCenter from "@/lib/models/HealthCenter";
import Doctor from "@/lib/models/Doctor";

function parseTerms(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function isValidLatLng(lat: number, lng: number) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));

    const diseaseTerms = parseTerms(searchParams.get("disease"));
    const needTerms = parseTerms(searchParams.get("needs"));
    const activeTerms = diseaseTerms.length > 0 ? diseaseTerms : needTerms;

    await connectDB();

    const baseQuery = {
      isActive: true,
      status: "approved",
      location: { $exists: true },
    };

    const centers = isValidLatLng(lat, lng)
      ? await HealthCenter.aggregate([
          {
            $geoNear: {
              near: {
                type: "Point",
                coordinates: [lng, lat], // IMPORTANT: [lng, lat]
              },
              key: "location", // ✅ explicitly use geo field
              distanceField: "distance",
              spherical: true,
              maxDistance: 50000,
              query: baseQuery,
            },
          },
          { $limit: 50 },
        ])
      : await HealthCenter.find(baseQuery).lean();

    const centerIds = centers.map((center: any) => center._id);

    const doctors = await Doctor.find({
      healthCenterId: { $in: centerIds },
      isAvailable: true,
    }).lean();

    const doctorMap = new Map<string, any[]>();

    for (const doctor of doctors as any[]) {
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

      if (activeTerms.length > 0 && termMatches === 0) continue;

      const centerId = String(doctor.healthCenterId);
      const current = doctorMap.get(centerId) || [];

      current.push({
        id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
        diseasesHandled: doctor.diseasesHandled || [],
        careNeeds: doctor.careNeeds || [],
        languages: doctor.languages || [],
        availableModes: doctor.availableModes || [],
        availability: doctor.availability || {},
        imageUrl: doctor.imageUrl || null,
        matchScore: termMatches,
      });

      doctorMap.set(centerId, current);
    }

    const results = centers
      .map((center: any) => {
        const matchedDoctors = doctorMap.get(String(center._id)) || [];

        const centerLongitude =
          typeof center?.location?.coordinates?.[0] === "number"
            ? center.location.coordinates[0]
            : (center.longitude ?? null);

        const centerLatitude =
          typeof center?.location?.coordinates?.[1] === "number"
            ? center.location.coordinates[1]
            : (center.latitude ?? null);

        const distanceKm =
          typeof center.distance === "number" ? center.distance / 1000 : null;

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
          coordinate:
            centerLatitude !== null && centerLongitude !== null
              ? [centerLatitude, centerLongitude]
              : null,
          requiredNeeds: center.requiredNeeds || [],
          specializations: center.specializations || [],
          doctors: matchedDoctors.sort((a, b) => b.matchScore - a.matchScore),
        };
      })
      .filter((center: any) => {
        if (activeTerms.length === 0) return true;

        if (diseaseTerms.length > 0) {
          return center.doctors.length > 0;
        }

        const centerTerms = [
          ...center.requiredNeeds,
          ...center.specializations,
        ].map((item) => String(item || "").toLowerCase());

        const centerMatches = activeTerms.some((term) =>
          centerTerms.some(
            (candidate) => candidate.includes(term) || term.includes(candidate),
          ),
        );

        return centerMatches || center.doctors.length > 0;
      })
      .sort((a: any, b: any) => {
        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }
        return b.doctors.length - a.doctors.length;
      })
      .slice(0, 10);

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Nearby hospitals error:", error);
    return NextResponse.json(
      { error: "Failed to fetch hospitals" },
      { status: 500 },
    );
  }
}
