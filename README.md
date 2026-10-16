# Babel

App pessoal para aprender idiomas **lendo**. Começou pelo inglês e hoje tem perfis para inglês, francês, alemão e espanhol. Junta uma estante de *graded readers* e livros grátis, organizada por nível (Pre-A1 → C1), com vocabulário, revisões, quiz, prática escrita e falada e materiais de estudo grátis.

Não precisa de conta nem de servidor: o progresso fica no navegador, e a IA é opcional, com a chave de cada pessoa.

## Sumário

- [O que tem no app](#o-que-tem-no-app)
- [Bases de livros](#bases-de-livros)
- [IA: cada pessoa usa a própria chave](#ia-cada-pessoa-usa-a-própria-chave)
- [Seus dados](#seus-dados)
- [Rodar no computador](#rodar-no-computador)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Deploy na Vercel](#deploy-na-vercel)
- [Commits](#commits)
- [Planos e documentação](#planos-e-documentação)
- [Licenças](#licenças)

## O que tem no app

| Aba | O que faz |
|---|---|
| **Início** | Pilha de leitura, missão do dia, leitura do dia, revisões pendentes, calendário dos dias estudados, progresso por nível e o mapa de leitura animado. |
| **Estante** | Capas em prateleiras por nível, gênero ou status, com busca, filtros, a ficha de cada livro, "Onde ler e ouvir" e as palavras frequentes dos livros com texto livre. |
| **Vocabulário** | Caderno de palavras com tradução (editável), definição e exemplo gerados pela IA, botão do Cambridge e vocabulário estimado. |
| **Citações** | Trechos dos livros guardados com tradução. |
| **Revisar** | Flashcards de palavras e frases com repetição espaçada (1, 2, 4, 8, 16 e 32 dias) e treinos: Ditado, Pares, Escrever e Falar (grava a sua voz para comparar). |
| **Estudar** | Kit de pré-leitura do livro (palavras-chave, gramática, perguntas), correção do resumo e diário com tarefa do dia por nível. A correção marca os erros, mostra a diferença e vira flashcards. |
| **Quiz** | Quiz do livro gerado pela IA (história, palavras no contexto e gramática) e quiz das suas palavras, sem IA. Erros voltam para as revisões e para a gramática a rever. |
| **Materiais** | Sites e playlists grátis por nível e habilidade, aula em que você parou, pacotes de palavras (NGSL e pacotes para brasileiros: falsos cognatos, phrasal verbs, teste de pronúncia), 95 exercícios de gramática em 19 temas, teste de nível do app com a lista *can-do* do CEFR e links seus. |

Também tem animações em [Remotion](https://www.remotion.dev/) (o aviãozinho do mapa de leitura e a comemoração ao terminar um livro), tema claro e escuro e pronúncia pela voz do navegador, com gravações do Wiktionary quando o navegador não tem voz para o idioma.

## Bases de livros

Cada perfil escolhe a base que vai usar, e o mapa e o progresso seguem essa escolha.

| Idioma | Bases |
|---|---|
| Inglês | ELi Readers (177), StoryWeaver, Global Storybooks, Book Dash, Gutenberg Readers, Gutenberg Infantis, LibriVox, Gutenberg Clássicos |
| Francês, alemão, espanhol | StoryWeaver, Global Storybooks, Gutenberg Readers, Gutenberg Clássicos |

Os níveis das bases infantis são convertidos para um CEFR aproximado, e o nível original aparece ao lado. Detalhes e fontes avaliadas em [docs/idiomas](docs/idiomas/README.md).

## IA: cada pessoa usa a própria chave

O site não tem chave de API embutida. Quem quiser os recursos de IA abre **Configurações**, escolhe um provedor e cola a própria chave:

| Provedor | Custo | Onde gerar a chave |
|---|---|---|
| Gemini (Google) | grátis, sem cartão | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Groq | grátis | [console.groq.com/keys](https://console.groq.com/keys) |
| OpenRouter | grátis nos modelos `:free` (cerca de 50 pedidos/dia) | [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys) |
| Claude (Anthropic) | pago, poucos centavos por pedido | [console.anthropic.com](https://console.anthropic.com/settings/keys) |

- Ao conectar, o app lista os modelos da chave e sugere o melhor para cada tarefa (dá para trocar).
- As chamadas vão direto do navegador para o provedor. Nenhuma chave passa pelo servidor do site.
- No plano grátis do Gemini, o Google pode usar o conteúdo enviado para melhorar os produtos dele.
- Sem chave, tudo funciona: os botões de IA viram "copiar pedido", para colar em qualquer chat de IA.

## Seus dados

Tudo fica no `localStorage` do navegador: progresso, palavras, revisões, textos e chaves de IA. Para levar para outro aparelho ou guardar uma cópia, use **Configurações → Exportar** e depois **Importar**.

## Rodar no computador

Precisa de Node.js 20 ou mais novo.

```bash
npm install
npm run dev          # http://localhost:3000
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build |
| `npm run lint` | ESLint |
| `npm run check-links` | Testa os links do catálogo de Materiais e das páginas de gramática (sai com erro se algum caiu) |

## Estrutura do projeto

```
src/
  app/                  layout e página única (Next.js App Router)
  components/estante/   as abas e telas do app
  components/ui/        componentes shadcn/ui
  data/                 catálogos em JSON: livros, bases, materiais, pacotes de palavras, gramática
  lib/                  estado e backup, regras dos livros, recomendações, missão, pronúncia
  lib/ai/               provedores, prompts e escolha de modelo por tarefa
  remotion/             animações do mapa e da comemoração
scripts/check-links.mjs verificação dos links
docs/                   planos de idiomas e de materiais
```

Feito com Next.js 16, React 19, [shadcn/ui](https://ui.shadcn.com/), Tailwind 4, Motion, Phosphor Icons, Zod e Remotion.

## Deploy na Vercel

1. Em [vercel.com/new](https://vercel.com/new), importe o repositório (a Vercel detecta Next.js sozinha).
2. Clique em **Deploy**. Não precisa de variável de ambiente.

Ou pelo terminal: `npx vercel`. O site é 100% estático, sem rota de servidor, então não gera custo de função.

## Commits

Os commits seguem o [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/), com a descrição em inglês, no imperativo e sem ponto final:

```
tipo(escopo): descrição curta

Corpo opcional explicando o porquê, depois de uma linha em branco.
```

| Tipo | Quando usar |
|---|---|
| `feat` | recurso novo |
| `fix` | correção de bug |
| `docs` | só documentação (README, `docs/`) |
| `style` | visual ou formatação, sem mudar comportamento |
| `refactor` | reorganização de código, sem mudar comportamento |
| `perf` | desempenho |
| `test` | testes |
| `build` | dependências, Next.js, configuração de build |
| `ci` | automações |
| `chore` | manutenção que não entra nas outras |
| `revert` | desfaz um commit |

Escopos sugeridos: `home`, `books`, `vocab`, `quotes`, `review`, `study`, `quiz`, `materials`, `ai`, `backup`, `data`, `ui`.

Exemplos:

```
feat(review): add dictation, pairs and writing practice
fix(review): hide the next card's answer while flipping back
docs: describe the commit convention in the README
```

O `npm install` liga o hook `.githooks/commit-msg`, que recusa mensagens fora do padrão ou com a primeira linha acima de 72 caracteres. Se o hook não estiver ativo, rode `npm run prepare`.

## Planos e documentação

- [docs/idiomas](docs/idiomas/README.md): perfis por idioma e bases de livros.
- [docs/ingles](docs/ingles/README.md): materiais grátis de inglês e o que já foi feito.

## Licenças

- Remotion é gratuito para uso individual. Empresas com mais de 3 pessoas precisam de licença: veja [remotion.dev/license](https://remotion.dev/license).
- Capas e textos dos livros pertencem às editoras e aos projetos de origem; o app só aponta para eles.
