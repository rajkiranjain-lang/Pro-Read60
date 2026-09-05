export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

export function validateMediaFile(file: { size: number; type: string }) {
  if (IMAGE_TYPES.has(file.type)) {
    if (file.size > MAX_IMAGE_BYTES) return { ok: false as const, error: "Image exceeds 10 MB limit" };
    return { ok: true as const, kind: "image" as const };
  }
  if (VIDEO_TYPES.has(file.type)) {
    if (file.size > MAX_VIDEO_BYTES) return { ok: false as const, error: "Video exceeds 100 MB limit" };
    return { ok: true as const, kind: "video" as const };
  }
  return { ok: false as const, error: "Unsupported media type" };
}

/** Storage-provider-neutral interface. Implement S3/R2/GCS/etc. behind this boundary. */
export interface MediaStorage {
  put(input: { key: string; body: Buffer | Uint8Array; contentType: string }): Promise<{ key: string; url: string }>;
  remove(key: string): Promise<void>;
}

export function mediaKey(userId: string, filename: string) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100);
  return `users/${userId}/media/${crypto.randomUUID()}-${safe}`;
}
