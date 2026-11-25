/**
 * Client-side image validation & WebP compression using Canvas.
 * Keeps uploads fast on 4G mobile connections and under ~200 KB.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export interface CompressOptions {
  maxWidth?: number;
  quality?: number;
}

export async function compressImageFile(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File "${file.name}" exceeds the 5MB upload limit.`);
  }

  // Skip SVGs or GIFs (preserve vector / animation)
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  if (typeof window === "undefined" || typeof document === "undefined") {
    return file;
  }

  const maxWidth = options.maxWidth ?? 1200;
  const quality = options.quality ?? 0.8;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (!width || !height) {
        resolve(file);
        return;
      }

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^.]+$/, "");
          resolve(
            new File([blob], `${baseName}.webp`, {
              type: "image/webp",
              lastModified: Date.now(),
            })
          );
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
