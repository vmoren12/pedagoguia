/* Lecturia — catàleg
   Llegeix data/catalog.json i pinta el catàleg: cerca, filtres per etapa,
   estadístiques, tema de color i diàleg d'aportacions (GitHub Issues). */
(function () {
  'use strict';

  var DATA_URL = 'data/catalog.json';
  var NEW_DAYS = 45;
  var THEME_KEY = 'lecturia:theme';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var state = { guides: [], site: null, query: '', stage: null };
  var el = {};

  /* ---------- Utilitats ---------- */
  function normalize(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function joinList(items) {
    if (items.length < 2) return items.join('');
    return items.slice(0, -1).join(', ') + ' i ' + items[items.length - 1];
  }

  function formatIsbn(isbn) {
    var s = String(isbn).replace(/\D/g, '');
    return s.length === 13 ? [s.slice(0, 3), s.slice(3, 5), s.slice(5, 10), s.slice(10, 12), s.slice(12)].join('-') : isbn;
  }

  function formatMonth(iso) {
    try {
      return new Intl.DateTimeFormat('ca', { month: 'long', year: 'numeric' }).format(new Date(iso + 'T00:00:00'));
    } catch (e) { return iso; }
  }

  function isNew(iso) {
    var t = Date.parse(iso + 'T00:00:00');
    return !isNaN(t) && (Date.now() - t) / 864e5 <= NEW_DAYS;
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  /* ---------- Tema ---------- */
  function currentTheme() {
    var set = document.documentElement.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function initTheme() {
    var btn = $('#themeToggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  }

  /* ---------- Capçalera ---------- */
  function initHeader() {
    var header = $('.site-header');
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Aportacions ---------- */
  function issueUrl(kind, guide) {
    var site = state.site || {};
    var repo = site.repo || 'https://github.com/vmoren12/lecturia';
    var templates = site.issueTemplates || {};
    var params = new URLSearchParams();
    if (templates[kind]) params.set('template', templates[kind]);
    if (kind === 'content' && guide) {
      params.set('title', '[Error] ' + guide.title);
      params.set('guia', guide.title + ' (ISBN ' + guide.isbn + ')');
    }
    return repo + '/issues/new?' + params.toString();
  }

  function openFeedback(guide) {
    var dialog = el.dialog;
    var ctx = $('#feedbackContext');
    if (guide) {
      ctx.innerHTML = '';
      ctx.appendChild(document.createTextNode('Guia: '));
      var strong = document.createElement('strong');
      strong.textContent = guide.title;
      ctx.appendChild(strong);
      ctx.hidden = false;
    } else {
      ctx.hidden = true;
    }
    $$('.choice', dialog).forEach(function (a) {
      a.href = issueUrl(a.getAttribute('data-kind'), guide);
    });
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      window.open(issueUrl(guide ? 'content' : 'app', guide), '_blank', 'noopener');
    }
  }

  function initFeedback() {
    el.dialog = $('#feedbackDialog');
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-feedback]');
      if (!trigger) return;
      e.preventDefault();
      var kind = trigger.getAttribute('data-feedback');
      if (kind === 'book') {
        window.open(issueUrl('book'), '_blank', 'noopener');
        return;
      }
      openFeedback(null);
    });
    // Tanca en clicar fora del contingut
    el.dialog.addEventListener('click', function (e) {
      if (e.target === el.dialog) el.dialog.close();
    });
    // Tanca després d'escollir una opció
    el.dialog.addEventListener('click', function (e) {
      if (e.target.closest('.choice')) setTimeout(function () { el.dialog.close(); }, 0);
    });
  }

  /* ---------- Filtres i cerca ---------- */
  function haystack(g) {
    return normalize([
      g.title, g.subtitle, g.authors.join(' '), g.publisher, g.collection, g.area,
      g.stages.join(' '), (g.tags || []).join(' '), g.summary, g.isbn, formatIsbn(g.isbn)
    ].join(' '));
  }

  function matches(g) {
    if (state.stage && g.stages.indexOf(state.stage) === -1) return false;
    var terms = normalize(state.query).split(/\s+/).filter(Boolean);
    return terms.every(function (t) { return g._hay.indexOf(t) !== -1; });
  }

  function renderFilters() {
    var stages = [];
    state.guides.forEach(function (g) {
      g.stages.forEach(function (s) { if (stages.indexOf(s) === -1) stages.push(s); });
    });
    var frag = document.createDocumentFragment();
    [null].concat(stages).forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = s || 'Totes les etapes';
      b.setAttribute('aria-pressed', String(state.stage === s));
      b.addEventListener('click', function () {
        state.stage = s;
        syncUrl();
        update();
      });
      frag.appendChild(b);
    });
    el.filters.innerHTML = '';
    el.filters.appendChild(frag);
  }

  function syncUrl() {
    var params = new URLSearchParams(location.search);
    state.query ? params.set('q', state.query) : params.delete('q');
    state.stage ? params.set('etapa', state.stage) : params.delete('etapa');
    var qs = params.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  }

  /* ---------- Fitxes ---------- */
  function fill(node, slot, value) {
    var target = $('[data-slot="' + slot + '"]', node);
    if (target) target.textContent = value;
    return target;
  }

  function renderBook(g, index) {
    var node = el.template.content.firstElementChild.cloneNode(true);
    node.style.animationDelay = Math.min(index * 60, 360) + 'ms';

    $('[data-slot="link"]', node).href = g.path;
    $('.cover', node).style.setProperty('--c', g.color || '');
    fill(node, 'coverPublisher', g.publisher);
    fill(node, 'coverTitle', g.title);
    fill(node, 'coverAuthors', g.authors.join('\n')).style.whiteSpace = 'pre-line';

    fill(node, 'area', g.area);
    $('[data-slot="new"]', node).hidden = !isNew(g.added);
    var title = fill(node, 'titleLink', g.title);
    title.href = g.path;
    fill(node, 'subtitle', g.subtitle || '');
    fill(node, 'authors', joinList(g.authors));
    fill(node, 'summary', g.summary);

    var hl = $('[data-slot="highlights"]', node);
    (g.highlights || []).forEach(function (h) {
      var li = document.createElement('li');
      li.textContent = h;
      hl.appendChild(li);
    });
    if (!hl.children.length) hl.remove();

    fill(node, 'stages', joinList(g.stages));
    fill(node, 'edition', g.publisher + ', ' + g.year);
    fill(node, 'language', g.language);
    fill(node, 'isbn', formatIsbn(g.isbn));

    var open = $('[data-slot="open"]', node);
    open.href = g.path;
    open.setAttribute('aria-label', 'Obre la guia: ' + g.title);
    var report = $('[data-slot="report"]', node);
    report.setAttribute('aria-label', 'Notifica un error a la guia: ' + g.title);
    report.addEventListener('click', function () { openFeedback(g); });

    return node;
  }

  function update() {
    var list = state.guides.filter(matches);
    var frag = document.createDocumentFragment();
    list.forEach(function (g, i) { frag.appendChild(renderBook(g, i)); });
    el.list.innerHTML = '';
    el.list.appendChild(frag);

    el.empty.hidden = list.length > 0;
    var filtered = state.query || state.stage;
    el.count.textContent = filtered
      ? plural(list.length, 'resultat', 'resultats') + ' de ' + state.guides.length
      : plural(state.guides.length, 'guia publicada', 'guies publicades');

    $$('.chip', el.filters).forEach(function (b, i) {
      var value = i === 0 ? null : b.textContent;
      b.setAttribute('aria-pressed', String(state.stage === value));
    });
  }

  function renderStats() {
    var areas = {};
    var latest = '';
    state.guides.forEach(function (g) {
      areas[g.area] = true;
      var d = g.updated || g.added;
      if (d > latest) latest = d;
    });
    var set = function (k, v) { var n = $('[data-stat="' + k + '"]'); if (n) n.textContent = v; };
    set('guides', state.guides.length);
    set('areas', Object.keys(areas).length);
    set('updated', latest ? formatMonth(latest) : '—');
  }

  /* ---------- Arrencada ---------- */
  function initSearch() {
    var timer;
    el.search.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        state.query = el.search.value.trim();
        syncUrl();
        update();
      }, 120);
    });
    el.search.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && el.search.value) { el.search.value = ''; el.search.dispatchEvent(new Event('input')); }
    });
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (e.key === '/' && tag !== 'input' && tag !== 'textarea' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        el.search.focus();
      }
    });
    $('#clearFilters').addEventListener('click', function () {
      state.query = '';
      state.stage = null;
      el.search.value = '';
      syncUrl();
      update();
      el.search.focus();
    });
  }

  function readUrl() {
    var params = new URLSearchParams(location.search);
    state.query = params.get('q') || '';
    state.stage = params.get('etapa');
    el.search.value = state.query;
  }

  // Enllaços externs com ?avis=error&isbn=… (p. ex. des d'una guia) obren el diàleg
  function handleDeepLink() {
    var params = new URLSearchParams(location.search);
    if (!params.has('avis')) return;
    var isbn = params.get('isbn');
    var guide = state.guides.filter(function (g) { return g.isbn === isbn; })[0] || null;
    params.delete('avis');
    params.delete('isbn');
    var qs = params.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    openFeedback(guide);
  }

  function showError() {
    el.count.textContent = '';
    el.list.innerHTML = '';
    el.empty.hidden = false;
    $('.empty-title', el.empty).textContent = 'No s’ha pogut carregar el catàleg.';
    $('p:last-child', el.empty).textContent = 'Torna-ho a provar d’aquí a una estona.';
  }

  function init() {
    el.list = $('#bookList');
    el.template = $('#bookTemplate');
    el.filters = $('#filters');
    el.search = $('#search');
    el.count = $('#resultCount');
    el.empty = $('#emptyState');

    initTheme();
    initHeader();
    initFeedback();
    initSearch();
    readUrl();

    fetch(DATA_URL)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        state.site = data.site || null;
        state.guides = (data.guides || [])
          .map(function (g) { g._hay = haystack(g); return g; })
          .sort(function (a, b) { return (b.added || '').localeCompare(a.added || ''); });
        if (state.stage && !state.guides.some(function (g) { return g.stages.indexOf(state.stage) !== -1; })) state.stage = null;
        renderStats();
        renderFilters();
        update();
        handleDeepLink();
      })
      .catch(showError);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
