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

/** Live list from the server, or null when none has been saved (or the API is unreachable). */
export async function fetchLiveBooks(signal) {
  try {
    const res = await fetch(`${API_ORIGIN}/api/books.php`, { signal });
    if (res.status !== 200) return null;
    const data = await res.json();
    return Array.isArray(data.books) && data.books.length ? data.books : null;
  } catch {
    return null;
  }
}
