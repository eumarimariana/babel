# Novos idiomas e mais livros no Babel

Plano para levar o Babel além do inglês (francês, alemão e espanhol), ampliar a estante de inglês com outras editoras e fontes gratuitas, e organizar tudo em **perfis por idioma** com **escolha da base de livros**.

> **Status:** só planejamento, nada disso está implementado.
> As séries e os sites listados abaixo foram reunidos de memória. Antes de usar qualquer um, confira o catálogo atual, os níveis e as regras de uso de cada editora.

---

## 1. Como o app funciona hoje

Tudo foi feito para **um idioma (inglês) e uma fonte (ELi Readers)**:

| Parte | Onde está | O que é específico de inglês/ELi |
|---|---|---|
| Catálogo | `src/data/books.json` | 177 livros da ELi, `id` numérico da editora, capa no CDN da ELi (`c`) |
| Regras do catálogo | `src/lib/books.ts` | `STAGES` (degraus por headwords da ELi), `levelSlot`, `GRAMMAR_BY_LEVEL` e `AFTER_READING_QUESTIONS` em inglês, `bookUrl` e `coverUrl` da ELi |
| Progresso e palavras | `src/lib/store.tsx` | `progress` usa o `id` do livro como chave; `Word` não diz de que idioma é |
| Ouvir palavra | `src/components/estante/common.tsx` → `speak()` | `u.lang = "en-GB"` fixo |
| IA | `src/lib/ai/prompts.ts`, `src/lib/ai-schemas.ts` | "patient English teacher", "ELi Readers", definições "in English" |
| Textos da interface | `review-tab.tsx`, `vocab-tab.tsx`, `study-tab.tsx` | "PT → inglês", "Definição em inglês", "resumo em inglês", pedidos copiados citando inglês |
| Mapa de leitura | `src/remotion/Journey.tsx` | recebe os degraus; não depende do idioma |

O bom: a interface (estante, caderno, flashcards, kit de estudo e mapa) não depende do idioma. O trabalho está no **modelo de dados** e nos **textos e pedidos que citam inglês**.

---

## 2. Fontes de livros

### Francês

| Série | Editora | Níveis | Observação |
|---|---|---|---|
| Lectures ELi (Poussins, Juniors, Seniors) | ELi | A1 → B2 | Mesmo formato dos readers de inglês que já estão no app. Não aparece no elipublishing.com; procurar no catálogo da ELi para francês |
| Lire en français facile | Hachette FLE | A1 → B2 | Série clássica, com clássicos adaptados e histórias originais |
| Lectures CLE en français facile | CLE International | A1 → B2 | Muito usada em escolas |
| Mondes en VF | Didier | A1 → B2 | Histórias originais e contemporâneas |
| Lire et s'entraîner | Black Cat (Cideb) | A1 → B2 | Vem com atividades e áudio |

**Para complementar, de graça:** RFI *Journal en français facile* (notícias diárias com áudio e transcrição), TV5Monde *Apprendre le français* (A1 → C1, com exercícios) e clássicos no Project Gutenberg (do B2 para cima, sem adaptação).

### Alemão

| Série | Editora | Níveis | Observação |
|---|---|---|---|
| ELi Lektüren (Junge, Jugendliche, Erwachsene) | ELi | A1 → B2 | Mesmo formato dos readers de inglês |
| Leichte Lektüren (Felix & Theo) | Klett / Langenscheidt | A1 → B1 | Histórias policiais curtas, muito populares |
| Lesehefte / Lese-Novelas | Hueber | A1 → B1 | Histórias curtas para adultos |
| Lesen und Üben | Black Cat (Cideb) | A1 → B2 | Clássicos adaptados, com atividades |

**Para complementar, de graça:** Deutsche Welle *Langsam gesprochene Nachrichten* (notícias lidas devagar, com texto), DW *Nicos Weg* (curso em vídeo, A1 → B1) e DW *Top-Thema* (B1, com vocabulário).

### Espanhol

| Série | Editora | Níveis | Observação |
|---|---|---|---|
| Lecturas ELi (Infantiles, Juveniles, Adultos) | ELi | A1 → B2 | Mesmo formato dos readers de inglês |
| Lecturas graduadas | Edinumen | A1 → B2 | Histórias originais |
| Lola Lago, detective / Lecturas graduadas | Difusión | A1 → B2 | Série policial muito usada |
| Lecturas graduadas | SGEL | A1 → B2 | Clássicos e originais |
| Leer y aprender | Black Cat (Cideb) | A1 → B2 | Clássicos adaptados, com atividades |

