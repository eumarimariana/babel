"use client";

import { useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { CopyIcon, MagnifyingGlassIcon, PencilSimpleIcon, QuotesIcon, TranslateIcon, TrashIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BOOKS, BOOK_BY_ID } from "@/lib/books";
import { brDate, useEstante, type Quote } from "@/lib/store";
import { translateQuote } from "@/lib/ai-client";
import { quotePrompt } from "@/lib/ai/prompts";
import { cn } from "@/lib/utils";
import { BookCover, SimpleSelect, SpeakButton, copyText } from "./common";

const BOOK_OPTIONS = [{ value: "none", label: "Nenhum livro" }, ...BOOKS.map((b, i) => ({ value: String(b.id), label: `${i + 1}. ${b.t} (${b.lv})` }))];

export function QuotesTab({ aiName, bookId, onBookChange, onOpenBook }: { aiName: string; bookId: string; onBookChange: (v: string) => void; onOpenBook: (id: number) => void }) {
  const { data, addQuote, updateQuote, deleteQuote } = useEstante();
  const [form, setForm] = useState({ text: "", pt: "", page: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const ctl = useRef<AbortController | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const book = bookId === "none" ? undefined : BOOK_BY_ID.get(Number(bookId));

  async function translate() {
    if (form.text.trim().length < 2) return toast.error("Cole o trecho primeiro.");
    ctl.current?.abort();
    ctl.current = new AbortController();
    setBusy(true);
    try {
      const pt = await translateQuote(form.text.trim(), book, ctl.current.signal);
      setForm((f) => ({ ...f, pt }));
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.text.trim()) return;
    addQuote({ ...form, book: book?.id ?? null });
    toast.success("Citação salva.");
    setForm({ text: "", pt: "", page: "", note: "" });
    document.getElementById("q-text")?.focus();
  }

  const booksWithQuotes = useMemo(() => [...new Set(data.quotes.map((x) => x.book).filter((x): x is number => x != null))], [data.quotes]);
  const quotes = useMemo(() => {
    const query = q.trim().toLowerCase();
    return data.quotes.filter((x) => {
      if (filter !== "all" && String(x.book) !== filter) return false;
      return !query || `${x.text} ${x.pt} ${x.note}`.toLowerCase().includes(query);
    });
  }, [data.quotes, q, filter]);

  const field = "border-ink-border bg-white/5 text-ink-foreground placeholder:text-ink-muted focus-visible:border-sand focus-visible:ring-sand/30 dark:bg-white/5";
  const stats = [
    { label: "citações", value: data.quotes.length },
    { label: "livros citados", value: booksWithQuotes.length },
    { label: "com tradução", value: data.quotes.filter((x) => x.pt).length },
  ];

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[21rem_minmax(0,1fr)]">
      {/* new quote, on graphite */}
      <section className="rounded-[1.75rem] bg-ink p-5 text-ink-foreground sm:p-6 lg:sticky lg:top-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-sand text-sand-foreground">
            <QuotesIcon weight="fill" className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-xl">Nova citação</h2>
            <p className="text-xs text-ink-muted">um trecho que você quer guardar</p>
          </div>
        </div>
        <form onSubmit={save} className="mt-5 grid gap-3.5">
          <Field id="q-text" label="Trecho do livro">
            <Textarea id="q-text" value={form.text} onChange={set("text")} rows={4} required placeholder="“Not all those who wander are lost.”" className={cn(field, "rounded-2xl p-3.5 leading-relaxed")} />
          </Field>
          <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
            <Field label="Livro">
              <SimpleSelect label="Livro" value={bookId} onChange={onBookChange} options={BOOK_OPTIONS} className={cn(field, "h-10 w-full [&_svg]:text-ink-muted")} />
            </Field>
            <Field id="q-page" label="Página">
              <Input id="q-page" value={form.page} onChange={set("page")} inputMode="numeric" placeholder="12" className={cn(field, "h-10")} />
            </Field>
          </div>
          <Field id="q-pt" label="Tradução">
            <Textarea id="q-pt" value={form.pt} onChange={set("pt")} rows={3} placeholder="Nem todos os que vagueiam estão perdidos." className={cn(field, "rounded-2xl p-3.5 leading-relaxed")} />
          </Field>
          {aiName ? (
            <button
              type="button"
              onClick={busy ? () => ctl.current?.abort() : translate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-sand/40 text-sm font-medium text-sand hover:bg-white/5"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <TranslateIcon weight="bold" className="size-4" />}
              {busy ? "Traduzindo… (toque para parar)" : `Traduzir com ${aiName}`}
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                if (form.text.trim().length < 2) return toast.error("Cole o trecho primeiro.");
                if (await copyText(quotePrompt(form.text.trim(), book))) toast.success("Pedido copiado. Cole no claude.ai, Gemini ou outra IA e traga a tradução para cá.");
                else toast.error("Não consegui copiar.");
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-ink-border text-sm hover:bg-white/5"
            >
              <CopyIcon weight="bold" className="size-4" /> Copiar pedido de tradução
            </button>
          )}
          <Field id="q-note" label="Nota pessoal (opcional)">
            <Input id="q-note" value={form.note} onChange={set("note")} placeholder="por que esse trecho me marcou" className={cn(field, "h-10")} />
          </Field>
          <button type="submit" className="mt-1 h-11 rounded-full bg-sand text-sm font-bold text-sand-foreground transition-transform hover:scale-[1.02]">
            Salvar citação
          </button>
        </form>
      </section>

      <div className="grid min-w-0 gap-5">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((x) => (
            <div key={x.label} className="rounded-[1.25rem] border border-border bg-card p-4">
              <p className="text-3xl leading-none font-bold tabular">{x.value}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">{x.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[12rem] flex-1">
            <span className="sr-only">Buscar citação</span>
            <MagnifyingGlassIcon weight="bold" className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nas citações" className="h-10 bg-card pl-11" />
          </label>
          {booksWithQuotes.length > 1 && (
            <SimpleSelect
              label="Filtrar por livro"
              value={filter}
              onChange={setFilter}
              className="h-10 max-w-[16rem] bg-card"
              options={[{ value: "all", label: "Todos os livros" }, ...booksWithQuotes.map((id) => ({ value: String(id), label: BOOK_BY_ID.get(id)?.t ?? "Livro" }))]}
            />
          )}
        </div>

        {data.quotes.length === 0 ? (
          <div className="grid justify-items-center gap-3 rounded-[1.5rem] border-2 border-dashed border-border px-6 py-12 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-sand text-sand-foreground">
              <QuotesIcon weight="fill" className="size-6" />
            </span>
            <p className="font-display text-xl">Nenhuma citação ainda</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Quando um trecho do livro te marcar, cole aqui com a página. A tradução fica ao lado{aiName ? ` e o ${aiName} pode traduzir para você` : ""}.
            </p>
          </div>
        ) : quotes.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">Nenhuma citação encontrada.</p>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {quotes.map((x) => (
              <QuoteCard key={x.id} quote={x} aiName={aiName} onUpdate={updateQuote} onDelete={deleteQuote} onOpenBook={onOpenBook} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ id, label, children }: { id?: string; label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs font-normal text-ink-muted">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function QuoteCard({
  quote: x,
  aiName,
  onUpdate,
  onDelete,
  onOpenBook,
  compact,
}: {
  quote: Quote;
  aiName: string;
  onUpdate: (id: string, patch: Partial<Pick<Quote, "pt">>) => void;
  onDelete?: (id: string) => void;
  onOpenBook?: (id: number) => void;
  compact?: boolean;
}) {
  const book = x.book != null ? BOOK_BY_ID.get(x.book) : undefined;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(x.pt);
  const [busy, setBusy] = useState(false);

  async function translate() {
    setBusy(true);
    try {
      onUpdate(x.id, { pt: await translateQuote(x.text, book) });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="grid content-start gap-3 rounded-[1.5rem] border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <QuotesIcon weight="fill" className="mt-1 size-6 shrink-0 text-[#a39d94]" />
        <p className={cn("min-w-0 font-medium whitespace-pre-line", compact ? "text-base leading-snug" : "text-lg leading-relaxed")}>{x.text}</p>
      </div>

      {editing ? (
        <div className="grid gap-2">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} className="rounded-2xl bg-background p-3.5" aria-label="Tradução" autoFocus />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => (onUpdate(x.id, { pt: draft.trim() }), setEditing(false))}>
              Salvar tradução
            </Button>
            <Button size="sm" variant="ghost" onClick={() => (setDraft(x.pt), setEditing(false))}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : x.pt ? (
        <p className="rounded-2xl bg-sand px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-sand-foreground">{x.pt}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          Sem tradução.
          {aiName && (
            <button onClick={translate} disabled={busy} className="inline-flex items-center gap-1.5 font-semibold text-foreground underline underline-offset-4 disabled:opacity-60">
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <TranslateIcon weight="bold" className="size-3.5" />}
              {busy ? "Traduzindo…" : `Traduzir com ${aiName}`}
            </button>
          )}
          <button onClick={() => setEditing(true)} className="font-semibold text-foreground underline underline-offset-4">
            Escrever
          </button>
        </div>
      )}

      {x.note && <p className="border-l-2 border-border pl-3 text-sm text-muted-foreground italic">{x.note}</p>}

      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        {book ? (
          <button onClick={() => onOpenBook?.(book.id)} className="flex min-w-0 items-center gap-2.5 text-left" disabled={!onOpenBook}>
            <BookCover book={book} size="xs" className="w-7 shrink-0 rounded-[0.25rem] ring-1 ring-foreground" />
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold">{book.t}</span>
              <span className="block text-xs text-muted-foreground">
                {x.page ? `p. ${x.page} · ` : ""}
                {brDate(x.created.slice(0, 10))}
              </span>
            </span>
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">
            {x.page ? `p. ${x.page} · ` : ""}
            {brDate(x.created.slice(0, 10))}
          </span>
        )}
        <div className="-mr-1 flex shrink-0">
          <SpeakButton text={x.text} />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Copiar citação"
            onClick={async () => {
              const ref = [book?.t, x.page && `p. ${x.page}`].filter(Boolean).join(", ");
              if (await copyText(`“${x.text}”${ref ? ` (${ref})` : ""}${x.pt ? `\n\n${x.pt}` : ""}`)) toast.success("Citação copiada.");
            }}
          >
            <CopyIcon />
          </Button>
          {x.pt && !editing && (
            <Button variant="ghost" size="icon-sm" aria-label="Editar tradução" onClick={() => (setDraft(x.pt), setEditing(true))}>
              <PencilSimpleIcon />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon-sm" aria-label="Apagar citação" onClick={() => onDelete(x.id)} className="text-muted-foreground hover:text-destructive">
              <TrashIcon />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
