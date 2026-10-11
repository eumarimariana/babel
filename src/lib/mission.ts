import { grammarFor, langOf, type Book, type Lang } from "@/lib/books";
import { RESOURCE_KINDS, allResourcesFor, lessonUrl, plainLevel, topicsIn, TOPIC_BY_ID, type Resource, type ResourceKind } from "@/lib/resources";
import { addDays, type Data } from "@/lib/store";

/** One step of the daily mission. `id` stays the same all day, so ticking it survives reloads. */
export type MissionItem = {
  id: string;
  title: string;
  detail: string;
  area: string; // shown as a tag: Estante, Gramática, Escuta…
  minutes: number;
  href?: string; // external page
  go?: { tab: string } | { book: number }; // somewhere in the app
};

// skills the mission rotates through, besides reading the book and the reviews
const SKILLS: ResourceKind[] = ["listening", "pronunciation", "reading", "video", "vocab", "writing"];
const KIND_LABEL = Object.fromEntries(RESOURCE_KINDS.map((k) => [k.value, k.label])) as Record<ResourceKind, string>;

/** A small number from the date, so the picks change every day but not on every render. */
const daySeed = (day: string) => [...day].reduce((n, c) => n * 31 + c.charCodeAt(0), 7) >>> 0;

/** A short session from the level, the book in progress, the last quiz and the skill least used this week. No AI. */
export function buildMission(data: Data, lang: Lang, day: string, book?: Book): MissionItem[] {
  const items: MissionItem[] = [];
  const seed = daySeed(day);
  const level = plainLevel(book?.lv);

  if (book) {
    const reading = data.progress[book.id]?.st === "reading";
    items.push({ id: `read-${book.id}`, title: `${reading ? "Ler mais um capítulo de" : "Começar"} “${book.t}”`, detail: `${book.lv} · ${book.a}`, area: "Estante", minutes: 10, go: { book: book.id } });
  }

  // grammar: what went wrong in the most recent quiz, otherwise a point of the level
  const lastGaps = Object.values(data.scores)
    .filter((s) => s.gaps?.length)
    .sort((a, b) => b.at.localeCompare(a.at))[0]?.gaps;
  const gap = lastGaps?.map((id) => TOPIC_BY_ID.get(id)).find(Boolean);
  const levelTopics = book ? grammarFor(langOf(book), book.lv).flatMap((g) => topicsIn(g, lang)) : [];
  const topic = gap ?? levelTopics[seed % Math.max(1, levelTopics.length)];
  if (topic) {
    const link = topic.links[0];
    items.push({ id: `grammar-${topic.id}`, title: `${topic.label} – ${link.name}`, detail: gap ? "você errou no último quiz" : `gramática do ${book?.lv}`, area: "Gramática", minutes: 5, href: link.url });
  }

  // one material for the skill used least in the last 7 days, preferring the ones marked "Usando"
  const pool = allResourcesFor(lang, data.myResources).filter((r) => SKILLS.includes(r.kind) && (!level || r.levels.includes(level)) && data.resources[r.id]?.st !== "done");
  if (pool.length) {
    const used = new Map<ResourceKind, number>();
    for (let i = 1; i <= 7; i++)
      for (const id of data.missions[addDays(day, -i)] ?? []) {
        const r = pool.find((x) => id === `res-${x.id}`);
        if (r) used.set(r.kind, (used.get(r.kind) ?? 0) + 1);
      }
    const kinds = SKILLS.filter((k) => pool.some((r) => r.kind === k));
    const fewest = Math.min(...kinds.map((k) => used.get(k) ?? 0));
    const least = kinds.filter((k) => (used.get(k) ?? 0) === fewest);
    const kind = least[seed % least.length];
    const ofKind = pool.filter((r) => r.kind === kind);
    const doing = ofKind.filter((r) => data.resources[r.id]?.st === "doing");
    const r: Resource = (doing.length ? doing : ofKind)[(seed >> 3) % (doing.length || ofKind.length)];
    const lesson = data.resources[r.id]?.lesson;
    items.push({ id: `res-${r.id}`, title: r.name, detail: lesson ? `continuar na aula ${lesson}` : r.note.split(". ")[0], area: KIND_LABEL[r.kind], minutes: r.minutes ?? 10, href: lessonUrl(r, lesson) });
  }

  const due = data.words.filter((w) => (w.ln ?? "en") === lang && w.due <= day).length;
  if (due) items.push({ id: "review", title: `Revisar ${due} ${due === 1 ? "palavra" : "palavras"}`, detail: "flashcards de hoje", area: "Revisões", minutes: Math.min(15, Math.max(3, Math.ceil(due / 3))), go: { tab: "review" } });
  else items.push({ id: "words", title: "Anotar 5 palavras novas", detail: "do livro que você está lendo", area: "Vocabulário", minutes: 5, go: { tab: "vocab" } });

  return items;
}
