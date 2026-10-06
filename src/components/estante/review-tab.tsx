"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CardsIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { BOOK_BY_ID } from "@/lib/books";
import { brDate, useEstante } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Segmented, SpeakButton } from "./common";

type Mode = "en" | "pt";

export function ReviewTab({ onGoVocab }: { onGoVocab: () => void }) {
  const { data, due, gradeWord } = useEstante();
  const [mode, setMode] = useState<Mode>("en");
  const [queue, setQueue] = useState<string[]>(() => shuffleIds(due.map((w) => w.id)));
  const [total, setTotal] = useState(queue.length);
  const [shown, setShown] = useState(false);
  const [typed, setTyped] = useState("");
  const [doneCount, setDoneCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = useMemo(() => data.words.find((w) => w.id === queue[0]), [data.words, queue]);

  function grade(g: 0 | 1 | 2) {
    if (!current) return;
    gradeWord(current.id, g);
    setDoneCount((n) => n + 1);
    setQueue((q) => (g === 0 ? [...q.slice(1), q[0]] : q.slice(1)));
    if (g === 0) setTotal((t) => t + 1);
    setShown(false);
    setTyped("");
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
      if (!shown && mode === "en" && (e.key === " " || e.key === "Enter")) {
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
          <button onClick={onGoVocab} className="h-10 rounded-full bg-sand px-5 text-sm font-bold text-sand-foreground">
            Ir para o caderno
          </button>
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
  const right = typed.trim().toLowerCase() === current.w.toLowerCase();

  const left = Math.max(0, total - doneCount);
  return (
    <div className="mx-auto grid max-w-3xl gap-5">
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
            { value: "en", label: "Inglês → PT" },
            { value: "pt", label: "PT → inglês" },
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
        <div className={cn("relative min-h-[22rem] transition-transform duration-500 [transform-style:preserve-3d]", shown && mode === "en" && "[transform:rotateY(180deg)]")}>
          {/* front: graphite */}
          <div className="absolute inset-0 grid content-center justify-items-center gap-4 rounded-[2rem] bg-ink p-6 text-center text-ink-foreground [backface-visibility:hidden]">
            <p className="text-xs text-ink-muted tabular">{mode === "en" ? (book?.t ?? "Caderno") : "Como se diz em inglês?"}</p>
            {mode === "en" ? (
              <>
                <p className="text-5xl leading-none font-bold tracking-tight sm:text-6xl">{current.w}</p>
                {current.pos && <p className="text-xs text-ink-muted tabular">{current.pos}</p>}
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
                      placeholder="digite em inglês"
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
                    <p className="text-3xl font-bold">{current.w}</p>
                    {current.ex && <p className="max-w-md text-sm text-ink-muted italic">“{current.ex}”</p>}
                    <Grade onGrade={grade} />
                  </div>
                )}
              </>
            )}
          </div>
          {/* back (EN mode): sand */}
          {mode === "en" && (
            <div className="absolute inset-0 grid content-center justify-items-center gap-3 rounded-[2rem] bg-sand p-6 text-center text-sand-foreground [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <p className="text-xs text-[#6b6863] tabular">{current.w}</p>
              <p className="text-4xl leading-tight font-bold tracking-tight">{current.pt || "—"}</p>
              {current.en && <p className="max-w-md text-[#45474b]">{current.en}</p>}
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
