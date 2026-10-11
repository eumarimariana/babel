"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckIcon, PlusIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useEstante } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BTN, SectionHead } from "./common";

/** [word, short Portuguese gloss, English definition], most frequent first. */
type Entry = [string, string, string];
const SIZE = 50;

/**
 * Packs of 50 from the New General Service List: about 2,800 words that cover most of any everyday text.
 * The list is loaded only when this section opens (it is ~200 KB).
 */
export function WordPacks({ onGoReview }: { onGoReview: () => void }) {
  const { data, addWords } = useEstante();
  const [list, setList] = useState<Entry[] | null>(null);
  const [all, setAll] = useState(false);

  useEffect(() => {
    let live = true;
    import("@/data/ngsl-en.json").then((m) => live && setList(m.default as Entry[]));
    return () => {
      live = false;
    };
  }, []);

  const known = useMemo(() => new Set(data.words.filter((w) => (w.ln ?? "en") === "en").map((w) => w.w.toLowerCase())), [data.words]);
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
  const shown = all ? packs : packs.slice(Math.max(0, firstOpen), Math.max(0, firstOpen) + 6);
  const done = packs.filter((p) => p.have === p.words.length).length;

  function importPack(words: Entry[], label: string) {
    const added = addWords(words.map(([w, pt, en]) => ({ w, pt, en, ln: "en" as const, book: null })));
    if (!added) return toast.info("Essas palavras já estão no caderno.");
    toast.success(`${added} palavras de ${label} foram para as revisões de hoje.`, { action: { label: "Revisar", onClick: onGoReview } });
  }

  return (
    <section id="word-packs" className="grid scroll-mt-4 gap-3">
      <SectionHead title="Pacotes de palavras" count={list ? `${done}/${packs.length} no caderno` : undefined} action={packs.length > 6 ? (all ? "Só os próximos" : `Ver todos os ${packs.length}`) : undefined} onAction={() => setAll(!all)} />
      <p className="-mt-1 max-w-2xl text-sm text-muted-foreground">
        As palavras mais frequentes do inglês, em pacotes de 50, das mais usadas para as menos. Ao importar, viram flashcards nas Revisões, com tradução e definição. As que já estão no caderno ficam de fora.
      </p>

      {!list ? (
        <p className="rounded-[1.25rem] bg-muted/70 p-5 text-sm text-muted-foreground">Carregando a lista…</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {shown.map((p) => {
            const label = `${p.n * SIZE + 1}–${p.n * SIZE + p.words.length}`;
            const full = p.have === p.words.length;
            return (
              <article key={p.n} className={cn("grid content-start gap-3 rounded-[1.25rem] border bg-card p-4", p.n === firstOpen ? "border-foreground" : "border-border")}>
                <div>
                  <h4 className="font-bold tabular">Palavras {label}</h4>
                  <p className="text-xs text-muted-foreground tabular">
                    {p.have ? `${p.have}/${p.words.length} no caderno` : `${p.words.length} palavras`}
                    {p.n === firstOpen && " · próximo"}
                  </p>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{p.words.map(([w]) => w).join(" · ")}</p>
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
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Lista:{" "}
        <a href="https://www.newgeneralservicelist.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          New General Service List 1.2
        </a>{" "}
        (Browne, Culligan e Phillips), licença CC BY-SA 4.0, com definições em inglês da mesma fonte. As traduções em português foram feitas para o Babel e seguem a mesma licença.
      </p>
    </section>
  );
}
