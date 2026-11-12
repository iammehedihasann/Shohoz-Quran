# Bengali translation editions

Checked 12 November 2026. No Quran translation text was generated, rewritten, OCR-transcribed, or replaced in this change.

## Available edition

Dr. Abu Bakr Muhammad Zakaria, QuranEnc version 1.1.1, remains the existing static Bengali dataset. The original files in `public/data/translations/bn/` and their footnotes are unchanged. QuranEnc's [edition page](https://quranenc.com/en/browse/bengali_zakaria/) and [documented Surah endpoint](https://quranenc.com/api/v1/translation/sura/bengali_zakaria/1) identify the existing edition. The endpoint returned the expected numbered Bengali translation and footnotes during verification. Use remains subject to the existing [QuranEnc republication conditions](https://quranenc.com/en/home/api/).

## Islamic Foundation Bangladesh

The official Ministry of Religious Affairs site provides [Quranic e-book downloads](https://quran.gov.bd/home/ebook_download.html), including an [Arabic–Bangla PDF](https://quran.gov.bd/quran/pdf/ab/fab.pdf). Its [user manual](https://quran.gov.bd/common/user_Manual/UserManual.pdf) describes those downloads and its online reader. The site carries a Ministry copyright notice.

This verifies an official PDF download, not permission to republish the translation in this application. An authenticated, machine-readable verse dataset for the specific Islamic Foundation board translation, an official public JSON/API contract for that edition, and redistribution permission were not verified. The government digital edition must not automatically be assumed identical to the requested printed board translation. Third-party scans and GitHub source-code licenses do not establish those rights.

The supplementary [Al Quran Cloud Bengali catalog](https://api.alquran.cloud/v1/edition/language/bn) returned `bn.bengali` (Muhiuddin Khan) and `bn.hoque` (Zohurul Hoque). Neither is labeled as the requested Islamic Foundation board edition. They are not substituted or relabeled.

## Mufti Muhammad Taqi Usmani — Bengali Tawzeehul Quran

The [Maktabatul Ashraf catalog](https://maktabatulashraf.com/%E0%A6%87%E0%A6%B8%E0%A6%B2%E0%A6%BE%E0%A6%AE%E0%A7%80-%E0%A6%AC%E0%A6%87) lists *Tafsire Tawzihul Quran (1–3 Vol)* by Mufti Muhammad Taqi Usmani. The [Bengali edition listing](https://www.rokomari.com/book/104109/tafsire-taojihul-quran/) identifies translator Maulana Abul Bashar Muhammad Saiful Islam, publisher Maktabatul Ashraf, Bengali language, and ISBN 9847025000193. This identifies the requested Bengali edition; Usmani's Urdu and English works are different resources.

The publisher's [e-book category](https://maktabatulashraf.com/index.php?route=product/category&path=172) showed no products, and its site carried an all-rights-reserved notice. No publisher-authorized Bengali API, JSON corpus, downloadable verse text, or digital redistribution grant was verified. Online availability of a book or scan alone does not supply that permission.

## Implementation and activation requirements

`src/constants/translations.ts` separates bibliographic identity from runtime availability. Requested but unverified editions have no data directory, API endpoint, or fabricated text. Both selectors show them disabled and explain the limitations. Only available editions can be selected or loaded. The service rejects unavailable IDs before fetching anything.

The new `bengaliTranslation` preference is separate from display mode (`none`, `en`, `bn`, `both`) and uses the existing versioned LocalStorage record. Old records receive the existing Zakaria default; unsupported or unavailable IDs are discarded. Bookmarks, progress and all unrelated preferences are preserved. Loaded text always carries its actual edition attribution.

To activate another edition, first obtain permission covering static redistribution and offline caching from the relevant rights holder and an authenticated Bengali verse corpus for that exact edition. Retain its permission notice, version, source attribution, full text and notes. Validate all 114 Surahs and 6,236 Hafs references, then add the verified local dataset and mark its catalog entry available. The runtime validates Surah, edition attribution, ayah ordering and completeness, and caches by edition ID plus Surah. Existing author text must never be relabeled as another edition.

No third-party translation API is called by the application at runtime. Search continues to use the existing Zakaria snapshot; no unavailable edition is claimed to be searchable. Arabic text, source page/line data, fonts, navigation, audio and bookmarks are outside this change.
