import { ARABIC_FONTS, isAvailableArabicFont } from "../../constants/arabicFonts";
import { useApp } from "../../contexts/AppContext";

export default function ArabicFontSelector({ id }: { id: string }) {
  const { state, setPreferences } = useApp();
  return (
    <div className="arabic-font-selector">
      <label htmlFor={id}>Arabic Font</label>
      <select
        id={id}
        aria-describedby={`${id}-help`}
        value={state.preferences.arabicFont}
        onChange={event => {
          if (isAvailableArabicFont(event.target.value)) {
            setPreferences({ arabicFont: event.target.value });
          }
        }}
      >
        {ARABIC_FONTS.map(font => (
          <option key={font.id} value={font.id} disabled={font.status !== "available"}>
            {font.label}{font.status !== "available" ? " — unavailable" : ""}
          </option>
        ))}
      </select>
      <p id={`${id}-help`} className="muted">The original 15-line Mushaf uses its matching Indo-Pak font.</p>
      {ARABIC_FONTS.map(font => font.status === "unavailable" && (
        <p key={font.id} className="arabic-font-availability">{font.reason}</p>
      ))}
    </div>
  );
}
