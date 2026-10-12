import type { Lang } from "@/lib/books";
import enResources from "@/data/recursos-en.json";

/** Free study sites, playlists and dictionaries. Only links: the content stays on each site. */
export type ResourceKind = "grammar" | "vocab" | "listening" | "reading" | "games" | "course" | "test" | "dictionary" | "video" | "pronunciation" | "writing" | "tips";
export type Resource = {
  id: string;
  name: string;
  url: string;
  kind: ResourceKind;
  levels: string[]; // CEFR levels the material serves
  siteLang: "pt" | "en";
  signup?: boolean; // asks for a (free) account
  minutes?: number; // a typical session
  topics?: string[]; // grammar topics, for linking with the books later
  playlist?: string; // YouTube playlist id
  videos?: string[]; // the playlist's video ids, in order (lesson 1 = videos[0])
  lessons?: Record<string, number>; // grammar topic id → lesson that explains it
  note: string;
  ln?: Lang; // only on links added by hand
  mine?: boolean; // added by hand
};

export const RESOURCE_KINDS: { value: ResourceKind; label: string }[] = [
  { value: "grammar", label: "Gramática" },
  { value: "vocab", label: "Vocabulário" },
  { value: "listening", label: "Escuta" },
  { value: "reading", label: "Leitura" },
  { value: "pronunciation", label: "Pronúncia" },
  { value: "writing", label: "Escrita" },
  { value: "video", label: "Vídeos" },
  { value: "games", label: "Jogos" },
  { value: "course", label: "Cursos" },
  { value: "test", label: "Testes" },
  { value: "dictionary", label: "Dicionários" },
  { value: "tips", label: "Dicas" },
];

export const RESOURCE_LEVELS = ["Pre-A1", "A1", "A2", "B1", "B2", "C1"];

/** Book levels like "A1.1" or "A2/B1" mapped onto the plain CEFR steps the materials use. */
export function plainLevel(lv: string | undefined) {
  if (!lv) return "";
  if (lv.startsWith("Pre")) return "Pre-A1";
  if (lv.startsWith("A1")) return "A1";
  if (lv.startsWith("A2")) return "A2";
  return RESOURCE_LEVELS.includes(lv) ? lv : "";
}

const BY_LANG: Partial<Record<Lang, Resource[]>> = { en: enResources as Resource[] };
export const resourcesFor = (lang: Lang) => BY_LANG[lang] ?? [];
/** The catalog plus the links added by hand for that language. */
export const allResourcesFor = (lang: Lang, mine: Resource[]) => [...resourcesFor(lang), ...mine.filter((r) => r.ln === lang)];

/** Link straight to lesson n of a playlist when its videos are known, otherwise the playlist itself. */
export const lessonUrl = (r: Resource, n?: number) =>
  r.playlist && n && r.videos?.[n - 1] ? `https://www.youtube.com/watch?v=${r.videos[n - 1]}&list=${r.playlist}&index=${n}` : r.url;

/** The playlist lessons (videos in Portuguese) that explain a grammar topic. */
export const videoLessons = (topic: string, lang: Lang) =>
  resourcesFor(lang).flatMap((r) => (r.lessons?.[topic] ? [{ resource: r, lesson: r.lessons[topic], url: lessonUrl(r, r.lessons[topic]) }] : []));

/** Playlist id of a YouTube link ("…playlist?list=PL…" or a video inside a playlist), if it is one. */
export function youtubePlaylist(url: string) {
  try {
    const u = new URL(url);
    if (!/(^|\.)youtube\.com$|^youtu\.be$/.test(u.hostname)) return undefined;
    return u.searchParams.get("list") ?? undefined;
  } catch {
    return undefined;
  }
}

export const siteOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");

/**
 * Grammar topics, recognised in the free text of the level list, the AI kit and quiz questions,
 * each linked to the page that explains it (Perfect English Grammar and EnglishPage have one page per topic).
 */
export type GrammarTopic = { id: string; label: string; match: RegExp; links: { name: string; url: string }[] };

const peg = (page: string) => ({ name: "Perfect English Grammar", url: `https://www.perfect-english-grammar.com/${page}.html` });
const ep = (page: string) => ({ name: "EnglishPage", url: `https://www.englishpage.com/${page}.html` });

