import type { ArabicFontId } from "../types";

type ArabicFont = {
  id: ArabicFontId;
  label: string;
  sourceUrl: string;
} & (
  | {
      status: "available";
      family: string;
      file: string;
      licenseUrl: string;
      mushafLayout: "digitalkhatt-15";
    }
  | { status: "unavailable"; reason: string }
);

// A requested font becomes the default only after licensing and coverage pass.
export const DEFAULT_ARABIC_FONT: ArabicFontId = "indopak";
export const ARABIC_FONTS: readonly ArabicFont[] = [
  {
    id: "kolkata",
    label: "Kolkata Arabic",
    status: "unavailable",
    sourceUrl: "https://www.urduweb.org/mehfil/threads/34569/",
    reason: "Al Qalam Kolkatta is not available yet: web redistribution permission is unverified, and the inspected font lacks digits and Quranic signs used by this text. Indo-Pak remains active to preserve accurate rendering.",
  },
  {
    id: "indopak",
    label: "Indo-Pak · DigitalKhatt",
    status: "available",
    family: "Indopak",
    file: "/fonts/DigitalKhattIndoPak.woff2",
    sourceUrl: "https://github.com/DigitalKhatt/indopakfont",
    licenseUrl: "/licenses/DigitalKhatt-font-OFL.txt",
    mushafLayout: "digitalkhatt-15",
  },
];

export function isAvailableArabicFont(id: unknown): id is ArabicFontId {
  return ARABIC_FONTS.some(font => font.id === id && font.status === "available");
}

export function requireArabicFont(id: ArabicFontId) {
  const font = ARABIC_FONTS.find(font => font.id === id);
  if (!font || font.status !== "available") {
    throw new Error("This Arabic font has not passed licensing and Quran text compatibility checks.");
  }
  return font;
}

// Includes digits, combining signs and extended Quranic marks in this edition.
export const QURAN_FONT_PROBE = "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ ۝٠١٢٣٤٥٦٧٨٩ ۘ ۙ ۚ ۛ ۜ ۟ ۢ ۦ ۨ ۭ ؗ ࣕ ࣖ ࣗ ࣙ ࣛ ࣝ ࣞ ࣟ";
