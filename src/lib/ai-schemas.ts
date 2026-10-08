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

export type WordInfo = z.infer<typeof WordInfoSchema>;
export type QuizResult = z.infer<typeof QuizSchema>;
export type KitResult = z.infer<typeof KitSchema>;
