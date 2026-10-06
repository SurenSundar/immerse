import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TbLock, TbLogout, TbDeviceFloppy, TbPlus, TbSearch, TbExternalLink, TbPencil,
  TbTrash, TbDownload, TbUpload, TbKey, TbAlertTriangle, TbCheck, TbX, TbPhoto, TbHistory,
} from 'react-icons/tb';
import { LIBRARY_BOOKS, coverSrc, isPlaceholderLink, withBuiltInCovers } from '../utils/libraryBooks';
import './Admin.css';

// ── API ────────────────────────────────────────────────────────────────────
async function api(action, { body, csrf } = {}) {
  const init = { method: body ? 'POST' : 'GET', credentials: 'same-origin', headers: {} };
  if (body) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  if (csrf) init.headers['X-CSRF-Token'] = csrf;
  let res;
  try {
    res = await fetch(`/api/admin.php?action=${action}`, init);
  } catch {
    throw Object.assign(new Error('Could not reach the server. Check your connection.'), { status: 0 });
  }
  let data = null;
  try { data = await res.json(); } catch { /* not JSON */ }
  if (!res.ok || !data?.ok) {
    const fallback = res.status === 404 || !data
      ? 'The admin service is not available here. It runs on the live site (Hostinger, PHP).'
      : 'Something went wrong.';
    throw Object.assign(new Error(data?.error || fallback), { status: res.status, data });
  }
  return data;
}

