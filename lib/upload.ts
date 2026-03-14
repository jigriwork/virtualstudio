import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
const maxUploadSize = 8 * 1024 * 1024;

function extensionForMimeType(mimeType: string) {
    if (mimeType === "image/jpeg") return "jpg";
    if (mimeType === "image/png") return "png";
    return "webp";
}

export function validateImageFile(file: File) {
    if (!allowedMimeTypes.includes(file.type)) {
        return "Only JPG, PNG, and WEBP images are supported.";
    }

    if (file.size > maxUploadSize) {
        return "Image size must be 8MB or less.";
    }

    return null;
}

export async function saveImageUpload(file: File, sku: string) {
    const uploadDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadDir, { recursive: true });

    const extension = extensionForMimeType(file.type);
    const filename = `${sku}-${Date.now()}.${extension}`;
    const filePath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    return {
        imageUrl: `/uploads/${filename}`,
        mimeType: file.type,
    };
}
