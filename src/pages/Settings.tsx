import { useState } from "react";
import {
  Sun,
  Moon,
  Download,
  Check,
  HardDrive,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useTranslation } from "../constants/i18n";
import { Seo } from "../components/common/Seo";
export default function Settings() {
  const { state, setPreferences } = useApp(),
    t = useTranslation(),
    p = state.preferences;
  const [download, setDownload] = useState<{
    done: number;
    total: number;
    error?: string;
    complete?: boolean;
  } | null>(null);
  const downloadOffline = async () => {
    setDownload({ done: 0, total: 610 });
    try {
      if (!("caches" in window) || !("serviceWorker" in navigator))
        throw new Error(
          "Offline storage requires a supported browser and HTTPS (or localhost).",
        );
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration)
        throw new Error(
          "Offline downloads are available in the production build after the service worker installs.",
        );
      await navigator.serviceWorker.ready;
      const cache = await caches.open("hafezi-data-v1");
      await cache.add("/fonts/DigitalKhattIndoPak.woff2");
      for (let i = 1; i <= 610; i += 8) {
        await Promise.all(
          Array.from(
            { length: Math.min(8, 611 - i) },
            (_, k) => `/data/pages/${i + k}.json`,
          ).map(async (url) => {
            if (!(await cache.match(url))) {
              const response = await fetch(url);
              if (!response.ok)
                throw new Error("A page could not download. Please retry.");
              await cache.put(url, response);
            }
          }),
        );
        setDownload({ done: Math.min(610, i + 7), total: 610 });
      }
      setDownload({ done: 610, total: 610, complete: true });
    } catch (e) {
      setDownload((d) => ({
        ...d!,
        error:
          e instanceof Error ? e.message : "Download failed. Please retry.",
      }));
    }
  };
  return (
    <>
      <Seo
        title="Reading settings"
        description="Choose your Quran reading theme, language, translations, font size, zoom and offline reading preferences."
        noindex
      />
      <div className="page-heading">
        <span className="eyebrow">MAKE YOURSELF AT HOME</span>
        <h1>{t.settings}</h1>
        <p>
          A reading experience that feels right for you. Changes save
          automatically.
        </p>
      </div>
      <div className="settings-layout">
        <section className="settings-panel">
          <h2>Display & language</h2>
          <div className="setting-row">
            <div>
              <strong>Appearance</strong>
              <p>Choose a comfortable reading environment.</p>
            </div>
            <div className="segmented">
              <button
                className={p.theme === "light" ? "selected" : ""}
                onClick={() => setPreferences({ theme: "light" })}
              >
                <Sun size={16} />
                {t.light}
              </button>
              <button
                className={p.theme === "dark" ? "selected" : ""}
                onClick={() => setPreferences({ theme: "dark" })}
              >
                <Moon size={16} />
                {t.dark}
              </button>
            </div>
          </div>
          <div className="setting-row">
            <label htmlFor="setting-language">
              <strong>{t.language}</strong>
              <p>Navigation and essential interface labels.</p>
            </label>
            <select
              id="setting-language"
              value={p.language}
              onChange={(e) =>
                setPreferences({
                  language: e.target.value as typeof p.language,
                })
              }
            >
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
              <option value="ar">العربية</option>
            </select>
          </div>
          <div className="setting-row">
            <label htmlFor="setting-translation">
              <strong>{t.translation}</strong>
              <p>Displayed separately from the original Mushaf.</p>
            </label>
            <select
              id="setting-translation"
              value={p.translation}
              onChange={(e) =>
                setPreferences({
                  translation: e.target.value as typeof p.translation,
                })
              }
            >
              <option value="none">{t.none}</option>
              <option value="en">English · Pickthall</option>
              <option value="bn">বাংলা · Abu Bakr Zakaria</option>
              <option value="both">{t.both}</option>
            </select>
          </div>
        </section>
        <section className="settings-panel">
          <h2>Reading preferences</h2>
          <div className="setting-row">
            <label htmlFor="setting-mode">
              <strong>Reading mode</strong>
              <p>Fixed page layout or flowing ayahs.</p>
            </label>
            <select
              id="setting-mode"
              value={p.mode}
              onChange={(e) =>
                setPreferences({ mode: e.target.value as typeof p.mode })
              }
            >
              <option value="page">15-line Mushaf</option>
              <option value="continuous">Verse by verse</option>
            </select>
          </div>
          <div className="setting-row">
            <label htmlFor="setting-size">
              <strong>Verse-by-verse font size</strong>
              <p>Fixed Mushaf line boundaries stay preserved.</p>
            </label>
            <div className="range-setting">
              <input
                id="setting-size"
                type="range"
                min={24}
                max={56}
                value={p.fontSize}
                onChange={(e) =>
                  setPreferences({ fontSize: Number(e.target.value) })
                }
              />
              <span>{p.fontSize}px</span>
            </div>
          </div>
          <div className="setting-row">
            <label htmlFor="setting-zoom">
              <strong>Quran page zoom</strong>
              <p>Pan horizontally on smaller screens.</p>
            </label>
            <div className="range-setting">
              <input
                id="setting-zoom"
                type="range"
                min={75}
                max={200}
                step={5}
                value={p.zoom}
                onChange={(e) =>
                  setPreferences({ zoom: Number(e.target.value) })
                }
              />
              <span>{p.zoom}%</span>
            </div>
          </div>
          <div className="setting-row">
            <label htmlFor="setting-audio">
              <strong>Audio controls</strong>
              <p>Listen to verified verse recordings.</p>
            </label>
            <input
              id="setting-audio"
              type="checkbox"
              className="switch"
              checked={p.audio}
              onChange={(e) => setPreferences({ audio: e.target.checked })}
            />
          </div>
        </section>
        <section className="settings-panel offline-panel">
          <div className="offline-icon">
            <HardDrive size={24} />
          </div>
          <div>
            <h2>Take your reading offline</h2>
            <p>
              Download all 610 Mushaf pages and the compatible font. The app
              shell caches after your first visit. Translations cache as you
              open them; audio requires internet.
            </p>
            <button
              className="button primary"
              disabled={!!download && !download.error && !download.complete}
              onClick={downloadOffline}
            >
              {download?.complete ? (
                <Check size={17} />
              ) : (
                <Download size={17} />
              )}{" "}
              {download?.complete
                ? "Pages downloaded"
                : download && !download.error
                  ? `Downloading ${download.done} / 610`
                  : "Download Quran pages"}
            </button>
            {download && (
              <>
                <progress max={610} value={download.done} />
                {download.error && (
                  <p role="alert" className="audio-error">
                    {download.error}
                  </p>
                )}
                {download.complete && (
                  <p className="success-message">
                    All Mushaf pages and font saved. Keep this browser’s storage
                    to retain them.
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      </div>
      <p className="privacy-caption">
        <ShieldCheck size={16} />
        Your preferences and bookmarks stay in your browser. No account or
        tracking.
      </p>
    </>
  );
}
