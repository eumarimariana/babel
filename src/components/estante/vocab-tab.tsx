"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { BookOpenIcon, MagnifyingGlassIcon, NotePencilIcon, TranslateIcon, TrashIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BOOK_BY_ID, langInfo } from "@/lib/books";
import { addDays, today, useEstante, type Word } from "@/lib/store";
import { cn } from "@/lib/utils";
import { explainWord } from "@/lib/ai-client";
import { MemoryBoxes, Segmented, SimpleSelect, SpeakButton, useBookOptions, useLang } from "./common";

export function VocabTab({ aiName, bookId, onBookChange }: { aiName: string; bookId: string; onBookChange: (v: string) => void }) {
  const { data: all, addWord, deleteWord } = useEstante();
  const lang = useLang();
  const BOOK_OPTIONS = useBookOptions(true);
  // only the notebook of the language being studied
  const langWords = useMemo(() => all.words.filter((w) => (w.ln ?? "en") === lang), [all.words, lang]);
  const data = { ...all, words: langWords };
  const [form, setForm] = useState({ w: "", pt: "", en: "", ex: "", pos: "" });
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("new");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function fill() {
    if (!form.w.trim()) return toast.error("Digite a palavra primeiro.");
    setBusy(true);
    try {
      const r = await explainWord(form.w.trim(), BOOK_BY_ID.get(Number(bookId)));
      setForm((f) => ({ ...f, pt: r.pt, en: r.en, ex: r.ex, pos: r.pos }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.w.trim()) return;
    const ok = addWord({ ...form, ln: lang, book: bookId === "none" ? null : Number(bookId) });
    if (!ok) return toast.warning("Essa palavra já está no caderno.");
    toast.success(`“${form.w.trim()}” foi para o caderno.`);
    setForm({ w: "", pt: "", en: "", ex: "", pos: "" });
    document.getElementById("w-word")?.focus();
  }

  const words = useMemo(() => {
    const query = q.trim().toLowerCase();
    const ws = langWords.filter((w) => !query || `${w.w} ${w.pt}`.toLowerCase().includes(query));
    return ws.sort(
      sort === "az" ? (a, b) => a.w.localeCompare(b.w) : sort === "weak" ? (a, b) => a.box - b.box : (a, b) => b.created.localeCompare(a.created),
    );
  }, [langWords, q, sort]);

  const t = today();
  const stats = [
    { label: "no caderno", value: data.words.length },
    { label: "para hoje", value: data.words.filter((w) => w.due <= t).length },
    { label: "dominadas", value: data.words.filter((w) => w.box >= 5).length },
    { label: "esta semana", value: data.words.filter((w) => w.created.slice(0, 10) > addDays(t, -7)).length },
  ];
  const field = "h-10 border-ink-border bg-white/5 text-ink-foreground placeholder:text-ink-muted focus-visible:border-sand focus-visible:ring-sand/30 dark:bg-white/5";

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[21rem_minmax(0,1fr)]">
      {/* new word, on graphite */}
      <section className="rounded-[1.75rem] bg-ink p-5 text-ink-foreground sm:p-6 lg:sticky lg:top-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-sand text-sand-foreground">
            <NotePencilIcon weight="bold" className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-xl">Nova palavra</h2>
            <p className="text-xs text-ink-muted tabular">anote enquanto lê</p>
          </div>
        </div>
        <form onSubmit={save} className="mt-5 grid gap-3.5">
          <Field id="w-word" label="Palavra ou expressão">
            <Input id="w-word" value={form.w} onChange={set("w")} placeholder="ex.: gloomy, look forward to" autoComplete="off" required className={field} />
          </Field>
          {aiName && (
            <button type="button" onClick={fill} disabled={busy} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-sand/40 text-sm font-medium text-sand hover:bg-white/5 disabled:opacity-60">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <TranslateIcon weight="bold" className="size-4" />}
              {busy ? "Pensando…" : `Preencher com ${aiName}`}
            </button>
          )}
          <Field id="w-pt" label="Significado em português">
            <Input id="w-pt" value={form.pt} onChange={set("pt")} className={field} />
          </Field>
          <Field id="w-en" label={`Definição em ${langInfo(lang).name.toLowerCase()}`}>
            <Input id="w-en" value={form.en} onChange={set("en")} className={field} />
          </Field>
          <Field id="w-ex" label="Frase de exemplo">
            <Textarea id="w-ex" value={form.ex} onChange={set("ex")} rows={2} className={cn(field, "h-auto rounded-2xl")} />
          </Field>
          <Field label="Livro onde encontrou">
            <SimpleSelect label="Livro" value={bookId} onChange={onBookChange} options={BOOK_OPTIONS} className={cn(field, "w-full [&_svg]:text-ink-muted")} />
          </Field>
          <button type="submit" className="mt-1 h-11 rounded-full bg-sand text-sm font-bold text-sand-foreground transition-transform hover:scale-[1.02]">
            Salvar no caderno
          </button>
        </form>
      </section>

      <div className="grid min-w-0 gap-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((x) => (
            <div key={x.label} className="rounded-[1.25rem] border border-border bg-card p-4">
              <p className="text-3xl leading-none font-bold tabular">{x.value}</p>
              <p className="mt-1.5 text-xs text-muted-foreground tabular">{x.label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[12rem] flex-1">
            <span className="sr-only">Buscar palavra</span>
            <MagnifyingGlassIcon weight="bold" className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="w-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar no caderno" className="h-10 bg-card pl-11 text-sm tabular" />
          </label>
          <Segmented
            id="sort"
            label="Ordenar"
            value={sort as "new" | "az" | "weak"}
            onChange={setSort}
            options={[
              { value: "new", label: "Recentes" },
              { value: "az", label: "A–Z" },
              { value: "weak", label: "Fracas" },
            ]}
          />
        </div>

        {data.words.length === 0 ? (
          <div className="grid justify-items-center gap-3 rounded-[1.5rem] border-2 border-dashed border-border px-6 py-12 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-sand text-sand-foreground">
              <BookOpenIcon weight="bold" className="size-6" />
            </span>
            <p className="font-display text-xl">Seu caderno está vazio</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Digite uma palavra no painel{aiName ? ` e use “Preencher com ${aiName}” para receber tradução, definição e exemplo` : ""}. Na aba Estudar você também pode juntar as palavras-chave de
              um livro antes de ler.
            </p>
          </div>
        ) : words.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">Nenhuma palavra encontrada.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {words.map((w) => (
              <WordCard key={w.id} word={w} onDelete={() => deleteWord(w.id)} />
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
      <Label htmlFor={id} className="text-xs font-normal text-ink-muted tabular">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function WordCard({ word: w, onDelete, action }: { word: Pick<Word, "w" | "pt" | "en" | "ex" | "pos"> & Partial<Word>; onDelete?: () => void; action?: React.ReactNode }) {
  const book = w.book ? BOOK_BY_ID.get(w.book) : undefined;
  return (
    <article className="grid content-start gap-2 rounded-[1.25rem] border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xl leading-tight font-bold">{w.w}</p>
          {w.pos && <p className="text-xs text-muted-foreground tabular">{w.pos}</p>}
        </div>
        <div className="-mt-1 -mr-1 flex shrink-0">
          <SpeakButton text={w.w} />
          {onDelete && (
            <Button variant="ghost" size="icon-sm" aria-label={`Apagar ${w.w}`} onClick={onDelete} className="text-muted-foreground hover:text-destructive">
              <TrashIcon />
            </Button>
          )}
        </div>
      </div>
      {w.pt && <p className="w-fit rounded-full bg-sand px-3 py-1 text-sm font-medium text-sand-foreground">{w.pt}</p>}
      {w.en && <p className="text-sm text-muted-foreground">{w.en}</p>}
      {w.ex && <p className="border-l-2 border-border pl-3 text-sm italic">“{w.ex}”</p>}
      {(w.box !== undefined || book) && (
        <div className="mt-1 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground tabular">
          {w.box !== undefined && (
            <span className="flex items-center gap-2">
              <MemoryBoxes box={w.box} /> memória {w.box}/6
            </span>
          )}
          {book && <span className="truncate">{book.t}</span>}
        </div>
      )}
      {action}
    </article>
  );
}
