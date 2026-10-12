"use client";

import { useState } from "react";
import { ArrowsLeftRightIcon, ChatsCircleIcon, CheckIcon, EarIcon, SpeakerHighIcon, XIcon } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import packs from "@/data/br-packs-en.json";
import { cn } from "@/lib/utils";
import { SectionHead, speak } from "./common";
import { WordListDialog, useImportEntries, useKnownWords, type Entry } from "./word-packs";

type WordPack = { title: string; detail: string; words: Entry[] };
type Group = { title: string; tip: string; pairs: [string, string][] };
const LISTS: { id: string; pack: WordPack; icon: typeof EarIcon }[] = [
  { id: "falsos-cognatos", pack: packs["falsos-cognatos"] as WordPack, icon: ArrowsLeftRightIcon },
  { id: "phrasal-verbs", pack: packs["phrasal-verbs"] as WordPack, icon: ChatsCircleIcon },
];
const GROUPS = packs.pronuncia.groups as Group[];
const PAIRS = GROUPS.reduce((n, g) => n + g.pairs.length, 0);

/** Packs made for Portuguese speakers: false friends, everyday phrasal verbs and the sounds Brazilians mix up. */
export function BrazilPacks({ onGoReview }: { onGoReview: () => void }) {
  const known = useKnownWords();
  const importEntries = useImportEntries(onGoReview);
  const [open, setOpen] = useState<string | null>(null);
  const list = LISTS.find((l) => l.id === open);

  const card = "flex h-full flex-col gap-3 rounded-[1.25rem] border border-border bg-card p-4 text-left transition-colors hover:border-foreground";
  return (
    <section className="grid gap-3">
      <SectionHead title="Feito para brasileiros" />
      <div className="grid gap-3 md:grid-cols-3">
        {LISTS.map(({ id, pack, icon: Icon }) => {
          const have = pack.words.filter(([w]) => known.has(w.toLowerCase())).length;
          return (
            <button key={id} onClick={() => setOpen(id)} className={card}>
              <span className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-sand-foreground">
                  <Icon weight="bold" className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold">{pack.title}</span>
                  <span className="block text-xs text-muted-foreground tabular">
                    {pack.words.length} palavras{have ? ` · ${have} no caderno` : ""}
                  </span>
                </span>
              </span>
              <span className="text-sm text-muted-foreground">{pack.detail}</span>
              <span className="line-clamp-1 text-sm">{pack.words.slice(0, 6).map(([w]) => w).join(" · ")}</span>
            </button>
          );
        })}
        <button onClick={() => setOpen("pronuncia")} className={card}>
          <span className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-sand-foreground">
              <EarIcon weight="bold" className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-bold">{packs.pronuncia.title}</span>
              <span className="block text-xs text-muted-foreground tabular">{PAIRS} pares para ouvir e testar</span>
            </span>
          </span>
          <span className="text-sm text-muted-foreground">{packs.pronuncia.detail}</span>
          <span className="line-clamp-1 text-sm">ship × sheep · think × sink · red × head · worked × played</span>
        </button>
      </div>

      {list && (
        <WordListDialog
          title={list.pack.title}
          subtitle={list.pack.detail}
          items={list.pack.words.map((e, i) => ({ rank: i + 1, entry: e }))}
          known={known}
          onClose={() => setOpen(null)}
          onImport={(entries) => importEntries(entries, `“${list.pack.title}”`)}
        />
      )}
      {open === "pronuncia" && <PronunciationDialog onClose={() => setOpen(null)} />}
    </section>
  );
}

