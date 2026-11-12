import { NavLink, Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  LayoutGrid,
  Layers,
  Bookmark,
  Settings,
  Search,
  Sun,
  Moon,
  ArrowUpRight,
  Heart,
  Menu,
  X,
  WifiOff,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useApp } from "../../contexts/AppContext";
import { useTranslation } from "../../constants/i18n";
export function Logo() {
  return (
    <Link to="/" className="brand" aria-label="Hafezi Quran home">
      <span className="brand-icon">
        <BookOpen size={25} strokeWidth={1.6} />
      </span>
      <span>
        QURAN<span className="brand-sub">· القرآن الكريم</span>
      </span>
    </Link>
  );
}
export default function Shell({ children }: { children: React.ReactNode }) {
  const t = useTranslation(),
    { state, setPreferences, storageError } = useApp(),
    location = useLocation();
  const [menu, setMenu] = useState(false),
    [online, setOnline] = useState(true),
    [fontError, setFontError] = useState(false);
  useEffect(() => {
    if (!/^\/(?:juz|search)(?:\/|$)/.test(location.pathname)) return;
    let active = true;
    document.fonts
      .load('24px "Indopak"')
      .then((fonts) => {
        if (!active) return;
        if (fonts.length) {
          document.documentElement.classList.add("quran-font-ready");
          setFontError(false);
        } else setFontError(true);
      })
      .catch(() => {
        if (active) setFontError(true);
      });
    return () => {
      active = false;
    };
  }, [location.pathname]);
  useEffect(() => {
    setMenu(false);
    if (!location.pathname.startsWith("/read/")) window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  const nav = [
    { to: "/", label: t.home, Icon: LayoutGrid },
    { to: `/read/${state.progress?.page ?? 1}`, label: t.read, Icon: BookOpen },
    { to: "/surahs", label: t.surahs, Icon: Layers },
    { to: "/juz", label: t.juz, Icon: BookOpen },
    { to: "/bookmarks", label: t.bookmarks, Icon: Bookmark },
  ];
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <Logo />
        <button
          className="icon-button close-menu"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        >
          <X />
        </button>
        <span className="nav-label">YOUR QURAN COMPANION</span>
        <nav aria-label="Main navigation">
          {nav.map(({ to, label, Icon }) => (
            <NavLink
              key={label}
              end={to === "/"}
              to={to}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              {label}
              {label === t.bookmarks && state.bookmarks.length > 0 && (
                <span className="count">{state.bookmarks.length}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="small-star">✧</span>
            <p>
              A quiet space for
              <br />a meaningful connection.
            </p>
            <span>ALWAYS HERE, ALWAYS OPEN</span>
          </div>
          <NavLink to="/settings" className="nav-item">
            <Settings size={19} />
            {t.settings}
          </NavLink>
          <Link to="/about" className="sidebar-about">
            About & sources <ArrowUpRight size={13} />
          </Link>
        </div>
      </aside>
      {menu && (
        <button
          className="menu-overlay"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Menu />
            </button>
            <span className="topbar-title">
              {location.pathname === "/"
                ? "Assalamu alaikum"
                : location.pathname.startsWith("/read")
                  ? t.reader
                  : "Your Quran companion"}{" "}
              <span className="greeting-dot" />
            </span>
          </div>
          <div className="topbar-actions">
            <Link className="icon-button" aria-label={t.search} to="/search">
              <Search size={19} />
            </Link>
            <span className="topbar-divider" />
            <label className="sr-only" htmlFor="top-language">
              {t.language}
            </label>
            <select
              id="top-language"
              value={state.preferences.language}
              onChange={(e) =>
                setPreferences({
                  language: e.target.value as "en" | "bn" | "ar",
                })
              }
            >
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
              <option value="ar">العربية</option>
            </select>
            <button
              className="icon-button theme-button"
              aria-label={`Switch to ${state.preferences.theme === "light" ? "dark" : "light"} mode`}
              onClick={() =>
                setPreferences({
                  theme: state.preferences.theme === "light" ? "dark" : "light",
                })
              }
            >
              {state.preferences.theme === "light" ? (
                <Moon size={18} />
              ) : (
                <Sun size={18} />
              )}
            </button>
            <Link
              to={`/read/${state.progress?.page ?? 1}`}
              className="top-read"
            >
              <BookOpen size={16} />
              {t.read}
            </Link>
          </div>
        </header>
        {fontError && (
          <div className="notice" role="alert">
            The matching Quran font is unavailable. Connect to the internet and
            reload to display the Arabic source text.
          </div>
        )}
        {!online && (
          <div className="notice">
            <WifiOff size={15} /> You’re offline. Previously cached pages are
            available.
          </div>
        )}
        {storageError && (
          <div className="notice">
            Browser storage is unavailable. Your changes work for this visit but
            may not be saved.
          </div>
        )}
        <main
          id="main"
          className={
            location.pathname.startsWith("/read")
              ? "reader-main"
              : "content-main"
          }
          dir={state.preferences.language === "ar" ? "rtl" : undefined}
        >
          {children}
        </main>
        <footer className="footer">
          <span>
            Quran <span className="footer-dot">·</span> Read with presence.
          </span>
          <div>
            <Link to="/about">{t.privacy}</Link>
            <span>
              Made with intention <Heart size={12} />
            </span>
          </div>
        </footer>
      </div>
      <nav className="mobile-bottom" aria-label="Mobile navigation">
        {nav
          .filter((_, i) => [0, 1, 2, 4].includes(i))
          .map(({ to, label, Icon }) => (
            <NavLink key={label} end={to === "/"} to={to}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
      </nav>
    </div>
  );
}
