"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type Status = "want" | "reading" | "done";
export type Word = {
  id: string;
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
  days: string[];
};

const KEY = "estante-eli-app-v1";
const EMPTY: Data = { v: 1, progress: {}, words: [], kits: {}, essays: {}, days: [] };
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
      if (!text || data.words.some((x) => x.w.toLowerCase() === text.toLowerCase())) return false;
      const word: Word = {
        id: "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        w: text,
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
      setData((d) => (d.words.some((x) => x.w.toLowerCase() === text.toLowerCase()) ? d : withDay({ ...d, words: [...d.words, word] })));
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
      markDay,
      replaceAll,
      streak: streakOf(data.days),
      due: data.words.filter((w) => w.due <= t),
    };
  }, [data, ready, setStatus, addWord, gradeWord, deleteWord, saveKit, saveEssay, markDay, replaceAll]);

  return <EstanteContext.Provider value={value}>{children}</EstanteContext.Provider>;
}

export function useEstante() {
  const ctx = useContext(EstanteContext);
  if (!ctx) throw new Error("useEstante must be used inside EstanteProvider");
  return ctx;
}
