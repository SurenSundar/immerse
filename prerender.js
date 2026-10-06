import fs from 'fs';
import path from 'path';
import http from 'http';
import puppeteer from 'puppeteer';

const PORT = 5002;
const SITE = 'https://monkeymind.online';

// Every built-in book gets its own pre-rendered page (/books/<id>)
const LIBRARY = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/library.json'), 'utf-8'));

// Fresh sitemap on every build: main pages plus every book page.
// Books added later in /admin are listed by /api/sitemap.php.
function writeSitemap(routes) {
  const today = new Date().toISOString().slice(0, 10);
  const meta = (r) => r === '/' ? ['daily', '1.0']
    : r === '/books' ? ['weekly', '0.9']
    : r.startsWith('/books/') ? ['monthly', '0.6']
    : r === '/privacy' || r === '/terms' ? ['yearly', '0.3']
    : ['weekly', '0.8'];
  const urls = routes.map((r) => {
    const [freq, prio] = meta(r);
    return `  <url>\n    <loc>${SITE}${r === '/' ? '' : r}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(process.cwd(), 'dist', 'sitemap.xml'), xml, 'utf-8');
  console.log(`Wrote sitemap.xml with ${routes.length} URLs`);
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// Starts a simple, robust static HTTP server serving the 'dist' directory with SPA routing
function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let rawUrl = req.url.split('?')[0];
      let filePath = path.join(process.cwd(), 'dist', rawUrl);
      
      // SPA Fallback: if path is not a file, fallback to dist/index.html
      const fileExists = fs.existsSync(filePath) && fs.statSync(filePath).isFile();
      if (!fileExists) {
        filePath = path.join(process.cwd(), 'dist', 'index.html');
      }

      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end(`Server Error: ${err.code}`);
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    });

    server.listen(PORT, (err) => {
      if (err) reject(err);
      else {
        console.log(`Temp static server running at http://localhost:${PORT}`);
        resolve(server);
      }
    });
  });
}

async function run() {
  console.log("Starting static pre-rendering (SSG)...");

  if (!fs.existsSync(path.join(process.cwd(), 'dist'))) {
    console.error("Error: 'dist' folder not found. Please run 'npm run build' first.");
    process.exit(1);
  }

  const server = await startServer();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  const page = await browser.newPage();
  
  // Enable console and error logging from the browser
  page.on('console', msg => {
    // Quiet down common noise, focus on actual logs or warnings
    const txt = msg.text();
    if (!txt.includes('three.js') && !txt.includes('HMR')) {
      console.log('  [browser-console]:', txt);
    }
  });
  page.on('pageerror', err => {
    console.error('  [browser-error]:', err.message);
  });
  page.on('response', response => {
    const status = response.status();
    if (status >= 400) {
      console.log(`  [failed response]: ${response.url()} -> ${status}`);
    }
  });
  

  // Helper to ensure path exists in dist/
  function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
  }

  // Pre-seed sessionStorage so that page loading on '/' loads the full Hero view with internal links
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    sessionStorage.setItem('monkeymind_game_complete', 'true');
  });

  const routes = [
    '/',
    '/timer',
    '/resonance',
    '/let-it-go',
    '/meditate',
    '/soundscapes',
    '/books',
    '/privacy',
    '/terms',
    ...LIBRARY.map((b) => `/books/${b.id}`),
  ];

  console.log(`Pre-rendering ${routes.length} routes...`);

  for (const route of routes) {
    const targetUrl = `http://localhost:${PORT}${route}`;
    console.log(`Crawling: ${route} (${targetUrl})`);
    
    try {
      // 3D pages keep rendering (and are slow on machines without a GPU, e.g. CI),
      // so wait for the DOM, then give the network a short chance to settle.
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (route.startsWith('/books/')) {
        // Book pages are light: wait for the heading instead of a quiet network
        await page.waitForSelector('.bd-info h1', { timeout: 15000 });
        await new Promise((r) => setTimeout(r, 150));
      } else {
        await page.waitForNetworkIdle({ idleTime: 500, timeout: 15000 }).catch(() => {});
      }
      
      // Extract the fully rendered HTML DOM
      const htmlContent = await page.content();
      
      // Determine destination file path
      let outPath;
      if (route === '/') {
        outPath = path.join(process.cwd(), 'dist', 'index.html');
      } else {
        outPath = path.join(process.cwd(), 'dist', route, 'index.html');
      }
      
      ensureDirectoryExistence(outPath);
      fs.writeFileSync(outPath, htmlContent, 'utf-8');
      console.log(`Saved static file to: ${outPath}`);
    } catch (err) {
      console.error(`Failed to pre-render route ${route}:`, err.message);
    }
  }

  writeSitemap(routes);

  console.log("Pre-rendering finished! Closing browser and server...");
  await browser.close();
  server.close();
  console.log("Static pre-rendering complete!");
}

run().catch(err => {
  console.error("Prerender process encountered an error:", err);
  process.exit(1);
});
