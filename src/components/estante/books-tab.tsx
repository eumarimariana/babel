"use client";

import { useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CaretLeftIcon, CaretRightIcon, RowsIcon, SquaresFourIcon, XIcon } from "@phosphor-icons/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STAGES, baseBooks, bookNumber, type Base, type Book } from "@/lib/books";
import { useEstante, type Status } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BookCover, LevelTag, STATUS_LABEL, Segmented, StatusSelect } from "./common";

type Group = "level" | "cat" | "status";
type View = "shelf" | "list";
type StatusFilter = "all" | "none" | Status;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "reading", label: "Lendo" },
  { value: "want", label: "Quero ler" },
  { value: "none", label: "Não lidos" },
  { value: "done", label: "Lidos" },
];

type Shelf = { key: string; title: string; meta: string; books: Book[]; done: number; total: number };

/** Free bases group by level; the ELi base uses its own headword ladder. */
const FREE_LEVELS: Record<Exclude<Base, "eli">, { lv: string; meta: string }[]> = {
  gutenberg: [
    { lv: "B1", meta: "contos e infantojuvenis" },
    { lv: "B2", meta: "aventura, mistério e clássicos curtos" },
    { lv: "C1", meta: "romances completos" },
  ],
  storyweaver: [
    { lv: "Pre-A1", meta: "nível 1 · primeiras leituras" },
    { lv: "A1", meta: "nível 2 · frases curtas" },
    { lv: "A2", meta: "nível 3 · leitura independente" },
    { lv: "B1", meta: "nível 4 · leitura fluente" },
  ],
};

const BASE_NOTE: Partial<Record<Base, React.ReactNode>> = {
  gutenberg: (
    <>
      Textos <strong className="text-foreground">originais, sem adaptação</strong>, em domínio público. Dá para ler online ou baixar em EPUB, de graça e legalmente. Os níveis são aproximados: comece pelos de B1 se ainda estiver nos readers de A2.
    </>
  ),
  storyweaver: (
    <>
      Histórias <strong className="text-foreground">ilustradas e curtas</strong> da Pratham Books e parceiros, com licença aberta (Creative Commons). Leitura grátis no site do StoryWeaver, muitas com <strong className="text-foreground">versão narrada</strong>. Boas para os primeiros níveis.
    </>
  ),
};

const BASES: { value: Base; label: string; sub: string }[] = [
  { value: "eli", label: "ELi Readers", sub: "177 adaptados por nível · Pre-A1 → C1" },
  { value: "gutenberg", label: "Clássicos grátis", sub: `${baseBooks("gutenberg").length} originais completos · Project Gutenberg` },
  { value: "storyweaver", label: "Histórias grátis", sub: `${baseBooks("storyweaver").length} histórias ilustradas · StoryWeaver` },
];

