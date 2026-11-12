import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { PassThrough } from "node:stream";
import App from "./App";
import { AppProvider } from "./contexts/AppContext";
import type { QuranPage } from "./types";
export function render(url: string, initialPage?: QuranPage): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = new PassThrough();
    let html = "";
    stream.on("data", (chunk) => (html += chunk));
    stream.on("end", () => resolve(html));
    const result = renderToPipeableStream(
      <StaticRouter location={url}>
        <AppProvider initialPage={initialPage}>
          <App />
        </AppProvider>
      </StaticRouter>,
      {
        onAllReady() {
          result.pipe(stream);
        },
        onError: reject,
      },
    );
  });
}
