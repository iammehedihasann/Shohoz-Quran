import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Layers,
  Search,
  Headphones,
  ChevronRight,
  ShieldCheck,
  Feather,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { useTranslation } from "../constants/i18n";
import { surahs, surahAt } from "../constants/quran";
import { SurahCard } from "../components/quran/SurahCard";
import { Seo } from "../components/common/Seo";
function QuranArtwork() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="art-orbit orbit-one" />
      <div className="art-orbit orbit-two" />
      <span className="art-star star-one">✧</span>
      <span className="art-star star-two">✧</span>
      <div className="art-arch">
        <svg viewBox="0 0 300 330" className="arch-pattern">
          <defs>
            <pattern
              id="geom"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M24 0 48 24 24 48 0 24Z M0 0 48 48 M48 0 0 48"
                fill="none"
                stroke="currentColor"
                strokeWidth=".6"
              />
            </pattern>
          </defs>
          <rect width="300" height="330" fill="url(#geom)" />
        </svg>
        <span className="arch-emblem">۞</span>
      </div>
      <div className="book-shadow" />
      <div className="illustrated-book">
        <div className="book-cover">
          <div className="cover-frame">
            <span className="cover-flourish">✧</span>
            <div className="cover-medallion">
              <BookOpen size={45} strokeWidth={1} />
            </div>
            <span className="cover-subtitle">THE NOBLE QURAN</span>
            <span className="cover-flourish bottom">✧</span>
          </div>
        </div>
        <div className="book-pages" />
      </div>
      <span className="art-caption">
        <span /> A companion for every day
      </span>
    </div>
  );
}
export default function Home() {
  const { state } = useApp(),
    t = useTranslation(),
    navigate = useNavigate();
  const [tab, setTab] = useState<"surahs" | "juz">("surahs"),
    [q, setQ] = useState("");
  const last = state.progress,
    s = (last ? surahs[Number(last.key.split(':')[0])-1] : undefined) ?? surahAt(last?.page ?? 1);
  const popular = [1, 18, 36, 55, 67, 112];
  return (
    <>
      <Seo
        title="Read, reflect & reconnect"
        description="Read the complete Quran in the DigitalKhatt 610-page Indo-Pak 15-line edition. Explore 114 Surahs, Bengali and English translations, bookmarks and recitation."
      />
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-line" /> THE QURAN, CLOSE TO YOU
          </div>
          <p className="hero-greeting">{t.greeting}</p>
          <h1 id="hero-title">
            {t.title.split("\n")[0]}
            <br />
            <em>{t.title.split("\n")[1]}</em>
          </h1>
          <p className="hero-description">{t.intro}</p>
          <div className="hero-buttons">
            <Link to="/read/1" className="button primary">
              <BookOpen size={18} />
              {t.start}
              <ArrowRight size={17} />
            </Link>
            <Link to="/surahs" className="text-button">
              Explore Surahs <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="hero-assurance">
            <span>
              <ShieldCheck size={14} /> Sourced Quran text
            </span>
            <span>
              <Feather size={14} /> No accounts. Just reading.
            </span>
          </div>
        </div>
        <QuranArtwork />
      </section>
      <section className="journey-grid" aria-label="Your reading">
        <Link to={`/read/${last?.page ?? 1}`} className="continue-card">
          <div className="card-label">
            <span className="soft-icon">
              <BookOpen size={19} />
            </span>
            <span>{last ? t.continue : "YOUR NEXT QUIET MOMENT"}</span>
            <ArrowUpRight size={18} />
          </div>
          <div className="continue-content">
            <div>
              <h2>{last ? s.transliteration : "Begin with Al-Faatiha"}</h2>
              <p>
                {last
                  ? `Page ${last.page} of 610 · ${s.translation}`
                  : "The Opening · 7 ayahs · Page 1"}
              </p>
            </div>
            <span className="continue-play">
              <ArrowRight size={21} />
            </span>
          </div>
          <div className="reading-progress">
            <span style={{ width: `${((last?.page ?? 1) / 610) * 100}%` }} />
          </div>
          <div className="progress-label">
            <span>
              {last
                ? "Your place is saved automatically"
                : "Every journey begins with a single page"}
            </span>
            <span>{last ? `${Math.round((last.page / 610) * 100)}%` : ""}</span>
          </div>
        </Link>
        <Link to="/bookmarks" className="saved-card">
          <span className="soft-icon gold">
            <Bookmark size={20} />
          </span>
          <span className="card-label">{t.saved}</span>
          <h2>
            {state.bookmarks.length.toString().padStart(2, "0")}{" "}
            <span>bookmarks</span>
          </h2>
          <p>
            Your meaningful moments,
            <br />a little closer.
          </p>
          <ArrowUpRight size={19} className="saved-arrow" />
        </Link>
        <Link to="/juz" className="saved-card para-card">
          <span className="soft-icon">
            <Layers size={20} />
          </span>
          <span className="card-label">ONE PARA AT A TIME</span>
          <h2>
            30 <span>Paras / Juz</span>
          </h2>
          <p>
            A familiar path through
            <br />
            the complete Quran.
          </p>
          <ArrowUpRight size={19} className="saved-arrow" />
        </Link>
      </section>
      <section className="library-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">READ AT YOUR OWN PACE</span>
            <h2>{t.library}</h2>
          </div>
          <Link to="/surahs" className="text-button">
            Browse all 114 Surahs <ArrowRight size={16} />
          </Link>
        </div>
        <div className="library-toolbar">
          <div className="tabs" role="tablist" aria-label="Browse Quran">
            <button
              role="tab"
              aria-selected={tab === "surahs"}
              className={tab === "surahs" ? "selected" : ""}
              onClick={() => setTab("surahs")}
            >
              By Surah <span>114</span>
            </button>
            <button
              role="tab"
              aria-selected={tab === "juz"}
              className={tab === "juz" ? "selected" : ""}
              onClick={() => setTab("juz")}
            >
              By Para / Juz <span>30</span>
            </button>
          </div>
          <form
            className="search-box"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/search?q=${encodeURIComponent(q)}`);
            }}
          >
            <Search size={17} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a Surah, ayah, or keyword…"
              aria-label={t.search}
            />
            <kbd>↵</kbd>
          </form>
        </div>
        <div className="collection-label">
          <span>{tab === "surahs" ? t.popular : "FIND YOUR NEXT PARA"}</span>
          <span>
            {tab === "surahs"
              ? "A beautiful place to begin"
              : "30 parts. One complete Quran."}
          </span>
        </div>
        {tab === "surahs" ? (
          <div className="surah-grid">
            {popular.map((n) => (
              <SurahCard key={n} surah={surahs[n - 1]} />
            ))}
          </div>
        ) : (
          <div className="home-juz-grid">
            {Array.from({ length: 6 }, (_, i) => (
              <Link to={`/juz/${i + 1}`} key={i}>
                <span className="soft-icon">
                  <BookOpen size={18} />
                </span>
                <strong>Para {i + 1}</strong>
                <ChevronRight size={17} />
              </Link>
            ))}
          </div>
        )}
        <Link className="view-all" to={tab === "surahs" ? "/surahs" : "/juz"}>
          {tab === "surahs" ? "View all Surahs" : "View all 30 Paras"}{" "}
          <ArrowRight size={16} />
        </Link>
      </section>
      {state.recent.length > 0 && (
        <section className="recent-section">
          <h2>{t.recent}</h2>
          <div className="surah-grid">
            {state.recent.map((n) => (
              <SurahCard key={n} surah={surahs[n - 1]} />
            ))}
          </div>
        </section>
      )}
      <section className="reflection-banner">
        <div className="reflection-symbol">✧</div>
        <div>
          <span className="eyebrow">LET THE QURAN BE PART OF YOUR DAY</span>
          <h2>Small moments. Lasting connection.</h2>
          <p>
            A page in the morning. A Surah before rest. Begin where you are.
          </p>
        </div>
        <Link to="/read/1" className="button secondary">
          <Headphones size={17} />
          Read & listen <ArrowRight size={16} />
        </Link>
      </section>
      <div className="edition-note">
        <ShieldCheck size={16} />
        <span>
          DigitalKhatt Indo-Pak edition · 610 pages · Original page and line
          boundaries
        </span>
        <Link to="/about">
          Meet our sources <ArrowUpRight size={13} />
        </Link>
      </div>
    </>
  );
}
