"use client";

import type { Book } from "@/lib/books";
import { KitSchema, QuizSchema, WordInfoSchema, type KitResult, type QuizResult, type WordInfo } from "@/lib/ai-schemas";
import { KIT_JSON_SHAPE, QUIZ_JSON_SHAPE, SYSTEM, WORD_JSON_SHAPE, cleanTranslation, correctPrompt, kitPrompt, quizPrompt, quotePrompt, wordPrompt } from "./prompts";

/**
 * Gemini (Google AI Studio), Groq and OpenRouter, called straight from the browser with the
 * learner's own key. Groq and OpenRouter speak the OpenAI chat-completions format; Gemini uses
 * its own REST API. These models don't enforce a schema, so replies are parsed loosely and
 * validated with the same zod schemas the Claude path uses.
 */
export type FreeProvider = "gemini" | "groq" | "openrouter";
export type ModelOption = { id: string; label: string };

const GEMINI = "https://generativelanguage.googleapis.com/v1beta";
const OPENAI_BASE: Record<Exclude<FreeProvider, "gemini">, string> = {
  groq: "https://api.groq.com/openai/v1",
  openrouter: "https://openrouter.ai/api/v1",
};
const NAMES: Record<FreeProvider, string> = { gemini: "Gemini", groq: "Groq", openrouter: "OpenRouter" };

/** An error that another attempt or another model may fix (overload, quota, garbled reply). */
type AiError = Error & { status?: number; retryable?: boolean };
const aiError = (message: string, status?: number, retryable = false): AiError => Object.assign(new Error(message), { status, retryable });

async function httpError(provider: FreeProvider, r: Response): Promise<AiError> {
  const body = await r.text().catch(() => "");
  const name = NAMES[provider];
  if (r.status === 401 || r.status === 403 || /API_KEY_INVALID|invalid api key|invalid_api_key/i.test(body))
    return aiError(`Sua chave do ${name} é inválida. Confira nas Configurações.`, r.status);
  if (r.status === 429) return aiError(`Você atingiu o limite gratuito do ${name}. Espere um pouco ou troque de provedor nas Configurações.`, 429, true);
  if (r.status >= 500)
    return aiError(`O ${name} está sobrecarregado agora (erro ${r.status}). Tentei outros modelos e não deu. Tente de novo em alguns minutos ou troque de provedor.`, r.status, true);
  if (r.status === 402) return aiError(`O ${name} pediu créditos para este modelo. Escolha um modelo gratuito nas Configurações.`, 402, true);
  if (r.status === 404) return aiError(`O modelo escolhido não existe mais no ${name}. Escolha outro nas Configurações.`, 404);
  return aiError(`Erro do ${name} (${r.status}). Tente de novo.`, r.status);
}

async function call(provider: FreeProvider, input: string, init: RequestInit) {
  let r: Response;
  try {
    r = await fetch(input, init);
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new Error(`Sem conexão com o ${NAMES[provider]}. Confira sua internet.`);
  }
  if (!r.ok) throw await httpError(provider, r);
  return r;
}

/**
 * Runs `run` on the chosen model (models[0]). On overload (5xx) it waits and tries once more;
 * if the chosen model is overloaded, out of quota, garbled or gone (404), it tries the backup
 * models. A backup failing for any reason just moves on to the next one. If everything fails,
 * the learner sees the chosen model's error, since that is the one they can act on.
 */
async function withFallback<T>(models: string[], run: (model: string) => Promise<T>, signal?: AbortSignal): Promise<T> {
  const errors: AiError[] = [];
  for (const [i, model] of models.entries()) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await run(model);
      } catch (e) {
        const err = e as AiError;
        if (signal?.aborted || err.name === "AbortError") throw e;
        if (err.status === 404) err.message = `O modelo "${model}" não está disponível para a sua chave. Escolha outro em Configurações → Modelo.`;
        errors.push(err);
        if (i === 0 && !err.retryable && err.status !== 404) throw err;
        if (attempt === 0 && (err.status ?? 0) >= 500) {
          await new Promise((res) => setTimeout(res, 1500));
          continue;
        }
        break;
      }
    }
  }
  throw errors[0];
}

/* ---------- model lists (also validates the key) ---------- */

