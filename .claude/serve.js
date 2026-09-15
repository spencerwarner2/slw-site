/* Minimal zero-dependency static server for the SLW website draft. */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 4321;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css; charset=utf-8',
  '.js'  : 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg' : 'image/svg+xml',
  '.png' : 'image/png',
  '.jpg' : 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif' : 'image/gif',
  '.webp': 'image/webp',
  '.ico' : 'image/x-icon',
  '.otf' : 'font/otf',
  '.ttf' : 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  if (rel === '/' || rel === '/index.html') {
    res.writeHead(302, { Location: '/site/index.html' });
    res.end();
    return;
  }

  const parts = rel.split('/').filter(p => p && p !== '.' && p !== '..');
  const file = path.join(ROOT, ...parts);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('Forbidden'); return; }

  fs.stat(file, (err, st) => {
    const target = (!err && st.isDirectory()) ? path.join(file, 'index.html') : file;
    fs.readFile(target, (err2, buf) => {
      if (err2) { res.writeHead(404, {'Content-Type':'text/plain'}).end('Not found: ' + rel); return; }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(target).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      res.end(buf);
    });
  });
}).listen(PORT, () => {
  console.log('SLW site draft serving ' + ROOT);
  console.log('http://localhost:' + PORT + '/');
});
