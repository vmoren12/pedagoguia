/* Pedagoguia — punt de lectura de les guies
   Desa a cada dispositiu (localStorage, clau pedagoguia:reading) on s'ha deixat
   de llegir cada guia i, en tornar-la a obrir, hi porta la persona lectora.
   La posició es guarda com l'últim element amb id que ha passat la línia de
   lectura (seccions i apartats) més la fracció recorreguda fins al següent.
   Com que les versions catalana i castellana comparteixen els id, el punt de
   lectura és el mateix en totes dues llengües.
   No restaura si l'adreça ja porta un #id (un enllaç o el canvi de llengua
   manen) ni quan el navegador recupera la posició (enrere o recàrrega). */
(function () {
  'use strict';

  var KEY = 'pedagoguia:reading';
  var MAX = 60;                       // guies recordades com a màxim
  var guideMeta = document.querySelector('meta[name="pg-guide"]');
  if (!guideMeta) return;
  var guide = guideMeta.getAttribute('content');
  var lang = (document.documentElement.lang || 'ca').slice(0, 2) === 'es' ? 'es' : 'ca';
  var T = {
    ca: { back: 'Has tornat on ho havies deixat', from: 'Torna a l’inici', close: 'Tanca' },
    es: { back: 'Has vuelto a donde lo habías dejado', from: 'Volver al inicio', close: 'Cerrar' }
  }[lang];

  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '{}'); return v && typeof v === 'object' ? v : {}; }
    catch (e) { return {}; }
  }
  function save(db) {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
  }

  /* Punts d'ancoratge: seccions i apartats amb id dins del contingut */
  var anchors = [];
  function collect() {
    anchors = Array.prototype.slice.call(
      document.querySelectorAll('main header[id], main section[id], main h3[id]'));
  }
  function line() { return window.innerHeight * 0.25; }

  function current() {
    if (!anchors.length) return null;
    var y = line(), idx = -1;
    for (var i = 0; i < anchors.length; i++) {
      if (anchors[i].getBoundingClientRect().top <= y) idx = i; else break;
    }
    if (idx < 0) return null;
    var top = anchors[idx].getBoundingClientRect().top;
    var next = anchors[idx + 1] ? anchors[idx + 1].getBoundingClientRect().top
      : document.documentElement.getBoundingClientRect().bottom;
    var span = next - top;
    var f = span > 0 ? Math.min(1, Math.max(0, (y - top) / span)) : 0;
    return { id: anchors[idx].id, f: Math.round(f * 1000) / 1000 };
  }

  /* ---------- desar ---------- */
  var restoring = false, timer = null;
  function store() {
    if (restoring) return;
    var db = load();
    var pos = window.scrollY < 80 ? null : current();
    if (!pos) { if (db[guide]) { delete db[guide]; save(db); } return; }
    db[guide] = { id: pos.id, f: pos.f, lang: lang, t: Date.now() };
    var keys = Object.keys(db);
    if (keys.length > MAX) {
      keys.sort(function (a, b) { return (db[a].t || 0) - (db[b].t || 0); });
      keys.slice(0, keys.length - MAX).forEach(function (k) { delete db[k]; });
    }
    save(db);
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(store, 400); }

  /* ---------- restaurar ---------- */
  function navType() {
    try {
      var e = performance.getEntriesByType('navigation')[0];
      if (e) return e.type;
    } catch (x) {}
    return 'navigate';
  }

  function scrollToPos(pos) {
    var el = document.getElementById(pos.id);
    if (!el) return false;
    var i = anchors.indexOf(el);
    var top = el.getBoundingClientRect().top + window.scrollY;
    var next = anchors[i + 1] ? anchors[i + 1].getBoundingClientRect().top + window.scrollY
      : document.documentElement.scrollHeight;
    var target = top + (next - top) * (pos.f || 0) - line();
    var html = document.documentElement, prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, Math.max(0, target));
    html.style.scrollBehavior = prev;
    return true;
  }

  function toast() {
    var css = document.createElement('style');
    css.textContent =
      '.pg-resume{position:fixed;left:50%;bottom:20px;transform:translate(-50%,8px);opacity:0;z-index:90;' +
      'display:flex;align-items:center;gap:10px;max-width:calc(100vw - 32px);padding:9px 10px 9px 16px;' +
      'border:1px solid var(--line-2,#d9d4c8);border-radius:999px;background:var(--card,#fff);color:var(--ink,#1d1d1b);' +
      'box-shadow:0 10px 30px rgba(0,0,0,.14);font:14px/1.3 var(--sans,system-ui,sans-serif);transition:opacity .25s,transform .25s}' +
      '.pg-resume.on{opacity:1;transform:translate(-50%,0)}' +
      '.pg-resume button{font:inherit;font-size:13px;border:1px solid var(--line-2,#d9d4c8);background:var(--paper,#fbfaf7);' +
      'color:var(--ink-2,#3a3a37);border-radius:999px;padding:5px 11px;cursor:pointer;white-space:nowrap}' +
      '.pg-resume button:hover{border-color:var(--accent,#2f5d50);color:var(--accent,#2f5d50)}' +
      '.pg-resume .x{border-color:transparent;background:transparent;padding:5px 8px}' +
      '@media (min-width:1001px){.pg-resume{left:calc(50% + 145px)}}' +
      '@media print{.pg-resume{display:none}}';
    document.head.appendChild(css);
    var box = document.createElement('div');
    box.className = 'pg-resume';
    box.setAttribute('role', 'status');
    box.innerHTML = '<span></span><button type="button" class="top"></button><button type="button" class="x"></button>';
    box.firstChild.textContent = T.back;
    var top = box.querySelector('.top'), x = box.querySelector('.x');
    top.textContent = T.from;
    x.textContent = '×'; x.title = T.close; x.setAttribute('aria-label', T.close);
    document.body.appendChild(box);
    var gone = false;
    function hide() {
      if (gone) return; gone = true;
      box.classList.remove('on');
      setTimeout(function () { box.remove(); }, 300);
    }
    top.addEventListener('click', function () {
      var html = document.documentElement, prev = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      html.style.scrollBehavior = prev;
      hide();
    });
    x.addEventListener('click', hide);
    requestAnimationFrame(function () { box.classList.add('on'); });
    setTimeout(hide, 7000);
  }

  function restore() {
    if (location.hash.length > 1) return;
    var t = navType();
    if (t === 'back_forward' || t === 'reload') return;
    var pos = load()[guide];
    if (!pos || !pos.id || pos.id === 'top') return;
    restoring = true;
    var ok = scrollToPos(pos);
    // Les notes i les fonts poden moure lleugerament el contingut: un segon ajust
    setTimeout(function () { if (ok) scrollToPos(pos); restoring = false; }, 350);
    if (ok) toast();
  }

  function init() {
    collect();
    restore();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('pagehide', store);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') store();
    });
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
