"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { ArrowSquareOutIcon, CheckIcon, CopyIcon, ListChecksIcon, PlusIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BASE_INFO, BOOKS, BOOK_BY_ID, type Book, baseOf, bookUrl, describeBook, grammarFor, kindOf, langInfo, langOf, questionsFor } from "@/lib/books";
import { plainLevel, topicsIn, videoLessons } from "@/lib/resources";
import { today, useEstante } from "@/lib/store";
import { makeKit } from "@/lib/ai-client";
import { WritingBox } from "./writing-feedback";
import { BookCover, SimpleSelect, StatusPicker, copyText, useBookOptions } from "./common";
import { WordCard } from "./vocab-tab";

export function StudyTab({ aiName, bookId, onBookChange }: { aiName: string; bookId: number; onBookChange: (id: number) => void }) {
  const book = BOOK_BY_ID.get(bookId) ?? BOOKS[0];
  const { status, setStatus } = useEstante();
  const BOOK_OPTIONS = useBookOptions(false);
  return (
    <div className="grid gap-5">
      {/* book header, graphite like the dashboard's highlight card */}
      <section className="grid gap-5 overflow-hidden rounded-[1.75rem] bg-ink p-5 text-ink-foreground sm:grid-cols-[auto_minmax(0,1fr)] sm:p-7">
        <div className="w-28 justify-self-center sm:w-36">
          <BookCover book={book} size="lg" className="-rotate-2 rounded-lg ring-0 shadow-[0_14px_30px_-10px_rgb(0_0_0/0.6)]" />
        </div>
        <div className="grid min-w-0 content-start gap-4">
          <div className="grid gap-2">
            <label className="flex max-w-md items-center gap-2">
              <span className="shrink-0 text-xs text-ink-muted tabular">Livro</span>
              <SimpleSelect
                label="Livro para estudar"
                value={String(book.id)}
                onChange={(v) => onBookChange(Number(v))}
                options={BOOK_OPTIONS}
                className="h-9 w-full border-ink-border bg-white/5 text-ink-foreground hover:bg-white/10 dark:bg-white/5 [&_svg]:text-ink-muted"
              />
            </label>
            <h2 className="font-display text-3xl leading-tight sm:text-4xl">{book.t}</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs tabular">
              <span className="rounded-full bg-sand px-3 py-1 font-bold text-sand-foreground">{book.lv}</span>
              <span className="rounded-full border border-ink-border px-3 py-1">{book.hw ? `${book.hw} headwords` : kindOf(book) === "storyweaver" ? "história ilustrada" : "original, sem adaptação"}</span>
              <span className="rounded-full border border-ink-border px-3 py-1">{book.cat}</span>
            </div>
          </div>
          {book.s && <p className="line-clamp-3 max-w-2xl text-sm leading-relaxed text-ink-muted">{book.s}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-full max-w-md">
              <StatusPicker tone="ink" value={status(book.id)} onChange={(v) => setStatus(book.id, v)} />
            </div>
            <a href={bookUrl(book)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-ink-muted underline underline-offset-4 hover:text-ink-foreground tabular">
              Ver no {BASE_INFO[baseOf(book)].site} <ArrowSquareOutIcon className="size-3.5" />
            </a>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <BeforeReading key={`kit-${book.id}`} book={book} aiName={aiName} />
        <div className="grid gap-5">
          <DuringReading book={book} />
          <AfterReading key={`essay-${book.id}`} book={book} aiName={aiName} />
        </div>
      </div>
    </div>
  );
}

const STEP_NUMBER: Record<string, string> = { "Antes de ler": "01", "Durante a leitura": "02", "Depois de ler": "03" };

function Step({ eyebrow, title, desc, children }: { eyebrow: string; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sand text-xs font-bold text-sand-foreground tabular">{STEP_NUMBER[eyebrow]}</span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground tabular">{eyebrow}</p>
            <CardTitle>{title}</CardTitle>
          </div>
        </div>
        {desc && <CardDescription className="mt-1">{desc}</CardDescription>}
      </CardHeader>
      <CardContent className="grid gap-4">{children}</CardContent>
    </Card>
  );
}

/** Row in the style of a "daily schedule" list: number tile, title, subtitle. */
function ListRow({ n, title, sub, example, children }: { n: number; title: string; sub?: string; example?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-muted/70 p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-card text-xs font-bold ring-1 ring-border tabular">{String(n).padStart(2, "0")}</span>
      <div className="min-w-0 text-sm">
        <p className="font-semibold">{title}</p>
        {sub && <p className="text-muted-foreground">{sub}</p>}
        {example && <p className="mt-0.5 text-xs text-muted-foreground tabular">“{example}”</p>}
        {children}
      </div>
    </div>
  );
}

/** "Entender isso": the explanation pages for the grammar points named in the text. */
function TopicLinks({ text, lang }: { text: string; lang: Parameters<typeof topicsIn>[1] }) {
  const topics = topicsIn(text, lang);
  const links = topics.flatMap((t) => {
    const page = t.links[0];
    const video = videoLessons(t.id, lang)[0];
    const name = topics.length > 1 ? `${t.label}: ` : "";
    return [
      { url: page.url, label: `${name}${page.name}` },
      ...(video ? [{ url: video.url, label: `${name}vídeo, aula ${video.lesson}` }] : []),
    ];
  });
  if (!links.length) return null;
  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className="text-muted-foreground">Entender isso:</span>
      {links.map((l) => (
        <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline">
          {l.label} <ArrowSquareOutIcon weight="bold" className="size-3" />
        </a>
      ))}
    </p>
  );
}

function Questions({ items }: { items: string[] }) {
  return (
    <ol className="grid gap-1.5 text-sm">
      {items.map((q, i) => (
        <li key={q} className="flex gap-3">
          <span className="text-xs text-muted-foreground tabular">{String(i + 1).padStart(2, "0")}</span>
          <span>{q}</span>
        </li>
      ))}
    </ol>
  );
}

function BeforeReading({ book, aiName }: { book: Book; aiName: string }) {
  const { data, saveKit, addWord } = useEstante();
  const kit = data.kits[book.id];
  const [busy, setBusy] = useState(false);
  const ctl = useRef<AbortController | null>(null);
  const has = (w: string) => data.words.some((x) => (x.ln ?? "en") === langOf(book) && x.w.toLowerCase() === w.toLowerCase());

  useEffect(() => () => ctl.current?.abort(), []);

  async function generate() {
    ctl.current?.abort();
    ctl.current = new AbortController();
    setBusy(true);
    try {
      const k = await makeKit(book, ctl.current.signal);
      saveKit(book.id, { ...k, at: today() });
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const prompt = `Sou brasileiro e vou ler ${describeBook(book)}.${book.s ? ` Resumo: ${book.s}` : ""}\nMe dê 12 palavras/expressões em ${langInfo(langOf(book)).name.toLowerCase()} que provavelmente aparecem no livro e são úteis para o meu nível, cada uma com classe gramatical, tradução, definição simples em ${langInfo(langOf(book)).name.toLowerCase()} e uma frase de exemplo ligada à história. Depois, 3 pontos de gramática típicos do ${book.lv} com explicação curta em português.`;

  return (
    <Step eyebrow="Antes de ler" title="Kit de pré-leitura" desc="Palavras-chave que devem aparecer no livro, a gramática do nível e perguntas para o fim.">
      <div className="flex flex-wrap gap-2">
        {aiName ? (
          <Button onClick={generate} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <ListChecksIcon data-icon="inline-start" />}
            {busy ? "Montando o kit… (até 1 min)" : kit ? "Gerar outro kit" : `Gerar kit com ${aiName}`}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={async () => {
              if (await copyText(prompt)) toast.success("Pedido copiado. Cole no claude.ai, Gemini ou outra IA.");
              else toast.error("Não consegui copiar.");
            }}
          >
            <CopyIcon data-icon="inline-start" /> Copiar pedido para a IA
          </Button>
        )}
        {kit?.words.length ? (
          <Button
            variant="ghost"
            onClick={() => {
              let n = 0;
              for (const w of kit.words) if (addWord({ ...w, ln: langOf(book), book: book.id })) n++;
              toast.success(n ? `${n} palavras adicionadas ao caderno.` : "Todas já estavam no caderno.");
            }}
          >
            <PlusIcon data-icon="inline-start" /> Adicionar todas ao caderno
          </Button>
        ) : null}
      </div>

      {kit ? (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            {kit.words.map((w) => (
              <WordCard
                key={w.w}
                word={w}
                action={
                  <Button size="sm" variant="outline" className="mt-1 justify-self-start" disabled={has(w.w)} onClick={() => addWord({ ...w, ln: langOf(book), book: book.id })}>
                    {has(w.w) ? <CheckIcon data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
                    {has(w.w) ? "No caderno" : "Adicionar"}
                  </Button>
                }
              />
            ))}
          </div>
          <div className="grid gap-2">
            <h3 className="font-display text-base">Gramática do nível</h3>
            {kit.grammar.map((g, i) => (
              <ListRow key={g.point} n={i + 1} title={g.point} sub={g.pt} example={g.example}>
                <TopicLinks text={`${g.point} ${g.pt}`} lang={langOf(book)} />
              </ListRow>
            ))}
          </div>
          {kit.questions.length > 0 && (
            <div className="grid gap-2">
              <h3 className="font-display text-base">Perguntas para depois da leitura</h3>
              <Questions items={kit.questions} />
            </div>
          )}
        </>
      ) : (
        <div className="grid gap-2">
          <h3 className="font-display text-base">O que observar no {book.lv}</h3>
          {grammarFor(langOf(book), book.lv).map((g, i) => (
            <ListRow key={g} n={i + 1} title={g}>
              <TopicLinks text={g} lang={langOf(book)} />
            </ListRow>
          ))}
        </div>
      )}
    </Step>
  );
}

function DuringReading({ book }: { book: Book }) {
  const { data } = useEstante();
  const words = data.words.filter((w) => w.book === book.id);
  return (
    <Step eyebrow="Durante a leitura" title={`Palavras anotadas deste livro (${words.length})`} desc="Meta: de 5 a 10 palavras novas por livro.">
      {words.length ? (
        <div className="flex flex-wrap gap-1.5">
          {words.map((w) => (
            <span key={w.id} className="rounded-full bg-sand px-3 py-1 text-sm text-sand-foreground" title={w.pt}>
              {w.w}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhuma ainda. Use a aba Vocabulário para anotar enquanto lê.</p>
      )}
    </Step>
  );
}

function AfterReading({ book }: { book: Book; aiName: string }) {
  const { data, saveEssay, saveEssayCheck } = useEstante();
  const [text, setText] = useState(data.essays[book.id] ?? "");
  const kitQs = data.kits[book.id]?.questions;
  const questions = kitQs?.length ? kitQs : questionsFor(langOf(book));

  useEffect(() => {
    const t = setTimeout(() => {
      if ((data.essays[book.id] ?? "") !== text) saveEssay(book.id, text);
    }, 500);
    return () => clearTimeout(t);
  }, [text, book.id, data.essays, saveEssay]);

  return (
    <Step eyebrow="Depois de ler" title={`Responda e escreva um resumo em ${langInfo(langOf(book)).name.toLowerCase()}`} desc="Use as perguntas como roteiro e escreva de 4 a 8 frases. O texto e a correção ficam salvos.">
      <Questions items={questions} />
      <WritingBox
        lang={langOf(book)}
        context={{ kind: "summary", book }}
        level={plainLevel(book.lv) || "A2"}
        text={text}
        onText={setText}
        saved={data.essayChecks[book.id]}
        onSaved={(c) => saveEssayCheck(book.id, c)}
        scoreKey={`writing-${book.id}`}
        placeholder="The story is about…"
        rows={7}
        minWords={15}
      />
    </Step>
  );
}
