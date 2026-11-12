import { useEffect } from "react";
export function Seo({
  title,
  description,
  noindex = false,
  canonicalPath,
}: {
  title: string;
  description: string;
  noindex?: boolean;
  canonicalPath?: string;
}) {
  useEffect(() => {
    document.title = `${title} | Hafezi Quran`;
    const set = (name: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    };
    set("description", description);
    set("robots", noindex ? "noindex, follow" : "index, follow");
    for (const [property, content] of [
      ["og:title", document.title],
      ["og:description", description],
    ])
      document
        .querySelector(`meta[property="${property}"]`)
        ?.setAttribute("content", content);
    const domain = import.meta.env.VITE_SITE_URL;
    const canonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (domain && canonical) {
      const path = canonicalPath ?? location.pathname;
      canonical.href = new URL(path === '/' ? path : `${path.replace(/\/+$/, '')}/`, domain).href;
      document
        .querySelector('meta[property="og:url"]')
        ?.setAttribute("content", canonical.href);
    }
  }, [title, description, noindex, canonicalPath]);
  return null;
}
