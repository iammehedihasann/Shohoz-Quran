import { BookOpen, ShieldCheck, LockKeyhole } from "lucide-react";
import { Seo } from "../components/common/Seo";

export default function About() {
  return (
    <>
      <Seo
        title="About Hafezi Quran"
        description="Learn about our Quran reader, translations, audio, and privacy."
      />

      <div className="page-heading">
        <span className="eyebrow">ABOUT HAFEZI QURAN</span>
        <h1>About Us</h1>
        <p>
          A simple and convenient way to read, understand, and listen to the
          Holy Quran.
        </p>
      </div>

      <div className="prose-content">
        <section>
          <BookOpen size={34} />
          <h2>Our Quran Reader</h2>
          <p>
            Hafezi Quran provides a familiar 15-line Indo-Pak Quran reading
            experience with 610 pages and 114 Surahs.
          </p>
          <p>
            Our goal is to make Quran reading easy, comfortable, and accessible
            on mobile, tablet, and desktop devices.
          </p>
        </section>

        <section>
          <ShieldCheck size={24} />
          <h2>Translations & Audio</h2>
          <p>
            The app includes Bengali translation by Abu Bakr Zakaria and English
            translation by Marmaduke Pickthall.
          </p>
          <p>
            You can also listen to Quran recitations by Mishary Rashid Alafasy
            and Abdul Basit Abdul Samad.
          </p>
          <p>
            Quran text, translations, and recitations are provided from
            third-party sources.
          </p>
        </section>

        <section>
          <LockKeyhole size={24} />
          <h2>Your Privacy</h2>
          <p>
            We respect your privacy. No account or registration is required to
            use the app.
          </p>
          <p>
            Your bookmarks, reading progress, and preferences are saved locally
            in your browser. We do not store your personal reading information
            on our servers.
          </p>
        </section>

        <section>
          <h2>Offline Reading</h2>
          <p>
            Previously downloaded Quran pages can be read offline. Translations
            are also available offline when cached.
          </p>
          <p>Audio recitation requires an internet connection.</p>
        </section>

        <section>
          <h2>Our Commitment</h2>
          <p>
            We aim to provide an accurate, clean, and distraction-free Quran
            reading experience.
          </p>
          <p>
            We continuously work to improve the app and make Quran reading
            easier for everyone.
          </p>
        </section>
      </div>
    </>
  );
}
