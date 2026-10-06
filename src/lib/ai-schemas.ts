import { z } from "zod";

export const WordInfoSchema = z.object({
  pos: z.string().describe("part of speech in English, e.g. adjective, phrasal verb"),
  pt: z.string().describe("short Brazilian Portuguese translation, 1-4 words, up to 2 options"),
  en: z.string().describe("simple English definition"),
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

export type WordInfo = z.infer<typeof WordInfoSchema>;
export type KitResult = z.infer<typeof KitSchema>;
