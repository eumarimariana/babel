"use client";

import { motion } from "motion/react";
import { ArrowSquareOutIcon, BookmarkSimpleIcon, CaretLeftIcon, CaretRightIcon, GraduationCapIcon, NotePencilIcon, QuotesIcon } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { BOOKS, BOOK_BY_ID, bookNumber, bookUrl, type Book } from "@/lib/books";
import { brDate, useEstante } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BookCover, StatusPicker, useMediaQuery } from "./common";

type Props = {
  bookId: number | null;
  onOpenChange: (id: number | null) => void;
  onStudy: (id: number) => void;
  onAddWord: (id: number) => void;
  onAddQuote: (id: number) => void;
};

/** The book screen: a bottom drawer on phones, a wide dialog on larger screens. */
export function BookScreen({ bookId, onOpenChange, onStudy, onAddWord, onAddQuote }: Props) {
  const wide = useMediaQuery("(min-width: 768px)");
  const book = bookId != null ? BOOK_BY_ID.get(bookId) : undefined;
  const close = () => onOpenChange(null);
  const body = book && (
    <BookBody
      book={book}
      onStudy={() => (close(), onStudy(book.id))}
      onAddWord={() => (close(), onAddWord(book.id))}
      onAddQuote={() => (close(), onAddQuote(book.id))}
      onGo={(id) => onOpenChange(id)}
      wide={wide}
    />
  );

  if (wide)
    return (
      <Dialog open={!!book} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-h-[min(44rem,calc(100dvh-3rem))] gap-0 overflow-hidden rounded-[2rem] border-0 bg-ink p-0 text-ink-foreground ring-0 sm:max-w-3xl [&>[data-slot=dialog-close]]:text-ink-foreground [&>[data-slot=dialog-close]]:hover:bg-white/10">{body}</DialogContent>
      </Dialog>
    );

  return (
    <Drawer open={!!book} onOpenChange={(o) => !o && close()} showSwipeHandle>
      <DrawerContent className="rounded-t-[2rem] border-0 bg-sand">{body}</DrawerContent>
    </Drawer>
  );
}

/** Book details docked beside the shelf on wide screens, like a library app's side panel. */
export function BookPanel({ bookId, onGo, onStudy, onAddWord, onAddQuote }: { bookId: number; onGo: (id: number) => void; onStudy: (id: number) => void; onAddWord: (id: number) => void; onAddQuote: (id: number) => void }) {
  const book = BOOK_BY_ID.get(bookId);
  if (!book) return null;
  return (
    <aside className="sticky top-4 hidden max-h-[calc(100dvh-2rem)] overflow-hidden rounded-[2rem] xl:flex xl:flex-col">
      <BookBody book={book} wide split={false} onGo={onGo} onStudy={() => onStudy(book.id)} onAddWord={() => onAddWord(book.id)} onAddQuote={() => onAddQuote(book.id)} />
    </aside>
  );
}

