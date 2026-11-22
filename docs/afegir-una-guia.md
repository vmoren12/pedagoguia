# Afegir una guia

Procés manual, pensat per fer-lo amb ajuda d'IA. Cada guia és una pàgina HTML autocontinguda i el catàleg es genera a partir de `data/catalog.json`.

**Cada guia es publica en dues llengües: català (per defecte) i castellà**, sigui quina sigui la llengua de l'obra original. La interfície del catàleg també és bilingüe.

## 1. Fitxers de la guia

| Fitxer | Llengua | URL pública |
| --- | --- | --- |
| `guies/<ISBN>/index.html` | Català | `…/guies/<ISBN>/` |
| `guies/<ISBN>/sintesi.html` | Català | `…/guies/<ISBN>/sintesi.html` |
| `guies/<ISBN>/es/index.html` | Castellà | `…/guies/<ISBN>/es/` |
| `guies/<ISBN>/es/sintesi.html` | Castellà | `…/guies/<ISBN>/es/sintesi.html` |

L'ISBN-13 sense guions fa d'identificador estable i de ruta pública (p. ex. `https://vmoren12.github.io/pedagoguia/guies/9788411821865/`). La portada `cover.jpg` només es desa a l'arrel de la guia.

Requisits mínims de cada pàgina:

- Autocontinguda: CSS i JS propis en línia. Les úniques dependències són el sistema de notes compartit i el selector de llengua (vegeu més avall).
- `lang` correcte a `<html>`: `ca` a l'arrel i `es` a `es/` (els textos de les notes s'adapten a la llengua).
- **Les dues versions tenen exactament els mateixos `id`** de seccions, capítols i eines: el canvi de llengua i el visor de notes hi salten per `id`. Tradueix només el text visible; no canviïs `id`, classes ni atributs `data-*`.
- Rutes als recursos compartits: `../../assets/…` a l'arrel i `../../../assets/…` a `es/`.
- Icona: `<link rel="icon" href="../../assets/img/favicon.svg" type="image/svg+xml">` (amb un `../` més a `es/`).
- Fletxa d'enrere al catàleg a la cantonada superior esquerra (menú lateral i barra mòbil): `href="../../"` (o `../../../` a `es/`).
- Enllaç per notificar errors, que obre el diàleg d'avís del catàleg amb la guia ja identificada:
  `href="../../?avis=error&amp;isbn=<ISBN>"`, com a icona petita i discreta al peu del menú lateral.
- Botó «Síntesis» a la part superior dreta que obre `sintesi.html`.

- Peu del menú lateral en una sola filera: tema i imprimir com a icones, desplegables, selector d'idioma, notes i avís. Comprova que hi cap en totes dues llengües (el menú fa 290 px).
- Tema compartit amb el catàleg: llegeix i desa `localStorage['pedagoguia:theme']` (`light` o `dark`) i l'aplica amb un petit script al `<head>`, abans del primer pintat. Parteix del codi d'una guia existent.

Pots prendre com a referència `guies/9788411821865/index.html` (classes `back-link`, `back-btn`, `synth-btn`, `lang-sel`, `icon` i `ico`).

### Selector de llengua

Cada pàgina enllaça amb la seva versió en l'altra llengua i declara totes dues al `<head>`:

```html
<!-- A guies/<ISBN>/index.html (català) -->
<link rel="alternate" hreflang="ca" href="./">
<link rel="alternate" hreflang="es" href="es/">
<script src="../../assets/js/lang.js" defer></script>

<!-- A guies/<ISBN>/es/index.html (castellà) -->
<link rel="alternate" hreflang="ca" href="../">
<link rel="alternate" hreflang="es" href="./">
<script src="../../../assets/js/lang.js" defer></script>
```

