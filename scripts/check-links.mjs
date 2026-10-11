#!/usr/bin/env node
// Tests every link of the Materials catalog and the grammar pages, and reports the ones that broke or moved.
// Usage: npm run check-links   (exit code 1 when something is down)
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const links = [];

// catalog files: src/data/recursos-<lang>.json
for (const f of readdirSync(join(root, "src/data")).filter((f) => /^recursos-\w+\.json$/.test(f)))
  for (const r of JSON.parse(readFileSync(join(root, "src/data", f), "utf8"))) links.push({ where: `${f} · ${r.name}`, url: r.url });

// grammar pages: the peg("...") and ep("...") calls in src/lib/resources.ts
const src = readFileSync(join(root, "src/lib/resources.ts"), "utf8");
const base = { peg: "https://www.perfect-english-grammar.com/", ep: "https://www.englishpage.com/" };
for (const [, fn, page] of src.matchAll(/\b(peg|ep)\("([^"]+)"\)/g)) {
  const url = `${base[fn]}${page}.html`;
  if (!links.some((l) => l.url === url)) links.push({ where: `gramática · ${page}`, url });
}
for (const [, url] of src.matchAll(/url: "(https?:\/\/[^"]+)"/g)) if (!links.some((l) => l.url === url)) links.push({ where: "resources.ts", url });

const host = (u) => new URL(u).hostname.replace(/^www\./, "");

async function check({ where, url }) {
  for (const method of ["HEAD", "GET"]) {
    try {
      const r = await fetch(url, { method, redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "User-Agent": "Mozilla/5.0 (babel check-links)" } });
      // some sites refuse HEAD; try GET before calling it broken
      if (method === "HEAD" && (r.status === 405 || r.status === 403 || r.status >= 500)) continue;
      const moved = host(r.url) !== host(url);
      // 401/403/429: the site turns robots away (Cloudflare and the like), which says nothing about a person's browser
      const blocked = [401, 403, 429].includes(r.status);
      return { where, url, status: r.status, ok: r.ok && !moved, blocked, note: moved ? `redireciona para ${r.url}` : r.ok ? "" : `HTTP ${r.status}` };
    } catch (e) {
      if (method === "GET") return { where, url, status: 0, ok: false, note: e.name === "TimeoutError" ? "sem resposta em 20 s" : e.cause?.code ?? e.message };
    }
  }
}

// a few at a time, to be gentle with the sites
const results = [];
const queue = [...links];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) results.push(await check(queue.shift()));
}));

const bad = results.filter((r) => !r.ok && !r.blocked);
const blocked = results.filter((r) => !r.ok && r.blocked);
console.log(`${results.length} links testados · ${results.length - bad.length - blocked.length} ok · ${bad.length} com problema · ${blocked.length} bloqueiam robôs\n`);
for (const r of bad.sort((a, b) => a.where.localeCompare(b.where))) console.log(`✗ ${r.where}\n  ${r.url}\n  ${r.note}\n`);
if (blocked.length) console.log(`Não dá para testar daqui (abra no navegador para conferir):\n${blocked.map((r) => `  · ${r.where} (${r.note})`).join("\n")}`);
process.exit(bad.length ? 1 : 0);
