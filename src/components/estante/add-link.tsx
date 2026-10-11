"use client";

import { useState } from "react";
import { LinkIcon, YoutubeLogoIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Lang } from "@/lib/books";
import { RESOURCE_KINDS, RESOURCE_LEVELS, type ResourceKind, siteOf, youtubePlaylist } from "@/lib/resources";
import { useEstante } from "@/lib/store";
import { cn } from "@/lib/utils";

const input = "h-10 w-full rounded-full border border-border bg-background px-4 text-sm outline-none focus-visible:border-foreground";

/** A link of your own: becomes a card like the catalog ones. A YouTube playlist link becomes a playlist card, with "parei na aula". */
export function AddLink({ lang, level, onClose }: { lang: Lang; level?: string; onClose?: () => void }) {
  const { addResource } = useEstante();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<ResourceKind>("grammar");
  const [levels, setLevels] = useState<string[]>(level ? [level] : []);
  const [note, setNote] = useState("");
  const playlist = youtubePlaylist(url.trim());

  function changeUrl(v: string) {
    setUrl(v);
    if (youtubePlaylist(v.trim())) setKind("video");
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    const href = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    try {
      siteOf(href);
    } catch {
      return toast.error("Esse endereço não parece um link.");
    }
    const site = siteOf(href);
    addResource({
      id: "my-" + Date.now().toString(36),
      name: name.trim() || (playlist ? "Playlist do YouTube" : site),
      url: href,
      kind,
      levels: levels.length ? RESOURCE_LEVELS.filter((l) => levels.includes(l)) : RESOURCE_LEVELS,
      siteLang: "pt",
      note: note.trim() || "Link que você adicionou.",
      ...(playlist ? { playlist } : {}),
      ln: lang,
      mine: true,
    });
    toast.success("Link adicionado aos materiais.");
    setUrl("");
    setName("");
    setNote("");
    onClose?.();
  }

  return (
    <form onSubmit={save} className="grid gap-3 rounded-[1.25rem] border border-border bg-card p-5">
      <h3 className="flex items-center gap-2 font-semibold">
        <LinkIcon weight="bold" className="size-4" /> Adicionar um link seu
      </h3>
      <label className="grid gap-1.5 text-xs text-muted-foreground">
        Endereço
        <input autoFocus={!!onClose} required value={url} onChange={(e) => changeUrl(e.target.value)} placeholder="https://…" inputMode="url" className={input} />
      </label>
      {playlist && (
        <p className="flex items-center gap-2 text-xs">
          <YoutubeLogoIcon weight="fill" className="size-4" /> Playlist do YouTube: o card vai guardar a aula em que você parou.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs text-muted-foreground">
          Nome
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={playlist ? "ex.: Phrasal verbs do zero" : "ex.: Podcast de inglês"} className={input} />
        </label>
        <label className="grid gap-1.5 text-xs text-muted-foreground">
          Habilidade
          <select value={kind} onChange={(e) => setKind(e.target.value as ResourceKind)} className={cn(input, "appearance-auto")}>
            {RESOURCE_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="grid gap-1.5">
        <legend className="mb-1.5 text-xs text-muted-foreground">Níveis (nenhum marcado = todos)</legend>
        <div className="flex flex-wrap gap-1.5">
          {RESOURCE_LEVELS.map((l) => {
            const on = levels.includes(l);
            return (
              <button
                key={l}
                type="button"
                aria-pressed={on}
                onClick={() => setLevels(on ? levels.filter((x) => x !== l) : [...levels, l])}
                className={cn("h-8 rounded-full border px-3 text-xs", on ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground")}
              >
                {l}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="grid gap-1.5 text-xs text-muted-foreground">
        Para que serve (opcional)
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ex.: aulas curtas de pronúncia" className={input} />
      </label>
      <div className="flex gap-2 pt-1">
        <button type="submit" className="h-10 rounded-full bg-foreground px-5 text-sm font-semibold text-background">
          Salvar
        </button>
        {onClose && (
          <button type="button" onClick={onClose} className="h-10 rounded-full border border-border px-5 text-sm hover:border-foreground">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