A la guia, el selector és només al peu del menú lateral, a la mateixa filera que la resta de botons, abans del botó de notes (porta la classe `push`, que l'alinea a la dreta). La llengua actual és un `span` marcat i l'altra, un enllaç amb `data-pg-lang`:

```html
<!-- Versió catalana -->
<div class="lang-sel push" role="group" aria-label="Idioma"><span aria-current="true" lang="ca" title="Català">CA</span><a href="es/" data-pg-lang="es" hreflang="es" lang="es" title="Versión en castellano" aria-label="Versión en castellano">ES</a></div>
```

A la síntesi, el botó és un enllaç amb la classe `lang-btn` a la barra superior, abans del botó d'imprimir:

```html
<a class="lang-btn" href="es/sintesi.html" data-pg-lang="es" hreflang="es" lang="es"
   title="Versión en castellano" aria-label="Versión en castellano">ES</a>
```

`assets/js/lang.js` desa la tria a `localStorage['pedagoguia:lang']` (la mateixa clau que fa servir el catàleg) i afegeix a l'enllaç l'`id` de la secció que s'està llegint, perquè l'altra versió s'obri al mateix punt. Les guies no redirigeixen mai segons la preferència: la URL sempre mana.

### Traduir una guia

- Català: si l'obra no és en català, tradueix les cites i indica-ho a la introducció («traducció pròpia»).
- Adapta els exemples que depenen de la llengua (fonologia, ortografia, jocs de paraules). Si el contingut del llibre és específic d'una llengua (p. ex. l'ortografia castellana en un llibre de lectoescriptura), mantén-lo i explica-ho amb una nota, en lloc de fer-lo passar per vàlid per a l'altra llengua.
- Tradueix també els textos del JavaScript de les eines (missatges, comptadors, resultats de cerca buits).
- Comprova que les dues síntesis ocupen exactament dues pàgines: el castellà sol ser una mica més llarg que el català.

### Subratllats i notes

Per activar-los, afegeix al `<head>` de la guia:

```html
<meta name="pg-guide" content="<ISBN>">
<meta name="pg-guide-title" content="Títol del llibre">
<link rel="stylesheet" href="../../assets/css/notes.css">
<script src="../../assets/js/notes.js" defer></script>
```

I un botó per obrir el visor (al peu del menú lateral i a la barra mòbil): qualsevol element amb l'atribut `data-pg-notes`. El comptador de notes s'hi afegeix sol.