function BookBody({ book: b, onStudy, onAddWord, onAddQuote, onGo, wide, split = wide }: { book: Book; onStudy: () => void; onAddWord: () => void; onAddQuote: () => void; onGo: (id: number) => void; wide: boolean; split?: boolean }) {
  /** md: classes only apply in the two-column dialog, not in the stacked drawer or docked panel. */
  const md = (cls: string) => (split ? cls : "");
  const { status, setStatus, data } = useEstante();
  const p = data.progress[b.id];
  const words = data.words.filter((w) => w.book === b.id);
  const quotes = data.quotes.filter((q) => q.book === b.id);
  const n = bookNumber(b.id);
  const prev = BOOKS[n - 2];
  const next = BOOKS[n];
  const Title = split ? DialogTitle : wide ? "h2" : DrawerTitle;
  const Desc = split ? DialogDescription : wide ? "p" : DrawerDescription;

  return (
    <div className={cn("flex min-h-0 flex-col overflow-y-auto overscroll-contain bg-ink", md("md:grid md:grid-cols-[18rem_minmax(0,1fr)] md:overflow-hidden"))}>
      {/* sand half: the cover */}
      <div className={cn("flex shrink-0 justify-center bg-sand px-6 pt-6 pb-14", md("md:items-center md:pb-6"))}>
        <motion.div key={b.id} initial={{ opacity: 0, y: 10, rotate: -3 }} animate={{ opacity: 1, y: 0, rotate: -2 }} transition={{ type: "spring", stiffness: 240, damping: 22 }} className={cn("w-36", md("md:w-52"))}>
          <BookCover book={b} size="lg" status={status(b.id)} priority className="rounded-lg shadow-[0_18px_30px_-12px_rgb(0_0_0/0.45)] ring-0" />
        </motion.div>
      </div>

      {/* graphite half: the details */}
      <motion.div
        key={`body-${b.id}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn("-mt-8 grid content-start gap-6 rounded-t-[2rem] bg-ink px-6 pt-7 pb-7 text-ink-foreground", md("md:mt-0 md:overflow-y-auto md:rounded-none md:px-8 md:py-9"))}
      >
        <div className="grid gap-2">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] font-bold tracking-[0.16em] text-ink-muted uppercase">
              Nº {n} de {BOOKS.length} · {b.cat}
            </p>
            <button
              onClick={() => setStatus(b.id, status(b.id) === "want" ? "" : "want")}
              aria-pressed={status(b.id) === "want"}
              aria-label="Quero ler"
              className={cn("-mt-1 text-sand transition-transform hover:scale-110", md("md:mr-6"))}
            >
              <BookmarkSimpleIcon weight={status(b.id) === "want" ? "fill" : "regular"} className="size-5" />
            </button>
          </div>
          <Title className={cn("caps font-sans text-[1.9rem]", md("md:text-[2.2rem]"))}>{b.t}</Title>
          <Desc className="text-sm text-ink-muted">{b.a}</Desc>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-sand px-3 py-1 text-xs font-bold text-sand-foreground">{b.lv}</span>
            <span className="rounded-full border border-ink-border px-3 py-1 text-xs tabular">{b.hw} headwords</span>
            {p?.st === "done" && <span className="rounded-full border border-ink-border px-3 py-1 text-xs">lido em {brDate(p.d)}</span>}
          </div>
        </div>

        <StatusPicker tone="ink" value={status(b.id)} onChange={(v) => setStatus(b.id, v)} />

        <p className="text-[0.95rem] leading-relaxed text-ink-foreground/85">{b.s}</p>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={onStudy} className="inline-flex h-11 items-center gap-2 rounded-full bg-sand px-5 text-[11px] font-bold tracking-[0.12em] text-sand-foreground uppercase transition-transform hover:scale-[1.03]">
            <GraduationCapIcon weight="bold" className="size-4" /> Estudar este livro
          </button>
          <button onClick={onAddWord} className="inline-flex h-11 items-center gap-2 rounded-full border border-ink-border px-5 text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-white/5">
            <NotePencilIcon weight="bold" className="size-4" /> Anotar palavra
          </button>
          <button onClick={onAddQuote} className="inline-flex h-11 items-center gap-2 rounded-full border border-ink-border px-5 text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-white/5">
            <QuotesIcon weight="fill" className="size-4" /> Salvar citação
          </button>
        </div>

        {b.tags && (
          <section className="grid gap-2.5">
            <h3 className="text-[10px] font-bold tracking-[0.16em] text-ink-muted uppercase">Temas</h3>
            <div className="flex flex-wrap gap-1.5">
              {b.tags.split("|").map((t) => (
                <span key={t} className="rounded-full border border-ink-border px-3 py-1 text-xs">
                  {t.trim()}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-2.5">
          <h3 className="text-[10px] font-bold tracking-[0.16em] text-ink-muted uppercase">Suas palavras deste livro · {words.length}</h3>
          {words.length ? (
            <div className="flex flex-wrap gap-1.5">
              {words.slice(0, 16).map((w) => (
                <span key={w.id} className="rounded-full bg-sand px-3 py-1 text-xs text-sand-foreground" title={w.pt}>
                  {w.w}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Nenhuma ainda. Use “Anotar palavra” enquanto lê.</p>
          )}
        </section>

        {quotes.length > 0 && (
          <section className="grid gap-2.5">
            <h3 className="text-[10px] font-bold tracking-[0.16em] text-ink-muted uppercase">Suas citações deste livro · {quotes.length}</h3>
            {quotes.slice(0, 3).map((q) => (
              <figure key={q.id} className="grid gap-1.5 rounded-2xl bg-white/5 p-3.5">
                <blockquote className="text-sm leading-relaxed">“{q.text}”</blockquote>
                {q.pt && <figcaption className="text-xs text-ink-muted">{q.pt}</figcaption>}
                {q.page && <span className="text-[11px] text-ink-muted">p. {q.page}</span>}
              </figure>
            ))}
          </section>
        )}

        <a href={bookUrl(b)} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-1 text-xs text-ink-muted underline underline-offset-4 hover:text-ink-foreground">
          Ver no site da ELi <ArrowSquareOutIcon className="size-3.5" />
        </a>

        <nav aria-label="Navegar na trilha" className="grid grid-cols-2 gap-2 border-t border-ink-border pt-4">
          {prev ? <Neighbor book={prev} dir="prev" onGo={onGo} /> : <span />}
          {next && <Neighbor book={next} dir="next" onGo={onGo} />}
        </nav>
      </motion.div>
    </div>
  );
}

function Neighbor({ book, dir, onGo }: { book: Book; dir: "prev" | "next"; onGo: (id: number) => void }) {
  const Icon = dir === "prev" ? CaretLeftIcon : CaretRightIcon;
  return (
    <button
      onClick={() => onGo(book.id)}
      className={`flex min-w-0 items-center gap-2 rounded-xl p-2 text-left transition-colors hover:bg-white/5 ${dir === "next" ? "flex-row-reverse text-right" : ""}`}
    >
      <Icon className="size-4 shrink-0 text-ink-muted" />
      <BookCover book={book} size="xs" className="w-8 shrink-0 ring-0" />
      <span className="min-w-0">
        <span className="block text-[9px] font-bold tracking-[0.14em] text-ink-muted uppercase">{dir === "prev" ? "Anterior" : "Próximo"}</span>
        <span className="block truncate text-xs">{book.t}</span>
      </span>
    </button>
  );
}
