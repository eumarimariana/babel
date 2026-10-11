"use client";

import { useMemo, useState } from "react";
import {
  ArrowSquareOutIcon,
  ArticleIcon,
  BookBookmarkIcon,
  ChalkboardTeacherIcon,
  CheckIcon,
  ClipboardTextIcon,
  CompassIcon,
  GameControllerIcon,
  HeadphonesIcon,
  LightbulbIcon,
  MinusIcon,
  NotePencilIcon,
  PenNibIcon,
  PlayCircleIcon,
  PlusIcon,
  SpeakerHighIcon,
  StarIcon,
  TextAaIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { langInfo, type Book } from "@/lib/books";
import { RESOURCE_KINDS, RESOURCE_LEVELS, type Resource, type ResourceKind, allResourcesFor, plainLevel, siteOf } from "@/lib/resources";
import { useEstante, type ResourceMark, type ResourceStatus } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useLang } from "./common";
import { MissionCard } from "./mission-card";
import { WordPacks } from "./word-packs";
import { AddLink } from "./add-link";
import { LevelTest } from "./level-test";

const KIND_ICON: Record<ResourceKind, typeof CompassIcon> = {
  grammar: TextAaIcon,
  vocab: NotePencilIcon,
  listening: HeadphonesIcon,
  reading: ArticleIcon,
  pronunciation: SpeakerHighIcon,
  writing: PenNibIcon,
  video: PlayCircleIcon,
  games: GameControllerIcon,
  course: ChalkboardTeacherIcon,
  test: ClipboardTextIcon,
  dictionary: BookBookmarkIcon,
  tips: LightbulbIcon,
};
const KIND_LABEL = Object.fromEntries(RESOURCE_KINDS.map((k) => [k.value, k.label])) as Record<ResourceKind, string>;
const STATUS: { value: ResourceStatus; label: string }[] = [
  { value: "want", label: "Quero usar" },
  { value: "doing", label: "Usando" },
  { value: "done", label: "Feito" },
];

