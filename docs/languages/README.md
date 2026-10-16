# New languages and more books in Babel

A plan to take Babel beyond English (French, German and Spanish), widen the English shelf with other publishers and free sources, and organize everything into **language profiles** with a **choice of book source**.

> **Status — already built:**
> - **Language profiles (simple version):** an EN · FR · DE · ES switch in the menu. The shelf, notebook, quotes, reviews, map, voice and AI requests follow the chosen language, which is saved in the browser. Older words and quotes count as English.
> - **Free sources per language:**
>   - English: ELi Readers (177), StoryWeaver (240, levels 1–4), Global Storybooks (40, levels 1–5, with audio), Book Dash (208 South African picture books, grouped by theme), Gutenberg Readers (McGuffey and others, 12), Gutenberg children's books (Potter, Milne, Kipling…, 14), LibriVox (16 audiobooks), Gutenberg classics (38).
>   - French: StoryWeaver (240), Global Storybooks (40), Gutenberg Readers (9), Gutenberg classics (10).
>   - German: StoryWeaver (157), Global Storybooks (40), Gutenberg Readers (6), Gutenberg classics (9).
>   - Spanish: StoryWeaver (240), Global Storybooks (40), Gutenberg Readers (14), Gutenberg classics (8).
> - **Quiz tab:** a book quiz written by the AI (story, words in context and the level's grammar, with explanations) and a quiz on your own words with no AI; missed words go back into reviews.
> - **"Where to read and listen"** on every book: ELi audio and sample, the free original on Gutenberg (75 ELi books linked), LibriVox, EPUB, StoryWeaver, Estante Virtual, Amazon by ISBN, WorldCat and Open Library.
>
> - **Levels:** ELi uses the publisher's CEFR level. StoryWeaver (1–4) and Global Storybooks (1–5) use children's literacy levels; the app maps them to an approximate CEFR level (1 ≈ Pre-A1, 2 ≈ A1, 3 ≈ A2, 4–5 ≈ B1) and shows the original level alongside. Gutenberg, LibriVox and Book Dash have an estimated level.
> - **About Global Storybooks:** in EN, FR, DE and ES the 40 stories are the same African Storybook titles, translated. That is why Book Dash was added, for more variety.
> - **Reading map per source:** the map, progress by level and the next stop follow the chosen source (switch on the map itself or on the Shelf).
> - **Backup and AI per profile:** in Settings, "Export <language>" downloads only the open profile and "Export all" downloads every profile. On import, the app asks whether to merge or replace (the file's profile or everything) (`src/lib/backup.ts`). Study days and the daily mission have no language, so they go into every backup and are always merged. Each profile can use its own AI provider among the connected keys (`byLang` in `src/lib/ai-client.ts`); with no choice, it uses the default.
> - **Oxford Bookworms (paid):** an "Oxford Bookworms" source for English (`src/data/oxford-en.json`), with metadata only, from Oxford's catalog on 2026-10-16: title, author, ISBN, the CEFR level the publisher states and stage. No synopsis is stored, and covers come from Open Library by ISBN (73 of 91 have one; the rest use the typeset cover). Each book's id is its ISBN-13. To read, the book page links to Oxford's page and to ISBN searches (Amazon, Estante Virtual, WorldCat, Open Library).
>
> **Needs a key:** Bloom Library (OPDS feed with levels, but it requires an account and a key issued by their team).
>
> **Evaluated and not included:** Indigenous Storybooks (only 12 stories per language, levels 1–2, partly repeating African Storybook); Storybooks Canada (the same 40 African Storybook titles); Let's Read by The Asia Foundation (no public API); Literacy Cloud (offline); Standard Ebooks (the feed requires a supporter account).
>
> **Rejected:** english-e-reader.net (and lists that only point to it): it distributes publishers' graded readers without permission.
>
> **Not yet:** the other paid series (Penguin, Hachette, Klett, Edinumen…). Sources found: Edinumen's PDF catalog (`edinumen.es/descargas/Catalogo_2026_web.pdf`, "Lecturas graduadas" section), with ISBN and level but with columns jumbled in the extracted text; Klett's per-book pages (`klett-sprachen.de/<title>/t-0/<ISBN>`); for Hachette (Lire en français facile) there is no readable catalog yet.
>
> The series and sites listed below were gathered from memory. Before using any of them, check each publisher's current catalog, levels and terms of use.

---

## 1. How the app worked at first

Everything was built for **one language (English) and one source (ELi Readers)**:

| Part | Where | What is specific to English/ELi |
|---|---|---|
| Catalog | `src/data/books.json` | 177 ELi books, the publisher's numeric `id`, cover on ELi's CDN (`c`) |
| Catalog rules | `src/lib/books.ts` | `STAGES` (steps by ELi headwords), `levelSlot`, `GRAMMAR_BY_LEVEL` and `AFTER_READING_QUESTIONS` in English, ELi's `bookUrl` and `coverUrl` |
| Progress and words | `src/lib/store.tsx` | `progress` is keyed by the book `id`; `Word` does not say which language it is |
| Hearing a word | `src/components/estante/common.tsx` → `speak()` | `u.lang = "en-GB"` hard-coded |
| AI | `src/lib/ai/prompts.ts`, `src/lib/ai-schemas.ts` | "patient English teacher", "ELi Readers", definitions "in English" |
| Interface text | `review-tab.tsx`, `vocab-tab.tsx`, `study-tab.tsx` | "PT → English", "English definition", "summary in English", copied requests mentioning English |
| Reading map | `src/remotion/Journey.tsx` | takes the steps; does not depend on the language |

The good part: the interface (shelf, notebook, flashcards, study kit and map) does not depend on the language. The work is in the **data model** and in the **text and requests that mention English**.

---

## 2. Book sources

### French

| Series | Publisher | Levels | Notes |
|---|---|---|---|
| Lectures ELi (Poussins, Juniors, Seniors) | ELi | A1 → B2 | Same format as the English readers already in the app. Not on elipublishing.com; look in ELi's French catalog |
| Lire en français facile | Hachette FLE | A1 → B2 | A classic series, with adapted classics and original stories |
| Lectures CLE en français facile | CLE International | A1 → B2 | Widely used in schools |
| Mondes en VF | Didier | A1 → B2 | Original, contemporary stories |
| Lire et s'entraîner | Black Cat (Cideb) | A1 → B2 | Comes with activities and audio |

**Free extras:** RFI *Journal en français facile* (daily news with audio and transcript), TV5Monde *Apprendre le français* (A1 → C1, with exercises) and classics on Project Gutenberg (B2 and up, unadapted).

### German

| Series | Publisher | Levels | Notes |
|---|---|---|---|
| ELi Lektüren (Junge, Jugendliche, Erwachsene) | ELi | A1 → B2 | Same format as the English readers |
| Leichte Lektüren (Felix & Theo) | Klett / Langenscheidt | A1 → B1 | Short, very popular detective stories |
| Lesehefte / Lese-Novelas | Hueber | A1 → B1 | Short stories for adults |
| Lesen und Üben | Black Cat (Cideb) | A1 → B2 | Adapted classics, with activities |

**Free extras:** Deutsche Welle *Langsam gesprochene Nachrichten* (news read slowly, with text), DW *Nicos Weg* (video course, A1 → B1) and DW *Top-Thema* (B1, with vocabulary).

### Spanish

| Series | Publisher | Levels | Notes |
|---|---|---|---|
| Lecturas ELi (Infantiles, Juveniles, Adultos) | ELi | A1 → B2 | Same format as the English readers |
| Lecturas graduadas | Edinumen | A1 → B2 | Original stories |
| Lola Lago, detective / Lecturas graduadas | Difusión | A1 → B2 | A widely used detective series |
| Lecturas graduadas | SGEL | A1 → B2 | Classics and originals |
| Leer y aprender | Black Cat (Cideb) | A1 → B2 | Adapted classics, with activities |

**Free extras:** *Practica Español* (news with exercises by level, from EFE with the Instituto Cervantes) and the Instituto Cervantes' *AVE* (online course, partly free).

### More English books

| Series | Publisher | Levels | Notes |
|---|---|---|---|
| Oxford Bookworms Library | Oxford | Stage 1 → 6 (400 → 2,500 headwords) | Headword scale, like ELi's |
| Penguin Readers | Penguin / Pearson | Level 1 → 7 | Many current and film titles |
| Cambridge English Readers / Experience Readers | Cambridge | Starter → Advanced | Original stories for adults |
| Macmillan Readers | Macmillan | Starter → Upper | Classics and originals |
| Reading & Training | Black Cat (Cideb) | A1 → C1 | With activities and audio |
| Helbling Readers | Helbling | A1 → B2 | Fiction and non-fiction |

**Free and open:**
- **Standard Ebooks** and **Project Gutenberg**: public-domain classics, for B2 and C1.
- **StoryWeaver**: openly licensed (Creative Commons) children's stories, good for Pre-A1 and A1.
- **VOA Learning English**: news in simplified English, with audio.
- **Breaking News English**: the same story written at 7 levels.

---

## 3. Where to get covers and data (without scraping sites)

At first the covers came straight from ELi's CDN. For many publishers that does not scale and is fragile. The recommended path:

1. **A hand-curated catalog by ISBN.** For each series, build a sheet with ISBN, title, author, level, series and publisher. The ISBN is on each book's page and on the back cover.
2. **Covers from Open Library**, by ISBN: `https://covers.openlibrary.org/b/isbn/<ISBN>-M.jpg`. Free, no key.
3. **Synopsis, pages and language** from the Google Books API (`https://www.googleapis.com/books/v1/volumes?q=isbn:<ISBN>`) or Open Library (`https://openlibrary.org/isbn/<ISBN>.json`). Both allow light use without a key.
4. **Fallback:** with no cover, the app shows a typeset cover (title and level), since `BookCover` accepts books without one.
5. **Respect rights:** keep only metadata (title, author, level, ISBN, short synopsis) and link to the publisher's page. Never download or serve publishers' PDFs or audio.

---

## 4. Proposed data model

### Book

```ts
type Book = {
  id: string;        // "<language>:<series>:<slug>", e.g. "fr:hachette-lff:le-comte-de-monte-cristo"
  lang: Lang;        // "en" | "fr" | "de" | "es"
  series: string;    // "eli", "hachette-lff", "oxford-bookworms", ...
  t: string;         // title
  a: string;         // author
  cefr: Cefr;        // normalized level: "Pre-A1" | "A1" | "A2" | "B1" | "B2" | "C1"
  lv?: string;       // level as the publisher writes it ("Stage 3", "Level 4", "A2/B1")
  hw?: number;       // headwords, when the series gives them
  cat?: string;      // genre
  s?: string;        // synopsis
  isbn?: string;
  cover?: string;    // absolute cover URL (Open Library, publisher or CDN)
  url?: string;      // the book's page at the publisher
  tags?: string;
};
```

- **Files:** one per series, at `src/data/<language>/<series>.json`, for example `src/data/fr/hachette-lff.json`. An index brings them together.
- **`cefr` drives the order** of the shelf and the map in every language. `hw` still applies when the series uses headwords (ELi, Oxford).
- **Equivalence table** in `src/lib/levels.ts`. For example: Oxford Stage 1 = A1, Penguin Level 3 = B1. The Extensive Reading Foundation scale helps align different series.

### Words and progress

- `progress` uses the string `id` (`"fr:..."`), so books from different publishers do not collide.
- `Word` gets `lang`, and the notebook, flashcards and reviews filter by the current language.
- Each language has its own streak and its own map. The calendar can show them all together.

### Migrating without losing anything

`normalize()` in `src/lib/store.tsx` already converts old backups. The new version would:

- `v: 1` → `v: 2`.
- Turn each numeric `progress` key into `"en:eli:<slug>"`, looking up the book's `slug` (`u`) in `books.json`.
- Give every word without `lang` the value `"en"`.
- Use the new `id` for books added to the notebook from the kit (`book`).
- Keep the localStorage key (`estante-eli-app-v1`). Only the content changes version.

---

## 5. What changes in the app

| Area | Change |
|---|---|
| **Switching language** | Done through the **profile** (section 6): a switch at the top of the sidebar and on phones. The active profile lives in a context (`useProfile()`) and in localStorage |
| **Home** | Greeting, pile, reviews, calendar and "by level" for the current language; one reading map per language, each ending in its own "Fluency" |
| **Shelf** | A series/publisher filter next to genre; the steps come from `cefr` (and `hw` when present) |
| **Book** | Show series, publisher and ISBN; "See on the publisher's site" uses `url` |
| **Hearing a word** | `speak(text, lang)` with `en-GB`, `fr-FR`, `de-DE` and `es-ES`, picking an installed voice for that language when there is one |
| **Vocabulary** | "Definition in {language}"; article and gender for German and French (der/die/das, le/la); verbs with the infinitive |
| **Review** | "PT → {language}"; compare the answer ignoring optional accents (é/e, ü/u) and show the difference |
| **Study** | `GRAMMAR_BY_LEVEL` and `AFTER_READING_QUESTIONS` per language; summary "in {language}" |
| **AI** | `SYSTEM` and the prompts take the language: "a patient {French} teacher", examples and definitions in the language being studied, explanations in Portuguese; `ai-schemas.ts` describes the fields without mentioning English |
| **Backup** | Export and import carry every language; the file states the model version |

### Grammar by level (examples to start with)

- **French:** A1: être/avoir, articles, present; A2: passé composé with avoir/être, futur proche; B1: imparfait vs passé composé, present subjonctif; B2: plus-que-parfait, conditionnel passé.
- **German:** A1: Präsens, articles and the Nominativ/Akkusativ cases; A2: Perfekt, Dativ, modal verbs; B1: Nebensätze (weil, dass), Präteritum, Passiv; B2: Konjunktiv II, Relativsätze.
- **Spanish:** A1: ser/estar, present; A2: pretérito perfecto vs indefinido, ir a + infinitive; B1: imperfecto vs indefinido, present subjuntivo; B2: condicional, imperfect subjuntivo.

---

## 6. Language profiles and choice of book source

The core idea: **the app always shows one language and one source at a time.** You switch profiles to switch languages and, inside a profile, choose which book source you are following. Everything else adapts to those two choices.

### Profile = one language

- Each profile is a language you study: **English**, **French**, **German**, **Spanish**...
- Inside a profile, **only that language shows up**: shelf, notebook, flashcards, today's reviews, map, grammar, voice and AI. No French books mixed into the English profile.
- **Switching profiles:** a switch at the top of the sidebar (flag or code + name) and at the top on phones. Instant, no reload.
- **Creating a profile:** pick the language, the level you think you are at (so the map starts in the right place) and the first book source.
- **Each profile has its own:** progress, words, study days and streak, kits and summaries, and preferred AI provider/model (optional; the global AI by default).
- **Overview (optional):** a summary of every profile, with books read, words and days per language, for people studying more than one at a time.

### Book source = the collection you are following

Inside a profile you choose **one or more sources**, for example: in English, ELi Readers, Oxford Bookworms or Penguin Readers; in French, Lectures ELi or Hachette.

**What adapts to the chosen source:**

| Part of the app | How it adapts |
|---|---|
| **Shelf** | Shows only the books from the active source(s). The level and genre filters become that series' own |
| **Steps and map** | Use the series' own scale: headwords for ELi and Oxford (400 → 2,500), "Level 1–7" for Penguin, CEFR for the rest. The map gets that scale's "cities" |
| **Next book** | "Next stop" and "Your pile" come from that series' order |
| **Study kit and AI** | The request names the series and the level its way ("Oxford Bookworms Stage 3, 1,000 headwords") |
| **Book link** | "See on the publisher's site" points to the series' publisher |
| **Covers** | Come from the source configured for the series (publisher CDN or Open Library by ISBN) |

**What does not change when switching source within the same language:**

- The **notebook and flashcards** belong to the profile, not the source. A word learned in an ELi book stays in reviews when you move to Oxford.
- **Each source's progress is kept.** Switching source deletes nothing: when you come back, everything is where you left it.
- The **calendar and streak** count any study in the language.

**Mixing sources:** more than one can be active at once (e.g. ELi + Oxford). The shelf then groups by series or merges everything by CEFR level, and the map uses CEFR as the common scale, since headwords from different series do not line up.

### How this looks in the data model

```ts
type Profile = {
  id: string;              // "en", "fr", ... (one profile per language)
  lang: Lang;
  name: string;            // "English"
  bases: string[];         // active series, e.g. ["eli"] or ["eli", "oxford-bookworms"]
  startLevel?: Cefr;       // where the map starts
  ai?: { provider?: ProviderId; model?: string };
  createdAt: string;
};

type Data = {
  v: 3;
  activeProfile: string;
  profiles: Record<string, Profile>;
  // everything that is global today becomes per profile:
  byProfile: Record<string, { progress: Progress; words: Word[]; kits: Kits; essays: Essays; days: string[] }>;
};
```

- **Migration:** today's data becomes the **"en"** profile, with the **"eli"** source active. The current user opens the app and sees exactly what they saw before.
- **Catalog loaded per profile:** only the `src/data/<language>/<series>.json` files of the active sources are loaded (dynamic `import()`), which keeps the app light.
- **Backup:** export can carry one profile or all; import asks whether to merge or replace.

### New screens

- **Profile switcher:** a list of profiles with the language and a mini summary (level, books read), plus "New profile".
- **Create profile:** three steps, in the same style as "Connect AI": language → approximate level → book source.
- **Choose sources:** in the profile's Settings or from a button on the Shelf, with a card per series showing publisher, level range, number of books and whether it has covers.

---

## 7. Suggested order

1. **Generalize the model** (sections 4 and 6): books with language and series, **profiles**, and migrating current data to the "en" profile with the "eli" source. Nothing changes for the user.
2. **Book source as a choice:** the shelf, steps, map and kit read the active series' scale, still with ELi only.
3. **More English series** (Oxford Bookworms and Penguin Readers first). The first real test of switching sources and of the equivalence table.
4. **Profile switcher and parameterized text:** `speak`, AI prompts, labels and grammar per language.
5. **First new language: Spanish or French**, with a single series (ideally ELi's, for the matching format) and covers from Open Library.
6. **German**, with articles and cases in the notebook.
7. **Free sources as "daily reading"** (RFI, DW, VOA): one link per level on Home, without copying the content.

## 8. Risks and care

- **Third-party covers and data:** publishers may change URLs or forbid hotlinking. Open Library by ISBN and the fallback cover avoid a broken screen.
- **Levels differ between series:** one publisher's "B1" may be harder than another's. The equivalence table is an approximation; note the source of each mapping.
- **Browser voice:** not every device has a French, German or Spanish voice installed. The listen button should disappear when there is none.
- **AI:** free models are weaker outside English. Test summary correction in each language with more than one provider.
- **Bundle size:** with thousands of books, load the catalog per language on demand (dynamic `import()`) instead of all at once.
