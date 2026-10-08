"use client";

import { useState } from "react";
import { ArrowRightIcon, ArrowUpRightIcon, CaretLeftIcon, CaretRightIcon, QuotesIcon } from "@phosphor-icons/react";
import { ALL_BOOKS, BOOKS, STAGES, type Book } from "@/lib/books";
import { addDays, today, useEstante, type Status } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { JourneyProps } from "@/remotion/Journey";
import { BookCover, STATUS_LABEL } from "./common";
import { JourneyPlayer } from "./players";
import { QuoteCard } from "./quotes-tab";

type Props = {
  journey: JourneyProps;
  nextBook?: Book;
  reading: Book[];
  onGo: (tab: string) => void;
  onOpen: (id: number) => void;
  onStudy: (id: number) => void;
  aiName: string;
};

/** CEFR bands for the gauge rows (the ladder has several stages per band). */
const BANDS = (() => {
  const out: { lv: string; ids: number[] }[] = [];
  for (const s of STAGES) {
    const band = out.find((b) => b.lv === s.lv);
    if (band) band.ids.push(...s.ids);
    else out.push({ lv: s.lv, ids: [...s.ids] });
  }
  return out;
})();

const WEEKDAY = ["Do", "Se", "Te", "Qa", "Qi", "Sx", "Sá"];

