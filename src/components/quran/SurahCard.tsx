import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { surahs } from "../../constants/quran";
import { useApp } from "../../contexts/AppContext";
export function SurahCard({ surah: s }: { surah: (typeof surahs)[number] }) {
  const { state } = useApp();
  return (
    <Link to={`/surah/${s.id}`} className="surah-card">
      <span className="surah-number">
        <span>{s.id.toString().padStart(2, "0")}</span>
      </span>
      <span className="surah-info">
        <strong>
          {state.preferences.language === "bn" ? s.bengali : s.transliteration}
        </strong>
        <span>
          {s.translation} <i>·</i> {s.total_verses} ayahs
        </span>
      </span>
      <span className="surah-arabic" lang="ar" dir="rtl">
        {s.name}
      </span>
      <ArrowUpRight size={15} className="card-arrow" />
    </Link>
  );
}
