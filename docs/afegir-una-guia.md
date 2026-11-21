# Afegir una guia

Procés manual, pensat per fer-lo amb ajuda d'IA. Cada guia és una pàgina HTML autocontinguda i el catàleg es genera a partir de `data/catalog.json`.

## 1. Fitxer de la guia

Desa la guia a `guies/<ISBN-13 sense guions>/index.html`. L'ISBN fa d'identificador estable i de ruta pública:

```
https://vmoren12.github.io/pedagoguia/guies/9788411821865/
```

Requisits mínims de la pàgina:

- Autocontinguda: CSS i JS propis en línia. L'única dependència és el sistema de notes compartit (vegeu més avall).
- `lang` correcte a `<html>` segons l'idioma de la guia (els textos de les notes s'adapten a `ca` o `es`).
- Icona: `<link rel="icon" href="../../assets/img/favicon.svg" type="image/svg+xml">`.
- Fletxa d'enrere al catàleg a la cantonada superior esquerra (menú lateral i barra mòbil): `href="../../"`.
- Enllaç per notificar errors, que obre el diàleg d'avís del catàleg amb la guia ja identificada:
  `href="../../?avis=error&amp;isbn=<ISBN>"`, com a icona petita i discreta al peu del menú lateral.
- Botó «Síntesis» a la part superior dreta que obre `sintesi.html`.

- Peu del menú lateral en una sola filera: tema i imprimir com a icones, desplegables, notes i avís.
- Tema compartit amb el catàleg: llegeix i desa `localStorage['pedagoguia:theme']` (`light` o `dark`) i l'aplica amb un petit script al `<head>`, abans del primer pintat. Parteix del codi d'una guia existent.

Pots prendre com a referència `guies/9788411821865/index.html` (classes `back-link`, `back-btn`, `synth-btn`, `icon` i `ico`).

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

Cada guia té una `guies/<ISBN>/sintesi.html`: un resum visual i esquemàtic en **dues pàgines A4**, fidel al llibre, amb la teoria més rellevant (pàgina 1) i les claus per orientar la pràctica d'aula (pàgina 2). Parteix de `guies/9788411821865/sintesi.html` i comprova que, en imprimir-la o desar-la en PDF, ocupa exactament dues pàgines.

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
  "publisherUrl": "https://editorial.example/fitxa-del-llibre",
  "added": "AAAA-MM-DD",
  "updated": "AAAA-MM-DD"
}
```

Notes:

- `cover` (opcional): portada original, desada com `guies/<ISBN>/cover.jpg`, vertical i d'uns 400 px d'amplada (JPG, menys de 80 kB). Es mostra com a llibre 3D animat. Si no n'hi ha, o no es carrega, es genera una coberta tipogràfica amb `color` (to fosc i sobri, perquè el text és clar).
- Els filtres del catàleg es generen sols a partir de les dades:
  - **Etapa** (`stages`): fes servir sempre els mateixos noms: Infantil, Primària, Secundària, Batxillerat i FP, Transversal.
  - **Temàtica** (`topics`): la primera es mostra com a categoria principal de la fitxa. Reutilitza els noms existents abans de crear-ne de nous (p. ex. Lectoescriptura, Matemàtiques, Avaluació, Ciència cognitiva, Gestió d'aula, Inclusió).
  - **Etiquetes** (`tags`): com a màxim 4 paraules clau concretes, en minúscula. També es poden clicar a la fitxa per filtrar.
  - **Idioma de la guia** (`language`).
- El cercador busca a títol, subtítol, autoria, editorial, temàtiques, etapes, etiquetes, resum i ISBN.
- `publisherUrl` (opcional): fitxa oficial del llibre a la web de l'editorial. Al catàleg es mostra com una icona per consultar-lo o comprar-ne un exemplar.
- Les guies afegides fa menys de 45 dies mostren l'etiqueta «Nova».
- L'ordre per defecte és per data d'incorporació (`added`), de més recent a més antiga; també es pot ordenar per títol o per any.
- Vistes: fitxes (detall), graella (portades) i llista (taula compacta). Amb més de 6 guies, la vista per defecte passa a ser la graella; la tria de cada usuari es recorda.

## 3. Comprovació i publicació

1. Serveix la carpeta en local (`npx serve .`) i revisa el catàleg i la guia en mòbil i escriptori, en tema clar i fosc.
2. Afegeix la guia a la taula del `README.md`.
3. Fes commit i push a `main`. GitHub Pages publica els canvis en un o dos minuts.
