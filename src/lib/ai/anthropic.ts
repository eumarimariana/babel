"use client";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { Book } from "@/lib/books";
import { CorrectionSchema, KitSchema, QuizSchema, WordInfoSchema, type Correction, type KitResult, type QuizResult, type WordInfo } from "@/lib/ai-schemas";
import { SYSTEM, cleanTranslation, drillPrompt, kitPrompt, quizPrompt, quotePrompt, wordPrompt } from "./prompts";

/** The Claude models a key can pick per task; Opus is the default for everything. */
export const CLAUDE_MODELS = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5" },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5" },
];
// If a safety classifier declines, the API retries on Anthropic's recommended fallback model.
// Haiku has no server-side fallback, so it goes without.
const fallback = (model: string) => (model.includes("haiku") ? {} : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const });

const client = (apiKey: string) => new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

/** Turns SDK errors into a message the learner can act on. */
function friendly(error: unknown): Error {
  if (error instanceof Anthropic.APIUserAbortError) return Object.assign(new Error("Cancelado."), { name: "AbortError" });
  if (error instanceof Anthropic.AuthenticationError) return new Error("Sua chave da Anthropic é inválida. Confira nas Configurações.");
  if (error instanceof Anthropic.PermissionDeniedError) return new Error("Sua chave não tem acesso a este modelo.");
  if (error instanceof Anthropic.RateLimitError) return new Error("Limite de uso da sua chave atingido. Espere um pouco ou confira seus créditos no console da Anthropic.");
  if (error instanceof Anthropic.BadRequestError && /credit|balance/i.test(error.message))
    return new Error("Sua conta da Anthropic está sem créditos. Adicione créditos em console.anthropic.com.");
  if (error instanceof Anthropic.APIConnectionError) return new Error("Sem conexão com a API da Anthropic. Confira sua internet.");
  if (error instanceof Anthropic.APIError) return new Error(`Erro da API do Claude (${error.status ?? "?"}). Tente de novo.`);
  if (error instanceof Error) return error;
  return new Error("Não deu certo agora. Tente de novo.");
}

/** Cheap check that the key works and which models it can use (reads model info, no tokens spent). */
export async function anthropicModels(apiKey: string) {
  const c = client(apiKey);
  const found = await Promise.allSettled(CLAUDE_MODELS.map((m) => c.models.retrieve(m.id)));
  const models = CLAUDE_MODELS.filter((_, i) => found[i].status === "fulfilled");
  if (!models.length) throw friendly((found[0] as PromiseRejectedResult).reason);
  return models;
}

export async function anthropicWord(apiKey: string, model: string, word: string, book?: Book): Promise<WordInfo> {
  try {
    const res = await client(apiKey).beta.messages.parse({
      ...fallback(model),
      model,
      max_tokens: 2000,
      system: SYSTEM,
      output_config: { effort: "low", format: betaZodOutputFormat(WordInfoSchema) },
      messages: [{ role: "user", content: wordPrompt(word, book) }],
    });
    if (res.stop_reason === "refusal" || !res.parsed_output) throw new Error("Não consegui explicar essa palavra. Tente outra forma.");
    return res.parsed_output;
  } catch (e) {
    throw friendly(e);
  }
}

export async function anthropicKit(apiKey: string, model: string, b: Book, signal?: AbortSignal): Promise<KitResult> {
  try {
    const res = await client(apiKey).beta.messages.parse(
      {
        ...fallback(model),
        model,
        max_tokens: 8000,
        system: SYSTEM,
        output_config: { effort: "medium", format: betaZodOutputFormat(KitSchema) },
        messages: [{ role: "user", content: kitPrompt(b) }],
      },
      { signal },
    );
    if (res.stop_reason === "refusal" || !res.parsed_output) throw new Error("Não consegui montar o kit agora. Tente de novo.");
    return res.parsed_output;
  } catch (e) {
    throw friendly(e);
  }
}

/** Structured correction of a text the learner wrote. */
export async function anthropicWriting(apiKey: string, model: string, prompt: string, signal?: AbortSignal): Promise<Correction> {
  try {
    const res = await client(apiKey).beta.messages.parse(
      {
        ...fallback(model),
        model,
        max_tokens: 10000,
        system: SYSTEM,
        output_config: { effort: "medium", format: betaZodOutputFormat(CorrectionSchema) },
        messages: [{ role: "user", content: prompt }],
      },
      { signal },
    );
    if (res.stop_reason === "refusal" || !res.parsed_output) throw new Error("Não consegui corrigir este texto agora. Tente de novo.");
    return res.parsed_output;
  } catch (e) {
    throw friendly(e);
  }
}

export async function anthropicQuiz(apiKey: string, model: string, b: Book, words: string[], grammar: string[], signal?: AbortSignal): Promise<QuizResult> {
  return quizFrom(apiKey, model, quizPrompt(b, words, grammar), signal);
}

export async function anthropicDrill(apiKey: string, model: string, topic: string, level: string, signal?: AbortSignal): Promise<QuizResult> {
  return quizFrom(apiKey, model, drillPrompt(topic, level), signal);
}

/** Any multiple-choice set (book quiz, grammar drill), validated against the quiz schema. */
async function quizFrom(apiKey: string, model: string, prompt: string, signal?: AbortSignal): Promise<QuizResult> {
  try {
    const res = await client(apiKey).beta.messages.parse(
      {
        ...fallback(model),
        model,
        max_tokens: 8000,
        system: SYSTEM,
        output_config: { effort: "medium", format: betaZodOutputFormat(QuizSchema) },
        messages: [{ role: "user", content: prompt }],
      },
      { signal },
    );
    if (res.stop_reason === "refusal" || !res.parsed_output) throw new Error("Não consegui montar as perguntas agora. Tente de novo.");
    return res.parsed_output;
  } catch (e) {
    throw friendly(e);
  }
}

export async function anthropicTranslate(apiKey: string, model: string, text: string, book?: Book, signal?: AbortSignal) {
  try {
    const res = await client(apiKey).beta.messages.create(
      {
        ...fallback(model),
        model,
        max_tokens: 4000,
        system: SYSTEM,
        output_config: { effort: "low" },
        messages: [{ role: "user", content: quotePrompt(text, book) }],
      },
      { signal },
    );
    if (res.stop_reason === "refusal") throw new Error("O Claude não pôde traduzir este trecho.");
    const out = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    if (!out.trim()) throw new Error("A tradução veio vazia. Tente de novo.");
    return cleanTranslation(out);
  } catch (e) {
    throw friendly(e);
  }
}

