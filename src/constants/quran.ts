import metadata from "./navigation.json";
import verseIndex from "./verse-index.json";
export const { surahs, juz } = metadata;
export const PAGE_COUNT = metadata.pages;
const offsets = surahs.map((_, i) =>
  surahs.slice(0, i).reduce((n, s) => n + s.total_verses, 0),
);
export const pageFor = (surah: number, ayah = 1) =>
  Number.isInteger(surah) &&
  Number.isInteger(ayah) &&
  surah >= 1 &&
  surah <= 114 &&
  ayah >= 1 &&
  ayah <= surahs[surah - 1].total_verses
    ? verseIndex[offsets[surah - 1] + ayah - 1]
    : undefined;
export const surahAt = (page: number) =>
  surahs.filter((s) => s.page <= page).at(-1) ?? surahs[0];
