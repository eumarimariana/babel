# Free English materials in Babel

A plan for bringing a list of sites, playlists and dictionaries into the app. The goal is not a folder of bookmarks. Each material should show up **when it is useful**: while reading a book, after a wrong quiz answer, or when noting down a word.

> **Status:**
> - **Step 1 done:** a Materials tab with 45 free materials (the 21 from the original list plus 24 suggested later, see section 14) (`src/data/recursos-en.json`), a level filter that starts at the map's level, filters by skill and status, a 1–5 rating and a note on each material, all saved in the backup.
> - **Step 2 done:** a Cambridge button (open-book icon) on every word in Vocabulary, Study and Review (only after the answer is shown), and a "Check on Cambridge" link when noting a word. It uses Cambridge's search, which opens the entry and accepts phrases. English opens English–Portuguese; French, German and Spanish open the dictionary into English, since Cambridge has no Portuguese for those languages.
> - **Step 3 done:** playlists remember the lesson you stopped at (+ / −), and the button becomes "Continue at lesson N". Moving past the first lesson marks the playlist as "In use".
> - **Step 4 done:** a table of grammar topics in `src/lib/resources.ts` (`GRAMMAR_TOPICS`), recognized in the level's grammar text, the AI kit and quiz questions. In Study, each point gets "Understand this" with the topic's page on Perfect English Grammar or EnglishPage. In the Quiz, a wrong grammar question shows "Review: topic", and missed topics are saved in the score (`gaps`).
> - **Step 5 done:** a daily mission on Home and in Materials (`src/lib/mission.ts`), with no AI: the book in progress, grammar missed in the last quiz (or the level's grammar), a material for the skill least used this week, and the reviews. Each step checked off counts as a study day and is saved in `missions`.
> - **Step 6 done:** 57 packs of 50 words from NGSL 1.2 (`src/data/ngsl-en.json`, loaded only when the section opens), with the list's own English definition and a short Portuguese translation made for the app. Importing sends the words to today's reviews; words already in the notebook are skipped. It does not yet mark which of a pack's words appear in each book.
> - **Step 7 done:** "Add your own link" (recognizes YouTube playlists and creates the card with "stopped at lesson") and "Find my level" (EF SET and Perfect English Grammar; you enter the result and the app suggests the first unread book at that level). Your links and the result go into the backup.
> - **Done later:** `npm run check-links` (tests the catalog and the grammar pages; sites that block robots are listed separately); each topic's lesson in the 3 playlists (`lessons` and `videos` in `recursos-en.json`, with a direct link to the video); explanations for "There is / there are", "Inversion" and "Free indirect discourse"; the frequent words of each book with free text (Global Storybooks and Gutenberg Readers/children's books, `src/data/book-words-en.json`), on the book page; vocabulary drills (Dictation, Pairs, Writing) in the Review tab; book recommendations from the free sources by level (`src/lib/recommend.ts`).
> - **Still missing:** the text of StoryWeaver books (the API requires a login), and noting lessons for new topics as the playlists grow. Checked on 2026-10-16: the 3 playlists still have 46, 34 and 17 videos, matching what is stored; lesson 14 of "Gramática da língua inglesa" was added for phrasal verbs. "There is / there are", "Inversion" and "Free indirect discourse" have no lesson in any of them.
> - **Dropped after checking the links:** Jogos para Aprender Inglês (the address redirects to ads), 5 Minute English (site offline), Cursodeingles.online (the domain no longer exists) and the IFRS course (Moodle, requires enrollment).
> - **Added on top:** the 100 beginner texts from Aulas de Inglês Grátis, next to the 110 advanced ones.
>
> **Decided:**
> - A tab of its own, **Materials**, holds everything in this plan. The other tabs only get shortcuts to it.
> - Free materials only. Paid sites, or sites with a limited free plan, are left out.
> - Playlists **as redirects only**: the card opens the playlist on YouTube and remembers which lesson you are on. No API and no key (see section 6).

---

## 1. The idea in one sentence

A **Materials** tab that holds everything: the link catalog, playlist tracks, word packs, the daily mission and the level test. The other tabs get shortcuts to it:

- On the book screen, the level's grammar leads to the right explanation.
- In the quiz, a missed topic comes with a material about it.
- In vocabulary, each word opens on Cambridge.
- On Home, a small card shows the **daily mission** (which lives in Materials).

---

## 2. The original list, organized

Before going into the app, each link needs a record: type, level, whether it is free, and the site's language. Initial classification:

**In (all free):**

