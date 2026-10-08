import raw from "@/data/books.json";
import freeRaw from "@/data/gutenberg.json";
import storyRaw from "@/data/storyweaver.json";

export type Book = {
  id: number; // ELi books use the publisher's id; free books use FREE_ID_BASE + Gutenberg id
  t: string; // title
  a: string; // author
  lv: string; // CEFR level as published (approximate for free originals)
  hw?: number; // headwords (graded readers only)
  cat: string; // series category / genre
  u?: string; // slug on elipublishing.com
  s: string; // summary
  voc?: string;
  lang?: string;
  ex?: string;
  tags?: string;
  c?: string; // cover on the ELi CDN: "<bookId>/<hash>"
  isbn?: string;
  audio?: boolean; // the ELi page has a free MP3
  sample?: boolean; // the ELi page has a sample to read online
  pg?: number; // Project Gutenberg id of the original text, when it is in the public domain
  sw?: number; // StoryWeaver story id
  src?: Base;
  cover?: string; // absolute cover URL (free books)
  read?: string; // read-online URL (free books)
  epub?: string; // EPUB download URL (free books)
};

/** The bases the shelf can show. Ids never collide: ELi ids are small, Gutenberg = 1e6 + id, StoryWeaver = 2e6 + id. */
export type Base = "eli" | "gutenberg" | "storyweaver";
export const FREE_ID_BASE = 1_000_000;

export const BASE_INFO: Record<Base, { name: string; site: string; kind: string }> = {
  eli: { name: "ELi Readers", site: "site da ELi", kind: "graded reader" },
  gutenberg: { name: "Clássicos grátis", site: "Project Gutenberg", kind: "clássico original" },
  storyweaver: { name: "Histórias grátis", site: "StoryWeaver", kind: "história ilustrada" },
};

export const BOOKS = raw as Book[];
/** Public-domain originals from Project Gutenberg: complete, free and legal to read. */
export const FREE_BOOKS = (freeRaw as Book[]).map((b) => ({ ...b, src: "gutenberg" as const }));
/** Free illustrated stories from StoryWeaver (Pratham Books and partners), openly licensed, levels 1–4 → Pre-A1…B1. */
export const STORY_BOOKS = (storyRaw as Book[]).map((b) => ({ ...b, src: "storyweaver" as const }));
export const ALL_BOOKS = [...BOOKS, ...FREE_BOOKS, ...STORY_BOOKS];
export const BOOK_BY_ID = new Map(ALL_BOOKS.map((b) => [b.id, b]));
export const baseOf = (b: Book): Base => b.src ?? "eli";
/** True for every free, complete book (not an ELi reader). */
export const isFree = (b: Book) => baseOf(b) !== "eli";
export const baseBooks = (base: Base) => (base === "gutenberg" ? FREE_BOOKS : base === "storyweaver" ? STORY_BOOKS : BOOKS);
/** How to name the book in Portuguese text (study prompts, labels). */
export function describeBook(b: Book) {
  const base = baseOf(b);
  if (base === "gutenberg") return `o clássico original "${b.t}" (${b.a}), sem adaptação, nível aproximado ${b.lv}`;
  if (base === "storyweaver") return `a história ilustrada "${b.t}" (${b.a}), do StoryWeaver, nível ${b.lv}`;
  return `o graded reader "${b.t}" (${b.a}), nível ${b.lv}, ${b.hw} headwords`;
}
/** Position within the book's own base (ELi ladder or free classics). */
export const bookNumber = (id: number) => {
  const b = BOOK_BY_ID.get(id);
  return (b ? baseBooks(baseOf(b)) : BOOKS).findIndex((x) => x.id === id) + 1;
};
export const bookUrl = (b: Book) =>
  baseOf(b) === "gutenberg" ? `https://www.gutenberg.org/ebooks/${b.pg}` : baseOf(b) === "storyweaver" ? (b.read ?? "https://storyweaver.org.in") : `https://www.elipublishing.com/p/${b.u}`;

