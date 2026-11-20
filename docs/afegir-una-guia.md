# Afegir una guia

Procés manual, pensat per fer-lo amb ajuda d'IA. Cada guia és una pàgina HTML autocontinguda i el catàleg es genera a partir de `data/catalog.json`.

## 1. Fitxer de la guia

Desa la guia a `guies/<ISBN-13 sense guions>/index.html`. L'ISBN fa d'identificador estable i de ruta pública:

```
https://vmoren12.github.io/lecturia/guies/9788411821865/
```

Requisits mínims de la pàgina:

- Autocontinguda: CSS i JS en línia, sense dependències externes.
- `lang` correcte a `<html>` segons l'idioma de la guia.
- Icona: `<link rel="icon" href="../../assets/img/favicon.svg" type="image/svg+xml">`.
- Enllaç de tornada al catàleg: `href="../../"`.
- Enllaç per notificar errors, que obre el diàleg d'avís del catàleg amb la guia ja identificada:
  `href="../../?avis=error&amp;isbn=<ISBN>"`.

Pots prendre com a referència `guies/9788411821865/index.html` (classes `home-link` i `home-btn`).

## 2. Entrada al catàleg

Afegeix un objecte a `guides` dins de `data/catalog.json`:

```json
{
  "isbn": "9788411821865",
  "path": "guies/9788411821865/",
  "title": "Títol del llibre",
  "subtitle": "Subtítol (opcional)",
  "authors": ["Nom Cognom", "Nom Cognom"],
  "publisher": "Editorial",
  "collection": "Col·lecció (opcional)",
  "year": 2024,
  "area": "Àmbit (p. ex. Lectoescriptura)",
  "stages": ["Infantil", "Primària"],
  "language": "Castellà",
  "summary": "Dues o tres línies en català sobre què aporta la guia.",
  "highlights": ["12 capítols", "Activitats d'aula"],
  "tags": ["paraules", "per a", "la cerca"],
  "color": "#2f5d50",
  "added": "AAAA-MM-DD",
  "updated": "AAAA-MM-DD"
}
```

Notes:

- `color` és el color de la coberta tipogràfica. Tria un to fosc i sobri (el text de la coberta és clar).
- `stages` alimenta els filtres per etapa. Fes servir sempre els mateixos noms: Infantil, Primària, Secundària, Batxillerat i FP, Transversal.
- Les guies afegides fa menys de 45 dies mostren l'etiqueta «Nova».
- L'ordre del catàleg és per data d'incorporació (`added`), de més recent a més antiga.

## 3. Comprovació i publicació

1. Serveix la carpeta en local (`npx serve .`) i revisa el catàleg i la guia en mòbil i escriptori, en tema clar i fosc.
2. Afegeix la guia a la taula del `README.md`.
3. Fes commit i push a `main`. GitHub Pages publica els canvis en un o dos minuts.