// ── Book helpers ───────────────────────────────────────────────────────────
const FIELDS = ['id', 'type', 'title', 'author', 'buyLink', 'shopName', 'emoji', 'coverColor', 'cover', 'review'];
// Covers are always files on our own server (built-in, or saved from Open Library here)
const COVER_PATH = /^(\/covers\/[a-z0-9-]+\.(webp|jpg)|\/api\/cover\.php\?f=ol-\d{1,12}\.jpg)$/;
const DEFAULT_COVER = 'linear-gradient(160deg, #3b4a7a, #1d2647)';
const COVER_RE = /^linear-gradient\((\d{1,3})deg,\s*(#[0-9a-fA-F]{3,8}),\s*(#[0-9a-fA-F]{3,8})\)$/;

let keySeq = 0;
const withKey = (b) => ({ ...b, _k: `k${++keySeq}` });
const strip = ({ _k, ...b }) => b; // eslint-disable-line no-unused-vars

const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

function uniqueId(base, taken) {
  let id = base || 'book';
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

const amazonSearch = (b) => `https://www.amazon.com/s?k=${encodeURIComponent(`${b.title} ${b.author}${b.type === 'audio' ? ' audiobook' : ''}`.trim())}`;

/** 'none' | 'invalid' | 'search' (plain store search) | 'affiliate' */
function linkState(url) {
  const u = url?.trim();
  if (!u) return 'none';
  try { if (new URL(u).protocol !== 'https:') return 'invalid'; } catch { return 'invalid'; }
  return isPlaceholderLink(u) ? 'search' : 'affiliate';
}
const LINK_LABELS = { none: 'No link', invalid: 'Check link', search: 'Search link', affiliate: 'Affiliate' };

/** Mirrors the server's checks so problems show up before saving. */
function problemsFor(book, idCounts) {
  const p = [];
  if (!/^[a-z0-9][a-z0-9-]*$/.test(book.id || '')) p.push('ID: use a-z, 0-9 and dashes');
  else if (idCounts.get(book.id) > 1) p.push('ID is used by another book');
  if (!book.title?.trim()) p.push('Title is required');
  if (!book.author?.trim()) p.push('Author is required');
  if (book.buyLink?.trim()) {
    try {
      if (new URL(book.buyLink.trim()).protocol !== 'https:') p.push('Link must start with https://');
    } catch { p.push('Link is not a valid web address'); }
  }
  return p;
}

// ── CSV ────────────────────────────────────────────────────────────────────
function toCsv(rows) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [FIELDS.join(','), ...rows.map((r) => FIELDS.map((f) => esc(r[f])).join(','))].join('\r\n');
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function Admin() {
  const [phase, setPhase] = useState('loading'); // loading | unavailable | setup | login | editor
  const [error, setError] = useState('');
  const [session, setSession] = useState({ username: null, csrf: null });

  useEffect(() => {
    document.title = 'Library admin | MonkeyMind';
    const meta = Object.assign(document.createElement('meta'), { name: 'robots', content: 'noindex, nofollow' });
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    let live = true;
    api('status')
      .then((s) => {
        if (!live) return;
        if (s.signedIn) { setSession({ username: s.username, csrf: s.csrf }); setPhase('editor'); }
        else setPhase(s.configured ? 'login' : 'setup');
      })
      .catch((e) => {
        if (!live) return;
        setError(e.message);
        setPhase('unavailable');
      });
    return () => { live = false; };
  }, []);

  const signedIn = (data) => { setSession({ username: data.username, csrf: data.csrf }); setPhase('editor'); };
  const signedOut = () => { setSession({ username: null, csrf: null }); setPhase('login'); };

  return (
    <div className="mm-page adm">
      {phase === 'loading' && <p className="adm-muted">Loading…</p>}
      {phase === 'unavailable' && (
        <div className="mm-panel adm-card">
          <h1><TbAlertTriangle /> Admin unavailable</h1>
          <p className="adm-muted">{error}</p>
        </div>
      )}
      {(phase === 'setup' || phase === 'login') && <AuthForm mode={phase} onDone={signedIn} />}
      {phase === 'editor' && (
        <Editor session={session} setSession={setSession} onSignedOut={signedOut} />
      )}
    </div>
  );
}

// ── Sign in / first-time setup ─────────────────────────────────────────────
function AuthForm({ mode, onDone }) {
  const [form, setForm] = useState({ setupCode: '', username: '', password: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isSetup = mode === 'setup';
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (isSetup && form.password !== form.confirm) { setError('The two passwords do not match.'); return; }
    setBusy(true);
    try {
      const body = isSetup
        ? { setupCode: form.setupCode, username: form.username, password: form.password }
        : { username: form.username, password: form.password };
      onDone(await api(isSetup ? 'setup' : 'login', { body }));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="mm-panel adm-card adm-auth" onSubmit={submit}>
      <h1><TbLock /> {isSetup ? 'Create your admin account' : 'Library admin'}</h1>
      {isSetup ? (
        <p className="adm-muted">
          One-time setup. In Hostinger’s File Manager, open the <code>monkeymind-data</code> folder (next to <code>public_html</code>,
          or in your account’s home folder if it isn’t there) and copy the code from <code>SETUP-CODE.txt</code>.
        </p>
      ) : (
        <p className="adm-muted">Sign in to update the Library’s books and links.</p>
      )}

      {isSetup && (
        <label className="adm-field">
          <span>Setup code</span>
          <input className="mm-input" value={form.setupCode} onChange={set('setupCode')} placeholder="XXXX-XXXX-XXXX" autoComplete="off" required />
        </label>
      )}
      <label className="adm-field">
        <span>Username</span>
        <input className="mm-input" value={form.username} onChange={set('username')} autoComplete="username" required minLength={3} maxLength={40} />
      </label>
      <label className="adm-field">
        <span>Password{isSetup && ' (at least 10 characters)'}</span>
        <input className="mm-input" type="password" value={form.password} onChange={set('password')} autoComplete={isSetup ? 'new-password' : 'current-password'} required minLength={isSetup ? 10 : 1} />
      </label>
      {isSetup && (
        <label className="adm-field">
          <span>Confirm password</span>
          <input className="mm-input" type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" required />
        </label>
      )}

      {error && <p className="adm-error" role="alert">{error}</p>}
      <button className="mm-btn mm-btn--primary" disabled={busy}>
        {busy ? 'Please wait…' : isSetup ? 'Create account' : 'Sign in'}
      </button>
    </form>
  );
}

// ── Editor ─────────────────────────────────────────────────────────────────
function Editor({ session, setSession, onSignedOut }) {
  const [books, setBooks] = useState(null);
  const [original, setOriginal] = useState(new Map()); // _k → JSON at last load/save
  const [baseUpdatedAt, setBaseUpdatedAt] = useState(null);
  const [onServer, setOnServer] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [linkFilter, setLinkFilter] = useState('all');
  const [openKey, setOpenKey] = useState(null);
  const [notice, setNotice] = useState(null); // { kind: 'ok' | 'error', text, list? }
  const [saving, setSaving] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showBackups, setShowBackups] = useState(false);
  const fileRef = useRef(null);

  const adopt = useCallback((list, updatedAt, fromServer) => {
    const keyed = list.map(withKey);
    setBooks(keyed);
    setOriginal(new Map(keyed.map((b) => [b._k, JSON.stringify(strip(b))])));
    setBaseUpdatedAt(updatedAt);
    setOnServer(fromServer);
  }, []);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const data = await api('books');
      if (data.books) adopt(withBuiltInCovers(data.books), data.updatedAt, true);
      else adopt(LIBRARY_BOOKS, null, false);
    } catch (e) {
      if (e.status === 401) onSignedOut();
      else setLoadError(e.message);
    }
  }, [adopt, onSignedOut]);

  useEffect(() => { load(); }, [load]);

  // ── Derived ──
  const idCounts = useMemo(() => {
    const m = new Map();
    (books || []).forEach((b) => m.set(b.id, (m.get(b.id) || 0) + 1));
    return m;
  }, [books]);

  const problems = useMemo(() => {
    const m = new Map();
    (books || []).forEach((b) => { const p = problemsFor(b, idCounts); if (p.length) m.set(b._k, p); });
    return m;
  }, [books, idCounts]);

  const changes = useMemo(() => {
    if (!books) return { edited: 0, added: 0, removed: 0, total: 0 };
    const keys = new Set(books.map((b) => b._k));
    let edited = 0, added = 0;
    books.forEach((b) => {
      const was = original.get(b._k);
      if (was === undefined) added++;
      else if (was !== JSON.stringify(strip(b))) edited++;
    });
    let removed = 0;
    original.forEach((_, k) => { if (!keys.has(k)) removed++; });
    return { edited, added, removed, total: edited + added + removed };
  }, [books, original]);

  const dirty = changes.total > 0;

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const stats = useMemo(() => {
    const list = books || [];
    const count = (type) => list.filter((b) => b.type === type).length;
    return {
      text: count('text'),
      audio: count('audio'),
      affiliate: list.filter((b) => linkState(b.buyLink) === 'affiliate').length,
      total: list.length,
    };
  }, [books]);

  // Once every problem is fixed, the "Problems" filter quietly falls back to all
  const activeLinkFilter = linkFilter === 'problems' && !problems.size ? 'all' : linkFilter;

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (books || []).filter((b) => {
      if (typeFilter !== 'all' && b.type !== typeFilter) return false;
      const state = linkState(b.buyLink);
      if (activeLinkFilter === 'needs' && state === 'affiliate') return false;
      if (activeLinkFilter === 'has' && state !== 'affiliate') return false;
      if (activeLinkFilter === 'problems' && !problems.has(b._k)) return false;
      if (!needle) return true;
      return `${b.title} ${b.author} ${b.id}`.toLowerCase().includes(needle);
    });
  }, [books, q, typeFilter, activeLinkFilter, problems]);

  // ── Mutations ──
  const update = (k, patch) => setBooks((list) => list.map((b) => (b._k === k ? { ...b, ...patch } : b)));

  const remove = (b) => {
    if (!window.confirm(`Remove “${b.title || 'this book'}” from the Library?`)) return;
    setBooks((list) => list.filter((x) => x._k !== b._k));
    if (openKey === b._k) setOpenKey(null);
  };

  const add = () => {
    const nb = withKey({
      id: uniqueId('new-book', new Set(books.map((b) => b.id))),
      type: typeFilter === 'audio' ? 'audio' : 'text',
      title: '', author: '', emoji: '📖', coverColor: DEFAULT_COVER, review: '', buyLink: '', shopName: 'Amazon',
    });
    setBooks((list) => [nb, ...list]);
    setLinkFilter('all');
    setQ('');
    setOpenKey(nb._k);
  };

  // Put a saved version into the editor as unsaved changes; Save makes it live again
  const loadBackup = async (name, savedAt) => {
    if (dirty && !window.confirm('Replace your unsaved changes with this backup?')) return;
    try {
      const data = await api(`backup&name=${encodeURIComponent(name)}`);
      const keyById = new Map(books.map((b) => [b.id, b._k]));
      setBooks(data.books.map((b) => (keyById.has(b.id) ? { ...b, _k: keyById.get(b.id) } : withKey(b))));
      setShowBackups(false);
      setLinkFilter('all');
      setNotice({ kind: 'ok', text: `Loaded the version saved ${new Date(savedAt).toLocaleString()}. Review it, then press Save to make it live again.` });
    } catch (e) {
      if (e.status === 401) onSignedOut();
      else setNotice({ kind: 'error', text: e.message });
    }
  };

  const save = async () => {
    setNotice(null);
    if (problems.size) {
      setLinkFilter('problems');
      setNotice({ kind: 'error', text: `${problems.size} book${problems.size > 1 ? 's need' : ' needs'} fixing first. They’re shown below.` });
      return;
    }
    setSaving(true);
    try {
      const res = await api('save', { body: { books: books.map(strip), baseUpdatedAt }, csrf: session.csrf });
      setOriginal(new Map(books.map((b) => [b._k, JSON.stringify(strip(b))])));
      setBaseUpdatedAt(res.updatedAt);
      setOnServer(true);
      setNotice({ kind: 'ok', text: `Saved ${res.count} books. The Library shows the update within about a minute.` });
    } catch (e) {
      if (e.status === 401) { onSignedOut(); return; }
      setNotice({ kind: 'error', text: e.message, list: e.data?.errors });
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    if (dirty && !window.confirm('You have unsaved changes. Sign out anyway?')) return;
    try { await api('logout', { body: {} }); } catch { /* signed out either way */ }
    onSignedOut();
  };

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    download(`monkeymind-library-${stamp}.csv`, '﻿' + toCsv(books.map(strip)), 'text/csv;charset=utf-8');
  };

  const importCsv = async (file) => {
    if (!file) return;
    const rows = parseCsv(await file.text());
    if (rows.length < 2) { setNotice({ kind: 'error', text: 'That file has no rows.' }); return; }
    const head = rows[0].map((h) => h.trim());
    const col = Object.fromEntries(FIELDS.map((f) => [f, head.findIndex((h) => h.toLowerCase() === f.toLowerCase())]));
    if (col.id < 0) { setNotice({ kind: 'error', text: 'The CSV needs an “id” column. Export first to get the right format.' }); return; }

    const byId = new Map(books.map((b) => [b.id, b]));
    const taken = new Set(byId.keys());
    let updated = 0, added = 0, skipped = 0;
    const next = [...books];
    rows.slice(1).forEach((r) => {
      const rec = {};
      FIELDS.forEach((f) => { if (col[f] >= 0 && r[col[f]] !== undefined) rec[f] = r[col[f]].trim(); });
      if (!rec.id) { skipped++; return; }
      if (rec.type && rec.type !== 'audio') rec.type = 'text';
      if (rec.cover && !COVER_PATH.test(rec.cover)) delete rec.cover;
      const existing = byId.get(rec.id);
      if (existing) {
        // Only columns that are present and filled in replace the current values
        const patch = Object.fromEntries(Object.entries(rec).filter(([k, v]) => k !== 'id' && v !== ''));
        const merged = { ...existing, ...patch };
        if (JSON.stringify(merged) !== JSON.stringify(existing)) {
          next[next.findIndex((b) => b._k === existing._k)] = merged;
          updated++;
        }
      } else if (rec.title && rec.author) {
        const nb = withKey({
          type: 'text', emoji: '📖', coverColor: DEFAULT_COVER, review: '', shopName: 'Amazon', buyLink: '',
          ...rec, id: uniqueId(slugify(rec.id) || slugify(rec.title), taken),
        });
        taken.add(nb.id);
        next.push(nb);
        added++;
      } else skipped++;
    });
    setBooks(next);
    setNotice({
      kind: 'ok',
      text: `Imported: ${updated} updated, ${added} added${skipped ? `, ${skipped} skipped (unknown id without title/author)` : ''}. Review, then press Save.`,
    });
  };

  if (loadError) {
    return (
      <div className="mm-panel adm-card">
        <p className="adm-error">{loadError}</p>
        <button className="mm-btn" onClick={load}>Try again</button>
      </div>
    );
  }
  if (!books) return <p className="adm-muted">Loading books…</p>;

  const pct = stats.total ? Math.round((stats.affiliate / stats.total) * 100) : 0;

  return (
    <>
      <header className="adm-head">
        <div>
          <h1>Library admin</h1>
          <p className="adm-muted">Signed in as <b>{session.username}</b></p>
        </div>
        <div className="adm-head__actions">
          <button className="mm-btn mm-btn--ghost mm-btn--sm" onClick={() => setShowBackups((v) => !v)} aria-expanded={showBackups}>
            <TbHistory size={16} /> Backups
          </button>
          <button className="mm-btn mm-btn--ghost mm-btn--sm" onClick={() => setShowAccount((v) => !v)} aria-expanded={showAccount}>
            <TbKey size={16} /> Password
          </button>
          <button className="mm-btn mm-btn--ghost mm-btn--sm" onClick={logout}><TbLogout size={16} /> Sign out</button>
        </div>
      </header>

      {showAccount && (
        <PasswordForm
          csrf={session.csrf}
          onDone={(csrf) => { setSession((s) => ({ ...s, csrf })); setShowAccount(false); setNotice({ kind: 'ok', text: 'Password changed.' }); }}
          onCancel={() => setShowAccount(false)}
        />
      )}

      {showBackups && <BackupsPanel onLoad={loadBackup} onClose={() => setShowBackups(false)} onSignedOut={onSignedOut} />}

      {!onServer && (
        <div className="adm-banner">
          <TbAlertTriangle size={18} />
          <span>Nothing saved on the server yet, so the site shows its built-in list. Press <b>Save</b> once to make this list live.</span>
        </div>
      )}

      <section className="adm-stats" aria-label="Summary">
        <div className="mm-panel adm-stat"><b>{stats.text}</b><span>Books</span></div>
        <div className="mm-panel adm-stat"><b>{stats.audio}</b><span>Audiobooks</span></div>
        <div className="mm-panel adm-stat adm-stat--wide">
          <b>{stats.affiliate} / {stats.total}</b><span>have your affiliate link</span>
          <div className="adm-meter" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
        </div>
      </section>

      <div className="adm-savebar mm-panel">
        <span className={dirty ? 'adm-savebar__dirty' : 'adm-muted'}>
          {dirty
            ? `Unsaved: ${[changes.edited && `${changes.edited} edited`, changes.added && `${changes.added} added`, changes.removed && `${changes.removed} removed`].filter(Boolean).join(', ')}`
            : onServer ? 'All changes saved' : 'Not on the server yet'}
        </span>
        <div className="adm-savebar__actions">
          <button className="mm-btn mm-btn--sm" onClick={exportCsv}><TbDownload size={16} /> Export CSV</button>
          <button className="mm-btn mm-btn--sm" onClick={() => fileRef.current?.click()}><TbUpload size={16} /> Import CSV</button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => { importCsv(e.target.files?.[0]); e.target.value = ''; }} />
          <button className="mm-btn mm-btn--primary mm-btn--sm" onClick={save} disabled={saving || (!dirty && onServer)}>
            <TbDeviceFloppy size={16} /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {notice && (
        <div className={`adm-notice adm-notice--${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
          {notice.kind === 'ok' ? <TbCheck size={18} /> : <TbAlertTriangle size={18} />}
          <div>
            <p>{notice.text}</p>
            {notice.list?.length > 0 && <ul>{notice.list.map((t) => <li key={t}>{t}</li>)}</ul>}
          </div>
          <button className="adm-icon" onClick={() => setNotice(null)} aria-label="Dismiss"><TbX size={16} /></button>
        </div>
      )}

      <div className="adm-toolbar">
        <label className="adm-search">
          <TbSearch size={16} aria-hidden="true" />
          <input className="mm-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, author or id" aria-label="Search books" />
        </label>
        <div className="mm-chips" role="group" aria-label="Format">
          {[['all', 'All'], ['text', 'Books'], ['audio', 'Audiobooks']].map(([id, label]) => (
            <button key={id} className={`mm-chip ${typeFilter === id ? 'is-on' : ''}`} aria-pressed={typeFilter === id} onClick={() => setTypeFilter(id)}>{label}</button>
          ))}
        </div>
        <div className="mm-chips" role="group" aria-label="Link status">
          {[['all', 'Any link'], ['needs', 'Needs affiliate link'], ['has', 'Has affiliate link'], ...(problems.size ? [['problems', `Problems (${problems.size})`]] : [])].map(([id, label]) => (
            <button key={id} className={`mm-chip ${activeLinkFilter === id ? 'is-on' : ''}`} aria-pressed={activeLinkFilter === id} onClick={() => setLinkFilter(id)}>{label}</button>
          ))}
        </div>
        <button className="mm-btn mm-btn--sm adm-add" onClick={add}><TbPlus size={16} /> Add book</button>
      </div>

      <p className="adm-muted adm-count">Showing {visible.length} of {books.length}</p>

      <ul className="adm-list">
        {visible.map((b) => (
          <BookRow
            key={b._k}
            book={b}
            open={openKey === b._k}
            problems={problems.get(b._k)}
            changed={original.get(b._k) !== JSON.stringify(strip(b))}
            onToggle={() => setOpenKey((k) => (k === b._k ? null : b._k))}
            onChange={(patch) => update(b._k, patch)}
            onRemove={() => remove(b)}
            takenIds={idCounts}
            csrf={session.csrf}
          />
        ))}
        {visible.length === 0 && <li className="adm-empty">No books match these filters.</li>}
      </ul>
    </>
  );
}

// ── One row ────────────────────────────────────────────────────────────────
function BookRow({ book, open, problems, changed, onToggle, onChange, onRemove, takenIds, csrf }) {
  const [picking, setPicking] = useState(false);
  const thumb = coverSrc(book);
  const state = linkState(book.buyLink);
  const cover = COVER_RE.exec(book.coverColor || '') || COVER_RE.exec(DEFAULT_COVER);
  const setCover = (i, value) => {
    const parts = [cover[1], cover[2], cover[3]];
    parts[i] = value;
    onChange({ coverColor: `linear-gradient(${parts[0]}deg, ${parts[1]}, ${parts[2]})` });
  };
  const field = (k) => ({ value: book[k] ?? '', onChange: (e) => onChange({ [k]: e.target.value }) });

  // Fill a sensible id from the title for new/placeholder ids
  const suggestId = () => {
    if (!/^new-book(-\d+)?$/.test(book.id) || !book.title.trim()) return;
    const base = slugify(book.title) + (book.type === 'audio' ? '-audio' : '');
    let id = base;
    for (let n = 2; takenIds.get(id); n++) id = `${base}-${n}`;
    onChange({ id });
  };

  return (
    <li className={`mm-panel adm-row ${open ? 'is-open' : ''} ${problems ? 'has-problem' : ''}`}>
      <div className="adm-row__main">
        <div className="adm-row__cover" style={{ background: book.coverColor }} aria-hidden="true">
          {thumb ? <img src={thumb} alt="" loading="lazy" /> : book.emoji}
        </div>
        <div className="adm-row__info">
          <div className="adm-row__title">
            <span className={`adm-type adm-type--${book.type}`}>{book.type === 'audio' ? 'Audio' : 'Book'}</span>
            <span className="adm-row__name">{book.title || <i>Untitled</i>}</span>
            {changed && <span className="adm-dot" title="Unsaved change" />}
          </div>
          <span className="adm-muted adm-row__author">{book.author || '—'}</span>
        </div>
        <label className="adm-row__link">
          <span className="sr-only">Link for {book.title}</span>
          <input
            className={`mm-input is-${state}`}
            {...field('buyLink')}
            placeholder="Paste affiliate link (https://…)"
            inputMode="url"
            spellCheck={false}
          />
          <span className={`adm-linkstate is-${state}`}>{LINK_LABELS[state]}</span>
        </label>
        <div className="adm-row__actions">
          <a
            className={`adm-icon ${book.buyLink ? '' : 'is-disabled'}`}
            href={book.buyLink || undefined}
            target="_blank"
            rel="noopener noreferrer"
            title="Open link in a new tab"
            aria-label={`Open link for ${book.title}`}
          ><TbExternalLink size={18} /></a>
          <button className="adm-icon" onClick={onToggle} aria-expanded={open} title="Edit details" aria-label={`Edit ${book.title}`}><TbPencil size={18} /></button>
          <button className="adm-icon adm-icon--danger" onClick={onRemove} title="Remove" aria-label={`Remove ${book.title}`}><TbTrash size={18} /></button>
        </div>
      </div>

      {problems && <p className="adm-error adm-row__problems">{problems.join(' · ')}</p>}

      {open && (
        <div className="adm-edit">
          <label className="adm-field adm-field--wide"><span>Title</span><input className="mm-input" {...field('title')} onBlur={suggestId} /></label>
          <label className="adm-field adm-field--wide"><span>Author</span><input className="mm-input" {...field('author')} /></label>
          <label className="adm-field">
            <span>Format</span>
            <select className="mm-input" {...field('type')}>
              <option value="text">Book</option>
              <option value="audio">Audiobook</option>
            </select>
          </label>
          <label className="adm-field"><span>Shop name</span><input className="mm-input" {...field('shopName')} placeholder="Amazon" /></label>
          <label className="adm-field"><span>Emoji</span><input className="mm-input" {...field('emoji')} maxLength={8} /></label>
          <div className="adm-field adm-field--full adm-cover">
            <span>Cover image</span>
            <div className="adm-cover__row">
              <div className="adm-cover__preview" style={{ background: book.coverColor }}>
                {thumb ? <img src={thumb} alt="" /> : <span>{book.emoji}</span>}
              </div>
              <div className="adm-cover__actions">
                <button type="button" className="mm-btn mm-btn--sm" onClick={() => setPicking((v) => !v)} disabled={!book.title}>
                  <TbPhoto size={16} /> {thumb ? 'Change cover' : 'Find cover'}
                </button>
                {thumb && <button type="button" className="mm-btn mm-btn--ghost mm-btn--sm" onClick={() => onChange({ cover: '' })}>Remove cover</button>}
                <p className="adm-muted adm-cover__hint">Without an image, the coloured cover below is shown.</p>
              </div>
            </div>
            {picking && (
              <CoverPicker
                book={book}
                csrf={csrf}
                onPick={(cover) => { onChange({ cover }); setPicking(false); }}
                onClose={() => setPicking(false)}
              />
            )}
          </div>
          <div className="adm-field">
            <span>Cover colours</span>
            <div className="adm-colors">
              <input type="color" value={cover[2].length === 7 ? cover[2] : '#3b4a7a'} onChange={(e) => setCover(1, e.target.value)} aria-label="Cover colour, top" />
              <input type="color" value={cover[3].length === 7 ? cover[3] : '#1d2647'} onChange={(e) => setCover(2, e.target.value)} aria-label="Cover colour, bottom" />
            </div>
          </div>
          <label className="adm-field adm-field--full"><span>Review (shown under “Read our review”)</span><textarea className="mm-input" rows={3} {...field('review')} /></label>
          <label className="adm-field adm-field--wide">
            <span>ID (used for CSV import; letters, numbers, dashes)</span>
            <input className="mm-input" {...field('id')} onChange={(e) => onChange({ id: e.target.value.toLowerCase() })} spellCheck={false} />
          </label>
          <div className="adm-field adm-field--wide adm-edit__tools">
            <span>Link tools</span>
            <button type="button" className="mm-btn mm-btn--sm" onClick={() => onChange({ buyLink: amazonSearch(book) })} disabled={!book.title}>
              Reset to Amazon search
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

// ── Change password ────────────────────────────────────────────────────────
function PasswordForm({ csrf, onDone, onCancel }) {
  const [f, setF] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (f.next !== f.confirm) { setError('The new passwords do not match.'); return; }
    setBusy(true);
    try {
      const res = await api('password', { body: { current: f.current, next: f.next }, csrf });
      onDone(res.csrf);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="mm-panel adm-card adm-password" onSubmit={submit}>
      <h2>Change password</h2>
      <label className="adm-field"><span>Current password</span><input className="mm-input" type="password" autoComplete="current-password" value={f.current} onChange={set('current')} required /></label>
      <label className="adm-field"><span>New password (at least 10 characters)</span><input className="mm-input" type="password" autoComplete="new-password" minLength={10} value={f.next} onChange={set('next')} required /></label>
      <label className="adm-field"><span>Confirm new password</span><input className="mm-input" type="password" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} required /></label>
      {error && <p className="adm-error" role="alert">{error}</p>}
      <div className="adm-password__actions">
        <button type="button" className="mm-btn mm-btn--ghost mm-btn--sm" onClick={onCancel}>Cancel</button>
        <button className="mm-btn mm-btn--primary mm-btn--sm" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
      </div>
    </form>
  );
}

// ── Cover picker (searches Open Library; the chosen cover is copied to our server) ──
function CoverPicker({ book, csrf, onPick, onClose }) {
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(null);
  const [query, setQuery] = useState(() => `${book.title.split(/[:(]/)[0].trim()} ${book.author.split(/,| and /)[0]}`);

  const search = useCallback(async (q) => {
    setResults(null);
    setError('');
    try {
      const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=24&fields=key,title,author_name,cover_i,first_publish_year`);
      const data = await res.json();
      const seen = new Set();
      setResults((data.docs || []).filter((d) => d.cover_i && !seen.has(d.cover_i) && seen.add(d.cover_i)).slice(0, 12));
    } catch {
      setError('Could not reach Open Library. Check your connection and try again.');
      setResults([]);
    }
  }, []);

  useEffect(() => {
    let live = true;
    // Run the first search once; later searches come from the form
    Promise.resolve().then(() => { if (live) search(query); });
    return () => { live = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = async (coverId) => {
    setSaving(coverId);
    setError('');
    try {
      const data = await api('cover', { body: { coverId: String(coverId) }, csrf });
      onPick(data.cover);
    } catch (e) {
      setError(e.message);
      setSaving(null);
    }
  };

  return (
    <div className="adm-picker">
      <form className="adm-picker__search" onSubmit={(e) => { e.preventDefault(); search(query); }}>
        <input className="mm-input" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search Open Library" />
        <button className="mm-btn mm-btn--sm">Search</button>
        <button type="button" className="adm-icon" onClick={onClose} aria-label="Close cover search"><TbX size={18} /></button>
      </form>
      {error && <p className="adm-error">{error}</p>}
      {results === null && <p className="adm-muted">Searching Open Library…</p>}
      {results?.length === 0 && !error && <p className="adm-muted">No covers found. Try a shorter title or just the author’s surname.</p>}
      {results?.length > 0 && (
        <ul className="adm-picker__grid">
          {results.map((d) => (
            <li key={d.cover_i}>
              <button type="button" onClick={() => choose(d.cover_i)} disabled={saving !== null} title={`${d.title} — ${(d.author_name || []).join(', ')}`}>
                <img src={`https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`} alt="" loading="lazy" />
                <span>{saving === d.cover_i ? 'Saving…' : d.title}</span>
                <small>{(d.author_name || [])[0]}{d.first_publish_year ? ` · ${d.first_publish_year}` : ''}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="adm-muted adm-picker__note">Pick the edition that looks right; it’s copied to your server, so visitors never load images from Open Library.</p>
    </div>
  );
}

// ── Backups ────────────────────────────────────────────────────────────────
function BackupsPanel({ onLoad, onClose, onSignedOut }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    api('backups')
      .then((d) => { if (live) setList(d.backups); })
      .catch((e) => { if (!live) return; if (e.status === 401) onSignedOut(); else setError(e.message); });
    return () => { live = false; };
  }, [onSignedOut]);

  return (
    <section className="mm-panel adm-card adm-backups" aria-label="Backups">
      <div className="adm-backups__head">
        <h2>Backups</h2>
        <button className="adm-icon" onClick={onClose} aria-label="Close backups"><TbX size={18} /></button>
      </div>
      <p className="adm-muted">Every save keeps the previous version (the last 30). Loading one puts it in the editor; nothing changes on the site until you press Save.</p>
      {error && <p className="adm-error">{error}</p>}
      {list === null && !error && <p className="adm-muted">Loading…</p>}
      {list?.length === 0 && <p className="adm-muted">No backups yet. One is made each time you save.</p>}
      {list?.length > 0 && (
        <ul className="adm-backups__list">
          {list.map((b) => (
            <li key={b.name}>
              <span>{b.savedAt ? new Date(b.savedAt).toLocaleString() : b.name}</span>
              <span className="adm-muted">{b.count} books</span>
              <button className="mm-btn mm-btn--sm" onClick={() => onLoad(b.name, b.savedAt)}>Load</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
