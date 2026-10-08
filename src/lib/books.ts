import raw from "@/data/books.json";
import pgEn from "@/data/gutenberg.json";
import swEn from "@/data/storyweaver.json";
import rdEn from "@/data/readers-en.json";
import kidsEn from "@/data/kids-en.json";
import lvEn from "@/data/librivox-en.json";
import swFr from "@/data/storyweaver-fr.json";
import rdFr from "@/data/readers-fr.json";
import pgFr from "@/data/pg-fr.json";
import swDe from "@/data/storyweaver-de.json";
import rdDe from "@/data/readers-de.json";
import pgDe from "@/data/pg-de.json";
import swEs from "@/data/storyweaver-es.json";
import rdEs from "@/data/readers-es.json";
import pgEs from "@/data/pg-es.json";
import gsbEn from "@/data/gsb-en.json";
import bdEn from "@/data/bookdash-en.json";
import gsbFr from "@/data/gsb-fr.json";
import gsbDe from "@/data/gsb-de.json";
import gsbEs from "@/data/gsb-es.json";

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
  ln?: Lang; // language of the text; ELi readers are English
  zip?: string; // LibriVox: MP3 zip download
  text?: string; // LibriVox: where the text being read comes from
  time?: string; // LibriVox: total running time
  mp3?: string; // Global Storybooks: full narrated audio
  ill?: string; // illustrator
  ol?: number; // level as the source site numbers it (Global Storybooks 1–5)
  cover?: string; // absolute cover URL (free books)
  read?: string; // read-online URL (free books)
  epub?: string; // EPUB download URL (free books)
};

/** Languages the app can study. */
export type Lang = "en" | "fr" | "de" | "es";
export const LANGS: { code: Lang; name: string; native: string; voice: string }[] = [
  { code: "en", name: "Inglês", native: "English", voice: "en-GB" },
  { code: "fr", name: "Francês", native: "Français", voice: "fr-FR" },
  { code: "de", name: "Alemão", native: "Deutsch", voice: "de-DE" },
  { code: "es", name: "Espanhol", native: "Español", voice: "es-ES" },
];
export const langInfo = (l: Lang) => LANGS.find((x) => x.code === l)!;
/** English name of each language, for AI prompts. */
export const LANG_EN: Record<Lang, string> = { en: "English", fr: "French", de: "German", es: "Spanish" };

/**
 * The bases the shelf can show. Ids never collide: ELi ids are small, Gutenberg = 1e6 + id, StoryWeaver = 2e6 + id.
 * `kind` decides how a book is read and linked: the ELi site, Project Gutenberg, or StoryWeaver.
 */
export type Base = "eli" | "gutenberg" | "storyweaver" | "gsb-en" | "bookdash-en" | "gsb-fr" | "gsb-de" | "gsb-es" | "readers-en" | "kids-en" | "audio-en" | "sw-fr" | "readers-fr" | "pg-fr" | "sw-de" | "readers-de" | "pg-de" | "sw-es" | "readers-es" | "pg-es";
export type Kind = "eli" | "gutenberg" | "storyweaver" | "librivox" | "gsb" | "bookdash";
export const FREE_ID_BASE = 1_000_000;

type BaseDef = { id: Base; lang: Lang; kind: Kind; name: string; sub: string; graded: boolean; note?: string; books: Book[] };
const tag = (list: unknown, id: Base, ln: Lang) => (list as Book[]).map((b) => ({ ...b, src: id, ln }));

const SW_NOTE = "Livros ilustrados e curtos, escritos para crianças que estão aprendendo a ler, separados por nível de leitura (1 a 4: primeiras leituras, aprendendo a ler, lendo sozinho, lendo com fluência). São da Pratham Books e parceiros, com licença aberta, e muitos têm versão narrada. O CEFR ao lado é uma aproximação: nível 1 ≈ Pre-A1, 2 ≈ A1, 3 ≈ A2, 4 ≈ B1.";
const GSB_NOTE = "Histórias ilustradas do African Storybook traduzidas para várias línguas, todas com áudio narrado completo. Níveis 1 a 5 do site (primeiras palavras → histórias para ler em voz alta), com licença Creative Commons. O CEFR ao lado é uma aproximação: 1 ≈ Pre-A1, 2 ≈ A1, 3 ≈ A2, 4 e 5 ≈ B1.";
const READERS_NOTE = "Livros de leitura feitos para estudantes de idioma, em domínio público: cartilhas, coletâneas para iniciantes e literatura com notas e vocabulário. Leitura online ou EPUB, grátis. Os níveis são aproximados.";
const PG_NOTE = "Textos originais, sem adaptação, em domínio público no Project Gutenberg. Dá para ler online ou baixar em EPUB, de graça e legalmente. Os níveis são aproximados.";

