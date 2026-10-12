"use client";

import { useState, useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import { SparkleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import bank from "@/data/grammar-en.json";
import { activeProviderName, makeDrill, subscribeAi } from "@/lib/ai-client";
import { RESOURCE_LEVELS, TOPIC_BY_ID } from "@/lib/resources";
import { useEstante, type QuizQuestion } from "@/lib/store";
import { cn } from "@/lib/utils";
import { SectionHead } from "./common";
import { Player, shuffle, type Run } from "./quiz-tab";

type Item = { q: string; options: string[]; answer: number; why: string };
export const GRAMMAR_BANK = bank as Record<string, { level: string; items: Item[] }>;
const asQuestions = (items: Item[]): QuizQuestion[] => items.map((x) => ({ kind: "grammar", ...x }));

/** Grammar exercises inside the app: a fixed bank of 5 per topic, plus 8 more from the AI when it is on. */
export function GrammarPractice({ level }: { level: string }) {
  const { data } = useEstante();
  const aiName = useSyncExternalStore(subscribeAi, activeProviderName, () => "");
  const [run, setRun] = useState<Run | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // topics missed in the latest quiz, to flag them
  const gaps = new Set(
    Object.values(data.scores)
      .filter((s) => s.gaps?.length)
      .sort((a, b) => b.at.localeCompare(a.at))[0]?.gaps ?? [],
  );
  const levels = RESOURCE_LEVELS.filter((l) => Object.values(GRAMMAR_BANK).some((t) => t.level === l));

  function start(topic: string) {
    const t = TOPIC_BY_ID.get(topic)!;
    setRun({ key: `grammar-${topic}`, title: t.label, questions: shuffle(asQuestions(GRAMMAR_BANK[topic].items)) });
  }
  async function more(topic: string) {
    const t = TOPIC_BY_ID.get(topic)!;
    setBusy(topic);
    try {
      const r = await makeDrill(t.label, GRAMMAR_BANK[topic].level);
      setRun({ key: `grammar-${topic}`, title: `${t.label} · ${aiName}`, questions: r.questions.map((q) => ({ ...q, kind: "grammar" })) });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="grid gap-3">
      <SectionHead title="Gramática" count={`${Object.keys(GRAMMAR_BANK).length} temas · 5 exercícios cada`} />
      <div className="grid gap-2 rounded-[1.5rem] border border-border bg-card p-4 sm:p-5">
        {levels.map((l) => (
          <div key={l} className={cn("grid gap-2 py-1 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:items-start", l === level && "rounded-xl bg-muted/60 p-2 sm:-mx-2")}>
            <p className="pt-1.5 text-xs font-bold tabular">
              {l}
              {l === level && <span className="block font-normal text-muted-foreground">seu nível</span>}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(GRAMMAR_BANK)
                .filter(([, t]) => t.level === l)
                .map(([id]) => {
                  const t = TOPIC_BY_ID.get(id)!;
                  const score = data.scores[`grammar-${id}`];
                  return (
                    <span key={id} className="inline-flex items-center rounded-full border border-border bg-background">
                      <button onClick={() => start(id)} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] hover:bg-muted">
                        {gaps.has(id) && <span className="size-1.5 rounded-full bg-[#d07a64]" title="Você errou no último quiz" />}
                        {t.label}
                        {score && <span className="text-[11px] text-muted-foreground tabular">{score.last}/{score.total}</span>}
                      </button>
                      {aiName && (
                        <button onClick={() => more(id)} disabled={!!busy} title={`Mais 8 exercícios com ${aiName}`} aria-label={`Mais exercícios de ${t.label} com ${aiName}`} className="grid size-8 place-items-center rounded-full border-l border-border text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40">
                          {busy === id ? <Loader2 className="size-3.5 animate-spin" /> : <SparkleIcon weight="bold" className="size-3.5" />}
                        </button>
                      )}
                    </span>
                  );
                })}
            </div>
          </div>
        ))}
        <p className="pt-1 text-xs text-muted-foreground">
          Toque num tema para fazer os exercícios.{aiName ? ` O ✦ ao lado pede mais 8 ao ${aiName}.` : " Com a IA ligada, dá para pedir mais exercícios de cada tema."} O ponto vermelho marca o que você errou no último quiz.
        </p>
      </div>

      {run && (
        <Dialog open onOpenChange={(o) => !o && setRun(null)}>
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[1.75rem] p-4 sm:max-w-3xl sm:p-6">
            <DialogTitle className="font-display text-xl">{run.title}</DialogTitle>
            <DialogDescription className="-mt-2 text-xs">Escolha a resposta certa. A explicação aparece logo depois.</DialogDescription>
            <Player key={run.title + run.questions[0]?.q} run={run} onExit={() => setRun(null)} onAgain={() => setRun({ ...run, questions: shuffle(run.questions) })} />
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
