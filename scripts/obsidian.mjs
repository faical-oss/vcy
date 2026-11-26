#!/usr/bin/env node
// Simple Obsidian map:  Page -> Sections/Components -> API.  Nothing deeper.
// Usage: node scripts/obsidian-simple.mjs <projectRoot> <vaultDir>
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] ?? '.');
const VAULT = path.resolve(process.argv[3] ?? './vacayou-simple');
const SRC = path.join(ROOT, 'src');
if (!fs.existsSync(SRC)) { console.error('No src/ in ' + ROOT); process.exit(1); }

const CODE = new Set(['.ts', '.tsx', '.js', '.jsx']);
const rel = (f) => 'src/' + path.relative(SRC, f).split(path.sep).join('/');
const isTest = (f) => /\.(test|spec)\.[jt]sx?$/.test(f);

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (CODE.has(path.extname(e.name)) && !e.name.endsWith('.d.ts') && !isTest(p)) out.push(p);
  }
  return out;
}
const files = walk(SRC);
const fileSet = new Set(files);
const read = (f) => fs.readFileSync(f, 'utf8');

// ---- import resolution (@/ alias or tsconfig paths) ----
let aliases = [['@/', SRC + path.sep]];
try {
  const t = JSON.parse(read(path.join(ROOT, 'tsconfig.json')).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''));
  const base = path.resolve(ROOT, t.compilerOptions?.baseUrl ?? '.');
  const a = Object.entries(t.compilerOptions?.paths ?? {})
    .filter(([k, v]) => k.endsWith('*') && v?.[0])
    .map(([k, v]) => [k.slice(0, -1), path.resolve(base, v[0].slice(0, -1)) + path.sep]);
  if (a.length) aliases = a;
} catch {}
const tryFile = (b) => {
  for (const e of ['', '.ts', '.tsx', '.js', '.jsx']) if (fileSet.has(b + e)) return b + e;
  for (const e of ['.ts', '.tsx', '.js', '.jsx']) if (fileSet.has(path.join(b, 'index' + e))) return path.join(b, 'index' + e);
  return null;
};
const resolve = (spec, from) => {
  if (spec.startsWith('.')) return tryFile(path.resolve(path.dirname(from), spec));
  for (const [p, d] of aliases) if (spec.startsWith(p)) return tryFile(path.join(d, spec.slice(p.length)));
  return null;
};

// imports -> [{ names:[...], file }]
function importsOf(f) {
  const src = read(f);
  const out = [];
  for (const m of src.matchAll(/import\s+(?:type\s+)?([^;'"]*?)\s*from\s*['"]([^'"]+)['"]/g)) {
    if (/^import\s+type/.test(m[0])) continue;
    const names = [];
    const def = m[1].match(/^([A-Za-z_$][\w$]*)/);
    if (def) names.push(def[1]);
    const br = m[1].match(/\{([^}]*)\}/);
    if (br) br[1].split(',').map((s) => s.trim().split(/\s+as\s+/).pop()).filter(Boolean).forEach((n) => names.push(n));
    const file = resolve(m[2], f);
    if (file) out.push({ names, file });
  }
  return out;
}

// find the file that really defines `name` (follows barrels `export * from`)
function findDef(name, file, depth = 0) {
  if (depth > 3) return file;
  const src = read(file);
  if (new RegExp(`export\\s+(?:default\\s+)?(?:async\\s+)?(?:function|const|class)\\s+${name}\\b`).test(src)) return file;
  for (const m of src.matchAll(/export\s+(?:\*|\{[^}]*\})\s+from\s*['"]([^'"]+)['"]/g)) {
    const next = resolve(m[1], file);
    if (next) { const r = findDef(name, next, depth + 1); if (r && new RegExp(`export\\s+(?:default\\s+)?(?:async\\s+)?(?:function|const|class)\\s+${name}\\b`).test(read(r))) return r; }
  }
  return file;
}