| Material | Type | Level | Notes |
|---|---|---|---|
| BBC Learning English | course, listening, grammar | A1–C1 | the flagship: courses by level, news, short videos |
| British Council – Grammar reference | grammar | A1–B2 | already split by CEFR level; great to link with the app |
| Grammar Bytes (chompchomp.com) | grammar, exercises | B1–C1 | interactive exercises |
| 5 Minute English | grammar | A1–B1 | short explanations |
| English Grammar 101 | grammar | A2–B2 | lessons in sequence, with a test |
| ESOL Courses | lessons, listening, reading | A1–B2 | lots of material by topic |
| Engoo – materials | reading, news, conversation | A1–C1 | the materials are open (only lessons with a teacher are paid); Daily News by level |
| Listen In English | listening | A2–C1 | clips from series, films, news and podcasts |
| LingoClip | listening with music | A1–B2 | fill in the song lyrics |
| The English Room – Games | games | A1–B1 | |
| Jogos para Aprender Inglês | games | Pre-A1–A2 | site in Portuguese |
| 110 texts with audio and translation (aulasdeinglesgratis.net) | reading with audio | B2–C1 | site in Portuguese |
| Grammar Bank – Beginners Test (KET, PET) | test | A2–B1 | works as a level test |
| Kultivi | video course | A1–B1 | free sign-up required, with a certificate |
| IFRS – Inglês 1 | course | A1 | Moodle: in only if it opens without enrollment |
| 3 grammar playlists (YouTube) | video | A1–B2 | see section 6 |
| Cambridge Dictionary | dictionary | all | see section 5 |
| Inglês Online – vocabulary | vocabulary | A1–B1 | site in Portuguese |
| Cursodeingles.online – vocabulary | vocabulary | A1–A2 | site in Portuguese |
| English Experts – quick guide | vocabulary | A2–B2 | forum in Portuguese |
| Open English – 200 most used words | vocabulary | Pre-A1–A1 | blog post; see section 7 |
| Universidade do Intercâmbio – growing your vocabulary | tips / article | all | a tips article, not an exercise |

**Out (paid or limited free plan):** EnglishCentral, FluentU, Gymglish and TakeLessons.

The items on the first list came without full URLs. During implementation, each address is checked before it enters the catalog.

---

## 3. The Materials tab

It follows the style of the other tabs, with graphite and sand cards and pill filters. It is the 8th tab in the menu, with a folder or compass icon.

Everything in this plan lives there, in sections:

1. **Today:** the daily mission (section 8).
2. **Tracks:** the grammar playlists, with the lesson you stopped at (section 6).
3. **Sites:** the link catalog on shelves (below).
4. **Words:** packs to import into Review (section 7).
5. **My level:** the level test (section 9).

Catalog details:

- **Shelves by skill:** Grammar · Vocabulary · Listening · Reading · Games · Courses · Tests · Dictionaries.
- **Level filter:** starts at the level of your current stop on the reading map. For example, if you are at ELi's A2, A2 materials come first.
- **Card labels:** `PT` or `EN` (the site's language), the average time (5 min, 15 min, long course) and `sign-up` when the site asks for an account. Since everything is free, no price label is needed.
- **Status per material:** want to use → using → done, as on the Shelf. You can give a 1–5 rating and write a short note ("good for phrasal verbs").
- **Add a link:** paste a URL and pick type and level. The list grows without touching the code.
- **Open in a new tab:** every link, playlists included, opens on the original site. Almost all of these sites refuse to be opened inside another app (iframe).

---

## 4. Bridge with the books' grammar

The app already knows the grammar of each level (`grammarFor` in `src/lib/books.ts`), and it shows up in Study and the Quiz. What is missing is linking each point to an explanation:

```
"Past simple" → British Council (A1–A2) · 5 Minute English · playlist, lesson 12
```

- In **Study**, each grammar point of the book gets an "Understand this" link with 1 or 2 materials.
- In the **Quiz**, a wrong grammar question shows "Review: Past simple", with the link.
- Each catalog material gets topic tags (`past-simple`, `present-perfect`, `phrasal-verbs`…) so this link is automatic.

---

## 5. Dictionary inside vocabulary

The quickest part to build and the most used:

- Every word in Vocabulary and Review gets a **Cambridge** button that opens `dictionary.cambridge.org/pt/dicionario/ingles-portugues/<word>`.
- When noting a word, the button shows up too, to check the meaning before saving.
- Later, other dictionaries (Oxford Learner's, Longman) can be added as an option in Settings.

---

## 6. Grammar playlists

No API: the 3 playlists come in as cards that **open straight on YouTube**.

| Playlist | Link |
|---|---|
| Gramática completa da língua inglesa | `youtube.com/playlist?list=PLM4F7Yfc9B4-TH9rMRqLBk5u5kEAHVV-t` |
| Gramática da língua inglesa | `youtube.com/playlist?list=PLGY1nxl-9ZcMv7kYyydP_zDYBkIjcRF2P` |
| Dominando a gramática em inglês | `youtube.com/playlist?list=PL62aalXXyN9OFa6Otre1eleuxF4pGq1k3` |

- **Open on YouTube:** the button takes you to the playlist in a new tab. No key or script needed.
- **Where I stopped:** each card remembers your lesson ("stopped at lesson 12"), updated with a tap on + / −. The "Continue" button is always highlighted.
- **Status:** want to watch → watching → finished, like the other materials.
- **Bridge with grammar:** each playlist's topics can be noted by hand (for example, `past-simple` = lesson 12). The playlist then shows up in section 4 with the right lesson. This can be done bit by bit.
- **New playlist:** comes in through "Add a link" (section 3). If it is a YouTube link, the app recognizes it and creates a playlist card.

---

## 7. Word packs for Review

The "200 most used words" list is a good idea, but copying the blog's text is not allowed (copyright). The alternative is an **open frequency list**:

- **NGSL (New General Service List):** about 2,800 words that cover most of any text. The license is open (CC BY-SA).
- The app splits the list into packs of 50 ("The first 50", "51–100"…). You import a pack into Review with one click.
- When opening a book, the app can mark which words of the pack appear in it, when the text is available (Gutenberg, StoryWeaver).

---

## 8. Daily mission (on Home)

A card on Home that puts together a short session based on your level and what is left:

```
Today · A2 · ~25 min
1. Read chapter 3 of "The Railway Children"     (Shelf)
2. Present perfect – British Council              (Grammar)
3. A clip on Listen In English                    (Listening)
4. Review 12 words                                (Review)
```

- Each item checked off counts toward the streak (`days`, which already exists).
- The choice favors: the book in progress, grammar missed in the last quiz, the skill least used this week.
- No AI needed. If AI is on, it can write a line of encouragement or a mini exercise.

---

## 9. Level test

Grammar Bank (KET/PET) and the British Council have short tests. The idea:

- A "Find my level" card linking to the test.
- Afterwards you enter the result and the app suggests the right stop on the reading map.
- Later: the app's own test, built from each level's grammar questions.

---

## 10. Data model

A fixed catalog in `src/data/recursos-en.json`:

```ts
type Resource = {
  id: string;            // "bbc-learning-english"
  name: string;
  url: string;
  kind: "grammar" | "vocab" | "listening" | "reading" | "games" | "course" | "test" | "dictionary" | "video";
  levels: string[];      // ["A1", "A2", "B1"]
  siteLang: "pt" | "en";
  signup?: boolean;      // asks for a (free) sign-up
  minutes?: number;      // average session length
  topics?: string[];     // ["past-simple", "phrasal-verbs"] for the grammar bridge
  playlist?: string;     // YouTube playlist ID, when it is one
  lessons?: Record<string, number>; // topic → lesson number, noted by hand
  note?: string;
};
```

In the store (`estante-eli-app-v1`), without breaking what exists:

```ts
resources: Record<string, { status: "want" | "doing" | "done"; rating?: number; note?: string; lesson?: number }>; // lesson = where you stopped
myResources: Resource[];   // links you added
missions: Record<string, string[]>; // day → items done
```

Everything goes into the existing backup.

---

## 11. Suggested order

1. **Materials tab + catalog:** the new tab in the menu, the empty sections, records for the free links, shelves, filters and status. Already useful on its own.
2. **Cambridge in vocabulary:** small and used every day.
3. **Playlist tracks:** cards that open on YouTube, with "where I stopped".
4. **Grammar ↔ materials bridge:** topic tags, shortcuts in Study and the Quiz.
5. **Daily mission** in Materials, with the card on Home.
6. **NGSL packs** importable into Review.
7. **Add your own link** and **level test**.

---

## 12. Care

- **Link, never copy:** the app keeps the name, address and your notes, not the sites' content.
- **Links break:** a script (`scripts/check-links`) tests every catalog URL and reports which ones went offline.
- **Free changes:** if a catalog site starts charging, it leaves the list. The link script can warn when a page changes a lot.
- **Other languages:** the catalog format already has `siteLang` and levels, so later it only takes `recursos-fr.json`, `recursos-de.json` and `recursos-es.json`.

---

## 13. Decisions

- **Tab:** a separate one, called **Materials**, holding every feature in this plan.
- **Cost:** free materials only; EnglishCentral, FluentU, Gymglish and TakeLessons are out.
- **Playlists:** redirects to YouTube only, no API; the app remembers which lesson you are on.

---

## 14. More materials and integration ideas

The 24 materials suggested after the first list are already in the Materials tab, with two new skills: **Pronunciation** and **Writing**. Some of them can go beyond a link:

| Material | Idea | Where |
|---|---|---|
| YouGlish | A "Hear it in videos" button on each word (`youglish.com/pronounce/<word>/english`) | Vocabulary and Review, next to Cambridge (step 2) |
| Forvo | A native pronunciation button per word | Same place, as a second option |
| VOA Learning English | Become a **source on the Shelf**: the content is public domain, so texts and audio can come into the app, with levels | Shelf |
| ER Central | A candidate **source on the Shelf** (graded readers with audio and headwords). First check whether the terms of use allow listing the catalog | Shelf |
| LanguageTool | A "Correct" button on the book summary, through the free API, with no AI | Study |
| Write & Improve | A "Get a CEFR score" link next to the summary | Study |
| EF SET | The main test of the "My level" card | Materials, step 7 |
| Oxford 3000/5000 and English Vocabulary Profile | Show the CEFR level of notebook words and build packs by level. The lists cannot be copied; use only as links or check the license | Vocabulary and step 6 |
| Rachel's English, English with Lucy, Easy British English | Same format as the playlists (open on YouTube and "where I stopped") | Materials, step 3 |

---

## 15. Next ideas (raised on 2026-10-11)

At this point the English part was strong in reading and vocabulary. Listening, speaking and writing mostly showed up as outside links. In order of priority:

### 15.1 In-app reader (built and removed on 2026-10-11)

- Read Global Storybooks stories (EN, FR, DE, ES) without leaving the app, page by page, with the illustration.
- Tapping a word shows the translation (from NGSL, no AI; or from the AI, if on), the listen button, Cambridge and "Note", which sends the word to the notebook with the book and sentence as an example.
- Words already in the notebook are highlighted in the text.
- The narration MP3 plays along.
- It was built for Global Storybooks and then removed; the stories' text (CC BY, without the credits) was kept out of the git history.

### 15.2 Packs made for Brazilians (done: `src/data/br-packs-en.json`, "Made for Brazilians" section in Materials)

- **False friends:** actually, pretend, push, library, parents, exquisite, assist…
- **Most common phrasal verbs:** get up, look for, find out, give up…
- **Pronunciation that is hard for Brazilians:** "th", the "-ed" ending (worked / wanted / played), short and long vowels (ship/sheep, live/leave, full/fool), in pairs played with Wiktionary recordings.

### 15.3 Grammar exercises in the app (done: 95 exercises in 19 topics in `src/data/grammar-en.json`, plus 8 from the AI)

- 5 to 10 short exercises per topic (fill in, choose, rewrite), following the topics in `GRAMMAR_TOPICS`.
- With AI, generated on the spot; without AI, a fixed bank for the main topics (tenses, conditionals, comparatives, modals).
- Missed topics go into the daily mission, as already happens with the quiz.

### 15.4 Writing: a short diary (done: "Diary" section in Materials)

- 3 to 5 sentences a day on a topic of your level ("what you did at the weekend", "describe your home").
- Line-by-line AI correction; new words from the correction go to the notebook.

### 15.5 Speaking: "repeat after me" (done: "Speak" drill in Review)

- The app plays the recording (Wiktionary or the book's narration), you record your voice through the microphone (MediaRecorder), and the two play side by side to compare.
- Works in any browser, without relying on the system voice or speech recognition.

### 15.6 Listening: daily reading (done: "Daily reading" card on Home, sources in `DAILY_EN`)

- One link per level on Home: VOA Learning English, News in Levels, BBC 6 Minute English (already in the languages plan, step 7).

### 15.7 Vocabulary (done: estimated vocabulary in the notebook, "Sentence" mode in flashcards, "Fix translation")

- **Estimated vocabulary size:** "you know ~X of the 2,809 most used words", from the words mastered (boxes 5–6) in the flashcards.
- **Sentence cards:** the flashcard shows the book's sentence with the word blanked out.
- **Fix translation:** a button on the flashcard to correct pack translations (made for the app and not yet reviewed).

### 15.8 Progress (done: "App test" and "What I can already do" on the level card)

- The CEFR "can do…" list by level (introduce myself, tell what I did at the weekend, give my opinion…), checked off bit by bit.
- The app's own level test, built from each level's grammar questions.

### 15.9 Text correction (done)

- One correction for the book summary (Study), the diary and the Writing drill's sentences: `correctWriting` in `src/lib/ai-client.ts`, a structured response (`CorrectionSchema` in `src/lib/ai-schemas.ts`) and a shared screen in `src/components/estante/writing-feedback.tsx`.
- It shows the text with each mistake marked, the corrected version with what went in and out, mistakes by type (grammar, vocabulary, spelling, word order, punctuation) with "Understand this" and "Make a flashcard", tips to sound natural, words to note, what was good, a score and the text's level.
- Corrections are saved (`essayChecks` and `journal[].correction`); missed grammar topics go into the daily mission and the red dot on the Grammar section.