export const BASE_DEFS: BaseDef[] = [
  { id: "eli", lang: "en", kind: "eli", name: "ELi Readers", sub: "Pre-A1 → C1, por headwords", graded: true, books: raw as Book[] },
  { id: "storyweaver", lang: "en", kind: "storyweaver", name: "StoryWeaver", sub: "livros ilustrados por nível de leitura", graded: true, note: SW_NOTE, books: tag(swEn, "storyweaver", "en") },
  { id: "gsb-en", lang: "en", kind: "gsb", name: "Global Storybooks", sub: "livros ilustrados por nível, com áudio", graded: true, note: GSB_NOTE, books: tag(gsbEn, "gsb-en", "en") },
  { id: "bookdash-en", lang: "en", kind: "bookdash", name: "Book Dash", sub: "livros ilustrados da África do Sul", graded: false, note: "Livros ilustrados criados por autores e artistas sul-africanos, com licença aberta (Creative Commons). Leia online ou baixe o ebook de graça no site do Book Dash. São para crianças pequenas, então servem para os primeiros níveis; o site não classifica por nível, por isso o Pre-A1 é estimado.", books: tag(bdEn, "bookdash-en", "en") },
  { id: "readers-en", lang: "en", kind: "gutenberg", name: "Gutenberg Readers", sub: "livros de leitura · série McGuffey e outros", graded: true, note: READERS_NOTE, books: tag(rdEn, "readers-en", "en") },
  { id: "kids-en", lang: "en", kind: "gutenberg", name: "Gutenberg Infantis", sub: "originais fáceis · Potter, Milne, Kipling…", graded: false, note: "Clássicos infantis em domínio público, curtos e com linguagem simples: um bom passo entre os graded readers e os romances. Leitura online ou EPUB, grátis. Os níveis são aproximados.", books: tag(kidsEn, "kids-en", "en") },
  { id: "audio-en", lang: "en", kind: "librivox", name: "LibriVox", sub: "audiolivros para ouvir", graded: false, note: "Audiolivros gravados por voluntários do LibriVox, em domínio público. Ouça online ou baixe os MP3; cada um tem o link do texto para ler junto. Os níveis são aproximados e pensados para escuta.", books: tag(lvEn, "audio-en", "en") },
  { id: "gutenberg", lang: "en", kind: "gutenberg", name: "Gutenberg Clássicos", sub: "originais completos", graded: false, note: PG_NOTE, books: tag(pgEn, "gutenberg", "en") },
  { id: "sw-fr", lang: "fr", kind: "storyweaver", name: "StoryWeaver", sub: "livres illustrés par niveau de lecture", graded: true, note: SW_NOTE, books: tag(swFr, "sw-fr", "fr") },
  { id: "gsb-fr", lang: "fr", kind: "gsb", name: "Global Storybooks", sub: "livres illustrés par niveau, avec audio", graded: true, note: GSB_NOTE, books: tag(gsbFr, "gsb-fr", "fr") },
  { id: "readers-fr", lang: "fr", kind: "gutenberg", name: "Gutenberg Readers", sub: "lectures pour débutants", graded: true, note: READERS_NOTE, books: tag(rdFr, "readers-fr", "fr") },
  { id: "pg-fr", lang: "fr", kind: "gutenberg", name: "Gutenberg Clássicos", sub: "Verne, Dumas, Leblanc…", graded: false, note: PG_NOTE, books: tag(pgFr, "pg-fr", "fr") },
  { id: "sw-de", lang: "de", kind: "storyweaver", name: "StoryWeaver", sub: "Bilderbücher nach Lesestufen", graded: true, note: SW_NOTE, books: tag(swDe, "sw-de", "de") },
  { id: "gsb-de", lang: "de", kind: "gsb", name: "Global Storybooks", sub: "Bilderbücher nach Stufen, mit Audio", graded: true, note: GSB_NOTE, books: tag(gsbDe, "gsb-de", "de") },
  { id: "readers-de", lang: "de", kind: "gutenberg", name: "Gutenberg Readers", sub: "Märchen für Anfänger…", graded: true, note: READERS_NOTE, books: tag(rdDe, "readers-de", "de") },
  { id: "pg-de", lang: "de", kind: "gutenberg", name: "Gutenberg Clássicos", sub: "Grimm, Kafka, Busch…", graded: false, note: PG_NOTE, books: tag(pgDe, "pg-de", "de") },
  { id: "sw-es", lang: "es", kind: "storyweaver", name: "StoryWeaver", sub: "libros ilustrados por nivel de lectura", graded: true, note: SW_NOTE, books: tag(swEs, "sw-es", "es") },
  { id: "gsb-es", lang: "es", kind: "gsb", name: "Global Storybooks", sub: "libros ilustrados por nivel, con audio", graded: true, note: GSB_NOTE, books: tag(gsbEs, "gsb-es", "es") },
  { id: "readers-es", lang: "es", kind: "gutenberg", name: "Gutenberg Readers", sub: "lecturas fáciles", graded: true, note: READERS_NOTE, books: tag(rdEs, "readers-es", "es") },
  { id: "pg-es", lang: "es", kind: "gutenberg", name: "Gutenberg Clássicos", sub: "Cervantes, Quiroga…", graded: false, note: PG_NOTE, books: tag(pgEs, "pg-es", "es") },
];
export const BASE_INFO = Object.fromEntries(
  BASE_DEFS.map((d) => [d.id, { ...d, site: d.kind === "eli" ? "site da ELi" : d.kind === "storyweaver" ? "StoryWeaver" : d.kind === "librivox" ? "LibriVox" : d.kind === "gsb" ? "Global Storybooks" : d.kind === "bookdash" ? "Book Dash" : "Project Gutenberg" }]),
) as Record<Base, BaseDef & { site: string }>;
export const basesFor = (lang: Lang) => BASE_DEFS.filter((d) => d.lang === lang);

