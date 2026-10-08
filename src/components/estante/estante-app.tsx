"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { IconContext, ArrowRightIcon, BooksIcon, CheckIcon, CardsIcon, GearSixIcon, GraduationCapIcon, HouseIcon, MagnifyingGlassIcon, MoonIcon, NotePencilIcon, QuotesIcon, SunIcon, TranslateIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ALL_BOOKS, BOOKS, BOOK_BY_ID, type Base, type Book, STAGES, baseBooks } from "@/lib/books";
import { EstanteProvider, useEstante } from "@/lib/store";
import { activeProviderName, subscribeAi, useAiConfig } from "@/lib/ai-client";
import { BooksTab } from "./books-tab";
import { VocabTab } from "./vocab-tab";
import { ReviewTab } from "./review-tab";
import { StudyTab } from "./study-tab";
import { QuotesTab } from "./quotes-tab";
import { AiDialog, SettingsDialog } from "./settings-dialog";
import { CelebrationPlayer } from "./players";
import { HomeTab } from "./home-tab";
import { BookPanel, BookScreen } from "./book-screen";
import { BabelLogo } from "./logo";
import { useMediaQuery } from "./common";
import { cn } from "@/lib/utils";

const ICONS = { weight: "regular" as const, size: "1em" };

export function EstanteApp() {
  return (
    <EstanteProvider>
      <IconContext.Provider value={ICONS}>
        <Shell />
      </IconContext.Provider>
    </EstanteProvider>
  );
}

