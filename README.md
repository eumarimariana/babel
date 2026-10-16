# Babel

A personal app for learning languages **by reading**. It started with English and now has profiles for English, French, German and Spanish. It brings together a shelf of graded readers and free books sorted by level (Pre-A1 → C1), with vocabulary, spaced-repetition reviews, quizzes, writing and speaking practice, and free study materials.

No account and no server: progress stays in the browser, and AI is optional, using each person's own key.

The interface is in Brazilian Portuguese, since it is built for Portuguese speakers. Tab names below are given in Portuguese with their meaning.

## Contents

- [Features](#features)
- [Book sources](#book-sources)
- [AI: bring your own key](#ai-bring-your-own-key)
- [Your data](#your-data)
- [Running locally](#running-locally)
- [Project structure](#project-structure)
- [Deploying to Vercel](#deploying-to-vercel)
- [Commits](#commits)
- [Plans and docs](#plans-and-docs)
- [License](#license)

## Features

| Tab | What it does |
|---|---|
| **Início** (Home) | Reading pile, daily mission, daily reading, due reviews, a calendar of study days, progress by level and the animated reading map. |
| **Estante** (Shelf) | Covers on shelves by level, genre or status, with search, filters, a page for each book, "where to read and listen" links, and the frequent words of books whose text is free. |
| **Vocabulário** (Vocabulary) | A word notebook with translation (editable), definition and example written by the AI, a Cambridge Dictionary button and an estimated vocabulary size. |
| **Citações** (Quotes) | Passages saved from books, with translation. |
| **Revisar** (Review) | Word and sentence flashcards with spaced repetition (1, 2, 4, 8, 16 and 32 days), plus drills: dictation, pairs, writing and speaking (records your voice so you can compare). |
| **Estudar** (Study) | A pre-reading kit for each book (key words, grammar, questions), correction of your summary, and a diary with a daily task by level. Corrections mark each mistake, show a diff and turn mistakes into flashcards. |
| **Quiz** | A book quiz written by the AI (story, words in context and grammar) and a quiz on your own words, with no AI. Mistakes go back into reviews and into the grammar to revisit. |
| **Materiais** (Materials) | Free sites and playlists by level and skill, the lesson you stopped at, word packs (NGSL, plus packs for Brazilians: false friends, phrasal verbs, a pronunciation ear test), 95 grammar exercises in 19 topics, the app's own level test with the CEFR can-do list, and your own links. |

There are also [Remotion](https://www.remotion.dev/) animations (a little plane flying along the reading map, and a celebration when you finish a book), light and dark themes, and pronunciation through the browser's voice, falling back to Wiktionary recordings when the browser has no voice for the language.

## Book sources

Each profile picks the source it follows, and the map and progress follow that choice.

| Language | Sources |
|---|---|
| English | ELi Readers (177), StoryWeaver, Global Storybooks, Book Dash, Gutenberg Readers, Gutenberg children's books, LibriVox, Gutenberg classics |
| French, German, Spanish | StoryWeaver, Global Storybooks, Gutenberg Readers, Gutenberg classics |

The children's sources use reading levels that the app maps to an approximate CEFR level, and the original level is shown alongside. Details, and the sources that were evaluated, are in [docs/languages](docs/languages/README.md).

## AI: bring your own key

The site has no built-in API key. Anyone who wants the AI features opens **Configurações** (Settings), picks a provider and pastes their own key:

| Provider | Cost | Get a key |
|---|---|---|
| Gemini (Google) | free, no card | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Groq | free | [console.groq.com/keys](https://console.groq.com/keys) |
| OpenRouter | free on `:free` models (about 50 requests a day) | [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys) |
| Claude (Anthropic) | paid, a few cents per request | [console.anthropic.com](https://console.anthropic.com/settings/keys) |

- When you connect, the app lists the key's models and suggests the best one for each task (you can change it).
- Calls go straight from the browser to the provider. No key ever passes through the site's server.
- On Gemini's free tier, Google may use what you send to improve its products.
- Everything works without a key: the AI buttons become "copy request", to paste into any AI chat.

## Your data

Everything is stored in the browser's `localStorage`: progress, words, reviews, texts and AI keys. To move to another device or keep a copy, use **Configurações → Exportar** (Export) and then **Importar** (Import).

## Running locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serves the build |
| `npm run lint` | ESLint |
| `npm run check-links` | Tests the links of the Materials catalog and the grammar pages (exits with an error if any is down) |

## Project structure

```
src/
  app/                  layout and the single page (Next.js App Router)
  components/estante/   the app's tabs and screens
  components/ui/        shadcn/ui components
  data/                 JSON catalogs: books, sources, materials, word packs, grammar
  lib/                  state and backup, book rules, recommendations, mission, pronunciation
  lib/ai/               providers, prompts and per-task model choice
  remotion/             map and celebration animations
scripts/check-links.mjs link checker
docs/                   plans for languages and materials
```

Built with Next.js 16, React 19, [shadcn/ui](https://ui.shadcn.com/), Tailwind 4, Motion, Phosphor Icons, Zod and Remotion.

## Deploying to Vercel

1. At [vercel.com/new](https://vercel.com/new), import the repository (Vercel detects Next.js on its own).
2. Click **Deploy**. No environment variables are needed.

Or from the terminal: `npx vercel`. The site is fully static, with no server routes, so it costs nothing in functions.

## Commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), with the description in English, in the imperative and without a trailing period:

```
type(scope): short description

Optional body explaining why, after a blank line.
```

| Type | When to use |
|---|---|
| `feat` | a new feature |
| `fix` | a bug fix |
| `docs` | documentation only (README, `docs/`) |
| `style` | visuals or formatting, no change in behavior |
| `refactor` | code reorganization, no change in behavior |
| `perf` | performance |
| `test` | tests |
| `build` | dependencies, Next.js, build setup |
| `ci` | automation |
| `chore` | upkeep that fits none of the above |
| `revert` | undoes a commit |

Suggested scopes: `home`, `books`, `vocab`, `quotes`, `review`, `study`, `quiz`, `materials`, `ai`, `backup`, `data`, `ui`.

Examples:

```
feat(review): add dictation, pairs and writing practice
fix(review): hide the next card's answer while flipping back
docs: describe the commit convention in the README
```

`npm install` turns on the `.githooks/commit-msg` hook, which rejects messages outside this format or with a first line over 72 characters. If the hook is not active, run `npm run prepare`.

## Plans and docs

- [docs/languages](docs/languages/README.md): language profiles and book sources.
- [docs/english](docs/english/README.md): free English materials and what has been built.

## License

- **Code:** all rights reserved. The repository is public for viewing only: copying, modifying or reusing the code requires permission. See [LICENSE](LICENSE).
- Remotion is free for individuals. Companies with more than 3 people need a license: see [remotion.dev/license](https://remotion.dev/license).
- Book covers and texts belong to their publishers and source projects; the app only links to them.
