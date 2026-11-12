import { useState, useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { surahs } from "../constants/quran";
import { SurahCard } from "../components/quran/SurahCard";
import { Seo } from "../components/common/Seo";
import { useTranslation } from "../constants/i18n";
export default function Surahs() {
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    t = useTranslation();
  const results = useMemo(
    () =>
      surahs.filter(
        (s) =>
          (filter === "all" || s.type === filter) &&
          `${s.id} ${s.name} ${s.transliteration} ${s.translation} ${s.bengali}`
            .toLowerCase()
            .includes(query.toLowerCase().trim()),
      ),
    [query, filter],
  );
  return (
    <>
      <Seo
        title="All 114 Surahs"
        description="Browse all 114 Quran Surahs by English, Bengali and Arabic name. Open each Surah at its first ayah in the DigitalKhatt Indo-Pak Quran."
      />
      <div className="page-heading">
        <span className="eyebrow">THE COMPLETE QURAN</span>
        <h1>{t.surahs}</h1>
        <p>
          114 chapters. A lifetime of guidance. Find your place in the Quran.
        </p>
      </div>
      <div className="listing-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search Surahs"
            placeholder="Search by name or Surah number…"
          />
        </div>
        <label className="filter-select">
          <SlidersHorizontal size={17} />
          <span className="sr-only">Revelation classification</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Surahs</option>
            <option value="meccan">Makki</option>
            <option value="medinan">Madani</option>
          </select>
        </label>
      </div>
      <div className="results-count">
        {results.length} SURAHS <span>In Quran order</span>
      </div>
      <div className="surah-grid listing-grid">
        {results.map((s) => (
          <SurahCard key={s.id} surah={s} />
        ))}
      </div>
      {!results.length && (
        <p className="empty-message">
          No Surahs match that search. Try another spelling or number.
        </p>
      )}
      <p className="data-note">
        Names and revelation classification: Quran JSON / Al Quran Cloud.
        Revelation classifications follow the source’s convention.
      </p>
    </>
  );
}
