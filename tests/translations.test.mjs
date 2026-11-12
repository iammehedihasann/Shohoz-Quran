import test, { after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createServer } from "vite";

const vite = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
});
after(() => vite.close());
const service = await vite.ssrLoadModule("/src/services/translationService.ts");
const catalog = await vite.ssrLoadModule("/src/constants/translations.ts");
const storage = await vite.ssrLoadModule("/src/utils/storage.ts");
const read = (lang, surah) =>
  JSON.parse(
    fs.readFileSync(`public/data/translations/${lang}/${surah}.json`, "utf8"),
  );
const metadata = JSON.parse(
  fs.readFileSync("src/constants/navigation.json", "utf8"),
);
const fixture = JSON.parse(
  fs.readFileSync("tests/fixtures/bn.bengali-surah1.json", "utf8"),
);
const apiResponse = (surah) => ({
  code: 200,
  status: "OK",
  data: {
    number: surah,
    numberOfAyahs: metadata.surahs[surah - 1].total_verses,
    edition: { ...fixture.data.edition },
    ayahs: read("bn", surah).verses.map((v) => ({
      number:
        metadata.surahs
          .slice(0, surah - 1)
          .reduce((n, s) => n + s.total_verses, 0) + v.id,
      numberInSurah: v.id,
      text: v.translation,
    })),
  },
});

