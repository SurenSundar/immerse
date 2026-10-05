/**
 * Dynamically updates document title and SEO metadata tags in the DOM.
 * Excellent for search engine crawlers and social previews during pre-rendering.
 * 
 * @param {string} title Page title
 * @param {string} description Meta description (packed with target keywords)
 * @param {string} path Current route pathname (e.g., '/resonance')
 */
export function updateMetaTags(title, description, path) {
  const cleanPath = path || '';
  const url = `https://monkeymind.app${cleanPath}`;
  
  // Update browser window/tab title
  document.title = title;

  const queries = {
    'meta[name="description"]': description,
    'meta[property="og:title"]': title,
    'meta[property="og:description"]': description,
    'meta[property="og:url"]': url,
    'meta[name="twitter:title"]': title,
    'meta[name="twitter:description"]': description,
    'meta[name="twitter:url"]': url,
    'link[rel="canonical"]': url
  };

  Object.entries(queries).forEach(([selector, val]) => {
    const el = document.querySelector(selector);
    if (el) {
      if (selector.startsWith('link')) {
        el.setAttribute('href', val);
      } else {
        el.setAttribute('content', val);
      }
    } else {
      // Fallback: create the tag if it's missing in head
      if (selector.startsWith('meta')) {
        const newMeta = document.createElement('meta');
        if (selector.includes('property=')) {
          const property = selector.match(/property="([^"]+)"/)[1];
          newMeta.setAttribute('property', property);
        } else {
          const name = selector.match(/name="([^"]+)"/)[1];
          newMeta.setAttribute('name', name);
        }
        newMeta.setAttribute('content', val);
        document.head.appendChild(newMeta);
      }
    }
  });
}
