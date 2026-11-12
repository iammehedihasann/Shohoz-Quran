import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search as SearchIcon, ArrowRight } from "lucide-react";
import { surahs, pageFor } from "../constants/quran";
import type { Verse } from "../types";
import { Seo } from "../components/common/Seo";
import { SurahCard } from "../components/quran/SurahCard";
import { Loading } from "../components/common/States";
export default function Search() {
  const [params, setParams] = useSearchParams(),
    q = params.get("q") ?? "";
  const [input, setInput] = useState(q),
    [results, setResults] = useState<(Verse & { en: string; bn: string })[]>(
      [],
    ),
    [busy, setBusy] = useState(false),
    [total, setTotal] = useState(0),
    [error, setError] = useState("");
  const worker = useRef<Worker | null>(null),
    request = useRef(0);
  const matched = surahs.filter((s) =>
    `${s.id} ${s.transliteration} ${s.name} ${s.bengali}`
      .toLowerCase()
      .includes(q.toLowerCase().trim()),
  );
  const reference = q.match(/^(\d{1,3})\s*[:：]\s*(\d{1,3})$/),
    direct = reference
      ? pageFor(Number(reference[1]), Number(reference[2]))
      : undefined;
  const pageMatch = q.match(/^(?:page|পৃষ্ঠা|صفحة)\s*(\d+)$/i);
  const directPage =
    pageMatch && Number(pageMatch[1]) >= 1 && Number(pageMatch[1]) <= 610
      ? Number(pageMatch[1])
      : undefined;
  useEffect(() => {
    setInput(q);
    if (!q.trim() || reference || directPage) {
      request.current++;
      setResults([]);
      setTotal(0);
      setBusy(false);
      return;
    }
    const id = ++request.current;
    setBusy(true);
    setError("");
    const timeout = setTimeout(() => {
      worker.current ??= new Worker(
        new URL("../services/search.worker.ts", import.meta.url),
        { type: "module" },
      );
      worker.current.onmessage = (e) => {
        if (e.data.id !== request.current) return;
        setBusy(false);
        setResults(e.data.results ?? []);
        setTotal(e.data.total ?? 0);
        setError(e.data.error ?? "");
      };
      worker.current.onerror = () => {
        setBusy(false);
        setError("Search could not start. Please reload and try again.");
      };
      worker.current.postMessage({ query: q, id });
    }, 250);
    return () => clearTimeout(timeout);
  }, [q]);
  useEffect(() => () => worker.current?.terminate(), []);
  return (
    <>
      <Seo
        title="Search the Quran"
        description="Search Quran Surahs, Arabic text, Bengali and English translations, ayah references and page numbers."
        noindex
      />
      <div className="page-heading">
        <span className="eyebrow">FIND A VERSE. FIND A CONNECTION.</span>
        <h1>Search the Quran</h1>
        <p>
          Search in Arabic, Bengali, or English. Go directly to an ayah or page.
        </p>
      </div>
      <form
        className="search-box large-search"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(input.trim() ? { q: input.trim() } : {});
        }}
      >
        <SearchIcon size={21} />
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Try ‘mercy’, ‘2:255’, or ‘page 10’"
          aria-label="Search Quran text, translation or reference"
        />
        <button className="button primary" type="submit">
          Search
          <ArrowRight size={16} />
        </button>
      </form>
      {!q ? (
        <div className="search-suggestions">
          <span>START WITH A FAMILIAR PLACE</span>
          <div>
            {["Al-Faatiha", "2:255", "mercy", "রহমত", "page 1"].map((s) => (
              <button key={s} onClick={() => setParams({ q: s })}>
                {s}
              </button>
            ))}
          </div>
          <p>
            Arabic search ignores vowel marks while preserving the original
            displayed text.
            <br />
            The local search index downloads only when you submit a keyword.
          </p>
        </div>
      ) : (
        <div className="search-results">
          {direct && (
            <Link
              className="direct-result"
              to={`/read/${direct}?ayah=${reference![1]}:${reference![2]}`}
            >
              <strong>
                Go to {surahs[Number(reference![1]) - 1]?.transliteration} ·{" "}
                {reference![1]}:{reference![2]}
              </strong>
              <span>
                Page {direct}
                <ArrowRight size={17} />
              </span>
            </Link>
          )}
          {reference && !direct && (
            <p className="empty-message">
              This ayah reference is outside the Quran’s verse range.
            </p>
          )}
          {directPage && (
            <Link className="direct-result" to={`/read/${directPage}`}>
              <strong>Open Quran page {directPage}</strong>
              <ArrowRight size={18} />
            </Link>
          )}
          {matched.length > 0 && (
            <>
              <h2>Surahs</h2>
              <div className="surah-grid">
                {matched.map((s) => (
                  <SurahCard key={s.id} surah={s} />
                ))}
              </div>
            </>
          )}
          {busy ? (
            <Loading />
          ) : error ? (
            <p role="alert">{error}</p>
          ) : (
            !!results.length && (
              <>
                <h2>
                  {total} matching ayahs{" "}
                  {total > 100 && (
                    <small>
                      · Showing the first 100; refine your search for more.
                    </small>
                  )}
                </h2>
                {results.map((r) => (
                  <Link
                    to={`/read/${r.page}?ayah=${r.key}`}
                    key={r.key}
                    className="search-ayah"
                  >
                    <span className="eyebrow">
                      {surahs[r.surah - 1].transliteration} · {r.key} · Page{" "}
                      {r.page}
                    </span>
                    <p lang="ar" dir="rtl" className="search-arabic">
                      {r.text}
                    </p>
                    <p>{r.en}</p>
                    <p lang="bn">{r.bn}</p>
                    <ArrowRight size={17} />
                  </Link>
                ))}
              </>
            )
          )}
          {!busy &&
            !error &&
            !results.length &&
            !matched.length &&
            !reference &&
            !directPage && (
              <p className="empty-message">
                No results found. Try another word, a Surah name, or a reference
                such as 2:255.
              </p>
            )}
        </div>
      )}
    </>
  );
}
