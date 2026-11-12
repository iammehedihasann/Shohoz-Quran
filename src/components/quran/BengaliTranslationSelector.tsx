import { BENGALI_TRANSLATIONS, isAvailableBengaliTranslation } from "../../constants/translations";
import { useApp } from "../../contexts/AppContext";

export default function BengaliTranslationSelector({ id, compact = false }: { id: string; compact?: boolean }) {
  const { state, setPreferences } = useApp();
  const options = BENGALI_TRANSLATIONS.filter(edition => !compact || edition.status === "available").map(edition => (
    <option key={edition.id} value={edition.id} disabled={edition.status !== "available"}>
      {compact && edition.id === "bn-zakaria" ? "Abu Bakr Zakaria" : edition.label}
      {edition.status !== "available" ? " — unavailable (text / permission unverified)" : ""}
    </option>
  ));
  const select = (
    <select id={id} aria-label="Bengali translation edition" aria-describedby={compact ? undefined : `${id}-help`} value={state.preferences.bengaliTranslation} onChange={event => {
      if (isAvailableBengaliTranslation(event.target.value)) setPreferences({ bengaliTranslation: event.target.value });
    }}>{options}</select>
  );
  if (compact) return <label className="reader-edition-control" htmlFor={id}>Bengali edition{select}</label>;
  return (
    <div className="setting-row">
      <div>
        <label htmlFor={id}><strong>Bengali translation edition</strong></label>
        <p id={`${id}-help`} className="muted" style={{ fontSize: 11, lineHeight: 1.8 }}>Only editions with verified text and reuse permission can be selected.</p>
        <details className="translation-copy" style={{ maxWidth: 560 }}>
          <summary>Why are the requested editions unavailable?</summary>
          {BENGALI_TRANSLATIONS.filter(edition => edition.status === "unavailable").map(edition => (
            <div key={edition.id} style={{ marginTop: 12 }}>
              <strong>{edition.label}</strong>
              <p>{edition.status === "unavailable" ? edition.reason : ""}</p>
              <a href={edition.sourceUrl} target="_blank" rel="noreferrer">{edition.publisher} · source information</a>
            </div>
          ))}
        </details>
      </div>
      {select}
    </div>
  );
}
