import fs from "node:fs";
import type { Page } from "@playwright/test";

const metadata = JSON.parse(
  fs.readFileSync("src/constants/navigation.json", "utf8"),
);
const fixture = JSON.parse(
  fs.readFileSync("tests/fixtures/bn.bengali-surah1.json", "utf8"),
);
export const translator = "মাওলানা মুহিউদ্দীন খান";
export function bengaliSnapshot(surah: number) {
  return JSON.parse(
    fs.readFileSync(`public/data/translations/bn/${surah}.json`, "utf8"),
  );
}
export function bengaliApiResponse(surah: number) {
  return {
    code: 200,
    status: "OK",
    data: {
      number: surah,
      numberOfAyahs: metadata.surahs[surah - 1].total_verses,
      edition: { ...fixture.data.edition },
      ayahs: bengaliSnapshot(surah).verses.map(
        (v: { id: number; translation: string }) => ({
          number:
            metadata.surahs
              .slice(0, surah - 1)
              .reduce(
                (n: number, s: { total_verses: number }) => n + s.total_verses,
                0,
              ) + v.id,
          numberInSurah: v.id,
          text: v.translation,
        }),
      ),
    },
  };
}
export async function mockBengaliApi(page: Page) {
  const requests: number[] = [];
  await page.route(
    "https://api.alquran.cloud/v1/surah/*/bn.bengali",
    async (route) => {
      const surah = Number(route.request().url().split("/").at(-2));
      requests.push(surah);
      await route.fulfill({ json: bengaliApiResponse(surah) });
    },
  );
  return requests;
}
