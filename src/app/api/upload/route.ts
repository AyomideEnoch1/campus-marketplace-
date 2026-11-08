import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const contentType = request.headers.get("content-type") || "";

    // Allow unauthenticated uploads strictly for verification documents during onboarding/registration
    // Otherwise require authentication
    const isVerificationUpload =
      request.url.includes("folder=verification") ||
      request.headers.get("x-upload-purpose") === "verification";

    if (!session && !isVerificationUpload && !contentType.includes("verification")) {
      return NextResponse.json(
        { error: "Authentication required to upload files" },
        { status: 401 }
      );
    }

    // 1. Handle JSON base64 upload
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const { image, folder = "products" } = body;

      if (!image || typeof image !== "string") {
        return NextResponse.json(
          { error: "No image data provided" },
          { status: 400 }
        );
      }

      // Check if it's already an external URL
      if (image.startsWith("http://") || image.startsWith("https://")) {
        return NextResponse.json({ url: image, urls: [image], success: true });
      }

      // Parse base64
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return NextResponse.json(
          { error: "Invalid base64 image data" },
          { status: 400 }
        );
      }

      const mimeType = matches[1].toLowerCase();
      const ext = ALLOWED_MIME_TYPES[mimeType] || ".jpg";
      const buffer = Buffer.from(matches[2], "base64");

      if (buffer.length > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Image size exceeds 10MB limit" },
          { status: 400 }
        );
      }

      const safeFolder = folder === "stores" ? "stores" : folder === "verification" ? "verification" : "products";
      const uploadDir = path.join(process.cwd(), "public", "uploads", safeFolder);
      await mkdir(uploadDir, { recursive: true });

      const uniqueName = `${safeFolder}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
      const filePath = path.join(uploadDir, uniqueName);
      await writeFile(filePath, buffer);

      const publicUrl = `/uploads/${safeFolder}/${uniqueName}`;
      return NextResponse.json({ url: publicUrl, urls: [publicUrl], success: true });
    }

    // 2. Handle multipart/form-data file upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const folderParam = (formData.get("folder") as string) || "products";
      const safeFolder = folderParam === "stores" ? "stores" : folderParam === "verification" ? "verification" : "products";

      // Collect all files from "file" or "files" keys
      const files: File[] = [];
      formData.forEach((value, key) => {
        if (value instanceof File && (key === "file" || key === "files" || key.startsWith("file"))) {
          files.push(value);
        }
      });

      if (files.length === 0) {
        return NextResponse.json(
          { error: "No files found in upload request" },
          { status: 400 }
        );
      }

      const uploadDir = path.join(process.cwd(), "public", "uploads", safeFolder);
      await mkdir(uploadDir, { recursive: true });

      const uploadedUrls: string[] = [];

      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `File "${file.name}" exceeds 10MB limit` },
            { status: 400 }
          );
        }

        const mimeType = file.type.toLowerCase();
        const ext = ALLOWED_MIME_TYPES[mimeType] || path.extname(file.name).toLowerCase() || ".jpg";

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uniqueName = `${safeFolder}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
        const filePath = path.join(uploadDir, uniqueName);
        await writeFile(filePath, buffer);

        const publicUrl = `/uploads/${safeFolder}/${uniqueName}`;
        uploadedUrls.push(publicUrl);
      }

      return NextResponse.json({
        urls: uploadedUrls,
        url: uploadedUrls[0],
        success: true,
      });
    }

    return NextResponse.json(
      { error: "Unsupported Content-Type. Use multipart/form-data or application/json" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Upload handler error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
