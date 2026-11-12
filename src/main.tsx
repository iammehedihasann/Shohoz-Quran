import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import App from "./App";
import "./styles.css";
import type { QuranPage } from "./types";
declare global {
  interface Window {
    __QURAN_PAGE__?: QuranPage;
  }
}
const root = document.getElementById("root")!;
const app = (
  <BrowserRouter>
    <AppProvider initialPage={window.__QURAN_PAGE__}>
      <App />
    </AppProvider>
  </BrowserRouter>
);
// Query-specific selection/search is browser state, absent from the static HTML.
const normalizedPath=(path:string)=>path.replace(/\/+$/,'')||'/';
const matchingRoute=normalizedPath(root.dataset.prerenderPath??'/')===normalizedPath(location.pathname);
if (root.hasChildNodes() && !location.search && matchingRoute) hydrateRoot(root, app);
else {
  root.replaceChildren();
  createRoot(root).render(app);
}
if ("serviceWorker" in navigator && import.meta.env.PROD)
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
