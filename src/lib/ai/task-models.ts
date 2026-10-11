import type { ModelOption } from "./free-providers";

/** What the AI does in the app. Each task can run on a different model of the same key. */
export type AiTask = "word" | "translate" | "quiz" | "kit" | "correct";
type Tier = "fast" | "balanced" | "best";

export const AI_TASKS: { id: AiTask; label: string; detail: string; tier: Tier }[] = [
  { id: "word", label: "Explicar palavras", detail: "tradução, definição e exemplo de uma palavra", tier: "fast" },
  { id: "translate", label: "Traduzir citações", detail: "um trecho curto do livro para o português", tier: "fast" },
  { id: "quiz", label: "Gerar quizzes", detail: "perguntas sobre a história e a gramática, com gabarito", tier: "balanced" },
  { id: "kit", label: "Kit de pré-leitura", detail: "palavras-chave, gramática e perguntas de um livro", tier: "balanced" },
  { id: "correct", label: "Corrigir resumos", detail: "correção comentada do seu texto, frase a frase", tier: "best" },
];

export const TIER_WHY: Record<Tier, string> = {
  fast: "tarefa curta: um modelo rápido responde em segundos e gasta menos da sua cota",
  balanced: "precisa devolver respostas longas e bem organizadas",
  best: "corrigir texto pede o modelo mais capaz que a sua chave tem",
};

// Patterns per provider and tier, best first. Only models the key actually lists can be suggested.
const PICKS: Record<string, Record<Tier, RegExp[]>> = {
  anthropic: { fast: [/haiku/], balanced: [/sonnet/], best: [/opus/] },
  gemini: { fast: [/flash-lite/, /flash/], balanced: [/flash(?!-lite)/], best: [/pro/, /flash(?!-lite)/] },
  groq: { fast: [/llama-3\.1-8b-instant/, /gpt-oss-20b/, /llama/], balanced: [/gpt-oss-120b/, /llama-3\.3-70b/], best: [/kimi-k2/, /gpt-oss-120b/, /qwen3/, /llama-3\.3-70b/] },
  openrouter: { fast: [/gemma/, /llama-3\.3/, /mistral-small/], balanced: [/deepseek-chat|deepseek-v3/, /qwen.*235b/, /llama-3\.3-70b/], best: [/deepseek-r1/, /deepseek-chat|deepseek-v3/, /qwen.*235b/] },
};

/** Newest first among same-family names, e.g. gemini-2.5-flash before gemini-2.0-flash. */
const version = (id: string) => Number(id.match(/(\d+(?:\.\d+)?)/)?.[1] ?? 0);

/** The suggested model for each task, from the models this key can use; falls back to the chosen one. */
export function suggestTaskModels(provider: string, models: ModelOption[], chosen: string): Record<AiTask, string> {
  const ids = models.map((m) => m.id);
  const pick = (tier: Tier) => {
    for (const re of PICKS[provider]?.[tier] ?? []) {
      const hits = ids.filter((id) => re.test(id) && !/preview|exp/.test(id));
      const all = hits.length ? hits : ids.filter((id) => re.test(id));
      if (all.length) return [...all].sort((a, b) => version(b) - version(a) || a.length - b.length)[0];
    }
    return chosen || ids[0] || "";
  };
  const byTier = { fast: pick("fast"), balanced: pick("balanced"), best: pick("best") };
  return Object.fromEntries(AI_TASKS.map((t) => [t.id, byTier[t.tier]])) as Record<AiTask, string>;
}
