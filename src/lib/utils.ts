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
 * Strips all whitespaces from a phone number for database storage
 * e.g., "+234 801 234 5678" -> "+2348012345678"
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return "";
  return phone.replace(/\s+/g, "");
}
