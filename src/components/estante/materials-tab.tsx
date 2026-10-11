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
} from "@phosphor-icons/react";
import { langInfo, type Book } from "@/lib/books";
import { RESOURCE_KINDS, RESOURCE_LEVELS, type Resource, type ResourceKind, plainLevel, resourcesFor, siteOf } from "@/lib/resources";
import { useEstante, type ResourceMark, type ResourceStatus } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Segmented, useLang } from "./common";
import { MissionCard } from "./mission-card";

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

/** Free sites, playlists and dictionaries, by skill and level. Later stages (daily mission, playlists, word packs) also live here. */
export function MaterialsTab({ book, onGo, onOpen }: { book?: Book; onGo: (tab: string) => void; onOpen: (id: number) => void }) {
  const level = book?.lv;
  const lang = useLang();
  const { data, markResource } = useEstante();
  const all = resourcesFor(lang);
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
            Os materiais de {langInfo(lang).name.toLowerCase()} ainda não foram reunidos. Por enquanto só o inglês tem a lista; troque para EN no menu para ver.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5">
      {/* level and totals, on graphite */}
      <section className="grid gap-5 rounded-[1.75rem] bg-ink p-5 text-ink-foreground sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <Header />
          <dl className="flex gap-6">
            {[
              { label: shownLevel === "all" ? "materiais" : "no nível", value: atLevel.length },
              { label: "usando", value: count("doing") },
              { label: "feitos", value: count("done") },
            ].map((x) => (
              <div key={x.label}>
                <dt className="sr-only">{x.label}</dt>
                <dd className="text-3xl leading-none font-bold tabular">{x.value}</dd>
                <p className="mt-1 text-xs text-ink-muted">{x.label}</p>
              </div>
            ))}
          </dl>
        </div>
        <div className="grid gap-2">
          <p className="text-xs text-ink-muted">{mapLevel ? `Seu nível no mapa de leitura é ${mapLevel}. Troque para ver outros materiais.` : "Escolha um nível."}</p>
          <div role="radiogroup" aria-label="Nível" className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
            {["all", ...RESOURCE_LEVELS].map((l) => {
              const on = shownLevel === l;
              return (
                <button
                  key={l}
                  role="radio"
                  aria-checked={on}
                  onClick={() => (setLv(l), setKind("all"))}
                  className={cn("h-9 shrink-0 rounded-full border px-4 text-[13px] transition-colors", on ? "border-sand bg-sand font-semibold text-sand-foreground" : "border-ink-border text-ink-muted hover:text-ink-foreground")}
                >
                  {l === "all" ? "Todos" : l}
                  {l === mapLevel && <span className={cn("ml-1.5 text-[11px]", on ? "text-sand-foreground/70" : "text-ink-muted")}>· mapa</span>}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <MissionCard book={book} onGo={onGo} onOpen={onOpen} />

      {/* skills */}
      <section className="grid gap-3">
        <h2 className="text-sm font-semibold">Habilidades</h2>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
          {[{ value: "all" as const, label: "Todas" }, ...kinds].map((k) => (
            <button
              key={k.value}
              onClick={() => setKind(k.value)}
              aria-pressed={kind === k.value}
              className={cn("h-9 shrink-0 rounded-full border px-4 text-[13px] transition-colors", kind === k.value ? "border-ink bg-ink text-ink-foreground" : "border-border bg-card hover:border-foreground")}
            >
              {k.label}
            </button>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented id="res-status" label="Status" value={st} onChange={setSt} options={[{ value: "all", label: "Todos" }, ...STATUS]} />
        <p className="text-xs text-muted-foreground tabular">
          {list.length} {list.length === 1 ? "material" : "materiais"}
        </p>
      </div>

      {groups.length ? (
        groups.map((g) => {
          const Icon = KIND_ICON[g.value];
          return (
            <section key={g.value} className="grid gap-3">
              <h3 className="flex items-center gap-2 font-display text-xl">
                <Icon className="size-5" /> {g.label}
                <span className="text-xs font-normal text-muted-foreground tabular">{g.items.length}</span>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {g.items.map((r) => (
                  <ResourceCard key={r.id} r={r} mark={data.resources[r.id]} onMark={(patch) => markResource(r.id, patch)} />
                ))}
              </div>
            </section>
          );
        })
      ) : (
        <p className="rounded-[1.25rem] bg-muted/70 p-5 text-sm text-muted-foreground">Nenhum material com esses filtros.</p>
      )}

      <section className="rounded-[1.25rem] border border-dashed border-border p-5">
        <h3 className="text-sm font-semibold">Em breve nesta aba</h3>
        <ul className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          <li>· Pacotes de palavras frequentes para as Revisões</li>
          <li>· Teste de nível e adicionar seus próprios links</li>
        </ul>
      </section>
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

const levelRange = (levels: string[]) => (levels.length >= RESOURCE_LEVELS.length ? "todos os níveis" : levels.length === 1 ? levels[0] : `${levels[0]}–${levels[levels.length - 1]}`);

function ResourceCard({ r, mark, onMark }: { r: Resource; mark?: ResourceMark; onMark: (patch: Partial<Omit<ResourceMark, "d">>) => void }) {
  const Icon = KIND_ICON[r.kind];
  const [editing, setEditing] = useState(false);
  const tags = [levelRange(r.levels), r.siteLang === "pt" ? "site em português" : "site em inglês", r.minutes && `~${r.minutes} min`, r.signup && "cadastro grátis"].filter(Boolean) as string[];

  return (
    <article className={cn("grid content-start gap-3 rounded-[1.25rem] border bg-card p-4", mark?.st === "doing" ? "border-foreground" : "border-border")}>
      <div className="flex items-start gap-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", mark?.st === "done" ? "bg-ink text-ink-foreground" : "bg-muted")}>
          {mark?.st === "done" ? <CheckIcon weight="bold" className="size-4" /> : <Icon className="size-5" />}
        </span>
        <div className="min-w-0">
          <h4 className="leading-snug font-bold">{r.name}</h4>
          <p className="truncate text-xs text-muted-foreground">
            {siteOf(r.url)} · {KIND_LABEL[r.kind].toLowerCase()}
          </p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{r.note}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span key={t} className="rounded-full border border-border px-2 py-0.5 text-[11px]">
            {t}
          </span>
        ))}
      </div>

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
          <button onClick={() => setEditing(true)} className="rounded-xl bg-muted/70 px-3 py-2 text-left text-sm">
            {mark.note}
          </button>
        )
      )}

      {r.playlist && <LessonCounter name={r.name} lesson={mark?.lesson} onChange={(lesson) => onMark(lesson && !mark?.st ? { lesson, st: "doing" } : { lesson })} />}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <a
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-transform hover:scale-[1.03]"
        >
          {r.playlist ? (mark?.lesson ? `Continuar na aula ${mark.lesson}` : "Abrir no YouTube") : "Abrir"} <ArrowSquareOutIcon weight="bold" className="size-3.5" />
        </a>
        <div role="radiogroup" aria-label={`Status de ${r.name}`} className="inline-flex rounded-full border border-border p-0.5">
          {STATUS.map((s) => {
            const on = mark?.st === s.value;
            return (
              <button
                key={s.value}
                role="radio"
                aria-checked={on}
                onClick={() => onMark({ st: on ? undefined : s.value })}
                className={cn("h-7 rounded-full px-2.5 text-xs transition-colors", on ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div role="radiogroup" aria-label={`Nota para ${r.name}`} className="flex">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} role="radio" aria-checked={mark?.rating === n} aria-label={`${n} de 5`} onClick={() => onMark({ rating: mark?.rating === n ? undefined : n })} className="p-0.5 text-muted-foreground hover:text-foreground">
              <StarIcon weight={(mark?.rating ?? 0) >= n ? "fill" : "regular"} className={cn("size-4", (mark?.rating ?? 0) >= n && "text-foreground")} />
            </button>
          ))}
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
            {mark?.note ? "Editar nota" : "Anotar"}
          </button>
        )}
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