export function HomeTab({ journey, nextBook, reading, onGo, onOpen, onStudy, aiName }: Props) {
  const { data, due, streak, status, updateQuote } = useEstante();
  const quote = data.quotes[0];
  const want = ALL_BOOKS.filter((b) => status(b.id) === "want");
  const pile = [...reading, ...want];
  const cards = (pile.length >= 3 ? pile : [...pile, ...BOOKS.filter((b) => !status(b.id))]).slice(0, 3);
  const tracked = ALL_BOOKS.filter((b) => status(b.id)).slice(0, 5);
  const bands = BANDS.map((b) => ({ ...b, done: b.ids.filter((id) => status(id) === "done").length }));
  const pct = journey.total ? Math.round((journey.done / journey.total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
      {/* main column */}
      <div className="grid min-w-0 content-start gap-5">
        {/* the pile */}
        <section className="grid gap-3">
          <SectionHead title={pile.length ? "Sua pilha" : "Para começar"} action="Ver estante" onAction={() => onGo("books")} />
          <div className="grid gap-3 sm:grid-cols-3">
            {cards.map((b) => (
              <button key={b.id} onClick={() => onOpen(b.id)} className="grid min-w-0 grid-cols-1 gap-4 rounded-[1.5rem] border border-border bg-card p-4 text-left transition-colors hover:border-foreground">
                <div className="flex min-w-0 gap-3">
                  <BookCover book={b} size="xs" className="w-11 shrink-0 rounded-[0.35rem] ring-1 ring-foreground" />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm leading-snug font-semibold">{b.t}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground tabular">{b.a}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-t border-border pt-3 text-xs tabular">
                  <span className="grid gap-0.5">
                    <span className="text-muted-foreground">Nível</span>
                    <span className="font-bold">{b.lv}</span>
                  </span>
                  <span className="grid gap-0.5">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-bold">{STATUS_LABEL[status(b.id)]}</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* activity + today's reviews */}
        <section className="grid gap-5 md:grid-cols-[1.25fr_1fr]">
          <WeekChart words={data.words} />
          <article className="flex flex-col gap-4 rounded-[1.5rem] border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg">Revisões de hoje</h2>
              <span className="text-xs text-muted-foreground tabular">{due.length} pendentes</span>
            </div>
            {due.length ? (
              <ul className="grid gap-2">
                {due.slice(0, 4).map((w) => (
                  <li key={w.id}>
                    <button onClick={() => onGo("review")} className="flex w-full items-center gap-3 rounded-2xl p-1.5 text-left hover:bg-muted">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand text-xs font-bold text-sand-foreground uppercase tabular">{w.w.slice(0, 2)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{w.w}</span>
                        <span className="block truncate text-xs text-muted-foreground tabular">{w.pt || w.en || "sem tradução"}</span>
                      </span>
                      <span className="grid size-7 place-items-center rounded-full border border-border">
                        <CaretRightIcon weight="bold" className="size-3" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="grid flex-1 content-center justify-items-center gap-3 rounded-2xl bg-muted/60 p-5 text-center">
                <p className="text-sm text-muted-foreground">{data.words.length ? "Tudo em dia por hoje." : "Anote palavras no caderno para elas virarem flashcards."}</p>
                <button onClick={() => onGo(data.words.length ? "review" : "vocab")} className="rounded-full bg-ink px-4 py-2 text-xs font-medium text-ink-foreground">
                  {data.words.length ? "Revisar mesmo assim" : "Abrir o caderno"}
                </button>
              </div>
            )}
          </article>
        </section>

        {/* the travel map (Remotion) */}
        <section className="overflow-hidden rounded-[1.5rem] border border-border bg-[#e9e5df] text-[#1c1d1f]">
          <div className="flex items-end justify-between gap-4 px-5 pt-5 sm:px-6">
            <div>
              <h2 className="font-display text-lg">Mapa de leitura</h2>
              <p className="text-xs text-[#6b6863] tabular">do Pre-A1 ao C1, uma cidade por degrau</p>
            </div>
            <p className="text-right">
              <span className="font-display text-2xl tabular">{journey.done}</span>
              <span className="text-xs text-[#6b6863] tabular">/{journey.total} · {pct}%</span>
            </p>
          </div>
          <div className="overflow-x-auto px-2 pb-2 scrollbar-none sm:px-3 sm:pb-3">
            <div className="min-w-[40rem]">
              <JourneyPlayer stages={journey.stages} done={journey.done} total={journey.total} />
            </div>
          </div>
        </section>

        {/* tracked books */}
        <section className="grid gap-3">
          <SectionHead title="Seus livros" action="Ver todos" onAction={() => onGo("books")} />
          {tracked.length ? (
            <ul className="grid gap-2">
              {tracked.map((b) => (
                <li key={b.id}>
                  <button onClick={() => onOpen(b.id)} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-[1.25rem] border border-border bg-card p-3 pr-4 text-left hover:border-foreground sm:grid-cols-[auto_minmax(0,1fr)_8rem_auto]">
                    <BookCover book={b} size="xs" className="w-9 rounded-[0.3rem] ring-1 ring-foreground" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{b.t}</span>
                      <span className="block truncate text-xs text-muted-foreground tabular">{b.a}</span>
                    </span>
                    <span className="hidden text-xs sm:grid tabular">
                      <span className="text-muted-foreground">Nível</span>
                      <span className="font-bold">
                        {b.lv} · {b.hw ? `${b.hw} hw` : "original"}
                      </span>
                    </span>
                    <StatusPill status={status(b.id)} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-[1.25rem] border border-dashed border-border p-5 text-sm text-muted-foreground">Marque livros como “quero ler” ou “lendo” para acompanhar aqui.</p>
          )}
        </section>
      </div>

      {/* right column */}
      <aside className="grid content-start gap-5 md:grid-cols-2 xl:grid-cols-1">
        {nextBook && (
          <article className="relative overflow-hidden rounded-[1.5rem] bg-ink p-5 text-ink-foreground md:col-span-2 xl:col-span-1">
            <p className="text-xs text-ink-muted tabular">{reading.length ? "Lendo agora" : "Próxima parada"}</p>
            <h2 className="mt-2 max-w-[11rem] font-display text-2xl leading-tight">{nextBook.t}</h2>
            <p className="mt-1 max-w-[11rem] text-xs text-ink-muted tabular">
              {nextBook.lv} · {nextBook.hw ? `${nextBook.hw} headwords` : "original"}
            </p>
            <button onClick={() => onStudy(nextBook.id)} className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-sand px-4 py-2 text-xs font-semibold text-sand-foreground hover:opacity-90">
              Abrir kit de estudo <ArrowUpRightIcon weight="bold" className="size-3.5" />
            </button>
            <button onClick={() => onOpen(nextBook.id)} className="absolute -right-3 -bottom-6 w-28 rotate-6 transition-transform hover:rotate-3" aria-label={`Abrir ${nextBook.t}`}>
              <BookCover book={nextBook} className="ring-0 shadow-[0_10px_30px_rgb(0_0_0/0.5)]" />
            </button>
          </article>
        )}

        {/* latest saved quote */}
        <section className="grid gap-3 md:col-span-2 xl:col-span-1">
          <SectionHead title="Última citação" action={quote ? "Ver todas" : "Salvar uma"} onAction={() => onGo("quotes")} />
          {quote ? (
            <QuoteCard quote={quote} aiName={aiName} onUpdate={updateQuote} onOpenBook={onOpen} compact />
          ) : (
            <button onClick={() => onGo("quotes")} className="grid gap-2 rounded-[1.5rem] border-2 border-dashed border-border p-5 text-left hover:border-foreground">
              <QuotesIcon weight="fill" className="size-6 text-[#a39d94]" />
              <span className="text-sm text-muted-foreground">Guarde os trechos que te marcarem, com a tradução ao lado.</span>
            </button>
          )}
        </section>

        <StudyCalendar days={data.days} streak={streak} />

        <article className="rounded-[1.5rem] border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">Por nível</h2>
            <span className="text-xs text-muted-foreground tabular">{pct}%</span>
          </div>
          <ul className="mt-4 grid gap-3">
            {bands.map((b) => (
              <li key={b.lv} className="grid grid-cols-[3rem_1fr_2.75rem] items-center gap-3 text-xs tabular">
                <span className="font-bold">{b.lv}</span>
                <span className="h-2 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-ink" style={{ width: `${(b.done / b.ids.length) * 100}%` }} />
                </span>
                <span className="text-right text-muted-foreground tabular">
                  {b.done}/{b.ids.length}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </aside>
    </div>
  );
}

function SectionHead({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-display text-lg">{title}</h2>
      <button onClick={onAction} className="flex items-center gap-1 text-xs underline underline-offset-4 hover:text-muted-foreground tabular">
        {action} <ArrowRightIcon className="size-3" />
      </button>
    </div>
  );
}

function StatusPill({ status }: { status: Status | "" }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-[11px] font-medium whitespace-nowrap",
        status === "reading" && "bg-ink text-ink-foreground",
        status === "want" && "bg-sand text-sand-foreground",
        status === "done" && "border border-border text-muted-foreground",
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Words added per day over the last 7 days, as bars. */
function WeekChart({ words }: { words: { created: string }[] }) {
  const t = today();
  const days = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6));
  const counts = days.map((d) => words.filter((w) => w.created.slice(0, 10) === d).length);
  const max = Math.max(4, ...counts);
  const total = counts.reduce((a, b) => a + b, 0);
  const [hover, setHover] = useState(6);

  return (
    <article className="flex flex-col gap-4 rounded-[1.5rem] border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg">Palavras na semana</h2>
          <p className="text-xs text-muted-foreground tabular">{total} anotadas nos últimos 7 dias</p>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-xs tabular">7 dias</span>
      </div>
      <div className="grid flex-1 grid-cols-[auto_1fr] gap-3">
        <div className="flex flex-col justify-between pb-6 text-[11px] text-muted-foreground tabular">
          {[max, Math.round(max / 2), 0].map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>
        <div className="grid min-h-40 grid-cols-7 items-end gap-2">
          {days.map((d, i) => {
            const on = i === hover;
            return (
              <div key={d} className="flex h-full flex-col items-center justify-end gap-2" onMouseEnter={() => setHover(i)}>
                <div className="relative flex w-full flex-1 flex-col items-center justify-end gap-1.5">
                  {on && <span className="z-10 rounded-md bg-ink px-1.5 py-0.5 text-[11px] text-ink-foreground tabular">{counts[i]}</span>}
                  <span className={cn("w-2.5 rounded-full transition-colors sm:w-3", on ? "bg-[#9a8f7f]" : "bg-ink")} style={{ height: `${Math.max(4, (counts[i] / max) * 80)}%` }} />
                </div>
                <span className={cn("text-[11px]", d === t ? "font-bold" : "text-muted-foreground")}>{WEEKDAY[new Date(d + "T12:00:00").getDay()]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

/** Month calendar with the days you studied filled in. */
function StudyCalendar({ days, streak }: { days: string[]; streak: number }) {
  const t = today();
  const [offset, setOffset] = useState(0);
  const base = new Date(t + "T12:00:00");
  base.setDate(1);
  base.setMonth(base.getMonth() + offset);
  const year = base.getFullYear();
  const month = base.getMonth();
  const first = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const studied = new Set(days);
  const iso = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return (
    <article className="rounded-[1.5rem] border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <button onClick={() => setOffset((o) => o - 1)} aria-label="Mês anterior" className="grid size-8 place-items-center rounded-full border border-border hover:border-foreground">
          <CaretLeftIcon weight="bold" className="size-3" />
        </button>
        <h2 className="font-display text-base first-letter:uppercase">{base.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h2>
        <button onClick={() => setOffset((o) => o + 1)} aria-label="Próximo mês" className="grid size-8 place-items-center rounded-full border border-border hover:border-foreground">
          <CaretRightIcon weight="bold" className="size-3" />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-y-1.5 text-center text-xs tabular">
        {WEEKDAY.map((d) => (
          <span key={d} className="pb-1 text-[10px] text-muted-foreground">
            {d}
          </span>
        ))}
        {Array.from({ length: first }, (_, i) => (
          <span key={`e${i}`} />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const d = iso(i + 1);
          return (
            <span key={d} className="grid place-items-center">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full tabular",
                  studied.has(d) && "bg-sand font-bold text-sand-foreground",
                  d === t && "bg-ink font-bold text-ink-foreground",
                  d > t && "text-muted-foreground/60",
                )}
              >
                {i + 1}
              </span>
            </span>
          );
        })}
      </div>
      <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground tabular">
        <span className="mr-1.5 inline-block size-2 rounded-full bg-sand align-middle ring-1 ring-foreground/20" />
        dias estudados · {streak} {streak === 1 ? "dia seguido" : "dias seguidos"}
      </p>
    </article>
  );
}
