import { BOOK_BY_ID, langOf, type Lang } from "@/lib/books";
import { resourcesFor } from "@/lib/resources";
import type { Data, Word } from "@/lib/store";

/**
 * Backups by profile. Most records say their language directly (`ln`) or through their book;
 * study days and daily missions do not, so they travel with every profile and are always merged.
 */

const bookLang = (id: string): Lang => {
  const b = BOOK_BY_ID.get(Number(id));
  return b ? langOf(b) : "en";
};
const scoreLang = (key: string): Lang => (key.startsWith("words-") ? (key.slice(6) as Lang) : bookLang(key));
const lnOf = (x: { ln?: Lang }): Lang => x.ln ?? "en";

function resourceLang(data: Data, id: string): Lang {
  const mine = data.myResources.find((r) => r.id === id);
  if (mine) return mine.ln ?? "en";
  for (const l of ["en", "fr", "de", "es"] as Lang[]) if (resourcesFor(l).some((r) => r.id === id)) return l;
  return "en";
}

const pick = <T,>(rec: Record<string, T>, keep: (key: string) => boolean) => Object.fromEntries(Object.entries(rec).filter(([k]) => keep(k)));
const pickLang = <T,>(rec: Partial<Record<Lang, T>>, keep: (l: Lang) => boolean) => Object.fromEntries(Object.entries(rec).filter(([l]) => keep(l as Lang))) as Partial<Record<Lang, T>>;

/** Only what belongs to one language (`keep(lang)`), plus the shared study days and missions. */
function filterData(d: Data, keep: (l: Lang) => boolean): Data {
  return {
    ...d,
    progress: pick(d.progress, (id) => keep(bookLang(id))),
    words: d.words.filter((w) => keep(lnOf(w))),
    kits: pick(d.kits, (id) => keep(bookLang(id))),
    essays: pick(d.essays, (id) => keep(bookLang(id))),
    quotes: d.quotes.filter((q) => keep(lnOf(q))),
    quizzes: pick(d.quizzes, (id) => keep(bookLang(id))),
    scores: pick(d.scores, (k) => keep(scoreLang(k))),
    resources: pick(d.resources, (id) => keep(resourceLang(d, id))),
    myResources: d.myResources.filter((r) => keep(r.ln ?? "en")),
    placement: pickLang(d.placement, keep),
    cando: pickLang(d.cando, keep),
    journal: d.journal.filter((j) => keep(j.ln)),
    essayChecks: pick(d.essayChecks, (id) => keep(bookLang(id))),
  };
}

export const profileData = (d: Data, lang: Lang) => filterData(d, (l) => l === lang);

/** What a backup holds, for the import question. */
export function summary(d: Data) {
  return { words: d.words.length, books: Object.keys(d.progress).length, quotes: d.quotes.length, journal: d.journal.length };
}

const later = <T extends { d?: string; at?: string }>(a: T | undefined, b: T) => (!a || (b.d ?? b.at ?? "") > (a.d ?? a.at ?? "") ? b : a);
const sameWord = (a: Word, b: Word) => lnOf(a) === lnOf(b) && a.w.toLowerCase() === b.w.toLowerCase();

/**
 * Joins a backup into what is here. Nothing is deleted: dated records keep the newer one,
 * a word in both keeps the copy with more reviews, and everything else keeps what is already here.
 */
export function mergeData(cur: Data, inc: Data): Data {
  const words = [...cur.words];
  for (const w of inc.words) {
    const i = words.findIndex((x) => sameWord(x, w));
    if (i < 0) words.push(w);
    else if (w.reps > words[i].reps) words[i] = { ...w, id: words[i].id };
  }
  const byId = <T extends { id: string }>(a: T[], b: T[]) => [...a, ...b.filter((x) => !a.some((y) => y.id === x.id))];
  const newer = <T extends { d?: string; at?: string }>(a: Record<string, T>, b: Record<string, T>) => {
    const out = { ...a };
    for (const [k, v] of Object.entries(b)) out[k] = later(out[k], v);
    return out;
  };
  const missions = { ...cur.missions };
  for (const [day, items] of Object.entries(inc.missions)) missions[day] = [...new Set([...(missions[day] ?? []), ...items])];
  const cando = { ...cur.cando };
  for (const [l, ids] of Object.entries(inc.cando) as [Lang, string[]][]) cando[l] = [...new Set([...(cando[l] ?? []), ...ids])];
  const placement = { ...cur.placement };
  for (const [l, p] of Object.entries(inc.placement) as [Lang, { lv: string; at: string }][]) placement[l] = later(placement[l], p);

  return {
    v: 1,
    progress: newer(cur.progress, inc.progress),
    words,
    kits: { ...inc.kits, ...cur.kits },
    essays: { ...inc.essays, ...cur.essays },
    quotes: byId(cur.quotes, inc.quotes),
    quizzes: { ...inc.quizzes, ...cur.quizzes },
    scores: newer(cur.scores, inc.scores),
    resources: newer(cur.resources, inc.resources),
    missions,
    myResources: byId(cur.myResources, inc.myResources),
    placement,
    cando,
    journal: byId(cur.journal, inc.journal).sort((a, b) => b.day.localeCompare(a.day)),
    essayChecks: newer(cur.essayChecks, inc.essayChecks),
    days: [...new Set([...cur.days, ...inc.days])].sort(),
  };
}

/** Swaps one profile for the backup's copy of it; the other languages stay as they are. Study days and missions are joined. */
export function replaceProfile(cur: Data, inc: Data, lang: Lang): Data {
  return mergeData(
    filterData(cur, (l) => l !== lang),
    profileData(inc, lang),
  );
}
