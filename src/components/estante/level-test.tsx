"use client";

import { ArrowSquareOutIcon, ArrowUpRightIcon, ClipboardTextIcon } from "@phosphor-icons/react";
import { basesFor, cefrRank, type Lang } from "@/lib/books";
import { RESOURCE_LEVELS, plainLevel } from "@/lib/resources";
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
  const { data, status, setPlacement } = useEstante();
  const result = data.placement[lang];
  const tests = TESTS[lang] ?? [];
  const books = basesFor(lang)
    .filter((d) => d.graded)
    .flatMap((d) => d.books)
    .sort((a, b) => cefrRank(a.lv) - cefrRank(b.lv));
  const suggestion = result ? books.find((b) => plainLevel(b.lv) === result.lv && status(b.id) !== "done") : undefined;

  return (
    <article className="grid grid-cols-1 content-start gap-4 rounded-[1.5rem] border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
          <ClipboardTextIcon weight="bold" className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-lg leading-tight">Descobrir meu nível</h2>
          <p className="text-xs text-muted-foreground">{result ? `Seu teste deu ${result.lv} em ${brDate(result.at)}` : "faça um teste grátis e conte o resultado"}</p>
        </div>
      </div>

      {tests.length > 0 && (
        <ul className="grid gap-2">
          {tests.map((t) => (
            <li key={t.url}>
              <a href={t.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 p-3 hover:bg-muted">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{t.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{t.detail}</span>
                </span>
                <ArrowSquareOutIcon className="size-4 shrink-0 text-muted-foreground" />
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-2">
        <p className="text-xs text-muted-foreground">Qual nível o teste deu?</p>
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
              <span className="block text-xs text-ink-muted">Comece o mapa por aqui</span>
              <span className="block truncate text-sm font-semibold">{suggestion.t}</span>
              <span className="block text-xs text-ink-muted tabular">{suggestion.lv}</span>
            </span>
            <ArrowUpRightIcon className="size-4 shrink-0" />
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">Você já leu todos os livros {result.lv} desta língua. Tente o próximo nível.</p>
        ))}
    </article>
  );
}