- El contingut subratllable és `main .wrap` (es pot canviar amb `data-root` a l'etiqueta `<script>`).
- No es pot subratllar dins de les eines interactives (`.tool`), formularis ni elements amb `data-pg-skip`.
- Cada subratllat s'ancora pel text citat i el context; si es reescriu molt el fragment original, la nota es conserva al visor marcada com a «No localitzada».
- Les notes de totes les guies es desen juntes al navegador (`localStorage`, clau `pedagoguia:notes`) i s'exporten o importen totes alhora des del visor, també des del catàleg.

### Síntesi imprimible

Cada guia té una `guies/<ISBN>/sintesi.html` (i la seva versió `es/sintesi.html`): un resum visual i esquemàtic en **dues pàgines A4**, fidel al llibre, amb la teoria més rellevant (pàgina 1) i les claus per orientar la pràctica d'aula (pàgina 2). Parteix de `guies/9788411821865/sintesi.html` i comprova que, en imprimir-la o desar-la en PDF, cada versió ocupa exactament dues pàgines.

## 2. Entrada al catàleg

Afegeix un objecte a `guides` dins de `data/catalog.json`:

```json
{
  "isbn": "9788411821865",
  "path": "guies/9788411821865/",
  "cover": "guies/9788411821865/cover.jpg",
  "color": "#2f5d50",
  "title": "Títol del llibre",
  "subtitle": "Subtítol (opcional)",
  "authors": ["Nom Cognom", "Nom Cognom"],
  "publisher": "Editorial",
  "collection": "Col·lecció (opcional)",
  "year": 2024,
  "topics": ["Temàtica principal", "Temàtica secundària"],
  "stages": ["Infantil", "Primària"],
  "language": "Castellà",
  "summary": "Dues o tres línies en català sobre què aporta la guia.",
  "highlights": ["12 capítols", "Activitats d'aula"],
  "tags": ["paraules", "clau", "del llibre"],
  "es": {
    "summary": "Las mismas dos o tres líneas, en castellano.",
    "highlights": ["12 capítulos", "Actividades de aula"]
  },
  "publisherUrl": "https://editorial.example/fitxa-del-llibre",
  "added": "AAAA-MM-DD",
  "updated": "AAAA-MM-DD"
}
```

Notes:

- `path` apunta sempre a la versió catalana; el catàleg hi afegeix `es/` quan la interfície és en castellà.
- `title`, `subtitle`, autoria i editorial es mostren tal com són a l'edició (no es tradueixen).
- `summary` i `highlights` s'escriuen en català; la seva traducció va a `es`. Si falta, el catàleg en castellà mostra el text català.
- `topics`, `stages`, `tags` i `language` s'escriuen sempre en català (són els valors canònics dels filtres i dels enllaços). Cada valor nou s'ha d'afegir a `site.terms.es` amb la seva traducció; si no hi és, es mostra en català.
- `language` és la **llengua de l'edició del llibre** (p. ex. «Castellà»), no la de la guia: totes les guies són en català i en castellà.
- `cover` (opcional): portada original, desada com `guies/<ISBN>/cover.jpg`, vertical i d'uns 400 px d'amplada (JPG, menys de 80 kB). Es mostra com a llibre 3D animat. Si no n'hi ha, o no es carrega, es genera una coberta tipogràfica amb `color` (to fosc i sobri, perquè el text és clar).
- Els filtres del catàleg es generen sols a partir de les dades:
  - **Etapa** (`stages`): fes servir sempre els mateixos noms: Infantil, Primària, Secundària, Batxillerat i FP, Transversal.
  - **Temàtica** (`topics`): la primera es mostra com a categoria principal de la fitxa. Reutilitza els noms existents abans de crear-ne de nous (p. ex. Lectoescriptura, Matemàtiques, Avaluació, Ciència cognitiva, Gestió d'aula, Inclusió).
  - **Etiquetes** (`tags`): com a màxim 4 paraules clau concretes, en minúscula. També es poden clicar a la fitxa per filtrar.
  - **Idioma de l'edició** (`language`).
- El cercador busca a títol, subtítol, autoria, editorial, temàtiques, etapes, etiquetes, resum i ISBN.
- `isbnDisplay` (opcional): ISBN amb el guionat correcte, si no té un codi d'editorial de cinc xifres (p. ex. `978-84-460-5680-5`). Si no hi és, el catàleg el guiona com a `978-84-XXXXX-XX-X`.
- `publisherUrl` (opcional): fitxa oficial del llibre a la web de l'editorial. Al catàleg es mostra com una icona per consultar-lo o comprar-ne un exemplar.
- Les guies afegides fa menys de 45 dies mostren l'etiqueta «Nova».
- L'ordre per defecte és per data d'incorporació (`added`), de més recent a més antiga; també es pot ordenar per títol o per any.
- Vistes: fitxes (detall), graella (portades) i llista (taula compacta). Amb més de 6 guies, la vista per defecte passa a ser la graella; la tria de cada usuari es recorda.

## 3. Comprovació i publicació

1. Serveix la carpeta en local (`npx serve .`) i revisa el catàleg i la guia en mòbil i escriptori, en tema clar i fosc, i en català i castellà. Comprova que el botó CA/ES de cada pàgina porta a l'altra versió a la mateixa secció.
2. Afegeix la guia a la taula del `README.md`, amb els enllaços de les dues llengües.
3. Fes commit i push a `main`. GitHub Pages publica els canvis en un o dos minuts.
