"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { ArrowSquareOutIcon, CheckCircleIcon, DownloadSimpleIcon, KeyIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PROVIDERS, connectProvider, removeProvider, setActiveProvider, setModel, useAiConfig, type ProviderId } from "@/lib/ai-client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SimpleSelect } from "./common";
import { brDate, normalize, today, useEstante } from "@/lib/store";

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data, replaceAll } = useEstante();
  const file = useRef<HTMLInputElement>(null);

  function exportData() {
    const blob = new Blob([JSON.stringify({ app: "estante-eli", ...data, at: new Date().toISOString() }, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `estante-eli-backup-${today()}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    toast.success("Backup baixado.");
  }

  async function importData(f: File) {
    try {
      const raw = JSON.parse(await f.text());
      if (raw.app !== "estante-eli") throw new Error();
      const d = normalize(raw);
      replaceAll(d);
      toast.success(`Backup${raw.at ? ` de ${brDate(String(raw.at).slice(0, 10))}` : ""} importado: ${d.words.length} palavras, ${Object.keys(d.progress).length} livros marcados.`);
    } catch {
      toast.error("Esse arquivo não é um backup da Estante ELi.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Configurações</DialogTitle>
          <DialogDescription>Tudo o que você configura aqui fica salvo só neste navegador.</DialogDescription>
        </DialogHeader>

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

function AiSection() {
  const config = useAiConfig();
  const [selected, setSelected] = useState<ProviderId>(config.active ?? "gemini");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const info = PROVIDERS.find((p) => p.id === selected)!;
  const savedKey = config.keys[selected];
  const models = config.modelLists[selected] ?? [];

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    const k = key.trim();
    if (!k) return;
    setBusy(true);
    try {
      await connectProvider(selected, k);
      setKey("");
      toast.success(`${info.name} conectado. Os botões de IA já usam ele.`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <KeyIcon className="size-4" />
        <p className="text-sm font-medium">Inteligência artificial</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Os botões de IA (preencher palavra, kit de leitura, correção do resumo) usam a <strong>sua própria</strong> chave. Escolha um provedor: os três
        primeiros têm plano gratuito.
      </p>

      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Provedor de IA">
        {PROVIDERS.map((p) => {
          const connected = Boolean(config.keys[p.id]);
          const isActive = config.active === p.id && connected;
          return (
            <button
              key={p.id}
              role="radio"
              aria-checked={selected === p.id}
              onClick={() => {
                setSelected(p.id);
                setKey("");
              }}
              className={cn(
                "grid gap-1 rounded-lg border bg-card p-2.5 text-left transition-colors hover:border-primary/50",
                selected === p.id && "border-primary ring-2 ring-primary/25",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold">{p.name}</span>
                {p.free ? (
                  <Badge variant="secondary" className="text-good">
                    Grátis
                  </Badge>
                ) : (
                  <Badge variant="outline">Pago</Badge>
                )}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {isActive ? (
                  <>
                    <CheckCircleIcon className="size-3.5 text-good" /> Em uso
                  </>
                ) : connected ? (
                  "Conectado"
                ) : (
                  "Sem chave"
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 rounded-lg bg-muted/60 p-3">
        <p className="text-xs text-muted-foreground">{info.note}</p>

        {savedKey && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs tabular">
              {savedKey.slice(0, 8)}…{savedKey.slice(-4)}
            </span>
            <div className="flex gap-1">
              {config.active !== selected && (
                <Button size="sm" onClick={() => (setActiveProvider(selected), toast.success(`Agora usando ${info.name}.`))}>
                  Usar este
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => {
                  removeProvider(selected);
                  toast.success(`Chave do ${info.name} removida deste navegador.`);
                }}
              >
                Remover
              </Button>
            </div>
          </div>
        )}

        {savedKey && models.length > 1 && (
          <div className="grid gap-1.5">
            <Label>Modelo</Label>
            <SimpleSelect
              label="Modelo"
              value={config.models[selected] ?? models[0].id}
              onChange={(m) => setModel(selected, m)}
              options={models.map((m) => ({ value: m.id, label: m.label }))}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">O primeiro da lista é o recomendado. Se um modelo der erro ou bater o limite, troque aqui.</p>
          </div>
        )}

        <form onSubmit={connect} className="grid gap-2">
          <Label htmlFor="api-key">{savedKey ? `Trocar chave do ${info.name}` : `Chave do ${info.name}`}</Label>
          <div className="flex gap-2">
            <Input id="api-key" type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder={info.keyHint} autoComplete="off" spellCheck={false} />
            <Button type="submit" disabled={busy || !key.trim()}>
              {busy && <Loader2 className="animate-spin" data-icon="inline-start" />}
              {busy ? "Testando" : "Conectar"}
            </Button>
          </div>
          <a className="inline-flex items-center gap-1 text-xs underline underline-offset-2 hover:text-muted-foreground" href={info.keyUrl} target="_blank" rel="noopener noreferrer">
            Gerar uma chave do {info.name} <ArrowSquareOutIcon className="size-3" />
          </a>
        </form>
      </div>

      <p className="text-xs text-muted-foreground">
        As chaves ficam guardadas só neste navegador e vão direto para o provedor, sem passar pelo servidor deste site. Em computador compartilhado, clique em
        Remover ao terminar.
      </p>
    </div>
  );
}
