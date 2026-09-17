/* GitHub Pages serves every asset with Cache-Control: max-age=600, so for ten
   minutes after a push a normal reload shows the previous stylesheet without
   even revalidating. This stamps a version onto each asset URL — the browser
   treats a changed query as a different file, so a push is visible at once.
   Run it before committing:  node tools/stamp.js                            */
const fs = require('fs'), path = require('path');

const V = process.argv[2] || Date.now().toString(36);
const ROOT = path.join(__dirname, '..');
const strip = u => u.split('?')[0];
let touched = 0;

// the pages: their own stylesheet and script, plus the design-system entry
for (const f of fs.readdirSync(path.join(ROOT, 'site')).filter(n => n.endsWith('.html'))) {
  const p = path.join(ROOT, 'site', f);
  const before = fs.readFileSync(p, 'utf8');
  const after = before.replace(
    /(<(?:link[^>]*href|script[^>]*src)=")([^"]*(?:styles\.css|site\.css|site\.js))(\?v=[^"]*)?(")/g,
    (_, a, url, __, z) => a + strip(url) + '?v=' + V + z);
  if (after !== before) { fs.writeFileSync(p, after); touched++; }
}

// styles.css is @import lines only, so the token files need their own stamp
const sp = path.join(ROOT, 'styles.css');
const sBefore = fs.readFileSync(sp, 'utf8');
const sAfter = sBefore.replace(/@import url\('([^']+?)(\?v=[^']*)?'\)/g,
  (_, url) => "@import url('" + strip(url) + "?v=" + V + "')");
if (sAfter !== sBefore) { fs.writeFileSync(sp, sAfter); touched++; }

console.log('stamped v=' + V + ' across ' + touched + ' files');
