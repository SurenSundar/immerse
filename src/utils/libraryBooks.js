// The Library's books.
// - src/data/library.json is the built-in list: it ships with the site and the app,
//   is used for pre-rendering/SEO, and is what visitors see before the live list loads.
// - The live list is edited at /admin and served by /api/books.php (Hostinger, PHP).
//   When it exists it replaces the built-in list.
import BUILT_IN from '../data/library.json';

export const LIBRARY_BOOKS = BUILT_IN;

// The mobile app is served from capacitor:// (or a portless localhost), so it
// has to reach the API on the real site.
const isNativeApp = typeof window !== 'undefined' && (
  !!window.Capacitor ||
  window.location.protocol === 'capacitor:' ||
  (window.location.hostname === 'localhost' && window.location.port === '')
);
const API_ORIGIN = isNativeApp ? 'https://monkeymind.online' : '';

/** True for a missing link or a plain Amazon search (i.e. not yet an affiliate link). */
export const isPlaceholderLink = (url) => !url || /amazon\.[a-z.]+\/s\?k=/i.test(url);

/** Image URL for a book's cover (works in the app too), or '' when it has none. */
export const coverSrc = (book) => {
  const c = book?.cover;
  if (!c) return '';
  return c.startsWith('/api/') ? `${API_ORIGIN}${c}` : c;
};

// Lists saved before covers existed have no `cover` key: borrow the built-in
// cover for the same book. An empty string means it was removed on purpose.
const BUILT_IN_COVERS = new Map(BUILT_IN.filter((b) => b.cover).map((b) => [b.id, b.cover]));
export const withBuiltInCovers = (list) => list.map((b) => (
  b.cover === undefined && BUILT_IN_COVERS.has(b.id) ? { ...b, cover: BUILT_IN_COVERS.get(b.id) } : b
));

// One request per visit, shared by the Library and the book pages
let livePromise = null;

/** Live list from the server, or null when none has been saved (or the API is unreachable). */
export function fetchLiveBooks() {
  if (!livePromise) {
    livePromise = fetch(`${API_ORIGIN}/api/books.php`)
      .then((res) => (res.status === 200 ? res.json() : null))
      .then((data) => (Array.isArray(data?.books) && data.books.length ? withBuiltInCovers(data.books) : null))
      .catch(() => null);
  }
  return livePromise;
}
