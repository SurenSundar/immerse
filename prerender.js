import fs from 'fs';
import path from 'path';
import http from 'http';
import puppeteer from 'puppeteer';

const PORT = 5002;

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
  
  // Enable request interception to mock Supabase queries
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url();
    const method = request.method();
    
    if (url.includes('/rest/v1/')) {
      // Handle CORS preflight OPTIONS requests directly
      if (method === 'OPTIONS') {
        request.respond({
          status: 200,
          headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-headers': '*',
            'access-control-allow-methods': '*',
            'access-control-max-age': '86400'
          }
        });
        return;
      }
    }
    
    if (url.includes('/rest/v1/books')) {
      console.log(`  [intercepted books API call]: ${url}`);
      request.respond({
        status: 200,
        contentType: 'application/json',
        headers: { 
          'access-control-allow-origin': '*',
          'access-control-allow-headers': '*',
          'access-control-allow-methods': '*'
        },
        body: JSON.stringify([]) // return empty array or mock data
      });
    } else {
      request.continue();
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
  ];

  console.log(`Pre-rendering ${routes.length} routes...`);

  for (const route of routes) {
    const targetUrl = `http://localhost:${PORT}${route}`;
    console.log(`Crawling: ${route} (${targetUrl})`);
    
    try {
      await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 30000 });
      
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

  console.log("Pre-rendering finished! Closing browser and server...");
  await browser.close();
  server.close();
  console.log("Static pre-rendering complete!");
}

run().catch(err => {
  console.error("Prerender process encountered an error:", err);
  process.exit(1);
});
