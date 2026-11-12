import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { juz, surahs } from "../constants/quran";
import { Seo } from "../components/common/Seo";
import { useTranslation } from "../constants/i18n";
export default function Juz() {
  const t = useTranslation();
  return (
    <>
      <Seo
        title="All 30 Paras / Juz"
        description="Explore all 30 Quran Paras with verified starting Surah and ayah references and page numbers for the 610-page DigitalKhatt Indo-Pak edition."
      />
      <div className="page-heading">
        <span className="eyebrow">ONE PART AT A TIME</span>
        <h1>{t.juz}</h1>
        <p>A familiar path through the Quran, divided into 30 parts.</p>
      </div>
      <div className="juz-grid">
        {juz.map((j) => (
          <Link to={`/juz/${j.number}`} className="juz-card" key={j.number}>
            <div className="juz-card-top">
              <span className="soft-icon">
                <BookOpen size={20} />
              </span>
              <span>PARA {String(j.number).padStart(2, "0")}</span>
              <ArrowUpRight size={17} />
            </div>
            <h2 lang="ar" dir="rtl" className="juz-name">
              {j.name}
            </h2>
            <strong>{surahs[j.surah - 1].transliteration}</strong>
            <p>
              Ayah {j.surah}:{j.ayah}
              <span>Page {j.page}</span>
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
