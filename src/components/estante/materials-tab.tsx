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
import { RESOURCE_KINDS, RESOURCE_LEVELS, type Resource, type ResourceKind, allResourcesFor, lessonUrl, siteOf } from "@/lib/resources";
import { learnerLevel } from "@/lib/recommend";
import { useEstante, type ResourceMark, type ResourceStatus } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BTN, ScrollRow, SectionHead, useLang } from "./common";
import { MissionCard } from "./mission-card";
import { WordPacks } from "./word-packs";
import { BrazilPacks } from "./br-packs";
import { GrammarPractice } from "./grammar-practice";
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
  const lang = useLang();
  const { data, markResource, deleteResource } = useEstante();
  const all = allResourcesFor(lang, data.myResources);
  const mapLevel = learnerLevel(data, lang); // placement test and books read
  const [lv, setLv] = useState<string | null>(null); // null = follow the reading map
  const shownLevel = lv ?? (mapLevel || "all");
  const [kind, setKind] = useState<ResourceKind | "all">("all");
  const [st, setSt] = useState<ResourceStatus | "all">("all");
  const [adding, setAdding] = useState(false);

  const atLevel = useMemo(() => all.filter((r) => shownLevel === "all" || r.levels.includes(shownLevel)), [all, shownLevel]);
  const ofKind = atLevel.filter((r) => kind === "all" || r.kind === kind);
  const list = ofKind.filter((r) => st === "all" || data.resources[r.id]?.st === st);
  const kinds = RESOURCE_KINDS.filter((k) => atLevel.some((r) => r.kind === k.value));
  const groups = RESOURCE_KINDS.map((k) => ({ ...k, items: list.filter((r) => r.kind === k.value) })).filter((g) => g.items.length);
  const doing = all.filter((r) => data.resources[r.id]?.st === "doing");
  const clearFilters = () => (setLv(null), setKind("all"), setSt("all"));
  const card = (r: Resource) => <ResourceCard key={r.id} r={r} mark={data.resources[r.id]} onMark={(patch) => markResource(r.id, patch)} onDelete={r.mine ? () => deleteResource(r.id) : undefined} />;

  if (!all.length) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <section className="grid gap-3">
          <SectionHead title="Materiais" />
          <p className="max-w-xl text-sm text-muted-foreground">
            Os materiais de {langInfo(lang).name.toLowerCase()} ainda não foram reunidos. Por enquanto só o inglês tem a lista; troque para EN no menu para ver, ou adicione os seus links abaixo.
          </p>
          <AddLink lang={lang} level={mapLevel || undefined} />
        </section>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8">
      {/* today */}
      <section className="grid gap-3">
        <SectionHead title="Hoje" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <MissionCard book={book} onGo={onGo} onOpen={onOpen} />
          <LevelTest lang={lang} onOpen={onOpen} />
        </div>
      </section>

      {/* what you are using now, one tap away */}
      {doing.length > 0 && (
        <section className="grid gap-3">
          <SectionHead title="Continuando" count={doing.length} action="Ver todos" onAction={() => (setLv("all"), setKind("all"), setSt("doing"))} />
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
            {doing.map((r) => {
              const Icon = KIND_ICON[r.kind];
              const lesson = data.resources[r.id]?.lesson;
              return (
                <a
                  key={r.id}
                  href={lessonUrl(r, lesson)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-64 shrink-0 snap-start items-center gap-3 rounded-[1.25rem] border border-foreground bg-card p-3 pr-4 transition-colors hover:bg-muted/60"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-sand-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{lesson ? `continuar na aula ${lesson}` : `${KIND_LABEL[r.kind]} · ${siteOf(r.url)}`}</span>
                  </span>
                  <ArrowSquareOutIcon className="size-4 shrink-0 text-muted-foreground" />
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* the catalog */}
      <section className="grid gap-4">
        <SectionHead
          title="Catálogo grátis"
          count={`${list.length} ${list.length === 1 ? "material" : "materiais"}${shownLevel !== "all" ? ` no ${shownLevel}` : ""}`}
          action={adding ? undefined : "Adicionar link"}
          onAction={() => setAdding(true)}
        />
        {adding && <AddLink lang={lang} level={shownLevel === "all" ? undefined : shownLevel} onClose={() => setAdding(false)} />}

        <div className="grid gap-3 rounded-[1.5rem] border border-border bg-card p-4 sm:p-5">
          <FilterRow label="Nível">
            {["all", ...RESOURCE_LEVELS].map((l) => (
              <Chip key={l} on={shownLevel === l} onClick={() => (setLv(l), setKind("all"))}>
                {l === "all" ? "Todos" : l}
                {l === mapLevel && <span className="opacity-60"> · seu nível</span>}
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
            {[{ value: "all" as const, label: "Todos" }, ...STATUS].map((s) => {
              const n = s.value === "all" ? ofKind.length : ofKind.filter((r) => data.resources[r.id]?.st === s.value).length;
              return (
                <Chip key={s.value} on={st === s.value} onClick={() => setSt(s.value)}>
                  {s.label} <span className="opacity-60 tabular">{n}</span>
                </Chip>
              );
            })}
          </FilterRow>
        </div>

        {groups.length === 0 ? (
          <div className="grid justify-items-center gap-3 rounded-[1.5rem] border-2 border-dashed border-border px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">Nenhum material com esses filtros.</p>
            <button onClick={clearFilters} className={BTN}>
              Limpar filtros
            </button>
          </div>
        ) : kind !== "all" || groups.length === 1 ? (
          <div className="grid items-start gap-3 md:grid-cols-2 2xl:grid-cols-3">{list.map(card)}</div>
        ) : (
          // one shelf per skill, scrolling sideways like the Estante
          <div className="grid grid-cols-1 gap-6">
            {groups.map((g) => (
              <ScrollRow key={g.value} title={g.label} icon={KIND_ICON[g.value]} count={g.items.length} meta={`${g.items.length} ${g.items.length === 1 ? "material" : "materiais"}`}>
                {g.items.map(card)}
              </ScrollRow>
            ))}
          </div>
        )}
      </section>

      {lang === "en" && <GrammarPractice level={mapLevel} />}
      {lang === "en" && <WordPacks onGoReview={() => onGo("review")} />}
      {lang === "en" && <BrazilPacks onGoReview={() => onGo("review")} />}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[6rem_minmax(0,1fr)] sm:items-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-pressed={on}
      onClick={onClick}
      className={cn("h-8 shrink-0 rounded-full border px-3.5 text-[13px] transition-colors", on ? "border-ink bg-ink font-semibold text-ink-foreground" : "border-border bg-background hover:border-foreground")}
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
    <article className={cn("flex h-full flex-col gap-3 rounded-[1.25rem] border bg-card p-4 transition-colors", mark?.st === "doing" ? "border-foreground" : "border-border hover:border-foreground/40")}>
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
          href={lessonUrl(r, mark?.lesson)}
          target="_blank"
          rel="noopener noreferrer"
          className={BTN}
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
                className={cn("h-7 rounded-full px-2 text-xs transition-colors", on ? "bg-card font-semibold text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
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
