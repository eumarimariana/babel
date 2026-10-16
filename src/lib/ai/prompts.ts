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
export const getStudyLang = () => studyLang;
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
  return `"${b.t}" by ${b.a} (${BASE_INFO[baseOf(b)].name}, level ${b.lv}, ${b.hw} headwords, ${b.cat})`;
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
    b.s ? `Book summary: ${b.s}` : "",
    b.voc ? `Publisher vocabulary areas: ${b.voc}` : "",
    b.lang ? `Publisher grammar syllabus: ${b.lang}` : "",
    `Give 12 words or expressions that are likely in this book and useful at ${b.lv} (not trivially easy), each with an example sentence connected to the story;`,
    `3 grammar points of ${L(b)} typical of ${b.lv}, explained briefly in Portuguese with a ${L(b)} example;`,
    `and 6 questions in simple ${L(b)} for after reading (4 about the plot, 2 asking for the learner's opinion).`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function quotePrompt(text: string, book?: Book) {
  return (
    `Translate this ${L(book)} passage${book ? ` from ${bookLine(book)}` : ""} into natural Brazilian Portuguese, keeping its tone and line breaks.\n` +
    `"""${text.slice(0, 3000)}"""\n\n` +
    "Reply with only the translation: no quotes around it, no notes, no explanations."
  );
}

/** What was written, for the correction prompt. */
export type WritingContext =
  | { kind: "summary"; book: Book }
  | { kind: "diary"; task: string }
  | { kind: "sentence"; word: string; meaning: string };

const about = (c: WritingContext) =>
  c.kind === "summary"
    ? `a short summary of ${bookLine(c.book)} that they just read`
    : c.kind === "diary"
      ? `a short diary entry for the task "${c.task}"`
      : `one sentence to practise the word or expression "${c.word.slice(0, 80)}"${c.meaning ? ` (meaning: ${c.meaning.slice(0, 80)})` : ""}; also check that the word is used in the right sense`;

/** Correction of anything the learner wrote, as structured data (see CorrectionSchema). */
export function writingPrompt(lang: Lang, c: WritingContext, text: string, level: string) {
  return [
    `A Brazilian learner of ${LANG_EN[lang]} (around CEFR ${level}) wrote ${about(c)}:`,
    `"""${text.slice(0, 5000)}"""`,
    "Correct it like a kind, precise teacher:",
    `- corrected: the whole text in correct, natural ${LANG_EN[lang]}, changing as little as possible;`,
    "- mistakes: each real mistake with the fragment copied exactly from the learner's text, the fix, a short explanation in Brazilian Portuguese, its type and the grammar point;",
    "- natural: what a native speaker would say differently, even when it is not wrong;",
    "- words: useful words from the corrected text; praise: one specific compliment; level and score for this text.",
    "If the text has no mistakes, say so with an empty mistakes list.",
  ].join("\n");
}

/** The same request for a chat (no key): plain Portuguese instructions to paste anywhere. */
export function writingChatPrompt(lang: Lang, c: WritingContext, text: string) {
  return (
    `Sou brasileiro e estudo ${{ en: "inglês", fr: "francês", de: "alemão", es: "espanhol" }[lang]}. Escrevi ${c.kind === "summary" ? `um resumo de "${c.book.t}"` : c.kind === "diary" ? `um texto de diário sobre: ${c.task}` : `uma frase para treinar "${c.word}"`}. Corrija em português com:\n` +
    "1) a versão corrigida, mudando o mínimo;\n2) cada erro como \"errado → certo: explicação\", dizendo se é gramática, vocabulário, ortografia, ordem ou pontuação;\n" +
    "3) até 3 dicas para soar mais natural;\n4) 3 a 5 palavras úteis com tradução;\n5) o que eu fiz bem, o nível CEFR do texto e uma nota de 0 a 10.\n\n" +
    `"""${text.trim()}"""`
  );
}

export const CORRECTION_JSON_SHAPE =
  'Reply with only a JSON object, no markdown: {"corrected": string, "mistakes": [{"wrong": string, "right": string, "why": string, "type": "gramática" | "vocabulário" | "ortografia" | "ordem das palavras" | "pontuação", "topic": string}], "natural": [string], "words": [{"w": string, "pt": string}], "praise": string, "level": string, "score": number}';

/** Grammar exercises on one topic, in the shape of a quiz (all questions of kind "grammar"). */
export function drillPrompt(topic: string, level: string) {
  return [
    `Language being studied: ${L()}.`,
    `Write 8 multiple-choice grammar exercises on "${topic}" for a learner at CEFR level ${level}.`,
    `Each exercise is one short ${L()} sentence with a blank (___) or a short question, exactly 4 options and one correct answer; every question has kind "grammar".`,
    "Mix forms (affirmative, negative, question) and everyday contexts. Wrong options must be plausible mistakes a Brazilian learner would make. Vary the position of the correct answer.",
    `Explanations go in Brazilian Portuguese, one sentence, and start with the topic name ("${topic}: …").`,
  ].join("\n");
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
