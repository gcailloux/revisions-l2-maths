/* Algorithmique — Chapitre 1 : Listes
   (opérations ; listes triées : tris par insertion, sélection, bulles, recherche dichotomique ;
   efficacité d'un algorithme : pire des cas, cas moyen) */
(function () {
  'use strict';
  const R = String.raw;
  const code = L2.code;
  const { binom } = ML;

  /* ------------------------------------------------------------------ */
  /* Codes Python de référence (repris dans le cours et les corrections)   */
  /* ------------------------------------------------------------------ */
  const PY = {
    recherche: `def recherche(t, x):
    """Indice de la première occurrence de x dans t, ou -1."""
    for i in range(len(t)):
        if t[i] == x:
            return i
    return -1`,
    inserer: `def inserer(t, i, x):
    """Insère x à la position i (0 <= i <= len(t))."""
    t.append(None)                  # une case de plus à la fin
    for k in range(len(t) - 1, i, -1):
        t[k] = t[k - 1]             # décalage vers la droite
    t[i] = x`,
    supprimer: `def supprimer(t, i):
    """Supprime l'élément d'indice i (0 <= i < len(t))."""
    for k in range(i, len(t) - 1):
        t[k] = t[k + 1]             # décalage vers la gauche
    t.pop()                         # retire la dernière case`,
    dicho: `def dichotomie(t, x):
    """t triée dans l'ordre croissant. Indice de x dans t, ou -1."""
    g, d = 0, len(t) - 1
    while g <= d:
        m = (g + d) // 2
        if t[m] == x:
            return m
        elif t[m] < x:
            g = m + 1
        else:
            d = m - 1
    return -1`,
    selection: `def tri_selection(t):
    n = len(t)
    for i in range(n - 1):
        imin = i                        # indice du minimum de t[i:]
        for j in range(i + 1, n):
            if t[j] < t[imin]:
                imin = j
        t[i], t[imin] = t[imin], t[i]   # on le place en position i`,
    insertion: `def tri_insertion(t):
    for i in range(1, len(t)):
        x = t[i]                        # élément à insérer dans t[0:i]
        j = i
        while j > 0 and t[j - 1] > x:
            t[j] = t[j - 1]             # décalage vers la droite
            j -= 1
        t[j] = x`,
    bulles: `def tri_bulles(t):
    n = len(t)
    for i in range(n - 1):
        echange = False
        for j in range(n - 1 - i):
            if t[j] > t[j + 1]:
                t[j], t[j + 1] = t[j + 1], t[j]
                echange = True
        if not echange:                 # aucun échange : t est triée
            return`
  };

  /* ------------------------------------------------------------------ */
  /* Simulations exactes (mêmes conventions que les codes ci-dessus)      */
  /* ------------------------------------------------------------------ */
  const L = t => '<code>[' + t.join(', ') + ']</code>';
  function simSelection(t0) {
    const t = t0.slice(), n = t.length, etats = [];
    let comp = 0, ech = 0;
    for (let i = 0; i < n - 1; i++) {
      let imin = i;
      for (let j = i + 1; j < n; j++) { comp++; if (t[j] < t[imin]) imin = j; }
      if (imin !== i) ech++;
      const tmp = t[i]; t[i] = t[imin]; t[imin] = tmp;
      etats.push({ t: t.slice(), info: R`minimum de <code>t[${i}:]</code> : ${t[i]}` + (imin !== i ? ` (échange des positions ${i} et ${imin})` : ' (déjà en place)') });
    }
    return { etats, comp, ech, label: 'tri par sélection', unite: 'échanges effectifs' };
  }
  function simInsertion(t0) {
    const t = t0.slice(), n = t.length, etats = [];
    let comp = 0, dec = 0;
    for (let i = 1; i < n; i++) {
      const x = t[i]; let j = i, d = 0;
      while (j > 0) { comp++; if (t[j - 1] > x) { t[j] = t[j - 1]; j--; d++; } else break; }
      t[j] = x; dec += d;
      etats.push({ t: t.slice(), info: R`insertion de ${x} : ${d} décalage${d > 1 ? 's' : ''}` });
    }
    return { etats, comp, ech: dec, label: 'tri par insertion', unite: 'décalages' };
  }
  function simBulles(t0) {
    const t = t0.slice(), n = t.length, etats = [];
    let comp = 0, ech = 0;
    for (let i = 0; i < n - 1; i++) {
      let e = false, ei = 0;
      for (let j = 0; j < n - 1 - i; j++) {
        comp++;
        if (t[j] > t[j + 1]) { const tmp = t[j]; t[j] = t[j + 1]; t[j + 1] = tmp; e = true; ech++; ei++; }
      }
      etats.push({ t: t.slice(), info: e ? `${ei} échange${ei > 1 ? 's' : ''}` : 'aucun échange : arrêt' });
      if (!e) break;
    }
    return { etats, comp, ech, label: 'tri à bulles', unite: 'échanges' };
  }
  function inversions(t) {
    const inv = [];
    for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) if (t[i] > t[j]) inv.push([t[i], t[j]]);
    return inv;
  }
  function simDicho(t, x) {
    let g = 0, d = t.length - 1; const pas = []; let res = -1;
    while (g <= d) {
      const m = Math.floor((g + d) / 2);
      const p = { g, d, m, v: t[m] };
      if (t[m] === x) { p.act = 'trouvé'; pas.push(p); res = m; break; }
      if (t[m] < x) { p.act = R`<code>t[m] &lt; x</code> : g = ${m + 1}`; g = m + 1; }
      else { p.act = R`<code>t[m] &gt; x</code> : d = ${m - 1}`; d = m - 1; }
      pas.push(p);
    }
    return { pas, res, g, d };
  }
  function randDistinct(r, n, lo, hi) { return r.sample(Array.from({ length: hi - lo + 1 }, (_, k) => lo + k), n); }

  /* ------------------------------------------------------------------ */
  /* Générateurs                                                         */
  /* ------------------------------------------------------------------ */
  const generateurs = {
    triTrace: {
      title: 'Dérouler un tri élémentaire', diff: 1,
      make(r) {
        const algo = r.pick(['selection', 'insertion', 'bulles']);
        const n = r.int(5, 6);
        let t = randDistinct(r, n, 1, 30);
        if (algo === 'bulles' && r.chance(0.3)) { // presque triée : montre l'arrêt anticipé
          t = t.slice().sort((a, b) => a - b); const k = r.int(0, n - 2); const tmp = t[k]; t[k] = t[k + 1]; t[k + 1] = tmp;
        }
        const sim = { selection: simSelection, insertion: simInsertion, bulles: simBulles }[algo](t);
        const rows = sim.etats.map((e, k) => '<tr><td>' + (k + 1) + '</td><td>' + L(e.t) + '</td><td style="text-align:left">' + e.info + '</td></tr>').join('');
        const passe = algo === 'insertion' ? 'chaque tour de la boucle <code>for i</code>' : 'chaque passage dans la boucle externe';
        return {
          enonce: R`<p>On applique le <b>${sim.label}</b> (code du cours) à la liste ${L(t)}.</p><ol><li>Donner l'état de la liste après ${passe}.</li><li>Combien de comparaisons entre éléments sont effectuées ? Combien de ${sim.unite} ?</li></ol>`,
          indication: R`<p>Reprendre le code du cours ligne à ligne. ${algo === 'selection' ? 'À l\'étape i, on cherche le minimum de <code>t[i:]</code>.' : algo === 'insertion' ? 'À l\'étape i, <code>t[0:i]</code> est déjà triée et on y insère <code>t[i]</code>.' : 'À chaque passage, le plus grand élément restant « remonte » à sa place.'}</p>`,
          correction: code(PY[algo]) + R`<table class="t"><tr><th>étape</th><th>liste</th><th>détail</th></tr>${rows}</table>
            <p>Comparaisons : <b>${sim.comp}</b> ; ${sim.unite} : <b>${sim.ech}</b>.</p>` +
            (algo === 'selection' ? R`<p>Le tri par sélection fait toujours $\frac{n(n-1)}{2} = ${n * (n - 1) / 2}$ comparaisons, quelle que soit la liste.</p>`
              : algo === 'insertion' ? R`<p>Le nombre de décalages est égal au nombre d'<b>inversions</b> de la liste de départ (couples mal ordonnés) : ${inversions(t).length}.</p>`
              : R`<p>${sim.etats.length < n - 1 ? 'Le tri s\'arrête dès qu\'un passage ne fait aucun échange : c\'est l\'intérêt de la variable <code>echange</code>.' : 'Chaque échange supprime exactement une inversion : le nombre d\'échanges est le nombre d\'inversions (' + inversions(t).length + ').'}</p>`)
        };
      }
    },

    dicho: {
      title: 'Dérouler une recherche dichotomique', diff: 1,
      make(r) {
        const n = r.int(8, 15);
        const t = []; let v = r.int(1, 9);
        for (let i = 0; i < n; i++) { t.push(v); v += r.int(2, 9); }
        const present = r.chance(0.6);
        let x;
        if (present) x = r.pick(t);
        else { const k = r.int(0, n - 2); x = t[k] + 1 === t[k + 1] ? t[n - 1] + r.int(1, 5) : t[k] + 1; }
        const s = simDicho(t, x);
        const rows = s.pas.map((p, k) => R`<tr><td>${k + 1}</td><td>${p.g}</td><td>${p.d}</td><td>${p.m}</td><td>${p.v}</td><td style="text-align:left">${p.act}</td></tr>`).join('');
        const maxIt = Math.floor(Math.log2(n)) + 1;
        return {
          enonce: R`<p>On exécute <code>dichotomie(t, ${x})</code> (code du cours) avec <code>t = [${t.join(', ')}]</code> (indices $0$ à $${n - 1}$).</p><ol><li>Donner les valeurs successives de <code>g</code>, <code>d</code>, <code>m</code>.</li><li>Quel est le résultat ? Combien de tours de boucle ?</li><li>Combien de tours au maximum pour une liste de cette longueur ?</li></ol>`,
          indication: R`<p><code>m = (g + d) // 2</code> (division entière). Si <code>t[m] &lt; x</code>, on cherche à droite : <code>g = m + 1</code> ; sinon à gauche : <code>d = m - 1</code>.</p>`,
          correction: R`<table class="t"><tr><th>tour</th><th>g</th><th>d</th><th>m</th><th>t[m]</th><th>décision</th></tr>${rows}</table>
            <p>${s.res >= 0 ? R`Résultat : <b>${s.res}</b> (car <code>t[${s.res}] = ${x}</code>), après ${s.pas.length} tour${s.pas.length > 1 ? 's' : ''}.` : R`On sort de la boucle car <code>g = ${s.g} &gt; d = ${s.d}</code> : $${x}$ est absent, résultat <b>-1</b>, après ${s.pas.length} tours.`}</p>
            <p>Au plus $\lfloor \log_2 ${n} \rfloor + 1 = ${maxIt}$ tours pour une liste de longueur $${n}$ (la zone de recherche est au moins divisée par 2 à chaque tour).</p>`
        };
      }
    },

    inversions: {
      title: 'Inversions et tri par insertion', diff: 2,
      make(r) {
        const n = r.int(5, 7);
        const t = randDistinct(r, n, 1, 9);
        const inv = inversions(t);
        const sim = simInsertion(t);
        return {
          enonce: R`<p>Soit la liste ${L(t)}.</p><ol><li>Lister ses inversions (couples d'indices $i < j$ avec <code>t[i] &gt; t[j]</code>).</li><li>En déduire, sans dérouler l'algorithme, le nombre de décalages effectués par le tri par insertion.</li><li>Comparer au nombre moyen de décalages pour une liste de taille $${n}$.</li></ol>`,
          indication: R`<p>Pour chaque élément, compter les éléments plus petits situés à sa droite.</p>`,
          correction: R`<p>1. Inversions (valeurs) : ${inv.length ? inv.map(p => '(' + p[0] + ', ' + p[1] + ')').join(', ') : 'aucune'} : soit <b>${inv.length}</b>.</p>
            <p>2. Chaque décalage du tri par insertion corrige exactement une inversion (l'élément inséré passe devant un élément plus grand situé avant lui). Donc <b>${inv.length} décalages</b> (vérification par simulation : ${sim.ech}).</p>
            <p>3. En moyenne sur toutes les permutations, $\frac{n(n-1)}{4} = ${(n * (n - 1) / 4).toString().replace('.', '{,}')}$ inversions (chaque couple est inversé avec probabilité $\frac12$, et il y a $\binom{${n}}{2} = ${n * (n - 1) / 2}$ couples). Cette liste en a ${inv.length > n * (n - 1) / 4 ? 'plus' : inv.length < n * (n - 1) / 4 ? 'moins' : 'exactement autant'} que la moyenne.</p>`
        };
      }
    },

    couts: {
      title: 'Compter les comparaisons (pire / meilleur / moyen)', diff: 2,
      make(r) {
        const cas = r.pick([
          () => { const n = r.pick([10, 20, 50, 100, 1000]); return { q: R`le <b>tri par sélection</b> d'une liste de $${n}$ éléments`, a: R`Toujours $\frac{n(n-1)}{2} = ${n * (n - 1) / 2}$ comparaisons : les deux boucles s'exécutent entièrement quelle que soit la liste (pire = meilleur = moyen).` }; },
          () => { const n = r.pick([10, 20, 50, 100, 1000]); return { q: R`le <b>tri par insertion</b> d'une liste de $${n}$ éléments <b>déjà triée</b>`, a: R`Meilleur cas : une seule comparaison par élément inséré, soit $n - 1 = ${n - 1}$ comparaisons et aucun décalage : $\Theta(n)$.` }; },
          () => { const n = r.pick([10, 20, 50, 100, 1000]); return { q: R`le <b>tri par insertion</b> d'une liste de $${n}$ éléments <b>triée dans l'ordre décroissant</b>`, a: R`Pire cas : l'élément d'indice $i$ est comparé à tous ceux qui le précèdent, soit $\sum_{i=1}^{n-1} i = \frac{n(n-1)}{2} = ${n * (n - 1) / 2}$ comparaisons (et autant de décalages) : $\Theta(n^2)$.` }; },
          () => { const n = r.pick([10, 20, 50, 100]); return { q: R`le <b>tri à bulles</b> (avec arrêt anticipé) d'une liste de $${n}$ éléments <b>déjà triée</b>`, a: R`Un seul passage sans échange : $n - 1 = ${n - 1}$ comparaisons, puis arrêt : $\Theta(n)$.` }; },
          () => { const n = r.pick([10, 20, 50, 100]); return { q: R`le <b>tri à bulles</b> d'une liste de $${n}$ éléments <b>triée dans l'ordre décroissant</b>`, a: R`$n - 1$ passages complets : $\sum_{i=0}^{n-2}(n-1-i) = \frac{n(n-1)}{2} = ${n * (n - 1) / 2}$ comparaisons et autant d'échanges : $\Theta(n^2)$.` }; },
          () => { const n = r.pick([100, 1000, 5000, 100000, 1000000]); return { q: R`une <b>recherche dichotomique</b> infructueuse dans une liste triée de $${n}$ éléments (nombre maximal de tours de boucle)`, a: R`Au plus $\lfloor\log_2 n\rfloor + 1 = ${Math.floor(Math.log2(n)) + 1}$ tours, contre $${n}$ comparaisons pour une recherche séquentielle.` }; },
          () => { const n = r.pick([10, 100, 1000]); return { q: R`une <b>recherche séquentielle</b> dans une liste de $${n}$ éléments, si l'élément est présent à une position uniformément aléatoire (nombre moyen de comparaisons)`, a: R`$\frac{1 + 2 + \dots + n}{n} = \frac{n+1}{2} = ${((n + 1) / 2).toString().replace('.', '{,}')}$ comparaisons en moyenne ($n$ dans le pire cas).` }; }
        ])();
        return {
          enonce: R`<p>Combien de comparaisons entre éléments effectue ${cas.q} ? Donner aussi l'ordre de grandeur.</p>`,
          indication: R`<p>Identifier le cas (pire, meilleur, moyen) puis compter les tours de la boucle interne pour chaque tour de la boucle externe.</p>`,
          correction: R`<p>${cas.a}</p>`
        };
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Cours                                                               */
  /* ------------------------------------------------------------------ */
  const cours = [
    { t: 'h', title: 'Opérations sur les listes : recherche, insertion, suppression' },
    { t: 'def', title: 'liste', body: R`<p>Une <strong>liste</strong> est une suite finie d'éléments $t_0, t_1, \dots, t_{n-1}$ repérés par leur <strong>indice</strong> (de $0$ à $n - 1$) ; $n$ est sa <strong>longueur</strong>. En Python, une liste <code>t</code> est un <em>tableau dynamique</em> : <code>len(t)</code> donne $n$ et <code>t[i]</code> l'élément d'indice $i$.</p>` },
    { t: 'prop', title: 'coût des opérations de base', body: R`<ul>
        <li>Accès et modification <code>t[i]</code>, longueur <code>len(t)</code> : <b>coût constant</b> $O(1)$.</li>
        <li>Ajout et retrait <b>en fin</b> de liste (<code>t.append(x)</code>, <code>t.pop()</code>) : $O(1)$ (en moyenne, pour <code>append</code>).</li>
        <li>Insertion ou suppression <b>en position $i$</b> : il faut <b>décaler</b> les $n - i$ éléments suivants, coût $\Theta(n - i)$.</li></ul>` },
    { t: 'algo', title: 'recherche séquentielle', body: code(PY.recherche) + R`<p>On parcourt la liste de gauche à droite jusqu'à trouver $x$.</p>` },
    { t: 'prop', body: R`<p>La recherche séquentielle dans une liste de longueur $n$ effectue au plus $n$ comparaisons : <b>$n$ dans le pire cas</b> ($x$ absent ou en dernière position), <b>$1$ dans le meilleur cas</b> ($x$ en tête).</p>`,
      proof: R`<p>La boucle fait au plus $n$ tours, avec une comparaison par tour. Elle s'arrête au premier tour si $t_0 = x$, et fait $n$ tours si $x$ n'apparaît pas.</p>` },
    { t: 'algo', title: 'insertion en position i', body: code(PY.inserer) + R`<p>Les éléments d'indices $i, \dots, n-1$ sont décalés d'un cran vers la droite (en commençant par la fin pour ne rien écraser), puis $x$ est placé en position $i$.</p>` },
    { t: 'algo', title: 'suppression en position i', body: code(PY.supprimer) + R`<p>Les éléments d'indices $i+1, \dots, n-1$ sont décalés d'un cran vers la gauche, puis la dernière case est retirée.</p>` },
    { t: 'prop', body: R`<p>Insertion et suppression en position $i$ dans une liste de longueur $n$ effectuent $n - i$ (resp. $n - 1 - i$) décalages : coût <b>$\Theta(n)$ dans le pire cas</b> ($i = 0$, en tête) et $O(1)$ en fin de liste.</p>`,
      proof: R`<p>Dans <code>inserer</code>, $k$ parcourt $n, n-1, \dots, i+1$ ($n - i$ valeurs, la liste ayant d'abord été allongée à $n + 1$ cases). Dans <code>supprimer</code>, $k$ parcourt $i, \dots, n-2$, soit $n - 1 - i$ valeurs.</p>` },
    { t: 'warn', body: R`<p>Les méthodes Python <code>t.insert(i, x)</code>, <code>t.pop(i)</code>, <code>t.remove(x)</code>, <code>t.index(x)</code> et <code>x in t</code> font exactement ces décalages ou ce parcours : elles coûtent <b>$\Theta(n)$</b>, même si elles s'écrivent en une ligne.</p>` },
    { t: 'rem', title: 'listes chaînées', body: R`<p>Une autre représentation est la <strong>liste chaînée</strong> : chaque élément (maillon) contient une valeur et une référence vers le suivant. L'insertion ou la suppression <b>en tête</b> (ou après un maillon connu) coûte $O(1)$, mais l'accès au $i$-ème élément coûte $\Theta(i)$.</p>` + code(`class Maillon:
    def __init__(self, valeur, suivant=None):
        self.valeur = valeur
        self.suivant = suivant

def inserer_tete(tete, x):
    return Maillon(x, tete)         # O(1) : aucun décalage`) },

    { t: 'h', title: 'Listes triées : tris élémentaires et recherche dichotomique' },
    { t: 'def', body: R`<p>Une liste $t$ de longueur $n$ est <strong>triée</strong> (dans l'ordre croissant) si $t_0 \le t_1 \le \dots \le t_{n-1}$. <strong>Trier</strong> une liste, c'est en permuter les éléments pour qu'elle devienne triée.</p>` },
    { t: 'def', title: 'inversion', body: R`<p>Une <strong>inversion</strong> de $t$ est un couple d'indices $(i, j)$ avec $i < j$ et $t_i > t_j$. Une liste est triée si et seulement si elle n'a aucune inversion. Une liste de longueur $n$ a au plus $\binom n2 = \frac{n(n-1)}{2}$ inversions (liste décroissante).</p>` },
    { t: 'algo', title: 'tri par sélection', body: R`<p>Pour $i = 0, 1, \dots, n-2$ : chercher le <b>minimum</b> de $t_i, \dots, t_{n-1}$ et l'<b>échanger</b> avec $t_i$.</p>` + code(PY.selection) },
    { t: 'thm', title: 'correction et coût du tri par sélection', body: R`<p><b>Invariant</b> : après le tour $i$, $t_0 \le \dots \le t_i$ et ces éléments sont les $i + 1$ plus petits de la liste. Le tri par sélection est donc correct.</p>
      <p>Il effectue <b>toujours</b> $\frac{n(n-1)}{2}$ comparaisons et <b>au plus $n - 1$ échanges</b> : coût $\Theta(n^2)$ dans tous les cas.</p>`,
      proof: R`<p><em>Invariant.</em> Vrai après le tour $0$ : $t_0$ est le minimum de toute la liste. Si c'est vrai après le tour $i - 1$, le tour $i$ place en position $i$ le minimum de $t_i, \dots, t_{n-1}$, c'est-à-dire le plus petit des éléments restants : il est $\ge t_{i-1}$ et les $i + 1$ premiers sont les $i + 1$ plus petits. Après le dernier tour ($i = n - 2$), $t_0 \le \dots \le t_{n-2}$ et $t_{n-1}$ est le plus grand : la liste est triée.</p>
      <p><em>Coût.</em> Au tour $i$, la boucle interne fait $n - 1 - i$ comparaisons : $\sum_{i=0}^{n-2}(n - 1 - i) = \sum_{k=1}^{n-1} k = \frac{n(n-1)}{2}$. Un échange au plus par tour.</p>` },
    { t: 'algo', title: 'tri par insertion', body: R`<p>Pour $i = 1, \dots, n-1$ : la partie $t_0, \dots, t_{i-1}$ est triée ; on y <b>insère</b> $x = t_i$ à sa place en décalant vers la droite les éléments plus grands que $x$.</p>` + code(PY.insertion) },
    { t: 'thm', title: 'correction et coût du tri par insertion', body: R`<p><b>Invariant</b> : au début du tour $i$, $t_0, \dots, t_{i-1}$ est triée (et contient les mêmes éléments qu'au départ). Le tri par insertion est correct.</p>
      <ul><li><b>Pire cas</b> (liste décroissante) : $\frac{n(n-1)}{2}$ comparaisons et décalages, $\Theta(n^2)$.</li>
      <li><b>Meilleur cas</b> (liste déjà triée) : $n - 1$ comparaisons, aucun décalage, $\Theta(n)$.</li>
      <li>Le nombre de décalages est égal au <b>nombre d'inversions</b> de la liste.</li></ul>`,
      proof: R`<p><em>Invariant.</em> Vrai pour $i = 1$ (une liste d'un élément est triée). Au tour $i$, les éléments de $t_0..t_{i-1}$ strictement plus grands que $x$ (qui forment une fin de cette partie triée) sont décalés d'un cran, puis $x$ est placé juste après le dernier élément $\le x$ : $t_0..t_i$ est triée.</p>
      <p><em>Coût.</em> Au tour $i$, on fait au plus $i$ comparaisons (et exactement $i$ si $x$ est plus petit que tous les précédents) : au pire $\sum_{i=1}^{n-1} i = \frac{n(n-1)}{2}$. Si la liste est triée, la première comparaison échoue à chaque tour : $n - 1$ comparaisons.</p>
      <p><em>Inversions.</em> Décaler $t_{j-1} > x$ d'un cran fait passer $x$ devant un élément plus grand situé avant lui : cela supprime exactement une inversion, sans en créer. À la fin il n'y en a plus, donc le nombre de décalages est le nombre d'inversions initial.</p>` },
    { t: 'algo', title: 'tri à bulles', body: R`<p>On parcourt la liste en échangeant deux voisins mal ordonnés ; à chaque passage, le plus grand élément restant « remonte » en fin de liste. On s'arrête après un passage sans échange.</p>` + code(PY.bulles) },
    { t: 'thm', title: 'correction et coût du tri à bulles', body: R`<p><b>Invariant</b> : après le passage $i$, les $i + 1$ derniers éléments sont les plus grands, à leur place définitive. Si un passage ne fait aucun échange, la liste est triée.</p>
      <ul><li><b>Pire cas</b> (liste décroissante) : $\frac{n(n-1)}{2}$ comparaisons et échanges, $\Theta(n^2)$.</li>
      <li><b>Meilleur cas</b> (liste triée) : un seul passage, $n - 1$ comparaisons, $\Theta(n)$.</li>
      <li>Le nombre d'échanges est égal au nombre d'inversions.</li></ul>`,
      proof: R`<p><em>Invariant.</em> Lors du passage $i$, le maximum $M$ de $t_0..t_{n-1-i}$ est échangé avec chacun de ses voisins de droite jusqu'à la position $n - 1 - i$. Si aucun échange n'a lieu, $t_j \le t_{j+1}$ pour tous les $j$ parcourus, et la fin de liste est déjà en place : la liste est triée.</p>
      <p><em>Coût.</em> Le passage $i$ fait $n - 1 - i$ comparaisons ; au pire $n - 1$ passages : $\frac{n(n-1)}{2}$. Chaque échange de deux voisins mal ordonnés supprime exactement une inversion.</p>` },
    { t: 'algo', title: 'recherche dichotomique', body: R`<p>Dans une liste <b>triée</b>, on compare $x$ à l'élément du milieu, puis on recommence dans la moitié gauche ou droite.</p>` + code(PY.dicho) },
    { t: 'thm', title: 'correction et coût de la recherche dichotomique', body: R`<p><b>Invariant</b> : si $x$ est dans $t$, alors $x$ est dans $t_g, \dots, t_d$. L'algorithme termine et est correct.</p>
      <p>Il effectue au plus <b>$\lfloor \log_2 n \rfloor + 1$ tours</b> de boucle : coût $\Theta(\log n)$ dans le pire cas.</p>`,
      proof: R`<p><em>Invariant.</em> Vrai au départ ($g = 0$, $d = n - 1$). Si $t_m < x$, comme la liste est triée, $x$ n'est pas dans $t_0..t_m$ : on peut prendre $g = m + 1$. Symétriquement si $t_m > x$. Si la boucle s'arrête avec $g > d$, la zone est vide : $x$ est absent.</p>
      <p><em>Terminaison et coût.</em> Notons $s = d - g + 1$ la taille de la zone. Après un tour sans succès, la nouvelle taille est au plus $\lfloor s / 2 \rfloor$ (on garde l'une des deux moitiés, privées de $t_m$). Après $k$ tours, $s \le n / 2^k$. La boucle continue tant que $s \ge 1$ ; donc le nombre de tours $k$ vérifie $2^{k-1} \le n$, c'est-à-dire $k \le \lfloor\log_2 n\rfloor + 1$.</p>` },
    { t: 'ex', body: R`<p>Pour $n = 10^6$, la recherche dichotomique fait au plus $20$ tours, contre jusqu'à $10^6$ comparaisons pour la recherche séquentielle. Mais elle exige une liste <b>triée</b>, ce qui coûte un tri au préalable.</p>` },
    { t: 'rem', title: 'stabilité', body: R`<p>Un tri est <strong>stable</strong> s'il conserve l'ordre relatif des éléments égaux. Les tris par insertion et à bulles (avec des comparaisons strictes) sont stables ; le tri par sélection ne l'est pas en général (l'échange peut faire « sauter » un élément par-dessus un élément égal).</p>` },

    { t: 'h', title: 'Efficacité d’un algorithme : pire des cas, cas moyen' },
    { t: 'def', title: 'coût', body: R`<p>Le <strong>coût</strong> d'un algorithme sur une entrée est le nombre d'<b>opérations élémentaires</b> qu'il effectue (comparaisons, affectations, accès à un élément…). On l'exprime en fonction de la <strong>taille</strong> $n$ de l'entrée (ici, la longueur de la liste). Pour comparer des tris, on compte souvent les <b>comparaisons</b> entre éléments.</p>` },
    { t: 'def', title: 'pire cas, meilleur cas, cas moyen', body: R`<p>Pour les entrées de taille $n$ :</p>
      <ul><li>coût dans le <strong>pire des cas</strong> : $C_{\max}(n) = \max$ des coûts ;</li>
      <li>coût dans le <strong>meilleur des cas</strong> : $C_{\min}(n) = \min$ des coûts ;</li>
      <li>coût <strong>moyen</strong> : $C_{\text{moy}}(n) = \sum_e \Proba(e)\,C(e)$, moyenne des coûts pour une loi de probabilité sur les entrées (souvent : toutes les permutations équiprobables).</li></ul>
      <p>On a toujours $C_{\min}(n) \le C_{\text{moy}}(n) \le C_{\max}(n)$.</p>` },
    { t: 'def', title: 'ordres de grandeur', body: R`<p>$f = O(g)$ si $f(n) \le C\,g(n)$ à partir d'un certain rang ; $f = \Theta(g)$ si de plus $f(n) \ge c\,g(n)$ ($c, C > 0$). Hiérarchie : $\log n \ll n \ll n\log n \ll n^2 \ll 2^n$.</p>` },
    { t: 'prop', title: 'recherche séquentielle en moyenne', body: R`<p>Si $x$ est présent, à une position uniformément aléatoire, la recherche séquentielle fait en moyenne $\dfrac{n+1}{2}$ comparaisons.</p>`,
      proof: R`<p>Si $x$ est en position $i$ (probabilité $\frac1n$), on fait $i + 1$ comparaisons : $\frac1n\sum_{i=0}^{n-1}(i + 1) = \frac1n\cdot\frac{n(n+1)}{2} = \frac{n+1}{2}$.</p>` },
    { t: 'thm', title: 'tri par insertion en moyenne', body: R`<p>Si toutes les permutations de $n$ éléments distincts sont équiprobables, le nombre moyen d'inversions, donc de décalages du tri par insertion, est $\dfrac{n(n-1)}{4}$. Le tri par insertion est en $\Theta(n^2)$ <b>en moyenne</b>.</p>`,
      proof: R`<p>Pour chaque couple d'indices $i < j$, notons $X_{ij} = 1$ si $(i, j)$ est une inversion, $0$ sinon. Par symétrie (échanger les valeurs en $i$ et $j$ est une bijection entre permutations), $\Proba(X_{ij} = 1) = \frac12$. Le nombre d'inversions est $\sum_{i \lt j} X_{ij}$, d'espérance $\binom n2\cdot\frac12 = \frac{n(n-1)}{4}$ (linéarité de l'espérance).</p>` },
    { t: 'meth', title: 'récapitulatif', body: R`<table class="t"><tr><th>algorithme</th><th>meilleur cas</th><th>cas moyen</th><th>pire cas</th></tr>
      <tr><td>recherche séquentielle</td><td>$1$</td><td>$\frac{n+1}{2}$ (si présent)</td><td>$n$</td></tr>
      <tr><td>recherche dichotomique</td><td>$1$</td><td>$\Theta(\log n)$</td><td>$\lfloor\log_2 n\rfloor + 1$</td></tr>
      <tr><td>tri par sélection</td><td>$\frac{n(n-1)}{2}$</td><td>$\frac{n(n-1)}{2}$</td><td>$\frac{n(n-1)}{2}$</td></tr>
      <tr><td>tri par insertion</td><td>$n - 1$</td><td>$\sim\frac{n^2}{4}$</td><td>$\frac{n(n-1)}{2}$</td></tr>
      <tr><td>tri à bulles (arrêt anticipé)</td><td>$n - 1$</td><td>$\Theta(n^2)$</td><td>$\frac{n(n-1)}{2}$</td></tr></table>
      <p>(nombre de comparaisons entre éléments)</p>` },
    { t: 'rem', body: R`<p>Ces trois tris élémentaires sont en $\Theta(n^2)$ dans le pire cas. Le chapitre 3 (tris élaborés) présente le tri par tas et le tri rapide, en $\Theta(n\log n)$.</p>` }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche (format cahier)                                               */
  /* ------------------------------------------------------------------ */
  const fiche = [
    { k: 'prop', t: 'Coût des opérations sur une liste Python', prio: true,
      concl: [R`<code>t[i]</code>, <code>len(t)</code>, <code>append</code>, <code>pop()</code> : <u>$O(1)$</u>`, R`Insertion / suppression en position $i$ : $n - i$ décalages, <u>$\Theta(n)$</u> au pire`, R`<code>x in t</code>, <code>index</code>, <code>remove</code>, <code>insert</code> : $\Theta(n)$`] },
    { k: 'prop', t: 'Recherche séquentielle',
      concl: [R`Pire cas : $n$ comparaisons ; meilleur : $1$`, R`Moyenne (présent, position uniforme) : $\dfrac{n+1}{2}$`] },
    { k: 'def', t: 'Liste triée, inversion',
      concl: [R`Triée : $t_0 \le t_1 \le \dots \le t_{n-1}$`, R`Inversion : $i < j$ et <u>$t_i > t_j$</u> ; triée ssi aucune inversion`, R`Au plus $\frac{n(n-1)}{2}$ inversions`] },
    { k: 'thm', t: 'Tri par sélection',
      hyp: R`Tour $i$ : minimum de $t_i..t_{n-1}$ échangé avec $t_i$`,
      concl: [R`<u>Toujours</u> $\frac{n(n-1)}{2}$ comparaisons, $\le n - 1$ échanges`, R`Invariant : $t_0..t_i$ triés = les $i+1$ plus petits`] },
    { k: 'thm', t: 'Tri par insertion', prio: true,
      hyp: R`Tour $i$ : insérer $t_i$ dans $t_0..t_{i-1}$ déjà triée`,
      concl: [R`Pire (décroissante) : $\frac{n(n-1)}{2}$ ; <u>meilleur (triée) : $n - 1$</u>`, R`Décalages = <u>nombre d'inversions</u> ; moyenne $\frac{n(n-1)}{4}$`] },
    { k: 'thm', t: 'Tri à bulles',
      hyp: R`Échanges de voisins mal ordonnés ; arrêt si un passage sans échange`,
      concl: [R`Pire : $\frac{n(n-1)}{2}$ ; meilleur : $n - 1$`, R`Invariant : après le passage $i$, les $i+1$ plus grands sont à leur place`] },
    { k: 'thm', t: 'Recherche dichotomique', prio: true,
      hyp: R`Liste <u>triée</u> ; $m = (g + d) /\!/ 2$`,
      concl: [R`Au plus <u>$\lfloor\log_2 n\rfloor + 1$</u> tours : $\Theta(\log n)$`, R`Invariant : si $x \in t$ alors $x \in t_g..t_d$`] },
    { k: 'def', t: 'Pire cas, meilleur cas, cas moyen', prio: true,
      concl: [R`$C_{\max}(n)$, $C_{\min}(n)$ : max et min sur les entrées de taille $n$`, R`$C_{\text{moy}}(n) = \sum_e \Proba(e)\,C(e)$`, R`$C_{\min} \le C_{\text{moy}} \le C_{\max}$`] },
    { k: 'meth', t: 'Prouver un algorithme',
      concl: [R`<b>Invariant</b> : vrai au départ, conservé par un tour, utile à la fin`, R`<b>Terminaison</b> : une quantité entière $\ge 0$ qui décroît strictement ($d - g$…)`] },
    { k: 'form', t: 'Sommes utiles',
      concl: [R`$\sum_{i=1}^{n-1} i = \frac{n(n-1)}{2}$`, R`$\binom n2 = \frac{n(n-1)}{2}$ couples ; $2^{k} > n \iff k > \log_2 n$`] },
    { k: 'warn', t: 'Pièges',
      concl: [R`Dichotomie sur une liste <b>non triée</b> : résultat faux`, R`Décaler de gauche à droite en insertion : on écrase les valeurs`, R`Une ligne Python ≠ coût constant (<code>insert</code>, <code>remove</code>, <code>in</code>)`] }
  ];

  /* ------------------------------------------------------------------ */
  /* Exercices                                                           */
  /* ------------------------------------------------------------------ */
  const exercices = [
    {
      id: 'selection', title: 'Dérouler le tri par sélection', diff: 1, gen: 'triTrace',
      enonce: R`<p>Appliquer le tri par sélection à <code>[5, 2, 8, 1, 9, 3]</code> en donnant l'état de la liste après chaque tour de la boucle externe. Combien de comparaisons et d'échanges effectifs ?</p>`,
      correction: R`<table class="t"><tr><th>i</th><th>minimum de t[i:]</th><th>liste</th></tr>
        <tr><td>0</td><td>1 (indice 3)</td><td><code>[1, 2, 8, 5, 9, 3]</code></td></tr>
        <tr><td>1</td><td>2 (déjà en place)</td><td><code>[1, 2, 8, 5, 9, 3]</code></td></tr>
        <tr><td>2</td><td>3 (indice 5)</td><td><code>[1, 2, 3, 5, 9, 8]</code></td></tr>
        <tr><td>3</td><td>5 (déjà en place)</td><td><code>[1, 2, 3, 5, 9, 8]</code></td></tr>
        <tr><td>4</td><td>8 (indice 5)</td><td><code>[1, 2, 3, 5, 8, 9]</code></td></tr></table>
        <p>Comparaisons : $5 + 4 + 3 + 2 + 1 = 15 = \frac{6 \times 5}{2}$. Échanges effectifs : $3$ (aux tours 0, 2 et 4).</p>`
    },
    {
      id: 'insertion', title: 'Tri par insertion et inversions', diff: 2, gen: 'inversions',
      enonce: R`<p>Soit <code>t = [4, 1, 3, 5, 2]</code>.</p><ol><li>Dérouler le tri par insertion (état après chaque tour) en comptant décalages et comparaisons.</li><li>Compter les inversions de <code>t</code>. Que constate-t-on ?</li></ol>`,
      correction: R`<table class="t"><tr><th>i</th><th>x</th><th>décalages</th><th>comparaisons</th><th>liste</th></tr>
        <tr><td>1</td><td>1</td><td>1</td><td>1</td><td><code>[1, 4, 3, 5, 2]</code></td></tr>
        <tr><td>2</td><td>3</td><td>1</td><td>2</td><td><code>[1, 3, 4, 5, 2]</code></td></tr>
        <tr><td>3</td><td>5</td><td>0</td><td>1</td><td><code>[1, 3, 4, 5, 2]</code></td></tr>
        <tr><td>4</td><td>2</td><td>3</td><td>4</td><td><code>[1, 2, 3, 4, 5]</code></td></tr></table>
        <p>Total : $5$ décalages, $8$ comparaisons.</p>
        <p>Inversions : $(4,1), (4,3), (4,2), (3,2), (5,2)$, soit $5$ : <b>autant que de décalages</b>, comme le prévoit le cours (chaque décalage supprime une inversion).</p>`
    },
    {
      id: 'dicho', title: 'Dérouler une recherche dichotomique', diff: 1, gen: 'dicho',
      enonce: R`<p>Avec <code>t = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]</code>, dérouler <code>dichotomie(t, 23)</code> puis <code>dichotomie(t, 10)</code> (valeurs de <code>g</code>, <code>d</code>, <code>m</code>).</p>`,
      correction: R`<p><b>x = 23</b> : $(g, d, m) = (0, 9, 4)$, $t_4 = 16 < 23$ → $g = 5$ ; $(5, 9, 7)$, $t_7 = 56 > 23$ → $d = 6$ ; $(5, 6, 5)$, $t_5 = 23$ : <b>trouvé, résultat 5</b> en 3 tours.</p>
        <p><b>x = 10</b> : $(0, 9, 4)$, $16 > 10$ → $d = 3$ ; $(0, 3, 1)$, $5 < 10$ → $g = 2$ ; $(2, 3, 2)$, $8 < 10$ → $g = 3$ ; $(3, 3, 3)$, $12 > 10$ → $d = 2$ ; $g > d$ : <b>absent, résultat −1</b> en 4 tours $= \lfloor\log_2 10\rfloor + 1$.</p>`
    },
    {
      id: 'couts', title: 'Pire cas et meilleur cas', diff: 2, gen: 'couts',
      enonce: R`<p>Pour chacun des trois tris élémentaires, donner une liste de taille $n$ réalisant le <b>meilleur cas</b> et une réalisant le <b>pire cas</b> (en nombre de comparaisons), et le nombre de comparaisons correspondant.</p>`,
      correction: R`<ul><li><b>Sélection</b> : pas de meilleur ni de pire cas, toujours $\frac{n(n-1)}{2}$ comparaisons.</li>
        <li><b>Insertion</b> : meilleur cas = liste triée ($n - 1$) ; pire cas = liste décroissante ($\frac{n(n-1)}{2}$).</li>
        <li><b>Bulles</b> (avec arrêt) : meilleur cas = liste triée ($n - 1$, un passage) ; pire cas = liste décroissante ($\frac{n(n-1)}{2}$). Attention : <code>[2, 3, 4, …, n, 1]</code> demande aussi $n - 1$ passages, car le petit élément en fin ne recule que d'une case par passage.</li></ul>`
    },
    {
      id: 'supprimer-valeur', title: 'Supprimer toutes les occurrences', diff: 2,
      enonce: R`<p>On veut supprimer toutes les occurrences de <code>x</code> dans <code>t</code>.</p><ol><li>Quel est le coût, dans le pire cas, de la boucle <code>while x in t: t.remove(x)</code> ?</li><li>Écrire une fonction en $\Theta(n)$ qui modifie <code>t</code> en place.</li></ol>`,
      indication: R`<p>Parcourir <code>t</code> avec un indice de lecture <code>i</code> et un indice d'écriture <code>k</code>.</p>`,
      correction: R`<p>1. Chaque <code>x in t</code> et chaque <code>remove</code> coûtent $\Theta(n)$. Si <code>t</code> ne contient que des <code>x</code>, on fait $n$ tours : $\Theta(n^2)$.</p>` + code(`def supprimer_valeur(t, x):
    k = 0                       # t[0:k] contient les éléments conservés
    for i in range(len(t)):
        if t[i] != x:
            t[k] = t[i]
            k += 1
    while len(t) > k:           # on retire les cases en trop, en fin : O(1) chacune
        t.pop()`) + R`<p>2. Un seul parcours et des retraits en fin : $\Theta(n)$. Invariant : <code>t[0:k]</code> contient, dans l'ordre, les éléments différents de <code>x</code> parmi <code>t[0:i]</code>.</p>`,
      similaires: [
        {
          title: 'Supprimer les doublons d’une liste triée',
          enonce: R`<p>Écrire en $\Theta(n)$ une fonction qui supprime les doublons d'une liste <b>triée</b> (chaque valeur ne doit apparaître qu'une fois).</p>`,
          correction: code(`def sans_doublons(t):
    if not t:
        return
    k = 1                       # t[0:k] : valeurs distinctes déjà vues
    for i in range(1, len(t)):
        if t[i] != t[k - 1]:    # liste triée : les égaux sont voisins
            t[k] = t[i]
            k += 1
    while len(t) > k:
        t.pop()`) + R`<p>Comme la liste est triée, il suffit de comparer à la dernière valeur conservée.</p>`
        }
      ]
    },
    {
      id: 'inserer-trie', title: 'Insérer dans une liste triée', diff: 2,
      enonce: R`<p>Écrire <code>inserer_trie(t, x)</code> qui insère <code>x</code> dans la liste triée <code>t</code> de façon qu'elle reste triée. Quel est son coût ? En déduire une autre écriture du tri par insertion.</p>`,
      correction: code(`def inserer_trie(t, x):
    t.append(x)
    j = len(t) - 1
    while j > 0 and t[j - 1] > x:
        t[j] = t[j - 1]
        j -= 1
    t[j] = x`) + R`<p>Coût : au plus $n$ comparaisons et décalages, $\Theta(n)$ dans le pire cas (même si l'on cherchait la position par dichotomie en $\Theta(\log n)$, les décalages restent en $\Theta(n)$).</p>
        <p>Tri par insertion : partir d'une liste vide <code>r</code> et y insérer successivement chaque élément avec <code>inserer_trie(r, x)</code> : c'est exactement l'algorithme du cours.</p>`
    },
    {
      id: 'invariant', title: 'Prouver le tri par sélection', diff: 2,
      enonce: R`<p>Montrer par un invariant de boucle que la fonction <code>tri_selection</code> du cours trie la liste. Justifier aussi que la boucle interne calcule bien l'indice du minimum de <code>t[i:]</code>.</p>`,
      correction: R`<p><b>Boucle interne</b> (pour $i$ fixé) : invariant « <code>t[imin]</code> est le minimum de <code>t[i:j]</code> ». Vrai pour $j = i + 1$ ; si <code>t[j] &lt; t[imin]</code>, on met à jour <code>imin = j</code>, sinon le minimum ne change pas. En sortie ($j = n$), <code>t[imin]</code> est le minimum de <code>t[i:]</code>.</p>
        <p><b>Boucle externe</b> : invariant $P(i)$ « après le tour $i$, $t_0 \le \dots \le t_i$ et ce sont les $i + 1$ plus petits éléments ». Le tour $i$ place en position $i$ le minimum des éléments restants, qui est $\ge$ tous ceux déjà placés : $P(i)$ est vrai. Après le tour $n - 2$, il ne reste que $t_{n-1}$, le plus grand : la liste est triée. Les échanges ne font que permuter les éléments.</p>`,
      similaires: [
        {
          title: 'Prouver la recherche dichotomique',
          enonce: R`<p>Prouver la terminaison et la correction de <code>dichotomie</code> : on donnera un invariant et une quantité entière qui décroît strictement.</p>`,
          correction: R`<p><b>Terminaison</b> : $d - g + 1 \ge 0$ diminue strictement à chaque tour sans succès (on remplace $g$ par $m + 1 > g$ ou $d$ par $m - 1 < d$, avec $g \le m \le d$).</p>
            <p><b>Correction</b> : invariant « si $x \in t$, alors $x \in t[g..d]$ ». Si l'on renvoie $m$, c'est que $t_m = x$. Si l'on sort avec $g > d$, la zone est vide, donc $x \notin t$ : renvoyer $-1$ est correct.</p>`
        }
      ]
    },
    {
      id: 'moyenne', title: 'Coût moyen d’une recherche', diff: 3,
      enonce: R`<p>On cherche $x$ dans une liste de $n$ éléments distincts par recherche séquentielle. $x$ est présent avec probabilité $p$, et dans ce cas sa position est uniforme. Calculer le nombre moyen de comparaisons. Que vaut-il pour $p = 1$, $p = 0$, $p = \frac12$ ?</p>`,
      correction: R`<p>Si $x$ est présent (probabilité $p$) : en moyenne $\frac{n+1}{2}$ comparaisons. S'il est absent (probabilité $1 - p$) : $n$ comparaisons. Par la formule des probabilités totales :</p>
        $$C_{\text{moy}}(n) = p\,\frac{n+1}{2} + (1 - p)\,n.$$
        <p>$p = 1$ : $\frac{n+1}{2}$ ; $p = 0$ : $n$ (pire cas) ; $p = \frac12$ : $\frac{n+1}{4} + \frac n2 = \frac{3n+1}{4}$.</p>`
    },
    {
      id: 'premiere', title: 'Première occurrence par dichotomie', diff: 3, gen: 'dicho',
      enonce: R`<p>La liste triée <code>t</code> peut contenir des doublons. Écrire une recherche dichotomique qui renvoie l'indice de la <b>première</b> occurrence de <code>x</code> (ou $-1$), en $\Theta(\log n)$.</p>`,
      indication: R`<p>Maintenir l'invariant : <code>t[:g]</code> $< x$ et <code>t[d:]</code> $\ge x$.</p>`,
      correction: code(`def premiere_occurrence(t, x):
    g, d = 0, len(t)            # invariant : t[:g] < x <= t[d:]
    while g < d:
        m = (g + d) // 2
        if t[m] < x:
            g = m + 1
        else:
            d = m
    if g < len(t) and t[g] == x:
        return g
    return -1`) + R`<p>À la fin $g = d$ : tous les éléments avant $g$ sont $< x$ et <code>t[g]</code> (s'il existe) est le premier élément $\ge x$. La zone <code>[g, d)</code> est au moins divisée par 2 à chaque tour : $\Theta(\log n)$ tours.</p>`
    },
    {
      id: 'fusion', title: 'Fusionner deux listes triées', diff: 2,
      enonce: R`<p>Écrire <code>fusion(a, b)</code> qui renvoie la liste triée contenant les éléments de deux listes triées <code>a</code> (longueur $n$) et <code>b</code> (longueur $m$), en $\Theta(n + m)$. Combien de comparaisons au plus ?</p>`,
      correction: code(`def fusion(a, b):
    i, j, r = 0, 0, []
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            r.append(a[i]); i += 1
        else:
            r.append(b[j]); j += 1
    r.extend(a[i:])             # il reste au plus une des deux listes
    r.extend(b[j:])
    return r`) + R`<p>Chaque comparaison place un élément dans <code>r</code>, et la dernière liste restante est recopiée sans comparaison : au plus $n + m - 1$ comparaisons, $\Theta(n + m)$ au total.</p>`
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiches méthodes                                                     */
  /* ------------------------------------------------------------------ */
  const methodes = [
    {
      title: 'Dérouler un algorithme sur un exemple', gen: 'triTrace',
      cas: R`« Donner l'état de la liste après chaque étape »`, debut: R`Recopier le code, puis faire un <b>tableau</b> : une ligne par tour de la boucle externe, une colonne par variable.`,
      etapes: [
        R`Repérer la <b>boucle externe</b> et ce qu'elle garantit (invariant) : c'est elle qui définit « une étape ».`,
        R`Pour chaque tour, noter les variables (<code>i</code>, <code>imin</code>, <code>j</code>, <code>g</code>, <code>d</code>, <code>m</code>…) et l'état de la liste.`,
        R`Compter au fur et à mesure les <b>comparaisons</b> et les échanges / décalages.`,
        R`Vérifier avec l'invariant (ex. : après le tour $i$ du tri par sélection, les $i + 1$ premiers sont les plus petits) et avec les formules du cours.`
      ],
      exemple: {
        enonce: R`<p>Tri à bulles de <code>[3, 1, 4, 2]</code>.</p>`,
        solution: R`<p>Passage 0 : <code>[1, 3, 4, 2]</code> → <code>[1, 3, 2, 4]</code> (2 échanges, 3 comparaisons). Passage 1 : <code>[1, 2, 3, 4]</code> (1 échange, 2 comparaisons). Passage 2 : aucun échange (1 comparaison) → arrêt. Total 6 comparaisons, 3 échanges = 3 inversions.</p>`
      },
      pieges: [R`Confondre l'indice et la valeur.`, R`Oublier qu'en Python <code>range(a, b)</code> s'arrête à $b - 1$.`]
    },
    {
      title: 'Compter les comparaisons (pire, meilleur, moyen)', gen: 'couts',
      cas: R`« Quel est le coût de… dans le pire des cas / en moyenne ? »`, debut: R`Fixer le <b>tour $i$</b> de la boucle externe et compter les tours de la boucle interne, puis <b>sommer</b> sur $i$.`,
      etapes: [
        R`Choisir l'opération comptée (en général les <b>comparaisons</b> entre éléments).`,
        R`Pour le pire / meilleur cas : trouver une entrée qui maximise / minimise les tours de la boucle interne (liste décroissante, liste triée…).`,
        R`Écrire le total comme une somme $\sum_i (\ldots)$ et la calculer ($\sum_{i=1}^{n-1} i = \frac{n(n-1)}{2}$).`,
        R`Pour le cas moyen : exprimer le coût avec une variable aléatoire (position de $x$, nombre d'inversions) et utiliser la <b>linéarité de l'espérance</b>.`
      ],
      exemple: {
        enonce: R`<p>Nombre moyen de décalages du tri par insertion sur une permutation aléatoire de $n$ éléments.</p>`,
        solution: R`<p>Décalages = inversions $= \sum_{i \lt j} X_{ij}$ avec $\Proba(X_{ij} = 1) = \frac12$, d'où $\binom n2 \cdot \frac12 = \frac{n(n-1)}{4}$.</p>`
      },
      pieges: [R`Donner le pire cas quand on demande la moyenne (ou l'inverse).`, R`Oublier que la recherche séquentielle s'arrête dès qu'elle trouve.`]
    },
    {
      title: 'Prouver la correction d’un algorithme (invariant)', gen: 'triTrace',
      cas: R`« Montrer que l'algorithme trie la liste / renvoie le bon résultat »`, debut: R`Énoncer un <b>invariant de boucle</b> : une propriété vraie au début et conservée par chaque tour.`,
      etapes: [
        R`<b>Formuler</b> l'invariant (ce que la boucle a déjà accompli) : « <code>t[0:i]</code> est triée », « si $x \in t$ alors $x \in t[g..d]$ »…`,
        R`<b>Initialisation</b> : il est vrai avant le premier tour.`,
        R`<b>Conservation</b> : s'il est vrai au début d'un tour, il l'est à la fin.`,
        R`<b>Conclusion</b> : en sortie de boucle, invariant + condition d'arrêt donnent le résultat.`,
        R`<b>Terminaison</b> (boucle <code>while</code>) : une quantité entière positive qui décroît strictement.`
      ],
      exemple: {
        enonce: R`<p>Invariant du tri par insertion.</p>`,
        solution: R`<p>« Au début du tour $i$, <code>t[0:i]</code> est triée. » Vrai pour $i = 1$ ; le tour $i$ insère $t_i$ à sa place dans cette partie triée ; à la sortie ($i = n$), <code>t[0:n]</code> est triée.</p>`
      }
    },
    {
      title: 'Choisir la bonne méthode de recherche ou de tri', gen: 'dicho',
      cas: R`« Quel algorithme utiliser ? », données triées ou non, nombreuses recherches…`, debut: R`Se demander : la liste est-elle <b>triée</b> ? <b>Combien</b> de recherches ? Quelle <b>taille</b> ?`,
      etapes: [
        R`Liste triée : <b>dichotomie</b>, $\Theta(\log n)$.`,
        R`Liste non triée et une seule recherche : <b>séquentielle</b>, $\Theta(n)$ (trier coûterait plus cher).`,
        R`Beaucoup de recherches : trier d'abord, puis dichotomie.`,
        R`Liste presque triée : <b>tri par insertion</b> (proche de $\Theta(n)$) ; sinon, pour de grandes tailles, un tri en $\Theta(n\log n)$ (chapitre 3).`
      ],
      exemple: {
        enonce: R`<p>$k$ recherches dans une liste non triée de taille $n$ : trier par insertion puis dichotomie, ou $k$ recherches séquentielles ?</p>`,
        solution: R`<p>Séquentiel : $\Theta(kn)$. Tri + dichotomies : $\Theta(n^2 + k\log n)$ avec un tri élémentaire. Avantageux seulement si $k$ est de l'ordre de $n$ ou plus (et bien plus tôt avec un tri en $n\log n$).</p>`
      }
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche méthode, partie 1 : plan de travail ; partie 2 : cas à reconnaître */
  /* ------------------------------------------------------------------ */
  const plan = {
    etapes: [
      { titre: 'Comprendre le problème', faire: R`Préciser l'<b>entrée</b> (liste triée ou non ? doublons ?) et la <b>sortie</b> attendue (indice, liste modifiée en place, nouvelle liste ?).`,
        questions: [R`La liste peut-elle être vide ?`, R`Doit-on modifier <code>t</code> ou en renvoyer une copie ?`] },
      { titre: 'Choisir ou écrire l’algorithme', faire: R`Reconnaître un schéma connu (recherche, insertion, tri, dichotomie, fusion) ; écrire le code avec des <b>indices</b> explicites.` },
      { titre: 'Dérouler sur un exemple', faire: R`Faire un <b>tableau</b> des variables tour par tour sur une petite liste ; vérifier les cas limites (liste vide, un élément, élément absent).` },
      { titre: 'Prouver', faire: R`<b>Invariant</b> de boucle (initialisation, conservation, conclusion) et <b>terminaison</b>.` },
      { titre: 'Évaluer le coût', faire: R`Compter les comparaisons : <b>pire cas</b>, meilleur cas, <b>moyenne</b> ; conclure par un ordre de grandeur ($\Theta$).` }
    ]
  };
  const reperes = [
    { etape: 1, si: R`« Liste triée » dans l'énoncé`, alors: R`Penser <b>dichotomie</b> (recherche en $\Theta(\log n)$) ou à exploiter que les égaux sont <b>voisins</b>.` },
    { etape: 1, si: R`« En place », « modifier la liste »`, alors: R`Ne pas créer de nouvelle liste : travailler avec des <b>indices</b> et des échanges <code>t[i], t[j] = t[j], t[i]</code>.` },
    { etape: 2, si: R`Insérer ou supprimer au milieu d'une liste`, alors: R`<b>Décaler</b> : vers la droite en partant de la <b>fin</b> (insertion), vers la gauche en partant de $i$ (suppression).` },
    { etape: 2, si: R`Supprimer ou filtrer plusieurs éléments`, alors: R`Deux indices : un de <b>lecture</b> <code>i</code>, un d'<b>écriture</b> <code>k</code> ; un seul parcours, $\Theta(n)$.` },
    { etape: 2, si: R`Combiner deux listes triées`, alors: R`<b>Fusion</b> avec deux indices qui avancent : $\Theta(n + m)$.` },
    { etape: 3, si: R`Une boucle <code>while</code> avec <code>g</code>, <code>d</code>`, alors: R`Tableau $(g, d, m, t_m)$ ; s'arrêter quand <b>$g > d$</b> (élément absent).` },
    { etape: 3, si: R`Un doute sur les bornes de <code>range</code>`, alors: R`<code>range(a, b)</code> va de $a$ à <b>$b - 1$</b> ; <code>range(n - 1, i, -1)</code> descend jusqu'à $i + 1$.` },
    { etape: 4, si: R`Une boucle <code>for</code> qui construit le résultat petit à petit`, alors: R`Invariant du type « <b><code>t[0:i]</code> est triée</b> » ou « <code>t[0:k]</code> contient les éléments déjà traités ».` },
    { etape: 4, si: R`Une boucle <code>while</code> (dichotomie…)`, alors: R`<b>Terminaison</b> : $d - g$ décroît strictement ; <b>invariant</b> : « si $x \in t$, alors $x \in t[g..d]$ ».` },
    { etape: 5, si: R`Deux boucles imbriquées, la boucle interne dépendant de $i$`, alors: R`Coût $= \sum_i (\text{tours internes})$, souvent <b>$\frac{n(n-1)}{2}$</b>.` },
    { etape: 5, si: R`La zone de recherche est divisée par 2 à chaque tour`, alors: R`<b>$\lfloor\log_2 n\rfloor + 1$</b> tours au plus.` },
    { etape: 5, si: R`Des échanges ou décalages de <b>voisins</b>`, alors: R`Leur nombre est le <b>nombre d'inversions</b> ; en moyenne $\frac{n(n-1)}{4}$.` },
    { etape: 5, si: R`Une méthode Python « magique » (<code>in</code>, <code>remove</code>, <code>insert</code>, <code>index</code>)`, alors: R`Elle cache un parcours : compter <b>$\Theta(n)$</b>.` }
  ];

  L2.chapter('algo', 'listes', {
    intro: R`<p>Les listes sont la structure de base pour stocker une suite de valeurs. On étudie le coût des opérations élémentaires (recherche, insertion, suppression), puis le cas des listes <b>triées</b> : trois tris élémentaires et la recherche dichotomique. On termine par la notion d'efficacité d'un algorithme : pire des cas et cas moyen. Le code est écrit en Python.</p>`,
    cours, fiche, exercices, methodes, generateurs, plan, reperes
  });
})();
