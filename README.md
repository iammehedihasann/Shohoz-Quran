# Hafezi Quran

Hafezi Quran is a Quran reader that runs entirely in the browser. It's built with React, Vite, TypeScript, Tailwind CSS, React Router and Lucide. The Arabic text and the English translation are served as static files. The Bengali translation comes from Al Quran Cloud (`bn.bengali`) and is fetched one Surah at a time. There's no application server, no accounts, no credentials and no database.

## Running it

```sh
npm ci
npm run dev
```

For a production build:

```sh
npm test
npm run build
npm run preview -- --port 4173
```

Serve `dist/` from any static host that supports directory indexes. Every public reading route, including `/read/1/`, `/surah/1/` and `/juz/1/`, is pre-rendered to its own HTML file, so you don't need an SPA rewrite. What you do need is for unknown routes to return `404.html` with a real HTTP 404. Config files for Netlify and Cloudflare Pages are already in the repo. On Nginx, use:

```nginx
try_files $uri $uri/index.html =404;
error_page 404 /404.html;
```

## Where the Quran text comes from

This is the DigitalKhatt Indo-Pak 15-line edition. It is not QUL's Qudratullah edition. We wanted QUL resources 12, 59 and 242, but downloading them requires signing in and their license pages don't say anything about redistribution, so they aren't included. DigitalKhatt was the open alternative: it has real source line boundaries and clear reuse terms.

- **Text and 610-page layout:** [DigitalKhatt](https://github.com/DigitalKhatt/digitalkhatt-js), MIT.
- **Font:** the compatible Indo-Pak font from [DigitalKhatt](https://github.com/DigitalKhatt/indopakfont), SIL OFL 1.1, with all source glyphs kept.
- **English:** Marmaduke Pickthall (1930), public domain, via [Quran JSON](https://github.com/risan/quran-json).
- **Bengali:** Maulana Muhiuddin Khan (মাওলানা মুহিউদ্দীন খান), from the Al Quran Cloud edition `bn.bengali`. The API text is kept exactly as returned, with no rewriting. See the [API docs](https://alquran.cloud/api) and the [terms and translator attribution](https://alquran.cloud/terms-and-conditions). The reader fetches each Surah it needs on demand, and the Bengali search snapshot contains the same edition.
- **Metadata:** Quran JSON and Al Quran Cloud. Bengali Surah names come from QuranEnc. Juz page numbers are worked out from actual ayah references in this edition.
- **Audio:** public verse recordings from EveryAyah, streamed from the source. We don't redistribute any recordings.

The original text is never normalized for display. Normalization only happens on a separate string used for search.

Pages 1 and 2 have eight source lines each, page 610 has ten, and every other page has fifteen. Al-Fatiha follows the source's printed Indo-Pak segmentation. Navigation, translations and recitation map that segmentation to standard Hafs numbering, where the Bismillah is 1:1 and the last two printed portions belong to 1:7.

Automated validation checks for 114 Surahs, 6,236 standard Hafs references, 610 pages, 30 Juz starts, contiguous printed ayah markers, translation coverage and preserved source lines. That is not the same as scholarly certification. Please have a qualified person review the rendering and content before presenting the app as religiously certified.

Provenance for every source is in `public/data/provenance.json`, and the licenses are in `public/licenses/`. The source snapshot was taken on 12 November 2026. `scripts/prepare-data.mjs` can regenerate the JSON from ignored `.source-data` inputs, but you don't need it to build, since the shipped data is enough. Keep the source notices, and check for upstream corrections before each release.

## Performance and SEO

- Routes are code-split, and the audio controls load separately.
- Quran pages and English translations are static files fetched individually. Bengali translations are fetched per Surah from Al Quran Cloud, with validation, request deduplication and retry. The next and previous Quran pages are prefetched.
- Search runs in a Web Worker and only loads its static index once someone searches by keyword, so the main UI stays responsive. Serve the JSON with Brotli or gzip.
- Verse data is fetched page by page, including ayahs that run across a page boundary.
- HTML for 761 public and utility routes is generated at build time, so the reader content is there before any JavaScript runs.
- Titles, descriptions, language metadata, Open Graph tags and robots directives are set per page. Personal pages and query pages are `noindex`.
- Set `VITE_SITE_URL` to your real HTTPS production origin before building. That's what produces absolute canonical URLs, JSON-LD and `sitemap.xml`. Surah and Juz opening aliases canonicalize to the equivalent reader page. We don't guess a domain, and there are no made-up ratings or publication dates.
- If you don't set a domain, the build leaves out canonicals and the sitemap on purpose. Basic SEO still works, but set the real origin before you deploy publicly.
- Hashed JS and CSS get immutable cache headers. Source data revalidates over HTTP. If you change the Quran data or translations, bump the service worker's data cache version.

## Offline behavior

After the first load, a service worker caches the app shell. Quran pages, fonts, English translations and verse data are cached as you open them. Settings has an option to download all 610 Mushaf pages and the font in one go, if you want that.

Some things don't work offline, and we don't claim they do. Bengali Surahs need a connection the first time you open them in each session, and after that they're kept in memory. Audio is online-only. Any page you haven't cached won't load. Search works offline only once its index has been cached. The browser can also evict cache storage whenever it likes.

HTTPS or localhost is required. After a rebuild, close any open tabs so the new service worker can take over.

Bookmarks, recent Surahs, preferences and reading progress are saved in LocalStorage, versioned and validated. If storage is missing, invalid or blocked, the app handles it without crashing. Clearing site storage deletes these records. There's no analytics and no account syncing.

## Browser tests

```sh
npx playwright test
```

The tests use your installed Google Chrome through Playwright, on both desktop and mobile viewports, against the production preview on port 4173. Screenshots end up in `test-results/`. If you don't have Chrome, install it or change the channel in the config. They cover navigation, bookmarks, reading progress, translation loading, local search, language and theme persistence, and invalid storage.

## Project layout

- `src/components`: the shell, the Mushaf renderer, the audio player and shared states.
- `src/pages`: the route screens.
- `src/services`: fetching for static resources and the Bengali API, plus the search worker.
- `src/contexts`: local state.
- `scripts`: data preparation, SEO pre-rendering and service worker generation.
- `public/data`: page-level Quran data and Surah-level translation snapshots.

To refresh only the Bengali snapshots and the Bengali search text from the full `bn.bengali` API response, run `node scripts/update-bengali-translation.mjs`. More detail is in `docs/bengali-translations.md`.

The assigned Sites origin lives in `.env.production`. If you move to another host, replace `VITE_SITE_URL` with your own public domain and rebuild. Pin and review source updates before you deploy.
