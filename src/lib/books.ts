import raw from "@/data/books.json";

export type Book = {
  id: number;
  t: string; // title
  a: string; // author
  lv: string; // CEFR level as published
  hw: number; // headwords
  cat: string; // series category
  u: string; // slug on elipublishing.com
  s: string; // summary
  voc?: string;
  lang?: string;
  ex?: string;
  tags?: string;
  c?: string; // cover on the ELi CDN: "<bookId>/<hash>"
};

export const BOOKS = raw as Book[];
export const BOOK_BY_ID = new Map(BOOKS.map((b) => [b.id, b]));
export const bookNumber = (id: number) => BOOKS.findIndex((b) => b.id === id) + 1;
export const bookUrl = (b: Book) => `https://www.elipublishing.com/p/${b.u}`;

/** Cover image from the publisher's CDN (274×400 at md). Same file in three sizes. */
export function coverUrl(b: Book, size: "xs" | "md" | "lg" = "md") {
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
    let hw = b.hw;
    if (lv === "A1" && hw === 400) hw = 300;
    if (lv === "A2" && hw >= 700) hw = 800;
    if (lv === "B1") hw = 1000;
    const key = lv + hw;
    let s = out.find((x) => x.key === key);
    if (!s) {
      s = { key, lv, label: "", ids: [], min: b.hw, max: b.hw };
      out.push(s);
    }
    s.ids.push(b.id);
    s.min = Math.min(s.min, b.hw);
    s.max = Math.max(s.max, b.hw);
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
