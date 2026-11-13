# Révisions L2 Maths

Site statique de révision pour la L2 de mathématiques (semestre 3) : Algèbre 3, Analyse 3,
Probabilités et statistiques 1, Algorithmique, Analyse et applications informatiques.

Chaque chapitre a quatre sections : **Cours** (définitions, théorèmes, démonstrations, remarques,
exemples), **Fiches** (synthèse), **Exercices** (corrigés, avec un bouton « + Un exercice de ce
genre ») et **Fiches méthodes** (cas typiques et démarche de résolution).

## Lancer

- Ouvrir `index.html` dans un navigateur (double-clic). **Aucune connexion internet n'est nécessaire** :
  KaTeX (affichage des formules) est embarqué dans `vendor/katex`.
- Ou bien lancer le petit serveur local : `powershell -ExecutionPolicy Bypass -File tools\serve.ps1`
  puis ouvrir http://localhost:8765/.

## Hors ligne sur tablette

Le site est une application web installable (manifeste + service worker `sw.js`). Une fois ouvert
**une fois** depuis une adresse https, puis ajouté à l'écran d'accueil (Safari : Partager → « Sur
l'écran d'accueil »), il fonctionne entièrement sans connexion.

Après toute modification de fichier, lancer `powershell -ExecutionPolicy Bypass -File tools\maj-hors-ligne.ps1` :
il met à jour la liste des fichiers mis en cache et la version, pour que la tablette récupère la
nouvelle version à la prochaine connexion.

La progression (statuts « À retravailler » / « Maîtrisé », exercices générés, chapitres lus) est
enregistrée **uniquement sur l'appareil** (localStorage). L'accueil permet de la sauvegarder dans un
fichier et de la restaurer.

## Organisation

```
index.html                 page unique, liste des scripts de contenu
css/style.css              mise en page, thème clair/sombre
js/core/registry.js        registre L2 (matières, chapitres)
js/core/mathlib.js         ML : aléatoire reproductible, fractions, matrices, LaTeX, dénombrement
js/content/subjects.js     matières et plans de chapitres
js/content/<matière>/<chapitre>.js   contenu d'un chapitre
js/app.js                  routage et rendu
```

## Ajouter un chapitre

1. Créer `js/content/<matière>/<id-chapitre>.js` sur le modèle d'un chapitre existant, et appeler
   `L2.chapter('<matière>', '<id-chapitre>', { intro, cours, fiche, exercices, methodes, generateurs })`.
   L'identifiant doit correspondre à celui déclaré dans `subjects.js`.
2. Ajouter la balise `<script>` correspondante dans `index.html`.

- **Cours** : blocs `{ t, title, body, proof }` avec `t` parmi `h` (section), `p`, `def`, `thm`, `prop`,
  `lem`, `cor`, `rem`, `ex`, `nota`, `meth`, `warn`, `algo`.
- **Fiche** : items `{ k, t, key, b, prio }` : `key` = l'essentiel (affiché en grand), `b` = complément,
  `prio: true` = rangé dans « À savoir par cœur ». `<mark>` surligne, `<b>` met en gras.
- **Fiches méthodes**, en deux parties :
  1. `plan = { etapes: [{ titre, faire, questions }] }` : plan de travail général du chapitre, suivi des
     méthodes par type d'exercice `{ title, cas, debut, etapes, exemple, pieges, gen }` (`cas` → `debut`) ;
  2. `reperes = [{ etape, si, alors, ex }]` : cas à reconnaître, rangés par étape du plan
     (« si je vois… → j'essaie… »).
- **Exercices** : `{ id, title, diff (1-3), enonce, indication, correction, gen, similaires }`.
  `gen` désigne un générateur du chapitre ; `similaires` est une liste de variantes rédigées
  (utilisée par le bouton « + Un exercice de ce genre » quand il n'y a pas de générateur).
- **Générateurs** : `{ title, diff, make(rng) }` qui renvoie `{ enonce, indication, correction }`.
  `rng` est un générateur aléatoire à graine : un exercice généré est entièrement déterminé par sa graine.
- Les formules s'écrivent en LaTeX entre `$...$` / `$$...$$` (utiliser ``String.raw`...` ``).
  Le code Python s'insère avec `L2.code(...)`.
