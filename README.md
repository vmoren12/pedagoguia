# Pedagoguia

Repositori obert de **guies pràctiques basades en la recerca per orientar decisions d'aula**, elaborades a partir de llibres de referència de l'àmbit educatiu. Cada guia sintetitza un llibre de referència, l'organitza per consultar-lo en el moment de planificar i l'acompanya de propostes i eines per a l'aula.

**Catàleg:** https://vmoren12.github.io/pedagoguia/

## Guies publicades

| Llibre | Autoria | Edició | Guia |
| --- | --- | --- | --- |
| *Aprender a enseñar a leer y a escribir* | Juan C. Ripoll, Nadina Gómez Merino, Vicenta Ávila Clemente | SM, 2024 · ISBN 9788411821865 | [Guia](https://vmoren12.github.io/pedagoguia/guies/9788411821865/) · [Síntesi A4](https://vmoren12.github.io/pedagoguia/guies/9788411821865/sintesi.html) |
| *¿Cómo aprendemos? Una aproximación científica al aprendizaje y la enseñanza* | Héctor Ruiz Martín | Graó, 2020 · ISBN 9788418058059 | [Guia](https://vmoren12.github.io/pedagoguia/guies/9788418058059/) · [Síntesi A4](https://vmoren12.github.io/pedagoguia/guies/9788418058059/sintesi.html) |

## Notes personals

A les guies es pot seleccionar qualsevol text per subratllar-lo en cinc colors i afegir-hi comentaris i etiquetes. El visor de notes (a les guies i al catàleg) permet cercar, filtrar per color o etiqueta, saltar a cada subratllat i exportar o importar totes les notes de totes les guies (JSON) o descarregar-les en Markdown. Les notes es desen només al navegador de cada persona.

## Aportacions

Qualsevol persona pot contribuir des del botó d'avís del web o directament a [Issues](https://github.com/vmoren12/pedagoguia/issues/new/choose):

- **Error de contingut**: una dada, una cita o una explicació que cal revisar.
- **Suggeriment de llibre**: una obra que mereix la seva guia.
- **Millora de l'aplicació**: errors, accessibilitat o idees per al web.

## Estructura

```
index.html                  Pàgina d'inici del catàleg
404.html                    Pàgina d'error
data/catalog.json           Font única de dades del catàleg
assets/css/pedagoguia.css   Estils (tokens, tema clar i fosc, responsive)
assets/js/catalog.js        Vistes, cerca, filtres, ordenació i diàleg d'aportacions
assets/css/notes.css        Estils dels subratllats i del visor de notes
assets/js/notes.js          Subratllats, comentaris, etiquetes, visor i importació/exportació
assets/img/                 Icona del lloc
guies/<ISBN>/               Cada guia: index.html, sintesi.html (A4) i cover.jpg
.github/ISSUE_TEMPLATE/     Formularis d'aportació
docs/                       Documentació de manteniment
```

Lloc estàtic sense dependències ni procés de compilació. Per afegir una guia, vegeu [docs/afegir-una-guia.md](docs/afegir-una-guia.md).

## Treballar en local

El catàleg carrega `data/catalog.json` amb `fetch`, de manera que cal servir la carpeta amb un servidor HTTP (no funciona obrint el fitxer directament):

```sh
npx serve .            # o bé: python -m http.server
```

## Avís

Les guies són materials de suport i no substitueixen la lectura de les obres originals. Els drets dels llibres pertanyen als seus autors i editorials.
