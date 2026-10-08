import type { Lang } from "@/lib/books";
import enResources from "@/data/recursos-en.json";

/** Free study sites, playlists and dictionaries. Only links: the content stays on each site. */
export type ResourceKind = "grammar" | "vocab" | "listening" | "reading" | "games" | "course" | "test" | "dictionary" | "video" | "pronunciation" | "writing" | "tips";
export type Resource = {
  id: string;
  name: string;
  url: string;
  kind: ResourceKind;
  levels: string[]; // CEFR levels the material serves
  siteLang: "pt" | "en";
  signup?: boolean; // asks for a (free) account
  minutes?: number; // a typical session
  topics?: string[]; // grammar topics, for linking with the books later
  playlist?: string; // YouTube playlist id
  note: string;
};

export const RESOURCE_KINDS: { value: ResourceKind; label: string }[] = [
  { value: "grammar", label: "Gramática" },
  { value: "vocab", label: "Vocabulário" },
  { value: "listening", label: "Escuta" },
  { value: "reading", label: "Leitura" },
  { value: "pronunciation", label: "Pronúncia" },
  { value: "writing", label: "Escrita" },
  { value: "video", label: "Vídeos" },
  { value: "games", label: "Jogos" },
  { value: "course", label: "Cursos" },
  { value: "test", label: "Testes" },
  { value: "dictionary", label: "Dicionários" },
  { value: "tips", label: "Dicas" },
];

export const RESOURCE_LEVELS = ["Pre-A1", "A1", "A2", "B1", "B2", "C1"];

/** Book levels like "A1.1" or "A2/B1" mapped onto the plain CEFR steps the materials use. */
export function plainLevel(lv: string | undefined) {
  if (!lv) return "";
  if (lv.startsWith("Pre")) return "Pre-A1";
  if (lv.startsWith("A1")) return "A1";
  if (lv.startsWith("A2")) return "A2";
  return RESOURCE_LEVELS.includes(lv) ? lv : "";
}

const BY_LANG: Partial<Record<Lang, Resource[]>> = { en: enResources as Resource[] };
export const resourcesFor = (lang: Lang) => BY_LANG[lang] ?? [];

export const siteOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");
