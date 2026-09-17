/* Builds a self-contained copy of the live site and zips it, so the whole
   thing can be handed to someone who just opens index.html — no server, no
   network, works offline.

   Only the six linked pages and the files they actually reference go in: the
   repo carries 40 icons and 16 font cuts, the site uses 9 and 5.

   Fonts are inlined as data URIs rather than copied. Chrome treats every
   file:// document as its own opaque origin and refuses an @font-face load
   across it, so a copied .otf would silently fail and the whole bundle would
   render in Times New Roman. A data URI is not a fetch, so it survives.

   Run:  node tools/bundle.js                                                */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, '_diff', 'slw-site');
const ZIP = path.join(ROOT, '_diff', 'slw-site.zip');
const PAGES = ['index', 'our-approach', 'about', 'portfolio', 'contact', 'disclosures'];
const ASSET = /\.(css|js|png|jpe?g|webp|svg|otf|woff2?)$/i;

// the five weights the stylesheets ask for; thin, extrabold, black and every
// italic are declared in fonts.css but nothing ever sets them
const WEIGHTS = { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700 };

// href="…" / src="…" in markup, and url(…) in stylesheets
const REF = new RegExp('(?:(?:src|href)\\s*=\\s*[\'"]([^\'"]+)|url\\(\\s*[\'"]?([^\'")]+))', 'g');

const want = new Set();
const seen = new Set();

function harvest(relFile) {
  if (seen.has(relFile)) return;
  seen.add(relFile);
  const abs = path.join(ROOT, relFile);
  if (!fs.existsSync(abs)) return;
  want.add(relFile);
  if (!/\.(html|css|js)$/i.test(relFile)) return;

  const dir = path.dirname(abs);
  for (const m of fs.readFileSync(abs, 'utf8').matchAll(REF)) {
    const raw = (m[1] || m[2] || '').split('?')[0].split('#')[0];
    if (!raw || /^(https?:|mailto:|data:|tel:)/i.test(raw)) continue;
    if (!ASSET.test(raw)) continue;
    const target = path.resolve(dir, raw);
    if (!target.startsWith(ROOT)) continue;
    harvest(path.relative(ROOT, target).split(path.sep).join('/'));
  }
}

for (const p of PAGES) harvest('site/' + p + '.html');

const isFont = f => f.startsWith('assets/fonts/');

fs.rmSync(OUT, { recursive: true, force: true });
let n = 0, bytes = 0;
for (const rel of [...want].sort()) {
  if (isFont(rel)) continue;                     // inlined below instead
  const src = path.join(ROOT, rel);
  const dst = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  n++; bytes += fs.statSync(src).size;
}

// an entry point at the top of the folder
fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(OUT, 'index.html'));
n++;

// rewrite fonts.css as data URIs
let fontBytes = 0;
const faces = Object.entries(WEIGHTS).map(([cut, weight]) => {
  const b64 = fs.readFileSync(path.join(ROOT, 'assets', 'fonts', 'proximanova-' + cut + '.otf'))
    .toString('base64');
  fontBytes += b64.length;
  return "@font-face {\n  font-family: 'Proxima Nova';\n" +
    '  src: url(data:font/otf;base64,' + b64 + ") format('opentype');\n" +
    '  font-weight: ' + weight + ';\n  font-style: normal;\n  font-display: block;\n}';
});
const fp = path.join(OUT, 'tokens', 'fonts.css');
fs.mkdirSync(path.dirname(fp), { recursive: true });
fs.writeFileSync(fp,
  '/* Proxima Nova, the five weights this site uses, inlined so the bundle keeps\n' +
  '   its typeface when the pages are opened straight from disk. */\n' +
  faces.join('\n') + '\n');

const byDir = {};
for (const rel of [...want].filter(r => !isFont(r))) {
  const d = rel.includes('/') ? rel.replace(/[^/]+$/, '') : './';
  byDir[d] = (byDir[d] || 0) + 1;
}
byDir['tokens/'] = (byDir['tokens/'] || 0);
console.log('copied ' + n + ' files, ' + ((bytes + fontBytes) / 1048576).toFixed(2) + ' MB');
for (const d of Object.keys(byDir).sort()) console.log('  ' + d.padEnd(20) + byDir[d]);
console.log('  fonts inlined       ' + faces.length + '  (' + (fontBytes / 1048576).toFixed(2) + ' MB of base64)');

fs.rmSync(ZIP, { force: true });
execSync('powershell -NoProfile -Command "Compress-Archive -Path \'' + OUT +
  '/*\' -DestinationPath \'' + ZIP + '\' -Force"');
console.log('\nzip: ' + (fs.statSync(ZIP).size / 1048576).toFixed(2) + ' MB  ->  ' + ZIP);
