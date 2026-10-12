# Materiais grátis de inglês no Babel

Plano para aproveitar a sua lista de sites, playlists e dicionários no app. A ideia não é virar uma pasta de favoritos. Cada material deve aparecer **na hora em que serve**: quando você lê um livro, erra no quiz ou anota uma palavra.

> **Status:**
> - **Etapa 1 feita:** aba Materiais com 45 materiais grátis (os 21 da sua lista e mais 24 sugeridos depois, ver o passo 14) (`src/data/recursos-en.json`), filtro de nível que começa no nível do mapa, filtro por habilidade e por status, nota de 1 a 5 e anotação em cada material, salvos no backup.
> - **Etapa 2 feita:** botão do Cambridge (ícone de livro aberto) em cada palavra do Vocabulário, do Estudar e das Revisões (só depois de ver a resposta), e o link "Conferir no Cambridge" ao anotar. Usa a busca do Cambridge, que abre o verbete e aceita expressões. Inglês abre o inglês–português; francês, alemão e espanhol abrem o dicionário para inglês, porque o Cambridge não tem esses idiomas para português.
> - **Etapa 3 feita:** as playlists guardam a aula em que você parou (+ / −), e o botão vira "Continuar na aula N". Avançar a primeira aula marca a playlist como "Usando".
> - **Etapa 4 feita:** tabela de temas de gramática em `src/lib/resources.ts` (`GRAMMAR_TOPICS`), reconhecidos no texto da gramática do nível, do kit da IA e das perguntas do quiz. Em Estudar, cada ponto ganha "Entender isso" com a página do tema no Perfect English Grammar ou no EnglishPage. No Quiz, a pergunta de gramática errada mostra "Revisar: tema", e os temas errados ficam guardados no placar (`gaps`). Sem link por enquanto: "There is / there are", "Inversão para ênfase" e "Discurso indireto livre". A aula de cada tema nas playlists ainda não foi anotada.
> - **Etapa 5 feita:** Missão do dia no Início e na aba Materiais (`src/lib/mission.ts`), sem IA: livro em andamento, gramática errada no último quiz (ou do nível), um material da habilidade menos usada na semana e as revisões. Cada passo marcado conta como dia de estudo e fica salvo em `missions`.
> - **Etapa 6 feita:** 57 pacotes de 50 palavras do NGSL 1.2 (`src/data/ngsl-en.json`, carregado só quando a seção abre), com definição em inglês da própria lista e tradução curta em português feita para o app. Importar manda as palavras para as Revisões de hoje; as que já estão no caderno ficam de fora. Ainda não marca quais palavras do pacote aparecem em cada livro.
> - **Etapa 7 feita:** "Adicionar um link seu" (reconhece playlist do YouTube e cria o card com "parei na aula") e "Descobrir meu nível" (EF SET e Perfect English Grammar; você informa o resultado e o app sugere o primeiro livro daquele nível ainda não lido). Os links próprios e o resultado entram no backup.
> - **Feito depois:** `npm run check-links` (testa o catálogo e as páginas de gramática; sites que bloqueiam robôs aparecem à parte); aula de cada tema nas 3 playlists (`lessons` e `videos` em `recursos-en.json`, com link direto para o vídeo); "There is / there are", "Inversão" e "Discurso indireto livre" com explicação; palavras frequentes de cada livro com texto livre (Global Storybooks e Gutenberg Readers/Infantis, `src/data/book-words-en.json`), na ficha do livro; treinos de vocabulário (Ditado, Pares, Escrever) na aba Revisar; recomendações de livros pelas fontes grátis e pelo nível (`src/lib/recommend.ts`).
> - **Ainda falta:** texto dos livros do StoryWeaver (a API exige login), e anotar aulas para temas novos quando as playlists crescerem.
> - **Ficaram de fora ao conferir os links:** Jogos para Aprender Inglês (o endereço redireciona para propaganda), 5 Minute English (site fora do ar), Cursodeingles.online (o domínio não existe mais) e o curso do IFRS (Moodle, precisa de matrícula).
> - **Entraram a mais:** os 100 textos para iniciantes do Aulas de Inglês Grátis, ao lado dos 110 avançados.
>
> **Decidido:**
> - Uma aba própria, **Materiais**, reúne tudo o que está neste plano. As outras abas só ganham atalhos para ela.
> - Só materiais gratuitos. Sites pagos ou com plano grátis limitado ficam de fora.
> - Playlists **só com redirecionamento**: o card abre a playlist no YouTube e guarda em que aula você parou. Sem API e sem chave (ver o passo 6).

