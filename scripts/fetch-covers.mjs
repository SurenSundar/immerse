// Finds real covers for the built-in Library on Open Library, saves small WebP
// copies in public/covers/ (so visitors never contact a third party) and writes
// the path into src/data/library.json.
//
//   node scripts/fetch-covers.mjs            only books without a cover
//   node scripts/fetch-covers.mjs --all      redo every book
//   node scripts/fetch-covers.mjs id1 id2    just these ids
//
// Needs macOS `sips` and `cwebp` (brew install webp).
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'src/data/library.json');
const OUT = path.join(ROOT, 'public/covers');
const WIDTH = 320;

const args = process.argv.slice(2);
const books = JSON.parse(fs.readFileSync(DATA, 'utf8'));
fs.mkdirSync(OUT, { recursive: true });

const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[’']/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
const shortTitle = (t) => t.split(/[:(]/)[0].trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function findCoverId(book) {
  const title = shortTitle(book.title);
  const author = book.author.split(/,| and /)[0].replace(/\(.*\)/, '').trim();
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=10&fields=title,author_name,cover_i,edition_count`;
  const res = await fetch(url, { headers: { 'User-Agent': 'MonkeyMind cover fetch (monkeymind.online)' } });
  if (!res.ok) return null;
  const { docs = [] } = await res.json();
  const want = norm(title);
  const surname = norm(author).split(' ').pop();
  const ok = docs.filter((d) => d.cover_i
    && (d.author_name || []).some((a) => norm(a).includes(surname))
    && (norm(shortTitle(d.title)) === want || norm(d.title) === norm(book.title)));
  // The edition-rich work is almost always the well-known one
  ok.sort((a, b) => (b.edition_count || 0) - (a.edition_count || 0));
  if (ok[0]) return ok[0].cover_i;

  // Second try: author names are often spelled differently (Lao Tzu → Laozi),
  // so search by title alone and take the most-published exact title match.
  const res2 = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(title)}&limit=20&fields=title,author_name,cover_i,edition_count`, { headers: { 'User-Agent': 'MonkeyMind cover fetch (monkeymind.online)' } });
  if (!res2.ok) return null;
  const loose = ((await res2.json()).docs || [])
    .filter((d) => d.cover_i && norm(shortTitle(d.title)) === want)
    .sort((a, b) => (b.edition_count || 0) - (a.edition_count || 0));
  return loose[0]?.cover_i ?? null;
}

const todo = books.filter((b) => (args.includes('--all') ? true : args.length ? args.includes(b.id) : !b.cover));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'covers-'));
const missed = [];

for (const [i, book] of todo.entries()) {
  process.stdout.write(`[${i + 1}/${todo.length}] ${book.title} … `);
  try {
    const coverId = await findCoverId(book);
    if (!coverId) { missed.push(book); console.log('no match'); continue; }
    const img = await fetch(`https://covers.openlibrary.org/b/id/${coverId}-L.jpg`);
    const buf = Buffer.from(await img.arrayBuffer());
    if (!img.ok || buf.length < 2000) { missed.push(book); console.log('no image'); continue; }
    const jpg = path.join(tmp, `${book.id}.jpg`);
    fs.writeFileSync(jpg, buf);
    execFileSync('sips', ['--resampleWidth', String(WIDTH), jpg], { stdio: 'ignore' });
    execFileSync('cwebp', ['-q', '78', '-quiet', jpg, '-o', path.join(OUT, `${book.id}.webp`)]);
    book.cover = `/covers/${book.id}.webp`;
    console.log(`ok (${coverId})`);
  } catch (e) {
    missed.push(book);
    console.log(`error: ${e.message}`);
  }
  await sleep(250);
}

fs.writeFileSync(DATA, JSON.stringify(books, null, 2) + '\n');
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\nDone. ${todo.length - missed.length} covers saved, ${missed.length} without a match:`);
missed.forEach((b) => console.log(`  - ${b.id}: ${b.title} (${b.author})`));
