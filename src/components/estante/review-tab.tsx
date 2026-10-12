"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CardsIcon, CheckCircleIcon, EarIcon, LinkSimpleIcon, MicrophoneIcon, PencilLineIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { BOOK_BY_ID } from "@/lib/books";
import { brDate, useEstante } from "@/lib/store";
import { cn } from "@/lib/utils";
import { langInfo } from "@/lib/books";
import { DictButton, EditMeaning, Segmented, SpeakButton, useLang } from "./common";
import { activeProviderName, subscribeAi } from "@/lib/ai-client";
import { Practice, type PracticeKind } from "./practice";

type Mode = "en" | "pt" | "ex"; // ex = the example sentence with the word blanked out

const TRAININGS: { value: "cards" | PracticeKind; label: string; detail: string; icon: typeof CardsIcon; min: number }[] = [
  { value: "cards", label: "Flashcards", detail: "repetição espaçada", icon: CardsIcon, min: 1 },
  { value: "dictation", label: "Ditado", detail: "ouça e escreva", icon: EarIcon, min: 1 },
  { value: "pairs", label: "Pares", detail: "ligue à tradução", icon: LinkSimpleIcon, min: 4 },
  { value: "write", label: "Escrever", detail: "crie uma frase", icon: PencilLineIcon, min: 1 },
  { value: "speak", label: "Falar", detail: "repita e compare", icon: MicrophoneIcon, min: 1 },
];