/** Listen to each pair, then test the ear: the app says one word of the pair and you pick which. */
function PronunciationDialog({ onClose }: { onClose: () => void }) {
  const [testing, setTesting] = useState(false);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[min(44rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden rounded-[1.75rem] p-0 sm:max-w-xl">
        <div className="grid gap-1 border-b border-border p-5 pr-12">
          <DialogTitle className="font-display text-xl">Pronúncia difícil</DialogTitle>
          <DialogDescription className="text-xs">Toque para ouvir cada palavra. Depois faça o teste: o app fala uma do par e você diz qual ouviu.</DialogDescription>
          <div className="mt-2 flex gap-2">
            {[false, true].map((t) => (
              <button
                key={String(t)}
                onClick={() => setTesting(t)}
                aria-pressed={testing === t}
                className={cn("h-8 rounded-full border px-3.5 text-xs", testing === t ? "border-ink bg-ink font-semibold text-ink-foreground" : "border-border hover:border-foreground")}
              >
                {t ? "Teste: qual você ouviu?" : "Ouvir os pares"}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5">{testing ? <EarTest /> : <PairList />}</div>
      </DialogContent>
    </Dialog>
  );
}

function PairList() {
  return (
    <div className="grid gap-5">
      {GROUPS.map((g) => (
        <section key={g.title} className="grid gap-2">
          <h3 className="text-sm font-bold">{g.title}</h3>
          <p className="text-xs text-muted-foreground">{g.tip}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {g.pairs.map(([a, b]) => (
              <div key={a + b} className="flex items-center gap-2 rounded-2xl bg-muted/60 p-2">
                {[a, b].map((w, k) => (
                  <button key={w} onClick={() => speak(w, "en")} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-card text-sm font-semibold ring-1 ring-border hover:ring-foreground">
                    <SpeakerHighIcon className="size-4 text-muted-foreground" /> {w}
                    {k === 0 && <span className="sr-only">ou</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const ROUNDS = 10;

function EarTest() {
  // fixed for the whole test: which pair and which word of it
  const [questions] = useState(() => {
    const all = GROUPS.flatMap((g) => g.pairs.map((pair) => ({ pair, group: g.title })));
    return [...all]
      .sort(() => Math.random() - 0.5)
      .slice(0, ROUNDS)
      .map((q) => ({ ...q, said: q.pair[Math.random() < 0.5 ? 0 : 1] }));
  });
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [right, setRight] = useState(0);
  const q = questions[i];

  if (!q)
    return (
      <div className="grid justify-items-center gap-3 py-6 text-center">
        <p className="text-5xl font-extrabold tabular">
          {right}
          <span className="text-2xl text-muted-foreground">/{questions.length}</span>
        </p>
        <p className="text-sm text-muted-foreground">{right === questions.length ? "Ouvido afiado!" : "Volte aos pares que errou e ouça com calma."}</p>
        <button onClick={() => (setI(0), setRight(0), setAnswer(null))} className="h-9 rounded-full bg-ink px-4 text-sm font-semibold text-ink-foreground">
          Fazer de novo
        </button>
      </div>
    );

  return (
    <div className="grid justify-items-center gap-4 py-2 text-center">
      <p className="text-xs text-muted-foreground tabular">
        {i + 1}/{questions.length} · {q.group}
      </p>
      <button onClick={() => speak(q.said, "en")} className="inline-flex h-14 items-center gap-2 rounded-full bg-sand px-7 text-base font-bold text-sand-foreground">
        <SpeakerHighIcon weight="bold" className="size-6" /> Ouvir
      </button>
      <div className="grid w-full max-w-sm grid-cols-2 gap-2">
        {q.pair.map((w) => {
          const chosen = answer === w;
          const correct = answer !== null && w === q.said;
          return (
            <button
              key={w}
              disabled={answer !== null}
              onClick={() => {
                setAnswer(w);
                if (w === q.said) setRight((n) => n + 1);
              }}
              className={cn(
                "inline-flex h-12 items-center justify-center gap-1.5 rounded-2xl border text-lg font-bold",
                answer === null && "border-border hover:border-foreground",
                correct && "border-[#9cb88f] bg-[#9cb88f] text-ink",
                chosen && !correct && "border-[#d07a64] bg-[#d07a64] text-ink",
                answer !== null && !chosen && !correct && "opacity-50",
              )}
            >
              {correct && <CheckIcon weight="bold" className="size-4" />}
              {chosen && !correct && <XIcon weight="bold" className="size-4" />}
              {w}
            </button>
          );
        })}
      </div>
      {answer !== null && (
        <button onClick={() => (setI(i + 1), setAnswer(null))} className="h-9 rounded-full bg-ink px-5 text-sm font-semibold text-ink-foreground">
          {i + 1 < questions.length ? "Próximo" : "Ver resultado"}
        </button>
      )}
    </div>
  );
}
