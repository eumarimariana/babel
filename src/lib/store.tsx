"use client";

import type { Lang } from "@/lib/books";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type Status = "want" | "reading" | "done";
export type Word = {
  id: string;
  ln?: Lang; // language of the word; old words are English
  w: string;
  pt: string;
  en: string;
  ex: string;
  pos: string;
  book: number | null;
  box: number; // 0 = new … 6 = mastered
  due: string; // YYYY-MM-DD
  created: string;
  reps: number;
};
export type Quote = {
  id: string;
  ln?: Lang; // language of the passage; old quotes are English
  text: string; // the passage, in the language being studied
  pt: string; // translation
  book: number | null;
  page: string;
  note: string;
  created: string;
};
export type QuizQuestion = {
  kind: "story" | "vocab" | "grammar" | "meaning" | "say" | "cloze";
  q: string;
  options: string[];
  answer: number;
  why: string;
  wordId?: string; // set when the question comes from a word in the notebook
};
export type SavedQuiz = { questions: QuizQuestion[]; at: string };
export type QuizScore = { best: number; last: number; total: number; times: number; at: string; gaps?: string[] }; // gaps = grammar topics missed last time
export type ResourceStatus = "want" | "doing" | "done";
export type ResourceMark = { st?: ResourceStatus; rating?: number; note?: string; lesson?: number; d: string };
export type KitWord = { w: string; pos: string; pt: string; en: string; ex: string };
export type Kit = {
  words: KitWord[];
  grammar: { point: string; pt: string; example: string }[];
  questions: string[];
  at: string;
};
export type Data = {
  v: 1;
  progress: Record<string, { st: Status; d: string }>;
  words: Word[];
  kits: Record<string, Kit>;
  essays: Record<string, string>;
  quotes: Quote[];
  quizzes: Record<string, SavedQuiz>; // AI quizzes, by book id
  scores: Record<string, QuizScore>; // by book id, or "words-<lang>" for notebook quizzes
  resources: Record<string, ResourceMark>; // study materials, by resource id
  days: string[];
};

const KEY = "estante-eli-app-v1";
const EMPTY: Data = { v: 1, progress: {}, words: [], kits: {}, essays: {}, quotes: [], quizzes: {}, scores: {}, resources: {}, days: [] };
export const INTERVALS = [0, 1, 2, 4, 8, 16, 32];

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
export const brDate = (iso: string) => iso.split("-").reverse().join("/");

/** Accepts this app's backups and the older single-file Estante backups. */
export function normalize(input: unknown): Data {
  const d = (input ?? {}) as Partial<Data> & { kits?: Record<string, Kit & { essay?: string }> };
  const essays: Record<string, string> = { ...(d.essays ?? {}) };
  const kits: Record<string, Kit> = {};
  for (const [id, k] of Object.entries(d.kits ?? {})) {
    if (k?.essay && !essays[id]) essays[id] = k.essay;
    if (Array.isArray(k?.words)) kits[id] = { words: k.words, grammar: k.grammar ?? [], questions: k.questions ?? [], at: k.at ?? today() };
  }
  return {
    v: 1,
    progress: d.progress ?? {},
    words: (d.words ?? []).map((w) => ({ ...w, box: w.box ?? 0, due: w.due ?? today(), reps: w.reps ?? 0, book: w.book ?? null })),
    kits,
    essays,
    quotes: (d.quotes ?? []).filter((q) => q && q.text).map((q) => ({ ...q, pt: q.pt ?? "", book: q.book ?? null, page: q.page ?? "", note: q.note ?? "" })),
    quizzes: d.quizzes ?? {},
    scores: d.scores ?? {},
    resources: d.resources ?? {},
    days: d.days ?? [],
  };
}

