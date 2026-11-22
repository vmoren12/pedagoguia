# Pedagoguia

Repositori obert de **guies pràctiques basades en la recerca per orientar decisions d'aula**, elaborades a partir de llibres de referència de l'àmbit educatiu. Cada guia sintetitza un llibre de referència, l'organitza per consultar-lo en el moment de planificar i l'acompanya de propostes i eines per a l'aula.

**Catàleg:** https://vmoren12.github.io/pedagoguia/

## Dues llengües

La interfície i totes les guies estan en **català i castellà**. El català és sempre la llengua per defecte, sigui quina sigui la llengua de l'obra original. Al catàleg, el selector CA/ES canvia la interfície i fa que els enllaços portin a la versió triada; a cada guia i síntesi, el botó CA/ES porta a l'altra versió i manté la secció on es llegia. La tria es recorda al navegador.

## Guies publicades

| Llibre | Autoria | Edició | Català | Castellano |
| --- | --- | --- | --- | --- |
| *Aprender a enseñar a leer y a escribir* | Juan C. Ripoll, Nadina Gómez Merino, Vicenta Ávila Clemente | SM, 2024 · ISBN 9788411821865 | [Guia](https://vmoren12.github.io/pedagoguia/guies/9788411821865/) · [Síntesi A4](https://vmoren12.github.io/pedagoguia/guies/9788411821865/sintesi.html) | [Guía](https://vmoren12.github.io/pedagoguia/guies/9788411821865/es/) · [Síntesis A4](https://vmoren12.github.io/pedagoguia/guies/9788411821865/es/sintesi.html) |
| *¿Cómo aprendemos? Una aproximación científica al aprendizaje y la enseñanza* | Héctor Ruiz Martín | Graó, 2020 · ISBN 9788418058059 | [Guia](https://vmoren12.github.io/pedagoguia/guies/9788418058059/) · [Síntesi A4](https://vmoren12.github.io/pedagoguia/guies/9788418058059/sintesi.html) | [Guía](https://vmoren12.github.io/pedagoguia/guies/9788418058059/es/) · [Síntesis A4](https://vmoren12.github.io/pedagoguia/guies/9788418058059/es/sintesi.html) |
| *«Edumitos». Ideas sobre el aprendizaje sin respaldo científico* | Héctor Ruiz Martín | ISTF, 2023 · ISBN 9788412714784 | [Guia](https://vmoren12.github.io/pedagoguia/guies/9788412714784/) · [Síntesi A4](https://vmoren12.github.io/pedagoguia/guies/9788412714784/sintesi.html) | [Guía](https://vmoren12.github.io/pedagoguia/guies/9788412714784/es/) · [Síntesis A4](https://vmoren12.github.io/pedagoguia/guies/9788412714784/es/sintesi.html) |
| *Cómo se aprende. Aportaciones fundamentales en psicología de la educación y su significado en la práctica* | Paul A. Kirschner, Carl Hendrick | Akal, 2025 · ISBN 9788446056805 | [Guia](https://vmoren12.github.io/pedagoguia/guies/9788446056805/) · [Síntesi A4](https://vmoren12.github.io/pedagoguia/guies/9788446056805/sintesi.html) | [Guía](https://vmoren12.github.io/pedagoguia/guies/9788446056805/es/) · [Síntesis A4](https://vmoren12.github.io/pedagoguia/guies/9788446056805/es/sintesi.html) |

## Notes personals

A les guies es pot seleccionar qualsevol text per subratllar-lo en cinc colors i afegir-hi comentaris i etiquetes. El visor de notes (a les guies i al catàleg) permet cercar, filtrar per color o etiqueta, saltar a cada subratllat i exportar o importar totes les notes de totes les guies (JSON) o descarregar-les en Markdown. Les notes es desen només al navegador de cada persona. Cada nota recorda en quina versió (catalana o castellana) es va fer, i el visor les agrupa per guia i versió.

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
assets/js/catalog.js        Vistes, cerca, filtres, ordenació, idioma CA/ES i diàleg d'aportacions
assets/css/notes.css        Estils dels subratllats i del visor de notes
assets/js/notes.js          Subratllats, comentaris, etiquetes, visor i importació/exportació
assets/js/lang.js           Botó CA/ES de les guies: desa la tria i manté la secció
assets/img/                 Icona del lloc
guies/<ISBN>/               Cada guia en català: index.html, sintesi.html (A4) i cover.jpg
guies/<ISBN>/es/            La mateixa guia en castellà: index.html i sintesi.html
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
