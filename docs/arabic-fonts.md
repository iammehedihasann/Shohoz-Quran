# Arabic Quran fonts

Checked 12 November 2026. The font sidebar is available through **Reading display settings → Arabic Font**. The same selector is available under **Settings → Reading preferences**. Available choices are saved in the existing versioned LocalStorage preferences as `arabicFont` and restored across pages, Surahs and reloads. Missing, outdated and unavailable IDs receive the verified default without changing translations, bookmarks, progress or display mode.

## Current availability

**DigitalKhatt Indo-Pak** remains the only enabled font and the safe default. Its [original repository](https://github.com/DigitalKhatt/indopakfont) and bundled `public/licenses/DigitalKhatt-font-OFL.txt` identify the font and SIL OFL 1.1 license. Its local WOFF2 is loaded through the existing `@font-face`; the full original TTF is retained for reproducible checks. The current face is not relabeled as Kolkata or advertised as a newly verified Nastaleeq face.

**Kolkata Arabic** is listed but disabled. The requested Kolkata default could not be activated while also satisfying the requirement to verify licensing and prevent missing Quranic glyphs. The saved default deliberately remains Indo-Pak until a suitable Kolkata font and matching text are verified.

## Al Qalam Kolkatta investigation

The [original release listing by Shakir ul Qadree](https://www.urduweb.org/mehfil/tags/alqlm-funs/) identifies the Kolkata Quran font and its Bangladesh printing context. Its [release thread](https://www.urduweb.org/mehfil/threads/34569/) is dated 4 September 2011; direct access timed out during verification. Font metadata identifies **Al Qalam Kolkatta Quranic font**, Regular, **1.0 August 1st 2011**, publisher `www.alqlm.org`, designers **Syed Shakir ul Qadree, Ishtiaq Ali**.

A publicly accessible [preview copy](https://calligraphyfontstyle.com/langs/urdu/fonts/Al_Qalam_Kolkatta_Quranic_font_Regular.ttf) was inspected in `/tmp` only, not bundled or served by this application. SHA-256: `01deee13ef4bc9876ae29cf9ce10872457374066c9f96914a24cf59cf1b1adc1`. It has **335 glyphs** and GSUB/GPOS tables, but no embedded license text or license URL. Its embedding flag is `fsType=0`; this technical flag alone does not establish an author's grant to redistribute the font on a website. Publisher permission for web embedding and redistribution was not verified.

Coverage was compared with every source line on all 610 pages, all Arabic Surah names and Arabic-Indic digits: 89 distinct codepoints, including two invisible text controls. The existing DigitalKhatt font covers all printable characters. The inspected Kolkata copy has no Unicode cmap entries for 30 required printable characters:

`U+0617`, `U+0660–U+0669`, `U+06D8`, `U+06D9`, `U+06DA`, `U+06DB`, `U+06DC`, `U+06DF`, `U+06E2`, `U+06E6`, `U+06E8`, `U+06ED`, `U+089C`, `U+08D5`, `U+08D6`, `U+08D7`, `U+08D9`, `U+08DB`, `U+08DD`, `U+08DE`, `U+08DF`.

These include all ten Arabic-Indic digits, waqf marks and the signs for sajdah, saktah, qif and waqfah. Applying this font to the current text would require glyph fallback or a verified matched text resource. Continuous mode uses the same ayah strings, so changing modes alone does not resolve the incompatibility. No matching, licensed text plus authentic 15-line Kolkata layout was verified. Letters, marks, digits and verse strings were not changed to fit the font.

## Rendering and error handling

The existing DigitalKhatt page/line boundaries and Mushaf renderer are preserved. Continuous reading applies the selected available font explicitly. The reader waits for the selected local font, checks the font-loading result with a representative Quranic string, and reports failure or a 15-second timeout using the existing retry UI. The reader does not display fallback Quran text after a font-loading failure. Browser loading checks are not treated as proof of complete glyph coverage; the separate corpus-wide cmap test supplies that check.

The sidebar uses a native modal dialog for keyboard focus containment, Escape dismissal and focus restoration, and fits mobile viewport widths. No third-party font requests or new runtime dependencies are added. All other Arabic UI typography and search remain unchanged.

## Activating Kolkata later

Obtain a publisher-authenticated font with permission covering web embedding and redistribution, and either complete support for the existing Quran strings or a verified matching ayah dataset with exact reference mapping. Retain the license and source metadata. If no authentic matching 15-line layout exists, enable that font only in continuous reading and clearly retain Indo-Pak for the original Mushaf. Re-run complete character coverage, browser shaping and desktop/mobile visual checks before changing the catalog entry, adding its local `@font-face`, or making Kolkata the default. The current catalog rejects unavailable fonts rather than quietly substituting another face.

`npm test` checks font availability, preference normalization, all 610 pages' glyph coverage, and the existing translation/data tests. Browser font tests cover sidebar interactions, persistence, representative Quranic signs, font failures and mobile layouts; existing Mushaf spacing/navigation checks continue to apply.