function Shell() {
  const { data, ready, status, streak, due } = useEstante();
  const [tab, setTab] = useState("home");
  const [openBook, setOpenBook] = useState<number | null>(null);
  const aiName = useSyncExternalStore(subscribeAi, activeProviderName, () => "");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const aiConfig = useAiConfig();
  const aiModel = aiConfig.active ? (aiConfig.modelLists[aiConfig.active]?.find((m) => m.id === aiConfig.models[aiConfig.active!])?.label ?? aiConfig.modelLists[aiConfig.active]?.[0]?.label ?? "") : "";
  const [studyId, setStudyId] = useState<number | null>(null);
  const [vocabBook, setVocabBook] = useState("none");
  const [quoteBook, setQuoteBook] = useState("none");
  const [celebrate, setCelebrate] = useState<Book | null>(null);
  const prevDone = useRef<Set<string> | null>(null);
  const [query, setQuery] = useState("");
  const [base, setBase] = useState<Base>("eli");
  const wideXl = useMediaQuery("(min-width: 1280px)", false);

  // Celebrate any book that just became "done".
  useEffect(() => {
    if (!ready) return;
    const now = new Set(Object.entries(data.progress).filter(([, p]) => p.st === "done").map(([id]) => id));
    if (prevDone.current) {
      const fresh = [...now].find((id) => !prevDone.current!.has(id));
      if (fresh) setCelebrate(BOOK_BY_ID.get(Number(fresh)) ?? null);
    }
    prevDone.current = now;
  }, [data.progress, ready]);

  const done = BOOKS.filter((b) => status(b.id) === "done").length;
  const reading = ALL_BOOKS.filter((b) => status(b.id) === "reading");
  const nextBook = reading[0] ?? BOOKS.find((b) => status(b.id) !== "done");
  const studyBook = studyId ?? nextBook?.id ?? BOOKS[0].id;

  const go = (t: string) => {
    setTab(t);
    // A book picked in the docked shelf panel would otherwise pop up as a dialog on the next tab.
    setOpenBook(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goStudy = (id: number) => {
    setStudyId(id);
    go("study");
  };
  const goAddQuote = (id: number) => {
    setQuoteBook(String(id));
    go("quotes");
    setTimeout(() => document.getElementById("q-text")?.focus({ preventScroll: true }), 400);
  };
  const goAddWord = (id: number) => {
    setVocabBook(String(id));
    go("vocab");
    setTimeout(() => document.getElementById("w-word")?.focus({ preventScroll: true }), 400);
  };

  const journey = {
    stages: STAGES.map((s) => ({ lv: s.lv, label: s.label, total: s.ids.length, done: s.ids.filter((id) => data.progress[id]?.st === "done").length })),
    done,
    total: BOOKS.length,
    words: data.words.length,
    streak,
  };

  const subtitle: Record<string, string> = {
    home: todayLong(),
    books: base === "gutenberg" ? "clássicos completos, grátis e em domínio público" : base === "storyweaver" ? "histórias ilustradas grátis, do Pre-A1 ao B1" : `${done} de ${BOOKS.length} lidos`,
    vocab: `${data.words.length} ${data.words.length === 1 ? "palavra" : "palavras"} no caderno`,
    review: due.length ? `${due.length} para hoje` : "tudo em dia",
    study: "antes, durante e depois da leitura",
    quotes: `${data.quotes.length} ${data.quotes.length === 1 ? "citação salva" : "citações salvas"}`,
  };
  const search = (q: string) => {
    setQuery(q);
    if (tab !== "books") setTab("books");
  };
  const docked = tab === "books" && wideXl;
  const panelBook = openBook ?? (base === "eli" ? (nextBook?.id ?? null) : baseBooks(base)[0].id);

  return (
    <Tabs value={tab} onValueChange={(v) => go(String(v))} className="min-h-dvh gap-0 pb-24 lg:pb-0">
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-5 lg:p-4">
        {/* sidebar */}
        <aside className="sticky top-4 hidden h-[calc(100dvh-2rem)] flex-col gap-6 rounded-[1.75rem] bg-ink p-4 text-ink-foreground lg:flex">
          <button onClick={() => go("home")} className="px-2 pt-2" aria-label="Babel, início">
            <BabelLogo />
          </button>

          <TabsList className="h-auto! w-full flex-col items-stretch gap-1 rounded-none bg-transparent p-0">
            {NAV.map((n) => (
              <TabsTrigger
                key={n.value}
                value={n.value}
                className="relative h-11! min-h-11 w-full flex-none! justify-start! gap-3 rounded-full! border-0! px-4 py-3 text-sm font-medium text-ink-muted! after:hidden hover:text-ink-foreground! data-active:bg-transparent! data-active:text-sand-foreground! data-active:hover:text-sand-foreground!"
              >
                {tab === n.value && <motion.span layoutId="side-pill" className="absolute inset-0 -z-10 rounded-full bg-sand" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                <n.icon weight={tab === n.value ? "fill" : "regular"} className="size-5" />
                {n.label}
                <CountBadge n={n.value === "review" ? due.length : n.value === "vocab" ? data.words.length : 0} active={tab === n.value} />
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-auto grid gap-3">
            <AiCard name={aiName} model={aiModel} onOpen={() => setAiOpen(true)} />
            <div className="flex items-center justify-between px-1">
              <ThemeToggle />
              <Button variant="ghost" size="icon" aria-label="Configurações" className="text-ink-foreground hover:bg-white/10 hover:text-ink-foreground" onClick={() => setSettingsOpen(true)}>
                <GearSixIcon className="size-5" />
              </Button>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          {/* mobile header */}
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-ink px-4 text-ink-foreground lg:hidden">
            <button onClick={() => go("home")} aria-label="Babel, início">
              <BabelLogo size="sm" />
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setAiOpen(true)}
                className={cn("mr-1 flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold", aiName ? "border border-ink-border text-ink-foreground" : "bg-sand text-sand-foreground")}
              >
                <span className={cn("size-1.5 rounded-full", aiName ? "bg-good" : "bg-ink")} />
                {aiName ? "IA" : "Ligar IA"}
              </button>
              <ThemeToggle />
              <Button variant="ghost" size="icon" aria-label="Configurações" className="text-ink-foreground hover:bg-white/10 hover:text-ink-foreground" onClick={() => setSettingsOpen(true)}>
                <GearSixIcon className="size-5" />
              </Button>
            </div>
          </header>
          <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
          <AiDialog open={aiOpen} onOpenChange={setAiOpen} />

          <div className="px-4 sm:px-6 lg:px-2">
            {/* top bar: title + search */}
            <div className="flex flex-col gap-4 pt-6 pb-6 sm:flex-row sm:items-end sm:justify-between lg:pt-4">
              <div className="min-w-0">
                <h1 className="font-display text-3xl sm:text-4xl">{tab === "home" ? "Boa leitura hoje" : TAB_TITLE[tab]}</h1>
                <p className="mt-1 text-xs text-muted-foreground first-letter:uppercase tabular">{subtitle[tab]}</p>
              </div>
              <label className="relative w-full sm:w-80">
                <span className="sr-only">Buscar livro</span>
                <MagnifyingGlassIcon weight="bold" className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="book-search"
                  value={query}
                  onChange={(e) => search(e.target.value)}
                  placeholder="Título, autor ou tema"
                  className="h-11 w-full rounded-full border border-border bg-card pr-4 pl-11 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-foreground tabular"
                />
              </label>
            </div>

            <div className={cn("min-w-0", docked && "xl:grid xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-start xl:gap-5")}>
              <div className="min-w-0">
                <TabsContent value="home">
                  <HomeTab journey={journey} nextBook={nextBook} reading={reading} onGo={go} onOpen={setOpenBook} onStudy={goStudy} aiName={aiName} />
                </TabsContent>
                <TabsContent value="books">
                  <BooksTab q={query} onQ={setQuery} onOpen={setOpenBook} selected={docked ? panelBook : null} base={base} onBase={setBase} />
                </TabsContent>
                <TabsContent value="vocab">
                  <VocabTab aiName={aiName} bookId={vocabBook} onBookChange={setVocabBook} />
                </TabsContent>
                <TabsContent value="quotes">
                  <QuotesTab aiName={aiName} bookId={quoteBook} onBookChange={setQuoteBook} onOpenBook={setOpenBook} />
                </TabsContent>
                <TabsContent value="review">{ready && <ReviewTab key={String(ready)} onGoVocab={() => go("vocab")} />}</TabsContent>
                <TabsContent value="study">
                  <StudyTab aiName={aiName} bookId={studyBook} onBookChange={setStudyId} />
                </TabsContent>
              </div>
              {docked && panelBook != null && <BookPanel bookId={panelBook} onGo={setOpenBook} onStudy={goStudy} onAddWord={goAddWord} onAddQuote={goAddQuote} />}
            </div>

            <footer className="mt-16 flex flex-col gap-2 border-t border-border py-6 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:justify-between">
              <p className="max-w-xl">
                Catálogo e capas de{" "}
                <a className="underline underline-offset-2" href="https://www.elipublishing.com/catalog" target="_blank" rel="noopener noreferrer">
                  elipublishing.com
                </a>{" "}
                (copiado em 05/10/2026). Projeto pessoal de estudo, sem vínculo com a editora. Seus dados e suas chaves de IA ficam só neste navegador.
              </p>
              <p className="label shrink-0">Babel · aprender idiomas lendo</p>
            </footer>
          </div>
        </div>
      </div>

      {/* mobile tab bar */}
      <nav aria-label="Seções" className="fixed inset-x-0 bottom-0 z-40 bg-ink pb-safe text-ink-foreground lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-6 gap-0.5 px-1.5 py-2">
          {NAV.map((n) => {
            const active = tab === n.value;
            const count = n.value === "review" ? due.length : 0;
            return (
              <button
                key={n.value}
                onClick={() => go(n.value)}
                aria-current={active ? "page" : undefined}
                className={cn("relative grid justify-items-center gap-0.5 rounded-2xl py-1.5 text-[9.5px] font-medium transition-colors", active ? "text-sand-foreground" : "text-ink-muted")}
              >
                {active && <motion.span layoutId="tabbar-pill" className="absolute inset-0 rounded-2xl bg-sand" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                <n.icon weight={active ? "fill" : "regular"} className="relative size-[1.3rem]" />
                <span className="relative">{n.short}</span>
                {count > 0 && <span className="absolute top-1 right-[calc(50%-1.2rem)] size-1.5 rounded-full bg-sand ring-2 ring-ink" aria-label={`${count} revisões`} />}
              </button>
            );
          })}
        </div>
      </nav>

      <BookScreen bookId={docked ? null : openBook} onOpenChange={setOpenBook} onStudy={goStudy} onAddWord={goAddWord} onAddQuote={goAddQuote} />

      <Dialog open={!!celebrate} onOpenChange={(o) => !o && setCelebrate(null)}>
        <DialogContent className="gap-3 p-3 sm:max-w-2xl">
          <DialogTitle className="sr-only">Livro concluído</DialogTitle>
          {celebrate && <CelebrationPlayer title={celebrate.t} level={celebrate.hw ? `${celebrate.lv} · ${celebrate.hw} headwords` : `${celebrate.lv} · clássico original`} done={done} total={BOOKS.length} />}
          {celebrate && (
            <div className="flex flex-wrap justify-end gap-2 px-1 pb-1">
              <Button variant="outline" onClick={() => setCelebrate(null)}>
                Fechar
              </Button>
              <Button
                onClick={() => {
                  setCelebrate(null);
                  goStudy(celebrate.id);
                }}
              >
                Escrever o resumo
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}

/** Sidebar card: what the AI does when it's off, which provider and model when it's on. */
function AiCard({ name, model, onOpen }: { name: string; model: string; onOpen: () => void }) {
  if (name)
    return (
      <button onClick={onOpen} className="grid gap-2 rounded-[1.25rem] border border-ink-border p-4 text-left transition-colors hover:bg-white/5">
        <span className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-bold">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-good opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-2 rounded-full bg-good" />
            </span>
            IA ligada
          </span>
          <span className="text-xs text-ink-muted underline underline-offset-4">trocar</span>
        </span>
        <span className="truncate text-sm">{name}</span>
        {model && <span className="truncate text-xs text-ink-muted">{model}</span>}
      </button>
    );
  return (
    <div className="grid gap-3 rounded-[1.25rem] bg-sand p-4 text-sand-foreground">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-full bg-ink text-ink-foreground">
          <TranslateIcon weight="bold" className="size-4" />
        </span>
        <p className="text-sm leading-tight font-bold">IA desligada</p>
      </div>
      <ul className="grid gap-1.5 text-xs text-[#45474b]">
        {["Traduz e explica palavras", "Monta o kit de cada livro", "Corrige seus resumos"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <CheckIcon weight="bold" className="size-3 shrink-0" /> {t}
          </li>
        ))}
      </ul>
      <button onClick={onOpen} className="group flex h-10 items-center justify-between rounded-full bg-ink pr-1.5 pl-4 text-sm font-bold text-ink-foreground">
        Ligar a IA
        <span className="grid size-7 place-items-center rounded-full bg-sand text-sand-foreground transition-transform group-hover:translate-x-0.5">
          <ArrowRightIcon weight="bold" className="size-3.5" />
        </span>
      </button>
      <p className="text-[11px] text-[#6b6863]">Grátis com Gemini · 1 minuto</p>
    </div>
  );
}

function todayLong() {
  return new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

const TAB_TITLE: Record<string, string> = { home: "Início", books: "Estante", vocab: "Vocabulário", review: "Revisar", study: "Estudar um livro", quotes: "Citações" };

const NAV = [
  { value: "home", label: "Início", short: "Início", icon: HouseIcon },
  { value: "books", label: "Estante", short: "Estante", icon: BooksIcon },
  { value: "vocab", label: "Vocabulário", short: "Palavras", icon: NotePencilIcon },
  { value: "quotes", label: "Citações", short: "Citações", icon: QuotesIcon },
  { value: "review", label: "Revisar", short: "Revisar", icon: CardsIcon },
  { value: "study", label: "Estudar", short: "Estudar", icon: GraduationCapIcon },
];

function CountBadge({ n, active }: { n: number; active?: boolean }) {
  if (!n) return null;
  return <span className={cn("ml-auto rounded-full px-2 text-[11px] leading-5 tabular", active ? "bg-ink text-ink-foreground" : "bg-ink-border text-ink-foreground")}>{n}</span>;
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button variant="ghost" size="icon" aria-label="Alternar tema claro/escuro" className="text-ink-foreground hover:bg-white/10 hover:text-ink-foreground" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
      <SunIcon className="hidden size-5 dark:block" />
      <MoonIcon className="size-5 dark:hidden" />
    </Button>
  );
}