export const GRAMMAR_TOPICS: GrammarTopic[] = [
  { id: "there-is", label: "There is / there are", match: /there (is|are)/i, links: [peg("there-is-there-are"), { name: "Grammarly", url: "https://www.grammarly.com/blog/grammar/there-is-there-are/" }] },
  { id: "present-simple", label: "Present simple", match: /present simple|simple present|have got/i, links: [peg("present-simple"), ep("verbpage/simplepresent")] },
  { id: "present-continuous", label: "Present continuous", match: /present (continuous|progressive)/i, links: [peg("present-continuous"), ep("verbpage/presentcontinuous")] },
  { id: "past-simple", label: "Past simple", match: /past simple|simple past|verbos (regulares|irregulares)/i, links: [peg("past-simple"), ep("verbpage/simplepast")] },
  { id: "past-continuous", label: "Past continuous", match: /past (continuous|progressive)/i, links: [peg("past-continuous"), ep("verbpage/pastcontinuous")] },
  { id: "present-perfect", label: "Present perfect", match: /present perfect/i, links: [peg("present-perfect"), peg("present-perfect-or-past-simple")] },
  { id: "past-perfect", label: "Past perfect", match: /past perfect/i, links: [peg("past-perfect"), ep("verbpage/pastperfect")] },
  { id: "future", label: "Will e going to", match: /\bwill\b|going to|future|futuro/i, links: [peg("will-or-be-going-to"), ep("verbpage/simplefuture")] },
  { id: "used-to", label: "Used to", match: /used to/i, links: [peg("used-to"), ep("verbpage/usedto")] },
  { id: "comparatives", label: "Comparativos e superlativos", match: /comparativ|superlativ/i, links: [peg("adjectives-comparative-and-superlative")] },
  { id: "can", label: "Can (habilidade)", match: /\bcan\b.*(habilidade|abilit)|(habilidade|abilit).*\bcan\b/i, links: [peg("modal-verbs-of-ability")] },
  { id: "deduction", label: "Modais de dedução", match: /dedu[cç]|must have|can't have|might have|probabilit/i, links: [peg("modal-verbs-of-probability"), peg("past-modals")] },
  { id: "modals", label: "Verbos modais", match: /\bmodal|\bmust\b|\bshould\b|\bmight\b/i, links: [peg("modal-verbs"), ep("modals/modalintro")] },
  { id: "conditionals", label: "Conditionals", match: /conditional|condicion/i, links: [peg("conditionals"), ep("conditional/conditionalintro")] },
  { id: "passive", label: "Voz passiva", match: /passiv/i, links: [peg("passive"), ep("verbpage/activepassive")] },
  // "discurso indireto livre" is a narrative technique, not reported speech
  { id: "reported-speech", label: "Reported speech", match: /reported speech|indirect speech|discurso indireto(?! livre)|estilo indireto/i, links: [peg("reported-speech"), peg("reporting-verbs")] },
  { id: "relative-clauses", label: "Orações relativas", match: /relativ/i, links: [peg("relative-clauses"), peg("relative-pronouns")] },
  { id: "inversion", label: "Inversão", match: /invers/i, links: [peg("inversion"), { name: "EnglishGrammar.org", url: "https://www.englishgrammar.org/inversion/" }] },
  // a narrative technique: explained in Portuguese first, the concept is the same in every language
  { id: "free-indirect", label: "Discurso indireto livre", match: /discurso indireto livre|free indirect/i, links: [{ name: "Wikipédia", url: "https://pt.wikipedia.org/wiki/Discurso_indireto_livre" }, { name: "Wikipedia (en)", url: "https://en.wikipedia.org/wiki/Free_indirect_speech" }] },
  { id: "gerunds", label: "Gerúndio e infinitivo", match: /gerund|infinitive/i, links: [peg("gerunds-and-infinitives")] },
  { id: "phrasal-verbs", label: "Phrasal verbs", match: /phrasal/i, links: [peg("phrasal-verbs-1")] },
  { id: "wish", label: "Wish", match: /\bwish\b/i, links: [peg("wish")] },
];
export const TOPIC_BY_ID = new Map(GRAMMAR_TOPICS.map((t) => [t.id, t]));

/** Topics named in a piece of text. Only English has links for now. */
export function topicsIn(text: string, lang: Lang) {
  if (lang !== "en") return [];
  const found = GRAMMAR_TOPICS.filter((t) => t.match.test(text));
  // "must have" is deduction, not the general modals page
  return found.some((t) => t.id === "deduction") ? found.filter((t) => t.id !== "modals") : found;
}

/** "Leitura do dia": sites that publish new graded texts or audio every day, by level (English only for now). */
export type DailySource = { name: string; url: string; levels: string[]; what: string };
export const DAILY_EN: DailySource[] = [
  { name: "News in Levels · nível 1", url: "https://www.newsinlevels.com/level/level-1/", levels: ["Pre-A1", "A1"], what: "notícia curtinha com áudio, em inglês bem simples" },
  { name: "ESL Fast", url: "https://www.eslfast.com/index.htm", levels: ["Pre-A1", "A1", "A2"], what: "histórias e diálogos fáceis, com áudio" },
  { name: "News in Levels · nível 2", url: "https://www.newsinlevels.com/level/level-2/", levels: ["A1", "A2"], what: "a notícia do dia reescrita para o seu nível, com áudio" },
  { name: "Breaking News English", url: "https://breakingnewsenglish.com/", levels: ["A2", "B1", "B2"], what: "cada notícia em vários níveis, com exercícios" },
  { name: "VOA60: Watch & Learn", url: "https://learningenglish.voanews.com/z/3613", levels: ["A2", "B1"], what: "notícias em vídeo de 1 minuto, narradas devagar" },
  { name: "News in Levels · nível 3", url: "https://www.newsinlevels.com/level/level-3/", levels: ["B1"], what: "notícia mais longa, com áudio" },
  { name: "VOA · As It Is", url: "https://learningenglish.voanews.com/z/3521", levels: ["B1", "B2"], what: "reportagens em inglês mais lento, com áudio e texto" },
  { name: "BBC 6 Minute English", url: "https://www.bbc.co.uk/learningenglish/english/features/6-minute-english", levels: ["B1", "B2", "C1"], what: "conversa de 6 minutos com transcrição e vocabulário" },
  { name: "BBC Lingohack", url: "https://www.bbc.co.uk/learningenglish/english/features/lingohack", levels: ["B2"], what: "trecho do noticiário da BBC com as palavras explicadas" },
  { name: "BBC News", url: "https://www.bbc.com/news", levels: ["B2", "C1"], what: "o noticiário de verdade, sem adaptação" },
  { name: "The Conversation", url: "https://theconversation.com/global", levels: ["C1"], what: "artigos de pesquisadores em linguagem acessível" },
];

/** Today's pick for a level (changes every day), plus the other sources of that level. */
export function dailyRead(level: string, day: string) {
  const fit = DAILY_EN.filter((d) => d.levels.includes(level));
  const list = fit.length ? fit : DAILY_EN.slice(0, 3);
  const seed = [...day].reduce((n, c) => n * 31 + c.charCodeAt(0), 7) >>> 0;
  const pick = list[seed % list.length];
  return { pick, others: list.filter((d) => d !== pick) };
}
