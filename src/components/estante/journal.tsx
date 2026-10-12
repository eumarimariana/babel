"use client";

import { useEffect, useState } from "react";
import { NotebookIcon, TrashIcon } from "@phosphor-icons/react";
import { langInfo, type Lang } from "@/lib/books";
import { brDate, today, useEstante } from "@/lib/store";
import { SectionHead } from "./common";
import { CorrectionView, WritingBox } from "./writing-feedback";

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

/** Diário: a few sentences a day on a task of your level, corrected by the AI, with the new words ready to note down. */
export function Journal({ lang, level }: { lang: Lang; level: string }) {
  const { data, saveJournal, deleteJournal } = useEstante();
  const day = today();
  const task = taskFor(level, day);
  const entries = data.journal.filter((j) => j.ln === lang);
  const todays = entries.find((j) => j.day === day);
  const [text, setText] = useState(todays?.text ?? "");
  const [past, setPast] = useState(false);
  const [newId] = useState(() => `j${Date.now().toString(36)}`); // id for today's entry if it is new
  const saved = todays?.correction ? { text: todays.text, at: todays.day, c: todays.correction } : undefined;

  // the diary saves itself while you write
  useEffect(() => {
    if (!text.trim() || text.trim() === todays?.text) return;
    const t = setTimeout(() => saveJournal({ id: todays?.id ?? newId, ln: lang, day, task, text: text.trim() }), 700);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps -- save only when the text changes

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
              Tema de hoje · {level} · escreva de 3 a 5 frases em {langInfo(lang).name.toLowerCase()} · salva sozinho
            </p>
            <p className="font-semibold">{task}</p>
          </div>
        </div>
        <WritingBox
          lang={lang}
          context={{ kind: "diary", task }}
          level={level}
          text={text}
          onText={setText}
          saved={saved}
          onSaved={(s) => saveJournal({ id: todays?.id ?? newId, ln: lang, day, task, text: s.text, correction: s.c })}
          scoreKey="writing-diary"
          placeholder="Escreva aqui. Erros fazem parte: a correção vem depois."
          rows={5}
        />

        {past && (
          <ul className="grid gap-2 border-t border-border pt-3">
            {entries
              .filter((j) => j.day !== day)
              .map((j) => (
                <li key={j.id} className="grid gap-1 rounded-2xl bg-muted/50 p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-muted-foreground tabular">
                      {brDate(j.day)} · {j.task}
                      {j.correction && ` · nota ${Math.round(j.correction.score)}/10`}
                    </p>
                    <button onClick={() => confirm("Apagar este texto do diário?") && deleteJournal(j.id)} aria-label="Apagar" className="text-muted-foreground hover:text-destructive">
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                  {(j.correction || j.feedback) ? (
                    <details>
                      <summary className="cursor-pointer whitespace-pre-line">{j.text}</summary>
                      <div className="mt-2">
                        {j.correction ? (
                          <CorrectionView saved={{ text: j.text, at: j.day, c: j.correction }} lang={lang} />
                        ) : (
                          <div className="text-xs whitespace-pre-line text-muted-foreground">{j.feedback!.replace(/\*\*/g, "")}</div>
                        )}
                      </div>
                    </details>
                  ) : (
                    <p className="whitespace-pre-line">{j.text}</p>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
}