export const BOOKS = BASE_INFO.eli.books;
export const ALL_BOOKS = BASE_DEFS.flatMap((d) => d.books);
export const BOOK_BY_ID = new Map(ALL_BOOKS.map((b) => [b.id, b]));
export const baseOf = (b: Book): Base => b.src ?? "eli";
export const kindOf = (b: Book): Kind => BASE_INFO[baseOf(b)].kind;
export const langOf = (b: Book): Lang => b.ln ?? "en";
/** True for every free, complete book (not an ELi reader). */
export const isFree = (b: Book) => kindOf(b) !== "eli";
export const baseBooks = (base: Base) => BASE_INFO[base].books;
export const booksFor = (lang: Lang) => basesFor(lang).flatMap((d) => d.books);

/** CEFR order, for sorting and for building a level ladder in any language. */
export const CEFR = ["Pre-A1", "A1", "A1.1", "A2", "A2/B1", "B1", "B2", "C1"];
export const cefrRank = (lv: string) => (CEFR.indexOf(lv) + 1 || 99);

/** How to name the book in Portuguese text (study prompts, labels). */
export function describeBook(b: Book) {
  const kind = kindOf(b);
  if (kind === "bookdash") return `o livro ilustrado "${b.t}", do Book Dash (África do Sul), para os primeiros níveis`;
  if (kind === "gsb") return `a história ilustrada "${b.t}" (${b.a}), do Global Storybooks, nível ${b.ol} do site (≈ ${b.lv})`;
  if (kind === "librivox") return `o audiolivro "${b.t}" (${b.a}), do LibriVox, nível aproximado ${b.lv}`;
  if (kind === "storyweaver") return `a história ilustrada "${b.t}" (${b.a}), do StoryWeaver, nível ${b.lv}`;
  if (kind === "gutenberg") return BASE_INFO[baseOf(b)].graded ? `o livro de leitura "${b.t}" (${b.a}), nível aproximado ${b.lv}` : `o clássico original "${b.t}" (${b.a}), sem adaptação, nível aproximado ${b.lv}`;
  return `o graded reader "${b.t}" (${b.a}), nível ${b.lv}, ${b.hw} headwords`;
}
/** Where the CEFR level comes from: the publisher, the source site's own scale, or my estimate. */
const SW_LEVEL: Record<string, number> = { "Pre-A1": 1, A1: 2, A2: 3, B1: 4 };
export function levelNote(b: Book) {
  const kind = kindOf(b);
  if (kind === "eli") return "nível da editora";
  if (kind === "storyweaver") return `StoryWeaver nível ${SW_LEVEL[b.lv] ?? "?"}`;
  if (kind === "gsb") return `Global Storybooks nível ${b.ol ?? "?"}`;
  if (kind === "bookdash") return "leitura inicial, estimado";
  return "nível estimado";
}

