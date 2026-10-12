"use client";

import { useState } from "react";
import { ArrowSquareOutIcon, ArrowUpRightIcon, ClipboardTextIcon, ListChecksIcon } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import cando from "@/data/cando.json";
import { langInfo, type Lang } from "@/lib/books";
import { recommendBooks, sourceLine } from "@/lib/recommend";
import { GRAMMAR_BANK } from "./grammar-practice";
import { RESOURCE_LEVELS } from "@/lib/resources";
import { brDate, useEstante } from "@/lib/store";
import { cn } from "@/lib/utils";

// free tests that give a CEFR level; only English for now
const TESTS: Partial<Record<Lang, { name: string; url: string; detail: string }[]>> = {
  en: [
    { name: "EF SET", url: "https://www.efset.org/", detail: "50 min, leitura e escuta, dá o nível CEFR" },
    { name: "Perfect English Grammar", url: "https://www.perfect-english-grammar.com/english-level-test.html", detail: "teste rápido de gramática" },
  ],
};

/** "Descobrir meu nível": take a free test, tell the app the result, get the right stop on the reading map. */
export function LevelTest({ lang, onOpen }: { lang: Lang; onOpen: (id: number) => void }) {
  const { data, setPlacement } = useEstante();
  const result = data.placement[lang];
  const tests = TESTS[lang] ?? [];
  const suggestion = result ? recommendBooks(data, lang, 1, result.lv)[0] : undefined;
  const [testing, setTesting] = useState(false);
  const [cando, setCando] = useState(false);
  const ticked = data.cando[lang]?.length ?? 0;

  return (
    <article className="grid grid-cols-1 content-start gap-4 rounded-[1.5rem] border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", result ? "bg-ink text-ink-foreground" : "bg-sand text-sand-foreground")}>
          <ClipboardTextIcon weight="bold" className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-lg leading-tight">Descobrir meu nível</h2>
          <p className="text-xs text-muted-foreground">{result ? `Seu teste deu ${result.lv} em ${brDate(result.at)}` : "o app sugere livros grátis do seu nível"}</p>
        </div>
      </div>

      {tests.length > 0 && (
        <div className="grid gap-2">
          <p className="text-xs text-muted-foreground">1. Faça um teste grátis</p>
          <div className="flex flex-wrap gap-2">
            {lang === "en" && (
              <button onClick={() => setTesting(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[13px] font-semibold text-ink-foreground">
                Teste do app <span className="font-normal text-ink-muted">· 18 perguntas</span>
              </button>
            )}
            {tests.map((t) => (
              <a key={t.url} href={t.url} target="_blank" rel="noopener noreferrer" title={t.detail} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-[13px] font-semibold hover:border-foreground">
                {t.name} <span className="font-normal text-muted-foreground">· {t.detail.split(",")[0]}</span> <ArrowSquareOutIcon className="size-3.5 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-2">
        <p className="text-xs text-muted-foreground">{tests.length ? "2. Conte o resultado" : "Qual nível o teste deu?"}</p>
        <div role="radiogroup" aria-label="Resultado do teste" className="flex flex-wrap gap-1.5">
          {RESOURCE_LEVELS.map((l) => {
            const on = result?.lv === l;
            return (
              <button
                key={l}
                role="radio"
                aria-checked={on}
                onClick={() => setPlacement(lang, on ? null : l)}
                className={cn("h-8 rounded-full border px-3 text-xs", on ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground")}
              >
                {l}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">C2 conta como C1, o nível mais alto dos livros.</p>
      </div>

      {result &&
        (suggestion ? (
          <button onClick={() => onOpen(suggestion.id)} className="flex items-center justify-between gap-3 rounded-2xl bg-ink p-3 text-left text-ink-foreground">
            <span className="min-w-0">
              <span className="block text-xs text-ink-muted">Comece por aqui</span>
              <span className="block truncate text-sm font-semibold">{suggestion.t}</span>
              <span className="block text-xs text-ink-muted tabular">{sourceLine(suggestion)} · grátis</span>
            </span>
            <ArrowUpRightIcon className="size-4 shrink-0" />
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">Você já leu todos os livros grátis a partir do {result.lv}.</p>
        ))}
      <button onClick={() => setCando(true)} className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3 text-left hover:border-foreground">
        <span className="min-w-0">
          <span className="block text-sm font-semibold">O que eu já consigo</span>
          <span className="block text-xs text-muted-foreground">frases do CEFR para marcar aos poucos · {ticked} de {TOTAL_CANDO}</span>
        </span>
        <ListChecksIcon className="size-5 shrink-0 text-muted-foreground" />
      </button>

      {testing && <AppTest onClose={() => setTesting(false)} onResult={(lv) => setPlacement(lang, lv)} />}
      {cando && <CanDo lang={lang} onClose={() => setCando(false)} />}
    </article>
  );
}

const CANDO = cando as Record<string, string[]>;
const TOTAL_CANDO = Object.values(CANDO).reduce((n, l) => n + l.length, 0);

/** The app's own placement test: 3 grammar questions per level, easiest first; a level counts with 2 of 3 right. */
function AppTest({ onClose, onResult }: { onClose: () => void; onResult: (lv: string) => void }) {
  const [questions] = useState(() =>
    RESOURCE_LEVELS.flatMap((lv) => {
      const pool = Object.values(GRAMMAR_BANK)
        .filter((t) => t.level === lv)
        .flatMap((t) => t.items);
      return [...pool].sort(() => Math.random() - 0.5).slice(0, 3).map((q) => ({ ...q, lv }));
    }),
  );
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const q = questions[i];
  const byLevel = RESOURCE_LEVELS.map((lv) => {
    const idx = questions.map((x, k) => (x.lv === lv ? k : -1)).filter((k) => k >= 0);
    return { lv, right: idx.filter((k) => answers[k]).length, total: idx.length };
  });
  // the highest level reached without failing one below it
  let level = "Pre-A1";
  for (const b of byLevel) {
    if (b.right >= 2) level = b.lv;
    else break;
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[1.75rem] p-5 sm:max-w-xl sm:p-6">
        <DialogTitle className="font-display text-xl">Teste de nível do app</DialogTitle>
        <DialogDescription className="-mt-2 text-xs">3 perguntas de gramática por nível, das fáceis para as difíceis. Se não souber, escolha a que parecer melhor.</DialogDescription>
        {q ? (
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-ink transition-all" style={{ width: `${(i / questions.length) * 100}%` }} />
              </span>
              <span className="text-xs text-muted-foreground tabular">
                {i + 1}/{questions.length}
              </span>
            </div>
            <p className="text-xl leading-snug font-bold">{q.q}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options.map((o, n) => (
                <button key={o} onClick={() => (setAnswers([...answers, n === q.answer]), setI(i + 1))} className="rounded-2xl border border-border p-3.5 text-left text-sm hover:border-foreground">
                  {o}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <p className="text-center">
              <span className="block text-xs text-muted-foreground">Seu nível estimado</span>
              <span className="font-display text-5xl">{level}</span>
            </p>
            <ul className="grid gap-1.5">
              {byLevel.map((b) => (
                <li key={b.lv} className="grid grid-cols-[3.5rem_1fr_2.5rem] items-center gap-3 text-xs tabular">
                  <span className="font-bold">{b.lv}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-muted">
                    <span className={cn("block h-full rounded-full", b.right >= 2 ? "bg-ink" : "bg-[#d07a64]")} style={{ width: `${(b.right / b.total) * 100}%` }} />
                  </span>
                  <span className="text-right text-muted-foreground">
                    {b.right}/{b.total}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">É uma estimativa só pela gramática. Para leitura e escuta, o EF SET é mais completo.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => (onResult(level), onClose())} className="h-10 rounded-full bg-ink px-5 text-sm font-bold text-ink-foreground">
                Usar {level} como meu nível
              </button>
              <button onClick={onClose} className="h-10 rounded-full border border-border px-5 text-sm hover:border-foreground">
                Fechar
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** "O que eu já consigo": CEFR can-do statements per level, ticked over time. */
function CanDo({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const { data, toggleCando } = useEstante();
  const mine = new Set(data.cando[lang] ?? []);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[1.75rem] p-5 sm:max-w-xl sm:p-6">
        <DialogTitle className="font-display text-xl">O que eu já consigo</DialogTitle>
        <DialogDescription className="-mt-2 text-xs">Marque o que você já faz em {langInfo(lang).name.toLowerCase()} sem travar. Quando quase tudo de um nível estiver marcado, você chegou lá.</DialogDescription>
        <div className="grid gap-4">
          {Object.entries(CANDO).map(([lv, items]) => {
            const done = items.filter((_, k) => mine.has(`${lv}-${k}`)).length;
            return (
              <section key={lv} className="grid gap-1.5">
                <h3 className="flex items-baseline justify-between text-sm font-bold">
                  {lv}
                  <span className="text-xs font-normal text-muted-foreground tabular">
                    {done}/{items.length}
                  </span>
                </h3>
                {items.map((text, k) => {
                  const id = `${lv}-${k}`;
                  const on = mine.has(id);
                  return (
                    <label key={id} className="flex cursor-pointer items-start gap-3 rounded-xl p-2 text-sm hover:bg-muted/60">
                      <input type="checkbox" checked={on} onChange={() => toggleCando(lang, id)} className="mt-0.5 size-4 accent-ink" />
                      <span className={cn(on && "text-muted-foreground line-through")}>{text}</span>
                    </label>
                  );
                })}
              </section>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