---

## 1. A ideia em uma frase

Uma aba **Materiais** que reúne tudo: catálogo de links, trilhas das playlists, pacotes de palavras, missão do dia e teste de nível. As outras abas ganham atalhos para ela:

- Na tela do livro, a gramática do nível leva para a explicação certa.
- No quiz, quem erra um tema recebe um material sobre ele.
- No vocabulário, cada palavra abre no Cambridge.
- No Início, um card pequeno mostra a **missão do dia** (que mora na aba Materiais).

---

## 2. A sua lista, organizada

Antes de entrar no app, cada link precisa de uma ficha: tipo, nível, se é grátis e em que idioma está o site. Classificação inicial:

**Entram (todos grátis):**

| Material | Tipo | Nível | Observação |
|---|---|---|---|
| BBC Learning English | curso, escuta, gramática | A1–C1 | carro-chefe: cursos por nível, notícias, vídeos curtos |
| British Council – Grammar reference | gramática | A1–B2 | já separado por nível CEFR; ótimo para ligar com o app |
| Grammar Bytes (chompchomp.com) | gramática, exercícios | B1–C1 | exercícios interativos |
| 5 Minute English | gramática | A1–B1 | explicações curtas |
| English Grammar 101 | gramática | A2–B2 | lições em sequência, com teste |
| ESOL Courses | lições, escuta, leitura | A1–B2 | muito material por tema |
| Engoo – materiais | leitura, notícias, conversa | A1–C1 | os materiais são abertos (só as aulas com professor são pagas); Daily News com nível |
| Listen In English | escuta | A2–C1 | trechos de séries, filmes, notícias e podcasts |
| LingoClip | escuta com música | A1–B2 | completar a letra da música |
| The English Room – Games | jogos | A1–B1 | |
| Jogos para Aprender Inglês | jogos | Pre-A1–A2 | site em português |
| 110 textos com áudio e tradução (aulasdeinglesgratis.net) | leitura com áudio | B2–C1 | site em português |
| Grammar Bank – Beginners Test (KET, PET) | teste | A2–B1 | serve de teste de nível |
| Kultivi | curso em vídeo | A1–B1 | precisa de cadastro grátis, tem certificado |
| IFRS – Inglês 1 (turma 2023B) | curso | A1 | Moodle: entra só se abrir sem matrícula |
| 3 playlists de gramática (YouTube) | vídeo | A1–B2 | ver o passo 6 |
| Cambridge Dictionary | dicionário | todos | ver o passo 5 |
| Inglês Online – vocabulário | vocabulário | A1–B1 | site em português |
| Cursodeingles.online – vocabulário | vocabulário | A1–A2 | site em português |
| English Experts – guia rápido | vocabulário | A2–B2 | fórum em português |
| Open English – 200 palavras mais usadas | vocabulário | Pre-A1–A1 | artigo de blog; ver o passo 7 |
| Universidade do Intercâmbio – aumentar vocabulário | dica / artigo | todos | texto de dicas, não é exercício |

**Ficam de fora (pagos ou com grátis limitado):** EnglishCentral, FluentU, Gymglish e TakeLessons.

Os itens da primeira lista vieram sem URL completa. Na implementação, cada endereço será conferido antes de entrar no catálogo.

---

## 3. A aba Materiais

Ela segue o estilo das outras abas, com cards em grafite e areia e filtros em pílula. É a 8ª aba do menu, com um ícone de pasta ou de bússola.

Tudo o que está neste plano fica nela, em seções:

1. **Hoje:** a missão do dia (passo 8).
2. **Trilhas:** as playlists de gramática, com a aula em que você parou (passo 6).
3. **Sites:** o catálogo de links em prateleiras (abaixo).
4. **Palavras:** os pacotes para importar nas Revisões (passo 7).
5. **Meu nível:** o teste de nível (passo 9).

Detalhes do catálogo:

