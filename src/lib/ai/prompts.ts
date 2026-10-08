import type { Book } from "@/lib/books";

/** Prompt text shared by every AI provider, so Claude, Gemini, Groq and OpenRouter get the same task. */
export const SYSTEM =
  "You are a patient English teacher for a Brazilian Portuguese speaker who studies English by reading graded readers and, later, unabridged classics. " +
  "Write explanations meant for the learner in Brazilian Portuguese and English examples at the learner's level.";

export const bookLine = (b: Book) =>
  b.src === "storyweaver"
    ? `"${b.t}" by ${b.a} (a free illustrated story from StoryWeaver, level ${b.lv})`
    : b.hw
      ? `"${b.t}" by ${b.a} (ELi Readers, level ${b.lv}, ${b.hw} headwords, ${b.cat})`
      : `"${b.t}" by ${b.a} (the unabridged original from Project Gutenberg, roughly level ${b.lv}, ${b.cat})`;

export function wordPrompt(word: string, book?: Book) {
  return (
    `Word or expression: "${word.slice(0, 80)}".` +
    (book ? `\nThe learner found it in ${bookLine(book)}. Pick the sense most likely in that story and define it at that level.` : "")
  );
}

export function kitPrompt(b: Book) {
  return [
    `Prepare the learner to read ${bookLine(b)}.`,
    `Book summary: ${b.s}`,
    b.voc ? `Publisher vocabulary areas: ${b.voc}` : "",
    b.lang ? `Publisher grammar syllabus: ${b.lang}` : "",
    `Give 12 words or expressions that are likely in this book and useful at ${b.lv} (not trivially easy), each with an example sentence connected to the story;`,
    `3 grammar points typical of ${b.lv}, explained briefly in Portuguese with an English example;`,
    "and 6 questions in simple English for after reading (4 about the plot, 2 asking for the learner's opinion).",
  ]
    .filter(Boolean)
    .join("\n");
}

export function correctPrompt(b: Book, text: string) {
  return (
    `The learner just read ${bookLine(b)} and wrote this text about it:\n"""${text.slice(0, 5000)}"""\n\n` +
    "Reply in Portuguese, plain text without markdown symbols, with these sections in this order:\n" +
    "VERSÃO CORRIGIDA — the corrected English text, changing as little as possible.\n" +
    'ERROS — one per line as "errado → certo: explicação curta".\n' +
    "PARA SOAR MAIS NATURAL — 2 or 3 suggestions.\n" +
    "PALAVRAS NOVAS — 3 useful English words or expressions to talk about this book, with translation.\n" +
    "NOTA — a score from 0 to 10 and one encouraging sentence."
  );
}

export function quotePrompt(text: string, book?: Book) {
  return (
    `Translate this passage${book ? ` from ${bookLine(book)}` : ""} into natural Brazilian Portuguese, keeping its tone and line breaks.\n` +
    `"""${text.slice(0, 3000)}"""\n\n` +
    "Reply with only the translation: no quotes around it, no notes, no explanations."
  );
}

/** Models sometimes wrap a plain answer in quotes or a code fence; strip that. */
export const cleanTranslation = (t: string) =>
  t
    .trim()
    .replace(/^```[a-z]*\s*|\s*```$/g, "")
    .replace(/^["“”«»]+|["“”«»]+$/g, "")
    .trim();

/** JSON shapes spelled out for providers without schema-enforced output. */
export const WORD_JSON_SHAPE =
  'Reply with only a JSON object, no other text: {"pos": "part of speech in English", "pt": "short Brazilian Portuguese translation, 1-4 words", "en": "simple English definition", "ex": "one natural example sentence"}';

export const KIT_JSON_SHAPE =
  'Reply with only a JSON object, no other text, in exactly this shape: {"words": [{"w": "word", "pos": "part of speech", "pt": "tradução", "en": "simple English definition", "ex": "example sentence"}], "grammar": [{"point": "grammar point name", "pt": "explicação curta em português", "example": "English example"}], "questions": ["question"]}';
