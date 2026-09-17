/* ============================================================
   SLW website, shared header/footer injection + motion
   Each page sets <body data-page="..."> to mark the active nav.
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var page = document.body.getAttribute('data-page') || '';

  /* ---- Nav model ---- */
  var NAV = [
    { key: 'our-approach', label: 'Our Approach', href: 'our-approach.html' },
    { key: 'about', label: 'Our Firm', href: 'about.html' },
    { key: 'portfolio', label: 'Our Portfolio', href: 'portfolio.html' }
  ];
  // which top-level owns the current page; Contact has no nav item of its
  // own, so nothing highlights there and the CTA carries it instead
  var OWNER = {};

  var caret = '<svg class="caret" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function buildHeader() {
    var h = document.createElement('header');
    h.className = 'site-header';
    var owner = OWNER[page] || page;
    var itemsHtml = NAV.map(function (n) {
      var active = (n.key === owner) ? ' active' : '';
      var link = n.href
        ? '<a class="nav-link" href="' + n.href + '">' + n.label + (n.children ? caret : '') + '</a>'
        : '<button class="nav-link" type="button">' + n.label + (n.children ? caret : '') + '</button>';
      var dd = '';
      if (n.children) {
        dd = '<div class="dropdown">' + n.children.map(function (c) {
          return '<a href="' + c.href + '">' + c.label + '</a>';
        }).join('') + '</div>';
      }
      return '<div class="nav-item' + active + (n.children ? ' has-children' : '') + '">' + link + dd + '</div>';
    }).join('');
    h.innerHTML =
      '<div class="header-inner">' +
        '<a class="logo" href="index.html" aria-label="Silver Lake Waterman, home"><span class="logo-type" aria-hidden="true">SLW</span></a>' +
        '<button class="nav-toggle" aria-label="Menu"><span></span><span></span><span></span></button>' +
        '<nav class="nav">' + itemsHtml +
          '<a class="nav-cta" href="contact.html">Start the conversation</a>' +
        '</nav>' +
      '</div>';
    document.body.insertBefore(h, document.body.firstChild);

    // the bar is bare over the top of a page and takes its edge once you scroll
    var edge = function () { h.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', edge, { passive: true });
    edge();

    // mobile toggle
    h.querySelector('.nav-toggle').addEventListener('click', function () { h.classList.toggle('nav-open'); });
    // dropdown open on click/keyboard (mobile + a11y); desktop uses :hover
    h.querySelectorAll('.nav-item.has-children > .nav-link').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        if (btn.tagName === 'BUTTON') e.preventDefault();
        var item = btn.parentNode;
        var wasOpen = item.classList.contains('open');
        h.querySelectorAll('.nav-item.open').forEach(function (i) { i.classList.remove('open'); });
        if (!wasOpen) item.classList.add('open');
      });
    });
  }

  function buildFooter() {
    var f = document.createElement('footer');
    f.className = 'site-footer';
    // three columns, not four: the old "Our Firm" column held a single link,
    // and the page names now match the ones in the nav
    f.innerHTML = '<div class="wrap">' +
      '<div class="foot-top">' +
        '<div class="foot-brand"><div class="brand">SLW</div><div class="tagline">Flexible capital across the full company lifecycle.</div></div>' +
        '<div><h4>Site</h4><a href="our-approach.html">Our Approach</a><a href="about.html">Our Firm</a><a href="portfolio.html">Our Portfolio</a></div>' +
        '<div><h4>More</h4><a href="contact.html">Contact</a><a href="disclosures.html">Disclosures</a></div>' +
      '</div>' +
      '<div class="legal">© ' + new Date().getFullYear() + ' Silver Lake Waterman. Proprietary &amp; confidential. Prototype site, copy from the SLW website draft. <a href="disclosures.html" style="color:inherit;text-decoration:underline">Disclosures</a></div>' +
    '</div>';
    document.body.appendChild(f);
  }

  /* ---- kicker marks ---- */
  function kmarks() {
    var d = 'M1 8 C 8 8 9 3 15 4 C 21 5 22 9 29 5';
    document.querySelectorAll('.kicker').forEach(function (k) {
      if (k.querySelector('.kmark')) return;
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'kmark'); svg.setAttribute('viewBox', '0 0 30 12'); svg.setAttribute('aria-hidden', 'true');
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d);
      svg.appendChild(p); k.insertBefore(svg, k.firstChild);
    });
  }

  /* ---- count-up ---- */
  function runCount(el) {
    if (el.dataset.done) return; el.dataset.done = '1';
    var target = parseFloat(el.dataset.count);
    var decimals = (el.dataset.count.split('.')[1] || '').length;
    var prefix = el.dataset.prefix || '', suffix = el.dataset.suffix || '';
    if (reduce) { el.textContent = prefix + target.toFixed(decimals) + suffix; return; }
    var dur = 1400, start = null;
    function step(ts) { if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step); else el.textContent = prefix + target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(step);
  }

  /* ---- reveal ---- */
  function reveal() {
    var animated = Array.prototype.slice.call(document.querySelectorAll('[data-animate]'));
    if (reduce) { animated.forEach(function (el) { el.classList.add('in'); el.querySelectorAll('[data-count]').forEach(runCount); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); e.target.querySelectorAll('[data-count]').forEach(runCount); }
        else if (e.target.hasAttribute('data-replay')) {
          e.target.classList.remove('in');
          e.target.querySelectorAll('[data-count]').forEach(function (el) { el.dataset.done = ''; el.textContent = (el.dataset.prefix || '') + '0' + (el.dataset.suffix || ''); });
        }
      });
    }, { threshold: 0.28, rootMargin: '0px 0px -6% 0px' });
    animated.forEach(function (el) { io.observe(el); });
    // Safety net: IntersectionObserver callbacks are suppressed while a document is
    // hidden (background tab, bfcache restore, prerender). If a section is already in
    // view and the observer has not fired, reveal it rather than leave it blank.
    function revealVisible() {
      animated.forEach(function (el) {
        if (el.classList.contains('in')) return;
        var r = el.getBoundingClientRect();
        if (r.top < innerHeight * 0.94 && r.bottom > 0) { el.classList.add('in'); el.querySelectorAll('[data-count]').forEach(runCount); }
      });
    }
    setTimeout(revealVisible, 400);
    window.addEventListener('scroll', revealVisible, { passive: true });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) revealVisible(); });
  }

  /* ---- scroll bar ---- */
  function scrollbar() {
    var bar = document.querySelector('.scroll-bar'); if (!bar) return;
    function on() { var d = document.documentElement; bar.style.transform = 'scaleX(' + (d.scrollTop / (d.scrollHeight - d.clientHeight || 1)) + ')'; }
    var t = false; window.addEventListener('scroll', function () { if (!t) { requestAnimationFrame(function () { on(); t = false; }); t = true; } }, { passive: true }); on();
  }

  /* ---- team bios: a face opens that person's dialog ---- */
  function teamBios() {
    var cards = document.querySelectorAll('.person[data-bio]');
    Array.prototype.forEach.call(cards, function (card) {
      var dlg = document.getElementById(card.getAttribute('data-bio'));
      if (!dlg || !dlg.showModal) return;
      card.addEventListener('click', function () { dlg.showModal(); });
      // clicking the backdrop lands on the dialog itself, not its contents
      dlg.addEventListener('click', function (e) {
        if (e.target === dlg) dlg.close();
      });
      var x = dlg.querySelector('.bio-x');
      if (x) x.addEventListener('click', function () { dlg.close(); });
    });
  }

  buildHeader(); buildFooter(); kmarks(); reveal(); scrollbar(); teamBios();
})();
