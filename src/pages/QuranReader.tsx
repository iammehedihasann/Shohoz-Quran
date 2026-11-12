import {
  useParams,
  useNavigate,
  useSearchParams,
  Link,
} from "react-router-dom";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Maximize,
  Minimize,
  Settings2,
  ZoomIn,
  ZoomOut,
  BookOpen,
  Headphones,
  ExternalLink,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useTranslation } from "../constants/i18n";
import { pageFor, surahs, juz, surahAt, PAGE_COUNT } from "../constants/quran";
import { getPage, getVerses, prefetchPage } from "../services/quranService";
import {
  getTranslation,
  translationCacheKey,
  translationSourceUrl,
} from "../services/translationService";
import BengaliTranslationSelector from "../components/quran/BengaliTranslationSelector";
import ArabicFontSidebar from "../components/quran/ArabicFontSidebar";
import { QURAN_FONT_PROBE, requireArabicFont } from "../constants/arabicFonts";
import { requireBengaliTranslation } from "../constants/translations";
import type { QuranPage, Translation, Verse } from "../types";
import { MushafPage } from "../components/quran/MushafPage";
import { Loading, ErrorState } from "../components/common/States";
import { Seo } from "../components/common/Seo";
const AudioPlayer = lazy(() => import("../components/audio/AudioPlayer"));
export default function QuranReader({
  kind = "page",
}: {
  kind?: "page" | "surah" | "juz";
}) {
  const params = useParams(),
    navigate = useNavigate(),
    [query] = useSearchParams(),
    t = useTranslation();
  const {
    state,
    ready,
    initialPage,
    saveProgress,
    toggleBookmark,
    setPreferences,
  } = useApp();
  const prefs = state.preferences;
  const arabicFont = requireArabicFont(prefs.arabicFont);
  const number = Number(params.number);
  const pageNumber = Number(
    kind === "surah"
      ? pageFor(number)
      : kind === "juz"
        ? juz[number - 1]?.page
        : number,
  );
  const valid =
    Number.isInteger(number) &&
    !!pageNumber &&
    pageNumber >= 1 &&
    pageNumber <= PAGE_COUNT;
  const initialKey =
    query.get("ayah") ??
    (kind === "surah"
      ? `${number}:1`
      : kind === "juz"
        ? `${juz[number - 1]?.surah}:${juz[number - 1]?.ayah}`
        : "");
  const [page, setPage] = useState<QuranPage | undefined>(
      initialPage?.number === pageNumber ? initialPage : undefined,
    ),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [selected, setSelected] = useState(
      initialKey || initialPage?.keys[0] || "1:1",
    );
  const [font, setFont] = useState<"loading" | "ready" | "error">("ready"),
    [displaySettings, setDisplaySettings] = useState(false),
    [displayFontSettings, setDisplayFontSettings] = useState(false),
    [full, setFull] = useState(false),
    [pageInput, setPageInput] = useState(String(pageNumber ?? 1));
  const [translations, setTranslations] = useState<Record<string, Translation>>(
      {},
    ),
    [translationError, setTranslationError] = useState(""),
    [verseError, setVerseError] = useState(""),
    [verses, setVerses] = useState<Verse[]>([]);
  const reader = useRef<HTMLDivElement>(null),
    touch = useRef<{ x: number; y: number } | null>(null);
  const failedFont = useRef<string | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(660);
  const pageScale =
    (Math.min(1, Math.max(260, viewportWidth - 16) / 660) * prefs.zoom) / 100;
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setViewportWidth(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, [page, font, prefs.mode]);
  const s =
    surahs[
      (kind === "surah"
        ? number
        : (page?.surahs[0] ?? surahAt(pageNumber ?? 1).id)) - 1
    ] ?? surahs[0];
  const title =
    kind === "surah"
      ? surahs[number - 1]?.transliteration
      : kind === "juz"
        ? `Para ${number}`
        : `Page ${pageNumber}`;
  useEffect(() => {
    let active = true;
    if (!valid) return;
    setPageInput(String(pageNumber));
    setError("");
    if (page?.number !== pageNumber) setPage(undefined);
    getPage(pageNumber)
      .then((p) => {
        if (!active) return;
        setPage(p);
        setSelected((old) =>
          initialKey && p.keys.includes(initialKey)
            ? initialKey
            : p.keys.includes(old)
              ? old
              : p.keys[0],
        );
        prefetchPage(pageNumber + 1);
        prefetchPage(pageNumber - 1);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [pageNumber, retry, initialKey, valid]);
  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout>;
    setFont("loading");
    const fontSpec = `32px "${arabicFont.family}"`;
    // Browsers retain a failed CSS FontFace. A fresh face permits a real retry.
    const loading = failedFont.current === arabicFont.id
      ? new FontFace(arabicFont.family, `url("${arabicFont.file}") format("woff2")`).load().then(face => {
          if (active) document.fonts.add(face);
          return [face];
        })
      : document.fonts.load(fontSpec, QURAN_FONT_PROBE);
    Promise.race([
      loading,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Font loading timed out.")),
          15000,
        );
      }),
    ])
      .then((fonts) => {
        if (active) {
          const loaded =
            fonts.length > 0 &&
            document.fonts.check(fontSpec, QURAN_FONT_PROBE);
          failedFont.current = loaded ? null : arabicFont.id;
          setFont(loaded ? "ready" : "error");
          if (loaded)
            document.documentElement.classList.add("quran-font-ready");
        }
      })
      .catch(() => {
        if (active) {
          failedFont.current = arabicFont.id;
          setFont("error");
        }
      })
      .finally(() => {
        clearTimeout(timeout);
      });
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [arabicFont, retry]);
  useEffect(() => {
    if (page && ready && page.keys.includes(selected))
      saveProgress(page.number, selected, Number(selected.split(":")[0]));
  }, [page, selected, ready, saveProgress]);
  const chooseVerse = useCallback(
    (key: string) => {
      const [cs, ca] = key.split(":").map(Number),
        p = pageFor(cs, ca);
      if (!p) return;
      setSelected(key);
      if (p !== pageNumber && !page?.keys.includes(key))
        navigate(`/read/${p}?ayah=${key}`);
    },
    [pageNumber, navigate, page],
  );
  const go = useCallback(
    (p: number) => {
      if (p >= 1 && p <= 610) navigate(`/read/${p}`);
    },
    [navigate],
  );
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        /INPUT|SELECT|TEXTAREA/.test((e.target as HTMLElement).tagName)
      )
        return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(pageNumber + 1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(pageNumber - 1);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [pageNumber, go]);
  useEffect(() => {
    const cb = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", cb);
    return () => document.removeEventListener("fullscreenchange", cb);
  }, []);
  useEffect(() => {
    if (prefs.mode !== "continuous" || !valid) return;
    let active = true;
    setVerses([]);
    setVerseError("");
    getVerses(pageNumber)
      .then((v) => {
        if (active) setVerses(v);
      })
      .catch((e) => {
        if (active) setVerseError(e.message);
      });
    return () => {
      active = false;
    };
  }, [prefs.mode, pageNumber, valid, retry]);
  useEffect(() => {
    setTranslationError("");
    setTranslations({});
    if (!page || page.number !== pageNumber || prefs.translation === "none")
      return;
    let active = true;
    const langs: prefsLanguage[] =
      prefs.translation === "both" ? ["en", "bn"] : [prefs.translation];
    Promise.all(
      langs.flatMap((lang) =>
        page.surahs.map((id) =>
          getTranslation(lang, id, prefs.bengaliTranslation).then(
            (v) =>
              [
                translationCacheKey(lang, id, prefs.bengaliTranslation),
                v,
              ] as const,
          ),
        ),
      ),
    )
      .then((entries) => {
        if (active) setTranslations(Object.fromEntries(entries));
      })
      .catch((e) => {
        if (active) setTranslationError(e.message);
      });
    return () => {
      active = false;
    };
  }, [page, pageNumber, prefs.translation, prefs.bengaliTranslation, retry]);
  type prefsLanguage = "en" | "bn";
  if (!valid)
    return (
      <ErrorState
        message="That Quran location does not exist. Choose a page from 1 to 610."
        retry={() => navigate("/read/1")}
      />
    );
  const bookmarked = state.bookmarks.some((b) => b.id === `page-${pageNumber}`);
  const verseList = page ? verses.filter((v) => page.keys.includes(v.key)) : [];
  const renderTranslation = (key: string) => {
    const [cs, ca] = key.split(":").map(Number);
    return (
      <>
        {(["en", "bn"] as const)
          .filter(
            (l) => prefs.translation === l || prefs.translation === "both",
          )
          .map((l) => {
            const data =
                translations[
                  translationCacheKey(l, cs, prefs.bengaliTranslation)
                ],
              v = data?.verses.find((v) => v.id === ca);
            return (
              <div key={l} className="translation-copy" lang={l}>
                <span className="translation-edition">
                  {data?.edition ??
                    (l === "bn"
                      ? requireBengaliTranslation(prefs.bengaliTranslation)
                          .label
                      : "English translation")}
                </span>
                <p>
                  {v?.translation ??
                    (translationError
                      ? "Translation could not load. Please try again."
                      : data
                        ? "Translation unavailable for this ayah."
                        : "Loading translation…")}
                </p>
                {v?.footnotes && (
                  <details>
                    <summary>Footnotes</summary>
                    <p className="footnotes">
                      {v.footnotes.replace(/<[^>]*>/g, "")}
                    </p>
                    <a
                      href={translationSourceUrl(
                        l,
                        cs,
                        ca,
                        prefs.bengaliTranslation,
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View original & report a correction{" "}
                      <ExternalLink size={12} />
                    </a>
                  </details>
                )}
              </div>
            );
          })}
      </>
    );
  };
  return (
    <div ref={reader} className={`reader-view ${full ? "immersive" : ""}`}>
      <Seo
        canonicalPath={`/read/${pageNumber}`}
        title={`${title ?? "Quran reader"} — ${s.transliteration}`}
        description={`Read ${title}, ${s.transliteration}, in the DigitalKhatt 610-page Indo-Pak Quran. Original 15-line layout, Bengali and English translations and ayah recitation.`}
      />
      <div className="reader-heading">
        <div>
          <span className="eyebrow">A MOMENT WITH THE QURAN</span>
          <h1>
            {kind === "surah"
              ? surahs[number - 1].transliteration
              : s.transliteration}
            <span className="reader-arabic" lang="ar">
              {s.name}
            </span>
          </h1>
          <p>
            Page {pageNumber} of 610 · Para {page?.juz ?? "…"}
          </p>
        </div>
        <div className="reader-actions">
          <button
            className={`button secondary ${prefs.audio ? "selected" : ""}`}
            onClick={() => setPreferences({ audio: !prefs.audio })}
          >
            <Headphones size={16} />
            {prefs.audio ? "Hide" : "Show"} audio
          </button>
          <button
            className={`icon-button ${bookmarked ? "selected" : ""}`}
            aria-label={bookmarked ? "Remove page bookmark" : "Bookmark page"}
            onClick={() => toggleBookmark(pageNumber)}
          >
            <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} />
          </button>
          <button
            className="icon-button"
            aria-label="Reading display settings"
            aria-expanded={displaySettings}
            onClick={() => setDisplaySettings((v) => !v)}
          >
            <Settings2 size={20} />
          </button>
          <button
            className="icon-button fullscreen-button"
            aria-label={full ? "Exit full screen" : "Enter full screen"}
            onClick={() => {
              if (full) {
                if (document.fullscreenElement) void document.exitFullscreen();
                else setFull(false);
              } else if (reader.current?.requestFullscreen)
                void reader.current
                  .requestFullscreen()
                  .catch(() => setFull(true));
              else setFull(true);
            }}
          >
            {full ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>
      <div className="reader-toolbar">
        <label>
          <span className="sr-only">Select Surah</span>
          <select
            aria-label="Select Surah"
            value={s.id}
            onChange={(e) => navigate(`/surah/${e.target.value}`)}
          >
            {surahs.map((s) => (
              <option value={s.id} key={s.id}>
                {s.id}. {s.transliteration}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Select Para</span>
          <select
            aria-label="Select Para"
            value={page?.juz ?? 1}
            onChange={(e) => navigate(`/juz/${e.target.value}`)}
          >
            {juz.map((j) => (
              <option value={j.number} key={j.number}>
                Para {j.number}
              </option>
            ))}
          </select>
        </label>
        <form
          className="page-picker"
          onSubmit={(e) => {
            e.preventDefault();
            go(Number(pageInput));
          }}
        >
          <label htmlFor="page-input">{t.page}</label>
          <input
            id="page-input"
            type="number"
            min={1}
            max={610}
            required
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
          />
          <span>/ 610</span>
          <button type="submit" aria-label="Go to page">
            <ArrowRight size={16} />
          </button>
        </form>
        <div className="reading-modes">
          <button
            className={prefs.mode === "page" ? "selected" : ""}
            onClick={() => setPreferences({ mode: "page" })}
          >
            <BookOpen size={15} />
            Mushaf
          </button>
          <button
            className={prefs.mode === "continuous" ? "selected" : ""}
            onClick={() => setPreferences({ mode: "continuous" })}
          >
            Verse by verse
          </button>
        </div>
        {prefs.audio && (
          <Suspense fallback={<Loading />}>
            <AudioPlayer verseKey={selected} onVerse={chooseVerse} />
          </Suspense>
        )}
      </div>

      {displaySettings && (
        <div
          className="reader-settings"
          role="region"
          aria-label="Reading settings"
        >
          <label>
            {t.translation}
            <select
              value={prefs.translation}
              onChange={(e) =>
                setPreferences({
                  translation: e.target.value as typeof prefs.translation,
                })
              }
            >
              <option value="none">{t.none}</option>
              <option value="en">English · Pickthall</option>
              <option value="bn">বাংলা</option>
              <option value="both">{t.both}</option>
            </select>
          </label>
          {(prefs.translation === "bn" || prefs.translation === "both") && (
            <BengaliTranslationSelector id="reader-bengali-edition" compact />
          )}
          <label className="reader-ayah-control">
            Ayah
            <select
              aria-label="Select ayah"
              value={
                page?.keys.includes(selected) ? selected : (page?.keys[0] ?? "")
              }
              onChange={(e) => chooseVerse(e.target.value)}
            >
              {page?.keys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <div className="zoom-control" role="group" aria-label="Page zoom">
            <button
              className="icon-button"
              aria-label="Zoom out"
              disabled={prefs.zoom <= 75}
              onClick={() =>
                setPreferences({ zoom: Math.max(75, prefs.zoom - 10) })
              }
            >
              <ZoomOut size={18} />
            </button>
            <span>{prefs.zoom}%</span>
            <button
              className="icon-button"
              aria-label="Zoom in"
              disabled={prefs.zoom >= 200}
              onClick={() =>
                setPreferences({ zoom: Math.min(200, prefs.zoom + 10) })
              }
            >
              <ZoomIn size={18} />
            </button>
          </div>

          <Link className="reader-all-settings" to="/settings">
            All settings
          </Link>
          <button
            type="button"
            className="button secondary"
            aria-haspopup="dialog"
            aria-expanded={displayFontSettings}
            onClick={() => setDisplayFontSettings(true)}
          >
            Arabic Font
          </button>
        </div>
      )}
      {displayFontSettings && (
        <ArabicFontSidebar onClose={() => setDisplayFontSettings(false)} />
      )}
      {error ? (
        <ErrorState message={error} retry={() => setRetry((v) => v + 1)} />
      ) : !page ? (
        <Loading />
      ) : font === "error" ? (
        <ErrorState
          message="The compatible Indo-Pak Quran font could not load. The text is hidden to prevent incorrect symbols. Retry when connected."
          retry={() => setRetry((v) => v + 1)}
        />
      ) : font === "loading" ? (
        <Loading />
      ) : (
        <div
          className={`reader-content ${prefs.translation !== "none" && prefs.mode === "page" ? "with-translations" : ""}`}
        >
          <div>
            <div
              ref={viewport}
              className="page-viewport"
              style={{
                touchAction:
                  prefs.mode === "page" && prefs.zoom <= 100
                    ? "pan-y pinch-zoom"
                    : undefined,
              }}
              onTouchStart={(e) => {
                touch.current =
                  prefs.mode === "page" &&
                  prefs.zoom <= 100 &&
                  e.touches.length === 1
                    ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
                    : null;
              }}
              onTouchEnd={(e) => {
                const start = touch.current;
                touch.current = null;
                if (!start || prefs.mode !== "page" || prefs.zoom > 100) return;
                const dx = e.changedTouches[0].clientX - start.x,
                  dy = e.changedTouches[0].clientY - start.y;
                if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.5)
                  go(pageNumber + (dx < 0 ? 1 : -1));
              }}
              onTouchCancel={() => {
                touch.current = null;
              }}
            >
              {prefs.mode === "page" ? (
                <div
                  className="page-zoom-wrapper"
                  style={{
                    width: 660 * pageScale,
                    height: 1040 * pageScale,
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: 660,
                      transform: `scale(${pageScale})`,
                      transformOrigin: "top left",
                    }}
                  >
                    <MushafPage
                      page={page}
                      selected={selected}
                      onSelect={chooseVerse}
                    />
                    <button
                      type="button"
                      className="mushaf-page-turn"
                      style={{ left: 0 }}
                      aria-label="Next Mushaf page"
                      title="Next page"
                      disabled={pageNumber >= PAGE_COUNT}
                      onClick={() => go(pageNumber + 1)}
                    />
                    <button
                      type="button"
                      className="mushaf-page-turn"
                      style={{ right: 0 }}
                      aria-label="Previous Mushaf page"
                      title="Previous page"
                      disabled={pageNumber <= 1}
                      onClick={() => go(pageNumber - 1)}
                    />
                  </div>
                </div>
              ) : (
                <div className="continuous-verses">
                  {translationError && prefs.translation !== "none" && (
                    <ErrorState
                      message={translationError}
                      retry={() => setRetry((v) => v + 1)}
                    />
                  )}
                  {verseError ? (
                    <ErrorState
                      message={verseError}
                      retry={() => setRetry((v) => v + 1)}
                    />
                  ) : verseList.length === 0 ? (
                    <Loading />
                  ) : (
                    verseList.map((v) => (
                      <article
                        className={`verse-card ${selected === v.key ? "current" : ""}`}
                        key={v.key}
                      >
                        <div className="verse-card-head">
                          <button onClick={() => chooseVerse(v.key)}>
                            {v.key}
                          </button>
                          <button
                            className="icon-button"
                            aria-label={`Bookmark ayah ${v.key}`}
                            onClick={() => toggleBookmark(v.page, v.key)}
                          >
                            <Bookmark
                              size={16}
                              fill={
                                state.bookmarks.some((b) => b.key === v.key)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          </button>
                        </div>
                        <p
                          lang="ar"
                          dir="rtl"
                          className="continuous-arabic"
                          style={{
                            fontSize: prefs.fontSize,
                            fontFamily: `"${arabicFont.family}", serif`,
                          }}
                        >
                          {v.text}
                        </p>
                        {renderTranslation(v.key)}
                      </article>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="page-controls">
              <button
                className="button secondary"
                disabled={pageNumber >= 610}
                onClick={() => go(pageNumber + 1)}
              >
                <ArrowLeft size={16} />
                {t.next}
              </button>
              <span>
                Page <strong>{pageNumber}</strong> of 610
              </span>
              <button
                className="button secondary"
                disabled={pageNumber <= 1}
                onClick={() => go(pageNumber - 1)}
              >
                {t.previous}
                <ArrowRight size={16} />
              </button>
            </div>
            <p className="reader-tip">
              Use ← for the next page and → for the previous page. Tap an ayah
              to select it.
            </p>
            <div className="selected-ayah-actions">
              <span>
                Selected ayah <strong>{selected}</strong>
              </span>
              <button
                className="button secondary"
                onClick={() => toggleBookmark(pageNumber, selected)}
              >
                <Bookmark
                  size={15}
                  fill={
                    state.bookmarks.some((b) => b.key === selected)
                      ? "currentColor"
                      : "none"
                  }
                />
                {state.bookmarks.some((b) => b.key === selected)
                  ? "Remove ayah bookmark"
                  : "Bookmark ayah"}
              </button>
            </div>
          </div>
          {prefs.translation !== "none" && prefs.mode === "page" && (
            <aside className="translation-panel">
              <h2>Translations</h2>
              <p className="muted">Translations of the meanings</p>
              {translationError ? (
                <ErrorState
                  message={translationError}
                  retry={() => setRetry((v) => v + 1)}
                />
              ) : (
                page.keys.map((key) => (
                  <article
                    key={key}
                    className={`translated-ayah ${selected === key ? "current" : ""}`}
                  >
                    <div className="verse-card-head">
                      <button onClick={() => chooseVerse(key)}>
                        Ayah {key}
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Bookmark ayah ${key}`}
                        onClick={() => toggleBookmark(pageNumber, key)}
                      >
                        <Bookmark
                          size={15}
                          fill={
                            state.bookmarks.some((b) => b.key === key)
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>
                    </div>
                    {renderTranslation(key)}
                  </article>
                ))
              )}
            </aside>
          )}
        </div>
      )}

      {/* <div className="reader-source-note">
        <Link to="/about">Edition & source information</Link>
        <span>
          Original 15-line boundaries are preserved. Zoom or pan to read
          comfortably.
        </span>
        {pageNumber === 1 && (
          <span>
            Al-Fatiha’s printed Indo-Pak numbering differs; translation and
            audio references use standard Hafs numbering.
          </span>
        )}
      </div> */}
    </div>
  );
}