**Para complementar, de graça:** *Practica Español* (notícias com exercícios por nível, da EFE com o Instituto Cervantes) e *AVE* do Instituto Cervantes (curso online, com parte gratuita).

### Mais livros em inglês

| Série | Editora | Níveis | Observação |
|---|---|---|---|
| Oxford Bookworms Library | Oxford | Stage 1 → 6 (400 → 2.500 headwords) | Escala por headwords, como a da ELi |
| Penguin Readers | Penguin / Pearson | Level 1 → 7 | Muitos títulos atuais e de filmes |
| Cambridge English Readers / Experience Readers | Cambridge | Starter → Advanced | Histórias originais para adultos |
| Macmillan Readers | Macmillan | Starter → Upper | Clássicos e originais |
| Reading & Training | Black Cat (Cideb) | A1 → C1 | Com atividades e áudio |
| Helbling Readers | Helbling | A1 → B2 | Ficção e não ficção |

**Gratuitas e abertas:**
- **Standard Ebooks** e **Project Gutenberg**: clássicos em domínio público, para o B2 e o C1.
- **StoryWeaver**: histórias infantis com licença aberta (Creative Commons), boas para Pre-A1 e A1.
- **VOA Learning English**: notícias em inglês simplificado, com áudio.
- **Breaking News English**: a mesma notícia escrita em 7 níveis.

---

## 3. De onde tirar capas e dados (sem depender de raspar sites)

Hoje as capas vêm direto do CDN da ELi. Para várias editoras isso não escala e fica frágil. O caminho recomendado:

1. **Catálogo curado à mão por ISBN.** Para cada série, montar uma planilha com ISBN, título, autor, nível, série e editora. O ISBN aparece na página de cada livro e na contracapa.
2. **Capas pela Open Library**, pelo ISBN: `https://covers.openlibrary.org/b/isbn/<ISBN>-M.jpg`. É grátis e não exige chave.
3. **Resumo, páginas e idioma** pela Google Books API (`https://www.googleapis.com/books/v1/volumes?q=isbn:<ISBN>`) ou pela Open Library (`https://openlibrary.org/isbn/<ISBN>.json`). Ambas aceitam uso leve sem chave.
4. **Reserva:** se não houver capa, o app já mostra uma capa tipográfica (título e nível), porque `BookCover` aceita livro sem capa.
5. **Respeitar direitos:** guardar só metadados (título, autor, nível, ISBN, resumo curto) e linkar para a página da editora. Nada de baixar ou servir PDFs e áudios das editoras.

---

## 4. Modelo de dados proposto

### Livro

```ts
type Book = {
  id: string;        // "<idioma>:<série>:<slug>", ex. "fr:hachette-lff:le-comte-de-monte-cristo"
  lang: Lang;        // "en" | "fr" | "de" | "es"
  series: string;    // "eli", "hachette-lff", "oxford-bookworms", ...
  t: string;         // título
  a: string;         // autor
  cefr: Cefr;        // nível normalizado: "Pre-A1" | "A1" | "A2" | "B1" | "B2" | "C1"
  lv?: string;       // nível como a editora escreve ("Stage 3", "Level 4", "A2/B1")
  hw?: number;       // headwords, quando a série informa
  cat?: string;      // gênero
  s?: string;        // resumo
  isbn?: string;
  cover?: string;    // URL absoluta da capa (Open Library, editora ou CDN)
  url?: string;      // página do livro na editora
  tags?: string;
};
```

- **Arquivos:** um por série, em `src/data/<idioma>/<série>.json`, por exemplo `src/data/fr/hachette-lff.json`. Um índice junta tudo.
- **`cefr` é o que ordena** a estante e o mapa em qualquer idioma. Os `hw` continuam valendo quando a série usa headwords (ELi, Oxford).
- **Tabela de equivalência** em `src/lib/levels.ts`. Exemplo: Oxford Stage 1 = A1, Penguin Level 3 = B1. A escala da Extensive Reading Foundation ajuda a alinhar séries diferentes.

### Palavras e progresso

- `progress` passa a usar o `id` em texto (`"fr:..."`), então livros de editoras diferentes não colidem.
- `Word` ganha `lang`, e o caderno, os flashcards e as revisões filtram pelo idioma atual.
- Cada idioma tem a própria sequência de dias e o próprio mapa. O calendário pode mostrar todos juntos.

### Migração sem perder nada

`normalize()` em `src/lib/store.tsx` já converte backups antigos. A versão nova faria:

- `v: 1` → `v: 2`.
- Cada chave numérica de `progress` vira `"en:eli:<slug>"`, procurando o `slug` (`u`) do livro em `books.json`.
- Toda palavra sem `lang` recebe `"en"`.
- Livros adicionados ao caderno a partir do kit (`book`) usam o `id` novo.
- A chave do localStorage (`estante-eli-app-v1`) continua a mesma. Só o conteúdo muda de versão.

---

## 5. O que muda no app

| Área | Mudança |
|---|---|
| **Troca de idioma** | Feita pelo **perfil** (seção 6): seletor no topo do menu lateral e do celular. O perfil ativo fica num contexto (`useProfile()`) e no localStorage |
| **Início** | Saudação, pilha, revisões, calendário e "por nível" do idioma atual; um mapa de leitura por idioma, cada um com a sua "Fluência" no fim |
| **Estante** | Filtro de série/editora junto com gênero; os degraus vêm de `cefr` (e `hw` quando existir) |
| **Livro** | Mostrar série, editora e ISBN; "Ver no site da editora" usa `url` |
| **Ouvir palavra** | `speak(text, lang)` com `en-GB`, `fr-FR`, `de-DE` e `es-ES`, escolhendo uma voz instalada desse idioma quando existir |
| **Vocabulário** | "Definição em {idioma}"; artigo e gênero para alemão e francês (der/die/das, le/la); verbos com o infinitivo |
| **Revisar** | "PT → {idioma}"; comparar a resposta ignorando acentos opcionais (é/e, ü/u) e mostrar a diferença |
| **Estudar** | `GRAMMAR_BY_LEVEL` e `AFTER_READING_QUESTIONS` por idioma; resumo "em {idioma}" |
| **IA** | `SYSTEM` e os prompts recebem o idioma: "a patient {French} teacher", exemplos e definições no idioma estudado, explicações em português; `ai-schemas.ts` descreve os campos sem citar inglês |
| **Backup** | Exportar e importar levam todos os idiomas; o arquivo informa a versão do modelo |

### Gramática por nível (exemplos para começar)

- **Francês:** A1: être/avoir, artigos, presente; A2: passé composé com avoir/être, futur proche; B1: imparfait × passé composé, subjonctif presente; B2: plus-que-parfait, conditionnel passé.
- **Alemão:** A1: Präsens, artigos e casos Nominativ/Akkusativ; A2: Perfekt, Dativ, verbos modais; B1: Nebensätze (weil, dass), Präteritum, Passiv; B2: Konjunktiv II, Relativsätze.
- **Espanhol:** A1: ser/estar, presente; A2: pretérito perfecto × indefinido, ir a + infinitivo; B1: imperfecto × indefinido, subjuntivo presente; B2: condicional, subjuntivo imperfecto.

---

## 6. Perfis por idioma e escolha da base de livros

Ideia central: **o app sempre mostra um idioma e uma base de cada vez.** Você troca de perfil para trocar de idioma e, dentro do perfil, escolhe qual base de livros está seguindo. Todo o resto se adapta a essas duas escolhas.

### Perfil = um idioma

- Cada perfil é um idioma que você estuda: **Inglês**, **Francês**, **Alemão**, **Espanhol**...
- Ao entrar num perfil, **só aparece o que é daquele idioma**: estante, caderno, flashcards, revisões do dia, mapa, gramática, voz e IA. Nada de livros em francês misturados no perfil de inglês.
- **Troca de perfil:** um seletor no topo do menu lateral (bandeira ou sigla + nome) e no topo do celular. A troca é instantânea, sem recarregar.
- **Criar um perfil:** escolher o idioma, o nível em que você acha que está (para o mapa começar no lugar certo) e a primeira base de livros.
- **Cada perfil tem o seu:** progresso, palavras, dias estudados e sequência, kits e resumos, e o provedor/modelo de IA preferido (opcional; por padrão usa a IA global).
- **Visão geral (opcional):** um resumo de todos os perfis, com livros lidos, palavras e dias por idioma, para quem estuda mais de um ao mesmo tempo.

### Base de livros = a coleção que você está seguindo

Dentro do perfil você escolhe **uma ou mais bases**, por exemplo: em inglês, ELi Readers, Oxford Bookworms ou Penguin Readers; em francês, Lectures ELi ou Hachette.

**O que se adapta à base escolhida:**

