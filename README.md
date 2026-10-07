# babel

Meu app pessoal de idiomas, começando pelo inglês. A primeira parte é uma estante para aprender lendo: os 177 *graded readers* da [ELi Publishing](https://www.elipublishing.com/catalog) em ordem de dificuldade (Pre-A1 → C1), com:

- **Início**: painel com a pilha de leitura, palavras anotadas na semana, revisões do dia, calendário dos dias estudados, progresso por nível e o mapa de leitura animado.
- **Estante**: as capas em prateleiras por nível, gênero ou status, com busca, filtros e a ficha de cada livro.
- **Vocabulário**: caderno de palavras, com tradução, definição e exemplo gerados pela IA.
- **Revisar**: flashcards com repetição espaçada (1, 2, 4, 8, 16 e 32 dias).
- **Estudar um livro**: kit de pré-leitura (palavras-chave, gramática, perguntas) e correção do seu resumo em inglês.
- Animações em [Remotion](https://www.remotion.dev/): o mapa de leitura (um aviãozinho percorre as cidades Pre-A1 → C1) e a comemoração ao terminar um livro.

Feito com Next.js, [shadcn/ui](https://ui.shadcn.com/), Tailwind, Motion, Phosphor Icons e o SDK da Anthropic. Capas carregadas do site da ELi.
O progresso fica salvo no navegador (localStorage). Use **Configurações → Exportar** para fazer backup.

**Próximos idiomas:** o plano para francês, alemão, espanhol e mais séries de inglês está em [docs/idiomas](docs/idiomas/README.md).

## IA: cada pessoa usa a própria chave

O site não tem chave de API embutida. Quem quiser os recursos de IA abre **Configurações**,
escolhe um provedor e cola a própria chave:

| Provedor | Custo | Onde gerar a chave |
|---|---|---|
| Gemini (Google) | grátis, sem cartão | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Groq | grátis | [console.groq.com/keys](https://console.groq.com/keys) |
| OpenRouter | grátis nos modelos `:free` (cerca de 50 pedidos/dia) | [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys) |
| Claude (Anthropic) | pago, poucos centavos por pedido | [console.anthropic.com](https://console.anthropic.com/settings/keys) |

- Ao conectar, o app lista os modelos da chave e já escolhe um recomendado (dá para trocar).
- As chaves ficam salvas só no navegador da pessoa (localStorage).
- As chamadas vão direto do navegador para o provedor. Nenhuma chave passa pelo servidor do site.
- No plano grátis do Gemini, o Google pode usar o conteúdo enviado para melhorar os produtos dele.
- Sem chave, tudo funciona; os botões de IA viram "copiar pedido" para colar em qualquer chat de IA.

## Rodar no computador

```bash
npm install
npm run dev   # http://localhost:3000
```

## Deploy na Vercel

1. Suba esta pasta para um repositório no GitHub.
2. Em [vercel.com/new](https://vercel.com/new), importe o repositório (a Vercel detecta Next.js sozinha).
3. Clique em **Deploy**. Não precisa configurar nenhuma variável de ambiente.

Ou pelo terminal: `npx vercel`.

O site é 100% estático: não tem rota de servidor, então não gera custo de função na Vercel.

## Remotion

Remotion é gratuito para uso individual. Empresas com mais de 3 pessoas precisam de licença: veja remotion.dev/license.
