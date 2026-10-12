import { z } from "zod";

export const WordInfoSchema = z.object({
  pos: z.string().describe("part of speech, e.g. adjective, phrasal verb, substantivo feminino"),
  pt: z.string().describe("short Brazilian Portuguese translation, 1-4 words, up to 2 options"),
  en: z.string().describe("simple definition written in the language being studied"),
  ex: z.string().describe("one natural example sentence using the word"),
});

export const KitSchema = z.object({
  words: z.array(
    z.object({
      w: z.string(),
      pos: z.string(),
      pt: z.string(),
      en: z.string(),
      ex: z.string(),
    }),
  ),
  grammar: z.array(z.object({ point: z.string(), pt: z.string(), example: z.string() })),
  questions: z.array(z.string()),
});

export const QuizSchema = z.object({
  questions: z.array(
    z.object({
      kind: z.enum(["story", "vocab", "grammar"]).describe("story = comprehension, vocab = word in context, grammar = grammar of the level"),
      q: z.string().describe("the question, in simple language at the learner's level"),
      options: z.array(z.string()).describe("exactly 4 answer options"),
      answer: z.number().int().describe("index (0-3) of the correct option"),
      why: z.string().describe("short explanation in Brazilian Portuguese of why that answer is right"),
    }),
  ),
});

export const MISTAKE_TYPES = ["gramática", "vocabulário", "ortografia", "ordem das palavras", "pontuação"] as const;

/** A structured correction of something the learner wrote (book summary, diary entry, practice sentence). */
export const CorrectionSchema = z.object({
  corrected: z.string().describe("the whole text rewritten correctly and naturally, changing as little as possible and keeping the learner's ideas and level"),
  mistakes: z
    .array(
      z.object({
        wrong: z.string().describe("the mistaken words copied EXACTLY as they appear in the learner's text (a short fragment, not the whole sentence)"),
        right: z.string().describe("what should replace that fragment"),
        why: z.string().describe("short explanation in Brazilian Portuguese"),
        type: z.enum(MISTAKE_TYPES),
        topic: z.string().describe('the grammar point in English, e.g. "past simple", "present perfect", "articles", "prepositions"; empty string if not grammar'),
      }),
    )
    .describe("every real mistake, at most 12, in the order they appear; style preferences are not mistakes"),
  natural: z.array(z.string()).describe("up to 3 tips in Brazilian Portuguese to sound more natural, quoting the studied language"),
  words: z.array(z.object({ w: z.string(), pt: z.string() })).describe("3 to 5 useful words or expressions from the corrected text, with a short Brazilian Portuguese translation"),
  praise: z.string().describe("one sentence in Brazilian Portuguese about what the learner did well"),
  level: z.string().describe("CEFR level the text shows: Pre-A1, A1, A2, B1, B2 or C1"),
  score: z.number().describe("0 to 10, how correct and clear the text is for the learner's level"),
});

export type Correction = z.infer<typeof CorrectionSchema>;
export type WordInfo = z.infer<typeof WordInfoSchema>;
export type QuizResult = z.infer<typeof QuizSchema>;
export type KitResult = z.infer<typeof KitSchema>;