export function BooksTab({ q, onQ, onOpen, selected, base, onBase }: { q: string; onQ: (q: string) => void; onOpen: (id: number) => void; selected: number | null; base: Base; onBase: (b: Base) => void }) {
  const { status, setStatus } = useEstante();
  const BOOKS = baseBooks(base);
  const CATEGORIES = useMemo(() => [...new Set(baseBooks(base).map((b) => b.cat).filter(Boolean))].sort(), [base]);
  const [st, setSt] = useState<StatusFilter>("all");
  const [cat, setCat] = useState("all");
  const [group, setGroup] = useState<Group>("level");
  const [view, setView] = useState<View>("shelf");

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return BOOKS.filter((b) => {
      const s = status(b.id);
      if (cat !== "all" && b.cat !== cat) return false;
      if (st === "none" ? s === "done" : st !== "all" && s !== st) return false;
      return !query || `${b.t} ${b.a} ${b.tags ?? ""}`.toLowerCase().includes(query);
    });
  }, [q, st, cat, status, BOOKS]);

  const shelves = useMemo<Shelf[]>(() => {
    const visible = new Set(list.map((b) => b.id));
    const make = (key: string, title: string, meta: string, all: Book[]): Shelf => ({
      key,
      title,
      meta,
      books: all.filter((b) => visible.has(b.id)),
      done: all.filter((b) => status(b.id) === "done").length,
      total: all.length,
    });
    if (group === "level")
      return base !== "eli"
        ? FREE_LEVELS[base].map((l) => make(l.lv, l.lv, l.meta, BOOKS.filter((b) => b.lv === l.lv)))
        : STAGES.map((s) => make(s.key, s.lv, `${s.label} palavras`, s.ids.map((id) => BOOKS.find((b) => b.id === id)!)));
    if (group === "cat") return CATEGORIES.map((c) => make(c, c, "", BOOKS.filter((b) => b.cat === c)));
    const order: (Status | "")[] = ["reading", "want", "", "done"];
    return order.map((s) => make(s || "none", STATUS_LABEL[s], "", BOOKS.filter((b) => status(b.id) === s)));
  }, [group, list, status, base, BOOKS, CATEGORIES]);

  return (
    <div className="grid grid-cols-1 gap-5">
      {/* which base of books */}
      <div role="radiogroup" aria-label="Base de livros" className="grid gap-2 sm:grid-cols-3">
        {BASES.map((x) => {
          const on = base === x.value;
          return (
            <button
              key={x.value}
              role="radio"
              aria-checked={on}
              onClick={() => (onBase(x.value), setCat("all"))}
              className={cn("grid gap-0.5 rounded-[1.25rem] border p-4 text-left transition-colors", on ? "border-ink bg-ink text-ink-foreground" : "border-border bg-card hover:border-foreground")}
            >
              <span className="flex items-center justify-between gap-2 font-bold">
                {x.label}
                {x.value !== "eli" && <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", on ? "bg-sand text-sand-foreground" : "bg-sand text-sand-foreground")}>Grátis</span>}
              </span>
              <span className={cn("text-xs", on ? "text-ink-muted" : "text-muted-foreground")}>{x.sub}</span>
            </button>
          );
        })}
      </div>
      {BASE_NOTE[base] && <p className="rounded-[1.25rem] bg-muted/70 p-4 text-sm leading-relaxed text-muted-foreground">{BASE_NOTE[base]}</p>}

      {/* categories, like a library app */}
      <section className="grid gap-3">
        <h2 className="text-sm font-semibold">{base === "storyweaver" ? "Editoras" : "Gêneros"}</h2>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
          {["all", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
              className={cn(
                "h-9 shrink-0 rounded-full border px-4 text-[13px] transition-colors",
                cat === c ? "border-ink bg-ink text-ink-foreground" : "border-border bg-card hover:border-foreground",
              )}
            >
              {c === "all" ? "Todos" : c}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-3 sm:flex sm:flex-wrap">
        {view === "shelf" ? (
          <Segmented
            id="group"
            label="Agrupar por"
            value={group}
            onChange={setGroup}
            options={[
              { value: "level", label: "Nível" },
              { value: "cat", label: "Gênero" },
              { value: "status", label: "Status" },
            ]}
          />
        ) : (
          <span className="text-xs text-muted-foreground tabular">Lista na ordem da trilha</span>
        )}
        <div className="col-span-2 row-start-2 -mx-4 flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto px-4 scrollbar-none sm:order-none sm:mx-0 sm:px-0">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSt(f.value)}
              aria-pressed={st === f.value}
              className={cn("h-8 shrink-0 rounded-full px-3 text-xs transition-colors", st === f.value ? "bg-sand font-semibold text-sand-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="col-span-2 row-start-3 text-xs text-muted-foreground tabular sm:col-auto">{list.length} livros</span>
        {q && (
          <button onClick={() => onQ("")} className="row-start-3 flex h-8 w-fit items-center gap-1 justify-self-end rounded-full bg-ink px-3 text-xs text-ink-foreground">
            “{q}” <XIcon className="size-3" />
          </button>
        )}
        <span className="col-start-2 row-start-1 justify-self-end sm:ml-auto">
          <Segmented
            id="view"
            label="Modo de exibição"
            value={view}
            onChange={setView}
            options={[
              { value: "shelf", label: "", icon: <SquaresFourIcon aria-label="Estante" /> },
              { value: "list", label: "", icon: <RowsIcon aria-label="Lista" /> },
            ]}
          />
        </span>
      </div>

      {list.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed py-14 text-center text-muted-foreground">Nenhum livro com esses filtros.</div>
      ) : view === "shelf" ? (
        <div className="grid grid-cols-1 gap-4">
          {shelves
            .filter((s) => s.books.length)
            .map((s) => (
              <ShelfRow key={`${group}-${s.key}`} shelf={s} onOpen={onOpen} status={status} selected={selected} />
            ))}
        </div>
      ) : (
        <BookList list={list} onOpen={onOpen} status={status} setStatus={setStatus} />
      )}
    </div>
  );
}

function ShelfRow({ shelf, onOpen, status, selected }: { shelf: Shelf; onOpen: (id: number) => void; status: (id: number) => Status | ""; selected: number | null }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const scroll = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.85, behavior: "smooth" });
  const pct = shelf.total ? shelf.done / shelf.total : 0;

  return (
    <section className="grid min-w-0 grid-cols-1 gap-4 rounded-[1.75rem] border border-border bg-card p-5 sm:p-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
          <h3 className="font-display text-xl whitespace-nowrap">{shelf.title}</h3>
          <span className="truncate text-xs text-muted-foreground tabular">
            {shelf.meta && `${shelf.meta} · `}
            {shelf.done}/{shelf.total} lidos
          </span>
          <span className="hidden h-1.5 w-14 shrink-0 self-center overflow-hidden rounded-full bg-muted sm:block">
            <span className="block h-full rounded-full bg-ink" style={{ width: `${pct * 100}%` }} />
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!expanded && shelf.books.length > 3 && (
            <span className="hidden gap-1 sm:flex">
              <button aria-label="Rolar para a esquerda" onClick={() => scroll(-1)} className="grid size-8 place-items-center rounded-full border border-border hover:border-foreground">
                <CaretLeftIcon weight="bold" className="size-3.5" />
              </button>
              <button aria-label="Rolar para a direita" onClick={() => scroll(1)} className="grid size-8 place-items-center rounded-full bg-ink text-ink-foreground">
                <CaretRightIcon weight="bold" className="size-3.5" />
              </button>
            </span>
          )}
          {shelf.books.length > 3 && (
            <button onClick={() => setExpanded((e) => !e)} className="px-2 text-xs underline underline-offset-4 hover:text-muted-foreground tabular">
              {expanded ? "menos" : "mais"}
            </button>
          )}
        </div>
      </header>

      <div
        ref={scroller}
        className={cn(
          expanded
            ? "grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-6"
            : "-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-1 scrollbar-none sm:-mx-6 sm:scroll-px-6 sm:px-6",
        )}
      >
        {shelf.books.map((b, i) => (
          <BookTile key={b.id} book={b} status={status(b.id)} onOpen={onOpen} index={i} fixed={!expanded} selected={selected === b.id} />
        ))}
      </div>
    </section>
  );
}

