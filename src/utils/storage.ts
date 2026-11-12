import type { SavedState, Preferences } from "../types";
import { pageFor } from "../constants/quran";
import {
  DEFAULT_BENGALI_TRANSLATION,
  isAvailableBengaliTranslation,
} from "../constants/translations";
export const defaultPreferences: Preferences = {
  theme: "light",
  language: "en",
  translation: "none",
  bengaliTranslation: DEFAULT_BENGALI_TRANSLATION,
  fontSize: 32,
  zoom: 100,
  audio: true,
  mode: "page",
};
export const defaultState: SavedState = {
  version: 1,
  preferences: defaultPreferences,
  bookmarks: [],
  progress: null,
  recent: [],
};
export const STORAGE_KEY = "hafezi-quran-v1";
export function readState(): SavedState {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!raw || raw.version !== 1) return defaultState;
    const p = raw.preferences ?? {};
    const preferences: Preferences = { ...defaultPreferences };
    if (["light", "dark"].includes(p.theme)) preferences.theme = p.theme;
    if (["en", "bn", "ar"].includes(p.language))
      preferences.language = p.language;
    if (["none", "en", "bn", "both"].includes(p.translation))
      preferences.translation = p.translation;
    if (isAvailableBengaliTranslation(p.bengaliTranslation))
      preferences.bengaliTranslation = p.bengaliTranslation;
    // Unsupported and legacy edition IDs receive the current default; persist
    // only this migration so bookmarks and unrelated saved fields stay intact.
    if (p.bengaliTranslation !== preferences.bengaliTranslation) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ...raw,
            preferences: {
              ...p,
              bengaliTranslation: preferences.bengaliTranslation,
            },
          }),
        );
      } catch {
        /* Reading still works when storage is read-only. */
      }
    }
    if (["page", "continuous"].includes(p.mode)) preferences.mode = p.mode;
    if (Number.isFinite(p.fontSize))
      preferences.fontSize = Math.min(56, Math.max(24, p.fontSize));
    if (Number.isFinite(p.zoom))
      preferences.zoom = Math.min(200, Math.max(75, p.zoom));
    if (typeof p.audio === "boolean") preferences.audio = p.audio;
    const validPage = (n: unknown) =>
      Number.isInteger(n) && Number(n) >= 1 && Number(n) <= 610;
    const validKey = (key: unknown) => {
      if (typeof key !== "string" || !/^\d{1,3}:\d{1,3}$/.test(key))
        return false;
      const [s, a] = key.split(":").map(Number);
      return !!pageFor(s, a);
    };
    const bookmarks = Array.isArray(raw.bookmarks)
      ? raw.bookmarks
          .filter(
            (b: any) =>
              b &&
              typeof b.id === "string" &&
              validPage(b.page) &&
              typeof b.createdAt === "string" &&
              !Number.isNaN(Date.parse(b.createdAt)) &&
              (!b.key || validKey(b.key)) &&
              b.id === (b.key ? `ayah-${b.key}` : `page-${b.page}`),
          )
          .slice(0, 2000)
      : [];
    const progress =
      raw.progress && validPage(raw.progress.page) && validKey(raw.progress.key)
        ? raw.progress
        : null;
    return {
      version: 1,
      preferences,
      bookmarks,
      progress,
      recent: Array.isArray(raw.recent)
        ? raw.recent
            .filter(
              (v: unknown) =>
                Number.isInteger(v) && Number(v) > 0 && Number(v) <= 114,
            )
            .slice(0, 6)
        : [],
    };
  } catch {
    return defaultState;
  }
}
