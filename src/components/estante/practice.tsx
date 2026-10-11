"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { ArrowClockwiseIcon, ArrowRightIcon, CheckIcon, CopyIcon, SpeakerHighIcon, SpeakerSimpleLowIcon, XIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { langInfo, type Lang } from "@/lib/books";
import { checkSentence } from "@/lib/ai-client";
import { sentencePrompt } from "@/lib/ai/prompts";
import { today, useEstante, type Word } from "@/lib/store";
import { cn } from "@/lib/utils";
import { DictButton, SpeakButton, copyText, speak } from "./common";

export type PracticeKind = "dictation" | "pairs" | "write";

/** Words for a practice round: today's reviews first, then the weakest, a little shuffled. */
function pickWords(words: Word[], n: number, needPt = false) {
  const t = today();
  const pool = words.filter((w) => !needPt || w.pt);
  const score = (w: Word) => (w.due <= t ? 0 : 10) + w.box + Math.random() * 3;
  return [...pool].sort((a, b) => score(a) - score(b)).slice(0, n);
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFC")
    .replace(/[.,!?;:"“”'’]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Practice outside the spaced repetition: a miss sends the word back to today's reviews; a hit changes nothing. */
export function Practice({ kind, words, lang, aiName, onExit }: { kind: PracticeKind; words: Word[]; lang: Lang; aiName: string; onExit: () => void }) {
  const [round, setRound] = useState(0); // bump to start over with new words
  const n = kind === "pairs" ? 10 : kind === "write" ? 5 : 10;
  const list = useMemo(() => pickWords(words, n, kind !== "dictation"), [words.length, kind, round]); // eslint-disable-line react-hooks/exhaustive-deps -- new words only when a round starts
  const props = { key: `${kind}-${round}`, words: list, lang, onAgain: () => setRound((r) => r + 1), onExit };
  if (kind === "dictation") return <Dictation {...props} />;
  if (kind === "pairs") return <Pairs {...props} />;
  return <Write {...props} aiName={aiName} />;
}

type RoundProps = { words: Word[]; lang: Lang; onAgain: () => void; onExit: () => void };

/* ---------- Ditado: hear the word, type it ---------- */

function Dictation({ words, lang, onAgain, onExit }: RoundProps) {
  const { gradeWord, markDay } = useEstante();
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const [checked, setChecked] = useState<boolean | null>(null);
  const [missed, setMissed] = useState<Word[]>([]);
  const [hint, setHint] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const w = words[i];
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!w) return;
    speak(w.w, lang);
    input.current?.focus();
  }, [w, lang]);

  if (!w) return <Done right={words.length - missed.length} total={words.length} missed={missed} onAgain={onAgain} onExit={onExit} />;

  function check(e: React.FormEvent) {
    e.preventDefault();
    if (checked !== null) return next();
    const ok = normalize(typed) === normalize(w.w);
    setChecked(ok);
    if (!ok) {
      setMissed((m) => [...m, w]);
      gradeWord(w.id, 0);
    }
  }
  function next() {
    if (i + 1 === words.length) markDay();
    setI(i + 1);
    setTyped("");
    setChecked(null);
    setHint(false);
  }

  return (
    <Card step={i} total={words.length} title="Ouça e escreva">
      {!canSpeak && <p className="text-sm text-ink-muted">Este navegador não tem voz. Use a dica para treinar a escrita.</p>}
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => speak(w.w, lang)} className="inline-flex h-12 items-center gap-2 rounded-full bg-sand px-6 text-sm font-bold text-sand-foreground">
          <SpeakerHighIcon weight="bold" className="size-5" /> Ouvir
        </button>
        <button type="button" onClick={() => speak(w.w, lang, 0.55)} className="inline-flex h-12 items-center gap-2 rounded-full border border-ink-border px-5 text-sm hover:bg-white/5">
          <SpeakerSimpleLowIcon weight="bold" className="size-5" /> Devagar
        </button>
      </div>
      {hint || checked !== null ? (
        <p className="text-sm text-ink-muted">significa “{w.pt || w.en || "—"}”</p>
      ) : (
        <button type="button" onClick={() => setHint(true)} className="text-xs text-ink-muted underline underline-offset-4 hover:text-ink-foreground">
          Mostrar a tradução
        </button>
      )}
      <form onSubmit={check} className="flex w-full max-w-sm gap-2">
        <input
          ref={input}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          readOnly={checked !== null}
          placeholder={`escreva em ${langInfo(lang).name.toLowerCase()}`}
          aria-label="O que você ouviu"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="h-11 min-w-0 flex-1 rounded-full border border-ink-border bg-white/5 px-4 text-ink-foreground outline-none placeholder:text-ink-muted focus-visible:border-sand"
        />
        <button type="submit" disabled={checked === null && !typed.trim()} className="h-11 shrink-0 rounded-full bg-sand px-5 text-sm font-bold text-sand-foreground disabled:opacity-40">
          {checked === null ? "Conferir" : "Próxima"}
        </button>
      </form>
      {checked !== null && <Verdict ok={checked} word={w} typed={typed} lang={lang} />}
    </Card>
  );
}

