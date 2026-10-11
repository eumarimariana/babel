"use client";

import { useEffect, useMemo, useState } from "react";
import { CaretRightIcon, CheckIcon, PlusIcon } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useEstante } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BTN, DictButton, ScrollRow, SpeakButton } from "./common";

/** [word, short Portuguese gloss, English definition], most frequent first. */
export type Entry = [string, string, string];
const SIZE = 50;

let ngslCache: Entry[] | null = null;
/** The NGSL list (~200 KB), loaded the first time a component asks for it. */
export function useNgsl() {
  const [list, setList] = useState<Entry[] | null>(ngslCache);
  useEffect(() => {
    if (ngslCache) return;
    let live = true;
    import("@/data/ngsl-en.json").then((m) => {
      ngslCache = m.default as Entry[];
      if (live) setList(ngslCache);
    });
    return () => {
      live = false;
    };
  }, []);
  return list;
}

/** English words already in the notebook, lower-cased. */
export function useKnownWords() {
  const { data } = useEstante();
  return useMemo(() => new Set(data.words.filter((w) => (w.ln ?? "en") === "en").map((w) => w.w.toLowerCase())), [data.words]);
}

/** Adds entries to the notebook (and so to today's reviews), with a toast that says how many. */
export function useImportEntries(onGoReview?: () => void) {
  const { addWords } = useEstante();
  return (entries: Entry[], label: string) => {
    const added = addWords(entries.map(([w, pt, en]) => ({ w, pt, en, ln: "en" as const, book: null })));
    if (!added) return toast.info("Essas palavras já estão no caderno.");
    toast.success(`${added} palavras de ${label} foram para as revisões de hoje.`, onGoReview ? { action: { label: "Revisar", onClick: onGoReview } } : undefined);
  };
}

/**
 * Packs of 50 from the New General Service List: about 2,800 words that cover most of any everyday text.
 * The list is loaded only when this section opens (it is ~200 KB).
 */
