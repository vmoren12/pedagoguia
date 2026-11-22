/* Pedagoguia — canvi d'idioma a les guies i a les síntesis
   Cada guia té dues versions amb els mateixos identificadors de secció:
   guies/ISBN/ (català, per defecte) i guies/ISBN/es/ (castellà).
   Els enllaços [data-pg-lang] porten a l'altra versió: hi afegeixen la secció
   que s'està llegint i desen la tria (pedagoguia:lang) perquè el catàleg
   obri les guies en la mateixa llengua. */
(function () {
  'use strict';

  /* Secció visible: l'última que ha començat per sobre del terç superior de la pantalla */
  function currentSection() {
    var limit = window.innerHeight * 0.35, id = '';
    var list = document.querySelectorAll('main section[id], main header[id]');
    for (var i = 0; i < list.length; i++) {
      if (list[i].getBoundingClientRect().top <= limit) id = list[i].id;
      else break;
    }
    return id;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-pg-lang]');
    if (!a) return;
    try { localStorage.setItem('pedagoguia:lang', a.getAttribute('data-pg-lang')); } catch (x) {}
    var id = window.scrollY > 40 ? currentSection() : '';
    a.href = a.href.split('#')[0] + (id ? '#' + id : '');
  });
})();
