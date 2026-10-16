"use client";

import { useState, useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import { ArrowRightIcon, ArrowSquareOutIcon, CardsIcon, CheckIcon, CopyIcon, PencilLineIcon, PlusIcon, StopIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { MISTAKE_TYPES, type Correction } from "@/lib/ai-schemas";
import { activeProviderName, correctWriting, subscribeAi } from "@/lib/ai-client";
import { writingChatPrompt, type WritingContext } from "@/lib/ai/prompts";
import type { Lang } from "@/lib/books";
import { topicsIn } from "@/lib/resources";
import { brDate, useEstante, type SavedCorrection } from "@/lib/store";
import { cn } from "@/lib/utils";
import { copyText } from "./common";


/* ---------- text helpers ---------- */

/** The original text cut into plain parts and mistakes (by the fragment the AI copied), in reading order. */
function markMistakes(text: string, mistakes: Correction["mistakes"]) {
  const parts: { s: string; n?: number }[] = [];
  let at = 0;
  mistakes.forEach((m, n) => {
    if (!m.wrong) return;
    let i = text.indexOf(m.wrong, at);
    if (i < 0) i = text.toLowerCase().indexOf(m.wrong.toLowerCase(), at);
    if (i < 0) return; // fragment not found as written: it still shows in the list
    if (i > at) parts.push({ s: text.slice(at, i) });
    parts.push({ s: text.slice(i, i + m.wrong.length), n });
    at = i + m.wrong.length;
  });
  if (at < text.length) parts.push({ s: text.slice(at) });
  return parts;
}

/** Word-level diff (longest common subsequence): what stayed, what was removed and what was added. */
function diffWords(a: string, b: string) {
  const x = a.split(/(\s+)/).filter(Boolean);
  const y = b.split(/(\s+)/).filter(Boolean);
  if (x.length * y.length > 2_000_000) return [{ s: b, op: "same" as const }];
  const dp = Array.from({ length: x.length + 1 }, () => new Uint16Array(y.length + 1));
  for (let i = x.length - 1; i >= 0; i--) for (let j = y.length - 1; j >= 0; j--) dp[i][j] = x[i] === y[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: { s: string; op: "same" | "del" | "add" }[] = [];
  let i = 0;
  let j = 0;
  while (i < x.length && j < y.length) {
    if (x[i] === y[j]) {
      out.push({ s: x[i], op: "same" });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ s: x[i++], op: "del" });
    else out.push({ s: y[j++], op: "add" });
  }
  while (i < x.length) out.push({ s: x[i++], op: "del" });
  while (j < y.length) out.push({ s: y[j++], op: "add" });
  return out;
}

/** Grammar topics behind the mistakes, as the app knows them (for the mission and the grammar section). */
export const mistakeTopics = (c: Correction, lang: Lang) => [...new Set(c.mistakes.flatMap((m) => topicsIn(`${m.topic} ${m.why}`, lang).map((t) => t.id)))];

/* ---------- writing box: text + correct button + result ---------- */

/**
 * A text area with "Corrigir com <IA>" (or "copiar pedido" without a key) and the structured correction under it.
 * The parent keeps the text and the saved correction.
 */
export function WritingBox({
  lang,
  context,
  level,
  text,
  onText,
  saved,
  onSaved,
  scoreKey,
  placeholder,
  rows = 6,
  minWords = 5,
}: {
  lang: Lang;
  context: WritingContext;
  level: string;
  text: string;
  onText: (t: string) => void;
  saved?: SavedCorrection;
  onSaved: (s: SavedCorrection) => void;
  scoreKey: string;
  placeholder?: string;
  rows?: number;
  minWords?: number;
}) {
  const { recordScore, markDay } = useEstante();
  const aiName = useSyncExternalStore(subscribeAi, () => activeProviderName(lang), () => "");
  const [busy, setBusy] = useState(false);
  const [ctl, setCtl] = useState<AbortController | null>(null);
  const words = (text.trim().match(/\S+/g) ?? []).length;
  const outdated = saved && saved.text.trim() !== text.trim();

  async function correct() {
    if (words < minWords) return toast.error(`Escreva pelo menos ${minWords} palavras.`);
    const c = new AbortController();
    setCtl(c);
    setBusy(true);
    try {
      const result = await correctWriting(lang, context, text.trim(), level, c.signal);
      onSaved({ text: text.trim(), at: new Date().toISOString().slice(0, 10), c: result });
      recordScore(scoreKey, Math.round(result.score), 10, mistakeTopics(result, lang));
      markDay();
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast.error((e as Error).message);
    } finally {
      setBusy(false);
      setCtl(null);
    }
  }

  return (
    <div className="grid gap-3">
      <textarea
        value={text}
        onChange={(e) => onText(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        aria-label="Seu texto"
        className="w-full rounded-2xl border border-border bg-background p-4 text-[15px] leading-relaxed outline-none focus-visible:border-foreground"
      />
      <div className="flex flex-wrap items-center gap-2">
        {aiName ? (
          busy ? (
            <button onClick={() => ctl?.abort()} className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm hover:border-foreground">
              <StopIcon weight="fill" className="size-4" /> Parar
            </button>
          ) : (
            <button onClick={correct} disabled={words < minWords} className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-ink-foreground disabled:opacity-40">
              <PencilLineIcon weight="bold" className="size-4" /> {saved && !outdated ? "Corrigir de novo" : `Corrigir com ${aiName}`}
            </button>
          )
        ) : (
          <button
            onClick={async () => {
              if (words < minWords) return toast.error(`Escreva pelo menos ${minWords} palavras.`);
              markDay();
              if (await copyText(writingChatPrompt(lang, context, text))) toast.success("Texto e pedido copiados. Cole no claude.ai, Gemini ou outra IA.");
            }}
            disabled={words < minWords}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-ink-foreground disabled:opacity-40"
          >
            <CopyIcon className="size-4" /> Copiar texto + pedido de correção
          </button>
        )}
        <span className="text-xs text-muted-foreground tabular">{words} palavras</span>
        {busy && (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Corrigindo… (20–40 s)
          </span>
        )}
      </div>
      {saved && <CorrectionView saved={saved} lang={lang} bookId={context.kind === "summary" ? context.book.id : null} outdated={!!outdated} />}
    </div>
  );
}

/* ---------- the correction itself ---------- */

const TYPE_STYLE: Record<string, string> = {
  gramática: "bg-[#e9d7cf] text-[#7a3b28]",
  vocabulário: "bg-[#dfe6d6] text-[#3f5a33]",
  ortografia: "bg-[#e6e0cf] text-[#6b5a22]",
  "ordem das palavras": "bg-[#d9dfe8] text-[#33475e]",
  pontuação: "bg-[#e3dbe6] text-[#5a3a63]",
};

export function CorrectionView({ saved, lang, bookId = null, outdated = false, compact = false }: { saved: SavedCorrection; lang: Lang; bookId?: number | null; outdated?: boolean; compact?: boolean }) {
  const { addWord } = useEstante();
  const { c, text } = saved;
  const [view, setView] = useState<"mine" | "fixed">("mine");
  const [noted, setNoted] = useState<string[]>([]);
  const counts = MISTAKE_TYPES.map((t) => ({ t, n: c.mistakes.filter((m) => m.type === t).length })).filter((x) => x.n);

  function note(key: string, w: { w: string; pt: string; en?: string; ex?: string }) {
    const ok = addWord({ ...w, ln: lang, book: bookId });
    setNoted((n) => [...n, key]);
    if (ok) toast.success(`“${w.w}” foi para o caderno.`);
    else toast.info("Já está no caderno.");
  }

  return (
    <section className="grid gap-4 rounded-[1.5rem] border border-border bg-card p-4 text-left text-foreground sm:p-5">
      {/* verdict */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <p className="font-display text-4xl leading-none tabular">
          {Math.round(c.score)}
          <span className="text-lg text-muted-foreground">/10</span>
        </p>
        <div className="grid gap-0.5">
          <p className="text-xs text-muted-foreground tabular">
            {c.mistakes.length ? `${c.mistakes.length} ${c.mistakes.length === 1 ? "erro" : "erros"}` : "nenhum erro"}
            {c.level && ` · o texto mostra nível ${c.level}`} · corrigido em {brDate(saved.at)}
          </p>
          {c.praise && <p className="text-sm">{c.praise}</p>}
        </div>
      </div>
      {outdated && <p className="rounded-xl bg-muted/70 px-3 py-2 text-xs text-muted-foreground">Você mudou o texto depois desta correção. Corrija de novo para ver a versão nova.</p>}

      {/* text: mine with the mistakes marked, or the corrected one with the changes */}
      <div className="grid gap-2">
        {!compact && (
          <div role="radiogroup" aria-label="Ver texto" className="flex gap-1.5">
            {(
              [
                ["mine", "Seu texto marcado"],
                ["fixed", "Versão corrigida"],
              ] as const
            ).map(([v, label]) => (
              <button key={v} role="radio" aria-checked={view === v} onClick={() => setView(v)} className={cn("h-8 rounded-full border px-3.5 text-xs", view === v ? "border-ink bg-ink font-semibold text-ink-foreground" : "border-border hover:border-foreground")}>
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="rounded-2xl bg-muted/50 p-4 text-[15px] leading-relaxed whitespace-pre-wrap">
          {view === "mine" && !compact
            ? markMistakes(text, c.mistakes).map((p, k) =>
                p.n === undefined ? (
                  <span key={k}>{p.s}</span>
                ) : (
                  <a key={k} href={`#m-${p.n}`} title={`${c.mistakes[p.n].right} · ${c.mistakes[p.n].why}`} className="rounded-sm bg-[#d07a64]/15 underline decoration-[#d07a64] decoration-wavy decoration-1 underline-offset-4">
                    {p.s}
                    <sup className="ml-0.5 text-[10px] font-bold text-[#b35a43] no-underline">{p.n + 1}</sup>
                  </a>
                ),
              )
            : diffWords(text, c.corrected).map((d, k) =>
                d.op === "same" ? (
                  <span key={k}>{d.s}</span>
                ) : d.op === "del" ? (
                  /^\s+$/.test(d.s) ? null : (
                    <del key={k} className="mr-1 text-[#b35a43]/80 decoration-[#b35a43]/60">
                      {d.s}
                    </del>
                  )
                ) : (
                  <ins key={k} className="rounded-sm bg-[#9cb88f]/30 font-semibold no-underline">
                    {d.s}
                  </ins>
                ),
              )}
        </div>
        {view === "fixed" && !compact && <p className="text-[11px] text-muted-foreground">Em verde, o que entrou; riscado, o que saiu.</p>}
      </div>

      {/* mistakes */}
      {c.mistakes.length > 0 && (
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="mr-1 text-sm font-bold">Erros</h3>
            {counts.map(({ t, n }) => (
              <span key={t} className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", TYPE_STYLE[t])}>
                {n} {t}
              </span>
            ))}
          </div>
          <ol className="grid gap-2">
            {c.mistakes.map((m, n) => {
              const topic = topicsIn(`${m.topic} ${m.why}`, lang)[0];
              const key = `m${n}`;
              return (
                <li key={n} id={`m-${n}`} className="grid scroll-mt-24 gap-1.5 rounded-2xl bg-muted/50 p-3 text-sm">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-xs font-bold text-muted-foreground tabular">{n + 1}</span>
                    <del className="text-[#b35a43]">{m.wrong}</del>
                    <ArrowRightIcon className="size-3 self-center text-muted-foreground" />
                    <strong className="text-[#3f5a33]">{m.right}</strong>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", TYPE_STYLE[m.type])}>{m.type}</span>
                  </div>
                  <p className="text-muted-foreground">{m.why}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    {topic && (
                      <a href={topic.links[0].url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline">
                        Entender isso: {topic.label} <ArrowSquareOutIcon weight="bold" className="size-3" />
                      </a>
                    )}
                    <button
                      disabled={noted.includes(key)}
                      onClick={() => note(key, { w: m.right, pt: `em vez de “${m.wrong}”`, en: m.why, ex: c.corrected.split(/(?<=[.!?])\s+/).find((s) => s.includes(m.right)) ?? "" })}
                      className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground disabled:opacity-60"
                    >
                      {noted.includes(key) ? <CheckIcon weight="bold" className="size-3.5" /> : <CardsIcon className="size-3.5" />}
                      {noted.includes(key) ? "Virou flashcard" : "Virar flashcard"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* sound natural + words */}
      {!compact && c.natural.length > 0 && (
        <div className="grid gap-1.5">
          <h3 className="text-sm font-bold">Para soar mais natural</h3>
          <ul className="grid gap-1 text-sm">
            {c.natural.map((t, k) => (
              <li key={k} className="flex gap-2">
                <span className="text-muted-foreground">·</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!compact && c.words.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">Palavras para anotar:</span>
          {c.words.map(({ w, pt }) => {
            const key = `w-${w}`;
            const done = noted.includes(key);
            return (
              <button key={w} disabled={done} onClick={() => note(key, { w, pt })} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs", done ? "border-transparent bg-muted text-muted-foreground" : "border-border hover:border-foreground")}>
                {done ? <CheckIcon weight="bold" className="size-3.5" /> : <PlusIcon weight="bold" className="size-3.5" />}
                <strong>{w}</strong> {pt}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