export function WordPacks({ onGoReview }: { onGoReview: () => void }) {
  const list = useNgsl();
  const known = useKnownWords();
  const importPack = useImportEntries(onGoReview);
  const [viewing, setViewing] = useState<number | null>(null); // pack open in the word list

  const packs = useMemo(() => {
    if (!list) return [];
    const out: { n: number; words: Entry[]; have: number }[] = [];
    for (let i = 0; i < list.length; i += SIZE) {
      const words = list.slice(i, i + SIZE);
      out.push({ n: i / SIZE, words, have: words.filter(([w]) => known.has(w.toLowerCase())).length });
    }
    return out;
  }, [list, known]);

  const firstOpen = packs.findIndex((p) => p.have < p.words.length);
  const done = packs.filter((p) => p.have === p.words.length).length;


  return (
    <section id="word-packs" className="grid scroll-mt-4 gap-3">
      {!list ? (
        <p className="rounded-[1.25rem] bg-muted/70 p-5 text-sm text-muted-foreground">Carregando a lista…</p>
      ) : (
        <ScrollRow section title="Pacotes de palavras" count={packs.length} meta={`${done}/${packs.length} no caderno · 50 palavras cada`} startAt={Math.max(0, firstOpen)}>
          {packs.map((p) => {
            const label = `${p.n * SIZE + 1}–${p.n * SIZE + p.words.length}`;
            const full = p.have === p.words.length;
            return (
              <article key={p.n} className={cn("flex h-full flex-col gap-3 rounded-[1.25rem] border bg-card p-4", p.n === firstOpen ? "border-foreground" : "border-border")}>
                <button onClick={() => setViewing(p.n)} aria-label={`Ver as palavras ${label}`} className="group grid gap-3 text-left">
                  <span className="flex items-start justify-between gap-2">
                    <span>
                      <span className="block font-bold tabular">Palavras {label}</span>
                      <span className="block text-xs text-muted-foreground tabular">
                        {p.have ? `${p.have}/${p.words.length} no caderno` : `${p.words.length} palavras`}
                        {p.n === firstOpen && " · próximo"}
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-xs text-muted-foreground group-hover:text-foreground">
                      Ver palavras <CaretRightIcon weight="bold" className="size-3" />
                    </span>
                  </span>
                  <span className="line-clamp-2 text-sm text-muted-foreground group-hover:text-foreground">{p.words.map(([w]) => w).join(" · ")}</span>
                </button>
                <div className="mt-auto border-t border-border pt-3">
                  {full ? (
                    <p className="inline-flex h-8 items-center gap-1.5 text-[13px] text-muted-foreground">
                      <CheckIcon weight="bold" className="size-3.5" /> No caderno
                    </p>
                  ) : (
                    <button onClick={() => importPack(p.words, label)} className={BTN}>
                      <PlusIcon weight="bold" className="size-3.5" />
                      {p.have ? `Importar as ${p.words.length - p.have} que faltam` : "Importar para as Revisões"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </ScrollRow>
      )}
      {list && viewing != null && packs[viewing] && (
        <WordListDialog
          title={`Palavras ${viewing * SIZE + 1}–${viewing * SIZE + packs[viewing].words.length}`}
          subtitle={`Pacote ${viewing + 1} · ${packs[viewing].have ? `${packs[viewing].have}/${packs[viewing].words.length} já no caderno` : `${packs[viewing].words.length} palavras, das mais usadas para as menos`}`}
          items={packs[viewing].words.map((e, i) => ({ rank: viewing * SIZE + i + 1, entry: e }))}
          known={known}
          onClose={() => setViewing(null)}
          onImport={(entries) => importPack(entries, `${viewing * SIZE + 1}–${viewing * SIZE + packs[viewing].words.length}`)}
        />
      )}
      <p className="text-xs text-muted-foreground">
        As palavras mais frequentes do inglês, das mais usadas para as menos. Ao importar, viram flashcards nas Revisões, com tradução e definição; as que já estão no caderno ficam de fora. Lista:{" "}
        <a href="https://www.newgeneralservicelist.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          New General Service List 1.2
        </a>{" "}
        (Browne, Culligan e Phillips), licença CC BY-SA 4.0, com definições em inglês da mesma fonte. As traduções em português foram feitas para o Babel e seguem a mesma licença.
      </p>
    </section>
  );
}

/** A list of frequent words (a pack, or the ones a book uses), with translation, definition, sound and the dictionary. */
export function WordListDialog({ title, subtitle, items, known, onClose, onImport }: { title: string; subtitle: string; items: { rank: number; entry: Entry }[]; known: Set<string>; onClose: () => void; onImport: (entries: Entry[]) => void }) {
  const missing = items.filter(({ entry: [w] }) => !known.has(w.toLowerCase())).length;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[min(44rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden rounded-[1.75rem] p-0 sm:max-w-xl">
        <div className="grid gap-1 border-b border-border p-5 pr-12">
          <DialogTitle className="font-display text-xl tabular">{title}</DialogTitle>
          <DialogDescription className="text-xs tabular">{subtitle}</DialogDescription>
        </div>
        <ol className="min-h-0 flex-1 divide-y divide-border overflow-y-auto overscroll-contain px-5">
          {items.map(({ rank, entry: [w, pt, en] }) => {
            const has = known.has(w.toLowerCase());
            return (
              <li key={w} className="flex items-start gap-3 py-3">
                <span className="w-9 shrink-0 pt-0.5 text-right text-xs text-muted-foreground tabular">{rank}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-bold">{w}</span>
                    <span className="text-sm">{pt}</span>
                    {has && (
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
                        <CheckIcon weight="bold" className="size-3" /> no caderno
                      </span>
                    )}
                  </p>
                  {en && <p className="text-xs text-muted-foreground">{en}</p>}
                </div>
                <div className="-my-1 flex shrink-0">
                  <SpeakButton text={w} lang="en" />
                  <DictButton word={w} lang="en" />
                </div>
              </li>
            );
          })}
        </ol>
        <div className="flex items-center justify-between gap-3 border-t border-border p-4">
          <p className="min-w-0 text-xs text-muted-foreground">{missing ? `${missing} ${missing === 1 ? "palavra nova" : "palavras novas"} para as Revisões` : "Todas já estão no caderno."}</p>
          {missing > 0 && (
            <button onClick={() => (onImport(items.map((x) => x.entry)), onClose())} className={cn(BTN, "shrink-0 whitespace-nowrap")}>
              <PlusIcon weight="bold" className="size-3.5" />
              Importar as {missing}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
