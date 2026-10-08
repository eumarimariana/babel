"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { BookOpenIcon, BookmarkSimpleIcon, CheckIcon, CircleIcon, SpeakerHighIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { basesFor, coverUrl, langInfo, levelColor, type Book, type Lang } from "@/lib/books";
import type { Status } from "@/lib/store";

export type Option = { value: string; label: string };

export function SimpleSelect({
  value,
  onChange,
  options,
  className,
  label,
  size,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  className?: string;
  label: string;
  size?: "sm" | "default";
}) {
  return (
    <Select items={options} value={value} onValueChange={(v) => onChange((v as string | null) ?? options[0].value)}>
      <SelectTrigger size={size} aria-label={label} className={cn("min-w-0", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function LevelTag({ lv, className }: { lv: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs whitespace-nowrap", className)}>
      <span className="size-2 rounded-[2px] ring-1 ring-foreground/20" style={{ background: levelColor(lv) }} />
      {lv}
    </span>
  );
}

export const STATUS_LABEL: Record<Status | "", string> = { "": "Não lido", want: "Quero ler", reading: "Lendo", done: "Lido" };
export const STATUS_OPTIONS: Option[] = [
  { value: "none", label: "Não lido" },
  { value: "want", label: "Quero ler" },
  { value: "reading", label: "Lendo" },
  { value: "done", label: "Lido" },
];

const statusTone: Record<Status | "", string> = {
  "": "",
  want: "border-foreground",
  reading: "border-foreground bg-foreground text-background [&_svg]:text-background",
  done: "border-transparent bg-secondary text-muted-foreground",
};

export function StatusSelect({ value, onChange, title }: { value: Status | ""; onChange: (v: Status | "") => void; title: string }) {
  return (
    <SimpleSelect
      size="sm"
      label={`Status de ${title}`}
      value={value || "none"}
      onChange={(v) => onChange(v === "none" ? "" : (v as Status))}
      options={STATUS_OPTIONS}
      className={cn("w-[7.25rem] shrink-0 rounded-full", statusTone[value])}
    />
  );
}

/** The language being studied (the active profile). */
export const LangContext = createContext<Lang>("en");
export const useLang = () => useContext(LangContext);

/** Book picker options for the language being studied, grouped by base. */
export function useBookOptions(withNone: boolean): Option[] {
  const lang = useLang();
  return useMemo(() => {
    const opts = basesFor(lang).flatMap((d) => d.books.map((b, i) => ({ value: String(b.id), label: `${d.id === "eli" ? `${i + 1}.` : `${d.name} ·`} ${b.t} (${b.lv})` })));
    return withNone ? [{ value: "none", label: "Nenhum livro" }, ...opts] : opts;
  }, [lang, withNone]);
}

export function speak(text: string, lang: Lang = "en") {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langInfo(lang).voice;
    // pick an installed voice for that language when there is one
    const voice = speechSynthesis.getVoices().find((v) => v.lang.replace("_", "-").startsWith(u.lang.slice(0, 2)));
    if (voice) u.voice = voice;
    u.rate = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {
    /* speech not available */
  }
}

export function SpeakButton({ text, lang }: { text: string; lang?: Lang }) {
  const current = useLang();
  return (
    <Button variant="ghost" size="icon-sm" aria-label={`Ouvir ${text}`} onClick={(e) => (e.stopPropagation(), speak(text, lang ?? current))}>
      <SpeakerHighIcon />
    </Button>
  );
}

export function MemoryBoxes({ box }: { box: number }) {
  return (
    <span className="inline-flex gap-0.5 align-middle" title={`Memória ${box} de 6`}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <span key={i} className={cn("h-3 w-1.5 rounded-[2px]", i <= box ? "bg-foreground" : "bg-input")} />
      ))}
    </span>
  );
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export const STATUS_ICON = { "": CircleIcon, want: BookmarkSimpleIcon, reading: BookOpenIcon, done: CheckIcon } as const;

/** Four-way segmented control for a book's status: bigger and clearer than a select on the book screen. */
export function StatusPicker({ value, onChange, tone }: { value: Status | ""; onChange: (v: Status | "") => void; tone?: "ink" }) {
  const items: (Status | "")[] = ["", "want", "reading", "done"];
  return (
    <div role="radiogroup" aria-label="Status do livro" className={cn("grid grid-cols-4 gap-1 rounded-[1.4rem] border p-1 sm:rounded-full", tone === "ink" ? "border-ink-border" : "border-border")}>
      {items.map((v) => {
        const Icon = STATUS_ICON[v];
        const on = value === v;
        return (
          <button
            key={v || "none"}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(v)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 rounded-[1.1rem] px-1 py-1.5 text-[11px] font-medium transition-all sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-2 sm:text-xs",
              tone === "ink"
                ? on
                  ? "bg-sand text-sand-foreground"
                  : "text-ink-muted hover:text-ink-foreground"
                : on
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            <span className="whitespace-nowrap">{STATUS_LABEL[v]}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Book cover from the ELi CDN, with a typographic fallback in the level colour. */
export function BookCover({ book, status, size = "md", className, priority }: { book: Book; status?: Status | ""; size?: "xs" | "md" | "lg"; className?: string; priority?: boolean }) {
  const src = coverUrl(book, size);
  const w = { xs: 137, md: 274, lg: 549 }[size];
  return (
    <div className={cn("relative aspect-[274/400] overflow-hidden rounded-[0.35rem] bg-muted ring-1 ring-foreground/10", className)}>
      {src ? (
        <Image src={src} alt={`Capa de ${book.t}`} width={w} height={Math.round((w * 400) / 274)} unoptimized priority={priority} loading={priority ? undefined : "lazy"} className="size-full object-cover" />
      ) : (
        <div className="flex size-full flex-col justify-between bg-secondary p-3">
          <span className="text-[11px] tracking-wider text-muted-foreground uppercase tabular">{book.lv}</span>
          <span className="font-display text-base leading-tight">{book.t}</span>
        </div>
      )}
      {status === "done" && (
        <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-foreground text-background" title="Lido">
          <CheckIcon weight="bold" className="size-3" />
        </span>
      )}
      {status === "reading" && (
        <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-foreground text-background" title="Lendo">
          <BookOpenIcon weight="bold" className="size-3" />
        </span>
      )}
      {status === "want" && (
        <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full border border-foreground bg-background text-foreground" title="Quero ler">
          <BookmarkSimpleIcon weight="bold" className="size-3" />
        </span>
      )}
    </div>
  );
}

export function useMediaQuery(query: string, serverValue = true) {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => matchMedia(query).matches,
    () => serverValue,
  );
}

/** Segmented control with a sliding pill (motion layoutId). */
export function Segmented<T extends string>({ value, onChange, options, label, id }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: React.ReactNode }[]; label: string; id: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-border p-0.5">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn("relative flex h-7 items-center gap-1.5 rounded-full px-3 text-xs tracking-wide uppercase transition-colors [&_svg]:size-4", on ? "text-background" : "text-muted-foreground hover:text-foreground")}
          >
            {on && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-full bg-foreground" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="relative flex items-center gap-1.5">
              {o.icon}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
