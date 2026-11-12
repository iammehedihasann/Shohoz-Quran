import { Link } from "react-router-dom";
import { Bookmark, ArrowRight, Trash2 } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useTranslation } from "../constants/i18n";
import { surahAt, surahs } from "../constants/quran";
import { Seo } from "../components/common/Seo";
export default function Bookmarks() {
  const { state, toggleBookmark, ready } = useApp(),
    t = useTranslation();
  return (
    <>
      <Seo
        title="Your bookmarks"
        description="Your Quran page and ayah bookmarks, saved privately in this browser."
        noindex
      />
      <div className="page-heading">
        <span className="eyebrow">KEEP WHAT MOVES YOU</span>
        <h1>{t.bookmarks}</h1>
        <p>A place for the pages and ayahs you want to return to.</p>
      </div>
      {state.bookmarks.length ? (
        <div className="bookmarks-list">
          {state.bookmarks.map((b) => {
            const s = b.key
              ? surahs[Number(b.key.split(":")[0]) - 1]
              : surahAt(b.page);
            return (
              <article className="bookmark-row" key={b.id}>
                <span className="soft-icon gold">
                  <Bookmark size={20} />
                </span>
                <Link to={`/read/${b.page}${b.key ? `?ayah=${b.key}` : ""}`}>
                  <strong>{s.transliteration}</strong>
                  <p>
                    Page {b.page}
                    {b.key ? ` · Ayah ${b.key}` : ""}
                  </p>
                </Link>
                <span className="bookmark-date">
                  {new Date(b.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    timeZone: "Asia/Dhaka",
                  })}
                </span>
                <button
                  className="icon-button"
                  aria-label={`Remove ${b.key ? `ayah ${b.key}` : `page ${b.page}`} bookmark`}
                  onClick={() => toggleBookmark(b.page, b.key)}
                >
                  <Trash2 size={17} />
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">
            <Bookmark size={32} strokeWidth={1.3} />
          </span>
          <h2>{ready ? "Your collection is waiting" : "Your bookmarks"}</h2>
          <p>
            Tap the bookmark icon while reading to save a page or an ayah.
            <br />
            Your bookmarks stay right here, in this browser.
          </p>
          <Link to="/read/1" className="button primary">
            {t.start}
            <ArrowRight size={17} />
          </Link>
        </div>
      )}
    </>
  );
}
