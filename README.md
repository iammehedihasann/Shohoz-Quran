# Hafezi Quran

A frontend-only Quran reader built with React, Vite, TypeScript, Tailwind CSS, React Router, and Lucide. All Quran and translation data is served from static files. No application server, credentials, accounts, or database.

## Run

```sh
npm ci
npm run dev
```

Production:

```sh
npm test
npm run build
npm run preview -- --port 4173
```

Serve `dist/` with a static host that supports directory indexes. Every public reading route is pre-rendered to its own HTML file, including `/read/1/`, `/surah/1/`, and `/juz/1/`. Configure unknown routes to serve `404.html` with HTTP 404. Netlify/Cloudflare Pages configuration files are included. For Nginx use `try_files $uri $uri/index.html =404;` and `error_page 404 /404.html;`. No SPA rewrite is needed for generated routes.

## Quran source and edition

**This is the DigitalKhatt Indo-Pak 15-line edition, not QUL’s Qudratullah edition.** The requested QUL resources 12, 59, and 242 require download sign-in and do not state redistribution rights on their license pages. Those assets are not included. The open alternative was selected to provide real source line boundaries with explicit reuse terms.

- Text and 610-page layout: [DigitalKhatt](https://github.com/DigitalKhatt/digitalkhatt-js), MIT.
- Compatible Indo-Pak font: [DigitalKhatt](https://github.com/DigitalKhatt/indopakfont), SIL OFL 1.1; all source glyphs retained.
- English: Marmaduke Pickthall (1930), public domain, through [Quran JSON](https://github.com/risan/quran-json).
- Bengali: Abu Bakr Zakaria, QuranEnc version 1.1.1, through Quran JSON. Original translations and footnotes are retained. Follow [QuranEnc conditions](https://quranenc.com/en/home/api/), keep the edition current, and pass corrections to the publisher.
- Metadata: Quran JSON, Al Quran Cloud; Bengali Surah names from QuranEnc. Juz page numbers are mapped from actual ayah references into this edition.
- Audio: EveryAyah public verse recordings, streamed from the source; no recordings are redistributed.

Original text is never normalized for display. Normalization applies only to a separate search string. Page 1 and page 2 have eight source lines, and page 610 has ten; every other page has fifteen. Al-Fatiha uses the source’s printed Indo-Pak segmentation. Navigation, translations and recitation map it explicitly to standard Hafs numbering, where Bismillah is 1:1 and the final two printed portions belong to 1:7.

Automated validation confirms 114 Surahs, 6,236 standard Hafs references, 610 pages, 30 Juz starts, contiguous printed ayah markers, translation coverage, and source-line preservation. This is not scholarly certification. A qualified review of rendering and content remains appropriate before representing the app as religiously certified.

Source provenance is recorded in `public/data/provenance.json`; licenses ship in `public/licenses/`. The source snapshot was retrieved on 12 November 2026. The optional `scripts/prepare-data.mjs` reproduces generated JSON from ignored `.source-data` inputs; shipped data is sufficient to build without downloading anything. Retain source notices and check source corrections before a release.

## Performance and SEO

- Route-level code splitting; audio controls load separately.
- Individually fetched static Quran pages and translation Surahs; adjacent page prefetch.
- Search runs in a Web Worker, loading its 4.6 MB uncompressed index only after keyword search. The main UI remains responsive. Serve JSON using Brotli or gzip compression.
- Verse-by-verse data is fetched per page, including complete ayahs crossing page boundaries.
- Search-engine-readable HTML is generated at build time for 761 public and utility routes. Reader content is present before JavaScript executes.
- Accurate titles, descriptions, language metadata, Open Graph tags, and robots directives. Personal and query pages use `noindex`.
- Set `VITE_SITE_URL` to your **actual HTTPS production origin** before building to emit absolute canonical URLs, JSON-LD and `sitemap.xml`. Surah/Juz opening aliases canonicalize to their equivalent reader page. No guessed domain, fake ratings, or publication dates are emitted.
- Without a domain, the build intentionally omits canonicals and the sitemap. Basic SEO remains available; configure the real origin before public deployment.
- Hashed JS/CSS use immutable cache headers; source data revalidates at the HTTP layer. Update the service worker data cache version when changing Quran data or translations.

## Offline behavior

After first load, a service worker caches the app shell. Opened Quran pages, fonts, translations and verse data cache on demand. Settings includes a deliberate download of all 610 Mushaf pages and the font. Translations, audio, and pages not cached are not claimed to work offline; audio remains online-only. Search is offline-capable only after its index is cached. Cache storage can be evicted by the browser. HTTPS or localhost is required. Close existing tabs after rebuilding to activate the next worker.

Bookmarks, recent Surahs, preferences and progress use versioned, validated LocalStorage. Missing, invalid or inaccessible browser storage is handled without crashing. Clearing site storage removes these records. No analytics or account syncing is present.

## Browser verification

```sh
npx playwright test
```

Tests use installed Google Chrome via Playwright, across desktop and mobile viewports, against the production preview on port 4173. Screenshots go to `test-results/`. Install Chrome or adjust the channel if needed. Test coverage includes navigation, bookmarks, reading progress, translation loading, local search, language/theme persistence and invalid storage.

## Structure

`src/components` contains the shell, Mushaf renderer, audio player and shared states. `src/pages` holds route screens. `src/services` fetches static resources and hosts the search worker. `src/contexts` manages local state. `scripts` prepares data, pre-renders SEO pages, and creates the service worker. `public/data` holds page-level Quran data and Surah-level translations.

The assigned Sites origin is configured in `.env.production`. Replace `VITE_SITE_URL` with your own public domain when changing hosts, then rebuild. Pin and review source updates before deploying.
