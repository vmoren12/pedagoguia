/* Pedagoguia — catàleg
   Llegeix data/catalog.json i pinta el catàleg: cerca, filtres per facetes,
   ordenació, tres vistes (fitxes, graella, llista), tema de color i diàleg
   d'aportacions (GitHub Issues). L'estat es reflecteix a l'URL. */
(function () {
  'use strict';

  var DATA_URL = 'data/catalog.json';
  var NEW_DAYS = 45;
  var TAG_LIMIT = 8;
  var KEYS = { theme: 'pedagoguia:theme', view: 'pedagoguia:view' };
  var VIEWS = ['fitxes', 'graella', 'llista'];
  var STAGE_ORDER = ['Infantil', 'Primària', 'Secundària', 'Batxillerat i FP', 'Transversal'];

  /* Facetes de filtre: valors dins d'un grup es combinen amb O; grups entre si, amb I. */
  var FACETS = [
    { key: 'stage', param: 'etapa', label: 'Etapa', get: function (g) { return g.stages || []; }, order: STAGE_ORDER },
    { key: 'topic', param: 'tematica', label: 'Temàtica', get: function (g) { return g.topics || []; } },
    { key: 'tag', param: 'etiqueta', label: 'Etiquetes', get: function (g) { return g.tags || []; }, limit: TAG_LIMIT },
    { key: 'language', param: 'idioma', label: 'Idioma de la guia', get: function (g) { return g.language ? [g.language] : []; } }
  ];

  var SORTS = {
    recent: function (a, b) { return (b.added || '').localeCompare(a.added || '') || collator.compare(a.title, b.title); },
    title: function (a, b) { return collator.compare(a.title, b.title); },
    year: function (a, b) { return (b.year || 0) - (a.year || 0) || collator.compare(a.title, b.title); }
  };

  var collator = new Intl.Collator('ca', { sensitivity: 'base' });
  var state = { guides: [], site: null, query: '', sort: 'recent', view: null, selected: {}, expanded: {} };
  var el = {};

  FACETS.forEach(function (f) { state.selected[f.key] = []; });

  /* ---------- Utilitats ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* Crea elements: h('a.btn', { href: '#' }, ['text', node]) */
  function h(spec, attrs, children) {
    var parts = spec.split('.');
    var node = document.createElement(parts[0] || 'div');
    if (parts.length > 1) node.className = parts.slice(1).join(' ');
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') node.textContent = v;
      else if (k === 'style') node.style.cssText = v;
      else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    });
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function icon(paths) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(ns, 'path');
    p.setAttribute('d', paths);
    svg.appendChild(p);
    return svg;
  }
  var ICON_FLAG = 'M5 21V4M5 4h12l-2.5 4.5L17 13H5';
  var ICON_X = 'M7 7l10 10M17 7 7 17';

  function normalize(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function joinList(items) {
    if (items.length < 2) return items.join('');
    return items.slice(0, -1).join(', ') + ' i ' + items[items.length - 1];
  }
  function shortAuthors(authors) {
    return authors.length > 2 ? authors[0] + ' et al.' : joinList(authors);
  }
  function formatIsbn(isbn) {
    var s = String(isbn).replace(/\D/g, '');
    return s.length === 13 ? [s.slice(0, 3), s.slice(3, 5), s.slice(5, 10), s.slice(10, 12), s.slice(12)].join('-') : isbn;
  }
  function formatMonth(iso) {
    try { return new Intl.DateTimeFormat('ca', { month: 'long', year: 'numeric' }).format(new Date(iso + 'T00:00:00')); }
    catch (e) { return iso; }
  }
  function isNew(iso) {
    var t = Date.parse(iso + 'T00:00:00');
    return !isNaN(t) && (Date.now() - t) / 864e5 <= NEW_DAYS;
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  /* ---------- Tema ---------- */
  function currentTheme() {
    var set = document.documentElement.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function initTheme() {
    $('#themeToggle').addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      store(KEYS.theme, next);
    });
  }

  /* ---------- Capçalera ---------- */
  function initHeader() {
    var header = $('.site-header');
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 4); };
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
    var ctx = $('#feedbackContext');
    ctx.textContent = '';
    if (guide) ctx.append('Guia: ', h('strong', { text: guide.title }));
    ctx.hidden = !guide;
    $$('.choice', el.dialog).forEach(function (a) { a.href = issueUrl(a.getAttribute('data-kind'), guide); });
    if (typeof el.dialog.showModal === 'function') el.dialog.showModal();
    else window.open(issueUrl(guide ? 'content' : 'app', guide), '_blank', 'noopener');
  }

  function initFeedback() {
    el.dialog = $('#feedbackDialog');
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-feedback]');
      if (!trigger) return;
      e.preventDefault();
      if (trigger.getAttribute('data-feedback') === 'book') window.open(issueUrl('book'), '_blank', 'noopener');
      else openFeedback(null);
    });
    el.dialog.addEventListener('click', function (e) {
      if (e.target === el.dialog) el.dialog.close();
      else if (e.target.closest('.choice')) setTimeout(function () { el.dialog.close(); }, 0);
    });
  }

  /* ---------- Cerca i filtres ---------- */
  function haystack(g) {
    return normalize([
      g.title, g.subtitle, (g.authors || []).join(' '), g.publisher, g.collection, g.year,
      (g.topics || []).join(' '), (g.stages || []).join(' '), (g.tags || []).join(' '),
      g.language, g.summary, g.isbn, formatIsbn(g.isbn)
    ].join(' '));
  }

  function matchesQuery(g) {
    var terms = normalize(state.query).split(/\s+/).filter(Boolean);
    return terms.every(function (t) { return g._hay.indexOf(t) !== -1; });
  }

  function matchesFacets(g, skipKey) {
    return FACETS.every(function (f) {
      var sel = state.selected[f.key];
      if (f.key === skipKey || !sel.length) return true;
      var values = f.get(g);
      return sel.some(function (v) { return values.indexOf(v) !== -1; });
    });
  }

  function activeCount() {
    return FACETS.reduce(function (n, f) { return n + state.selected[f.key].length; }, 0);
  }

  function toggleValue(key, value) {
    var list = state.selected[key];
    var i = list.indexOf(value);
    if (i === -1) list.push(value); else list.splice(i, 1);
    commit();
  }

  function clearAll() {
    FACETS.forEach(function (f) { state.selected[f.key] = []; });
    state.query = '';
    el.search.value = '';
    commit();
  }

  /* Opcions de cada faceta amb el recompte segons la resta de filtres actius */
  function facetOptions(f) {
    var base = state.guides.filter(function (g) { return matchesQuery(g) && matchesFacets(g, f.key); });
    var totals = {};
    var counts = {};
    state.guides.forEach(function (g) { f.get(g).forEach(function (v) { totals[v] = true; }); });
    base.forEach(function (g) { f.get(g).forEach(function (v) { counts[v] = (counts[v] || 0) + 1; }); });
    var values = Object.keys(totals);
    if (f.order) {
      values.sort(function (a, b) {
        var ia = f.order.indexOf(a), ib = f.order.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || collator.compare(a, b);
      });
    } else {
      values.sort(function (a, b) { return (counts[b] || 0) - (counts[a] || 0) || collator.compare(a, b); });
    }
    return values.map(function (v) { return { value: v, count: counts[v] || 0 }; });
  }

  function renderFacets() {
    var focusedId = document.activeElement && document.activeElement.id;
    var frag = document.createDocumentFragment();

    FACETS.forEach(function (f) {
      var options = facetOptions(f);
      var selected = state.selected[f.key];
      var expanded = state.expanded[f.key];
      var visible = f.limit && !expanded ? options.slice(0, f.limit) : options;
      // Mantén visibles les opcions seleccionades encara que quedin fora del límit
      options.forEach(function (o) { if (selected.indexOf(o.value) !== -1 && visible.indexOf(o) === -1) visible.push(o); });

      var list = h('ul.facet-list', {}, visible.map(function (o) {
        var id = 'f-' + f.key + '-' + normalize(o.value).replace(/[^a-z0-9]+/g, '-');
        var checked = selected.indexOf(o.value) !== -1;
        return h('li', {}, [
          h('input.visually-hidden', {
            type: 'checkbox', id: id, checked: checked, disabled: !checked && !o.count,
            onchange: function () { toggleValue(f.key, o.value); }
          }),
          h('label.check', { for: id }, [
            h('span.check-box', { 'aria-hidden': 'true' }),
            h('span.check-label', { text: o.value }),
            h('span.check-count', { text: String(o.count) })
          ])
        ]);
      }));

      var group = h('fieldset.facet', {}, [
        h('legend', { text: f.label }),
        options.length ? list : h('p.facet-empty', { text: 'Encara no hi ha opcions.' }),
        f.limit && options.length > f.limit ? h('button.facet-more', {
          type: 'button',
          text: expanded ? 'Mostra’n menys' : 'Mostra’n ' + (options.length - f.limit) + ' més',
          onclick: function () { state.expanded[f.key] = !expanded; renderFacets(); }
        }) : null
      ]);
      frag.appendChild(group);
    });

    el.facets.textContent = '';
    el.facets.appendChild(frag);
    if (focusedId && document.getElementById(focusedId)) document.getElementById(focusedId).focus();
  }

  function renderActiveFilters() {
    var chips = [];
    FACETS.forEach(function (f) {
      state.selected[f.key].forEach(function (v) {
        chips.push(h('button.active-chip', {
          type: 'button', 'aria-label': 'Treu el filtre ' + f.label + ': ' + v,
          onclick: function () { toggleValue(f.key, v); }
        }, [h('span.active-chip-key', { text: f.label }), v, icon(ICON_X)]));
      });
    });
    el.active.textContent = '';
    el.active.hidden = !chips.length;
    if (!chips.length) return;
    chips.forEach(function (c) { el.active.appendChild(c); });
    el.active.appendChild(h('button.link-btn', { type: 'button', text: 'Esborra-ho tot', onclick: clearAll }));
  }

  /* ---------- Portades ---------- */
  function coverFront(g) {
    var typo = h('span.cover-typo', { style: '--c:' + (g.color || '#2f5d50') }, [
      h('span.cover-typo-pub', { text: g.publisher }),
      h('span.cover-typo-title', { text: g.title }),
      h('span.cover-typo-authors', { text: shortAuthors(g.authors) })
    ]);
    if (!g.cover) return typo;
    var img = h('img', { src: g.cover, alt: '', loading: 'lazy', decoding: 'async', width: '385', height: '588' });
    img.addEventListener('error', function () { img.replaceWith(typo); });
    return img;
  }

  /* Llibre en 3D: coberta, llom i tall de les pàgines */
  function book3d(g, index) {
    var spineStyle = g.cover ? '--spine-img:url("' + g.cover + '")' : '--spine-img:none;--spine-c:' + (g.color || '#2f5d50');
    return h('span.book3d', { 'aria-hidden': 'true', style: '--i:' + index }, [
      h('span.book3d-body', {}, [
        h('span.book3d-back'),
        h('span.book3d-pages'),
        h('span.book3d-spine', { style: spineStyle }),
        h('span.book3d-front', {}, [coverFront(g)])
      ])
    ]);
  }

  /* ---------- Vistes ---------- */
  function badgeNew(g) { return isNew(g.added) ? h('span.badge', { text: 'Nova' }) : null; }
  function topicLabel(g) { return (g.topics || [])[0] || ''; }

  function viewFitxes(g, i) {
    return h('li.book.book-card', { style: '--i:' + i }, [
      h('a.book-cover', { href: g.path, tabindex: '-1', 'aria-hidden': 'true' }, [book3d(g, i)]),
      h('div.book-body', {}, [
        h('div.book-meta', {}, [
          h('span', { text: topicLabel(g) }),
          badgeNew(g),
          h('button.report-btn', {
            type: 'button', title: 'Notifica un error en aquesta guia',
            'aria-label': 'Notifica un error a la guia: ' + g.title,
            onclick: function () { openFeedback(g); }
          }, [icon(ICON_FLAG)])
        ]),
        h('h3.book-title', {}, [h('a', { href: g.path, text: g.title })]),
        g.subtitle ? h('p.book-subtitle', { text: g.subtitle }) : null,
        h('p.book-authors', { text: joinList(g.authors) }),
        h('p.book-summary', { text: g.summary }),
        (g.tags || []).length ? h('ul.tag-list', {}, g.tags.map(function (t) {
          var on = state.selected.tag.indexOf(t) !== -1;
          return h('li', {}, [h('button.tag', {
            type: 'button', 'aria-pressed': String(on), title: 'Filtra per aquesta etiqueta',
            text: t, onclick: function () { toggleValue('tag', t); }
          })]);
        })) : null,
        h('dl.book-facts', {}, [
          fact('Etapa', joinList(g.stages || [])),
          fact('Edició', g.publisher + ', ' + g.year),
          fact('Idioma de la guia', g.language),
          fact('ISBN', formatIsbn(g.isbn), 'mono')
        ])
      ])
    ]);
  }

  function fact(label, value, cls) {
    return h('div', {}, [h('dt', { text: label }), h('dd' + (cls ? '.' + cls : ''), { text: value })]);
  }

  function viewGraella(g, i) {
    return h('li.book.book-tile', { style: '--i:' + i }, [
      h('a.tile-link', { href: g.path }, [
        book3d(g, i),
        h('span.tile-text', {}, [
          h('span.tile-meta', {}, [topicLabel(g), badgeNew(g)]),
          h('span.tile-title', { text: g.title }),
          h('span.tile-authors', { text: shortAuthors(g.authors) + ' · ' + g.year })
        ])
      ])
    ]);
  }

  function viewLlista(g, i) {
    return h('li.book.book-row', { style: '--i:' + i }, [
      h('a.row-link', { href: g.path }, [
        h('span.row-thumb', { 'aria-hidden': 'true' }, [coverFront(g)]),
        h('span.row-main', {}, [
          h('span.row-title', {}, [g.title, badgeNew(g)]),
          h('span.row-authors', { text: joinList(g.authors) })
        ]),
        h('span.row-col.row-topic', { text: topicLabel(g) }),
        h('span.row-col.row-stage', { text: (g.stages || []).join(', ') }),
        h('span.row-col.row-year', { text: g.publisher + ' · ' + g.year }),
        h('span.row-col.row-lang', { text: g.language })
      ])
    ]);
  }

  var RENDERERS = { fitxes: viewFitxes, graella: viewGraella, llista: viewLlista };

  /* ---------- Render principal ---------- */
  function renderResults() {
    var list = state.guides
      .filter(function (g) { return matchesQuery(g) && matchesFacets(g); })
      .sort(SORTS[state.sort] || SORTS.recent);

    var frag = document.createDocumentFragment();
    if (state.view === 'llista' && list.length) {
      frag.appendChild(h('li.row-head', { 'aria-hidden': 'true' }, [
        h('span', { text: 'Llibre' }), h('span', { text: 'Temàtica' }), h('span', { text: 'Etapa' }),
        h('span', { text: 'Edició' }), h('span', { text: 'Idioma' })
      ]));
    }
    list.forEach(function (g, i) { frag.appendChild(RENDERERS[state.view](g, i)); });
    el.books.setAttribute('data-view', state.view);
    el.books.textContent = '';
    el.books.appendChild(frag);

    el.empty.hidden = list.length > 0;
    var filtered = state.query || activeCount();
    el.count.textContent = filtered
      ? plural(list.length, 'resultat', 'resultats') + ' de ' + state.guides.length
      : plural(state.guides.length, 'guia', 'guies');
  }

  function renderControls() {
    $$('[data-view]', el.viewSwitch).forEach(function (b) {
      b.setAttribute('aria-checked', String(b.getAttribute('data-view') === state.view));
      b.tabIndex = b.getAttribute('data-view') === state.view ? 0 : -1;
    });
    el.sort.value = state.sort;
    var n = activeCount();
    el.filtersCount.hidden = !n;
    el.filtersCount.textContent = n ? String(n) : '';
  }

  function render() {
    renderFacets();
    renderActiveFilters();
    renderResults();
    renderControls();
  }

  function commit() {
    syncUrl();
    render();
  }

  /* ---------- URL ---------- */
  function syncUrl() {
    var params = new URLSearchParams();
    if (state.query) params.set('q', state.query);
    FACETS.forEach(function (f) { if (state.selected[f.key].length) params.set(f.param, state.selected[f.key].join('|')); });
    if (state.sort !== 'recent') params.set('ordre', state.sort);
    if (state.view !== defaultView()) params.set('vista', state.view);
    var qs = params.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  }

  function readUrl() {
    var params = new URLSearchParams(location.search);
    state.query = params.get('q') || '';
    FACETS.forEach(function (f) {
      var v = params.get(f.param);
      state.selected[f.key] = v ? v.split('|').filter(Boolean) : [];
    });
    if (SORTS[params.get('ordre')]) state.sort = params.get('ordre');
    var view = params.get('vista');
    if (VIEWS.indexOf(view) !== -1) state.view = view;
    el.search.value = state.query;
  }

  /* Amb pocs llibres, fitxes; amb molts, graella. La tria de l'usuari es recorda. */
  function defaultView() {
    var saved = store(KEYS.view);
    if (VIEWS.indexOf(saved) !== -1) return saved;
    return state.guides.length > 6 ? 'graella' : 'fitxes';
  }

  /* Enllaços com ?avis=error&isbn=… (p. ex. des d'una guia) obren el diàleg */
  function handleDeepLink() {
    var params = new URLSearchParams(location.search);
    if (!params.has('avis')) return;
    var isbn = params.get('isbn');
    var guide = state.guides.filter(function (g) { return g.isbn === isbn; })[0] || null;
    syncUrl();
    openFeedback(guide);
  }

  /* ---------- Controls ---------- */
  function initControls() {
    var timer;
    el.search.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { state.query = el.search.value.trim(); commit(); }, 120);
    });
    el.search.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && el.search.value) { el.search.value = ''; state.query = ''; commit(); }
    });
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (e.key === '/' && tag !== 'input' && tag !== 'textarea' && tag !== 'select' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        el.search.focus();
      }
    });

    el.sort.addEventListener('change', function () { state.sort = el.sort.value; commit(); });

    el.viewSwitch.addEventListener('click', function (e) {
      var b = e.target.closest('[data-view]');
      if (!b) return;
      state.view = b.getAttribute('data-view');
      store(KEYS.view, state.view);
      commit();
    });
    el.viewSwitch.addEventListener('keydown', function (e) {
      var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      state.view = VIEWS[(VIEWS.indexOf(state.view) + step + VIEWS.length) % VIEWS.length];
      store(KEYS.view, state.view);
      commit();
      $('[data-view="' + state.view + '"]', el.viewSwitch).focus();
    });

    el.filtersToggle.addEventListener('click', function () {
      var open = el.facets.classList.toggle('is-open');
      el.filtersToggle.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-clear]')) { clearAll(); el.search.focus(); }
    });
  }

  function showError() {
    el.count.textContent = '';
    el.books.textContent = '';
    el.empty.hidden = false;
    $('.empty-title', el.empty).textContent = 'No s’ha pogut carregar el catàleg.';
    $('p:last-child', el.empty).textContent = 'Torna-ho a provar d’aquí a una estona.';
  }

  function init() {
    el.books = $('#books');
    el.facets = $('#facets');
    el.active = $('#activeFilters');
    el.search = $('#search');
    el.count = $('#resultCount');
    el.empty = $('#emptyState');
    el.sort = $('#sort');
    el.viewSwitch = $('#viewSwitch');
    el.filtersToggle = $('#filtersToggle');
    el.filtersCount = $('#filtersCount');

    if (window.matchMedia && window.matchMedia('(max-width: 640px)').matches) el.search.placeholder = 'Cerca al catàleg';

    initTheme();
    initHeader();
    initFeedback();
    initControls();
    readUrl();

    fetch(DATA_URL)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        state.site = data.site || null;
        state.guides = (data.guides || []).map(function (g) { g._hay = haystack(g); return g; });
        if (!state.view) state.view = defaultView();

        var latest = state.guides.reduce(function (m, g) { var d = g.updated || g.added || ''; return d > m ? d : m; }, '');
        $('#introMeta').textContent = plural(state.guides.length, 'guia publicada', 'guies publicades') +
          (latest ? ' · Actualitzat el ' + formatMonth(latest) : '');

        render();
        handleDeepLink();
      })
      .catch(showError);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
