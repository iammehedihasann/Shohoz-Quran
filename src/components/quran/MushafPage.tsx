import { memo, useLayoutEffect, useRef } from "react";
import type { QuranPage, QuranLine } from "../../types";
import { surahs } from "../../constants/quran";
const Line = memo(function Line({
  line,
  selected,
  onSelect,
}: {
  line: QuranLine;
  selected: string;
  onSelect: (key: string) => void;
}) {
  const el = useRef<HTMLDivElement>(null),
    inner = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    let active = true;
    const measure = () => { if (active && el.current && inner.current) {
      // Measure the unwrapped source line after the compatible font is ready.
      // Shrinking only horizontally preserves every source page and line.
      const width = el.current.clientWidth * line.width;
      const textWidth = Math.max(inner.current.scrollWidth, inner.current.offsetWidth);
      inner.current.style.transform =
        textWidth > width ? `scaleX(${width / textWidth})` : "";
    }};
    measure();
    void document.fonts.load('30px "Indopak"').then(() => document.fonts.ready).then(measure).catch(() => {});
    return () => { active = false; };
  }, [line]);
  if (line.type === "surah")
    return (
      <div className="mushaf-surah" dir="rtl">
        <span>✦</span>
        <span lang="ar">{line.text}</span>
        <span>✦</span>
      </div>
    );
  if (line.type === "basmallah")
    return (
      <div className="mushaf-basmalah" lang="ar" dir="rtl">
        {line.text}
      </div>
    );
  return (
    <div
      ref={el}
      className={`mushaf-line ${line.width < 1 ? "centered" : ""}`}
      dir="rtl"
    >
      <div ref={inner} className="mushaf-line-inner">
        {line.segments.map((segment, i) => (
          <span
            key={i}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(segment.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(segment.key);
              }
            }}
            aria-label={`Select ayah ${segment.key}`}
            className={selected === segment.key ? "ayah-selected" : ""}
          >
            {segment.text}
          </span>
        ))}
      </div>
    </div>
  );
});
export const MushafPage = memo(function MushafPage({
  page,
  selected,
  onSelect,
}: {
  page: QuranPage;
  selected: string;
  onSelect: (key: string) => void;
}) {
  return (
    <article
      className={`mushaf-page ${page.number <= 2 ? "opening-page" : ""}`}
      aria-label={`DigitalKhatt Indo-Pak Quran page ${page.number}`}
    >
      <div className="mushaf-running">
        <span>الجزء {page.juz.toLocaleString("ar")}</span>
        <span>{page.surahs.map((n) => surahs[n - 1].name).join(" · ")}</span>
      </div>
      <div className="mushaf-border">
        <div className="mushaf-lines" lang="ar">
          {page.lines.map((line) => (
            <Line
              key={line.number}
              line={line}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
      <div className="mushaf-page-number">
        <span>✧</span>
        {page.number.toLocaleString("ar")}
        <span>✧</span>
      </div>
    </article>
  );
});
