"use client";

import { langInfo, type Lang } from "@/lib/books";

/**
 * Pronunciation: the device's voice when it has one for the language, otherwise a recording by a person
 * from Wiktionary (Wikimedia Commons). Browsers on Linux often have no voices at all (Chrome and Brave
 * need a flag for speech-dispatcher, the Firefox snap is sandboxed away from it), so the fallback matters.
 */

// Lingua Libre names its files "LL-Q<id> (<iso 639-3>)-speaker-word.wav"
const ISO3: Record<Lang, string> = { en: "eng", fr: "fra", de: "deu", es: "spa" };
// file-name prefixes, best first: British English first, matching the app's en-GB voice
const PREFIXES: Record<Lang, string[]> = { en: ["en-uk-", "en-gb-", "en-us-", "en-au-", "en-ca-", "en-"], fr: ["fr-"], de: ["de-"], es: ["es-"] };

function voicesFor(lang: Lang): Promise<SpeechSynthesisVoice | undefined> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return Promise.resolve(undefined);
  const pick = () => speechSynthesis.getVoices().find((v) => v.lang.replace("_", "-").toLowerCase().startsWith(lang));
  const now = pick();
  if (now || speechSynthesis.getVoices().length) return Promise.resolve(now);
  // Chrome fills the list asynchronously; give it a moment before deciding there is none
  return new Promise((res) => {
    const done = () => res(pick());
    speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 700);
  });
}

const recordings = new Map<string, Promise<string | null>>();

/** URL of a recording of a word or short expression, or null. Cached per word. */
function recordingFor(text: string, lang: Lang): Promise<string | null> {
  const word = text.trim().toLowerCase();
  const key = `${lang}:${word}`;
  if (!recordings.has(key)) recordings.set(key, findRecording(word, lang).catch(() => null));
  return recordings.get(key)!;
}

async function findRecording(word: string, lang: Lang): Promise<string | null> {
  if (!word || word.split(/\s+/).length > 4) return null;
  // the language's own Wiktionary lists its recordings; German nouns need their capital letter
  const titles = [...new Set([word, word[0].toUpperCase() + word.slice(1)])].join("|");
  const api = `https://${lang}.wiktionary.org/w/api.php?action=query&generator=images&titles=${encodeURIComponent(titles)}&gimlimit=200&prop=imageinfo&iiprop=url|mime&format=json&origin=*`;
  const r = await fetch(api);
  if (!r.ok) return null;
  const d = (await r.json()) as { query?: { pages?: Record<string, { title: string; imageinfo?: { url: string; mime: string }[] }> } };
  const files = Object.values(d.query?.pages ?? {}).flatMap((p) => {
    const info = p.imageinfo?.[0];
    if (!info || !/^(audio\/|application\/ogg)/.test(info.mime)) return [];
    const name = p.title.replace(/^[^:]+:/, "").replace(/\.[a-z0-9]+$/i, "").toLowerCase();
    return [{ name, url: info.url.split("?")[0] }];
  });
  const target = word.replace(/_/g, " ");
  const score = (name: string) => {
    if (!name.endsWith(`-${target}`) && !name.endsWith(`-${target}2`)) return -1; // sentences and other words
    const p = PREFIXES[lang].findIndex((x) => name.startsWith(x));
    if (p >= 0) return 100 - p;
    return name.startsWith("ll-q") && name.includes(`(${ISO3[lang]})`) ? 10 : -1;
  };
  const best = files.map((f) => ({ ...f, s: score(f.name) })).filter((f) => f.s >= 0).sort((a, b) => b.s - a.s)[0];
  return best?.url ?? null;
}

/** Wikimedia's MP3 copy of an Ogg/WAV file, which every browser plays (Safari cannot play Ogg). */
const mp3Of = (url: string) => {
  const m = url.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/(.+\/([^/]+))$/);
  return m && !/\.mp3$/i.test(url) ? `${m[1]}/transcoded/${m[2]}/${m[3]}.mp3` : url;
};

let current: HTMLAudioElement | null = null;

/** Says a word or passage. Resolves to false when neither a voice nor a recording was available. */
export async function pronounce(text: string, lang: Lang = "en", rate = 0.9): Promise<boolean> {
  const voice = await voicesFor(lang);
  if (voice) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langInfo(lang).voice;
    u.voice = voice;
    u.rate = rate;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    return true;
  }
  const url = await recordingFor(text, lang);
  if (!url) return false;
  current?.pause();
  for (const src of [mp3Of(url), url]) {
    try {
      current = new Audio(src);
      current.playbackRate = rate < 0.8 ? 0.7 : 1;
      await current.play();
      return true;
    } catch {
      /* try the original file */
    }
  }
  return false;
}