let missing = 0;
const humanize = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/^./, (c) => c.toUpperCase());
function describe(f, fallbackName) {
  const src = read(f);
  const m = src.match(/^(?:\s*['"]use [a-z ]+['"];?\s*)?\s*\/\*\*?\s*([\s\S]*?)\*\//) || src.match(/^(?:\s*['"]use [a-z ]+['"];?\s*)?((?:\s*\/\/.*\n)+)/);
  if (m) {
    const t = m[1].replace(/^\s*(\*|\/\/)\s?/gm, '').trim().split('\n')[0].trim();
    if (t && t.length > 3) return t.slice(0, 110);
  }
  missing++;
  return humanize(fallbackName) + ' (no comment in file)';
}

// ---- classify imported files ----
const inDir = (f, d) => rel(f).startsWith(`src/${d}/`);
const isData = (f) => inDir(f, 'services') || inDir(f, 'features') && !/components/.test(rel(f)) || inDir(f, 'mocks');
const isComp = (f) => inDir(f, 'components') || /src\/features\/.*\/components\//.test(rel(f));

function apiOf(f, viaHook = false) {
  // data calls + fetch('/api/..') in this file
  const calls = new Map();
  for (const { names, file } of importsOf(f)) {
    if (!isData(file)) continue;
    for (const n of names) if (/^[a-z]/.test(n)) calls.set(n, rel(findDef(n, file)));
  }
  if (!viaHook) {
    // one level into hooks/ and store/ (a section may get its data through a hook)
    for (const { file } of importsOf(f)) {
      if (!(inDir(file, 'hooks') || inDir(file, 'store'))) continue;
      for (const [n, p] of apiOf(file, true)) calls.set(n, p);
    }
  }
  for (const m of read(f).matchAll(/fetch\(\s*[`'"](\/api\/[^`'"?$]*)/g)) calls.set(m[1], 'src/app' + m[1] + '/route.ts');
  return calls;
}
function partsOf(f) {
  // small components used inside a section (one level only)
  const parts = [];
  for (const { names, file } of importsOf(f)) {
    if (!isComp(file)) continue;
    for (const n of names) if (/^[A-Z]/.test(n)) { const d = findDef(n, file); parts.push({ name: n, path: rel(d), abs: d }); }
  }
  return parts;
}

// ---- pages ----
const groupSeg = (s) => /^\(.*\)$/.test(s) || s.startsWith('@');
const dynSeg = (s) => s.replace(/^\[\[?\.\.\.(.+?)\]?\]$/, '*$1').replace(/^\[(.+)\]$/, ':$1');
const pageFiles = files.filter((f) => /\/app\/.*\bpage\.[jt]sx?$/.test(f.split(path.sep).join('/')));
const routeOf = (f) => '/' + path.relative(path.join(SRC, 'app'), path.dirname(f)).split(path.sep).filter((s) => s && s !== '.' && !groupSeg(s)).map(dynSeg).join('/');
const clean = (s) => s.replace(/[\\/:*?"<>|#^[\]]/g, '').replace(/\s+/g, ' ').trim();
const pageName = (route) => (route === '/' ? 'Home' : clean(route.slice(1).replace(/\//g, ' - ')));

const sectionsMap = new Map(); // name -> {path, desc, parts, api, usedOn:Set}
const partMap = new Map(); // small components
const apiMap = new Map();      // name -> {path, usedBy:Set}
const pages = [];

function addApi(name, p, by) {
  const n = clean(name.replace(/^\//, 'api ')) || name;
  if (!apiMap.has(n)) apiMap.set(n, { path: p, usedBy: new Set(), label: name });
  apiMap.get(n).usedBy.add(by);
  return n;
}

for (const pf of pageFiles.sort()) {
  const route = routeOf(pf);
  const pname = pageName(route);
  const rows = [];
  const seen = new Set();
  const pageApi = apiOf(pf);
  const pageApiNames = [...pageApi].map(([n, p]) => addApi(n, p, pname));

  for (const { names, file } of importsOf(pf)) {
    if (!isComp(file)) continue;
    for (const n of names) {
      if (!/^[A-Z]/.test(n) || seen.has(n)) continue;
      seen.add(n);
      const def = findDef(n, file);
      const isSection = inDir(def, 'components/sections') || /\/sections\//.test(rel(def));
      const parts = partsOf(def);
      const api = [...apiOf(def)].map(([a, p]) => addApi(a, p, n));
      for (const c of parts) {
        if (sectionsMap.has(c.name) || c.name === n) continue;
        if (!partMap.has(c.name)) partMap.set(c.name, { path: c.path, desc: describe(c.abs, c.name), api: [...apiOf(c.abs)].map(([a, p]) => addApi(a, p, c.name)), usedIn: new Set() });
        partMap.get(c.name).usedIn.add(n);
      }
      const key = n;
      if (!sectionsMap.has(key)) sectionsMap.set(key, { path: rel(def), desc: describe(def, n), parts, api, usedOn: new Set(), section: isSection });
      sectionsMap.get(key).usedOn.add(pname);
      rows.push(key);
    }
  }
  pages.push({ pname, route, path: rel(pf), desc: (() => { const d = describe(pf, pname); return d.includes('(no comment') ? 'Page: ' + route : d; })(), rows, api: pageApiNames });
}

// layouts (shared on every page)
const layouts = files.filter((f) => /\/app\/.*layout\.[jt]sx?$/.test(f.split(path.sep).join('/'))).sort().map((lf) => {
  const comps = [];
  for (const { names, file } of importsOf(lf)) if (isComp(file)) for (const n of names) if (/^[A-Z]/.test(n)) comps.push({ name: n, path: rel(findDef(n, file)) });
  return { path: rel(lf), comps };
});

// ---- write ----
const out = new Map();
const L = (n) => `[[${n}]]`;
const md = (t) => String(t).replace(/\|/g, '\\|');

out.set('00 Start here.md', `---\ntags: [map]\n---
# Vacayou map

Three levels only: **Page → Section → Component → API**.

- ${L('Pages')}: every route, one line each
- Open a page to see its sections, what each does, where the file is, and which API it calls
- ${L('API')}: every endpoint / service function and who uses it

Graph tip: Cmd+G. Colors: pages = blue, sections = green, components = grey, API = orange.
`);

out.set('Pages.md', `---\ntags: [map]\n---
# Pages

| Page | Route | Sections | API |
|---|---|---|---|
${pages.map((p) => `| ${L(p.pname)} | \`${p.route}\` | ${p.rows.length} | ${p.api.length ? p.api.map(L).join(', ') : '-'} |`).join('\n')}

## Shared on every page (layouts)
${layouts.map((l) => `- \`${l.path}\`: ${l.comps.length ? l.comps.map((c) => `${c.name} (\`${c.path}\`)`).join(', ') : 'no components'}`).join('\n')}
`);

for (const p of pages) {
  const sec = p.rows.filter((r) => sectionsMap.get(r).section);
  const other = p.rows.filter((r) => !sectionsMap.get(r).section);
  const row = (r) => { const s = sectionsMap.get(r); return `| ${L(r)} | ${md(s.desc)} | \`${s.path}\` | ${s.api.length ? s.api.map(L).join(', ') : '-'} |`; };
  const tbl = (arr) => `| Section | What it does | Path | API |\n|---|---|---|---|\n${arr.map(row).join('\n')}`;
  out.set(`pages/${clean(p.pname)}.md`, `---\ntags: [page]\nroute: "${p.route}"\n---
# ${p.pname}

${md(p.desc)}

- Route: \`${p.route}\`
- File: \`${p.path}\`
- Page-level data: ${p.api.length ? p.api.map(L).join(', ') : 'none'}

## Sections
${sec.length ? tbl(sec) : '_none_'}
${other.length ? `\n## Other components\n${tbl(other)}\n` : ''}`);
}

for (const [name, s] of sectionsMap) {
  out.set(`sections/${clean(name)}.md`, `---\ntags: [${s.section ? 'section' : 'component'}]\n---
# ${name}

${md(s.desc)}

- File: \`${s.path}\`
- Used on: ${[...s.usedOn].sort().map(L).join(', ')}
- API: ${s.api.length ? s.api.map(L).join(', ') : 'none'}
${s.parts.length ? `\n## Small components inside\n| Component | What it does | Path | API |\n|---|---|---|---|\n${s.parts.slice(0, 12).filter((c) => partMap.has(c.name)).map((c) => { const q = partMap.get(c.name); return `| ${L(c.name)} | ${md(q.desc)} | \`${q.path}\` | ${q.api.length ? q.api.map(L).join(', ') : '-'} |`; }).join('\n')}\n` : ''}`);
}

for (const [name, c] of partMap) {
  out.set(`components/${clean(name)}.md`, `---\ntags: [component]\n---
# ${name}

${md(c.desc)}

- File: \`${c.path}\`
- Used in: ${[...c.usedIn].sort().map(L).join(', ')}
- API: ${c.api.length ? c.api.map(L).join(', ') : 'none'}
`);
}

out.set('API.md', `---\ntags: [map]\n---
# API

| API | File | Used by |
|---|---|---|
${[...apiMap].sort().map(([n, a]) => `| ${L(n)} | \`${a.path}\` | ${[...a.usedBy].slice(0, 6).map(L).join(', ')} |`).join('\n') || '| - | - | - |'}
`);
for (const [name, a] of apiMap) {
  out.set(`api/${clean(name)}.md`, `---\ntags: [api]\n---
# ${a.label}

- File: \`${a.path}\`
- Used by: ${[...a.usedBy].sort().map((u) => L(u)).join(', ')}
`);
}

// resolve check: link targets that don't exist as notes are dropped to plain text
const noteNames = new Set([...out.keys()].map((k) => path.basename(k, '.md')));
let fixed = 0;
for (const [k, v] of out) {
  out.set(k, v.replace(/\[\[([^\]]+)\]\]/g, (m, n) => (noteNames.has(n) ? m : (fixed++, n))));
}

// write: only our folders, never notes/
for (const d of ['pages', 'sections', 'components', 'api']) fs.rmSync(path.join(VAULT, d), { recursive: true, force: true });
for (const [k, v] of out) {
  const p = path.join(VAULT, k);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, v);
}
const gp = path.join(VAULT, '.obsidian', 'graph.json');
const hex = (h) => parseInt(h.slice(1), 16);
fs.mkdirSync(path.dirname(gp), { recursive: true });
fs.writeFileSync(gp, JSON.stringify({
  search: '-tag:#map', showTags: false, showOrphans: false, showArrow: true, nodeSizeMultiplier: 1.2, linkDistance: 160, repelStrength: 14,
  colorGroups: [
    { query: 'tag:#page', color: { a: 1, rgb: hex('#3b82f6') } },
    { query: 'tag:#section', color: { a: 1, rgb: hex('#22c55e') } },
    { query: 'tag:#component', color: { a: 1, rgb: hex('#a3a3a3') } },
    { query: 'tag:#api', color: { a: 1, rgb: hex('#f97316') } },
  ],
}, null, 2));

console.log(`Vault: ${VAULT}\nPages: ${pages.length} | Sections: ${sectionsMap.size} | Components: ${partMap.size} | API: ${apiMap.size} | notes: ${out.size}${fixed ? ` | unresolved links flattened: ${fixed}` : ''}\nDescriptions missing (add a one-line comment at the top of the file): ${missing}`);