function BookTile({ book: b, status, onOpen, index, fixed, selected }: { book: Book; status: Status | ""; onOpen: (id: number) => void; index: number; fixed: boolean; selected: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      onClick={() => onOpen(b.id)}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 200px" }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.03, ease: "easeOut" }}
      whileTap={{ scale: 0.98 }}
      aria-current={selected || undefined}
      className={cn("group grid content-start gap-2 text-left outline-none", fixed && "w-[7.5rem] shrink-0 snap-start sm:w-[8.25rem]")}
    >
      <BookCover
        book={b}
        status={status}
        className={cn("rounded-[0.4rem] ring-1 ring-foreground transition-transform duration-200 group-hover:-translate-y-1 group-focus-visible:ring-2", selected && "ring-[3px]")}
      />
      <span className="grid gap-0.5">
        <span className={cn("line-clamp-2 text-[13px] leading-snug font-medium", status === "done" && "text-muted-foreground")}>{b.t}</span>
        <span className="truncate text-xs text-muted-foreground tabular">{b.a}</span>
        <span className="mt-1 flex items-center justify-between text-xs tabular">
          <span className="font-bold">{b.lv}</span>
          <span className="text-muted-foreground tabular">{b.hw ? `${b.hw} hw` : b.src === "storyweaver" ? (b.audio ? "com áudio" : "ilustrada") : "original"}</span>
        </span>
      </span>
    </motion.button>
  );
}

function BookList({ list, onOpen, status, setStatus }: { list: Book[]; onOpen: (id: number) => void; status: (id: number) => Status | ""; setStatus: (id: number, s: Status | "") => void }) {
  return (
    <>
      {/* phones: cards instead of a squeezed table */}
      <ul className="grid grid-cols-1 border-t border-border sm:hidden">
        {list.map((b) => {
          const s = status(b.id);
          return (
            <li key={b.id} className="flex min-w-0 items-center gap-3 border-b border-border py-2.5">
              <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => onOpen(b.id)}>
                <BookCover book={b} size="xs" className="w-11 shrink-0 rounded-[0.35rem]" />
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="tabular">#{bookNumber(b.id)}</span>
                    <LevelTag lv={b.lv} className="text-[11px]" />
                  </span>
                  <span className={cn("block truncate leading-snug", s === "done" && "text-muted-foreground line-through decoration-muted-foreground/60")}>{b.t}</span>
                  <span className="block truncate text-xs text-muted-foreground">{b.a}</span>
                </span>
              </button>
              <StatusSelect value={s} onChange={(v) => setStatus(b.id, v)} title={b.t} />
            </li>
          );
        })}
      </ul>

      <div className="hidden border-t border-foreground sm:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent [&_th]:text-[11px] [&_th]:font-semibold [&_th]:tracking-[0.08em] [&_th]:text-muted-foreground [&_th]:uppercase">
              <TableHead className="w-10 text-right">#</TableHead>
              <TableHead>Título</TableHead>
              <TableHead className="hidden md:table-cell">Autor</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Palavras</TableHead>
              <TableHead className="hidden lg:table-cell">Gênero</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((b) => {
              const s = status(b.id);
              return (
                <TableRow key={b.id} className="cursor-pointer" onClick={() => onOpen(b.id)}>
                  <TableCell className="text-right text-xs text-muted-foreground tabular">{bookNumber(b.id)}</TableCell>
                  <TableCell className="max-w-[18rem] whitespace-normal">
                    <span className="flex items-center gap-3">
                      <BookCover book={b} size="xs" className="w-8 shrink-0 rounded-[0.3rem] shadow-none" />
                      <span className={cn(s === "done" && "text-muted-foreground line-through decoration-muted-foreground/60")}>{b.t}</span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden max-w-[14rem] truncate text-muted-foreground md:table-cell">{b.a}</TableCell>
                  <TableCell>
                    <LevelTag lv={b.lv} />
                  </TableCell>
                  <TableCell className="hidden text-right text-xs text-muted-foreground tabular lg:table-cell">{b.hw ?? "—"}</TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">{b.cat}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <StatusSelect value={s} onChange={(v) => setStatus(b.id, v)} title={b.t} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