/** Reviews (spaced repetition) plus three other ways to practise the notebook's words. */
export function ReviewTab({ onGoVocab, onGoPacks }: { onGoVocab: () => void; onGoPacks?: () => void }) {
  const { data } = useEstante();
  const lang = useLang();
  const aiName = useSyncExternalStore(subscribeAi, activeProviderName, () => "");
  const [kind, setKind] = useState<"cards" | PracticeKind>("cards");
  const words = useMemo(() => data.words.filter((w) => (w.ln ?? "en") === lang), [data.words, lang]);
  const withPt = words.filter((w) => w.pt).length;
  const current = TRAININGS.find((t) => t.value === kind)!;
  const enough = (t: (typeof TRAININGS)[number]) => (t.value === "pairs" ? withPt : words.length) >= t.min;

  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      {words.length > 0 && (
        <div role="radiogroup" aria-label="Tipo de treino" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {TRAININGS.map((t) => {
            const on = kind === t.value;
            return (
              <button
                key={t.value}
                role="radio"
                aria-checked={on}
                disabled={!enough(t)}
                title={enough(t) ? undefined : `Precisa de ${t.min} palavras com tradução`}
                onClick={() => setKind(t.value)}
                className={cn(
                  "flex items-center gap-3 rounded-[1.25rem] border p-3 text-left transition-colors disabled:opacity-40 sm:flex-col sm:items-start sm:gap-2",
                  on ? "border-ink bg-ink text-ink-foreground" : "border-border bg-card hover:border-foreground",
                )}
              >
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", on ? "bg-sand text-sand-foreground" : "bg-muted")}>
                  <t.icon weight="bold" className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{t.label}</span>
                  <span className={cn("block text-xs", on ? "text-ink-muted" : "text-muted-foreground")}>{t.detail}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      {kind === "cards" || !enough(current) ? (
        <Flashcards onGoVocab={onGoVocab} onGoPacks={onGoPacks} />
      ) : (
        <Practice key={`${kind}-${lang}`} kind={kind} words={words} lang={lang} aiName={aiName} onExit={() => setKind("cards")} />
      )}
    </div>
  );
}

function Flashcards({ onGoVocab, onGoPacks }: { onGoVocab: () => void; onGoPacks?: () => void }) {
  const { data: all, due: allDue, gradeWord } = useEstante();
  const lang = useLang();
  const name = langInfo(lang).name.toLowerCase();
  // reviews only cover the language being studied
  const words = all.words.filter((w) => (w.ln ?? "en") === lang);
  const due = allDue.filter((w) => (w.ln ?? "en") === lang);
  const data = { ...all, words };
  const [mode, setMode] = useState<Mode>("en");
  const [queue, setQueue] = useState<string[]>(() => shuffleIds(due.map((w) => w.id)));
  const [total, setTotal] = useState(queue.length);
  const [shown, setShown] = useState(false);
  const [typed, setTyped] = useState("");
  const [doneCount, setDoneCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = useMemo(() => all.words.find((w) => w.id === queue[0]), [all.words, queue]);

  function grade(g: 0 | 1 | 2) {
    if (!current) return;
    gradeWord(current.id, g);
    setDoneCount((n) => n + 1);
    setQueue((q) => (g === 0 ? [...q.slice(1), q[0]] : q.slice(1)));
    if (g === 0) setTotal((t) => t + 1);
    setShown(false);
    setTyped("");
    setEditing(false);
  }

  function restartAll() {
    const ids = shuffleIds(data.words.map((w) => w.id));
    setQueue(ids);
    setTotal(ids.length);
    setDoneCount(0);
    setShown(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || !current) return;
      if (!shown && mode !== "pt" && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setShown(true);
      } else if (shown && ["1", "2", "3"].includes(e.key)) grade((Number(e.key) - 1) as 0 | 1 | 2);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (mode === "pt" && !shown) inputRef.current?.focus();
  }, [mode, shown, current?.id]);

  if (data.words.length === 0)
    return (
      <EmptyCard
        title="Nada para revisar ainda"
        text="As palavras que você salvar no caderno viram flashcards aqui. Cada acerto empurra a próxima revisão para mais longe (1, 2, 4, 8, 16 e 32 dias). Cada erro traz a palavra de volta para hoje."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={onGoVocab} className="h-10 rounded-full bg-sand px-5 text-sm font-bold text-sand-foreground">
              Ir para o caderno
            </button>
            {onGoPacks && (
              <button onClick={onGoPacks} className="h-10 rounded-full border border-ink-border px-5 text-sm font-medium hover:bg-white/5">
                Importar palavras frequentes
              </button>
            )}
          </div>
        }
      />
    );

  if (!current) {
    const next = data.words.map((w) => w.due).sort()[0];
    return (
      <EmptyCard
        icon={<CheckCircleIcon weight="bold" className="size-7" />}
        title={doneCount ? `${doneCount} revisões feitas. Tudo em dia!` : "Tudo em dia!"}
        text={next ? `Próxima revisão em ${brDate(next)}.` : ""}
        action={
          <button onClick={restartAll} className="h-10 rounded-full border border-ink-border px-5 text-sm font-medium hover:bg-white/5">
            Revisar todas mesmo assim
          </button>
        }
      />
    );
  }

  const book = current.book ? BOOK_BY_ID.get(current.book) : undefined;
  const cloze = mode === "ex" ? blankOut(current.ex, current.w) : null;
  const right = typed.trim().toLowerCase() === current.w.toLowerCase();

  const left = Math.max(0, total - doneCount);
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-3 gap-3">
        <Figure value={Math.min(doneCount, total)} label="feitas" />
        <Figure value={left} label="na fila" />
        <Figure value={due.length} label="pendentes hoje" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          id="review-mode"
          label="Modo de revisão"
          value={mode}
          onChange={(v) => (setMode(v), setShown(false))}
          options={[
            { value: "en", label: `${langInfo(lang).name} → PT` },
            { value: "pt", label: `PT → ${name}` },
            { value: "ex", label: "Frase" },
          ]}
        />
        <div className="flex min-w-[10rem] flex-1 items-center gap-3 sm:max-w-xs">
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-ink transition-all" style={{ width: `${total ? (Math.min(doneCount, total) / total) * 100 : 0}%` }} />
          </span>
          <span className="text-xs text-muted-foreground tabular">
            {Math.min(doneCount, total)}/{total}
          </span>
        </div>
      </div>

      <div className="[perspective:1400px]">
        <div className={cn("relative min-h-[22rem] transition-transform duration-500 [transform-style:preserve-3d]", shown && mode !== "pt" && "[transform:rotateY(180deg)]")}>
          {/* front: graphite */}
          <div className="absolute inset-0 grid content-center justify-items-center gap-4 rounded-[2rem] bg-ink p-6 text-center text-ink-foreground [backface-visibility:hidden]">
            <p className="text-xs text-ink-muted tabular">{mode === "pt" ? `Como se diz em ${name}?` : cloze ? "Qual palavra completa a frase?" : (book?.t ?? "Caderno")}</p>
            {mode !== "pt" ? (
              <>
                {cloze ? (
                  <>
                    <p className="max-w-xl text-2xl leading-snug font-bold sm:text-3xl">{cloze}</p>
                    <p className="text-xs text-ink-muted">começa com “{current.w[0]}”</p>
                  </>
                ) : (
                  <>
                    <p className="text-5xl leading-none font-bold tracking-tight sm:text-6xl">{current.w}</p>
                    {current.pos && <p className="text-xs text-ink-muted tabular">{current.pos}</p>}
                    {mode === "ex" && <p className="text-xs text-ink-muted">esta palavra não tem frase de exemplo no caderno</p>}
                  </>
                )}
                <div className="flex items-center gap-2 pt-3">
                  <span className="rounded-full bg-white/10 text-ink-foreground [&_button]:text-ink-foreground [&_button:hover]:bg-white/10">
                    <SpeakButton text={current.w} />
                  </span>
                  <button onClick={() => setShown(true)} className="h-10 rounded-full bg-sand px-5 text-sm font-bold text-sand-foreground transition-transform hover:scale-[1.03]">
                    Mostrar resposta
                  </button>
                </div>
                <p className="text-xs text-ink-muted tabular">espaço vira · 1 errei · 2 difícil · 3 acertei</p>
              </>
            ) : (
              <>
                <p className="text-4xl leading-tight font-bold tracking-tight sm:text-5xl">{current.pt || current.en || "—"}</p>
                {current.en && current.pt && <p className="text-sm text-ink-muted">{current.en}</p>}
                {!shown ? (
                  <form
                    className="flex w-full max-w-sm gap-2 pt-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setShown(true);
                    }}
                  >
                    <Input
                      ref={inputRef}
                      id="typed"
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      placeholder={`digite em ${name}`}
                      aria-label="Sua resposta"
                      autoComplete="off"
                      className="h-11 border-ink-border bg-white/5 text-ink-foreground placeholder:text-ink-muted dark:bg-white/5"
                    />
                    <button type="submit" className="h-11 shrink-0 rounded-full bg-sand px-5 text-sm font-bold text-sand-foreground">
                      Conferir
                    </button>
                  </form>
                ) : (
                  <div className="grid justify-items-center gap-2 pt-2">
                    <p className={cn("rounded-full px-3 py-1 text-xs", right ? "bg-[#9cb88f] text-ink" : "bg-[#d07a64] text-ink")}>{right ? "Certo!" : `Você escreveu “${typed || "…"}”`}</p>
                    <p className="flex items-center gap-1 text-3xl font-bold">
                      {current.w}
                      <DictButton word={current.w} lang={current.ln} className="text-ink-muted hover:bg-white/10 hover:text-ink-foreground" />
                    </p>
                    {current.ex && <p className="max-w-md text-sm text-ink-muted italic">“{current.ex}”</p>}
                    <Grade onGrade={grade} />
                  </div>
                )}
              </>
            )}
          </div>
          {/* back (flip modes): sand */}
          {mode !== "pt" && (
            <div className="absolute inset-0 grid content-center justify-items-center gap-3 rounded-[2rem] bg-sand p-6 text-center text-sand-foreground [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <p className="flex items-center gap-0.5 text-xs text-[#6b6863] tabular">
                {current.w}
                <DictButton word={current.w} lang={current.ln} className="size-6 text-[#6b6863] hover:bg-[#1c1d1f]/10 hover:text-sand-foreground" />
              </p>
              {editing ? (
                <EditMeaning id={current.id} pt={current.pt} en={current.en} onDone={() => setEditing(false)} />
              ) : (
                <>
                  <p className="text-4xl leading-tight font-bold tracking-tight">{current.pt || "—"}</p>
                  {current.en && <p className="max-w-md text-[#45474b]">{current.en}</p>}
                  <button onClick={() => setEditing(true)} className="text-xs text-[#6b6863] underline underline-offset-4 hover:text-sand-foreground">
                    Corrigir tradução
                  </button>
                </>
              )}
              {current.ex && <p className="max-w-md border-l-2 border-[#1c1d1f]/20 pl-3 text-left text-sm italic">“{current.ex}”</p>}
              {shown && <Grade onGrade={grade} light />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[1.25rem] border border-border bg-card p-4">
      <p className="text-3xl leading-none font-bold tabular">{value}</p>
      <p className="mt-1.5 text-xs text-muted-foreground tabular">{label}</p>
    </div>
  );
}

function Grade({ onGrade, light }: { onGrade: (g: 0 | 1 | 2) => void; light?: boolean }) {
  const base = "h-10 rounded-full px-5 text-sm font-bold transition-transform hover:scale-[1.03]";
  return (
    <div className="flex flex-wrap justify-center gap-2 pt-3">
      <button onClick={() => onGrade(0)} className={cn(base, "border", light ? "border-[#1c1d1f]/25" : "border-ink-border")}>
        Errei
      </button>
      <button onClick={() => onGrade(1)} className={cn(base, light ? "bg-[#1c1d1f]/10" : "bg-white/10")}>
        Difícil
      </button>
      <button onClick={() => onGrade(2)} className={cn(base, light ? "bg-ink text-ink-foreground" : "bg-sand text-sand-foreground")}>
        Acertei
      </button>
    </div>
  );
}

function EmptyCard({ title, text, action, icon }: { title: string; text: string; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-xl justify-items-center gap-3 rounded-[2rem] bg-ink px-6 py-12 text-center text-ink-foreground">
      <span className="grid size-14 place-items-center rounded-full bg-sand text-sand-foreground">{icon ?? <CardsIcon weight="bold" className="size-7" />}</span>
      <p className="font-display text-2xl">{title}</p>
      {text && <p className="max-w-md text-sm leading-relaxed text-ink-muted">{text}</p>}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

function shuffleIds(ids: string[]) {
  const a = [...ids];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The example sentence with the word (or a form of it: "go" in "going") replaced by a blank, or null. */
function blankOut(ex: string, word: string) {
  if (!ex) return null;
  const stem = word.toLowerCase().slice(0, Math.max(3, word.length - 2)).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^\\p{L}])(${stem}\\p{L}*)`, "iu");
  return re.test(ex) ? ex.replace(re, "$1_____") : null;
}