/** Free sites, playlists and dictionaries by skill and level, plus the daily mission, the level test, word packs and your own links. */
export function MaterialsTab({ book, onGo, onOpen }: { book?: Book; onGo: (tab: string) => void; onOpen: (id: number) => void }) {
  const level = book?.lv;
  const lang = useLang();
  const { data, markResource, deleteResource } = useEstante();
  const all = allResourcesFor(lang, data.myResources);
  const mapLevel = plainLevel(level);
  const [lv, setLv] = useState<string | null>(null); // null = follow the reading map
  const shownLevel = lv ?? (mapLevel || "all");
  const [kind, setKind] = useState<ResourceKind | "all">("all");
  const [st, setSt] = useState<ResourceStatus | "all">("all");

  const atLevel = useMemo(() => all.filter((r) => shownLevel === "all" || r.levels.includes(shownLevel)), [all, shownLevel]);
  const list = atLevel.filter((r) => (kind === "all" || r.kind === kind) && (st === "all" || data.resources[r.id]?.st === st));
  const kinds = RESOURCE_KINDS.filter((k) => atLevel.some((r) => r.kind === k.value));
  const groups = RESOURCE_KINDS.map((k) => ({ ...k, items: list.filter((r) => r.kind === k.value) })).filter((g) => g.items.length);
  const count = (s: ResourceStatus) => all.filter((r) => data.resources[r.id]?.st === s).length;

  if (!all.length) {
    return (
      <div className="grid gap-5">
        <section className="rounded-[1.75rem] bg-ink p-6 text-ink-foreground">
          <Header />
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-muted">
            Os materiais de {langInfo(lang).name.toLowerCase()} ainda não foram reunidos. Por enquanto só o inglês tem a lista; troque para EN no menu para ver, ou adicione os seus links abaixo.
          </p>
        </section>
        <AddLink lang={lang} level={mapLevel || undefined} />
      </div>
    );
  }

  const doing = all.filter((r) => data.resources[r.id]?.st === "doing");
  const clearFilters = () => (setLv(null), setKind("all"), setSt("all"));

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* today */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <MissionCard book={book} onGo={onGo} onOpen={onOpen} />
        <LevelTest lang={lang} onOpen={onOpen} />
      </div>

      {/* what you are using now, one tap away */}
      {doing.length > 0 && (
        <section className="grid gap-3">
          <SectionTitle title="Continuando" count={doing.length} />
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
            {doing.map((r) => {
              const Icon = KIND_ICON[r.kind];
              const lesson = data.resources[r.id]?.lesson;
              return (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-64 shrink-0 snap-start items-center gap-3 rounded-[1.25rem] bg-ink p-3 pr-4 text-ink-foreground transition-transform hover:-translate-y-0.5"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-sand-foreground">
                    <Icon weight="bold" className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.name}</span>
                    <span className="block truncate text-xs text-ink-muted">{lesson ? `continuar na aula ${lesson}` : `${KIND_LABEL[r.kind]} · ${siteOf(r.url)}`}</span>
                  </span>
                  <ArrowSquareOutIcon className="size-4 shrink-0 text-ink-muted" />
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* catalog: every filter in one panel */}
      <section className="grid gap-5">
        <div className="grid gap-4 rounded-[1.75rem] bg-ink p-5 text-ink-foreground sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div>
              <h2 className="font-display text-2xl leading-tight">Catálogo grátis</h2>
              <p className="mt-0.5 text-xs text-ink-muted">sites, vídeos e dicionários para estudar além dos livros</p>
            </div>
            <p className="text-xs text-ink-muted tabular">
              <span className="text-ink-foreground">{count("doing")}</span> usando · <span className="text-ink-foreground">{count("done")}</span> feitos · {all.length} no total
            </p>
          </div>
          <FilterRow label="Nível">
            {["all", ...RESOURCE_LEVELS].map((l) => (
              <Chip key={l} on={shownLevel === l} onClick={() => (setLv(l), setKind("all"))}>
                {l === "all" ? "Todos" : l}
                {l === mapLevel && <span className="ml-1 opacity-60">· mapa</span>}
              </Chip>
            ))}
          </FilterRow>
          <FilterRow label="Habilidade">
            {[{ value: "all" as const, label: "Todas" }, ...kinds].map((k) => (
              <Chip key={k.value} on={kind === k.value} onClick={() => setKind(k.value)}>
                {k.label}
              </Chip>
            ))}
          </FilterRow>
          <FilterRow label="Status">
            {[{ value: "all" as const, label: "Todos" }, ...STATUS].map((s) => (
              <Chip key={s.value} on={st === s.value} onClick={() => setSt(s.value)}>
                {s.label}
              </Chip>
            ))}
          </FilterRow>
        </div>

        <p className="-mt-1 text-sm text-muted-foreground tabular">
          {list.length} {list.length === 1 ? "material" : "materiais"}
          {shownLevel !== "all" && ` no ${shownLevel}`}
          {kind !== "all" && ` · ${KIND_LABEL[kind].toLowerCase()}`}
        </p>

        {groups.length ? (
          // columns instead of a grid: sections of 1 or 3 cards pack together without empty half-rows
          <div className="gap-5 md:columns-2 2xl:columns-3">
            {groups.map((g, i) => (
              <section key={g.value} className="contents">
                {kind === "all" && (
                  <div className={cn("mb-3 break-after-avoid", i > 0 && "pt-4")}>
                    <SectionTitle icon={KIND_ICON[g.value]} title={g.label} count={g.items.length} />
                  </div>
                )}
                {g.items.map((r) => (
                  <div key={r.id} className="mb-3 break-inside-avoid">
                    <ResourceCard r={r} mark={data.resources[r.id]} onMark={(patch) => markResource(r.id, patch)} onDelete={r.mine ? () => deleteResource(r.id) : undefined} />
                  </div>
                ))}
              </section>
            ))}
          </div>
        ) : (
          <div className="grid justify-items-center gap-3 rounded-[1.5rem] border-2 border-dashed border-border px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">Nenhum material com esses filtros.</p>
            <button onClick={clearFilters} className="h-9 rounded-full bg-ink px-4 text-xs font-semibold text-ink-foreground">
              Limpar filtros
            </button>
          </div>
        )}

        <AddLink lang={lang} level={shownLevel === "all" ? undefined : shownLevel} />
      </section>

      {lang === "en" && <WordPacks onGoReview={() => onGo("review")} />}
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-full bg-sand text-sand-foreground">
        <CompassIcon weight="fill" className="size-5" />
      </span>
      <div>
        <h2 className="font-display text-xl">Materiais grátis</h2>
        <p className="text-xs text-ink-muted">sites, vídeos e dicionários para estudar além dos livros</p>
      </div>
    </div>
  );
}

function SectionTitle({ title, count, icon: Icon }: { title: string; count: number; icon?: typeof CompassIcon }) {
  return (
    <h3 className="flex items-center gap-2 font-display text-lg">
      {Icon && <Icon className="size-5" />} {title}
      <span className="text-xs font-normal text-muted-foreground tabular">{count}</span>
    </h3>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-t border-ink-border pt-4 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:items-center">
      <p className="text-xs text-ink-muted">{label}</p>
      <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-pressed={on}
      onClick={onClick}
      className={cn("h-8 shrink-0 rounded-full border px-3.5 text-[13px] transition-colors", on ? "border-sand bg-sand font-semibold text-sand-foreground" : "border-ink-border text-ink-muted hover:text-ink-foreground")}
    >
      {children}
    </button>
  );
}

const levelRange = (levels: string[]) => (levels.length >= RESOURCE_LEVELS.length ? "todos os níveis" : levels.length === 1 ? levels[0] : `${levels[0]}–${levels[levels.length - 1]}`);

function ResourceCard({ r, mark, onMark, onDelete }: { r: Resource; mark?: ResourceMark; onMark: (patch: Partial<Omit<ResourceMark, "d">>) => void; onDelete?: () => void }) {
  const Icon = KIND_ICON[r.kind];
  const [editing, setEditing] = useState(false);
  const meta = [levelRange(r.levels), !r.mine && (r.siteLang === "pt" ? "em português" : "em inglês"), r.minutes && `~${r.minutes} min`, r.signup && "cadastro grátis"].filter(Boolean).join(" · ");
  const rating = mark?.rating ?? 0;

  return (
    <article className={cn("grid content-start gap-3 rounded-[1.25rem] border bg-card p-4 transition-colors", mark?.st === "doing" ? "border-foreground" : "border-border hover:border-foreground/40")}>
      <div className="flex items-start gap-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", mark?.st === "done" ? "bg-ink text-ink-foreground" : mark?.st === "doing" ? "bg-sand text-sand-foreground" : "bg-muted")}>
          {mark?.st === "done" ? <CheckIcon weight="bold" className="size-4" /> : <Icon className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="leading-snug font-bold">
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
              {r.name}
            </a>
            {r.mine && <span className="ml-2 rounded-full bg-sand px-2 py-0.5 align-middle text-[10px] font-semibold text-sand-foreground">seu link</span>}
          </h4>
          <p className="truncate text-xs text-muted-foreground">{siteOf(r.url)}</p>
        </div>
        <div role="radiogroup" aria-label={`Nota para ${r.name}`} className="-mt-0.5 -mr-1 flex shrink-0">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} role="radio" aria-checked={mark?.rating === n} aria-label={`${n} de 5`} onClick={() => onMark({ rating: mark?.rating === n ? undefined : n })} className="p-0.5 text-muted-foreground/60 hover:text-foreground">
              <StarIcon weight={rating >= n ? "fill" : "regular"} className={cn("size-3.5", rating >= n && "text-foreground")} />
            </button>
          ))}
        </div>
      </div>

      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground" title={r.note}>
        {r.note}
      </p>
      <p className="text-[11px] text-muted-foreground tabular">{meta}</p>

      {r.playlist && <LessonCounter name={r.name} lesson={mark?.lesson} onChange={(lesson) => onMark(lesson && !mark?.st ? { lesson, st: "doing" } : { lesson })} />}

      {editing ? (
        <input
          autoFocus
          defaultValue={mark?.note ?? ""}
          placeholder="ex.: bom para phrasal verbs"
          aria-label={`Anotação sobre ${r.name}`}
          onBlur={(e) => (onMark({ note: e.target.value.trim() || undefined }), setEditing(false))}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") setEditing(false);
          }}
          className="h-9 rounded-full border border-border bg-background px-3.5 text-sm outline-none focus-visible:border-foreground"
        />
      ) : (
        mark?.note && (
          <button onClick={() => setEditing(true)} className="flex items-start gap-2 rounded-xl bg-muted/70 px-3 py-2 text-left text-sm">
            <NotePencilIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            {mark.note}
          </button>
        )
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <a
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-[13px] font-semibold text-background transition-transform hover:scale-[1.03]"
        >
          {r.playlist ? (mark?.lesson ? `Aula ${mark.lesson}` : "YouTube") : "Abrir"} <ArrowSquareOutIcon weight="bold" className="size-3.5" />
        </a>
        <div role="radiogroup" aria-label={`Status de ${r.name}`} className="inline-flex rounded-full bg-muted p-0.5">
          {STATUS.map((s) => {
            const on = mark?.st === s.value;
            return (
              <button
                key={s.value}
                role="radio"
                aria-checked={on}
                onClick={() => onMark({ st: on ? undefined : s.value })}
                className={cn("h-7 rounded-full px-2.5 text-xs transition-colors", on ? "bg-card font-semibold text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex">
          {!editing && (
            <button onClick={() => setEditing(true)} aria-label={mark?.note ? `Editar nota de ${r.name}` : `Anotar sobre ${r.name}`} title={mark?.note ? "Editar nota" : "Anotar"} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
              <NotePencilIcon className="size-4" />
            </button>
          )}
          {onDelete && (
            <button onClick={() => confirm(`Apagar “${r.name}” dos seus links?`) && onDelete()} aria-label={`Apagar ${r.name}`} title="Apagar" className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive">
              <TrashIcon className="size-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/** "Parei na aula N": YouTube has no stable link to a playlist position without the video id, so the app just remembers the number. */
function LessonCounter({ name, lesson, onChange }: { name: string; lesson?: number; onChange: (lesson: number | undefined) => void }) {
  const step = "grid size-7 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-40";
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/70 px-3 py-2">
      <p className="text-sm" aria-live="polite">
        {lesson ? (
          <>
            Parei na <span className="font-bold tabular">aula {lesson}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Ainda não comecei</span>
        )}
      </p>
      <div className="flex items-center gap-1.5">
        <button aria-label={`Voltar uma aula em ${name}`} disabled={!lesson} onClick={() => onChange(lesson && lesson > 1 ? lesson - 1 : undefined)} className={step}>
          <MinusIcon weight="bold" className="size-3.5" />
        </button>
        <button aria-label={`Avançar uma aula em ${name}`} onClick={() => onChange((lesson ?? 0) + 1)} className={step}>
          <PlusIcon weight="bold" className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
