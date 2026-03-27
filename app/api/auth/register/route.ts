import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import HealthCenter from "@/lib/models/HealthCenter";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function parseList(value: FormDataEntryValue | string | null | undefined) {
  if (!value) return [];
  const raw = String(value).trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // Fall back to comma-separated values.
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function uploadImage(file: File | null) {
  if (!file) return null;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return {
      url: `data:${file.type};base64,${buffer.toString("base64")}`,
      publicId: "",
    };
  }

  const result: any = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "voicecare/health-centers",
        resource_type: "image",
      },
      (error: any, response: any) => {
        if (error) reject(error);
        else resolve(response);
      },
    );

    uploadStream.end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

async function readPayload(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return {
      mode: "form" as const,
      data: {
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || ""),
        phone: String(formData.get("phone") || ""),
        password: String(formData.get("password") || ""),
        role: String(formData.get("role") || "patient"),
        dateOfBirth: String(formData.get("dateOfBirth") || ""),
        gender: String(formData.get("gender") || ""),
        bloodType: String(formData.get("bloodType") || ""),
        city: String(formData.get("city") || ""),
        state: String(formData.get("state") || ""),
        zipCode: String(formData.get("zipCode") || ""),
        address: String(formData.get("address") || ""),
        latitude: Number(formData.get("latitude") || 0),
        longitude: Number(formData.get("longitude") || 0),
        staffId: String(formData.get("staffId") || ""),
        departmentName: String(formData.get("departmentName") || ""),
        healthCenterName: String(formData.get("healthCenterName") || ""),
        healthCenterType: String(formData.get("healthCenterType") || "clinic"),
        website: String(formData.get("website") || ""),
        registrationNumber: String(formData.get("registrationNumber") || ""),
        licenseNumber: String(formData.get("licenseNumber") || ""),
        licenseExpiry: String(formData.get("licenseExpiry") || ""),
        contactPersonName: String(formData.get("contactPersonName") || ""),
        contactPersonRole: String(formData.get("contactPersonRole") || ""),
        contactPersonPhone: String(formData.get("contactPersonPhone") || ""),
        services: parseList(formData.get("services")),
        specializations: parseList(formData.get("specializations")),
        requiredNeeds: parseList(formData.get("requiredNeeds")),
      },
      image: (formData.get("image") as File | null) || null,
    };
  }

  return {
    mode: "json" as const,
    data: await request.json(),
    image: null,
  };
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const payload = await readPayload(request);
    const {
      name,
      email,
      phone,
      password,
      role,
      dateOfBirth,
      gender,
      bloodType,
      city,
      state,
      zipCode,
      address,
      latitude,
      longitude,
      staffId,
      departmentName,
      healthCenterName,
      healthCenterType,
      website,
      registrationNumber,
      licenseNumber,
      licenseExpiry,
      contactPersonName,
      contactPersonRole,
      contactPersonPhone,
      services = [],
      specializations = [],
      requiredNeeds = [],
    } = payload.data as any;

    if (!name || !email || !password || !phone) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    if (role === "healthcenter") {
      const requiredCenterFields = [
        healthCenterName,
        healthCenterType,
        address,
        city,
        state,
      ];

      if (requiredCenterFields.some((value) => !String(value || "").trim())) {
        return NextResponse.json(
          {
            message:
              "Health center registration is missing required center details",
          },
          { status: 400 },
        );
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists with this email" },
        { status: 400 },
      );
    }

    const existingCenter =
      role === "healthcenter" ? await HealthCenter.findOne({ email }) : null;

    if (existingCenter) {
      return NextResponse.json(
        { message: "A health center is already registered with this email" },
        { status: 400 },
      );
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role || "patient",
      dateOfBirth,
      gender,
      bloodType,
      address,
      city,
      state,
      zipCode,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      staffId,
      departmentName,
    });

    let createdCenter: any = null;
    let documents: any = [];

    if (role === "healthcenter") {
      const imageUpload = await uploadImage(payload.image);
      if (imageUpload?.url) {
        documents = [
          {
            type: "center-image",
            url: imageUpload.url,
            uploadedAt: new Date(),
            publicId: imageUpload.publicId,
          },
        ];
      }
      createdCenter = await HealthCenter.create({
        name: healthCenterName,
        type: healthCenterType,
        email,
        phone,
        website,
        address,
        city,
        state,
        zipCode,
        latitude: Number.isFinite(latitude) && latitude !== 0 ? latitude : 0,
        longitude:
          Number.isFinite(longitude) && longitude !== 0 ? longitude : 0,
        registrationNumber,
        licenseNumber,
        licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
        ownerUserId: user._id,
        imageUrl: imageUpload?.url,
        imageCloudinaryId: imageUpload?.publicId,
        contactPersonName,
        contactPersonRole,
        contactPersonPhone,
        specializations,
        services,
        requiredNeeds,
        documents,
        status: "pending",
      });

      user.healthCenterId = createdCenter._id;
      user.assignedHealthCenter = createdCenter._id;
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message:
        role === "healthcenter"
          ? "Health center registered successfully and is pending staff approval."
          : "Registration successful. Please log in.",
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        role: user.role,
        healthCenterId: createdCenter?._id || user.healthCenterId || null,
      },
      healthCenter: createdCenter
        ? {
            id: createdCenter._id,
            status: createdCenter.status,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Registration failed", details: error.message },
      { status: 500 },
    );
  }
}
