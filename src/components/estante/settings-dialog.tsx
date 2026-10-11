"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { ArrowSquareOutIcon, CheckIcon, DownloadSimpleIcon, LockSimpleIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PROVIDERS, applyTaskSuggestions, connectProvider, removeProvider, setActiveProvider, setModel, setTaskModel, taskModel, taskSuggestions, useAiConfig, type ProviderId } from "@/lib/ai-client";
import { AI_TASKS, TIER_WHY } from "@/lib/ai/task-models";
import { cn } from "@/lib/utils";
import { SimpleSelect } from "./common";
import { brDate, normalize, today, useEstante } from "@/lib/store";

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data, replaceAll } = useEstante();
  const file = useRef<HTMLInputElement>(null);

  function exportData() {
    const blob = new Blob([JSON.stringify({ app: "babel", ...data, at: new Date().toISOString() }, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `babel-backup-${today()}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    toast.success("Backup baixado.");
  }

  async function importData(f: File) {
    try {
      const raw = JSON.parse(await f.text());
      // "estante-eli" is what backups were tagged before the app became Babel
      if (raw.app !== "babel" && raw.app !== "estante-eli") throw new Error();
      const d = normalize(raw);
      replaceAll(d);
      toast.success(`Backup${raw.at ? ` de ${brDate(String(raw.at).slice(0, 10))}` : ""} importado: ${d.words.length} palavras, ${Object.keys(d.progress).length} livros marcados.`);
    } catch {
      toast.error("Esse arquivo não é um backup do Babel.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">Configurações</DialogTitle>
          <DialogDescription>Tudo o que você configura aqui fica salvo só neste navegador.</DialogDescription>
        </DialogHeader>

        <p className="text-sm font-semibold">Inteligência artificial</p>
        <AiSection />

        <Separator />

        <div className="grid gap-3">
          <p className="text-sm font-medium">Backup do progresso</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportData}>
              <DownloadSimpleIcon data-icon="inline-start" /> Exportar
            </Button>
            <Button variant="outline" onClick={() => file.current?.click()}>
              <UploadSimpleIcon data-icon="inline-start" /> Importar
            </Button>
            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importData(f);
                e.target.value = "";
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Use para levar seus livros e palavras para outro aparelho. Aceita também os backups da versão em arquivo único.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Just the AI setup, opened from the sidebar card and the mobile header. */
export function AiDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const config = useAiConfig();
  const on = Boolean(config.active && config.keys[config.active]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-[1.75rem] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">{on ? "Sua IA" : "Ligar a IA"}</DialogTitle>
          <DialogDescription>Traduz palavras, monta o kit de pré-leitura e corrige seus resumos. Leva um minuto e pode ser grátis.</DialogDescription>
        </DialogHeader>
        <AiSection onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function StepHead({ n, title, done }: { n: number; title: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold tabular", done ? "bg-good text-white" : "bg-sand text-sand-foreground")}>
        {done ? <CheckIcon weight="bold" className="size-3.5" /> : String(n).padStart(2, "0")}
      </span>
      <p className="text-sm font-semibold">{title}</p>
    </div>
  );
}

function AiSection({ onDone }: { onDone?: () => void }) {
  const config = useAiConfig();
  const [selected, setSelected] = useState<ProviderId>(config.active ?? "gemini");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const info = PROVIDERS.find((p) => p.id === selected)!;
  const savedKey = config.keys[selected];
  const models = config.modelLists[selected] ?? [];
  const inUse = config.active === selected && Boolean(savedKey);

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    const k = key.trim();
    if (!k) return;
    setBusy(true);
    try {
      await connectProvider(selected, k);
      setKey("");
      toast.success(`${info.name} conectado. Os botões de IA já usam ele.`);
      onDone?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      {/* 01 · provider */}
      <section className="grid gap-3">
        <StepHead n={1} title="Escolha um provedor" />
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Provedor de IA">
          {PROVIDERS.map((p) => {
            const connected = Boolean(config.keys[p.id]);
            const active = config.active === p.id && connected;
            const on = selected === p.id;
            return (
              <button
                key={p.id}
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setSelected(p.id);
                  setKey("");
                }}
                className={cn(
                  "grid gap-1.5 rounded-2xl border p-3 text-left transition-colors",
                  on ? "border-ink bg-ink text-ink-foreground" : "border-border bg-card hover:border-foreground",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-bold">{p.name}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", p.free ? "bg-sand text-sand-foreground" : on ? "border border-ink-border" : "border border-border")}>
                    {p.free ? "Grátis" : "Pago"}
                  </span>
                </span>
                <span className={cn("flex items-center gap-1.5 text-xs", on ? "text-ink-muted" : "text-muted-foreground")}>
                  <span className={cn("size-1.5 rounded-full", active ? "bg-good" : connected ? "bg-warn" : on ? "bg-ink-border" : "bg-input")} />
                  {active ? "Em uso" : connected ? "Conectado" : p.id === "gemini" ? "Recomendado" : "Sem chave"}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{info.note}</p>
      </section>

      {savedKey ? (
        /* already connected: status, model, swap or remove */
        <section className="grid gap-3 rounded-2xl bg-ink p-4 text-ink-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span className={cn("size-2 rounded-full", inUse ? "bg-good" : "bg-warn")} />
              {inUse ? `${info.name} em uso` : `${info.name} conectado`}
            </span>
            <span className="text-xs text-ink-muted tabular">
              {savedKey.slice(0, 8)}…{savedKey.slice(-4)}
            </span>
          </div>
          {models.length > 1 && (
            <div className="grid gap-1.5">
              <Label className="text-xs font-normal text-ink-muted">Modelo (o primeiro é o recomendado)</Label>
              <SimpleSelect
                label="Modelo"
                value={config.models[selected] ?? models[0].id}
                onChange={(m) => setModel(selected, m)}
                options={models.map((m) => ({ value: m.id, label: m.label }))}
                className="w-full border-ink-border bg-white/5 text-ink-foreground dark:bg-white/5 [&_svg]:text-ink-muted"
              />
            </div>
          )}
          {models.length > 0 && <TaskModels provider={selected} />}
          <div className="flex flex-wrap gap-2">
            {!inUse && (
              <button onClick={() => (setActiveProvider(selected), toast.success(`Agora usando ${info.name}.`))} className="h-9 rounded-full bg-sand px-4 text-sm font-bold text-sand-foreground">
                Usar este
              </button>
            )}
            <button
              onClick={() => {
                removeProvider(selected);
                toast.success(`Chave do ${info.name} removida deste navegador.`);
              }}
              className="h-9 rounded-full border border-ink-border px-4 text-sm hover:bg-white/5"
            >
              Remover chave
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* 02 · get a key */}
          <section className="grid gap-3">
            <StepHead n={2} title={`Gere sua chave no ${info.name}`} />
            <a
              href={info.keyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 w-fit items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium hover:border-foreground"
            >
              Abrir {info.keyUrl.replace("https://", "").split("/")[0]} <ArrowSquareOutIcon weight="bold" className="size-4" />
            </a>
            <p className="text-xs text-muted-foreground">Faça login, crie uma chave e copie. Ela começa com {info.keyHint}</p>
          </section>
        </>
      )}

      {/* 03 · paste */}
      <form onSubmit={connect} className="grid gap-3">
        <StepHead n={savedKey ? 2 : 3} title={savedKey ? "Trocar a chave" : "Cole a chave e conecte"} />
        <div className="flex gap-2">
          <Input
            id="api-key"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={info.keyHint}
            autoComplete="off"
            spellCheck={false}
            className="h-11 bg-card"
            aria-label={`Chave do ${info.name}`}
          />
          <button type="submit" disabled={busy || !key.trim()} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-ink-foreground disabled:opacity-40">
            {busy && <Loader2 className="size-4 animate-spin" />}
            {busy ? "Testando" : "Conectar"}
          </button>
        </div>
      </form>

      <p className="flex gap-2 rounded-2xl bg-muted/70 p-3 text-xs leading-relaxed text-muted-foreground">
        <LockSimpleIcon weight="bold" className="mt-0.5 size-4 shrink-0" />
        A chave fica só neste navegador e vai direto para o provedor, sem passar por nenhum servidor do Babel. Em computador compartilhado, remova ao terminar.
      </p>
    </div>
  );
}

/** "Melhor modelo para cada tarefa": a suggested model per task, picked from the models this key can use. */
function TaskModels({ provider }: { provider: ProviderId }) {
  const config = useAiConfig();
  const models = config.modelLists[provider] ?? [];
  const suggested = taskSuggestions(provider);
  const label = (id: string) => models.find((m) => m.id === id)?.label ?? id;
  const differs = AI_TASKS.some((t) => taskModel(config, provider, t.id) !== suggested[t.id]);
  const claudeOld = provider === "anthropic" && models.length === 1; // connected before Sonnet and Haiku were listed

  return (
    <div className="grid gap-3 border-t border-ink-border pt-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Melhor modelo para cada tarefa</p>
          <p className="text-xs text-ink-muted">Sugestões a partir dos {models.length} modelos que a sua chave tem.</p>
        </div>
        {differs && (
          <button onClick={() => (applyTaskSuggestions(provider), toast.success("Cada tarefa agora usa o modelo sugerido."))} className="h-8 rounded-full bg-sand px-3.5 text-xs font-bold text-sand-foreground">
            Usar as sugestões
          </button>
        )}
      </div>
      <ul className="grid gap-2.5">
        {AI_TASKS.map((t) => {
          const current = taskModel(config, provider, t.id);
          const isSuggested = current === suggested[t.id];
          return (
            <li key={t.id} className="grid gap-1.5 rounded-xl bg-white/5 p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-[11px] text-ink-muted">{t.detail}</span>
              </div>
              {models.length > 1 ? (
                <SimpleSelect
                  label={`Modelo para ${t.label.toLowerCase()}`}
                  value={current}
                  onChange={(m) => setTaskModel(provider, t.id, m)}
                  options={models.map((m) => ({ value: m.id, label: m.id === suggested[t.id] ? `${m.label} · sugerido` : m.label }))}
                  className="h-9 w-full border-ink-border bg-white/5 text-ink-foreground dark:bg-white/5 [&_svg]:text-ink-muted"
                />
              ) : (
                <span className="text-xs">{label(current)}</span>
              )}
              <p className="flex items-start gap-1.5 text-[11px] text-ink-muted">
                {isSuggested && <CheckIcon weight="bold" className="mt-0.5 size-3 shrink-0 text-sand" />}
                {isSuggested ? `Sugerido: ${TIER_WHY[t.tier]}.` : `Sugerido: ${label(suggested[t.id])} (${TIER_WHY[t.tier]}).`}
              </p>
            </li>
          );
        })}
      </ul>
      {claudeOld && <p className="text-[11px] text-ink-muted">Sua chave foi conectada antes de o app listar o Sonnet e o Haiku. Cole a chave de novo em &quot;Trocar a chave&quot; para ver todos os modelos do Claude.</p>}
      {provider === "anthropic" && <p className="text-[11px] text-ink-muted">Preço por milhão de tokens (entrada / saída): Haiku 5.5 US$ 0,10 / 0,50 · Sonnet 5.5 US$ 2 / 10 · Opus 5.5 US$ 4 / 20.</p>}
    </div>
  );
}
