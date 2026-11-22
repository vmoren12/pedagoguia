# Icona anterior (llibre obert de traç)

Còpia de la icona utilitzada fins al novembre del 2026, per si cal tornar-hi.

- `favicon-llibre-obert.svg`: el favicon (quadrat verd arrodonit amb el llibre en traç clar).
- `brand-mark-llibre-obert.svg`: el logotip de la capçalera del catàleg. A `index.html` anava en línia dins de `<a class="brand">`, amb la classe `brand-mark` (el color i el gruix del traç els posa `assets/css/pedagoguia.css`):

```html
<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M5 7.5c3.6-1.4 7.2-1.2 11 1v17c-3.8-2.2-7.4-2.4-11-1z"/><path d="M27 7.5c-3.6-1.4-7.2-1.2-11 1v17c3.8-2.2 7.4-2.4 11-1z"/></svg>
```

Per restaurar-la: copia `favicon-llibre-obert.svg` sobre `assets/img/favicon.svg` i torna a posar aquest SVG a la capçalera d'`index.html` (i les regles de `.brand-mark` que hi hagi a `pedagoguia.css`).