/** Where else to get or hear the book. All links are searches or official pages: nothing is downloaded by the app. */
export function bookLinks(b: Book) {
  const q = encodeURIComponent(baseOf(b) === "gutenberg" ? `${b.t} ${b.a}` : b.t);
  return {
    eliAudio: baseOf(b) === "eli" && b.audio ? `${bookUrl(b)}#resourcesforstudents` : null,
    storyAudio: baseOf(b) === "storyweaver" && b.audio ? b.read : null,
    eliSample: baseOf(b) === "eli" && b.sample ? `${bookUrl(b)}#viewonline` : null,
    original: b.pg ? `https://www.gutenberg.org/ebooks/${b.pg}` : null,
    librivox: b.pg ? `https://librivox.org/search?q=${encodeURIComponent(b.t.replace(/ - (Young|Teen|Bookmarks)$/, ""))}&search_form=get_results` : null,
    printed: baseOf(b) !== "storyweaver", // StoryWeaver stories are digital only
    estanteVirtual: `https://www.estantevirtual.com.br/busca?q=${q}`,
    amazon: b.isbn ? `https://www.amazon.com.br/s?k=${b.isbn}` : `https://www.amazon.com.br/s?k=${q}`,
    worldcat: b.isbn ? `https://search.worldcat.org/search?q=bn%3A${b.isbn}` : null,
    openLibrary: b.isbn ? `https://openlibrary.org/isbn/${b.isbn}` : null,
  };
}

/** Cover image: the ELi CDN (274×400 at md, same file in three sizes) or a free book's own cover URL. */
export function coverUrl(b: Book, size: "xs" | "md" | "lg" = "md") {
  if (b.cover) return b.cover;
  if (!b.c) return null;
  const [id, hash] = b.c.split("/");
  return `https://d2xfnexjhce5on.cloudfront.net/eli/book/${id}/${size}/${hash}.webp`;
}

/** CEFR colour slot: 0 = Pre-A1 … 5 = C1. */
export function levelSlot(lv: string) {
  if (lv.startsWith("Pre")) return 0;
  if (lv.startsWith("A1")) return 1;
  if (lv === "A2") return 2;
  if (lv === "A2/B1" || lv === "B1") return 3;
  if (lv === "B2") return 4;
  return 5;
}
export const levelColor = (lv: string) => `var(--lv-${levelSlot(lv)})`;

export type Stage = { key: string; lv: string; label: string; ids: number[] };

/** The headword ladder: graded stages from 100 to 2500 headwords. */
export const STAGES: Stage[] = (() => {
  const out: (Stage & { min: number; max: number })[] = [];
  for (const b of BOOKS) {
    const lv = b.lv === "A1.1" ? "A1" : b.lv === "A2/B1" ? "B1" : b.lv;
    const real = b.hw ?? 0; // every ELi reader has headwords
    let hw = real;
    if (lv === "A1" && hw === 400) hw = 300;
    if (lv === "A2" && hw >= 700) hw = 800;
    if (lv === "B1") hw = 1000;
    const key = lv + hw;
    let s = out.find((x) => x.key === key);
    if (!s) {
      s = { key, lv, label: "", ids: [], min: real, max: real };
      out.push(s);
    }
    s.ids.push(b.id);
    s.min = Math.min(s.min, real);
    s.max = Math.max(s.max, real);
  }
  return out.map(({ min, max, ...s }) => ({ ...s, label: min === max ? `${min}` : `${min}–${max}` }));
})();

export const LEVELS = [...new Set(BOOKS.map((b) => b.lv))];
export const CATEGORIES = [...new Set(BOOKS.map((b) => b.cat).filter(Boolean))].sort();

export const GRAMMAR_BY_LEVEL: Record<string, string[]> = {
  "Pre-A1": ["Present simple de be e have got", "There is / there are", "Can para habilidade"],
  A1: ["Present simple x present continuous", "Past simple de be e verbos regulares", "Comparativos e superlativos curtos"],
  "A1.1": ["Present continuous", "Past simple (verbos regulares e irregulares comuns)", "Going to para planos"],
  A2: ["Past simple x past continuous", "Present perfect com ever/never/just", "Will e going to para o futuro"],
  "A2/B1": ["Past continuous", "Present perfect", "First conditional"],
  B1: ["Present perfect x past simple", "Past perfect", "Voz passiva e first/second conditional"],
  B2: ["Third conditional e mixed conditionals", "Reported speech", "Modais de dedução (must have, can't have)"],
  C1: ["Inversão para ênfase", "Orações relativas reduzidas", "Discurso indireto livre"],
};

export const AFTER_READING_QUESTIONS = [
  "Who is the main character? Describe him or her in three words.",
  "Where and when does the story happen?",
  "What is the biggest problem in the story? How is it solved?",
  "Which character did you like most? Why?",
  "What was your favourite part of the book?",
  "Would you recommend this book to a friend? Why or why not?",
];
