import crypto from "crypto";

const ENCRYPTION_KEY = process.env.JWT_SECRET
  ? crypto.createHash("sha256").update(process.env.JWT_SECRET).digest()
  : crypto.createHash("sha256").update("campustrade_delivery_code_secret_key_32_bytes!").digest();

const IV_LENGTH = 12; // GCM recommended IV length

/**
 * Encrypts plaintext (e.g. 6-digit delivery code) using AES-256-GCM.
 */
export function encryptCode(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  // format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM encrypted string.
 */
export function decryptCode(encryptedPayload: string): string | null {
  try {
    const parts = encryptedPayload.split(":");
    if (parts.length !== 3) return null;
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encryptedText = parts[2];

    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Failed to decrypt delivery code:", err);
    return null;
  }
}

/**
 * Generates SHA-256 hash of a string.
 */
export function hashString(value: string): string {
  return crypto.createHash("sha256").update(value.trim()).digest("hex");
}
