export interface Segment {
  key: string;
  text: string;
}
export interface QuranLine {
  number: number;
  type: "ayah" | "surah" | "basmallah";
  text: string;
  surah: number;
  segments: Segment[];
  width: number;
}
export interface QuranPage {
  number: number;
  lines: QuranLine[];
  keys: string[];
  surahs: number[];
  juz: number;
}
export interface Verse {
  key: string;
  surah: number;
  ayah: number;
  page: number;
  text: string;
}
export interface Translation {
  edition: string;
  surah: number;
  verses: { id: number; translation: string; footnotes?: string }[];
}
export type BengaliTranslationId =
  | "bn.bengali"
  | "bn-islamic-foundation"
  | "bn-taqi-usmani-bashar";
export type ArabicFontId = "indopak" | "kolkata";
export interface Preferences {
  theme: "light" | "dark";
  language: "en" | "bn" | "ar";
  translation: "none" | "en" | "bn" | "both";
  bengaliTranslation: BengaliTranslationId;
  arabicFont: ArabicFontId;
  fontSize: number;
  zoom: number;
  audio: boolean;
  mode: "page" | "continuous";
}
export interface Bookmark {
  id: string;
  page: number;
  key?: string;
  createdAt: string;
}
export interface Progress {
  page: number;
  key: string;
  updatedAt: string;
}
export interface SavedState {
  version: 1;
  preferences: Preferences;
  bookmarks: Bookmark[];
  progress: Progress | null;
  recent: number[];
}
