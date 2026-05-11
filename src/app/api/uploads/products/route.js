import { createHash, randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { jsonResponse, requireAdmin } from "@/lib/auth";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function getSafeExtension(file) {
  const mimeToExt = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };

  return mimeToExt[file.type] || ".jpg";
}

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
  const apiKey = process.env.CLOUDINARY_API_KEY || "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
  const isConfigured = Boolean(cloudName && apiKey && apiSecret);

  return { cloudName, apiKey, apiSecret, isConfigured };
}

function signCloudinaryParams(params, apiSecret) {
  const toSign = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${toSign}${apiSecret}`)
    .digest("hex");
}

async function uploadToCloudinary(file) {
  const { cloudName, apiKey, apiSecret, isConfigured } = getCloudinaryConfig();
  if (!isConfigured) {
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "trendwa/products";
  const signature = signCloudinaryParams({ folder, timestamp }, apiSecret);

  const payload = new FormData();
  payload.append("file", file);
  payload.append("api_key", apiKey);
  payload.append("timestamp", String(timestamp));
  payload.append("folder", folder);
  payload.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: payload,
  });
  const result = await response.json();

  if (!response.ok || !result?.secure_url) {
    throw new Error(result?.error?.message || "Cloudinary upload failed.");
  }

  return result.secure_url;
}

export async function POST(request) {
  const { response } = requireAdmin(request);
  if (response) {
    return response;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return jsonResponse({ success: false, message: "Image file is required." }, 400);
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return jsonResponse(
        {
          success: false,
          message: "Only JPG, PNG, WEBP, and GIF images are allowed.",
        },
        400,
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return jsonResponse(
        { success: false, message: "Image size must be 5MB or less." },
        400,
      );
    }

    const cloudinaryUrl = await uploadToCloudinary(file);
    if (cloudinaryUrl) {
      return jsonResponse({
        success: true,
        data: {
          imageUrl: cloudinaryUrl,
        },
      });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const extension = getSafeExtension(file);
    const filename = `${Date.now()}-${randomUUID()}${extension}`;
    const relativeDirectory = path.join("uploads", "products");
    const relativePath = path.join(relativeDirectory, filename);
    const absoluteDirectory = path.join(process.cwd(), "public", relativeDirectory);
    const absolutePath = path.join(process.cwd(), "public", relativePath);

    await mkdir(absoluteDirectory, { recursive: true });
    await writeFile(absolutePath, buffer);

    return jsonResponse({
      success: true,
      data: {
        imageUrl: `/${relativePath.replaceAll(path.sep, "/")}`,
      },
    });
  } catch {
    return jsonResponse({ success: false, message: "Unable to upload image." }, 500);
  }
}