| Parte do app | Como se adapta |
|---|---|
| **Estante** | Mostra só os livros da(s) base(s) ativa(s). Os filtros de nível e gênero passam a ser os daquela série |
| **Degraus e mapa** | Usam a escala da própria série: headwords na ELi e na Oxford (400 → 2.500), "Level 1–7" na Penguin, CEFR nas outras. O mapa ganha as "cidades" dessa escala |
| **Próximo livro** | "Próxima parada" e "Sua pilha" saem da ordem daquela série |
| **Kit de estudo e IA** | O pedido cita a série e o nível do jeito dela ("Oxford Bookworms Stage 3, 1.000 headwords") |
| **Link do livro** | "Ver no site da editora" aponta para a editora da série |
| **Capas** | Vêm da fonte configurada para a série (CDN da editora ou Open Library por ISBN) |

**O que não muda ao trocar de base, dentro do mesmo idioma:**

- O **caderno e os flashcards** são do perfil, não da base. Uma palavra aprendida num livro da ELi continua nas revisões quando você passa para Oxford.
- O **progresso de cada base fica guardado**. Trocar de base não apaga nada: ao voltar, tudo está onde parou.
- O **calendário e a sequência de dias** contam qualquer estudo no idioma.

**Misturar bases:** dá para ativar mais de uma ao mesmo tempo (ex.: ELi + Oxford). Aí a estante agrupa por série ou junta tudo por nível CEFR, e o mapa usa CEFR como escala comum, porque headwords de séries diferentes não batem.

### Como isso fica no modelo de dados

```ts
type Profile = {
  id: string;              // "en", "fr", ... (um perfil por idioma)
  lang: Lang;
  name: string;            // "Inglês"
  bases: string[];         // séries ativas, ex. ["eli"] ou ["eli", "oxford-bookworms"]
  startLevel?: Cefr;       // onde o mapa começa
  ai?: { provider?: ProviderId; model?: string };
  createdAt: string;
};

type Data = {
  v: 3;
  activeProfile: string;
  profiles: Record<string, Profile>;
  // tudo o que hoje é global passa a ser por perfil:
  byProfile: Record<string, { progress: Progress; words: Word[]; kits: Kits; essays: Essays; days: string[] }>;
};
```

- **Migração:** os dados de hoje viram o perfil **"en"**, com a base **"eli"** ativa. O usuário atual abre o app e vê exatamente o que via antes.
- **Catálogo carregado por perfil:** só os arquivos `src/data/<idioma>/<série>.json` das bases ativas são carregados (`import()` dinâmico), o que mantém o app leve.
- **Backup:** exportar pode levar um perfil ou todos; importar pergunta se é para juntar ou substituir.

### Telas novas

- **Seletor de perfil:** lista de perfis com o idioma e um mini-resumo (nível, livros lidos), mais "Novo perfil".
- **Criar perfil:** três passos, no mesmo estilo do "Ligar a IA": idioma → nível aproximado → base de livros.
- **Escolher bases:** nas Configurações do perfil ou num botão na Estante, com cards de cada série mostrando editora, faixa de níveis, quantidade de livros e se tem capas.

---

## 7. Ordem sugerida

1. **Generalizar o modelo** (seções 4 e 6): livros com idioma e série, **perfis**, e a migração dos dados atuais para o perfil "en" com a base "eli". Para quem usa, nada muda.
2. **Base de livros como escolha:** a estante, os degraus, o mapa e o kit passam a ler a escala da série ativa, ainda só com ELi.
3. **Mais séries de inglês** (Oxford Bookworms e Penguin Readers primeiro). É o primeiro teste de verdade da troca de base e da tabela de equivalência.
4. **Seletor de perfil e textos parametrizados:** `speak`, prompts da IA, rótulos e gramática por idioma.
5. **Primeiro idioma novo: espanhol ou francês**, com uma série só (de preferência a da ELi, pelo formato igual) e capas pela Open Library.
6. **Alemão**, com a parte de artigos e casos no caderno.
7. **Fontes gratuitas como "leituras do dia"** (RFI, DW, VOA): um link por nível na Início, sem copiar o conteúdo.

## 8. Riscos e cuidados

- **Capas e dados de terceiros:** editoras podem mudar URLs ou proibir hotlink. Open Library por ISBN e a capa de reserva evitam tela quebrada.
- **Níveis diferentes entre séries:** "B1" de uma editora pode ser mais difícil que o de outra. A tabela de equivalência é uma aproximação; vale anotar a fonte de cada mapeamento.
- **Voz do navegador:** nem todo aparelho tem voz em francês, alemão ou espanhol instalada. O botão de ouvir deve sumir quando não houver.
- **IA:** modelos gratuitos são mais fracos fora do inglês. Testar a correção de resumos em cada idioma com mais de um provedor.
- **Tamanho do bundle:** com milhares de livros, carregar o catálogo por idioma sob demanda (`import()` dinâmico) em vez de tudo de uma vez.
