import { Link } from "react-router-dom";
import { ShieldCheck, BookOpen, LockKeyhole, ArrowUpRight } from "lucide-react";
import { Seo } from "../components/common/Seo";
export default function About() {
  return (
    <>
      <Seo
        title="Sources, accuracy & privacy"
        description="Quran text, layout, font, translation and audio sources for Hafezi Quran. Learn about the DigitalKhatt edition, numbering, licenses and local browser privacy."
      />
      <div className="page-heading">
        <span className="eyebrow">BUILT WITH CARE. SHARED WITH CLARITY.</span>
        <h1>Sources & privacy</h1>
        <p>
          Your trust matters. Here is where the text comes from and how the app
          works.
        </p>
      </div>
      <div className="prose-content">
        <section>
          <BookOpen size={24} />
          <h2>The Quran edition</h2>
          <p>
            This reader uses the{" "}
            <strong>DigitalKhatt Indo-Pak 15-line edition</strong>: 610 pages,
            114 Surahs, and 6,236 numbered ayahs using standard Hafs references.
            Page boundaries and each original line string come directly from the
            source. Pages 1 and 2 contain eight source lines; page 610 contains
            ten. Regular pages contain fifteen.
          </p>
          <p>
            The requested QUL Qudratullah layout (resource 12), script (59), and
            font (242) require sign-in to download, and QUL’s license pages do
            not specify redistribution rights. They are not bundled. This openly
            licensed DigitalKhatt alternative is clearly identified throughout
            the app; it is not represented as the Qudratullah edition.
          </p>
          <p>
            Al-Fatiha’s printed Indo-Pak numbering differs from standard Hafs
            numbering. The original printed text stays unchanged. Navigation,
            translation, and audio use Hafs references: Bismillah is 1:1, and
            the final two printed segments are combined under 1:7. No recitation
            timing has been invented; selecting an ayah highlights its verified
            text association.
          </p>
          <a
            href="https://github.com/DigitalKhatt/digitalkhatt-js"
            target="_blank"
            rel="noreferrer"
          >
            DigitalKhatt source · MIT license <ArrowUpRight size={13} />
          </a>
          <a href="/licenses/DigitalKhatt-MIT.txt">Retained dataset license</a>
          <a href="/data/provenance.json">Data provenance & checksum</a>
        </section>
        <section>
          <ShieldCheck size={24} />
          <h2>Fonts & translations</h2>
          <p>
            <strong>Quran font:</strong> DigitalKhatt IndoPak by DigitalKhatt
            contributors, sponsored by Tarteel. The compatible font is served
            locally in WOFF2, with original glyphs and shaping preserved, under the SIL Open Font License 1.1. Quran text
            is shown only after the matching font is available in the reader.
          </p>
          <a href="https://github.com/DigitalKhatt/indopakfont">Font source</a>
          <a href="/licenses/DigitalKhatt-font-OFL.txt">
            SIL Open Font License
          </a>
          <p>
            <strong>Bengali:</strong> Abu Bakr Zakaria, version 1.1.1, supplied
            by QuranEnc.com via Quran JSON. Translation text and footnotes are
            retained. QuranEnc permits republication with attribution, version
            disclosure, preservation of the original content, and continuing
            updates. Report observations to QuranEnc using the link alongside
            the footnotes.
          </p>
          <a href="https://quranenc.com/en/browse/bengali_zakaria/">
            Bengali translation & publisher
          </a>
          <a href="https://quranenc.com/en/home/api/">
            QuranEnc republication conditions
          </a>
          <p>
            <strong>English:</strong> Marmaduke Pickthall,{" "}
            <em>The Meaning of the Glorious Koran</em> (1930), public domain,
            supplied via Quran JSON. Translations convey interpretations of the
            meanings; they do not replace the Arabic Quran.
          </p>
          <a href="https://github.com/risan/quran-json">
            Quran JSON · source & licensing
          </a>
          <p>
            <strong>Metadata:</strong> Quran JSON and Al Quran Cloud supply
            Surah names, ayah counts, and Juz starting references. Bengali Surah
            names come from QuranEnc. Page references are calculated from this
            edition’s verified ayah mapping.
          </p>
          <a href="https://alquran.cloud/api">Al Quran Cloud</a>
          <p>
            <strong>Recitation:</strong> Mishary Rashid Alafasy and Abdul Basit
            Abdul Samad, streamed directly from EveryAyah’s public verse files.
            Recordings stay on the source host. We do not bundle or offer audio
            downloads, and do not assert ownership of the recordings.
          </p>
          <a href="https://everyayah.com/">EveryAyah audio source</a>
        </section>
        <section>
          <LockKeyhole size={24} />
          <h2>Your reading stays with you</h2>
          <p>
            No account, database, analytics, advertising, or application backend
            is used. Bookmarks, the last-read position, recently opened Surahs,
            and preferences are stored in LocalStorage on this browser. Clearing
            browser storage removes them. They do not sync between devices.
          </p>
          <p>
            The service worker caches the app shell, locally hosted font, and
            Quran resources you open. You can deliberately download all Mushaf
            pages in <Link to="/settings">Settings</Link>. Translations and
            verse-by-verse resources are available offline only after those
            resources are cached. Audio requires internet. Browser storage may
            be evicted by the browser.
          </p>
          <p>
            Audio requests go directly to EveryAyah, which receives standard
            network information such as your IP address. The static website host
            also receives standard page requests. The application sends no
            bookmarks or reading history to an application server.
          </p>
        </section>
        <section>
          <h2>Accuracy & ongoing review</h2>
          <p>
            Automated checks verify 114 Surahs, 6,236 standard Hafs references,
            the original 610-page line layout, contiguous verse-end markers, Juz
            boundaries, translation coverage, and source-line integrity. These
            checks do not constitute scholarly certification or exhaustive
            visual proof of every glyph. Please compare any suspected issue with
            the linked source and consult a qualified teacher.
          </p>
          <p>
            Source snapshot retrieved 12 November 2026. Maintain source
            corrections and translation versions before each release.
          </p>
        </section>
      </div>
    </>
  );
}