function streakOf(days: string[]) {
  const set = new Set(days);
  let d = today();
  if (!set.has(d)) d = addDays(d, -1);
  let n = 0;
  while (set.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

type Ctx = {
  data: Data;
  ready: boolean;
  status: (id: number) => Status | "";
  setStatus: (id: number, st: Status | "") => void;
  addWord: (w: Partial<Word> & { w: string }) => boolean;
  gradeWord: (id: string, grade: 0 | 1 | 2) => void;
  deleteWord: (id: string) => void;
  saveKit: (bookId: number, kit: Kit) => void;
  saveEssay: (bookId: number, text: string) => void;
  addQuote: (q: Pick<Quote, "text" | "pt" | "book" | "page" | "note"> & { ln?: Lang }) => void;
  updateQuote: (id: string, patch: Partial<Pick<Quote, "text" | "pt" | "page" | "note">>) => void;
  deleteQuote: (id: string) => void;
  saveQuiz: (bookId: number, quiz: SavedQuiz) => void;
  recordScore: (key: string, correct: number, total: number, gaps?: string[]) => void;
  markResource: (id: string, patch: Partial<Omit<ResourceMark, "d">>) => void;
  markDay: () => void;
  replaceAll: (d: Data) => void;
  streak: number;
  due: Word[];
};

const EstanteContext = createContext<Ctx | null>(null);

export function EstanteProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>(EMPTY);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from browser storage once
      if (raw) setData(normalize(JSON.parse(raw)));
    } catch {
      /* private mode or corrupt data: start empty */
    }
    loaded.current = true;
    setReady(true);
  }, []);

  useEffect(() => {
    // Skip the initial EMPTY state: this effect runs in the same commit as the load above,
    // and writing EMPTY here would overwrite saved data before it is read back (StrictMode runs effects twice).
    if (!loaded.current || data === EMPTY) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* storage full or blocked */
    }
  }, [data]);

  const withDay = (d: Data): Data => (d.days.includes(today()) ? d : { ...d, days: [...d.days, today()].slice(-500) });

  const setStatus = useCallback((id: number, st: Status | "") => {
    setData((d) => {
      const progress = { ...d.progress };
      if (st) progress[id] = { st, d: today() };
      else delete progress[id];
      const next = { ...d, progress };
      return st === "done" ? withDay(next) : next;
    });
  }, []);

  const addWord = useCallback(
    (w: Partial<Word> & { w: string }) => {
      const text = w.w.trim();
      const ln = w.ln ?? "en";
      const same = (x: Word) => (x.ln ?? "en") === ln && x.w.toLowerCase() === text.toLowerCase();
      if (!text || data.words.some(same)) return false;
      const word: Word = {
        id: "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        w: text,
        ln: w.ln ?? "en",
        pt: w.pt ?? "",
        en: w.en ?? "",
        ex: w.ex ?? "",
        pos: w.pos ?? "",
        book: w.book ?? null,
        box: 0,
        due: today(),
        created: new Date().toISOString(),
        reps: 0,
      };
      setData((d) => (d.words.some(same) ? d : withDay({ ...d, words: [...d.words, word] })));
      return true;
    },
    [data.words],
  );

  const gradeWord = useCallback((id: string, grade: 0 | 1 | 2) => {
    setData((d) =>
      withDay({
        ...d,
        words: d.words.map((w) => {
          if (w.id !== id) return w;
          if (grade === 0) return { ...w, box: 1, due: today(), reps: w.reps + 1 };
          if (grade === 1) return { ...w, box: Math.max(1, w.box), due: addDays(today(), 1), reps: w.reps + 1 };
          const box = Math.min(6, w.box + 1);
          return { ...w, box, due: addDays(today(), INTERVALS[box]), reps: w.reps + 1 };
        }),
      }),
    );
  }, []);

  const deleteWord = useCallback((id: string) => setData((d) => ({ ...d, words: d.words.filter((w) => w.id !== id) })), []);
  const saveKit = useCallback((bookId: number, kit: Kit) => setData((d) => withDay({ ...d, kits: { ...d.kits, [bookId]: kit } })), []);
  const addQuote = useCallback(
    (q: Pick<Quote, "text" | "pt" | "book" | "page" | "note"> & { ln?: Lang }) =>
      setData((d) =>
        withDay({
          ...d,
          quotes: [
            { id: "q" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ln: q.ln ?? "en", text: q.text.trim(), pt: q.pt.trim(), book: q.book, page: q.page.trim(), note: q.note.trim(), created: new Date().toISOString() },
            ...d.quotes,
          ],
        }),
      ),
    [],
  );
  const updateQuote = useCallback(
    (id: string, patch: Partial<Pick<Quote, "text" | "pt" | "page" | "note">>) => setData((d) => ({ ...d, quotes: d.quotes.map((q) => (q.id === id ? { ...q, ...patch } : q)) })),
    [],
  );
  const deleteQuote = useCallback((id: string) => setData((d) => ({ ...d, quotes: d.quotes.filter((q) => q.id !== id) })), []);
  const saveQuiz = useCallback((bookId: number, quiz: SavedQuiz) => setData((d) => ({ ...d, quizzes: { ...d.quizzes, [bookId]: quiz } })), []);
  const recordScore = useCallback(
    (key: string, correct: number, total: number, gaps?: string[]) =>
      setData((d) => {
        const prev = d.scores[key];
        const best = prev && prev.best / prev.total >= correct / total ? prev : { best: correct, total };
        return withDay({ ...d, scores: { ...d.scores, [key]: { best: best.best, total: best.total, last: correct, times: (prev?.times ?? 0) + 1, at: today(), ...(gaps?.length ? { gaps } : {}) } } });
      }),
    [],
  );
  const markResource = useCallback(
    (id: string, patch: Partial<Omit<ResourceMark, "d">>) =>
      setData((d) => {
        const mark = { ...d.resources[id], ...patch, d: today() };
        const resources = { ...d.resources };
        if (!mark.st && !mark.rating && !mark.note && !mark.lesson) delete resources[id];
        else resources[id] = mark;
        const next = { ...d, resources };
        return patch.st === "done" ? withDay(next) : next;
      }),
    [],
  );
  const saveEssay = useCallback((bookId: number, text: string) => setData((d) => ({ ...d, essays: { ...d.essays, [bookId]: text } })), []);
  const markDay = useCallback(() => setData(withDay), []);
  const replaceAll = useCallback((d: Data) => setData(d), []);

  const value = useMemo<Ctx>(() => {
    const t = today();
    return {
      data,
      ready,
      status: (id) => data.progress[id]?.st ?? "",
      setStatus,
      addWord,
      gradeWord,
      deleteWord,
      saveKit,
      saveEssay,
      addQuote,
      updateQuote,
      deleteQuote,
      saveQuiz,
      recordScore,
      markResource,
      markDay,
      replaceAll,
      streak: streakOf(data.days),
      due: data.words.filter((w) => w.due <= t),
    };
  }, [data, ready, setStatus, addWord, gradeWord, deleteWord, saveKit, saveEssay, addQuote, updateQuote, deleteQuote, saveQuiz, recordScore, markResource, markDay, replaceAll]);

  return <EstanteContext.Provider value={value}>{children}</EstanteContext.Provider>;
}

export function useEstante() {
  const ctx = useContext(EstanteContext);
  if (!ctx) throw new Error("useEstante must be used inside EstanteProvider");
  return ctx;
}
