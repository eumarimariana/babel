"use client";

import { useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { ArrowClockwiseIcon, ArrowRightIcon, ArrowSquareOutIcon, CheckIcon, CopyIcon, ExamIcon, ListChecksIcon, NotePencilIcon, XIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { BOOK_BY_ID, BOOKS, grammarFor, langInfo, langOf } from "@/lib/books";
import { brDate, today, useEstante, type QuizQuestion, type Word } from "@/lib/store";
import { makeQuiz } from "@/lib/ai-client";
import { topicsIn, videoLessons } from "@/lib/resources";
import { quizPrompt } from "@/lib/ai/prompts";
import { cn } from "@/lib/utils";
import { BookCover, SimpleSelect, copyText, useBookOptions, useLang } from "./common";

const KIND_LABEL: Record<QuizQuestion["kind"], string> = {
  story: "História",
  vocab: "Vocabulário",
  grammar: "Gramática",
  meaning: "O que significa",
  say: "Como se diz",
  cloze: "Complete a frase",
};

export type Run = { key: string; title: string; questions: QuizQuestion[] };

export function QuizTab({ aiName, bookId, onBookChange, onGoVocab }: { aiName: string; bookId: number; onBookChange: (id: number) => void; onGoVocab: () => void }) {
  const { data, saveQuiz } = useEstante();
  const lang = useLang();
  const options = useBookOptions(false);
  const book = BOOK_BY_ID.get(bookId) ?? BOOKS[0];
  const [run, setRun] = useState<Run | null>(null);
  const [busy, setBusy] = useState(false);
  const ctl = useRef<AbortController | null>(null);

  const langWords = useMemo(() => data.words.filter((w) => (w.ln ?? "en") === lang), [data.words, lang]);
  const bookWords = langWords.filter((w) => w.book === book.id);
  const saved = data.quizzes[book.id];
  const bookScore = data.scores[String(book.id)];
  const wordsKey = `words-${lang}`;
  const wordsScore = data.scores[wordsKey];
  const canWordsQuiz = langWords.filter((w) => w.pt).length >= 4;

  async function generate() {
    ctl.current?.abort();
    ctl.current = new AbortController();
    setBusy(true);
    try {
      const r = await makeQuiz(
        book,
        bookWords.map((w) => w.w),
        grammarFor(langOf(book), book.lv),
        ctl.current.signal,
      );
      const quiz = { questions: r.questions.map((q) => ({ ...q, kind: q.kind as QuizQuestion["kind"] })), at: today() };
      saveQuiz(book.id, quiz);
      setRun({ key: String(book.id), title: book.t, questions: shuffle(quiz.questions) });
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function startWords() {
    const qs = wordsQuiz(langWords, bookWords, langInfo(lang).name.toLowerCase());
    if (qs.length < 4) return toast.error("Anote pelo menos 4 palavras com tradução para fazer este quiz.");
    setRun({ key: wordsKey, title: bookWords.length >= 2 ? `Suas palavras de ${book.t}` : `Suas palavras em ${langInfo(lang).name.toLowerCase()}`, questions: qs });
  }

  return (
    <div className="grid gap-5">
      {/* book + quiz modes */}
      <section className="grid gap-5 overflow-hidden rounded-[1.75rem] bg-ink p-5 text-ink-foreground sm:grid-cols-[auto_minmax(0,1fr)] sm:p-7">
        <div className="w-24 justify-self-center sm:w-28">
          <BookCover book={book} className="-rotate-2 rounded-lg ring-0 shadow-[0_14px_30px_-10px_rgb(0_0_0/0.6)]" />
        </div>
        <div className="grid min-w-0 content-start gap-4">
          <label className="flex max-w-md items-center gap-2">
            <span className="shrink-0 text-xs text-ink-muted">Livro</span>
            <SimpleSelect
              label="Livro do quiz"
              value={String(book.id)}
              onChange={(v) => (onBookChange(Number(v)), setRun(null))}
              options={options}
              className="h-9 w-full border-ink-border bg-white/5 text-ink-foreground hover:bg-white/10 dark:bg-white/5 [&_svg]:text-ink-muted"
            />
          </label>
          <h2 className="font-display text-3xl leading-tight sm:text-4xl">{book.t}</h2>

          <div className="grid gap-2 sm:grid-cols-2">
            {/* AI quiz on the book */}
            <div className="grid content-start gap-2 rounded-[1.25rem] bg-white/5 p-4">
              <p className="flex items-center gap-2 text-sm font-bold">
                <ExamIcon weight="fill" className="size-4 text-sand" /> Quiz do livro
              </p>
              <p className="text-xs leading-relaxed text-ink-muted">10 perguntas: história, palavras no contexto e gramática do {book.lv}, com explicação em português.</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {saved && (
                  <button onClick={() => setRun({ key: String(book.id), title: book.t, questions: shuffle(saved.questions) })} className="h-9 rounded-full bg-sand px-4 text-xs font-bold text-sand-foreground">
                    Fazer o quiz salvo
                  </button>
                )}
                {aiName ? (
                  <button
                    onClick={busy ? () => ctl.current?.abort() : generate}
                    className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-bold", saved ? "border border-ink-border hover:bg-white/5" : "bg-sand text-sand-foreground")}
                  >
                    {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ListChecksIcon weight="bold" className="size-3.5" />}
                    {busy ? "Montando… (toque para parar)" : saved ? "Gerar outro" : `Gerar com ${aiName}`}
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      const text = `${quizPrompt(book, bookWords.map((w) => w.w), grammarFor(langOf(book), book.lv))}\n\nResponda com as perguntas numeradas e, no fim, o gabarito com explicações.`;
                      if (await copyText(text)) toast.success("Pedido copiado. Cole no claude.ai, Gemini ou outra IA. Para o quiz ficar dentro do app, ligue a IA no menu.");
                      else toast.error("Não consegui copiar.");
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink-border px-4 text-xs font-bold hover:bg-white/5"
                  >
                    <CopyIcon weight="bold" className="size-3.5" /> Copiar pedido
                  </button>
                )}
              </div>
              {bookScore && <ScoreLine score={bookScore} />}
              {saved && <p className="text-[11px] text-ink-muted">quiz gerado em {brDate(saved.at)}</p>}
            </div>

            {/* offline quiz from the notebook */}
            <div className="grid content-start gap-2 rounded-[1.25rem] bg-white/5 p-4">
              <p className="flex items-center gap-2 text-sm font-bold">
                <NotePencilIcon weight="fill" className="size-4 text-sand" /> Quiz das suas palavras
              </p>
              <p className="text-xs leading-relaxed text-ink-muted">
                Com o seu caderno: o que significa, como se diz e complete a frase. Funciona sem IA. {bookWords.length ? `${bookWords.length} palavras deste livro entram primeiro.` : ""}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {canWordsQuiz ? (
                  <button onClick={startWords} className="h-9 rounded-full bg-sand px-4 text-xs font-bold text-sand-foreground">
                    Começar
                  </button>
                ) : (
                  <button onClick={onGoVocab} className="h-9 rounded-full border border-ink-border px-4 text-xs font-bold hover:bg-white/5">
                    Anote 4 palavras primeiro
                  </button>
                )}
              </div>
              {wordsScore && <ScoreLine score={wordsScore} />}
            </div>
          </div>
        </div>
      </section>

      {run ? (
        <Player key={run.key + run.questions.length + run.questions[0]?.q} run={run} onExit={() => setRun(null)} onAgain={() => setRun({ ...run, questions: shuffle(run.questions) })} />
      ) : (
        <div className="grid gap-3 rounded-[1.5rem] border-2 border-dashed border-border p-6 text-center sm:p-8">
          <ExamIcon weight="fill" className="mx-auto size-10 text-[#a39d94]" />
          <p className="font-display text-xl">Teste o que você aprendeu</p>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Depois de ler, faça o quiz do livro para checar se entendeu a história e a gramática. O quiz das palavras é rápido e serve todo dia. As palavras que você errar voltam para as revisões de hoje.
          </p>
        </div>
      )}
    </div>
  );
}

function ScoreLine({ score }: { score: { best: number; last: number; total: number; times: number; at: string } }) {
  return (
    <p className="text-[11px] text-ink-muted tabular">
      melhor {score.best}/{score.total} · última {score.last}/{score.total} · {score.times}× · {brDate(score.at)}
    </p>
  );
}

export function Player({ run, onExit, onAgain }: { run: Run; onExit: () => void; onAgain: () => void }) {
  const { recordScore, gradeWord } = useEstante();
  const lang = useLang();
  const topicsOf = (m: QuizQuestion) => (m.kind === "grammar" ? topicsIn(`${m.q} ${m.why} ${m.options[m.answer]}`, lang) : []);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const [missed, setMissed] = useState<QuizQuestion[]>([]);
  const [finished, setFinished] = useState(false);
  const q = run.questions[i];
  const total = run.questions.length;

  function pick(n: number) {
    if (picked !== null) return;
    setPicked(n);
    if (n === q.answer) setRight((r) => r + 1);
    else setMissed((m) => [...m, q]);
  }

  function next() {
    if (i + 1 < total) {
      setI(i + 1);
      setPicked(null);
      return;
    }
    setFinished(true);
    recordScore(run.key, right, total, [...new Set(missed.flatMap((m) => topicsOf(m).map((t) => t.id)))]);
    // words you missed come back to today's reviews
    for (const m of missed) if (m.wordId) gradeWord(m.wordId, 0);
  }

  if (finished) {
    const pct = Math.round((right / total) * 100);
    return (
      <section className="grid gap-5 rounded-[1.75rem] border border-border bg-card p-5 sm:p-7">
        <div className="grid justify-items-center gap-2 text-center">
          <p className="text-xs text-muted-foreground">{run.title}</p>
          <p className="text-6xl leading-none font-extrabold tabular">
            {right}
            <span className="text-3xl font-bold text-muted-foreground">/{total}</span>
          </p>
          <p className="text-sm text-muted-foreground">{pct >= 90 ? "Excelente! Você dominou este livro." : pct >= 70 ? "Muito bem! Falta pouco." : pct >= 50 ? "Bom começo. Releia as explicações abaixo." : "Vale reler o livro e tentar de novo."}</p>
        </div>
        {missed.length > 0 && (
          <div className="grid gap-2">
            <h3 className="text-sm font-bold">Para revisar</h3>
            {missed.map((m, k) => (
              <div key={k} className="grid gap-1 rounded-2xl bg-muted/70 p-4 text-sm">
                <p className="font-semibold">{m.q}</p>
                <p>
                  <span className="text-muted-foreground">Resposta: </span>
                  {m.options[m.answer]}
                </p>
                {m.why && <p className="text-muted-foreground">{m.why}</p>}
                {topicsOf(m).map((t) => {
                  const video = videoLessons(t.id, lang)[0];
                  return (
                    <p key={t.id} className="mt-1 flex flex-wrap gap-x-3 text-xs font-semibold">
                      <a href={t.links[0].url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline-offset-2 hover:underline">
                        Revisar: {t.label} <ArrowSquareOutIcon weight="bold" className="size-3" />
                      </a>
                      {video && (
                        <a href={video.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline-offset-2 hover:underline">
                          vídeo, aula {video.lesson} <ArrowSquareOutIcon weight="bold" className="size-3" />
                        </a>
                      )}
                    </p>
                  );
                })}
              </div>
            ))}
            {missed.some((m) => m.wordId) && <p className="text-xs text-muted-foreground">As palavras que você errou voltaram para as revisões de hoje.</p>}
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={onAgain} className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-ink-foreground">
            <ArrowClockwiseIcon weight="bold" className="size-4" /> Fazer de novo
          </button>
          <button onClick={onExit} className="h-10 rounded-full border border-border px-5 text-sm hover:border-foreground">
            Fechar
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-3xl gap-4">
      <div className="flex items-center gap-3">
        <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <span className="block h-full rounded-full bg-ink transition-all" style={{ width: `${(i / total) * 100}%` }} />
        </span>
        <span className="text-xs text-muted-foreground tabular">
          {i + 1}/{total} · {right} certas
        </span>
      </div>

      <div className="grid gap-5 rounded-[1.75rem] bg-ink p-5 text-ink-foreground sm:p-7">
        <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold">{KIND_LABEL[q.kind] ?? "Pergunta"}</span>
        <p className="text-xl leading-snug font-bold sm:text-2xl">{q.q}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {q.options.map((o, n) => {
            const isRight = picked !== null && n === q.answer;
            const isWrong = picked === n && n !== q.answer;
            return (
              <button
                key={n}
                onClick={() => pick(n)}
                disabled={picked !== null}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 text-left text-sm transition-colors",
                  picked === null && "border-ink-border hover:bg-white/5",
                  isRight && "border-[#9cb88f] bg-[#9cb88f] text-ink",
                  isWrong && "border-[#d07a64] bg-[#d07a64] text-ink",
                  picked !== null && !isRight && !isWrong && "border-ink-border opacity-50",
                )}
              >
                <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold", isRight || isWrong ? "bg-ink text-ink-foreground" : "bg-white/10")}>
                  {isRight ? <CheckIcon weight="bold" /> : isWrong ? <XIcon weight="bold" /> : "ABCD"[n]}
                </span>
                {o}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-ink-border pt-4">
            <p className="max-w-xl text-sm text-ink-muted">
              <strong className="text-ink-foreground">{picked === q.answer ? "Certo! " : "Quase. "}</strong>
              {q.why}
            </p>
            <button onClick={next} className="inline-flex h-10 items-center gap-2 rounded-full bg-sand px-5 text-sm font-bold text-sand-foreground">
              {i + 1 < total ? "Próxima" : "Ver resultado"} <ArrowRightIcon weight="bold" className="size-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export function shuffle<T>(xs: T[]) {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffles the options of a question, keeping track of the right one. */
function withOptions(kind: QuizQuestion["kind"], q: string, correct: string, wrong: string[], why: string, wordId: string): QuizQuestion {
  const options = shuffle([correct, ...wrong]);
  return { kind, q, options, answer: options.indexOf(correct), why, wordId };
}

/** Builds up to 10 questions from the notebook, words of the chosen book first. No AI needed. */
function wordsQuiz(all: Word[], focus: Word[], langName: string): QuizQuestion[] {
  const usable = all.filter((w) => w.pt);
  if (usable.length < 4) return [];
  const focusIds = new Set(focus.map((w) => w.id));
  const pick = [...shuffle(usable.filter((w) => focusIds.has(w.id))), ...shuffle(usable.filter((w) => !focusIds.has(w.id)))].slice(0, 10);
  const others = (w: Word, field: "w" | "pt") =>
    shuffle([...new Set(usable.filter((x) => x.id !== w.id).map((x) => x[field]).filter((v) => v && v.toLowerCase() !== w[field].toLowerCase()))]).slice(0, 3);
  return pick.map((w, k) => {
    const canCloze = w.ex && new RegExp(`\\b${escape(w.w)}\\b`, "i").test(w.ex);
    const type = canCloze && k % 3 === 2 ? "cloze" : k % 2 === 0 ? "meaning" : "say";
    if (type === "cloze") return withOptions("cloze", w.ex.replace(new RegExp(`\\b${escape(w.w)}\\b`, "i"), "_____"), w.w, others(w, "w"), `“${w.ex}” — ${w.w} = ${w.pt}`, w.id);
    if (type === "say") return withOptions("say", `Como se diz “${w.pt}” em ${langName}?`, w.w, others(w, "w"), `${w.pt} = ${w.w}${w.en ? ` (${w.en})` : ""}`, w.id);
    return withOptions("meaning", `O que significa “${w.w}”?`, w.pt, others(w, "pt"), `${w.w} = ${w.pt}${w.ex ? ` · “${w.ex}”` : ""}`, w.id);
  });
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