test("unavailable and removed editions cannot return another translator’s text", async () => {
  const original = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    throw new Error("Unexpected request");
  };
  try {
    for (const id of [
      "bn-zakaria",
      "bn-islamic-foundation",
      "bn-taqi-usmani-bashar",
      "unverified-edition",
    ])
      await assert.rejects(service.getTranslation("bn", 1, id), /unavailable/);
    assert.equal(requests, 0);
    assert.equal(catalog.DEFAULT_BENGALI_TRANSLATION, "bn.bengali");
    assert.equal(
      catalog.requireBengaliTranslation("bn.bengali").label,
      "মাওলানা মুহিউদ্দীন খান",
    );
    assert.equal(
      catalog.BENGALI_TRANSLATIONS.filter((e) => e.status === "unavailable")
        .length,
      2,
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("real Surah API fixture retains exact text and concurrent requests share independent caches", async () => {
  const original = globalThis.fetch,
    requests = [];
  globalThis.fetch = async (url) => {
    requests.push(url);
    return new Response(
      JSON.stringify(url.startsWith("https:") ? fixture : read("en", 1)),
    );
  };
  try {
    const first = service.getTranslation("bn", 1),
      concurrent = service.getTranslation("bn", 1);
    assert.equal(first, concurrent);
    const [bn, en] = await Promise.all([
      first,
      service.getTranslation("en", 1),
    ]);
    assert.deepEqual(bn, read("bn", 1));
    assert.deepEqual(en, read("en", 1));
    for (const [i, ayah] of fixture.data.ayahs.entries())
      assert.equal(bn.verses[i].translation, ayah.text);
    assert.equal(await service.getTranslation("bn", 1), bn);
    assert.deepEqual(requests, [
      "https://api.alquran.cloud/v1/surah/1/bn.bengali",
      "/data/translations/en/1.json",
    ]);
    assert.notEqual(
      service.translationCacheKey("bn", 1),
      service.translationCacheKey("en", 1),
    );
    assert.equal(
      service.translationSourceUrl("bn", 1, 7),
      "https://api.alquran.cloud/v1/ayah/1:7/bn.bengali",
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("wrong editions, Surahs, missing, extra, duplicate, out-of-order or invalid ayahs fail validation", () => {
  const mutations = [
    (d) => {
      d.code = 500;
    },
    (d) => {
      d.status = "ERROR";
    },
    (d) => {
      d.data.number = 3;
    },
    (d) => {
      d.data.numberOfAyahs--;
    },
    (d) => {
      d.data.edition.identifier = "bn.hoque";
    },
    (d) => {
      d.data.edition.englishName = "Different translator";
    },
    (d) => {
      d.data.edition.language = "en";
    },
    (d) => {
      d.data.edition.type = "quran";
    },
    (d) => {
      d.data.edition.format = "audio";
    },
    (d) => {
      d.data.ayahs.pop();
    },
    (d) => {
      d.data.ayahs.push(d.data.ayahs[0]);
    },
    (d) => {
      d.data.ayahs[1] = d.data.ayahs[0];
    },
    (d) => {
      d.data.ayahs.reverse();
    },
    (d) => {
      d.data.ayahs[0].numberInSurah = 8;
    },
    (d) => {
      d.data.ayahs[0].number = 1;
    },
    (d) => {
      d.data.ayahs[0].text = " ";
    },
    (d) => {
      d.data.ayahs[0].text = 42;
    },
    (d) => {
      d.data.ayahs[0] = null;
    },
  ];
  for (const mutate of mutations) {
    const data = apiResponse(2);
    mutate(data);
    assert.throws(
      () => service.parseBengaliTranslation(data, 2),
      /match|missing/,
    );
  }
  for (const value of [null, {}, [], { code: 200, data: null }])
    assert.throws(() => service.parseBengaliTranslation(value, 2));
  assert.throws(() => service.parseBengaliTranslation(fixture, 0), /Surah/);
});

test("HTTP, network, timeout, malformed JSON and invalid API responses are evicted and retryable", async () => {
  const original = globalThis.fetch;
  try {
    for (const fail of [
      () => new Response("", { status: 503 }),
      () => {
        throw new TypeError("Failed to fetch");
      },
      () => {
        throw new DOMException("Timed out", "TimeoutError");
      },
      () => new Response("{broken"),
      () => new Response(JSON.stringify({ ...apiResponse(112), code: 500 })),
    ]) {
      globalThis.fetch = async () => fail();
      await assert.rejects(service.getTranslation("bn", 112));
    }
    globalThis.fetch = async () =>
      new Response(JSON.stringify(apiResponse(112)));
    assert.deepEqual(await service.getTranslation("bn", 112), read("bn", 112));
    for (const surah of [0, 115, 1.5, NaN])
      await assert.rejects(service.getTranslation("bn", surah), /Surah/);
    await assert.rejects(service.getTranslation("fr", 1), /language/);
  } finally {
    globalThis.fetch = original;
  }
});

test("all 610 Hafezi pages map API translations to every correct Surah and local ayah", async () => {
  const original = globalThis.fetch,
    requests = [];
  globalThis.fetch = async (url) => {
    requests.push(url);
    const surah = Number(url.match(/\/surah\/(\d+)\/bn.bengali$/)?.[1]);
    return new Response(JSON.stringify(apiResponse(surah)));
  };
  try {
    const translations = new Map();
    for (const s of metadata.surahs) {
      const data = await service.getTranslation("bn", s.id);
      assert.deepEqual(data, read("bn", s.id));
      translations.set(s.id, data);
    }
    const allKeys = new Set();
    let multiSurah = 0;
    for (let number = 1; number <= 610; number++) {
      const page = JSON.parse(
        fs.readFileSync(`public/data/pages/${number}.json`, "utf8"),
      );
      assert.equal(new Set(page.keys).size, page.keys.length);
      if (new Set(page.keys.map((key) => key.split(":")[0])).size > 1)
        multiSurah++;
      for (const key of page.keys) {
        const [s, a] = key.split(":").map(Number);
        assert.ok(page.surahs.includes(s));
        const verse = translations.get(s).verses.find((v) => v.id === a);
        assert.ok(verse?.translation, `Page ${number}, ${key}`);
        assert.equal(verse.translation, apiResponse(s).data.ayahs[a - 1].text);
        allKeys.add(key);
      }
    }
    assert.equal(allKeys.size, 6236);
    assert.ok(multiSurah > 0);
    assert.equal(new Set(requests).size, requests.length);
  } finally {
    globalThis.fetch = original;
  }
});

test("legacy preferences migrate and persist without changing unrelated saved fields or display modes", () => {
  const original = globalThis.localStorage;
  try {
    for (const id of [
      undefined,
      "bn-zakaria",
      "bn-islamic-foundation",
      "bn-taqi-usmani-bashar",
      "invalid",
      "bn.bengali",
    ])
      for (const mode of ["none", "en", "bn", "both"]) {
        const saved = {
          version: 1,
          preferences: {
            translation: mode,
            bengaliTranslation: id,
            theme: "dark",
            zoom: 125,
            audio: false,
          },
          bookmarks: [
            { id: "page-1", page: 1, createdAt: "2026-11-12T00:00:00Z" },
          ],
          progress: { page: 1, key: "1:1" },
          recent: [1],
        };
        let persisted = saved;
        globalThis.localStorage = {
          getItem: () => JSON.stringify(saved),
          setItem: (_key, value) => {
            persisted = JSON.parse(value);
          },
        };
        const state = storage.readState();
        assert.equal(state.preferences.bengaliTranslation, "bn.bengali");
        assert.equal(state.preferences.translation, mode);
        assert.equal(state.preferences.theme, "dark");
        assert.equal(state.preferences.zoom, 125);
        assert.equal(state.preferences.audio, false);
        assert.deepEqual(state.bookmarks, saved.bookmarks);
        assert.deepEqual(state.progress, saved.progress);
        assert.deepEqual(persisted, {
          ...saved,
          preferences: {
            ...saved.preferences,
            bengaliTranslation: "bn.bengali",
          },
        });
      }
    globalThis.localStorage = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          preferences: { bengaliTranslation: "bn-zakaria" },
        }),
      setItem: () => {
        throw new Error("Read-only");
      },
    };
    assert.equal(
      storage.readState().preferences.bengaliTranslation,
      "bn.bengali",
    );
  } finally {
    if (original === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = original;
  }
});

test("worker upgrade evicts only obsolete Bengali and search caches", async () => {
  const handlers = {},
    deleted = [],
    shells = [];
  let claimed = false;
  const paths = [
    "/data/search.json",
    "/data/translations/bn/1.json",
    "/data/translations/en/1.json",
    "/data/pages/1.json",
    "/fonts/indopak.woff2",
  ];
  const context = {
    URL,
    self: {
      addEventListener: (event, handler) => {
        handlers[event] = handler;
      },
      clients: {
        claim: async () => {
          claimed = true;
        },
      },
    },
    caches: {
      keys: async () => ["hafezi-shell-old", "hafezi-data-v1"],
      delete: async (name) => {
        shells.push(name);
      },
      open: async () => ({
        keys: async () =>
          paths.map((path) => ({ url: `https://example.com${path}` })),
        delete: async (request) => {
          deleted.push(new URL(request.url).pathname);
        },
      }),
    },
  };
  const source = fs
    .readFileSync("scripts/sw-template.js", "utf8")
    .replace("__BUILD_ID__", "new")
    .replace("__SHELL_ASSETS__", "[]");
  vm.runInNewContext(source, context);
  let work;
  handlers.activate({
    waitUntil: (promise) => {
      work = promise;
    },
  });
  await work;
  assert.deepEqual(deleted, paths.slice(0, 2));
  assert.deepEqual(shells, ["hafezi-shell-old"]);
  assert.equal(claimed, true);
});
