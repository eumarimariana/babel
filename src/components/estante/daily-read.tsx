"use client";

import { ArrowSquareOutIcon, NewspaperIcon } from "@phosphor-icons/react";
import { dailyRead } from "@/lib/resources";
import { today } from "@/lib/store";

/** "Leitura do dia": one fresh text or audio of your level, from sites that publish every day. */
export function DailyRead({ level, className }: { level: string; className?: string }) {
  const { pick, others } = dailyRead(level, today());
  return (
    <article className={`grid grid-cols-1 content-start gap-3 rounded-[1.5rem] border border-border bg-card p-5 ${className ?? ""}`}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-sand-foreground">
          <NewspaperIcon weight="bold" className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-lg leading-tight">Leitura do dia</h2>
          <p className="text-xs text-muted-foreground tabular">{level} · conteúdo novo todo dia</p>
        </div>
      </div>
      <a href={pick.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-3 rounded-2xl bg-ink p-3.5 text-ink-foreground hover:opacity-95">
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{pick.name}</span>
          <span className="block text-xs text-ink-muted">{pick.what}</span>
        </span>
        <ArrowSquareOutIcon className="size-4 shrink-0" />
      </a>
      {others.length > 0 && (
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
          <span className="text-muted-foreground">Outras do seu nível:</span>
          {others.map((o) => (
            <a key={o.url} href={o.url} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
              {o.name}
            </a>
          ))}
        </p>
      )}
    </article>
  );
}
