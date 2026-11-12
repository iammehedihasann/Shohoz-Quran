import { surahs } from "../constants/quran";
import { DEFAULT_BENGALI_TRANSLATION, requireBengaliTranslation } from "../constants/translations";
import type { BengaliTranslationId, Translation } from "../types";

const cache = new Map<string, Promise<Translation>>();

export function translationCacheKey(language: "en" | "bn", surah: number, bengaliEdition: BengaliTranslationId = DEFAULT_BENGALI_TRANSLATION) {
  const edition = language === "bn" ? requireBengaliTranslation(bengaliEdition).id : "en-pickthall";
  return `${edition}/${surah}`;
}

function validateTranslation(data: unknown, surah: number, attribution: string): Translation {
  if (!data || typeof data !== "object") throw new Error("Translation data is invalid.");
  const value = data as Partial<Translation>;
  if (value.surah !== surah || value.edition !== attribution || !Array.isArray(value.verses) || value.verses.length !== surahs[surah - 1].total_verses) {
    throw new Error("The translation edition or Surah does not match the requested resource.");
  }
  if (!value.verses.every((verse, index) => verse && verse.id === index + 1 && typeof verse.translation === "string" && verse.translation.trim().length > 0 && (verse.footnotes === undefined || typeof verse.footnotes === "string"))) {
    throw new Error("The translation has missing or incorrectly numbered ayahs.");
  }
  // Validation never changes the publisher's text or footnotes.
  return value as Translation;
}

export function getTranslation(language: "en" | "bn", surah: number, bengaliEdition: BengaliTranslationId = DEFAULT_BENGALI_TRANSLATION): Promise<Translation> {
  if (language !== "en" && language !== "bn") return Promise.reject(new Error("Unknown translation language."));
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) return Promise.reject(new Error("Surah must be between 1 and 114."));
  let key: string, directory: string, attribution: string;
  try {
    key = translationCacheKey(language, surah, bengaliEdition);
    const edition = language === "bn" ? requireBengaliTranslation(bengaliEdition) : undefined;
    directory = edition?.directory ?? "/data/translations/en";
    attribution = edition?.attribution ?? "Marmaduke Pickthall (1930)";
  } catch (error) {
    return Promise.reject(error);
  }
  if (!cache.has(key)) {
    cache.set(key, fetch(`${directory}/${surah}.json`).then(async (response) => {
      if (!response.ok) throw new Error("The selected translation could not load. Check your connection and try again.");
      return validateTranslation(await response.json(), surah, attribution);
    }).catch((error) => { cache.delete(key); throw error; }));
  }
  return cache.get(key)!;
}

export function translationSourceUrl(language: "en" | "bn", surah: number, ayah: number, bengaliEdition: BengaliTranslationId = DEFAULT_BENGALI_TRANSLATION) {
  if (language === "en") return "https://github.com/risan/quran-json";
  return requireBengaliTranslation(bengaliEdition).verseSourceUrl.replace("{surah}", String(surah)).replace("{ayah}", String(ayah));
}