/* ---------- Pares: match each word with its translation ---------- */

const PAIRS_PER_ROUND = 5;

function Pairs({ words, onAgain, onExit }: RoundProps) {
  const { gradeWord, markDay } = useEstante();
  // rounds of 5, each with its translations in a shuffled order, fixed for the whole game
  const [rounds] = useState(() => {
    const out: { words: Word[]; right: Word[] }[] = [];
    for (let i = 0; i < words.length; i += PAIRS_PER_ROUND) {
      const set = words.slice(i, i + PAIRS_PER_ROUND);
      if (set.length >= 2) out.push({ words: set, right: [...set].sort(() => Math.random() - 0.5) });
    }
    return out;
  });
  const [r, setR] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null); // translation that just failed
  const [missed, setMissed] = useState<Word[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const set = rounds[r]?.words;
  const right = rounds[r]?.right ?? [];

  if (!set) return <Done right={words.length - missed.length} total={words.length} missed={missed} note={`${mistakes} ${mistakes === 1 ? "erro" : "erros"} no total.`} onAgain={onAgain} onExit={onExit} />;

  function choose(id: string) {
    if (!picked || matched.includes(id)) return;
    if (id === picked) {
      const done = [...matched, id];
      setMatched(done);
      setPicked(null);
      if (done.length === set.length)
        setTimeout(() => {
          if (r + 1 === rounds.length) markDay();
          setR(r + 1);
          setMatched([]);
        }, 500);
      return;
    }
    setMistakes((m) => m + 1);
    setWrong(id);
    setTimeout(() => setWrong(null), 600);
    const w = set.find((x) => x.id === picked)!;
    if (!missed.some((m) => m.id === w.id)) {
      setMissed((m) => [...m, w]);
      gradeWord(w.id, 0);
    }
  }

  const tile = "flex min-h-14 items-center justify-center rounded-2xl border px-3 py-2 text-center text-sm transition-colors";
  return (
    <Card step={r} total={rounds.length} title="Ligue cada palavra à tradução" unit="rodada">
      <div className="grid w-full grid-cols-2 gap-2 sm:gap-3">
        <div className="grid content-start gap-2">
          {set.map((w) => {
            const done = matched.includes(w.id);
            return (
              <button
                key={w.id}
                disabled={done}
                onClick={() => setPicked(picked === w.id ? null : w.id)}
                aria-pressed={picked === w.id}
                className={cn(tile, "font-bold", done ? "border-transparent bg-[#9cb88f] text-ink opacity-60" : picked === w.id ? "border-sand bg-sand text-sand-foreground" : "border-ink-border hover:bg-white/5")}
              >
                {w.w}
              </button>
            );
          })}
        </div>
        <div className="grid content-start gap-2">
          {right.map((w) => {
            const done = matched.includes(w.id);
            return (
              <button
                key={w.id}
                disabled={done || !picked}
                onClick={() => choose(w.id)}
                className={cn(tile, done ? "border-transparent bg-[#9cb88f] text-ink opacity-60" : wrong === w.id ? "border-[#d07a64] bg-[#d07a64] text-ink" : "border-ink-border hover:bg-white/5 disabled:hover:bg-transparent")}
              >
                {w.pt}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-ink-muted">{picked ? "Agora toque na tradução." : "Toque numa palavra da esquerda."}</p>
    </Card>
  );
}

/* ---------- Escrever: use the word in a sentence of your own ---------- */

function Write({ words, lang, onAgain, onExit, aiName }: RoundProps & { aiName: string }) {
  const { markDay } = useEstante();
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [written, setWritten] = useState(0);
  const w = words[i];

  if (!w) return <Done right={written} total={words.length} missed={[]} note={`${written} ${written === 1 ? "frase escrita" : "frases escritas"}.`} onAgain={onAgain} onExit={onExit} />;

  // the word (or a form of it: "go" in "going") should appear in the sentence
  const stem = normalize(w.w).slice(0, Math.max(3, normalize(w.w).length - 2));
  const usesWord = new RegExp(`(^|[^\\p{L}])${stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "u").test(normalize(text));

  async function check() {
    if (!text.trim()) return;
    setWritten((n) => n + (feedback === null ? 1 : 0));
    if (!aiName) return setFeedback("");
    setBusy(true);
    try {
      setFeedback(await checkSentence(w.w, w.pt, text));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function next() {
    if (i + 1 === words.length) markDay();
    setI(i + 1);
    setText("");
    setFeedback(null);
  }

  return (
    <Card step={i} total={words.length} title="Escreva uma frase com a palavra">
      <div className="grid justify-items-center gap-1">
        <p className="flex items-center gap-3 text-4xl leading-none font-bold tracking-tight sm:text-5xl">
          {w.w}
          <span className="rounded-full bg-white/10 [&_button]:text-ink-foreground [&_button:hover]:bg-white/10">
            <SpeakButton text={w.w} lang={lang} />
          </span>
        </p>
        <p className="text-sm text-ink-muted">{w.pt || w.en}</p>
      </div>
      <textarea
        value={text}
        onChange={(e) => (setText(e.target.value), setFeedback(null))}
        rows={3}
        placeholder={`Uma frase sua em ${langInfo(lang).name.toLowerCase()} usando “${w.w}”`}
        aria-label="Sua frase"
        className="w-full max-w-lg rounded-2xl border border-ink-border bg-white/5 p-4 text-ink-foreground outline-none placeholder:text-ink-muted focus-visible:border-sand"
      />
      {text.trim() && !usesWord && <p className="text-xs text-[#e3a08e]">A frase ainda não usa “{w.w}”.</p>}

      {feedback !== null && (
        <div className="grid w-full max-w-lg gap-2 rounded-2xl bg-white/5 p-4 text-left text-sm">
          {feedback ? (
            <>
              <p className="text-xs text-ink-muted">{aiName} comentou</p>
              <p className="whitespace-pre-line">{feedback}</p>
            </>
          ) : (
            <>
              {w.ex ? (
                <p>
                  <span className="text-xs text-ink-muted">Compare com o exemplo do caderno: </span>
                  <span className="italic">“{w.ex}”</span>
                </p>
              ) : (
                <p className="text-ink-muted">Sem IA ligada, compare com um dicionário ou peça uma correção.</p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={async () => (await copyText(sentencePrompt(w.w, w.pt, text))) && toast.success("Pedido copiado. Cole no claude.ai, Gemini ou outra IA.")}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-ink-border px-3 text-xs hover:bg-white/10"
                >
                  <CopyIcon className="size-3.5" /> Copiar pedido de correção
                </button>
                <span className="rounded-full border border-ink-border [&_a]:text-ink-foreground">
                  <DictButton word={w.w} lang={lang} />
                </span>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {feedback === null ? (
          <button onClick={check} disabled={!text.trim() || busy} className="inline-flex h-10 items-center gap-2 rounded-full bg-sand px-5 text-sm font-bold text-sand-foreground disabled:opacity-40">
            {busy && <Loader2 className="size-4 animate-spin" />}
            {busy ? "Corrigindo…" : aiName ? `Corrigir com ${aiName}` : "Pronto"}
          </button>
        ) : (
          <button onClick={next} className="inline-flex h-10 items-center gap-2 rounded-full bg-sand px-5 text-sm font-bold text-sand-foreground">
            {i + 1 < words.length ? "Próxima palavra" : "Terminar"} <ArrowRightIcon weight="bold" className="size-4" />
          </button>
        )}
        {feedback === null && (
          <button onClick={next} className="h-10 rounded-full border border-ink-border px-4 text-sm hover:bg-white/5">
            Pular
          </button>
        )}
      </div>
    </Card>
  );
}

/* ---------- shared pieces ---------- */

function Card({ step, total, title, unit = "palavra", children }: { step: number; total: number; title: string; unit?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3">
        <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <span className="block h-full rounded-full bg-ink transition-all" style={{ width: `${(step / total) * 100}%` }} />
        </span>
        <span className="text-xs text-muted-foreground tabular">
          {unit} {Math.min(step + 1, total)}/{total}
        </span>
      </div>
      <section className="grid min-h-[22rem] content-center justify-items-center gap-5 rounded-[2rem] bg-ink p-6 text-center text-ink-foreground">
        <p className="text-xs text-ink-muted tabular">{title}</p>
        {children}
      </section>
    </div>
  );
}

function Verdict({ ok, word: w, typed, lang }: { ok: boolean; word: Word; typed: string; lang: Lang }) {
  return (
    <div className="grid justify-items-center gap-1.5">
      <p className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs", ok ? "bg-[#9cb88f] text-ink" : "bg-[#d07a64] text-ink")}>
        {ok ? <CheckIcon weight="bold" className="size-3.5" /> : <XIcon weight="bold" className="size-3.5" />}
        {ok ? "Certo!" : `Você escreveu “${typed || "…"}”`}
      </p>
      <p className="flex items-center gap-1 text-3xl font-bold">
        {w.w}
        <span className="[&_a]:text-ink-muted [&_button]:text-ink-muted">
          <SpeakButton text={w.w} lang={lang} />
        </span>
      </p>
      {w.ex && <p className="max-w-md text-sm text-ink-muted italic">“{w.ex}”</p>}
    </div>
  );
}

function Done({ right, total, missed, note, onAgain, onExit }: { right: number; total: number; missed: Word[]; note?: string; onAgain: () => void; onExit: () => void }) {
  return (
    <section className="grid gap-5 rounded-[2rem] border border-border bg-card p-6 sm:p-8">
      <div className="grid justify-items-center gap-2 text-center">
        <p className="text-6xl leading-none font-extrabold tabular">
          {right}
          <span className="text-3xl font-bold text-muted-foreground">/{total}</span>
        </p>
        <p className="text-sm text-muted-foreground">{note ?? (missed.length ? "Bom treino. As palavras que você errou voltaram para as revisões de hoje." : "Tudo certo. Ótimo treino!")}</p>
      </div>
      {missed.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-2">
          {missed.map((w) => (
            <li key={w.id} className="rounded-full bg-muted px-3 py-1 text-sm">
              <strong>{w.w}</strong> · {w.pt}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={onAgain} className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-ink-foreground">
          <ArrowClockwiseIcon weight="bold" className="size-4" /> Treinar de novo
        </button>
        <button onClick={onExit} className="h-10 rounded-full border border-border px-5 text-sm hover:border-foreground">
          Voltar aos flashcards
        </button>
      </div>
    </section>
  );
}
