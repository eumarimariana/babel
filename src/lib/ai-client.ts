"use client";

import { useSyncExternalStore } from "react";
import type { Book } from "@/lib/books";
import type { KitResult, WordInfo } from "@/lib/ai-schemas";
import { anthropicCorrect, anthropicKit, anthropicModels, anthropicTranslate, anthropicWord } from "@/lib/ai/anthropic";
import { freeCorrect, freeKit, freeTranslate, freeWord, listModels, type FreeProvider, type ModelOption } from "@/lib/ai/free-providers";

/**
 * Bring-your-own-key: each person pastes their own key for one of the providers below.
 * Keys live only in this browser's localStorage and requests go straight from the browser
 * to the provider — never through this site's server.
 */
export type ProviderId = "anthropic" | FreeProvider;
export type { ModelOption };

export const PROVIDERS: { id: ProviderId; name: string; free: boolean; keyUrl: string; keyHint: string; note: string }[] = [
  {
    id: "gemini",
    name: "Gemini",
    free: true,
    keyUrl: "https://aistudio.google.com/apikey",
    keyHint: "AIza…",
    note: "Grátis, sem cartão. No plano grátis o Google pode usar o que você envia para melhorar os produtos dele.",
  },
  {
    id: "groq",
    name: "Groq",
    free: true,
    keyUrl: "https://console.groq.com/keys",
    keyHint: "gsk_…",
    note: "Grátis e muito rápido. Usa modelos abertos (Llama, gpt-oss, Qwen).",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    free: true,
    keyUrl: "https://openrouter.ai/settings/keys",
    keyHint: "sk-or-…",
    note: "Uma chave para vários modelos gratuitos (DeepSeek, Llama e outros). Cerca de 50 pedidos por dia no plano grátis.",
  },
  {
    id: "anthropic",
    name: "Claude",
    free: false,
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyHint: "sk-ant-…",
    note: "Pago à parte da assinatura do Claude: poucos centavos de dólar por pedido. É o que dá as melhores correções.",
  },
];
export const providerName = (id: ProviderId) => PROVIDERS.find((p) => p.id === id)?.name ?? id;

type AiConfig = {
  active: ProviderId | null;
  keys: Partial<Record<ProviderId, string>>;
  models: Partial<Record<ProviderId, string>>;
  modelLists: Partial<Record<ProviderId, ModelOption[]>>;
};
const STORAGE = "estante-eli-ai-v1";
const OLD_ANTHROPIC_KEY = "estante-eli-anthropic-key";
const EMPTY: AiConfig = { active: null, keys: {}, models: {}, modelLists: {} };

let cache: AiConfig | null = null;

export function getConfig(): AiConfig {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE);
    cache = raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
    const old = localStorage.getItem(OLD_ANTHROPIC_KEY);
    if (old && !cache!.keys.anthropic) {
      cache = { ...cache!, keys: { ...cache!.keys, anthropic: old }, models: { ...cache!.models, anthropic: "claude-opus-5-5" }, active: cache!.active ?? "anthropic" };
      localStorage.setItem(STORAGE, JSON.stringify(cache));
      localStorage.removeItem(OLD_ANTHROPIC_KEY);
    }
  } catch {
    cache = { ...EMPTY };
  }
  return cache!;
}

function save(next: AiConfig) {
  cache = next;
  try {
    localStorage.setItem(STORAGE, JSON.stringify(next));
  } catch {
    /* storage blocked */
  }
  window.dispatchEvent(new Event("estante-ai-change"));
}

export function subscribeAi(cb: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("estante-ai-change", cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("estante-ai-change", cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useAiConfig() {
  return useSyncExternalStore(subscribeAi, getConfig, () => EMPTY);
}

/** Name of the provider in use ("" when none) — a primitive, so it works with useSyncExternalStore. */
export function activeProviderName() {
  const c = getConfig();
  return c.active && c.keys[c.active] ? providerName(c.active) : "";
}

/** Validates the key by listing models, then stores it and makes this provider the active one. */
export async function connectProvider(id: ProviderId, key: string) {
  const { models, recommended } = id === "anthropic" ? { models: await anthropicModels(key), recommended: "claude-opus-5-5" } : await listModels(id, key);
  if (!models.length) throw new Error("Essa chave não tem nenhum modelo de texto disponível.");
  const c = getConfig();
  save({
    active: id,
    keys: { ...c.keys, [id]: key },
    models: { ...c.models, [id]: c.models[id] && models.some((m) => m.id === c.models[id]) ? c.models[id] : recommended },
    modelLists: { ...c.modelLists, [id]: models },
  });
}
export function setActiveProvider(id: ProviderId) {
  save({ ...getConfig(), active: id });
}
export function setModel(id: ProviderId, model: string) {
  const c = getConfig();
  save({ ...c, models: { ...c.models, [id]: model } });
}
export function removeProvider(id: ProviderId) {
  const c = getConfig();
  const keys = { ...c.keys };
  delete keys[id];
  const nextActive = c.active === id ? ((Object.keys(keys)[0] as ProviderId | undefined) ?? null) : c.active;
  save({ ...c, keys, active: nextActive });
}

function active() {
  const c = getConfig();
  const id = c.active;
  const key = id ? c.keys[id] : undefined;
  if (!id || !key) throw new Error("Escolha um provedor de IA e cole sua chave nas Configurações.");
  const model = c.models[id] ?? "";
  return { id, key, model, models: [model, ...fallbackModels(id, model, c.modelLists[id] ?? [])] };
}

/** Up to two backup models from the same key, used when the chosen one is overloaded or out of quota. */
function fallbackModels(id: ProviderId, chosen: string, list: ModelOption[]) {
  const others = list.map((m) => m.id).filter((m) => m && m !== chosen);
  const preferred = id === "gemini" ? [...others.filter((m) => /flash/.test(m) && !/lite/.test(m)), ...others.filter((m) => /flash-lite/.test(m))] : others;
  return [...new Set(preferred)].slice(0, 2);
}

export async function explainWord(word: string, book?: Book): Promise<WordInfo> {
  const a = active();
  return a.id === "anthropic" ? anthropicWord(a.key, word, book) : freeWord(a.id, a.key, a.models, word, book);
}

export async function makeKit(book: Book, signal?: AbortSignal): Promise<KitResult> {
  const a = active();
  return a.id === "anthropic" ? anthropicKit(a.key, book, signal) : freeKit(a.id, a.key, a.models, book, signal);
}

/** Translates a saved quote into Brazilian Portuguese. */
export async function translateQuote(text: string, book?: Book, signal?: AbortSignal): Promise<string> {
  const a = active();
  return a.id === "anthropic" ? anthropicTranslate(a.key, text, book, signal) : freeTranslate(a.id, a.key, a.models, text, book, signal);
}

export async function correctText(book: Book, text: string, onText: (t: string) => void, signal?: AbortSignal) {
  const a = active();
  return a.id === "anthropic" ? anthropicCorrect(a.key, book, text, onText, signal) : freeCorrect(a.id, a.key, a.models, book, text, onText, signal);
}