- **Prateleiras por habilidade:** Gramática · Vocabulário · Escuta · Leitura · Jogos · Cursos · Testes · Dicionários.
- **Filtro de nível:** começa no nível da sua parada atual no mapa de leitura. Por exemplo, se você está no A2 da ELi, aparecem primeiro os materiais A2.
- **Etiquetas no card:** `PT` ou `EN` (idioma do site), o tempo médio (5 min, 15 min, curso longo) e `cadastro` quando o site pede conta. Como tudo é grátis, não precisa de etiqueta de preço.
- **Status por material:** quero usar → usando → feito, como na Estante. Dá para dar uma nota de 1 a 5 e escrever uma anotação curta ("bom para phrasal verbs").
- **Adicionar link:** você cola uma URL e escolhe tipo e nível. Assim a lista cresce sem mexer no código.
- **Abrir em nova aba:** todos os links, inclusive as playlists, abrem no site original. Quase todos esses sites bloqueiam ser abertos dentro de outro app (iframe).

---

## 4. Ponte com a gramática dos livros

O app já sabe a gramática de cada nível (`grammarFor` em `src/lib/books.ts`), e ela aparece em Estudar e no Quiz. Falta ligar cada ponto a uma explicação:

```
"Past simple" → British Council (A1–A2) · 5 Minute English · playlist, aula 12
```

- Em **Estudar**, cada ponto de gramática do livro ganha um link "Entender isso" com 1 ou 2 materiais.
- No **Quiz**, a pergunta de gramática errada mostra "Revisar: Past simple", com o link.
- Cada material do catálogo recebe etiquetas de tema (`past-simple`, `present-perfect`, `phrasal-verbs`…) para essa ligação ser automática.

---

## 5. Dicionário dentro do vocabulário

Esta é a parte mais rápida de fazer e a que você vai usar mais:

- Cada palavra do Vocabulário e das Revisões ganha um botão **Cambridge**, que abre `dictionary.cambridge.org/pt/dicionario/ingles-portugues/<palavra>`.
- Ao anotar uma palavra, o botão também aparece, para conferir o sentido antes de salvar.
- Mais tarde dá para incluir outros dicionários (Oxford Learner's, Longman) como opção nas configurações.

---

## 6. Playlists de gramática

Sem API: as 3 playlists entram como cards que **abrem direto no YouTube**.

| Playlist | Link |
|---|---|
| Gramática completa da língua inglesa | `youtube.com/playlist?list=PLM4F7Yfc9B4-TH9rMRqLBk5u5kEAHVV-t` |
| Gramática da língua inglesa | `youtube.com/playlist?list=PLGY1nxl-9ZcMv7kYyydP_zDYBkIjcRF2P` |
| Dominando a gramática em inglês | `youtube.com/playlist?list=PL62aalXXyN9OFa6Otre1eleuxF4pGq1k3` |

- **Abrir no YouTube:** o botão leva para a playlist numa aba nova. Não precisa de chave nem de script.
- **Onde parei:** cada card guarda a aula em que você está ("parei na aula 12"), que você atualiza com um toque em + / −. O botão "Continuar" sempre aparece em destaque.
- **Status:** quero ver → vendo → terminei, como os outros materiais.
- **Ponte com a gramática:** os temas de cada playlist podem ser anotados à mão (por exemplo, `past-simple` = aula 12). Assim a playlist aparece no passo 4 com a aula certa. Isso pode ser feito aos poucos.
- **Playlist nova:** entra pelo "Adicionar link" (passo 3). Se for um link do YouTube, o app reconhece e cria o card de playlist.

---

## 7. Pacotes de palavras para as Revisões

A lista das "200 palavras mais usadas" é uma boa ideia, mas copiar o texto do blog não é legal (direitos autorais). A alternativa é usar uma **lista aberta de frequência**:

- **NGSL (New General Service List):** cerca de 2.800 palavras que cobrem a maior parte de qualquer texto. A licença é aberta (CC BY-SA).
- O app divide a lista em pacotes de 50 ("As 50 primeiras", "51–100"…). Você importa um pacote para as Revisões com um clique.
- Ao abrir um livro, o app pode marcar quais palavras do pacote aparecem nele, se tivermos o texto (Gutenberg, StoryWeaver).

---

## 8. Missão do dia (no Início)

Um card no Início que monta uma sessão curta com base no seu nível e no que falta:

```
Hoje · A2 · ~25 min
1. Ler o capítulo 3 de "The Railway Children"     (Estante)
2. Present perfect – British Council                (Gramática)
3. Um trecho no Listen In English                  (Escuta)
4. Revisar 12 palavras                             (Revisões)
```

- Cada item marcado conta para os dias seguidos (`days`, que já existe).
- A escolha prioriza: livro em andamento, gramática errada no último quiz, habilidade menos usada na semana.
- Não precisa de IA. Se a IA estiver ligada, ela pode escrever uma frase de incentivo ou um mini exercício.

---

## 9. Teste de nível

O Grammar Bank (KET/PET) e o British Council têm testes curtos. A ideia:

- Um card "Descobrir meu nível" com o link para o teste.
- Depois você informa o resultado e o app sugere a parada certa no mapa de leitura.
- Mais tarde: um teste próprio do app, montado com as perguntas de gramática de cada nível.

---

## 10. Modelo de dados

Catálogo fixo em `src/data/recursos-en.json`:

```ts
type Resource = {
  id: string;            // "bbc-learning-english"
  name: string;
  url: string;
  kind: "grammar" | "vocab" | "listening" | "reading" | "games" | "course" | "test" | "dictionary" | "video";
  levels: string[];      // ["A1", "A2", "B1"]
  siteLang: "pt" | "en";
  signup?: boolean;      // pede cadastro (grátis)
  minutes?: number;      // tempo médio de uma sessão
  topics?: string[];     // ["past-simple", "phrasal-verbs"] para a ponte com a gramática
  playlist?: string;     // ID da playlist do YouTube, quando for uma
  lessons?: Record<string, number>; // tema → número da aula, anotado à mão
  note?: string;
};
```

No store (`estante-eli-app-v1`), sem quebrar o que já existe:

```ts
resources: Record<string, { status: "want" | "doing" | "done"; rating?: number; note?: string; lesson?: number }>; // lesson = aula em que parou
myResources: Resource[];   // links que você adicionou
missions: Record<string, string[]>; // dia → itens feitos
```

Tudo entra no backup que já existe.

---

## 11. Ordem sugerida

1. **Aba Materiais + catálogo:** a aba nova no menu, as seções vazias, as fichas dos links grátis, as prateleiras, os filtros e o status. Já deixa tudo útil.
2. **Cambridge no vocabulário:** pequeno e de uso diário.
3. **Trilhas das playlists:** cards que abrem no YouTube, com "onde parei".
4. **Ponte gramática ↔ materiais:** etiquetas de tema, atalhos em Estudar e no Quiz.
5. **Missão do dia** na aba Materiais, com o card no Início.
6. **Pacotes NGSL** importáveis nas Revisões.
7. **Adicionar link próprio** e **teste de nível**.

---

## 12. Cuidados

- **Só link, nunca cópia:** o app guarda nome, endereço e as suas notas, não o conteúdo dos sites.
- **Links quebram:** criar um script (`scripts/check-links`) que testa todas as URLs do catálogo e avisa quais saíram do ar.
- **Grátis muda:** se um site do catálogo passar a cobrar, ele sai da lista. O script de links pode avisar quando a página mudar muito.
- **Outros idiomas:** o formato do catálogo já tem `siteLang` e níveis, então depois basta criar `recursos-fr.json`, `recursos-de.json` e `recursos-es.json`.

---

## 13. Decisões

- **Aba:** separada, chamada **Materiais**, reunindo todas as funcionalidades deste plano.
- **Custo:** só materiais grátis; EnglishCentral, FluentU, Gymglish e TakeLessons ficam de fora.
- **Playlists:** só redirecionamento para o YouTube, sem API; o app guarda em que aula você parou.

---

## 14. Mais materiais e ideias de integração

Os 24 materiais sugeridos depois da primeira lista já estão na aba Materiais, com duas habilidades novas: **Pronúncia** e **Escrita**. Alguns deles podem ir além de um link:

| Material | Ideia | Onde |
|---|---|---|
| YouGlish | Botão "Ouvir em vídeos" em cada palavra (`youglish.com/pronounce/<palavra>/english`) | Vocabulário e Revisões, junto com o Cambridge (etapa 2) |
| Forvo | Botão de pronúncia nativa por palavra | Mesmo lugar, como segunda opção |
| VOA Learning English | Virar uma **base na Estante**: o conteúdo é de domínio público, então os textos e o áudio podem vir para dentro do app, com nível | Estante |
| ER Central | Candidata a **base na Estante** (graded readers com áudio e headwords). Antes, conferir se as regras de uso permitem listar o catálogo | Estante |
| LanguageTool | Botão "Corrigir" no resumo do livro, pela API grátis, sem precisar de IA | Estudar |
| Write & Improve | Link "Receber nota CEFR" ao lado do resumo | Estudar |
| EF SET | Teste principal do card "Meu nível" | Materiais, etapa 7 |
| Oxford 3000/5000 e English Vocabulary Profile | Mostrar o nível CEFR das palavras do caderno e montar os pacotes por nível. As listas não podem ser copiadas; usar só como link ou conferir a licença | Vocabulário e etapa 6 |
| Rachel's English, English with Lucy, Easy British English | Mesmo formato das playlists (abrir no YouTube e "onde parei") | Materiais, etapa 3 |


---

## 15. Próximas ideias (levantadas em 11/10/2026)

Hoje a parte de inglês é forte em leitura e vocabulário. Escuta, fala e escrita quase só aparecem como links para fora. Em ordem de prioridade:

### 15.1 Leitor dentro do app (feito e retirado em 11/10/2026)

- Ler as histórias do Global Storybooks (EN, FR, DE, ES) sem sair do app, página por página, com a ilustração.
- Tocar numa palavra mostra a tradução (do NGSL, sem IA; ou pela IA, se ligada), o botão de ouvir, o Cambridge e "Anotar", que manda a palavra ao caderno já com o livro e a frase como exemplo.
- Palavras que já estão no caderno aparecem marcadas no texto.
- O MP3 da narração toca junto.
- Chegou a ser feito para o Global Storybooks e foi retirado a pedido; os textos das histórias (CC BY sem os créditos) não ficaram no histórico do git.

### 15.2 Pacotes feitos para brasileiros (feito: `src/data/br-packs-en.json`, seção "Feito para brasileiros" em Materiais)

- **Falsos cognatos:** actually, pretend, push, library, parents, exquisite, assist…
- **Phrasal verbs mais comuns:** get up, look for, find out, give up…
- **Pronúncia difícil para brasileiros:** "th", o "-ed" (worked / wanted / played), vogais curtas e longas (ship/sheep, live/leave, full/fool), em pares tocados com as gravações do Wiktionary.

### 15.3 Exercícios de gramática dentro do app (feito: 95 exercícios em 19 temas em `src/data/grammar-en.json`, mais 8 pela IA)

- 5 a 10 exercícios curtos por tema (completar, escolher, reescrever), pelos temas de `GRAMMAR_TOPICS`.
- Com a IA, gerados na hora; sem a IA, um banco fixo para os temas principais (tempos verbais, condicionais, comparativos, modais).
- Os temas errados entram na Missão do dia, como já acontece com o quiz.

### 15.4 Escrita: diário curto (feito: seção "Diário" em Materiais)

- 3 a 5 frases por dia sobre um tema do seu nível ("o que você fez no fim de semana", "descreva sua casa").
- Correção da IA linha a linha; as palavras novas da correção vão para o caderno.

### 15.5 Fala: "repita depois de mim" (feito: treino "Falar" em Revisar)

- O app toca a gravação (Wiktionary ou narração do livro), você grava a sua voz pelo microfone (MediaRecorder) e as duas tocam lado a lado para comparar.
- Funciona em qualquer navegador, sem depender da voz do sistema nem de reconhecimento de fala.

### 15.6 Escuta: leituras do dia (feito: card "Leitura do dia" no Início, fontes em `DAILY_EN`)

- Um link por nível no Início: VOA Learning English, News in Levels, BBC 6 Minute English (já no plano de idiomas, passo 7).

### 15.7 Vocabulário (feito: vocabulário estimado no caderno, modo "Frase" nos flashcards, "Corrigir tradução")

- **Tamanho estimado do vocabulário:** "você conhece ~X das 2.809 palavras mais usadas", pelas palavras dominadas (caixa 5–6) nos flashcards.
- **Cartões de frase:** o flashcard mostra a frase do livro com a palavra em branco.
- **Corrigir tradução:** botão no flashcard para consertar as traduções dos pacotes (feitas para o app e ainda não revisadas).

### 15.8 Progresso (feito: "Teste do app" e "O que eu já consigo" no card de nível)

- Lista de "consigo…" do CEFR por nível (apresentar-me, contar o que fiz no fim de semana, dar minha opinião…), marcada aos poucos.
- Teste de nível próprio do app, montado com as perguntas de gramática de cada nível.
