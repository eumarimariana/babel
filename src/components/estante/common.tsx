"use client";

import { createContext, useContext, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowRightIcon, CaretLeftIcon, CaretRightIcon, BookOpenIcon, BookOpenTextIcon, BookmarkSimpleIcon, CheckIcon, CircleIcon, SpeakerHighIcon } from "@phosphor-icons/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { basesFor, coverUrls, langInfo, levelColor, type Book, type Lang } from "@/lib/books";
import type { Status } from "@/lib/store";
import { pronounce } from "@/lib/pronounce";
import { toast } from "sonner";

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

let warned = false;
/** Says a word or passage (device voice, or a Wiktionary recording); tells once when nothing can be played. */
export function speak(text: string, lang: Lang = "en", rate = 0.9) {
  pronounce(text, lang, rate).then((ok) => {
    if (ok || warned) return;
    warned = true;
    toast.info(`Seu navegador não tem voz em ${langInfo(lang).name.toLowerCase()} e não achei uma gravação de “${text.slice(0, 40)}”.`, {
      description: "Palavras soltas tocam a gravação do Wiktionary. Para frases, ative a voz do sistema no navegador.",
    });
  });
}

export function SpeakButton({ text, lang }: { text: string; lang?: Lang }) {
  const current = useLang();
  return (
    <Button variant="ghost" size="icon-sm" aria-label={`Ouvir ${text}`} onClick={(e) => (e.stopPropagation(), speak(text, lang ?? current))}>
      <SpeakerHighIcon />
    </Button>
  );
}

/** Cambridge dataset per language: English → Portuguese, the others into English (Cambridge has no FR/DE/ES → PT). */
const CAMBRIDGE: Record<Lang, string> = { en: "english-portuguese", fr: "french-english", de: "german-english", es: "spanish-english" };

/** Cambridge's search jumps straight to the entry, works for phrases ("look forward to") and suggests spellings otherwise. */
export const cambridgeUrl = (word: string, lang: Lang) =>
  `https://dictionary.cambridge.org/search/direct/?datasetsearch=${CAMBRIDGE[lang]}&q=${encodeURIComponent(word.trim())}`;

export function DictButton({ word, lang, className }: { word: string; lang?: Lang; className?: string }) {
  const current = useLang();
  return (
    <a
      href={cambridgeUrl(word, lang ?? current)}
      target="_blank"
      rel="noreferrer"
      aria-label={`Abrir ${word} no Cambridge`}
      title="Abrir no Cambridge"
      onClick={(e) => e.stopPropagation()}
      className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), className)}
    >
      <BookOpenTextIcon />
    </a>
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
  return (
    <div className={cn("relative aspect-[274/400] overflow-hidden rounded-[0.35rem] bg-muted ring-1 ring-foreground/10", className)}>
      {/* keyed by book, so the fallback state starts fresh when the same slot shows another book */}
      <CoverImage key={`${book.id}-${size}`} book={book} size={size} priority={priority} />
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

/** The cover picture: tries each source in turn and falls back to a typeset cover when none loads. */
function CoverImage({ book, size, priority }: { book: Book; size: "xs" | "md" | "lg"; priority?: boolean }) {
  const urls = coverUrls(book, size);
  const [i, setI] = useState(0);
  const src = urls[i];
  const w = { xs: 137, md: 274, lg: 549 }[size];

  if (!src)
    return (
      <div className="flex size-full flex-col justify-between bg-secondary p-3">
        <span className="text-[11px] tracking-wider text-muted-foreground uppercase tabular">{book.lv}</span>
        <span className="font-display text-base leading-tight">{book.t}</span>
      </div>
    );

  return (
    <Image
      src={src}
      alt={`Capa de ${book.t}`}
      width={w}
      height={Math.round((w * 400) / 274)}
      unoptimized
      priority={priority}
      loading={priority ? undefined : "lazy"}
      onError={() => setI((n) => n + 1)}
      className="size-full object-cover"
    />
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

/** The heading every section of a tab uses: title, an optional muted count, an optional link-style action on the right. */
export function SectionHead({ title, count, action, onAction }: { title: string; count?: React.ReactNode; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex min-w-0 flex-wrap items-baseline gap-x-2 font-display text-lg">
        <span className="whitespace-nowrap">{title}</span>
        {count != null && <span className="font-sans text-xs text-muted-foreground tabular">{count}</span>}
      </h2>
      {action && onAction && (
        <button onClick={onAction} className="flex shrink-0 items-center gap-1 text-xs underline underline-offset-4 hover:text-muted-foreground tabular">
          {action} <ArrowRightIcon className="size-3" />
        </button>
      )}
    </div>
  );
}

/** The small primary button (Abrir, Importar…) used on the cards of the Materials tab. */
export const BTN = "inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-[13px] font-semibold text-background transition-transform hover:scale-[1.03] disabled:pointer-events-none disabled:opacity-50";

/**
 * A horizontal shelf of cards, like the Estante's: title and count on top, arrows to scroll,
 * and "mais" to open it as a grid. Children are the cards; each gets a fixed width while scrolling.
 */
export function ScrollRow({ title, icon: Icon, meta, count, children, startAt = 0, section }: { title: string; icon?: React.ElementType; meta?: React.ReactNode; count: number; children: React.ReactNode[]; startAt?: number; section?: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const scroll = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.85, behavior: "smooth" });
  const many = count > 2;

  return (
    <section className="grid min-w-0 grid-cols-1 gap-3">
      <header className="flex min-h-8 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {/* `section`: a top-level section of the tab, titled like SectionHead; otherwise a shelf inside one */}
          <h3 className={cn("flex items-center gap-2 whitespace-nowrap", section ? "font-display text-lg" : "text-base font-semibold")}>
            {Icon && <Icon className="size-5 shrink-0" />}
            {title}
          </h3>
          <span className="truncate text-xs text-muted-foreground tabular">{meta ?? count}</span>
        </div>
        {many && (
          <div className="flex shrink-0 items-center gap-1">
            {!expanded && (
              <span className="hidden gap-1 sm:flex">
                <button aria-label={`Rolar ${title} para a esquerda`} onClick={() => scroll(-1)} className="grid size-8 place-items-center rounded-full border border-border hover:border-foreground">
                  <CaretLeftIcon weight="bold" className="size-3.5" />
                </button>
                <button aria-label={`Rolar ${title} para a direita`} onClick={() => scroll(1)} className="grid size-8 place-items-center rounded-full bg-ink text-ink-foreground">
                  <CaretRightIcon weight="bold" className="size-3.5" />
                </button>
              </span>
            )}
            <button onClick={() => setExpanded((e) => !e)} className="px-2 text-xs underline underline-offset-4 hover:text-muted-foreground tabular">
              {expanded ? "menos" : "mais"}
            </button>
          </div>
        )}
      </header>
      <div
        ref={(el) => {
          scroller.current = el;
          // open the shelf at the first card worth seeing (e.g. the next word pack)
          if (el && startAt && !el.dataset.started) {
            el.dataset.started = "1";
            const child = el.children[startAt] as HTMLElement | undefined;
            if (child) el.scrollLeft = child.offsetLeft - el.offsetLeft;
          }
        }}
        className={cn(
          expanded
            ? "grid items-start gap-3 md:grid-cols-2 2xl:grid-cols-3"
            : "-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:scroll-px-0 sm:px-0 [&>*]:w-[min(23rem,calc(100vw-3rem))] [&>*]:shrink-0 [&>*]:snap-start",
        )}
      >
        {children}
      </div>
    </section>
  );
}
