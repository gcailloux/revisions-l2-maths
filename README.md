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
- Vérifier le contenu d'un chapitre (développement) : dans la console du navigateur, sur le site local,
  charger `tools/verif-contenu.js` puis lancer `await verifChapitre('probas', 'denombrement', 100)` :
  erreurs de formules, valeurs indéfinies et corrections détaillées manquantes, y compris pour les
  exercices générés.

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

## Copier un exercice

Chaque exercice a un bouton **Copier** : il met dans le presse-papiers une **image** de l'énoncé
(et de la correction si elle est affichée), à coller dans une appli de brouillon (GoodNotes,
Notability, Freeform, Notes…), ainsi qu'une version **texte** avec les formules en LaTeX.
Si le navigateur refuse la copie d'image, il propose de partager ou d'enregistrer l'image.
La capture utilise `vendor/html-to-image` (embarqué, fonctionne hors ligne).

Le cache hors ligne n'est pas activé sur le serveur de test local (localhost), pour que les
modifications s'affichent immédiatement.

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

- **Cours** : blocs `{ t, title, body, proof }` avec `t` parmi `h` (partie numérotée 1, 2…), `h2`
  (sous-partie numérotée 1.1, 1.2…), `p`, `def`, `thm`, `prop`, `lem`, `cor`, `rem`, `ex`, `nota`, `meth`,
  `warn`, `algo`.
- **Fiche** (format cahier) : items `{ k, t, hyp, concl: [...], b, prio }` (hypothèses, conclusions à puces,
  complément ; `prio: true` = à savoir par cœur), ou `{ part: 'titre' }` pour un intertitre de partie.
  `<u>` souligne en rouge, `<mark>` surligne.
- **Fiches méthodes**, en deux parties :
  1. `plan = { etapes: [{ titre, faire, questions }] }` : plan de travail général du chapitre, suivi des
     méthodes par type d'exercice `{ title, cas, debut, etapes, exemple, pieges, gen }` (`cas` → `debut`) ;
  2. `reperes = [{ etape, si, alors, ex }]` : cas à reconnaître, rangés par étape du plan
     (« si je vois… → j'essaie… »).
- **Exercices** : `{ id, title, diff (1-3), enonce, indication, correction, gen, similaires }`.
  `gen` désigne un générateur du chapitre ; `similaires` est une liste de variantes rédigées
  (utilisée par le bouton « + Un exercice de ce genre » quand il n'y a pas de générateur).
- **Correction détaillée** (bouton « Correction détaillée ») : objet `{ but, methode, etapes: [...], retenir }`
  (ou chaîne HTML). Pour un exercice rédigé, il se place dans le dictionnaire `details` du chapitre
  (`details[id]`, `details[id + '#n']` pour la n-ième variante) ou dans le champ `detail` de l'exercice ;
  un générateur le renvoie dans `detail`.
- **Générateurs** : `{ title, diff, make(rng) }` qui renvoie `{ enonce, indication, correction, detail }`.
  `rng` est un générateur aléatoire à graine : un exercice généré est entièrement déterminé par sa graine.
- Les formules s'écrivent en LaTeX entre `$...$` / `$$...$$` (utiliser ``String.raw`...` ``).
  Le code Python s'insère avec `L2.code(...)`.
