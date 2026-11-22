# Icones anteriors

Còpies de les icones que s'han fet servir, per si cal tornar-hi.

## 1. Llibre obert de traç (fins al novembre del 2026)

- `favicon-llibre-obert.svg`: el favicon (quadrat verd arrodonit amb el llibre en traç clar).
- `brand-mark-llibre-obert.svg`: el logotip de la capçalera del catàleg. A `index.html` anava en línia dins de `<a class="brand">`:

```html
<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M5 7.5c3.6-1.4 7.2-1.2 11 1v17c-3.8-2.2-7.4-2.4-11-1z"/><path d="M27 7.5c-3.6-1.4-7.2-1.2-11 1v17c3.8-2.2 7.4-2.4 11-1z"/></svg>
```

Regla de `assets/css/pedagoguia.css` que l'acompanyava:

```css
.brand-mark { width: 24px; height: 24px; stroke: var(--accent); stroke-width: 1.8; }
```

## 2. Llibre-taula amb tapa (primera versió isomètrica)

Llibre obert amb tapa, gruix de pàgines i tres potes.

- `favicon-llibre-taula-v1.svg`: el favicon.
- `brand-mark-llibre-taula-v1.svg`: el logotip de la capçalera. Fa servir `currentColor` i `var(--paper)`, de manera que cal posar-lo en línia a `index.html` (dins de `<a class="brand">`), no com a imatge.

Regla de `assets/css/pedagoguia.css` que l'acompanyava:

```css
.brand-mark { width: 26px; height: 26px; color: var(--accent); }
```

## Com restaurar-ne una

1. Copia el `favicon-….svg` triat sobre `assets/img/favicon.svg`.
2. Substitueix el `<svg class="brand-mark">…</svg>` de la capçalera d'`index.html` pel contingut del `brand-mark-….svg` corresponent.
3. Posa la regla `.brand-mark` corresponent a `assets/css/pedagoguia.css`.
