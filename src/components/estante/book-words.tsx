"use client";

import { useEffect, useState } from "react";
import { ListBulletsIcon } from "@phosphor-icons/react";
import { langOf, type Book } from "@/lib/books";
import { WordListDialog, useImportEntries, useKnownWords, useNgsl, type Entry } from "./word-packs";

const LONG = 120; // above this many frequent words, the list shows only the most frequent ones still missing
const SHOWN = 50;

let cache: Record<string, number[]> | null = null;

/**
 * "Palavras frequentes do livro": which of the 2,809 NGSL words a book uses (from its text, for the books
 * whose text is free: Global Storybooks and Gutenberg), and the ones not yet in the notebook, to learn before reading.
 */
export function BookWords({ book, onGoReview }: { book: Book; onGoReview?: () => void }) {
  const [ranks, setRanks] = useState<number[] | null>(cache ? (cache[book.id] ?? null) : null);
  const [open, setOpen] = useState(false);
  const list = useNgsl();
  const known = useKnownWords();
  const importEntries = useImportEntries(onGoReview);
  const english = langOf(book) === "en";

  useEffect(() => {
    if (!english) return;
    let live = true;
    import("@/data/book-words-en.json").then((m) => {
      cache = m.default as Record<string, number[]>;
      if (live) setRanks(cache[book.id] ?? null);
    });
    return () => {
      live = false;
    };
  }, [book.id, english]);

  if (!english || !ranks?.length || !list) return null;
  const items = ranks.map((r) => ({ rank: r + 1, entry: list[r] as Entry }));
  const missing = items.filter(({ entry: [w] }) => !known.has(w.toLowerCase()));
  const long = items.length > LONG;
  const shown = long ? missing.slice(0, SHOWN) : items;
  const have = items.length - missing.length;

  return (
    <section className="grid gap-2.5">
      <h3 className="text-[10px] font-bold tracking-[0.16em] text-ink-muted uppercase">Palavras frequentes do livro · {items.length}</h3>
      <p className="text-sm text-ink-muted">
        Usa {items.length} das 2.809 palavras mais frequentes do inglês. {have ? `${have} já estão no seu caderno.` : "Nenhuma ainda está no seu caderno."}
        {missing.length > 0 && !long && " Aprender as que faltam antes de ler ajuda bastante."}
      </p>
      {missing.length > 0 && (
        <button onClick={() => setOpen(true)} className="inline-flex h-9 w-fit items-center gap-2 rounded-full border border-ink-border px-4 text-xs font-semibold tracking-wide text-ink-foreground hover:bg-white/5">
          <ListBulletsIcon weight="bold" className="size-4" />
          {long ? `Ver as ${shown.length} mais frequentes que faltam` : `Ver as ${missing.length} que faltam`}
        </button>
      )}
      {open && (
        <WordListDialog
          title={book.t}
          subtitle={long ? `As ${shown.length} palavras mais frequentes deste livro que ainda não estão no caderno` : `As ${items.length} palavras frequentes deste livro, das mais usadas para as menos`}
          items={shown}
          known={known}
          onClose={() => setOpen(false)}
          onImport={(entries) => importEntries(entries, `“${book.t}”`)}
        />
      )}
    </section>
  );
}
