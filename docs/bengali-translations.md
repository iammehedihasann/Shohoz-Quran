# Bengali translation

Verified 12 November 2026. The default Bengali translation is **মাওলানা মুহিউদ্দীন খান** (Maulana Muhiuddin Khan), Al Quran Cloud edition `bn.bengali`.

## Source and attribution

The live [Surah 1 endpoint](https://api.alquran.cloud/v1/surah/1/bn.bengali), [Surah 2 endpoint](https://api.alquran.cloud/v1/surah/2/bn.bengali), and [complete Quran endpoint](https://api.alquran.cloud/v1/quran/bn.bengali) were checked. Edition metadata identifies `identifier: bn.bengali`, `language: bn`, `englishName: Muhiuddin Khan`, `name: মুহিউদ্দীন খান`, `format: text`, and `type: translation`. The API permits cross-origin requests (`Access-Control-Allow-Origin: *`), so no backend or credentials are required. The site's Content Security Policy permits connections to this API origin.

Al Quran Cloud's [terms, section IV](https://alquran.cloud/terms-and-conditions) ask republications to attribute the translator by name and retain the edition identifier. The reader and selectors display the Bengali name; the catalog, API URLs and source notices retain `bn.bengali`. Text is displayed exactly as supplied. No translation is generated, rewritten, normalized, or supplemented with invented footnotes. See also the [API documentation](https://alquran.cloud/api) and `public/licenses/ATTRIBUTIONS.txt`.

## Reader and mapping

`src/services/translationService.ts` fetches `https://api.alquran.cloud/v1/surah/{surah}/bn.bengali` for each Surah represented on the current Hafezi page. It validates the response envelope, edition identity, Surah number, expected verse count, contiguous `numberInSurah` values and global ayah numbers against existing Hafs metadata. API page numbers are never used: this application retains its own 610-page layout.

Each API `text` maps unchanged to a translation with the corresponding Surah and local ayah ID. The existing reader looks up translations by Surah and ayah, so mixed-Surah pages and ayahs crossing page boundaries retain correct references. Concurrent requests share an in-memory promise keyed by edition and Surah. Failed requests leave the cache and can be retried; requests time out after 15 seconds. Effect cleanup prevents late responses from replacing translations after navigation or disabling translations. Loading and retry states use the existing UI. Arabic remains visible if Bengali loading fails in either reading mode.

The reader requires a connection for the first request for a Surah in each session. Successfully fetched Surahs remain available in memory during that session. There is no silent fallback to a different translator. English translation loading and unrelated reading features retain their existing behavior.

## Preferences and existing installations

The Bengali edition preference is separate from the `none`, `en`, `bn`, and `both` display modes. Missing, unsupported and previous edition IDs migrate to `bn.bengali`; the migrated ID is persisted when LocalStorage permits writes. Bookmarks, progress and unrelated preferences are retained. Existing unavailable Islamic Foundation and Bengali Tawzeehul Quran entries stay unavailable; their text is never substituted or relabeled.

On service-worker activation, only cached Bengali translation files and the search index are removed, so an old Bengali search snapshot cannot survive the update. Downloaded Arabic pages, fonts and English translations remain cached.

## Search snapshots and refresh

`public/data/translations/bn/1.json` through `114.json` contain unmodified text from the complete API response. These snapshots support the existing local Bengali search index, data preparation and exhaustive mapping checks; the reader always fetches Bengali Surahs from the API.

Run `node scripts/update-bengali-translation.mjs` to fetch and validate all 114 Surahs and 6,236 ayahs before updating only Bengali snapshots and the `bn` field of `public/data/search.json`. An optional path to a previously saved full API response supports reproducible offline refreshes. Arabic text, English text, search references and page metadata are retained. `scripts/prepare-data.mjs` reuses current Bengali snapshots instead of importing an obsolete source edition.

`npm test` checks the API contract, exact translation text, caching, malformed responses, retry, preference migration and every translation reference on all 610 pages. Browser tests cover settings, multi-Surah navigation, late responses, failed API requests, recovery and both reading modes on desktop and mobile. `npm run build` includes TypeScript checking.
