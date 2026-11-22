/* ==========================================================================
   Pedagoguia — subratllats i notes
   - A les guies (<meta name="pg-guide" content="ISBN">): seleccionar text per
     subratllar-lo en colors, afegir-hi comentaris i etiquetes.
   - A qualsevol pàgina: visor de totes les notes (botons [data-pg-notes]),
     amb cerca, filtres i importació/exportació global.
   Les notes es desen al navegador (localStorage), en un únic magatzem per a
   totes les guies. Cada subratllat s'ancora pel text citat i el seu context,
   de manera que sobreviu a canvis menors de maquetació.
   ========================================================================== */
(function () {
  'use strict';

  var KEY = 'pedagoguia:notes';
  var TIP_KEY = 'pedagoguia:notes-tip';
  var CONTEXT = 32;
  var SKIP = 'script, style, textarea, input, select, button, svg, .tool, [data-pg-skip], .pg-ui';

  var script = document.currentScript;
  var ROOT = new URL('../../', script && script.src ? script.src : location.href).href;

  /* ---------- Textos (català / castellà segons la pàgina) ---------- */
  var I18N = {
    ca: {
      notes: 'Notes', myNotes: 'Les meves notes', thisGuide: 'Aquesta guia', allGuides: 'Totes les guies',
      search: 'Cerca a les notes', color: 'Color', tags: 'Etiquetes',
      commentPh: 'Afegeix un comentari…', tagPh: 'Etiqueta i Retorn', highlightIn: 'Subratlla en',
      highlightComment: 'Subratlla i comenta', del: 'Elimina el subratllat', deleted: 'Nota eliminada',
      undo: 'Desfés', done: 'Fet', close: 'Tanca', exportJson: 'Exporta', importJson: 'Importa', exportMd: 'Markdown',
      exportTitle: 'Desa una còpia de totes les notes, de totes les guies (JSON)',
      importTitle: 'Recupera o fusiona notes des d’una còpia (JSON)',
      mdTitle: 'Descarrega les notes en Markdown per llegir-les o compartir-les',
      imported: function (a, u) { return 'Importades: ' + a + ' noves i ' + u + ' actualitzades.'; },
      importError: 'El fitxer no és una còpia de notes de Pedagoguia.',
      empty: 'Encara no hi ha notes', emptyHint: 'Selecciona qualsevol text d’una guia per subratllar-lo, comentar-lo o etiquetar-lo.',
      emptyFilter: 'Cap nota coincideix amb els filtres.',
      orphan: 'No localitzada', orphanTitle: 'El text original ja no es troba a la guia',
      tip: 'Selecciona text per subratllar-lo o afegir-hi una nota.',
      storageError: 'No s’han pogut desar les notes en aquest navegador.',
      privacy: 'Les notes es desen només en aquest navegador. Exporta-les per fer-ne una còpia o passar-les a un altre dispositiu.',
      noSection: 'Introducció', openNote: 'Ves a la nota', editNote: 'Edita la nota',
      count: function (n) { return n === 1 ? '1 nota' : n + ' notes'; },
      colors: { y: 'groc', p: 'rosa', g: 'verd', b: 'blau', v: 'lila' },
      version: { ca: 'versió catalana', es: 'versió castellana' }
    },
    es: {
      notes: 'Notas', myNotes: 'Mis notas', thisGuide: 'Esta guía', allGuides: 'Todas las guías',
      search: 'Buscar en las notas', color: 'Color', tags: 'Etiquetas',
      commentPh: 'Añade un comentario…', tagPh: 'Etiqueta e Intro', highlightIn: 'Subrayar en',
      highlightComment: 'Subrayar y comentar', del: 'Eliminar el subrayado', deleted: 'Nota eliminada',
      undo: 'Deshacer', done: 'Hecho', close: 'Cerrar', exportJson: 'Exportar', importJson: 'Importar', exportMd: 'Markdown',
      exportTitle: 'Guarda una copia de todas las notas, de todas las guías (JSON)',
      importTitle: 'Recupera o fusiona notas desde una copia (JSON)',
      mdTitle: 'Descarga las notas en Markdown para leerlas o compartirlas',
      imported: function (a, u) { return 'Importadas: ' + a + ' nuevas y ' + u + ' actualizadas.'; },
      importError: 'El archivo no es una copia de notas de Pedagoguia.',
      empty: 'Aún no hay notas', emptyHint: 'Selecciona cualquier texto de una guía para subrayarlo, comentarlo o etiquetarlo.',
      emptyFilter: 'Ninguna nota coincide con los filtros.',
      orphan: 'No localizada', orphanTitle: 'El texto original ya no está en la guía',
      tip: 'Selecciona texto para subrayarlo o añadir una nota.',
      storageError: 'No se han podido guardar las notas en este navegador.',
      privacy: 'Las notas se guardan solo en este navegador. Expórtalas para hacer una copia o pasarlas a otro dispositivo.',
      noSection: 'Introducción', openNote: 'Ir a la nota', editNote: 'Editar la nota',
      count: function (n) { return n === 1 ? '1 nota' : n + ' notas'; },
      colors: { y: 'amarillo', p: 'rosa', g: 'verde', b: 'azul', v: 'lila' },
      version: { ca: 'versión catalana', es: 'versión castellana' }
    }
  };
  function currentLang() { return (document.documentElement.lang || 'ca').slice(0, 2) === 'es' ? 'es' : 'ca'; }
  var LANG = currentLang();
  var T = I18N[LANG];
  var COLORS = ['y', 'p', 'g', 'b', 'v'];

  var ICONS = {
    note: 'M5 4.5h10l4 4V19.5H5zM15 4.5V9h4M8.5 13h7M8.5 16h4.5',
    trash: 'M5 7h14M10 7V5h4v2M7 7l1 12.5h8L17 7',
    x: 'M7 7l10 10M17 7 7 17',
    search: 'M11 4.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM20 20l-4.2-4.2'
  };

  /* ---------- Guia actual ----------
     Cada guia té dues versions: guies/ISBN/ (català) i guies/ISBN/es/ (castellà).
     Un subratllat s'ancora al text d'una versió concreta, per això cada nota
     recorda la llengua on es va fer (lang). */
  function guidePath(isbn, lang) { return 'guies/' + isbn + '/' + (lang === 'es' ? 'es/' : ''); }

  /* Notes d'abans de les guies bilingües: no porten lang i es van fer sobre
     l'única versió que hi havia (en castellà, excepte la guia de Kirschner). */
  var LEGACY_LANG = { '9788446056805': 'ca' };
  function migrate(n) {
    if (n && !n.deleted && typeof n.guide === 'string' && !n.lang) {
      n.lang = LEGACY_LANG[n.guide] || 'es';
      n.path = guidePath(n.guide, n.lang);
    }
    return n;
  }

  var guideMeta = document.querySelector('meta[name="pg-guide"]');
  var GUIDE = null;
  if (guideMeta) {
    var titleMeta = document.querySelector('meta[name="pg-guide-title"]');
    var h1 = document.querySelector('h1');
    GUIDE = {
      isbn: guideMeta.content,
      lang: LANG,
      title: titleMeta ? titleMeta.content : (h1 ? h1.textContent.trim() : document.title),
      path: guidePath(guideMeta.content, LANG)
    };
  }
  function isHere(n) { return !!GUIDE && n.guide === GUIDE.isbn && n.lang === GUIDE.lang; }
  var container = null;

  /* ---------- Utilitats ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function h(spec, attrs, children) {
    var parts = spec.split('.');
    var node = document.createElement(parts[0] || 'div');
    if (parts.length > 1) node.className = parts.slice(1).join(' ');
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') node.textContent = v;
      else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    });
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }
  function icon(name) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(ns, 'path');
    p.setAttribute('d', ICONS[name]);
    svg.appendChild(p);
    return svg;
  }
  function now() { return new Date().toISOString(); }
  function uid() { return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function debounce(fn, ms) { var t; return function () { var a = arguments; clearTimeout(t); t = setTimeout(function () { fn.apply(null, a); }, ms); }; }
  function fmtDate(iso) {
    try { return new Intl.DateTimeFormat(LANG, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso)); }
    catch (e) { return iso.slice(0, 10); }
  }
  function cleanTag(s) { return String(s).trim().replace(/^#/, '').replace(/\s+/g, ' ').toLowerCase().slice(0, 40); }

  /* ---------- Magatzem ---------- */
  function blank() { return { app: 'pedagoguia', version: 1, notes: {} }; }
  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY));
      if (d && d.notes && typeof d.notes === 'object') {
        Object.keys(d.notes).forEach(function (k) { migrate(d.notes[k]); });
        return d;
      }
    } catch (e) {}
    return blank();
  }
  var db = load();
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function emit() { listeners.forEach(function (fn) { fn(); }); }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { toast(T.storageError); }
    emit();
  }
  function live() { return Object.keys(db.notes).map(function (k) { return db.notes[k]; }).filter(function (n) { return n && !n.deleted; }); }
  function get(id) { var n = db.notes[id]; return n && !n.deleted ? n : null; }
  function put(n) { n.updated = now(); db.notes[n.id] = n; persist(); }
  function drop(id) { db.notes[id] = { id: id, deleted: true, updated: now() }; persist(); }

  window.addEventListener('storage', function (e) {
    if (e.key !== KEY) return;
    db = load();
    if (container) repaint();
    emit();
  });

  /* ---------- Índex de text del contingut ---------- */
  function buildIndex() {
    var nodes = [], starts = [], parts = [], pos = 0;
    var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.data) return NodeFilter.FILTER_REJECT;
        var p = n.parentElement;
        return p && !p.closest(SKIP) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var n;
    while ((n = walker.nextNode())) { nodes.push(n); starts.push(pos); parts.push(n.data); pos += n.data.length; }
    return { nodes: nodes, starts: starts, text: parts.join('') };
  }

  function offsetOf(node, offset, idx) {
    if (node.nodeType === 3) {
      var k = idx.nodes.indexOf(node);
      if (k !== -1) return idx.starts[k] + Math.min(offset, node.data.length);
    }
    var r = document.createRange();
    try { r.setStart(node, offset); } catch (e) { return 0; }
    for (var i = 0; i < idx.nodes.length; i++) {
      if (r.comparePoint(idx.nodes[i], 0) >= 0) return idx.starts[i];
    }
    return idx.text.length;
  }

  function commonSuffix(a, b) { var i = 0; while (i < a.length && i < b.length && a[a.length - 1 - i] === b[b.length - 1 - i]) i++; return i; }
  function commonPrefix(a, b) { var i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; }

  /* Troba on és el text citat, desempatant pel context i la posició original */
  function locate(note, idx) {
    var text = idx.text, q = note.quote;
    if (!q) return -1;
    var best = -1, bestScore = -Infinity, from = 0, i;
    while ((i = text.indexOf(q, from)) !== -1) {
      var score = commonSuffix(text.slice(Math.max(0, i - CONTEXT), i), note.prefix || '') +
        commonPrefix(text.slice(i + q.length, i + q.length + CONTEXT), note.suffix || '') -
        Math.abs(i - (note.pos || 0)) / 1e6;
      if (score > bestScore) { bestScore = score; best = i; }
      from = i + 1;
    }
    return best;
  }

  /* ---------- Marques al document ---------- */
  var orphans = {};

  function paint(note, idx, start) {
    if (start === undefined) start = locate(note, idx);
    if (start < 0) { orphans[note.id] = true; return false; }
    delete orphans[note.id];
    var end = start + note.quote.length, segs = [];
    for (var i = 0; i < idx.nodes.length; i++) {
      var ns = idx.starts[i], ne = ns + idx.nodes[i].data.length;
      if (ne <= start) continue;
      if (ns >= end) break;
      segs.push({ node: idx.nodes[i], from: Math.max(start, ns) - ns, to: Math.min(end, ne) - ns });
    }
    segs.forEach(function (s) {
      var t = s.node;
      if (!/\S/.test(t.data.slice(s.from, s.to))) return; // salts de línia entre blocs
      if (s.to < t.data.length) t.splitText(s.to);
      if (s.from > 0) t = t.splitText(s.from);
      var m = document.createElement('mark');
      m.className = 'pg-hl';
      m.setAttribute('data-id', note.id);
      decorate(m, note);
      t.parentNode.insertBefore(m, t);
      m.appendChild(t);
    });
    return true;
  }

  function decorate(m, note) {
    m.setAttribute('data-c', note.color);
    m.classList.toggle('has-note', !!(note.comment || (note.tags && note.tags.length)));
    var label = (note.comment ? note.comment : '') + (note.tags && note.tags.length ? (note.comment ? ' · ' : '') + '#' + note.tags.join(' #') : '');
    if (label) m.setAttribute('title', label); else m.removeAttribute('title');
  }

  function marksOf(id) { return $$('mark.pg-hl[data-id="' + id + '"]', container); }

  function unpaint(id) {
    marksOf(id).forEach(function (m) {
      var p = m.parentNode;
      while (m.firstChild) p.insertBefore(m.firstChild, m);
      p.removeChild(m);
      p.normalize();
    });
  }

  function repaint() {
    $$('mark.pg-hl', container).forEach(function (m) { unpaint(m.getAttribute('data-id')); });
    orphans = {};
    guideNotes().sort(function (a, b) { return (a.pos || 0) - (b.pos || 0); }).forEach(function (n) { paint(n, buildIndex()); });
  }

  function guideNotes() { return live().filter(isHere); }

  function sectionOf(node) {
    var el = node.nodeType === 1 ? node : node.parentElement;
    var sec = el && el.closest('section[id]');
    if (!sec) return { id: '', title: '' };
    var head = sec.querySelector('h2');
    return { id: sec.id, title: head ? head.textContent.replace(/\s+/g, ' ').trim() : '' };
  }

  /* ---------- Crear un subratllat ---------- */
  function createFromRange(range, color, openEditor) {
    var idx = buildIndex();
    var s = offsetOf(range.startContainer, range.startOffset, idx);
    var e = offsetOf(range.endContainer, range.endOffset, idx);
    var text = idx.text;
    while (s < e && /\s/.test(text[s])) s++;
    while (e > s && /\s/.test(text[e - 1])) e--;
    if (e <= s) return;
    var k = 0;
    while (k < idx.nodes.length - 1 && idx.starts[k + 1] <= s) k++;
    var sec = sectionOf(idx.nodes[k]);
    var note = {
      id: uid(), guide: GUIDE.isbn, lang: GUIDE.lang, guideTitle: GUIDE.title, path: GUIDE.path,
      color: color, quote: text.slice(s, e),
      prefix: text.slice(Math.max(0, s - CONTEXT), s), suffix: text.slice(e, e + CONTEXT), pos: s,
      section: sec.id, sectionTitle: sec.title, comment: '', tags: [], created: now()
    };
    paint(note, idx, s);
    put(note);
    var sel = window.getSelection();
    if (sel) sel.removeAllRanges();
    hideToolbar();
    if (openEditor) openEditor_(note.id);
  }

  /* ---------- Barra flotant ---------- */
  var toolbar = null, pendingRange = null;
  var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  function buildToolbar() {
    toolbar = h('div.pg-toolbar.pg-ui', { role: 'toolbar', 'aria-label': T.highlightIn });
    COLORS.forEach(function (c) {
      toolbar.appendChild(h('button.pg-dot', {
        type: 'button', 'data-c': c, title: T.highlightIn + ' ' + T.colors[c], 'aria-label': T.highlightIn + ' ' + T.colors[c],
        onclick: function () { if (pendingRange) createFromRange(pendingRange, c, false); }
      }));
    });
    toolbar.appendChild(h('span.pg-sep'));
    toolbar.appendChild(h('button.pg-icon', {
      type: 'button', title: T.highlightComment, 'aria-label': T.highlightComment,
      onclick: function () { if (pendingRange) createFromRange(pendingRange, 'y', true); }
    }, [icon('note')]));
    // Conserva la selecció en prémer els botons
    toolbar.addEventListener('mousedown', function (e) { e.preventDefault(); });
    toolbar.hidden = true;
    document.body.appendChild(toolbar);
  }

  function hideToolbar() { if (toolbar) toolbar.hidden = true; pendingRange = null; }

  function showToolbar(range) {
    pendingRange = range.cloneRange();
    toolbar.hidden = false;
    var rects = range.getClientRects();
    var r = rects.length ? (coarse ? rects[rects.length - 1] : rects[0]) : range.getBoundingClientRect();
    var tw = toolbar.offsetWidth, th = toolbar.offsetHeight;
    var x = r.left + (coarse ? r.width / 2 : Math.min(r.width, 240) / 2) - tw / 2;
    x = Math.max(8, Math.min(x, document.documentElement.clientWidth - tw - 8));
    var y = coarse ? r.bottom + 14 : r.top - th - 10;
    if (y < 8) y = r.bottom + 10;
    toolbar.style.left = (x + window.scrollX) + 'px';
    toolbar.style.top = (y + window.scrollY) + 'px';
  }

  var checkSelection = debounce(function () {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) { hideToolbar(); return; }
    var r = sel.getRangeAt(0);
    var anc = r.commonAncestorContainer;
    var el = anc.nodeType === 1 ? anc : anc.parentElement;
    if (!container.contains(anc) || (el && el.closest(SKIP)) || !/\S/.test(sel.toString())) { hideToolbar(); return; }
    showToolbar(r);
  }, 180);

  /* ---------- Editor d'una nota ---------- */
  var pop = null, popId = null;

  function closePop() {
    if (!pop) return;
    var id = popId;
    pop.remove(); pop = null; popId = null;
    $$('mark.pg-hl.is-active').forEach(function (m) { m.classList.remove('is-active'); });
    var n = get(id);
    if (n) marksOf(id).forEach(function (m) { decorate(m, n); });
  }

  function openEditor_(id, anchorEl) {
    closePop();
    var note = get(id);
    if (!note) return;
    var marks = marksOf(id);
    var anchor = anchorEl || marks[0];
    if (!anchor) return;
    marks.forEach(function (m) { m.classList.add('is-active'); });
    popId = id;

    var save = debounce(function () { var n = get(id); if (!n) return; n.comment = ta.value; put(n); marksOf(id).forEach(function (m) { decorate(m, n); }); }, 300);
    var colorBtns = COLORS.map(function (c) {
      return h('button.pg-dot', {
        type: 'button', role: 'radio', 'data-c': c, 'aria-checked': String(note.color === c),
        title: T.colors[c], 'aria-label': T.colors[c],
        onclick: function () {
          var n = get(id); n.color = c; put(n);
          marksOf(id).forEach(function (m) { decorate(m, n); });
          colorBtns.forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-c') === c)); });
        }
      });
    });
    var ta = h('textarea', { 'aria-label': T.commentPh, placeholder: T.commentPh, rows: '3', oninput: save });
    ta.value = note.comment || '';

    var tagBox = h('div.pg-tags', { onclick: function (e) { if (e.target === tagBox) tagInput.focus(); } });
    var tagInput = h('input', { type: 'text', placeholder: T.tagPh, 'aria-label': T.tags, list: 'pg-tag-options', enterkeyhint: 'done' });
    function renderTags() {
      $$('.pg-chip', tagBox).forEach(function (c) { c.remove(); });
      (get(id).tags || []).forEach(function (t) {
        tagBox.insertBefore(h('span.pg-chip', {}, ['#' + t, h('button', {
          type: 'button', 'aria-label': '× ' + t,
          onclick: function () { var n = get(id); n.tags = n.tags.filter(function (x) { return x !== t; }); put(n); renderTags(); }
        }, [icon('x')])]), tagInput);
      });
    }
    function addTag() {
      var t = cleanTag(tagInput.value);
      tagInput.value = '';
      if (!t) return;
      var n = get(id);
      n.tags = n.tags || [];
      if (n.tags.indexOf(t) === -1) { n.tags.push(t); put(n); renderTags(); }
    }
    tagInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
      else if (e.key === 'Backspace' && !tagInput.value) {
        var n = get(id);
        if (n.tags && n.tags.length) { n.tags.pop(); put(n); renderTags(); }
      }
    });
    tagInput.addEventListener('blur', addTag);
    tagBox.appendChild(tagInput);
    renderTags();

    var datalist = h('datalist', { id: 'pg-tag-options' }, allTags().map(function (t) { return h('option', { value: t.tag }); }));

    pop = h('div.pg-pop.pg-ui', { role: 'dialog', 'aria-label': T.editNote }, [
      h('div.pg-pop-row', { role: 'radiogroup', 'aria-label': T.color }, colorBtns.concat([
        h('span.pg-grow'),
        h('button.pg-icon.danger', { type: 'button', title: T.del, 'aria-label': T.del, onclick: function () { removeNote(id); } }, [icon('trash')])
      ])),
      ta, tagBox, datalist,
      h('div.pg-pop-foot', {}, [
        h('span', { text: fmtDate(note.created) + (note.sectionTitle ? ' · ' + note.sectionTitle : '') }),
        h('button.pg-btn.primary', { type: 'button', text: T.done, onclick: closePop })
      ])
    ]);
    pop.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); closePop(); anchor.focus && anchor.focus(); } });
    document.body.appendChild(pop);

    var r = anchor.getBoundingClientRect();
    var pw = pop.offsetWidth, ph = pop.offsetHeight;
    var x = Math.max(12, Math.min(r.left, document.documentElement.clientWidth - pw - 12));
    var y = r.bottom + 10;
    if (y + ph > window.innerHeight - 12 && r.top - ph - 10 > 12) y = r.top - ph - 10;
    pop.style.left = (x + window.scrollX) + 'px';
    pop.style.top = (y + window.scrollY) + 'px';
    if (!coarse) ta.focus();
  }

  function removeNote(id) {
    var copy = JSON.parse(JSON.stringify(get(id)));
    closePop();
    if (container) unpaint(id);
    drop(id);
    toast(T.deleted, T.undo, function () {
      db.notes[id] = copy; put(copy);
      if (container && isHere(copy)) repaint();
    });
  }

  /* ---------- Avisos ---------- */
  var toastEl = null, toastTimer = null;
  function toast(msg, actionLabel, action) {
    if (toastEl) toastEl.remove();
    clearTimeout(toastTimer);
    toastEl = h('div.pg-toast.pg-ui', { role: 'status' }, [h('span', { text: msg }),
      actionLabel ? h('button', { type: 'button', text: actionLabel, onclick: function () { action(); toastEl.remove(); toastEl = null; } }) : null]);
    document.body.appendChild(toastEl);
    toastTimer = setTimeout(function () { if (toastEl) { toastEl.remove(); toastEl = null; } }, actionLabel ? 6000 : 3500);
  }

  /* ---------- Visor de notes ---------- */
  var view = { scope: GUIDE ? 'guide' : 'all', q: '', colors: [], tags: [] };
  var drawer = null, scrim = null, lastFocus = null;

  function allTags(list) {
    var counts = {};
    (list || live()).forEach(function (n) { (n.tags || []).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
    return Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b, LANG); })
      .map(function (t) { return { tag: t, count: counts[t] }; });
  }

  function scoped() {
    var list = live();
    if (view.scope === 'guide' && GUIDE) list = list.filter(isHere);
    return list;
  }

  function filtered() {
    var terms = norm(view.q).split(/\s+/).filter(Boolean);
    return scoped().filter(function (n) {
      if (view.colors.length && view.colors.indexOf(n.color) === -1) return false;
      if (view.tags.length && !view.tags.every(function (t) { return (n.tags || []).indexOf(t) !== -1; })) return false;
      if (!terms.length) return true;
      var hay = norm([n.quote, n.comment, (n.tags || []).join(' '), n.sectionTitle, n.guideTitle].join(' '));
      return terms.every(function (t) { return hay.indexOf(t) !== -1; });
    });
  }

  function openViewer() {
    if (drawer) return;
    if (!GUIDE) { LANG = currentLang(); T = I18N[LANG]; } // el catàleg pot canviar d'idioma sense recarregar
    closePop(); hideToolbar();
    lastFocus = document.activeElement;
    scrim = h('div.pg-scrim', { onclick: closeViewer });
    drawer = h('aside.pg-drawer.pg-ui', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'pg-drawer-title' });
    drawer.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeViewer(); });
    document.body.appendChild(scrim);
    document.body.appendChild(drawer);
    renderViewer(true);
    $('.pg-drawer-head .pg-icon', drawer).focus();
  }

  function closeViewer() {
    if (!drawer) return;
    drawer.remove(); scrim.remove(); drawer = null; scrim = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function renderViewer(full) {
    if (!drawer) return;
    var list = filtered();
    var base = scoped();
    var searchVal = view.q;
    var focusSearch = document.activeElement && document.activeElement.classList.contains('pg-search-input');

    drawer.textContent = '';
    drawer.appendChild(h('header.pg-drawer-head', {}, [
      h('h2', { id: 'pg-drawer-title', text: T.myNotes }),
      h('span.pg-count', { text: T.count(base.length) }),
      h('button.pg-icon', { type: 'button', 'aria-label': T.close, title: T.close, onclick: closeViewer }, [icon('x')])
    ]));

    var tools = h('div.pg-tools');
    if (GUIDE) {
      tools.appendChild(h('div.pg-seg', { role: 'radiogroup', 'aria-label': T.notes }, [['guide', T.thisGuide], ['all', T.allGuides]].map(function (o) {
        return h('button', { type: 'button', role: 'radio', 'aria-checked': String(view.scope === o[0]), text: o[1],
          onclick: function () { view.scope = o[0]; view.tags = []; renderViewer(); } });
      })));
    }
    var input = h('input.pg-search-input', { type: 'search', placeholder: T.search, 'aria-label': T.search,
      oninput: debounce(function () { view.q = input.value; renderViewer(); }, 150) });
    input.value = searchVal;
    tools.appendChild(h('label.pg-search', {}, [icon('search'), input]));
    tools.appendChild(h('div.pg-filter-row', { role: 'group', 'aria-label': T.color }, [h('span.pg-label', { text: T.color })].concat(COLORS.map(function (c) {
      return h('button.pg-dot', { type: 'button', 'data-c': c, 'aria-pressed': String(view.colors.indexOf(c) !== -1), title: T.colors[c], 'aria-label': T.colors[c],
        onclick: function () { toggle(view.colors, c); renderViewer(); } });
    }))));
    var tags = allTags(base);
    if (tags.length) {
      tools.appendChild(h('div.pg-filter-row', { role: 'group', 'aria-label': T.tags }, [h('span.pg-label', { text: T.tags })].concat(tags.slice(0, 24).map(function (t) {
        return h('button.pg-tagf', { type: 'button', 'aria-pressed': String(view.tags.indexOf(t.tag) !== -1), onclick: function () { toggle(view.tags, t.tag); renderViewer(); } },
          ['#' + t.tag, h('span', { text: String(t.count) })]);
      }))));
    }
    drawer.appendChild(tools);

    var body = h('div.pg-list');
    if (!base.length) {
      body.appendChild(h('div.pg-empty', {}, [h('b', { text: T.empty }), T.emptyHint]));
    } else if (!list.length) {
      body.appendChild(h('div.pg-empty', { text: T.emptyFilter }));
    } else {
      groupNotes(list).forEach(function (g) {
        var group = h('section.pg-group');
        if (view.scope === 'all' || !GUIDE) group.appendChild(h('h3', { text: g.title }));
        var lastSection = null;
        g.notes.forEach(function (n) {
          var secTitle = n.sectionTitle || T.noSection;
          if (secTitle !== lastSection) { group.appendChild(h('p.pg-section', { text: secTitle })); lastSection = secTitle; }
          group.appendChild(renderItem(n));
        });
        body.appendChild(group);
      });
    }
    drawer.appendChild(body);

    var file = h('input', { type: 'file', accept: '.json,application/json', hidden: true, onchange: function () { if (file.files[0]) importFile(file.files[0]); file.value = ''; } });
    drawer.appendChild(h('footer.pg-drawer-foot', {}, [
      h('div.pg-actions', {}, [
        h('button.pg-btn', { type: 'button', text: T.exportJson, title: T.exportTitle, onclick: exportJson }),
        h('button.pg-btn', { type: 'button', text: T.importJson, title: T.importTitle, onclick: function () { file.click(); } }),
        h('button.pg-btn', { type: 'button', text: T.exportMd, title: T.mdTitle, onclick: exportMarkdown }),
        file
      ]),
      h('p.pg-privacy', { text: T.privacy })
    ]));

    if (focusSearch) { var si = $('.pg-search-input', drawer); si.focus(); si.setSelectionRange(si.value.length, si.value.length); }
  }

  function toggle(arr, v) { var i = arr.indexOf(v); if (i === -1) arr.push(v); else arr.splice(i, 1); }

  /* Agrupa per guia i versió; la versió s'indica quan no és la de la pàgina */
  function groupNotes(list) {
    var groups = {};
    list.forEach(function (n) {
      var key = n.guide + ':' + n.lang;
      var title = (n.guideTitle || n.guide) + (n.lang && n.lang !== LANG ? ' · ' + T.version[n.lang] : '');
      var g = groups[key] || (groups[key] = { title: title, notes: [], current: isHere(n) });
      g.notes.push(n);
    });
    return Object.keys(groups).map(function (k) { return groups[k]; })
      .sort(function (a, b) { return (b.current ? 1 : 0) - (a.current ? 1 : 0) || a.title.localeCompare(b.title, LANG); })
      .map(function (g) { g.notes.sort(function (a, b) { return (a.pos || 0) - (b.pos || 0); }); return g; });
  }

  function renderItem(n) {
    var orphan = isHere(n) && orphans[n.id];
    return h('article.pg-item', { 'data-c': n.color }, [
      h('button.pg-item-main', { type: 'button', title: T.openNote, onclick: function () { goTo(n); } }, [
        h('span.pg-quote', { text: n.quote }),
        n.comment ? h('span.pg-comment', { text: n.comment }) : null,
        (n.tags || []).length ? h('span.pg-item-tags', {}, n.tags.map(function (t) { return h('span', { text: t }); })) : null,
        h('span.pg-meta', {}, [fmtDate(n.updated || n.created),
          orphan ? h('span.pg-orphan', { text: ' · ' + T.orphan, title: T.orphanTitle }) : null])
      ]),
      h('button.pg-icon.danger.pg-del', { type: 'button', title: T.del, 'aria-label': T.del, onclick: function () { removeNote(n.id); } }, [icon('trash')])
    ]);
  }

  function goTo(n) {
    if (isHere(n)) {
      if (window.innerWidth < 900) closeViewer();
      reveal(n.id, true);
    } else {
      location.href = ROOT + guidePath(n.guide, n.lang) + '#pg-note=' + encodeURIComponent(n.id);
    }
  }

  function reveal(id, edit) {
    var m = marksOf(id)[0];
    if (!m) return;
    var d = m.closest('details');
    while (d) { d.open = true; d = d.parentElement && d.parentElement.closest('details'); }
    m.scrollIntoView({ behavior: 'smooth', block: 'center' });
    marksOf(id).forEach(function (x) { x.classList.remove('is-flash'); void x.offsetWidth; x.classList.add('is-flash'); });
    if (edit && !drawer) setTimeout(function () { openEditor_(id, m); }, 450);
  }

  /* ---------- Importar i exportar ---------- */
  function download(content, name, type) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var a = h('a', { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function stamp() { return new Date().toISOString().slice(0, 10); }

  function exportJson() {
    var data = { app: 'pedagoguia', version: 1, exported: now(), notes: Object.keys(db.notes).map(function (k) { return db.notes[k]; }) };
    download(JSON.stringify(data, null, 2), 'pedagoguia-notes-' + stamp() + '.json', 'application/json');
  }

  function exportMarkdown() {
    var out = ['# ' + T.myNotes + ' · Pedagoguia', '', '_' + fmtDate(now()) + '_', ''];
    groupNotes(filtered()).forEach(function (g) {
      out.push('## ' + g.title, '');
      var last = null;
      g.notes.forEach(function (n) {
        var sec = n.sectionTitle || T.noSection;
        if (sec !== last) { out.push('### ' + sec, ''); last = sec; }
        out.push('> ' + n.quote.replace(/\s+/g, ' ').trim(), '');
        if (n.comment) out.push(n.comment.trim(), '');
        if (n.tags && n.tags.length) out.push(n.tags.map(function (t) { return '#' + t.replace(/\s+/g, '-'); }).join(' '), '');
      });
    });
    download(out.join('\n'), 'pedagoguia-notes-' + stamp() + '.md', 'text/markdown');
  }

  function importFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var data;
      try { data = JSON.parse(reader.result); } catch (e) { toast(T.importError); return; }
      var incoming = data && data.app === 'pedagoguia' ? (Array.isArray(data.notes) ? data.notes : Object.keys(data.notes || {}).map(function (k) { return data.notes[k]; })) : null;
      if (!incoming) { toast(T.importError); return; }
      var added = 0, updated = 0;
      incoming.forEach(function (n) {
        if (!n || typeof n.id !== 'string') return;
        if (!n.deleted && (typeof n.quote !== 'string' || typeof n.guide !== 'string')) return;
        if (!n.deleted && COLORS.indexOf(n.color) === -1) n.color = 'y';
        migrate(n);
        var cur = db.notes[n.id];
        if (!cur) { db.notes[n.id] = n; if (!n.deleted) added++; }
        else if ((n.updated || '') > (cur.updated || '')) { db.notes[n.id] = n; if (!n.deleted) updated++; }
      });
      persist();
      if (container) repaint();
      renderViewer();
      toast(T.imported(added, updated));
    };
    reader.readAsText(file);
  }

  /* ---------- Comptadors i botons ---------- */
  function updateCounts() {
    var n = GUIDE ? guideNotes().length : live().length;
    $$('[data-pg-notes]').forEach(function (btn) {
      var b = $('.pg-badge', btn);
      if (!b) { b = h('span.pg-badge', { 'aria-hidden': 'true' }); btn.appendChild(b); }
      b.textContent = n > 99 ? '99+' : String(n);
      b.hidden = !n;
    });
  }

  /* ---------- Arrencada ---------- */
  function init() {
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-pg-notes]')) { e.preventDefault(); openViewer(); }
    });
    onChange(updateCounts);
    onChange(function () { if (drawer) renderViewer(); });
    updateCounts();

    if (!GUIDE) return;
    container = document.querySelector((script && script.getAttribute('data-root')) || 'main .wrap') || document.querySelector('main');
    if (!container) return;

    repaint();
    buildToolbar();

    document.addEventListener('selectionchange', checkSelection);
    container.addEventListener('click', function (e) {
      var m = e.target.closest('mark.pg-hl');
      if (!m) return;
      var sel = window.getSelection();
      if (sel && !sel.isCollapsed) return;
      openEditor_(m.getAttribute('data-id'), m);
    });
    document.addEventListener('mousedown', function (e) {
      if (pop && !pop.contains(e.target) && !e.target.closest('mark.pg-hl')) closePop();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { hideToolbar(); closePop(); }
    });
    window.addEventListener('resize', debounce(function () { hideToolbar(); closePop(); }, 100));

    var m = /#pg-note=([^&]+)/.exec(location.hash);
    if (m) {
      var id = decodeURIComponent(m[1]);
      history.replaceState(null, '', location.pathname + location.search);
      setTimeout(function () { reveal(id, false); }, 300);
    }

    var seen = null;
    try { seen = localStorage.getItem(TIP_KEY); } catch (e) {}
    if (!seen && !live().length) {
      setTimeout(function () { toast(T.tip); }, 1600);
      try { localStorage.setItem(TIP_KEY, '1'); } catch (e) {}
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.Pedagoguia = window.Pedagoguia || {};
  window.Pedagoguia.notes = { open: openViewer, export: exportJson };
})();
