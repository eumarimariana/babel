"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { ArrowSquareOutIcon, CheckIcon, DownloadSimpleIcon, LockSimpleIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PROVIDERS, applyTaskSuggestions, connectProvider, providerFor, providerName, removeProvider, setActiveProvider, setLangProvider, setModel, setTaskModel, taskModel, taskSuggestions, useAiConfig, type ProviderId } from "@/lib/ai-client";
import { AI_TASKS, TIER_WHY } from "@/lib/ai/task-models";
import { cn } from "@/lib/utils";
import { SimpleSelect, useLang } from "./common";
import { brDate, normalize, today, useEstante, type Data } from "@/lib/store";
import { mergeData, profileData, replaceProfile, summary } from "@/lib/backup";
import { LANGS, langInfo, type Lang } from "@/lib/books";

type PendingImport = { d: Data; profile: Lang | null; at: string };

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data, replaceAll } = useEstante();
  const lang = useLang();
  const file = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingImport | null>(null);
  const langName = langInfo(lang).name;

  function exportData(profile: Lang | null) {
    const d = profile ? profileData(data, profile) : data;
    const blob = new Blob([JSON.stringify({ app: "babel", ...(profile && { profile }), ...d, at: new Date().toISOString() }, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `babel-backup-${profile ? `${profile}-` : ""}${today()}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    toast.success(profile ? `Backup do perfil ${langInfo(profile).name} baixado.` : "Backup de todos os idiomas baixado.");
  }

  async function readFile(f: File) {
    try {
      const raw = JSON.parse(await f.text());
      // "estante-eli" is what backups were tagged before the app became Babel
      if (raw.app !== "babel" && raw.app !== "estante-eli") throw new Error();
      const profile = LANGS.some((l) => l.code === raw.profile) ? (raw.profile as Lang) : null;
      const d = normalize(raw);
      // a profile backup only ever brings that language in, whatever else the file holds
      setPending({ d: profile ? profileData(d, profile) : d, profile, at: raw.at ? brDate(String(raw.at).slice(0, 10)) : "" });
    } catch {
      toast.error("Esse arquivo não é um backup do Babel.");
    }
  }

  function applyImport(mode: "merge" | "replace") {
    if (!pending) return;
    const { d, profile } = pending;
    replaceAll(mode === "merge" ? mergeData(data, d) : profile ? replaceProfile(data, d, profile) : d);
    const s = summary(d);
    toast.success(`Backup ${mode === "merge" ? "juntado" : "importado"}: ${s.words} palavras, ${s.books} livros marcados.`);
    setPending(null);
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
            <Button variant="outline" onClick={() => exportData(lang)}>
              <DownloadSimpleIcon data-icon="inline-start" /> Exportar {langName}
            </Button>
            <Button variant="outline" onClick={() => exportData(null)}>
              <DownloadSimpleIcon data-icon="inline-start" /> Exportar tudo
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
                if (f) readFile(f);
                e.target.value = "";
              }}
            />
          </div>
          {pending && <ImportChoice pending={pending} onMerge={() => applyImport("merge")} onReplace={() => applyImport("replace")} onCancel={() => setPending(null)} />}
          <p className="text-xs text-muted-foreground">
            Use para levar seus livros e palavras para outro aparelho. &quot;Exportar {langName}&quot; leva só este perfil; os dias estudados vão junto em qualquer backup. Aceita também os backups da versão em
            arquivo único.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Asks whether a backup joins what is here or replaces it (the whole app, or just the backup's profile). */
function ImportChoice({ pending, onMerge, onReplace, onCancel }: { pending: PendingImport; onMerge: () => void; onReplace: () => void; onCancel: () => void }) {
  const s = summary(pending.d);
  const scope = pending.profile ? `o perfil ${langInfo(pending.profile).name}` : "todos os idiomas";
  const box = useRef<HTMLDivElement>(null);
  // the dialog is long and this opens at its bottom
  useEffect(() => {
    box.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [pending]);
  return (
    <div ref={box} className="grid gap-3 rounded-2xl bg-ink p-4 text-ink-foreground">
      <div>
        <p className="text-sm font-semibold">
          Backup{pending.at && ` de ${pending.at}`} · {pending.profile ? `perfil ${langInfo(pending.profile).name}` : "todos os idiomas"}
        </p>
        <p className="text-xs text-ink-muted tabular">
          {s.words} palavras · {s.books} livros marcados · {s.quotes} citações · {s.journal} textos no diário
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={onMerge} className="h-9 rounded-full bg-sand px-4 text-sm font-bold text-sand-foreground">
          Juntar com o que já tenho
        </button>
        <button onClick={onReplace} className="h-9 rounded-full border border-ink-border px-4 text-sm hover:bg-white/5">
          Substituir {scope}
        </button>
        <button onClick={onCancel} className="h-9 rounded-full px-3 text-sm text-ink-muted hover:bg-white/5">
          Cancelar
        </button>
      </div>
      <p className="text-[11px] text-ink-muted">
        Juntar não apaga nada: uma palavra que está nos dois fica com o histórico de revisões mais longo, e livros e materiais ficam com a marcação mais recente. Substituir troca {scope} pelo que está no arquivo
        {pending.profile ? "; os outros idiomas não mudam." : "."}
      </p>
    </div>
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
  const lang = useLang();
  const current = providerFor(config, lang); // what this profile uses
  const ownPick = Boolean(config.byLang?.[lang] && config.keys[config.byLang[lang]!]);
  const [selected, setSelected] = useState<ProviderId>(current ?? "gemini");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const info = PROVIDERS.find((p) => p.id === selected)!;
  const savedKey = config.keys[selected];
  const models = config.modelLists[selected] ?? [];
  const inUse = current === selected && Boolean(savedKey);

  // "Usar este" changes this profile's own pick when it has one, otherwise the default for every profile
  function use(id: ProviderId) {
    if (ownPick) setLangProvider(lang, id);
    else setActiveProvider(id);
  }

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    const k = key.trim();
    if (!k) return;
    setBusy(true);
    try {
      await connectProvider(selected, k);
      if (ownPick) setLangProvider(lang, selected);
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
            const active = current === p.id && connected;
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
        <ProfileProvider />
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
              <button onClick={() => (use(selected), toast.success(`Agora usando ${info.name}${ownPick ? ` em ${langInfo(lang).name.toLowerCase()}` : ""}.`))} className="h-9 rounded-full bg-sand px-4 text-sm font-bold text-sand-foreground">
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

/** A profile can keep its own provider (say Claude for German, Gemini for the rest); shown once two keys are connected. */
function ProfileProvider() {
  const config = useAiConfig();
  const lang = useLang();
  const connected = PROVIDERS.filter((p) => config.keys[p.id]);
  if (connected.length < 2) return null;
  const own = config.byLang?.[lang];
  const fallback = config.active && config.keys[config.active] ? providerName(config.active) : "nenhuma";
  return (
    <div className="grid gap-1.5 rounded-2xl bg-muted/70 p-3">
      <Label className="text-xs font-normal text-muted-foreground">IA do perfil {langInfo(lang).name}</Label>
      <SimpleSelect
        label={`IA do perfil ${langInfo(lang).name}`}
        value={own && config.keys[own] ? own : "default"}
        onChange={(v) => setLangProvider(lang, v === "default" ? null : (v as ProviderId))}
        options={[{ value: "default", label: `A mesma dos outros perfis (${fallback})` }, ...connected.map((p) => ({ value: p.id, label: p.name }))]}
        className="w-full bg-card"
      />
      <p className="text-[11px] text-muted-foreground">As chaves valem para todos os perfis. Aqui você só escolhe qual delas este idioma usa.</p>
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