/** Short tag shown next to the level: headwords for ELi, otherwise what kind of free book it is. */
export const bookExtra = (b: Book) =>
  b.hw ? `${b.hw} headwords` : kindOf(b) === "bookdash" ? "livro ilustrado" : kindOf(b) === "gsb" ? "com áudio" : kindOf(b) === "librivox" ? `áudio · ${b.time ?? ""}` : kindOf(b) === "storyweaver" ? "história ilustrada" : BASE_INFO[baseOf(b)].graded ? "livro de leitura" : "original";

/** Position within the book's own base. */
export const bookNumber = (id: number) => {
  const b = BOOK_BY_ID.get(id);
  return (b ? baseBooks(baseOf(b)) : BOOKS).findIndex((x) => x.id === id) + 1;
};
export const bookUrl = (b: Book) =>
  kindOf(b) === "gutenberg" ? `https://www.gutenberg.org/ebooks/${b.pg}` : kindOf(b) === "storyweaver" || kindOf(b) === "librivox" || kindOf(b) === "gsb" || kindOf(b) === "bookdash" ? (b.read ?? "") : `https://www.elipublishing.com/p/${b.u}`;

/** Where else to get or hear the book. All links are searches or official pages: nothing is downloaded by the app. */
export function bookLinks(b: Book) {
  const q = encodeURIComponent(kindOf(b) === "gutenberg" ? `${b.t} ${b.a}` : b.t);
  return {
    eliAudio: kindOf(b) === "eli" && b.audio ? `${bookUrl(b)}#resourcesforstudents` : null,
    storyAudio: kindOf(b) === "storyweaver" && b.audio ? b.read : null,
    eliSample: kindOf(b) === "eli" && b.sample ? `${bookUrl(b)}#viewonline` : null,
    original: b.pg ? `https://www.gutenberg.org/ebooks/${b.pg}` : null,
    librivox: b.pg && langOf(b) === "en" ? `https://librivox.org/search?q=${encodeURIComponent(b.t.replace(/ - (Young|Teen|Bookmarks)$/, ""))}&search_form=get_results` : null,
    printed: kindOf(b) === "eli" || (kindOf(b) === "gutenberg" && !BASE_INFO[baseOf(b)].graded),
    listen: kindOf(b) === "librivox" ? b.read : null,
    gsbRead: kindOf(b) === "gsb" ? b.read : null,
    bookDash: kindOf(b) === "bookdash" ? b.read : null,
    gsbMp3: kindOf(b) === "gsb" ? b.mp3 : null,
    listenZip: kindOf(b) === "librivox" ? b.zip : null,
    listenText: kindOf(b) === "librivox" ? b.text : null, // StoryWeaver stories are digital only
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

const GRAMMAR_OTHER: Record<Exclude<Lang, "en">, Record<string, string[]>> = {
  fr: {
    "Pre-A1": ["Être e avoir no presente", "Artigos (le, la, les, un, une)", "Il y a"],
    A1: ["Presente dos verbos em -er", "Negação ne… pas", "Futur proche (aller + infinitivo)"],
    A2: ["Passé composé com avoir e être", "Pronomes complemento (le, la, lui)", "Comparativos"],
    B1: ["Imparfait × passé composé", "Subjonctif presente", "Pronomes relativos (qui, que, dont)"],
    B2: ["Plus-que-parfait", "Conditionnel passé e hipóteses", "Discurso indireto"],
    C1: ["Passé simple na narrativa", "Subjonctif em orações concessivas", "Inversão e registro formal"],
  },
  de: {
    "Pre-A1": ["Sein e haben no presente", "Artigos der, die, das", "Pronomes pessoais"],
    A1: ["Präsens e verbos separáveis", "Nominativ e Akkusativ", "Verbos modais (können, wollen)"],
    A2: ["Perfekt com haben e sein", "Dativ e preposições", "Weil e dass (verbo no fim)"],
    B1: ["Präteritum na narrativa", "Passiv", "Relativsätze"],
    B2: ["Konjunktiv II", "Genitiv", "Partizip como adjetivo"],
    C1: ["Konjunktiv I (discurso indireto)", "Nominalização", "Ordem das palavras na oração longa"],
  },
  es: {
    "Pre-A1": ["Ser e estar", "Presente regular", "Hay"],
    A1: ["Presente irregular", "Gustar e verbos parecidos", "Ir a + infinitivo"],
    A2: ["Pretérito perfecto × indefinido", "Imperfecto", "Pronomes de objeto"],
    B1: ["Imperfecto × indefinido", "Subjuntivo presente", "Futuro e condicional"],
    B2: ["Subjuntivo imperfecto", "Orações condicionais", "Estilo indireto"],
    C1: ["Pluscuamperfecto de subjuntivo", "Perífrases verbais", "Marcadores do discurso"],
  },
};
/** Grammar to watch for at a level, in the language being studied. */
export const grammarFor = (lang: Lang, lv: string) => (lang === "en" ? GRAMMAR_BY_LEVEL[lv] : GRAMMAR_OTHER[lang][lv === "A1.1" ? "A1" : lv === "A2/B1" ? "B1" : lv]) ?? [];

export const AFTER_READING_QUESTIONS = [
  "Who is the main character? Describe him or her in three words.",
  "Where and when does the story happen?",
  "What is the biggest problem in the story? How is it solved?",
  "Which character did you like most? Why?",
  "What was your favourite part of the book?",
  "Would you recommend this book to a friend? Why or why not?",
];

const QUESTIONS_OTHER: Record<Exclude<Lang, "en">, string[]> = {
  fr: [
    "Qui est le personnage principal ? Décris-le en trois mots.",
    "Où et quand se passe l'histoire ?",
    "Quel est le plus grand problème de l'histoire ? Comment est-il résolu ?",
    "Quel personnage as-tu préféré ? Pourquoi ?",
    "Quelle a été ta partie préférée du livre ?",
    "Recommanderais-tu ce livre à un ami ? Pourquoi ?",
  ],
  de: [
    "Wer ist die Hauptfigur? Beschreibe sie mit drei Wörtern.",
    "Wo und wann spielt die Geschichte?",
    "Was ist das größte Problem in der Geschichte? Wie wird es gelöst?",
    "Welche Figur hat dir am besten gefallen? Warum?",
    "Was war dein Lieblingsteil des Buches?",
    "Würdest du das Buch einem Freund empfehlen? Warum (nicht)?",
  ],
  es: [
    "¿Quién es el personaje principal? Descríbelo en tres palabras.",
    "¿Dónde y cuándo ocurre la historia?",
    "¿Cuál es el mayor problema de la historia? ¿Cómo se resuelve?",
    "¿Qué personaje te gustó más? ¿Por qué?",
    "¿Cuál fue tu parte favorita del libro?",
    "¿Recomendarías este libro a un amigo? ¿Por qué?",
  ],
};
export const questionsFor = (lang: Lang) => (lang === "en" ? AFTER_READING_QUESTIONS : QUESTIONS_OTHER[lang]);
