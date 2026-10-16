import { ALL_BOOKS, BASE_INFO, baseOf, basesFor, isFree, langOf, type Book, type Kind, type Lang } from "@/lib/books";
import { RESOURCE_LEVELS, plainLevel } from "@/lib/resources";
import type { Data } from "@/lib/store";

// short, free and with audio first; the long originals last
const KIND_ORDER: Kind[] = ["gsb", "storyweaver", "bookdash", "gutenberg", "librivox", "eli", "publisher"];
const DONE_TO_MOVE_UP = 3; // books read at a level before suggesting the next one
const BOOK_LEVEL = new Map(ALL_BOOKS.map((b) => [b.id, { lang: langOf(b), lv: plainLevel(b.lv) }]));

/**
 * The learner's level in a language: the placement test if there is one, raised by what has been read
 * (three books done at a level move it up one step). Plain CEFR steps, Pre-A1 to C1.
 */
export function learnerLevel(data: Data, lang: Lang): string {
  const placed = data.placement[lang]?.lv;
  const done = Object.entries(data.progress)
    .filter(([, p]) => p.st === "done")
    .map(([id]) => BOOK_LEVEL.get(Number(id)))
    .filter((x): x is { lang: Lang; lv: string } => !!x && x.lang === lang && !!x.lv);
  let read = 0;
  for (let i = RESOURCE_LEVELS.length - 1; i >= 0; i--) {
    const n = done.filter((d) => d.lv === RESOURCE_LEVELS[i]).length;
    if (n) {
      read = Math.min(RESOURCE_LEVELS.length - 1, i + (n >= DONE_TO_MOVE_UP ? 1 : 0));
      break;
    }
  }
  const fromTest = placed ? RESOURCE_LEVELS.indexOf(placed) : 0;
  return RESOURCE_LEVELS[Math.max(read, fromTest, 0)];
}

/**
 * Books to read next, from the free sources (StoryWeaver, Global Storybooks, Book Dash, Gutenberg…):
 * unread books at the learner's level, mixing sources so one series does not take over, then the next level up.
 * Paid series (ELi, Oxford) only come in when nothing free is left.
 */
export function recommendBooks(data: Data, lang: Lang, n = 6, level = learnerLevel(data, lang)): Book[] {
  const unread = (b: Book) => !data.progress[b.id] || data.progress[b.id].st === "want";
  const from = RESOURCE_LEVELS.indexOf(level);
  const out: Book[] = [];
  for (const free of [true, false]) {
    for (let i = Math.max(0, from); i < RESOURCE_LEVELS.length && out.length < n; i++) {
      const lv = RESOURCE_LEVELS[i];
      // one queue per source, in the source's own order, then take them in turns
      const queues = basesFor(lang)
        .filter((d) => d.books.some((b) => isFree(b) === free))
        .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || Number(b.graded) - Number(a.graded))
        .map((d) => d.books.filter((b) => isFree(b) === free && plainLevel(b.lv) === lv && unread(b) && !out.includes(b)));
      while (out.length < n && queues.some((q) => q.length)) for (const q of queues) if (q.length && out.length < n) out.push(q.shift()!);
    }
    if (out.length >= n) break;
  }
  return out;
}

/** "StoryWeaver · A1", for the small line under a suggested book. */
export const sourceLine = (b: Book) => `${BASE_INFO[baseOf(b)].name} · ${b.lv}`;
