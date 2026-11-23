import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNGN(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const formatPrice = formatNGN;

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(new Date(date));
}

/**
 * Formats a phone number for display with +234 prefix and grouping:
 * e.g., "+234 801 234 5678"
 *
 * Rules:
 * - By default includes "+234 "
 * - If 11 digits entered (e.g. 08012345678), removes first digit (0) and adds +234
 * - If 10 digits entered, keeps all digits and adds +234
 * - Formats as "+234 XXX XXX XXXX"
 */
export function formatNigerianPhone(raw: string): string {
  if (!raw) return "+234 ";

  let digits = raw.replace(/\D/g, "");

  // If user pasted/entered an international format starting with 234
  if (digits.startsWith("234")) {
    digits = digits.slice(3);
  }

  // If 11 digits starting with 0, remove the first digit
  if (digits.length >= 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  } else if (digits.startsWith("0") && digits.length > 1) {
    digits = digits.slice(1);
  }

  // Maximum 10 national digits
  const national = digits.slice(0, 10);

  if (national.length === 0) {
    return "+234 ";
  }

  if (national.length <= 3) {
    return `+234 ${national}`;
  } else if (national.length <= 6) {
    return `+234 ${national.slice(0, 3)} ${national.slice(3)}`;
  } else {
    return `+234 ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
  }
}

/**
 * Cleans and standardizes a Nigerian phone number for database storage:
 * - Strips all whitespaces and non-digits (preserving leading + if valid)
 * - Returns empty string if only country code (e.g. "+234") or fewer than 7 digits entered
 * - Standardizes numbers starting with 0 (e.g. 08012345678) or 234 to +234XXXXXXXXXX
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.trim().replace(/\s+/g, "");
  const digits = cleaned.replace(/\D/g, "");

  // If only country code ("234") or fewer than 7 digits, it's not a complete/valid phone number
  if (digits === "234" || digits.length < 7) {
    return "";
  }

  // If starts with 234 and has standard 13 digits (e.g. 2348012345678)
  if (digits.startsWith("234") && digits.length >= 12) {
    return `+${digits}`;
  }

  // If starts with 0 and has standard 11 digits (e.g. 08012345678 -> +2348012345678)
  if (digits.startsWith("0") && digits.length >= 10) {
    return `+234${digits.slice(1)}`;
  }

  // If 10 digits entered without leading zero (e.g. 8012345678 -> +2348012345678)
  if (digits.length === 10) {
    return `+234${digits}`;
  }

  return cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
}
