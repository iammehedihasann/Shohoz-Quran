import { lazy, Suspense, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Shell from "./components/layout/Shell";
import Home from "./pages/Home";
import { Loading } from "./components/common/States";
import { useApp } from "./contexts/AppContext";
const Reader = lazy(() => import("./pages/QuranReader")),
  Surahs = lazy(() => import("./pages/Surahs")),
  Juz = lazy(() => import("./pages/Juz")),
  Bookmarks = lazy(() => import("./pages/Bookmarks")),
  Search = lazy(() => import("./pages/Search")),
  Settings = lazy(() => import("./pages/Settings")),
  About = lazy(() => import("./pages/About")),
  NotFound = lazy(() => import("./pages/NotFound"));
function StorageInit() {
  const { initialize } = useApp();
  useEffect(() => initialize(), [initialize]);
  return null;
}
export default function App() {
  return (
    <Shell>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/read/:number" element={<Reader />} />
          <Route path="/surah/:number" element={<Reader kind="surah" />} />
          <Route path="/juz/:number" element={<Reader kind="juz" />} />
          <Route path="/surahs" element={<Surahs />} />
          <Route path="/juz" element={<Juz />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/search" element={<Search />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <StorageInit />
      </Suspense>
    </Shell>
  );
}
