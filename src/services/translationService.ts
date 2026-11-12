import { surahs } from "../constants/quran";
import {
  DEFAULT_BENGALI_TRANSLATION,
  requireBengaliTranslation,
} from "../constants/translations";
import type { BengaliTranslationId, Translation } from "../types";

const cache = new Map<string, Promise<Translation>>();

export function translationCacheKey(
  language: "en" | "bn",
  surah: number,
  bengaliEdition: BengaliTranslationId = DEFAULT_BENGALI_TRANSLATION,
) {
  const edition =
    language === "bn"
      ? requireBengaliTranslation(bengaliEdition).id
      : "en-pickthall";
  return `${edition}/${surah}`;
}

function validateTranslation(
  data: unknown,
  surah: number,
  attribution: string,
): Translation {
  if (!data || typeof data !== "object")
    throw new Error("Translation data is invalid.");
  const value = data as Partial<Translation>;
  if (
    value.surah !== surah ||
    value.edition !== attribution ||
    !Array.isArray(value.verses) ||
    value.verses.length !== surahs[surah - 1].total_verses
  ) {
    throw new Error(
      "The translation edition or Surah does not match the requested resource.",
    );
  }
  if (
    !value.verses.every(
      (verse, index) =>
        verse &&
        verse.id === index + 1 &&
        typeof verse.translation === "string" &&
        verse.translation.trim().length > 0 &&
        (verse.footnotes === undefined || typeof verse.footnotes === "string"),
    )
  ) {
    throw new Error(
      "The translation has missing or incorrectly numbered ayahs.",
    );
  }
  // Validation never changes the publisher's text or footnotes.
  return value as Translation;
}

interface BengaliSurahResponse {
  code?: number;
  status?: string;
  data?: {
    number?: number;
    numberOfAyahs?: number;
    edition?: {
      identifier?: string;
      language?: string;
      englishName?: string;
      format?: string;
      type?: string;
    };
    ayahs?: { number?: number; numberInSurah?: number; text?: string }[];
  };
}

export function parseBengaliTranslation(
  response: unknown,
  surah: number,
  bengaliEdition: BengaliTranslationId = DEFAULT_BENGALI_TRANSLATION,
): Translation {
  const edition = requireBengaliTranslation(bengaliEdition);
  if (!Number.isInteger(surah) || !surahs[surah - 1])
    throw new Error("Surah must be between 1 and 114.");
  const value = response as BengaliSurahResponse | null;
  const data = value?.data;
  if (
    value?.code !== 200 ||
    value.status !== "OK" ||
    data?.number !== surah ||
    data.numberOfAyahs !== surahs[surah - 1].total_verses ||
    data.edition?.identifier !== edition.apiIdentifier ||
    data.edition.language !== "bn" ||
    data.edition.englishName !== "Muhiuddin Khan" ||
    data.edition.format !== "text" ||
    data.edition.type !== "translation" ||
    !Array.isArray(data.ayahs)
  ) {
    throw new Error(
      "The Bengali API edition or Surah does not match the requested resource.",
    );
  }
  const offset = surahs
    .slice(0, surah - 1)
    .reduce((sum, chapter) => sum + chapter.total_verses, 0);
  if (
    !data.ayahs.every(
      (ayah, index) =>
        ayah &&
        ayah.numberInSurah === index + 1 &&
        ayah.number === offset + index + 1,
    )
  ) {
    throw new Error(
      "The Bengali translation has missing or incorrectly numbered ayahs.",
    );
  }
  return validateTranslation(
    {
      edition: edition.attribution,
      surah: data.number,
      verses: data.ayahs.map((ayah) => ({
        id: ayah.numberInSurah,
        translation: ayah.text,
      })),
    },
    surah,
    edition.attribution,
  );
}

export function getTranslation(
  language: "en" | "bn",
  surah: number,
  bengaliEdition: BengaliTranslationId = DEFAULT_BENGALI_TRANSLATION,
): Promise<Translation> {
  if (language !== "en" && language !== "bn")
    return Promise.reject(new Error("Unknown translation language."));
  if (!Number.isInteger(surah) || surah < 1 || surah > 114)
    return Promise.reject(new Error("Surah must be between 1 and 114."));
  let key: string, url: string;
  try {
    key = translationCacheKey(language, surah, bengaliEdition);
    const edition =
      language === "bn" ? requireBengaliTranslation(bengaliEdition) : undefined;
    url = edition
      ? edition.surahSourceUrl.replace("{surah}", String(surah))
      : `/data/translations/en/${surah}.json`;
  } catch (error) {
    return Promise.reject(error);
  }
  if (!cache.has(key)) {
    cache.set(
      key,
      fetch(url, { signal: AbortSignal.timeout(15000) })
        .then(async (response) => {
          if (!response.ok)
            throw new Error(
              "The selected translation could not load. Check your connection and try again.",
            );
          const data: unknown = await response.json();
          return language === "bn"
            ? parseBengaliTranslation(data, surah, bengaliEdition)
            : validateTranslation(data, surah, "Marmaduke Pickthall (1930)");
        })
        .catch((error) => {
          cache.delete(key);
          if (error?.name === "TimeoutError" || error?.name === "AbortError")
            throw new Error(
              "The translation request timed out. Check your connection and try again.",
            );
          throw error;
        }),
    );
  }
  return cache.get(key)!;
}

export function translationSourceUrl(
  language: "en" | "bn",
  surah: number,
  ayah: number,
  bengaliEdition: BengaliTranslationId = DEFAULT_BENGALI_TRANSLATION,
) {
  if (language === "en") return "https://github.com/risan/quran-json";
  return requireBengaliTranslation(bengaliEdition)
    .verseSourceUrl.replace("{surah}", String(surah))
    .replace("{ayah}", String(ayah));
}
