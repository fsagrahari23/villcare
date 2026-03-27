import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import HealthCenter from "@/lib/models/HealthCenter";
import Doctor from "@/lib/models/Doctor";

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function parseTerms(value: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const diseaseTerms = parseTerms(searchParams.get("disease"));
    const needTerms = parseTerms(searchParams.get("needs"));

    await connectDB();

    const centers = await HealthCenter.find({
      isActive: true,
      status: "approved",
    }).lean();

    const centerIds = centers.map((center: any) => center._id);
    const doctors = await Doctor.find({
      healthCenterId: { $in: centerIds },
      isAvailable: true,
    }).lean();

    const doctorMap = new Map<string, any[]>();

    doctors.forEach((doctor: any) => {
      const scoreTerms = [
        doctor.specialization,
        ...(doctor.diseasesHandled || []),
        ...(doctor.careNeeds || []),
      ]
        .map((item) => String(item).toLowerCase());

      const termMatches = [...diseaseTerms, ...needTerms].filter((term) =>
        scoreTerms.some((candidate) => candidate.includes(term) || term.includes(candidate))
      ).length;

      if (diseaseTerms.length > 0 || needTerms.length > 0) {
        if (termMatches === 0) return;
      }

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
    });

    const results = centers
      .map((center: any) => {
        const matchedDoctors = doctorMap.get(String(center._id)) || [];
        const distanceKm =
          Number.isFinite(lat) && Number.isFinite(lng)
            ? getDistanceKm(lat, lng, center.latitude, center.longitude)
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
          distance: distanceKm === null ? "Location unavailable" : `${distanceKm.toFixed(1)} km`,
          distanceKm,
          coordinate: [center.latitude, center.longitude],
          requiredNeeds: center.requiredNeeds || [],
          specializations: center.specializations || [],
          doctors: matchedDoctors.sort((a, b) => b.matchScore - a.matchScore),
        };
      })
      .filter((center) => {
        if (diseaseTerms.length === 0 && needTerms.length === 0) return true;

        const centerTerms = [
          ...center.requiredNeeds,
          ...center.specializations,
        ].map((item) => String(item).toLowerCase());

        const centerMatches = [...diseaseTerms, ...needTerms].some((term) =>
          centerTerms.some((candidate) => candidate.includes(term) || term.includes(candidate))
        );

        return centerMatches || center.doctors.length > 0;
      })
      .sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
        return b.doctors.length - a.doctors.length;
      })
      .slice(0, 10);

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Nearby hospitals error:", error);
    return NextResponse.json({ error: "Failed to fetch hospitals" }, { status: 500 });
  }
}
