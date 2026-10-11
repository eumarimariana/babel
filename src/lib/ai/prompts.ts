import { BASE_INFO, LANG_EN, baseOf, kindOf, langOf, type Book, type Lang } from "@/lib/books";

/** Prompt text shared by every AI provider, so Claude, Gemini, Groq and OpenRouter get the same task. */
export const SYSTEM =
  "You are a patient language teacher for a Brazilian Portuguese speaker who learns a foreign language by reading graded readers and books. " +
  "Each request says which language is being studied. Write explanations meant for the learner in Brazilian Portuguese, and examples in the studied language at the learner's level.";

/** The language the learner is studying right now; the app sets it when the profile changes. */
let studyLang: Lang = "en";
export const setStudyLang = (l: Lang) => {
  studyLang = l;
};
const L = (b?: Book) => LANG_EN[b ? langOf(b) : studyLang];

export const bookLine = (b: Book) => {
  const kind = kindOf(b);
  if (kind === "storyweaver") return `"${b.t}" by ${b.a} (a free illustrated ${L(b)} story from StoryWeaver, level ${b.lv})`;
  if (kind === "bookdash") return `"${b.t}" (a free illustrated ${L(b)} picture book from Book Dash, South Africa, for beginning readers)`;
  if (kind === "gsb") return `"${b.t}" by ${b.a} (a free illustrated ${L(b)} story from Global Storybooks, reading level ${b.ol} of 5, about ${b.lv})`;
  if (kind === "librivox") return `"${b.t}" by ${b.a} (a free ${L(b)} audiobook from LibriVox, roughly level ${b.lv} for listening)`;
  if (kind === "gutenberg")
    return BASE_INFO[baseOf(b)].graded
      ? `"${b.t}" by ${b.a} (a public-domain ${L(b)} reader for language learners, roughly level ${b.lv})`
      : `"${b.t}" by ${b.a} (the unabridged ${L(b)} original from Project Gutenberg, roughly level ${b.lv}, ${b.cat})`;
  return `"${b.t}" by ${b.a} (ELi Readers, level ${b.lv}, ${b.hw} headwords, ${b.cat})`;
};

export function wordPrompt(word: string, book?: Book) {
  return (
    `Language being studied: ${L(book)}.\nWord or expression: "${word.slice(0, 80)}".` +
    (book ? `\nThe learner found it in ${bookLine(book)}. Pick the sense most likely in that story and define it at that level.` : "")
  );
}

export function kitPrompt(b: Book) {
  return [
    `Language being studied: ${L(b)}.`,
    `Prepare the learner to read ${bookLine(b)}.`,
    `Book summary: ${b.s}`,
    b.voc ? `Publisher vocabulary areas: ${b.voc}` : "",
    b.lang ? `Publisher grammar syllabus: ${b.lang}` : "",
    `Give 12 words or expressions that are likely in this book and useful at ${b.lv} (not trivially easy), each with an example sentence connected to the story;`,
    `3 grammar points of ${L(b)} typical of ${b.lv}, explained briefly in Portuguese with a ${L(b)} example;`,
    `and 6 questions in simple ${L(b)} for after reading (4 about the plot, 2 asking for the learner's opinion).`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function correctPrompt(b: Book, text: string) {
  return (
    `Language being studied: ${L(b)}.\nThe learner just read ${bookLine(b)} and wrote this text about it:\n"""${text.slice(0, 5000)}"""\n\n` +
    "Reply in Portuguese, plain text without markdown symbols, with these sections in this order:\n" +
    `VERSÃO CORRIGIDA — the corrected ${L(b)} text, changing as little as possible.\n` +
    'ERROS — one per line as "errado → certo: explicação curta".\n' +
    "PARA SOAR MAIS NATURAL — 2 or 3 suggestions.\n" +
    `PALAVRAS NOVAS — 3 useful ${L(b)} words or expressions to talk about this book, with translation.\n` +
    "NOTA — a score from 0 to 10 and one encouraging sentence."
  );
}

export function quotePrompt(text: string, book?: Book) {
  return (
    `Translate this ${L(book)} passage${book ? ` from ${bookLine(book)}` : ""} into natural Brazilian Portuguese, keeping its tone and line breaks.\n` +
    `"""${text.slice(0, 3000)}"""\n\n` +
    "Reply with only the translation: no quotes around it, no notes, no explanations."
  );
}

/** Feedback on one sentence the learner wrote to practise a word. */
export function sentencePrompt(word: string, meaning: string, sentence: string) {
  return (
    `The learner is practising the ${L()} word or expression "${word.slice(0, 80)}"${meaning ? ` (meaning: ${meaning.slice(0, 80)})` : ""} and wrote this sentence:\n` +
    `"""${sentence.slice(0, 600)}"""\n\n` +
    "Answer in Brazilian Portuguese, in at most 4 short lines, no preamble: first say if the sentence is correct and natural and if the word is used in the right sense; " +
    `then, if anything should change, give the corrected sentence in ${L()}; end with one short tip.`
  );
}

/** A 10-question multiple-choice quiz on the book and on the language the learner met in it. */
export function quizPrompt(b: Book, words: string[], grammar: string[]) {
  return [
    `Language being studied: ${L(b)}.`,
    `The learner just read ${bookLine(b)}.`,
    b.s ? `Book summary: ${b.s}` : "",
    "Write a 10-question multiple-choice quiz, every question with exactly 4 options and one correct answer:",
    `- 4 "story" questions about what happens in the book, written in simple ${L(b)} at level ${b.lv};`,
    `- 3 "vocab" questions about words in context${words.length ? ` (prefer these words the learner noted: ${words.slice(0, 20).join(", ")})` : ""};`,
    `- 3 "grammar" questions in ${L(b)} on points typical of ${b.lv}${grammar.length ? ` such as ${grammar.join("; ")}` : ""}.`,
    "Wrong options must be plausible. Vary the position of the correct answer. Explanations go in Brazilian Portuguese, one or two sentences.",
  ]
    .filter(Boolean)
    .join("\n");
}

export const QUIZ_JSON_SHAPE =
  'Reply with only a JSON object, no other text, in exactly this shape: {"questions": [{"kind": "story | vocab | grammar", "q": "question", "options": ["a", "b", "c", "d"], "answer": 0, "why": "explicação curta em português"}]}';

/** Models sometimes wrap a plain answer in quotes or a code fence; strip that. */
export const cleanTranslation = (t: string) =>
  t
    .trim()
    .replace(/^```[a-z]*\s*|\s*```$/g, "")
    .replace(/^["“”«»]+|["“”«»]+$/g, "")
    .trim();

/** JSON shapes spelled out for providers without schema-enforced output. */
export const WORD_JSON_SHAPE =
  'Reply with only a JSON object, no other text: {"pos": "part of speech, in Portuguese (e.g. substantivo feminino, verbo)", "pt": "short Brazilian Portuguese translation, 1-4 words", "en": "simple definition written in the language being studied", "ex": "one natural example sentence in the language being studied"}';

export const KIT_JSON_SHAPE =
  'Reply with only a JSON object, no other text, in exactly this shape: {"words": [{"w": "word", "pos": "part of speech", "pt": "tradução", "en": "simple definition in the studied language", "ex": "example sentence"}], "grammar": [{"point": "grammar point name", "pt": "explicação curta em português", "example": "example in the studied language"}], "questions": ["question"]}';