export async function listModels(provider: FreeProvider, key: string): Promise<{ models: ModelOption[]; recommended: string }> {
  if (provider === "gemini") {
    const r = await call(provider, `${GEMINI}/models?pageSize=200&key=${encodeURIComponent(key)}`, {});
    const d = (await r.json()) as { models?: { name: string; displayName?: string; supportedGenerationMethods?: string[] }[] };
    const models = (d.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => ({ id: m.name.replace(/^models\//, ""), label: m.displayName ?? m.name }))
      .filter((m) => m.id.startsWith("gemini") && !/image|tts|audio|live|embedding|robotics|computer|native/i.test(m.id));
    const flash = models.filter((m) => /flash/.test(m.id) && !/lite/.test(m.id));
    const recommended =
      models.find((m) => m.id === "gemini-flash-latest")?.id ?? flash.map((m) => m.id).sort(byVersionDesc)[0] ?? models[0]?.id ?? "";
    return { models: sortRecommendedFirst(models, recommended), recommended };
  }

  const base = OPENAI_BASE[provider];
  const auth = { Authorization: `Bearer ${key}` };
  if (provider === "openrouter") {
    // /models is public, so check the key separately.
    await call(provider, `${base}/key`, { headers: auth });
    const r = await call(provider, `${base}/models`, {});
    const d = (await r.json()) as { data?: { id: string; name?: string }[] };
    const models = (d.data ?? []).filter((m) => m.id.endsWith(":free")).map((m) => ({ id: m.id, label: m.name ?? m.id }));
    const recommended = pickFirst(models, [/deepseek-chat|deepseek-v3/, /llama-3\.3-70b/, /gpt-oss-120b/, /qwen.*(235|72|32)b/, /gemma/]) ?? models[0]?.id ?? "";
    return { models: sortRecommendedFirst(models, recommended), recommended };
  }

  const r = await call(provider, `${base}/models`, { headers: auth });
  const d = (await r.json()) as { data?: { id: string; active?: boolean }[] };
  const models = (d.data ?? [])
    .filter((m) => m.active !== false && !/whisper|tts|guard|embed|playai|orpheus|compound|safeguard/i.test(m.id))
    .map((m) => ({ id: m.id, label: m.id }));
  const recommended = pickFirst(models, [/gpt-oss-120b/, /llama-3\.3-70b-versatile/, /llama-4/, /qwen/, /llama/]) ?? models[0]?.id ?? "";
  return { models: sortRecommendedFirst(models, recommended), recommended };
}

function byVersionDesc(a: string, b: string) {
  const v = (s: string) => Number(s.match(/gemini-(\d+(?:\.\d+)?)/)?.[1] ?? 0);
  return v(b) - v(a) || a.length - b.length;
}
function pickFirst(models: ModelOption[], patterns: RegExp[]) {
  for (const p of patterns) {
    const hit = models.find((m) => p.test(m.id));
    if (hit) return hit.id;
  }
  return undefined;
}
function sortRecommendedFirst(models: ModelOption[], rec: string) {
  return [...models].sort((a, b) => (a.id === rec ? -1 : b.id === rec ? 1 : a.label.localeCompare(b.label)));
}

/* ---------- one-shot completions ---------- */

async function complete(provider: FreeProvider, key: string, model: string, prompt: string, json: boolean, signal?: AbortSignal): Promise<string> {
  if (provider === "gemini") {
    const r = await call(provider, `${GEMINI}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: json ? { responseMimeType: "application/json" } : {},
      }),
    });
    const d = (await r.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return (d.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  }
  const r = await call(provider, `${OPENAI_BASE[provider]}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    signal,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
      // Groq supports JSON mode on its chat models; OpenRouter's free models vary, so they rely on the prompt.
      ...(json && provider === "groq" ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  const d = (await r.json()) as { choices?: { message?: { content?: string } }[] };
  return d.choices?.[0]?.message?.content ?? "";
}

function parseLoose(text: string): unknown {
  const tries = [text, text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1], text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)];
  for (const t of tries) {
    if (!t) continue;
    try {
      return JSON.parse(t);
    } catch {
      /* try the next shape */
    }
  }
  throw aiError("A resposta veio num formato inesperado. Tente de novo ou escolha outro modelo.", undefined, true);
}

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

export async function freeWord(provider: FreeProvider, key: string, models: string[], word: string, book?: Book): Promise<WordInfo> {
  const prompt = `${wordPrompt(word, book)}\n\n${WORD_JSON_SHAPE}`;
  const raw = await withFallback(models, async (m) => parseLoose(await complete(provider, key, m, prompt, true)) as Record<string, unknown>);
  const parsed = WordInfoSchema.safeParse({ pos: str(raw.pos), pt: str(raw.pt), en: str(raw.en), ex: str(raw.ex) });
  if (!parsed.success || !parsed.data.pt) throw new Error("Não consegui explicar essa palavra. Tente de novo.");
  return parsed.data;
}

export async function freeKit(provider: FreeProvider, key: string, models: string[], b: Book, signal?: AbortSignal): Promise<KitResult> {
  const prompt = `${kitPrompt(b)}\n\n${KIT_JSON_SHAPE}`;
  const raw = await withFallback(models, async (m) => parseLoose(await complete(provider, key, m, prompt, true, signal)) as Record<string, unknown>, signal);
  const arr = (v: unknown) => (Array.isArray(v) ? v : []) as Record<string, unknown>[];
  const parsed = KitSchema.safeParse({
    words: arr(raw.words)
      .map((w) => ({ w: str(w.w ?? w.word), pos: str(w.pos), pt: str(w.pt), en: str(w.en), ex: str(w.ex ?? w.example) }))
      .filter((w) => w.w),
    grammar: arr(raw.grammar).map((g) => ({ point: str(g.point), pt: str(g.pt), example: str(g.example) })),
    questions: (Array.isArray(raw.questions) ? raw.questions : []).map(str).filter(Boolean),
  });
  if (!parsed.success || parsed.data.words.length === 0) throw new Error("Não consegui montar o kit agora. Tente de novo ou escolha outro modelo.");
  return parsed.data;
}

export async function freeTranslate(provider: FreeProvider, key: string, models: string[], text: string, book?: Book, signal?: AbortSignal) {
  const out = await withFallback(models, (m) => complete(provider, key, m, quotePrompt(text, book), false, signal), signal);
  if (!out.trim()) throw new Error("A tradução veio vazia. Tente de novo ou escolha outro modelo.");
  return cleanTranslation(out);
}

export async function freeQuiz(provider: FreeProvider, key: string, models: string[], b: Book, words: string[], grammar: string[], signal?: AbortSignal): Promise<QuizResult> {
  const prompt = `${quizPrompt(b, words, grammar)}\n\n${QUIZ_JSON_SHAPE}`;
  const raw = await withFallback(models, async (m) => parseLoose(await complete(provider, key, m, prompt, true, signal)) as Record<string, unknown>, signal);
  const kinds = ["story", "vocab", "grammar"];
  const parsed = QuizSchema.safeParse({
    questions: (Array.isArray(raw.questions) ? raw.questions : [])
      .map((x: Record<string, unknown>) => ({
        kind: kinds.includes(str(x.kind)) ? str(x.kind) : "story",
        q: str(x.q ?? x.question),
        options: (Array.isArray(x.options) ? x.options : []).map(str).slice(0, 4),
        answer: Number(x.answer),
        why: str(x.why ?? x.explanation),
      }))
      // keep only questions a learner can actually answer
      .filter((x) => x.q && x.options.length === 4 && Number.isInteger(x.answer) && x.answer >= 0 && x.answer < 4),
  });
  if (!parsed.success || parsed.data.questions.length < 4) throw new Error("Não consegui montar o quiz agora. Tente de novo ou escolha outro modelo.");
  return parsed.data;
}

/* ---------- streamed correction ---------- */

export async function freeCorrect(provider: FreeProvider, key: string, models: string[], b: Book, text: string, onText: (t: string) => void, signal?: AbortSignal) {
  const prompt = correctPrompt(b, text);
  // Fallback only covers the request itself; once text is streaming we keep that model.
  const r = await withFallback(models, (model) => openCorrectionStream(provider, key, model, prompt, signal), signal);
  return readCorrection(provider, r, onText);
}

function openCorrectionStream(provider: FreeProvider, key: string, model: string, prompt: string, signal?: AbortSignal) {
  return provider === "gemini"
      ? call(provider, `${GEMINI}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal,
          body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents: [{ role: "user", parts: [{ text: prompt }] }] }),
        })
      : call(provider, `${OPENAI_BASE[provider]}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          signal,
          body: JSON.stringify({
            model,
            stream: true,
            messages: [
              { role: "system", content: SYSTEM },
              { role: "user", content: prompt },
            ],
          }),
        });
}

async function readCorrection(provider: FreeProvider, r: Response, onText: (t: string) => void) {
  const reader = r.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let all = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const data = line.startsWith("data:") ? line.slice(5).trim() : "";
      if (!data || data === "[DONE]") continue;
      try {
        const j = JSON.parse(data);
        const delta =
          provider === "gemini"
            ? ((j.candidates?.[0]?.content?.parts ?? []) as { text?: string }[]).map((p) => p.text ?? "").join("")
            : (j.choices?.[0]?.delta?.content ?? "");
        if (delta) {
          all += delta;
          onText(all);
        }
      } catch {
        /* keep-alive comments and partial lines */
      }
    }
  }
  if (!all) throw new Error("O modelo não respondeu. Tente de novo ou escolha outro modelo.");
  return all;
}
