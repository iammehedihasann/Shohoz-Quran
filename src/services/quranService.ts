import type { QuranPage, Verse } from "../types";
const pages = new Map<number, Promise<QuranPage>>();
async function json<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(
      "This resource could not be loaded. Check your connection and try again.",
    );
  return response.json();
}
export function getPage(page: number) {
  if (page < 1 || page > 610)
    return Promise.reject(new Error("Page must be between 1 and 610."));
  if (!pages.has(page))
    pages.set(
      page,
      json<QuranPage>(`/data/pages/${page}.json`).catch((e) => {
        pages.delete(page);
        throw e;
      }),
    );
  return pages.get(page)!;
}
export function prefetchPage(page: number) {
  if (page >= 1 && page <= 610) void getPage(page).catch(() => {});
}
const verses = new Map<number, Promise<Verse[]>>();
export function getVerses(page: number) {
  if (!verses.has(page))
    verses.set(
      page,
      json<Verse[]>(`/data/verses/${page}.json`).catch((e) => {
        verses.delete(page);
        throw e;
      }),
    );
  return verses.get(page)!;
}
