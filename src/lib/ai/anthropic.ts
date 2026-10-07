"use client";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { Book } from "@/lib/books";
import { KitSchema, WordInfoSchema, type KitResult, type WordInfo } from "@/lib/ai-schemas";
import { SYSTEM, cleanTranslation, correctPrompt, kitPrompt, quotePrompt, wordPrompt } from "./prompts";

const MODEL = "claude-opus-5-5";
// If a safety classifier declines, the API retries on Anthropic's recommended fallback model.
const FALLBACK = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

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

/** Cheap check that the key works (reads one model's info, no tokens spent). */
export async function anthropicModels(apiKey: string) {
  try {
    await client(apiKey).models.retrieve(MODEL);
    return [{ id: MODEL, label: "Claude Opus 5.5" }];
  } catch (e) {
    throw friendly(e);
  }
}

export async function anthropicWord(apiKey: string, word: string, book?: Book): Promise<WordInfo> {
  try {
    const res = await client(apiKey).beta.messages.parse({
      ...FALLBACK,
      model: MODEL,
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

export async function anthropicKit(apiKey: string, b: Book, signal?: AbortSignal): Promise<KitResult> {
  try {
    const res = await client(apiKey).beta.messages.parse(
      {
        ...FALLBACK,
        model: MODEL,
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

export async function anthropicTranslate(apiKey: string, text: string, book?: Book, signal?: AbortSignal) {
  try {
    const res = await client(apiKey).beta.messages.create(
      {
        ...FALLBACK,
        model: MODEL,
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

export async function anthropicCorrect(apiKey: string, b: Book, text: string, onText: (t: string) => void, signal?: AbortSignal) {
  try {
    const stream = client(apiKey).beta.messages.stream(
      {
        ...FALLBACK,
        model: MODEL,
        max_tokens: 8000,
        system: SYSTEM,
        output_config: { effort: "medium" },
        messages: [{ role: "user", content: correctPrompt(b, text) }],
      },
      { signal },
    );
    let all = "";
    stream.on("text", (delta) => {
      all += delta;
      onText(all);
    });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") onText(all + "\n\n[O Claude não pôde corrigir este texto.]");
    return all;
  } catch (e) {
    throw friendly(e);
  }
}
