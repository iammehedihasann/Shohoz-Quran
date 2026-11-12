/// <reference lib="webworker" />
import type { Verse } from "../types";
interface Entry extends Verse {
  en: string;
  bn: string;
  normalized?: string;
}
let data: Promise<Entry[]> | undefined;
const normalize = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\p{M}\u0640\u200c-\u200f\u202a-\u202e\u034f]/gu, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ىی]/g, "ي")
    .replace(/۝[٠-٩]*/g, "")
    .toLowerCase();
self.onmessage = async (e: MessageEvent<{ query: string; id: number }>) => {
  const { query, id } = e.data;
  try {
    data ??= fetch("/data/search.json")
      .then((r) => {
        if (!r.ok) throw new Error("Search index unavailable");
        return r.json();
      })
      .then((rows: Entry[]) =>
        rows.map((r) => ({
          ...r,
          normalized: normalize(`${r.text} ${r.en} ${r.bn}`),
        })),
      )
      .catch((e) => {
        data = undefined;
        throw e;
      });
    const rows = await data,
      q = normalize(query.trim());
    const results: Entry[] = [];
    let total = 0;
    for (const r of rows) {
      if (r.normalized!.includes(q)) {
        total++;
        if (results.length < 100) {
          const { normalized, ...rest } = r;
          void normalized;
          results.push(rest);
        }
      }
    }
    self.postMessage({ id, results, total });
  } catch {
    self.postMessage({
      id,
      error:
        "The search index could not load. Check your connection and search again.",
    });
  }
};
