import type { BengaliTranslationId } from "../types";

interface EditionIdentity {
  id: BengaliTranslationId;
  label: string;
  author: string;
  translator?: string;
  publisher: string;
  sourceUrl: string;
}

export type BengaliTranslationEdition = EditionIdentity &
  (
    | {
        status: "available";
        attribution: string;
        apiIdentifier: "bn.bengali";
        surahSourceUrl: string;
        permissionUrl: string;
        verseSourceUrl: string;
      }
    | {
        status: "unavailable";
        reason: string;
      }
  );

export const DEFAULT_BENGALI_TRANSLATION: BengaliTranslationId = "bn.bengali";

export const BENGALI_TRANSLATIONS: readonly BengaliTranslationEdition[] = [
  {
    id: "bn.bengali",
    label: "মাওলানা মুহিউদ্দীন খান",
    author: "মাওলানা মুহিউদ্দীন খান",
    publisher: "Islamic Network",
    status: "available",
    attribution: "মাওলানা মুহিউদ্দীন খান",
    apiIdentifier: "bn.bengali",
    surahSourceUrl: "https://api.alquran.cloud/v1/surah/{surah}/bn.bengali",
    sourceUrl: "https://alquran.cloud/api",
    verseSourceUrl:
      "https://api.alquran.cloud/v1/ayah/{surah}:{ayah}/bn.bengali",
    permissionUrl: "https://alquran.cloud/terms-and-conditions",
  },
  {
    id: "bn-islamic-foundation",
    label: "Islamic Foundation Bangladesh",
    author: "Board of translators · Islamic Foundation Bangladesh",
    publisher: "Islamic Foundation Bangladesh",
    status: "unavailable",
    sourceUrl: "https://quran.gov.bd/home/ebook_download.html",
    reason:
      "An official government PDF download is available, but a verified verse dataset matching the Islamic Foundation edition and permission to redistribute it have not been confirmed. This edition is not included.",
  },
  {
    id: "bn-taqi-usmani-bashar",
    label:
      "Mufti Muhammad Taqi Usmani · Bengali: Maulana Abul Bashar Muhammad Saiful Islam",
    author: "Mufti Muhammad Taqi Usmani",
    translator: "Maulana Abul Bashar Muhammad Saiful Islam",
    publisher: "Maktabatul Ashraf",
    status: "unavailable",
    sourceUrl:
      "https://maktabatulashraf.com/index.php?route=product/category&path=172",
    reason:
      "The Bengali Tafseer-e-Tawzeehul Quran is a published book. An authorized Bengali verse dataset and digital redistribution permission have not been confirmed. English and Urdu Usmani translations are different editions and are not substituted.",
  },
];

export function findBengaliTranslation(id: unknown) {
  return BENGALI_TRANSLATIONS.find((edition) => edition.id === id);
}

export function isAvailableBengaliTranslation(
  id: unknown,
): id is BengaliTranslationId {
  return findBengaliTranslation(id)?.status === "available";
}

export function requireBengaliTranslation(id: BengaliTranslationId) {
  const edition = findBengaliTranslation(id);
  if (!edition || edition.status !== "available") {
    throw new Error(
      "This Bengali edition is unavailable: verified text and redistribution permission are required. Choose an available edition.",
    );
  }
  return edition;
}
