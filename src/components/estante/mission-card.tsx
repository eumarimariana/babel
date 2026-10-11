"use client";

import { ArrowSquareOutIcon, ArrowUpRightIcon, CheckIcon, TargetIcon } from "@phosphor-icons/react";
import type { Book } from "@/lib/books";
import { buildMission, type MissionItem } from "@/lib/mission";
import { today, useEstante } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useLang } from "./common";

/** "Missão do dia": four short steps; each one ticked counts as a study day. */
export function MissionCard({ book, onGo, onOpen, className }: { book?: Book; onGo: (tab: string) => void; onOpen: (id: number) => void; className?: string }) {
  const { data, toggleMission } = useEstante();
  const lang = useLang();
  const t = today();
  const items = buildMission(data, lang, t, book);
  const done = new Set(data.missions[t] ?? []);
  const count = items.filter((x) => done.has(x.id)).length;
  const minutes = items.reduce((n, x) => n + x.minutes, 0);

  function open(x: MissionItem) {
    if (x.go && "tab" in x.go) onGo(x.go.tab);
    else if (x.go) onOpen(x.go.book);
  }

  return (
    <article className={cn("grid content-start gap-4 rounded-[1.5rem] border border-border bg-card p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", count === items.length ? "bg-ink text-ink-foreground" : "bg-sand text-sand-foreground")}>
            {count === items.length ? <CheckIcon weight="bold" className="size-5" /> : <TargetIcon weight="bold" className="size-5" />}
          </span>
          <div>
            <h2 className="font-display text-lg leading-tight">Missão do dia</h2>
            <p className="text-xs text-muted-foreground tabular">
              {book ? `${book.lv} · ` : ""}~{minutes} min
            </p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground tabular">
          {count}/{items.length}
        </span>
      </div>

      <ol className="grid gap-2">
        {items.map((x) => {
          const on = done.has(x.id);
          const label = (
            <>
              <span className={cn("block text-sm leading-snug font-semibold", on && "text-muted-foreground line-through")}>{x.title}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {x.area} · {x.detail}
              </span>
            </>
          );
          return (
            <li key={x.id} className="flex items-start gap-3 rounded-2xl bg-muted/60 p-2.5">
              <button
                role="checkbox"
                aria-checked={on}
                aria-label={`Feito: ${x.title}`}
                onClick={() => toggleMission(x.id)}
                className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border transition-colors", on ? "border-ink bg-ink text-ink-foreground" : "border-border bg-card hover:border-foreground")}
              >
                {on && <CheckIcon weight="bold" className="size-3.5" />}
              </button>
              {x.href ? (
                <a href={x.href} target="_blank" rel="noopener noreferrer" className="group min-w-0 flex-1">
                  {label}
                </a>
              ) : (
                <button onClick={() => open(x)} className="min-w-0 flex-1 text-left">
                  {label}
                </button>
              )}
              <span className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden>
                {x.href ? <ArrowSquareOutIcon className="size-4" /> : <ArrowUpRightIcon className="size-4" />}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted-foreground">{count === items.length ? "Missão cumprida. Até amanhã!" : "Marque cada passo quando terminar. Um passo já conta como dia de estudo."}</p>
    </article>
  );
}
