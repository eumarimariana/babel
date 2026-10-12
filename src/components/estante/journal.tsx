"use client";

import { useState, useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import { CheckIcon, CopyIcon, NotebookIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { langInfo, type Lang } from "@/lib/books";
import { activeProviderName, correctJournal, subscribeAi } from "@/lib/ai-client";
import { journalPrompt } from "@/lib/ai/prompts";
import { brDate, today, useEstante } from "@/lib/store";
import { cn } from "@/lib/utils";
import { SectionHead, copyText } from "./common";

// one task a day, rotating within the learner's band
const TASKS: Record<"start" | "mid" | "high", string[]> = {
  start: [
    "Apresente-se: nome, idade, cidade e o que você faz.",
    "Descreva a sua casa ou o seu quarto.",
    "Conte como é a sua manhã, do acordar até sair de casa.",
    "Fale da sua comida preferida e de quando você a come.",
    "Descreva uma pessoa da sua família.",
    "O que tem na sua bolsa ou mochila agora?",
  ],
  mid: [
    "O que você fez no último fim de semana?",
    "Conte uma viagem de que você gostou.",
    "Quais são os seus planos para as próximas férias?",
    "Descreva um dia ruim e o que aconteceu.",
    "Conte a história de um livro ou filme de que você gostou e diga por quê.",
    "Escreva uma mensagem para um amigo convidando-o para algo no sábado.",
  ],
  high: [
    "Redes sociais fazem mais bem ou mais mal? Defenda a sua opinião.",
    "Descreva uma mudança importante na sua vida e o que aprendeu com ela.",
    "Você prefere morar na cidade grande ou no interior? Explique.",
    "O que você mudaria na educação do seu país?",
    "Conte um problema que você resolveu no trabalho ou nos estudos.",
    "Qual habilidade você gostaria de aprender e por quê?",
  ],
};
const band = (level: string) => (["Pre-A1", "A1"].includes(level) ? "start" : ["A2", "B1"].includes(level) ? "mid" : "high");
const taskFor = (level: string, day: string) => {
  const list = TASKS[band(level)];
  return list[[...day].reduce((n, c) => n + c.charCodeAt(0), 0) % list.length];
};

/** "Palavras para anotar" lines from the AI correction: "word = translation". */
function wordsFrom(feedback: string) {
  const part = feedback.split(/palavras para anotar/i)[1] ?? "";
  return part
    .split("\n")
    .map((l) => l.replace(/^[\s*•\-–\d.)]+/, "").replace(/\*\*/g, "").trim())
    .filter((l) => l.includes("="))
    .map((l) => l.split("=").map((x) => x.trim().replace(/^["“]|["”]$/g, "")) as [string, string])
    .filter(([w, pt]) => w && pt && w.length < 40)
    .slice(0, 6);
}

/** Diário: a few sentences a day on a task of your level, corrected by the AI, with the new words ready to note down. */
export function Journal({ lang, level }: { lang: Lang; level: string }) {
  const { data, saveJournal, deleteJournal, addWord } = useEstante();
  const aiName = useSyncExternalStore(subscribeAi, activeProviderName, () => "");
  const day = today();
  const task = taskFor(level, day);
  const entries = data.journal.filter((j) => j.ln === lang);
  const todays = entries.find((j) => j.day === day);
  const [text, setText] = useState(todays?.text ?? "");
  const [busy, setBusy] = useState(false);
  const [noted, setNoted] = useState<string[]>([]);
  const [past, setPast] = useState(false);
  const [newId] = useState(() => `j${Date.now().toString(36)}`); // id for today's entry if it is new
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().split(/\s+/).length >= 2).length;
  const feedback = todays?.feedback && todays.text === text ? todays.feedback : undefined;

  function save(fb?: string) {
    const entry = { id: todays?.id ?? newId, ln: lang, day, task, text: text.trim(), feedback: fb };
    saveJournal(entry);
    return entry;
  }
  async function correct() {
    setBusy(true);
    try {
      const fb = await correctJournal(task, text.trim(), level);
      save(fb);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid gap-3">
      <SectionHead title="Diário" count={entries.length ? `${entries.length} ${entries.length === 1 ? "texto" : "textos"}` : undefined} action={entries.length > (todays ? 1 : 0) ? (past ? "Esconder anteriores" : "Ver anteriores") : undefined} onAction={() => setPast(!past)} />
      <div className="grid gap-4 rounded-[1.5rem] border border-border bg-card p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-sand-foreground">
            <NotebookIcon weight="bold" className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground tabular">
              Tema de hoje · {level} · escreva de 3 a 5 frases em {langInfo(lang).name.toLowerCase()}
            </p>
            <p className="font-semibold">{task}</p>
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Escreva aqui. Erros fazem parte: a correção vem depois."
          aria-label="Seu texto do diário"
          className="w-full rounded-2xl border border-border bg-background p-4 text-[15px] leading-relaxed outline-none focus-visible:border-foreground"
        />
        <div className="flex flex-wrap items-center gap-2">
          {aiName ? (
            <button onClick={correct} disabled={busy || sentences < 1} className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-ink-foreground disabled:opacity-40">
              {busy && <Loader2 className="size-4 animate-spin" />}
              {busy ? "Corrigindo…" : `Corrigir com ${aiName}`}
            </button>
          ) : (
            <button
              onClick={async () => {
                save();
                if (await copyText(journalPrompt(task, text.trim(), level))) toast.success("Texto e pedido copiados. Cole no claude.ai, Gemini ou outra IA.");
              }}
              disabled={sentences < 1}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-ink-foreground disabled:opacity-40"
            >
              <CopyIcon className="size-4" /> Salvar e copiar pedido de correção
            </button>
          )}
          {aiName && (
            <button onClick={() => (save(feedback), toast.success("Texto salvo no diário."))} disabled={!text.trim()} className="h-10 rounded-full border border-border px-4 text-sm hover:border-foreground disabled:opacity-40">
              Só salvar
            </button>
          )}
          <span className="text-xs text-muted-foreground tabular">
            {sentences} {sentences === 1 ? "frase" : "frases"}
          </span>
        </div>

        {feedback && (
          <div className="grid gap-3 rounded-2xl bg-muted/60 p-4">
            <p className="text-xs text-muted-foreground">Correção</p>
            <div className="text-sm leading-relaxed whitespace-pre-line">{feedback.replace(/\*\*/g, "")}</div>
            {wordsFrom(feedback).length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                {wordsFrom(feedback).map(([w, pt]) => {
                  const done = noted.includes(w);
                  return (
                    <button
                      key={w}
                      disabled={done}
                      onClick={() => {
                        addWord({ w, pt, ln: lang, book: null });
                        setNoted([...noted, w]);
                      }}
                      className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs", done ? "border-transparent bg-card text-muted-foreground" : "border-border bg-card hover:border-foreground")}
                    >
                      {done ? <CheckIcon weight="bold" className="size-3.5" /> : <PlusIcon weight="bold" className="size-3.5" />}
                      <strong>{w}</strong> {pt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {past && (
          <ul className="grid gap-2 border-t border-border pt-3">
            {entries
              .filter((j) => j.day !== day)
              .map((j) => (
                <li key={j.id} className="grid gap-1 rounded-2xl bg-muted/50 p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-muted-foreground tabular">
                      {brDate(j.day)} · {j.task}
                    </p>
                    <button onClick={() => confirm("Apagar este texto do diário?") && deleteJournal(j.id)} aria-label="Apagar" className="text-muted-foreground hover:text-destructive">
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                  <p className="whitespace-pre-line">{j.text}</p>
                  {j.feedback && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer">Ver correção</summary>
                      <div className="mt-1 whitespace-pre-line">{j.feedback.replace(/\*\*/g, "")}</div>
                    </details>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
}
