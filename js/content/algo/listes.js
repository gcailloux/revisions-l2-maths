/* Algorithmique — Chapitre 1 : Listes  (algorithmes en PSEUDO-CODE)
   (opérations ; listes triées : tris par insertion, sélection, bulles, recherche dichotomique ;
   efficacité d'un algorithme : pire des cas, cas moyen) */
(function () {
  'use strict';
  const R = String.raw;
  const algo = L2.algo;

  /* ------------------------------------------------------------------ */
  /* Algorithmes de référence en pseudo-code (cours et corrections)      */
  /* ------------------------------------------------------------------ */
  const PS = {
    recherche: `fonction recherche(t, x)
    n ← longueur(t)
    pour i de 0 à n − 1 faire
        si t[i] = x alors
            retourner i
        fin si
    fin pour
    retourner −1
fin fonction`,
    inserer: `procédure insérer(t, i, x)          // 0 ≤ i ≤ n
    n ← longueur(t)
    ajouter_fin(t, x)                   // t a maintenant n + 1 cases
    pour k de n à i + 1 par pas de −1 faire
        t[k] ← t[k − 1]                 // décalage vers la droite
    fin pour
    t[i] ← x
fin procédure`,
    supprimer: `procédure supprimer(t, i)            // 0 ≤ i ≤ n − 1
    n ← longueur(t)
    pour k de i à n − 2 faire
        t[k] ← t[k + 1]                 // décalage vers la gauche
    fin pour
    retirer_fin(t)                      // supprime la dernière case
fin procédure`,
    dicho: `fonction dichotomie(t, x)            // t triée dans l'ordre croissant
    g ← 0
    d ← longueur(t) − 1
    tant que g ≤ d faire
        m ← ⌊(g + d) / 2⌋
        si t[m] = x alors
            retourner m
        sinon si t[m] < x alors
            g ← m + 1
        sinon
            d ← m − 1
        fin si
    fin tant que
    retourner −1
fin fonction`,
    selection: `procédure tri_sélection(t)
    n ← longueur(t)
    pour i de 0 à n − 2 faire
        imin ← i                        // indice du minimum de t[i..n−1]
        pour j de i + 1 à n − 1 faire
            si t[j] < t[imin] alors
                imin ← j
            fin si
        fin pour
        échanger(t[i], t[imin])         // on le place en position i
    fin pour
fin procédure`,
    insertion: `procédure tri_insertion(t)
    n ← longueur(t)
    pour i de 1 à n − 1 faire
        x ← t[i]                        // élément à insérer dans t[0..i−1]
        j ← i
        tant que j > 0 et t[j − 1] > x faire
            t[j] ← t[j − 1]             // décalage vers la droite
            j ← j − 1
        fin tant que
        t[j] ← x
    fin pour
fin procédure`,
    bulles: `procédure tri_bulles(t)
    n ← longueur(t)
    pour i de 0 à n − 2 faire
        échange ← faux
        pour j de 0 à n − 2 − i faire
            si t[j] > t[j + 1] alors
                échanger(t[j], t[j + 1])
                échange ← vrai
            fin si
        fin pour
        si non échange alors
            retourner                   // aucun échange : t est triée
        fin si
    fin pour
fin procédure`
  };

  /* ------------------------------------------------------------------ */
  /* Simulations exactes (mêmes conventions que le pseudo-code)          */
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
      etats.push({ t: t.slice(), info: `minimum de t[${i}..${n - 1}] : ${t[i]}` + (imin !== i ? ` (échange des positions ${i} et ${imin})` : ' (déjà en place)') });
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
      etats.push({ t: t.slice(), info: `insertion de ${x} : ${d} décalage${d > 1 ? 's' : ''}` });
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
      if (t[m] < x) { p.act = `t[m] &lt; x : g ← ${m + 1}`; g = m + 1; }
      else { p.act = `t[m] &gt; x : d ← ${m - 1}`; d = m - 1; }
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
        const al = r.pick(['selection', 'insertion', 'bulles']);
        const n = r.int(5, 6);
        let t = randDistinct(r, n, 1, 30);
        if (al === 'bulles' && r.chance(0.3)) { // presque triée : montre l'arrêt anticipé
          t = t.slice().sort((a, b) => a - b); const k = r.int(0, n - 2); const tmp = t[k]; t[k] = t[k + 1]; t[k + 1] = tmp;
        }
        const sim = { selection: simSelection, insertion: simInsertion, bulles: simBulles }[al](t);
        const rows = sim.etats.map((e, k) => '<tr><td>' + (k + 1) + '</td><td>' + L(e.t) + '</td><td style="text-align:left">' + e.info + '</td></tr>').join('');
        const passe = al === 'insertion' ? 'chaque tour de la boucle « pour i »' : 'chaque passage dans la boucle externe';
        const ind = { selection: 'À l\'étape i, on cherche le minimum de t[i..n−1].', insertion: 'À l\'étape i, t[0..i−1] est déjà triée et on y insère t[i].', bulles: 'À chaque passage, le plus grand élément restant « remonte » à sa place.' }[al];
        const remarque = al === 'selection'
          ? R`<p>Le tri par sélection fait toujours $\frac{n(n-1)}{2} = ${n * (n - 1) / 2}$ comparaisons, quelle que soit la liste.</p>`
          : al === 'insertion'
            ? R`<p>Le nombre de décalages est égal au nombre d'<b>inversions</b> de la liste de départ (couples mal ordonnés) : ${inversions(t).length}.</p>`
            : (sim.etats.length < n - 1
              ? '<p>Le tri s\'arrête dès qu\'un passage ne fait aucun échange : c\'est le rôle de la variable <code>échange</code>.</p>'
              : '<p>Chaque échange supprime exactement une inversion : le nombre d\'échanges est le nombre d\'inversions (' + inversions(t).length + ').</p>');
        return {
          detail: {
            but: R`<p>Dérouler le ${sim.label} sur ${L(t)} et compter comparaisons et ${sim.unite}.</p>`,
            methode: {
              selection: R`<p>Au tour $i$, la boucle interne parcourt $t[i+1..n-1]$ en gardant l'indice <code>imin</code> du plus petit élément vu (une comparaison par case), puis on échange $t[i]$ et $t[\text{imin}]$.</p>`,
              insertion: R`<p>Au tour $i$, $t[0..i-1]$ est triée : on mémorise $x = t[i]$, on décale vers la droite les éléments $\gt x$ en partant de la fin, puis on place $x$ dans le trou. Une comparaison par élément examiné ; pas de comparaison quand $j$ atteint 0 (court-circuit du « et »).</p>`,
              bulles: R`<p>À chaque passage, on compare les voisins $t[j]$ et $t[j+1]$ de gauche à droite et on les échange s'ils sont mal rangés : le plus grand élément restant arrive au bout. Si un passage ne fait aucun échange, la liste est triée et on s'arrête.</p>`
            }[al],
            etapes: [
              ...sim.etats.map((e, k) => R`<b>${al === 'insertion' ? 'Tour i = ' + (k + 1) : 'Passage ' + (k + 1)}.</b> ${e.info} → ${L(e.t)}.`),
              {
                selection: R`<b>Comparaisons.</b> Au tour $i$, la boucle interne fait $${n} - 1 - i$ comparaisons : $${Array.from({ length: n - 1 }, (_, i) => n - 1 - i).join(' + ')} = ${sim.comp}$, toujours $\frac{n(n-1)}{2}$. <b>Échanges effectifs</b> (positions différentes) : ${sim.ech}.`,
                insertion: R`<b>Comptage.</b> Pour chaque insertion : autant de comparaisons que de décalages, plus une pour l'élément qui arrête la boucle (sauf si l'on atteint le début de la liste). Total : ${sim.comp} comparaisons et ${sim.ech} décalages.`,
                bulles: R`<b>Comptage.</b> Le passage $i$ (en partant de 0) fait $${n} - 1 - i$ comparaisons ; ${sim.etats.length} passage${sim.etats.length > 1 ? 's' : ''} effectué${sim.etats.length > 1 ? 's' : ''} : ${sim.comp} comparaisons et ${sim.ech} échanges.`
              }[al],
              R`<b>Contrôle.</b> La liste finale ${L(sim.etats[sim.etats.length - 1].t)} est bien triée ; elle avait ${inversions(t).length} inversion${inversions(t).length > 1 ? 's' : ''} au départ.`
            ],
            retenir: {
              selection: R`<p>Sélection : $\frac{n(n-1)}{2}$ comparaisons quelle que soit la liste, au plus $n - 1$ échanges.</p>`,
              insertion: R`<p>Insertion : nombre de décalages = nombre d'inversions de la liste de départ.</p>`,
              bulles: R`<p>Bulles : chaque échange supprime une inversion ; l'arrêt anticipé rend le tri rapide sur une liste presque triée.</p>`
            }[al]
          },
          enonce: R`<p>On applique le <b>${sim.label}</b> (algorithme du cours) à la liste ${L(t)}.</p><ol><li>Donner l'état de la liste après ${passe}.</li><li>Combien de comparaisons entre éléments sont effectuées ? Combien de ${sim.unite} ?</li></ol>`,
          indication: '<p>Reprendre le pseudo-code ligne à ligne. ' + ind + '</p>',
          correction: algo(PS[al]) + R`<table class="t"><tr><th>étape</th><th>liste</th><th>détail</th></tr>${rows}</table>
            <p>Comparaisons : <b>${sim.comp}</b> ; ${sim.unite} : <b>${sim.ech}</b>.</p>` + remarque
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
        else { const k = r.int(0, n - 2); x = t[k] + 1; }
        const s = simDicho(t, x);
        const rows = s.pas.map((p, k) => `<tr><td>${k + 1}</td><td>${p.g}</td><td>${p.d}</td><td>${p.m}</td><td>${p.v}</td><td style="text-align:left">${p.act}</td></tr>`).join('');
        const maxIt = Math.floor(Math.log2(n)) + 1;
        return {
          detail: {
            but: R`<p>Dérouler <code>dichotomie(t, ${x})</code> et majorer le nombre de tours.</p>`,
            methode: R`<p>Zone de recherche $t[g..d]$ ; $m = \lfloor (g + d)/2 \rfloor$. Si $t[m] \lt x$, $x$ ne peut être qu'à droite : $g \leftarrow m + 1$. Si $t[m] \gt x$, à gauche : $d \leftarrow m - 1$. Arrêt si $t[m] = x$ ou si la zone est vide ($g \gt d$).</p>`,
            etapes: [
              R`<b>Départ.</b> $g = 0$, $d = ${n - 1}$ : toute la liste.`,
              ...s.pas.map((p, k) => R`<b>Tour ${k + 1}.</b> $g = ${p.g}$, $d = ${p.d}$, $m = \lfloor ${p.g + p.d}/2 \rfloor = ${p.m}$, $t[${p.m}] = ${p.v}$ : ${p.act === 'trouvé' ? R`égal à $${x}$, trouvé.` : p.v < x ? R`$${p.v} \lt ${x}$, on garde la moitié droite, $g \leftarrow ${p.m + 1}$.` : R`$${p.v} \gt ${x}$, on garde la moitié gauche, $d \leftarrow ${p.m - 1}$.`}`),
              s.res >= 0
                ? R`<b>Résultat.</b> L'algorithme renvoie <b>${s.res}</b> après ${s.pas.length} tour${s.pas.length > 1 ? 's' : ''}.`
                : R`<b>Résultat.</b> On sort car $g = ${s.g} \gt d = ${s.d}$ : la zone est vide, ${x} est absent (il serait entre $t[${s.d}]$ et $t[${s.g}]$), l'algorithme renvoie <b>$-1$</b> après ${s.pas.length} tours.`,
              R`<b>Nombre maximal de tours.</b> La taille de la zone passe de $k$ à au plus $\lfloor k/2 \rfloor$ à chaque tour : pour $n = ${n}$, au plus $\lfloor\log_2 ${n}\rfloor + 1 = ${maxIt}$ tours.`
            ],
            retenir: R`<p>Dichotomie : $O(\log n)$ tours, contre $n$ comparaisons pour une recherche séquentielle.</p>`
          },
          enonce: R`<p>On exécute <code>dichotomie(t, ${x})</code> (algorithme du cours) avec <code>t = [${t.join(', ')}]</code> (indices $0$ à $${n - 1}$).</p><ol><li>Donner les valeurs successives de $g$, $d$, $m$.</li><li>Quel est le résultat ? Combien de tours de boucle ?</li><li>Combien de tours au maximum pour une liste de cette longueur ?</li></ol>`,
          indication: R`<p>$m \leftarrow \lfloor (g + d)/2 \rfloor$. Si $t[m] < x$, on cherche à droite : $g \leftarrow m + 1$ ; si $t[m] > x$, à gauche : $d \leftarrow m - 1$.</p>`,
          correction: R`<table class="t"><tr><th>tour</th><th>g</th><th>d</th><th>m</th><th>t[m]</th><th>décision</th></tr>${rows}</table>
            <p>${s.res >= 0 ? `Résultat : <b>${s.res}</b> (car t[${s.res}] = ${x}), après ${s.pas.length} tour${s.pas.length > 1 ? 's' : ''}.` : `On sort de la boucle car g = ${s.g} &gt; d = ${s.d} : ${x} est absent, résultat <b>−1</b>, après ${s.pas.length} tours.`}</p>
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
          detail: {
            but: R`<p>Compter les inversions de ${L(t)} et en déduire le nombre de décalages du tri par insertion.</p>`,
            methode: R`<p>Une inversion est un couple de positions $i \lt j$ avec $t[i] \gt t[j]$. Méthode systématique : pour chaque élément, compter les éléments <b>plus petits situés à sa droite</b>.</p>`,
            etapes: [
              ...t.map((v, i) => { const sm = t.slice(i + 1).filter(w => w < v); return R`<b>Élément ${v}</b> (position ${i}) : ${sm.length ? 'plus petits à droite : ' + sm.join(', ') + ' → ' + sm.length : 'aucun plus petit à droite → 0'}.`; }),
              R`<b>Total.</b> ${t.map((v, i) => t.slice(i + 1).filter(w => w < v).length).join(' + ')} = <b>${inv.length}</b> inversions.`,
              R`<b>Lien avec le tri.</b> Quand on insère $x$, chaque décalage fait passer $x$ devant un élément plus grand qui le précédait : une inversion disparaît, et aucune autre n'est créée. La liste triée n'a plus d'inversion : il y a donc exactement ${inv.length} décalages (la simulation en compte bien ${sim.ech}).`,
              R`<b>Moyenne.</b> Pour une permutation au hasard, chacun des $\binom{${n}}{2} = ${n * (n - 1) / 2}$ couples est inversé avec probabilité $\frac12$ : en moyenne $\frac{n(n-1)}{4} = ${(n * (n - 1) / 4).toString().replace('.', '{,}')}$ inversions.`
            ],
            retenir: R`<p>Tri par insertion : coût $\Theta(n + I)$ où $I$ est le nombre d'inversions ; en moyenne $I \approx \frac{n^2}{4}$.</p>`
          },
          enonce: R`<p>Soit la liste ${L(t)}.</p><ol><li>Lister ses inversions (couples d'indices $i < j$ avec $t[i] > t[j]$).</li><li>En déduire, sans dérouler l'algorithme, le nombre de décalages effectués par le tri par insertion.</li><li>Comparer au nombre moyen de décalages pour une liste de taille $${n}$.</li></ol>`,
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
          () => { const n = r.pick([10, 20, 50, 100, 1000]); return { q: R`le <b>tri par sélection</b> d'une liste de $${n}$ éléments`, a: R`Toujours $\frac{n(n-1)}{2} = ${n * (n - 1) / 2}$ comparaisons : les deux boucles s'exécutent entièrement quelle que soit la liste (pire = meilleur = moyen).`,
            d: [R`<b>Boucle interne.</b> Au tour $i$ ($0 \le i \le n - 2$), $j$ va de $i + 1$ à $n - 1$ : $n - 1 - i$ comparaisons, sans arrêt possible avant la fin.`, R`<b>Somme.</b> $(n-1) + (n-2) + \dots + 1 = \frac{n(n-1)}{2}$, avec $n = ${n}$ : $\frac{${n} \times ${n - 1}}{2} = ${n * (n - 1) / 2}$.`, R`<b>Conclusion.</b> Le nombre de comparaisons ne dépend pas de la liste : $\Theta(n^2)$ dans tous les cas.`] }; },
          () => { const n = r.pick([10, 20, 50, 100, 1000]); return { q: R`le <b>tri par insertion</b> d'une liste de $${n}$ éléments <b>déjà triée</b>`, a: R`Meilleur cas : une seule comparaison par élément inséré, soit $n - 1 = ${n - 1}$ comparaisons et aucun décalage : $\Theta(n)$.`,
            d: [R`<b>Tour $i$.</b> On insère $x = t[i]$ ; comme la liste est triée, $t[i-1] \le x$ : la condition $t[j-1] \gt x$ est fausse dès la première comparaison.`, R`<b>Somme.</b> Une comparaison par tour, pour $i = 1, \dots, n - 1$ : $n - 1 = ${n - 1}$ comparaisons, aucun décalage.`, R`<b>Conclusion.</b> C'est le meilleur cas : $\Theta(n)$.`] }; },
          () => { const n = r.pick([10, 20, 50, 100, 1000]); return { q: R`le <b>tri par insertion</b> d'une liste de $${n}$ éléments <b>triée dans l'ordre décroissant</b>`, a: R`Pire cas : l'élément d'indice $i$ est comparé à tous ceux qui le précèdent, soit $\sum_{i=1}^{n-1} i = \frac{n(n-1)}{2} = ${n * (n - 1) / 2}$ comparaisons (et autant de décalages) : $\Theta(n^2)$.`,
            d: [R`<b>Tour $i$.</b> $x = t[i]$ est plus petit que tous les éléments déjà triés : on le compare à chacun ($i$ comparaisons), on les décale tous ($i$ décalages), et la boucle s'arrête parce que $j = 0$.`, R`<b>Somme.</b> $1 + 2 + \dots + (n - 1) = \frac{n(n-1)}{2} = ${n * (n - 1) / 2}$.`, R`<b>Conclusion.</b> Pire cas : $\Theta(n^2)$ comparaisons et décalages.`] }; },
          () => { const n = r.pick([10, 20, 50, 100]); return { q: R`le <b>tri à bulles</b> (avec arrêt anticipé) d'une liste de $${n}$ éléments <b>déjà triée</b>`, a: R`Un seul passage sans échange : $n - 1 = ${n - 1}$ comparaisons, puis arrêt : $\Theta(n)$.`,
            d: [R`<b>Premier passage.</b> On compare les $n - 1 = ${n - 1}$ couples de voisins ; aucun n'est mal rangé, aucun échange.`, R`<b>Arrêt anticipé.</b> La variable <code>échange</code> est restée à faux : la procédure s'arrête.`, R`<b>Conclusion.</b> $${n - 1}$ comparaisons : $\Theta(n)$ (sans la variable <code>échange</code>, on ferait $\frac{n(n-1)}{2}$ comparaisons).`] }; },
          () => { const n = r.pick([10, 20, 50, 100]); return { q: R`le <b>tri à bulles</b> d'une liste de $${n}$ éléments <b>triée dans l'ordre décroissant</b>`, a: R`$n - 1$ passages complets : $\sum_{i=0}^{n-2}(n-1-i) = \frac{n(n-1)}{2} = ${n * (n - 1) / 2}$ comparaisons et autant d'échanges : $\Theta(n^2)$.`,
            d: [R`<b>Chaque passage.</b> Tous les voisins comparés sont mal rangés : chaque comparaison provoque un échange, et l'arrêt anticipé ne se produit jamais.`, R`<b>Passage $i$.</b> Il compare $t[j]$ et $t[j+1]$ pour $j$ de 0 à $n - 2 - i$ : $n - 1 - i$ comparaisons.`, R`<b>Somme.</b> $(n - 1) + \dots + 1 = \frac{n(n-1)}{2} = ${n * (n - 1) / 2}$ comparaisons et autant d'échanges : $\Theta(n^2)$.`] }; },
          () => { const n = r.pick([100, 1000, 5000, 100000, 1000000]); return { q: R`une <b>recherche dichotomique</b> infructueuse dans une liste triée de $${n}$ éléments (nombre maximal de tours de boucle)`, a: R`Au plus $\lfloor\log_2 n\rfloor + 1 = ${Math.floor(Math.log2(n)) + 1}$ tours, contre $${n}$ comparaisons pour une recherche séquentielle.`,
            d: [R`<b>Taille de la zone.</b> Si la zone a $k$ éléments, après un tour sans succès elle en a au plus $\lfloor k/2 \rfloor$.`, R`<b>Nombre de tours.</b> Partant de $n$, après $p$ tours il reste au plus $\frac{n}{2^p}$ éléments ; la boucle continue tant que la zone n'est pas vide, d'où au plus $\lfloor\log_2 n\rfloor + 1$ tours.`, R`<b>Application.</b> $2^{${Math.floor(Math.log2(n))}} \le ${n} \lt 2^{${Math.floor(Math.log2(n)) + 1}}$, donc $\lfloor\log_2 ${n}\rfloor = ${Math.floor(Math.log2(n))}$ et au plus $${Math.floor(Math.log2(n)) + 1}$ tours, au lieu de $${n}$ comparaisons en séquentiel.`] }; },
          () => { const n = r.pick([10, 100, 1000]); return { q: R`une <b>recherche séquentielle</b> dans une liste de $${n}$ éléments, si l'élément est présent à une position uniformément aléatoire (nombre moyen de comparaisons)`, a: R`$\frac{1 + 2 + \dots + n}{n} = \frac{n+1}{2} = ${((n + 1) / 2).toString().replace('.', '{,}')}$ comparaisons en moyenne ($n$ dans le pire cas).`,
            d: [R`<b>Coût selon la position.</b> Si l'élément est en $k$-ième position ($1 \le k \le n$), on fait $k$ comparaisons.`, R`<b>Moyenne.</b> Chaque position a la probabilité $\frac1n$ : $\frac1n(1 + 2 + \dots + n) = \frac1n \cdot \frac{n(n+1)}{2} = \frac{n+1}{2}$.`, R`<b>Application.</b> $\frac{${n} + 1}{2} = ${((n + 1) / 2).toString().replace('.', '{,}')}$ ; dans le pire cas (dernière position) : $${n}$.`] }; }
        ])();
        return {
          detail: {
            but: R`<p>Compter les comparaisons effectuées par ${cas.q}.</p>`,
            methode: R`<p>Repérer le cas (pire, meilleur, moyen), compter les tours de la boucle interne pour chaque tour de la boucle externe, puis sommer.</p>`,
            etapes: cas.d,
            retenir: R`<p>$1 + 2 + \dots + (n - 1) = \frac{n(n-1)}{2}$ : la somme qui donne le $\Theta(n^2)$ des tris élémentaires.</p>`
          },
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
    { t: 'nota', title: 'conventions du pseudo-code', body: R`<ul>
        <li>$x \leftarrow e$ : <b>affectation</b> ; comparaisons $=$, $\neq$, $<$, $\le$, $>$, $\ge$ ; <code>//</code> : commentaire.</li>
        <li>Une liste $t$ de longueur $n = \text{longueur}(t)$ a ses éléments $t[0], \dots, t[n-1]$ ; $t[a..b]$ désigne les éléments d'indices $a$ à $b$ (inclus).</li>
        <li><b>pour</b> $i$ <b>de</b> $a$ <b>à</b> $b$ <b>faire</b> … <b>fin pour</b> : $i$ prend les valeurs $a, a+1, \dots, b$ ($b$ <b>inclus</b>, aucun tour si $a > b$) ; « <b>par pas de</b> $-1$ » pour décroître.</li>
        <li><b>tant que</b> … <b>faire</b> … <b>fin tant que</b> ; <b>si</b> … <b>alors</b> … <b>sinon</b> … <b>fin si</b>.</li>
        <li>« <b>et</b> », « <b>ou</b> » sont évalués de gauche à droite : si la première condition suffit à conclure, la seconde n'est pas évaluée (dans « $j > 0$ <b>et</b> $t[j-1] > x$ », on ne lit pas $t[-1]$).</li>
        <li>$\lfloor a / b \rfloor$ : quotient de la division entière ; $\text{échanger}(t[i], t[j])$ échange deux éléments.</li>
        <li>$\text{ajouter\_fin}(t, x)$ et $\text{retirer\_fin}(t)$ ajoutent / retirent une case en fin de liste.</li>
        <li>Une <b>fonction</b> renvoie un résultat (<b>retourner</b>) ; une <b>procédure</b> modifie ses paramètres (ici la liste $t$, modifiée <b>en place</b>).</li></ul>` },

    { t: 'h', title: 'Opérations sur les listes : recherche, insertion, suppression' },
    { t: 'def', title: 'liste', body: R`<p>Une <strong>liste</strong> (ou tableau) est une suite finie d'éléments $t[0], t[1], \dots, t[n-1]$ repérés par leur <strong>indice</strong> ; $n = \text{longueur}(t)$ est sa <strong>longueur</strong>. Les éléments sont rangés dans des cases consécutives.</p>` },
    { t: 'prop', title: 'coût des opérations de base', body: R`<ul>
        <li>Lecture et écriture de $t[i]$, $\text{longueur}(t)$ : <b>coût constant</b> $O(1)$.</li>
        <li>Ajout et retrait <b>en fin</b> de liste ($\text{ajouter\_fin}$, $\text{retirer\_fin}$) : $O(1)$.</li>
        <li>Insertion ou suppression <b>en position $i$</b> : il faut <b>décaler</b> les éléments suivants, coût $\Theta(n - i)$.</li></ul>` },
    { t: 'algo', title: 'recherche séquentielle', body: algo(PS.recherche) + R`<p>On parcourt la liste de gauche à droite jusqu'à trouver $x$.</p>` },
    { t: 'prop', body: R`<p>La recherche séquentielle dans une liste de longueur $n$ effectue au plus $n$ comparaisons : <b>$n$ dans le pire cas</b> ($x$ absent ou en dernière position), <b>$1$ dans le meilleur cas</b> ($x$ en tête).</p>`,
      proof: R`<p>La boucle fait au plus $n$ tours, avec une comparaison par tour. Elle s'arrête au premier tour si $t[0] = x$, et fait $n$ tours si $x$ n'apparaît pas.</p>` },
    { t: 'algo', title: 'insertion en position i', body: algo(PS.inserer) + R`<p>Les éléments d'indices $i, \dots, n-1$ sont décalés d'un cran vers la droite, <b>en commençant par la fin</b> pour ne rien écraser, puis $x$ est placé en position $i$.</p>` },
    { t: 'algo', title: 'suppression en position i', body: algo(PS.supprimer) + R`<p>Les éléments d'indices $i+1, \dots, n-1$ sont décalés d'un cran vers la gauche, puis la dernière case est retirée.</p>` },
    { t: 'prop', body: R`<p>Insertion et suppression en position $i$ dans une liste de longueur $n$ effectuent $n - i$ (resp. $n - 1 - i$) décalages : coût <b>$\Theta(n)$ dans le pire cas</b> ($i = 0$, en tête) et $O(1)$ en fin de liste.</p>`,
      proof: R`<p>Dans <i>insérer</i>, $k$ parcourt $n, n-1, \dots, i+1$ : $n - i$ valeurs. Dans <i>supprimer</i>, $k$ parcourt $i, \dots, n-2$ : $n - 1 - i$ valeurs.</p>` },
    { t: 'warn', body: R`<p>Une instruction écrite en une ligne n'est pas forcément de coût constant : « $x \in t$ » (appartenance), « insérer au milieu », « supprimer la valeur $x$ » cachent un <b>parcours</b> ou des <b>décalages</b> et coûtent $\Theta(n)$.</p>` },
    { t: 'rem', title: 'listes chaînées', body: R`<p>Une autre représentation est la <strong>liste chaînée</strong> : chaque <b>maillon</b> contient une valeur et une référence vers le maillon suivant. L'insertion ou la suppression <b>en tête</b> (ou après un maillon connu) coûte $O(1)$, mais l'accès au $i$-ème élément coûte $\Theta(i)$.</p>` + algo(`// un maillon m a deux champs : m.valeur et m.suivant (un maillon, ou NUL)
fonction insérer_tête(tête, x)
    m ← nouveau maillon
    m.valeur ← x
    m.suivant ← tête
    retourner m                         // O(1) : aucun décalage
fin fonction`) },

    { t: 'h', title: 'Listes triées : tris élémentaires et recherche dichotomique' },
    { t: 'def', body: R`<p>Une liste $t$ de longueur $n$ est <strong>triée</strong> (dans l'ordre croissant) si $t[0] \le t[1] \le \dots \le t[n-1]$. <strong>Trier</strong> une liste, c'est en permuter les éléments pour qu'elle devienne triée.</p>` },
    { t: 'def', title: 'inversion', body: R`<p>Une <strong>inversion</strong> de $t$ est un couple d'indices $(i, j)$ avec $i < j$ et $t[i] > t[j]$. Une liste est triée si et seulement si elle n'a aucune inversion. Une liste de longueur $n$ a au plus $\binom n2 = \frac{n(n-1)}{2}$ inversions (liste décroissante).</p>` },
    { t: 'algo', title: 'tri par sélection', body: R`<p>Pour $i = 0, 1, \dots, n-2$ : chercher le <b>minimum</b> de $t[i..n-1]$ et l'<b>échanger</b> avec $t[i]$.</p>` + algo(PS.selection) },
    { t: 'thm', title: 'correction et coût du tri par sélection', body: R`<p><b>Invariant</b> : après le tour $i$, $t[0] \le \dots \le t[i]$ et ces éléments sont les $i + 1$ plus petits de la liste. Le tri par sélection est donc correct.</p>
      <p>Il effectue <b>toujours</b> $\frac{n(n-1)}{2}$ comparaisons et <b>au plus $n - 1$ échanges</b> : coût $\Theta(n^2)$ dans tous les cas.</p>`,
      proof: R`<p><em>Invariant.</em> Vrai après le tour $0$ : $t[0]$ est le minimum de toute la liste. Si c'est vrai après le tour $i - 1$, le tour $i$ place en position $i$ le minimum de $t[i..n-1]$, c'est-à-dire le plus petit des éléments restants : il est $\ge t[i-1]$ et les $i + 1$ premiers sont les $i + 1$ plus petits. Après le dernier tour ($i = n - 2$), $t[0] \le \dots \le t[n-2]$ et $t[n-1]$ est le plus grand : la liste est triée.</p>
      <p><em>Coût.</em> Au tour $i$, la boucle interne fait $n - 1 - i$ comparaisons : $\sum_{i=0}^{n-2}(n - 1 - i) = \sum_{k=1}^{n-1} k = \frac{n(n-1)}{2}$. Un échange au plus par tour.</p>` },
    { t: 'algo', title: 'tri par insertion', body: R`<p>Pour $i = 1, \dots, n-1$ : la partie $t[0..i-1]$ est triée ; on y <b>insère</b> $x = t[i]$ à sa place en décalant vers la droite les éléments plus grands que $x$.</p>` + algo(PS.insertion) },
    { t: 'thm', title: 'correction et coût du tri par insertion', body: R`<p><b>Invariant</b> : au début du tour $i$, $t[0..i-1]$ est triée (et contient les mêmes éléments qu'au départ). Le tri par insertion est correct.</p>
      <ul><li><b>Pire cas</b> (liste décroissante) : $\frac{n(n-1)}{2}$ comparaisons et décalages, $\Theta(n^2)$.</li>
      <li><b>Meilleur cas</b> (liste déjà triée) : $n - 1$ comparaisons, aucun décalage, $\Theta(n)$.</li>
      <li>Le nombre de décalages est égal au <b>nombre d'inversions</b> de la liste.</li></ul>`,
      proof: R`<p><em>Invariant.</em> Vrai pour $i = 1$ (une liste d'un élément est triée). Au tour $i$, les éléments de $t[0..i-1]$ strictement plus grands que $x$ (qui forment une fin de cette partie triée) sont décalés d'un cran, puis $x$ est placé juste après le dernier élément $\le x$ : $t[0..i]$ est triée.</p>
      <p><em>Coût.</em> Au tour $i$, on fait au plus $i$ comparaisons (et exactement $i$ si $x$ est plus petit que tous les précédents) : au pire $\sum_{i=1}^{n-1} i = \frac{n(n-1)}{2}$. Si la liste est triée, la première comparaison échoue à chaque tour : $n - 1$ comparaisons.</p>
      <p><em>Inversions.</em> Décaler $t[j-1] > x$ d'un cran fait passer $x$ devant un élément plus grand situé avant lui : cela supprime exactement une inversion, sans en créer. À la fin il n'y en a plus, donc le nombre de décalages est le nombre d'inversions initial.</p>` },
    { t: 'algo', title: 'tri à bulles', body: R`<p>On parcourt la liste en échangeant deux voisins mal ordonnés ; à chaque passage, le plus grand élément restant « remonte » en fin de liste. On s'arrête après un passage sans échange.</p>` + algo(PS.bulles) },
    { t: 'thm', title: 'correction et coût du tri à bulles', body: R`<p><b>Invariant</b> : après le passage $i$, les $i + 1$ derniers éléments sont les plus grands, à leur place définitive. Si un passage ne fait aucun échange, la liste est triée.</p>
      <ul><li><b>Pire cas</b> (liste décroissante) : $\frac{n(n-1)}{2}$ comparaisons et échanges, $\Theta(n^2)$.</li>
      <li><b>Meilleur cas</b> (liste triée) : un seul passage, $n - 1$ comparaisons, $\Theta(n)$.</li>
      <li>Le nombre d'échanges est égal au nombre d'inversions.</li></ul>`,
      proof: R`<p><em>Invariant.</em> Lors du passage $i$, le maximum $M$ de $t[0..n-1-i]$ est échangé avec chacun de ses voisins de droite jusqu'à la position $n - 1 - i$. Si aucun échange n'a lieu, $t[j] \le t[j+1]$ pour tous les $j$ parcourus, et la fin de liste est déjà en place : la liste est triée.</p>
      <p><em>Coût.</em> Le passage $i$ fait $n - 1 - i$ comparaisons ; au pire $n - 1$ passages : $\frac{n(n-1)}{2}$. Chaque échange de deux voisins mal ordonnés supprime exactement une inversion.</p>` },
    { t: 'algo', title: 'recherche dichotomique', body: R`<p>Dans une liste <b>triée</b>, on compare $x$ à l'élément du milieu, puis on recommence dans la moitié gauche ou droite.</p>` + algo(PS.dicho) },
    { t: 'thm', title: 'correction et coût de la recherche dichotomique', body: R`<p><b>Invariant</b> : si $x$ est dans $t$, alors $x$ est dans $t[g..d]$. L'algorithme termine et est correct.</p>
      <p>Il effectue au plus <b>$\lfloor \log_2 n \rfloor + 1$ tours</b> de boucle : coût $\Theta(\log n)$ dans le pire cas.</p>`,
      proof: R`<p><em>Invariant.</em> Vrai au départ ($g = 0$, $d = n - 1$). Si $t[m] < x$, comme la liste est triée, $x$ n'est pas dans $t[0..m]$ : on peut prendre $g \leftarrow m + 1$. Symétriquement si $t[m] > x$. Si la boucle s'arrête avec $g > d$, la zone est vide : $x$ est absent.</p>
      <p><em>Terminaison et coût.</em> Notons $s = d - g + 1$ la taille de la zone. Après un tour sans succès, la nouvelle taille est au plus $\lfloor s / 2 \rfloor$ (on garde l'une des deux moitiés, privées de $t[m]$). Après $k$ tours, $s \le n / 2^k$. La boucle continue tant que $s \ge 1$ ; donc le nombre de tours $k$ vérifie $2^{k-1} \le n$, c'est-à-dire $k \le \lfloor\log_2 n\rfloor + 1$.</p>` },
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
    { k: 'prop', t: 'Coût des opérations sur une liste', prio: true,
      concl: [R`$t[i]$, $\text{longueur}(t)$, $\text{ajouter\_fin}$, $\text{retirer\_fin}$ : <u>$O(1)$</u>`, R`Insertion / suppression en position $i$ : $n - i$ décalages, <u>$\Theta(n)$</u> au pire`, R`Appartenance « $x \in t$ » : un parcours, $\Theta(n)$`] },
    { k: 'prop', t: 'Recherche séquentielle',
      concl: [R`Pire cas : $n$ comparaisons ; meilleur : $1$`, R`Moyenne (présent, position uniforme) : $\dfrac{n+1}{2}$`] },
    { k: 'def', t: 'Liste triée, inversion',
      concl: [R`Triée : $t[0] \le t[1] \le \dots \le t[n-1]$`, R`Inversion : $i < j$ et <u>$t[i] > t[j]$</u> ; triée ssi aucune inversion`, R`Au plus $\frac{n(n-1)}{2}$ inversions`] },
    { k: 'thm', t: 'Tri par sélection',
      hyp: R`Tour $i$ : minimum de $t[i..n-1]$ échangé avec $t[i]$`,
      concl: [R`<u>Toujours</u> $\frac{n(n-1)}{2}$ comparaisons, $\le n - 1$ échanges`, R`Invariant : $t[0..i]$ trié = les $i+1$ plus petits`] },
    { k: 'thm', t: 'Tri par insertion', prio: true,
      hyp: R`Tour $i$ : insérer $t[i]$ dans $t[0..i-1]$ déjà triée`,
      concl: [R`Pire (décroissante) : $\frac{n(n-1)}{2}$ ; <u>meilleur (triée) : $n - 1$</u>`, R`Décalages = <u>nombre d'inversions</u> ; moyenne $\frac{n(n-1)}{4}$`] },
    { k: 'thm', t: 'Tri à bulles',
      hyp: R`Échanges de voisins mal ordonnés ; arrêt si un passage sans échange`,
      concl: [R`Pire : $\frac{n(n-1)}{2}$ ; meilleur : $n - 1$`, R`Invariant : après le passage $i$, les $i+1$ plus grands sont à leur place`] },
    { k: 'thm', t: 'Recherche dichotomique', prio: true,
      hyp: R`Liste <u>triée</u> ; $m \leftarrow \lfloor (g + d)/2 \rfloor$`,
      concl: [R`Au plus <u>$\lfloor\log_2 n\rfloor + 1$</u> tours : $\Theta(\log n)$`, R`Invariant : si $x \in t$ alors $x \in t[g..d]$`] },
    { k: 'def', t: 'Pire cas, meilleur cas, cas moyen', prio: true,
      concl: [R`$C_{\max}(n)$, $C_{\min}(n)$ : max et min sur les entrées de taille $n$`, R`$C_{\text{moy}}(n) = \sum_e \Proba(e)\,C(e)$`, R`$C_{\min} \le C_{\text{moy}} \le C_{\max}$`] },
    { k: 'meth', t: 'Prouver un algorithme',
      concl: [R`<b>Invariant</b> : vrai au départ, conservé par un tour, utile à la fin`, R`<b>Terminaison</b> : une quantité entière $\ge 0$ qui décroît strictement ($d - g$…)`] },
    { k: 'form', t: 'Sommes utiles',
      concl: [R`$\sum_{i=1}^{n-1} i = \frac{n(n-1)}{2}$`, R`$\binom n2 = \frac{n(n-1)}{2}$ couples ; $2^{k} > n \iff k > \log_2 n$`] },
    { k: 'warn', t: 'Pièges',
      concl: [R`Dichotomie sur une liste <b>non triée</b> : résultat faux`, R`Décaler de gauche à droite pour une insertion : on écrase les valeurs`, R`« pour $i$ de $a$ à $b$ » : $b$ est <b>inclus</b>`] }
  ];

  /* ------------------------------------------------------------------ */
  /* Exercices                                                           */
  /* ------------------------------------------------------------------ */
  const exercices = [
    {
      id: 'selection', title: 'Dérouler le tri par sélection', diff: 1, gen: 'triTrace',
      enonce: R`<p>Appliquer le tri par sélection à <code>[5, 2, 8, 1, 9, 3]</code> en donnant l'état de la liste après chaque tour de la boucle externe. Combien de comparaisons et d'échanges effectifs ?</p>`,
      correction: R`<table class="t"><tr><th>i</th><th>minimum de t[i..5]</th><th>liste</th></tr>
        <tr><td>0</td><td>1 (indice 3)</td><td><code>[1, 2, 8, 5, 9, 3]</code></td></tr>
        <tr><td>1</td><td>2 (déjà en place)</td><td><code>[1, 2, 8, 5, 9, 3]</code></td></tr>
        <tr><td>2</td><td>3 (indice 5)</td><td><code>[1, 2, 3, 5, 9, 8]</code></td></tr>
        <tr><td>3</td><td>5 (déjà en place)</td><td><code>[1, 2, 3, 5, 9, 8]</code></td></tr>
        <tr><td>4</td><td>8 (indice 5)</td><td><code>[1, 2, 3, 5, 8, 9]</code></td></tr></table>
        <p>Comparaisons : $5 + 4 + 3 + 2 + 1 = 15 = \frac{6 \times 5}{2}$. Échanges effectifs : $3$ (aux tours 0, 2 et 4).</p>`
    },
    {
      id: 'insertion', title: 'Tri par insertion et inversions', diff: 2, gen: 'inversions',
      enonce: R`<p>Soit <code>t = [4, 1, 3, 5, 2]</code>.</p><ol><li>Dérouler le tri par insertion (état après chaque tour) en comptant décalages et comparaisons.</li><li>Compter les inversions de $t$. Que constate-t-on ?</li></ol>`,
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
      enonce: R`<p>Avec <code>t = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]</code>, dérouler <code>dichotomie(t, 23)</code> puis <code>dichotomie(t, 10)</code> (valeurs de $g$, $d$, $m$).</p>`,
      correction: R`<p><b>x = 23</b> : $(g, d, m) = (0, 9, 4)$, $t[4] = 16 < 23$ → $g \leftarrow 5$ ; $(5, 9, 7)$, $t[7] = 56 > 23$ → $d \leftarrow 6$ ; $(5, 6, 5)$, $t[5] = 23$ : <b>trouvé, résultat 5</b> en 3 tours.</p>
        <p><b>x = 10</b> : $(0, 9, 4)$, $16 > 10$ → $d \leftarrow 3$ ; $(0, 3, 1)$, $5 < 10$ → $g \leftarrow 2$ ; $(2, 3, 2)$, $8 < 10$ → $g \leftarrow 3$ ; $(3, 3, 3)$, $12 > 10$ → $d \leftarrow 2$ ; $g > d$ : <b>absent, résultat −1</b> en 4 tours $= \lfloor\log_2 10\rfloor + 1$.</p>`
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
      enonce: R`<p>On veut supprimer toutes les occurrences de $x$ dans $t$.</p><ol><li>Méthode naïve : tant que $x$ apparaît dans $t$, chercher sa première position $i$ (recherche séquentielle) puis appeler $\text{supprimer}(t, i)$. Quel est son coût dans le pire cas ?</li><li>Écrire une procédure en $\Theta(n)$ qui modifie $t$ en place.</li></ol>`,
      indication: R`<p>Parcourir $t$ avec un indice de lecture $i$ et un indice d'écriture $k$.</p>`,
      correction: R`<p>1. Chaque recherche et chaque suppression coûtent $\Theta(n)$. Si $t$ ne contient que des $x$, on recommence $n$ fois : $\Theta(n^2)$.</p>` + algo(`procédure supprimer_valeur(t, x)
    k ← 0                               // t[0..k−1] : éléments conservés
    pour i de 0 à longueur(t) − 1 faire
        si t[i] ≠ x alors
            t[k] ← t[i]
            k ← k + 1
        fin si
    fin pour
    tant que longueur(t) > k faire
        retirer_fin(t)                  // O(1) chacune
    fin tant que
fin procédure`) + R`<p>2. Un seul parcours et des retraits en fin : $\Theta(n)$. Invariant : $t[0..k-1]$ contient, dans l'ordre, les éléments différents de $x$ parmi $t[0..i-1]$.</p>`,
      similaires: [
        {
          title: 'Supprimer les doublons d’une liste triée',
          enonce: R`<p>Écrire en $\Theta(n)$ une procédure qui supprime les doublons d'une liste <b>triée</b> (chaque valeur ne doit apparaître qu'une fois).</p>`,
          correction: algo(`procédure sans_doublons(t)
    si longueur(t) = 0 alors
        retourner
    fin si
    k ← 1                               // t[0..k−1] : valeurs distinctes déjà vues
    pour i de 1 à longueur(t) − 1 faire
        si t[i] ≠ t[k − 1] alors        // liste triée : les égaux sont voisins
            t[k] ← t[i]
            k ← k + 1
        fin si
    fin pour
    tant que longueur(t) > k faire
        retirer_fin(t)
    fin tant que
fin procédure`) + R`<p>Comme la liste est triée, il suffit de comparer à la dernière valeur conservée.</p>`
        }
      ]
    },
    {
      id: 'inserer-trie', title: 'Insérer dans une liste triée', diff: 2,
      enonce: R`<p>Écrire une procédure $\text{insérer\_trié}(t, x)$ qui insère $x$ dans la liste triée $t$ de façon qu'elle reste triée. Quel est son coût ? En déduire une autre présentation du tri par insertion.</p>`,
      correction: algo(`procédure insérer_trié(t, x)
    ajouter_fin(t, x)
    j ← longueur(t) − 1
    tant que j > 0 et t[j − 1] > x faire
        t[j] ← t[j − 1]
        j ← j − 1
    fin tant que
    t[j] ← x
fin procédure`) + R`<p>Coût : au plus $n$ comparaisons et décalages, $\Theta(n)$ dans le pire cas (même si l'on cherchait la position par dichotomie en $\Theta(\log n)$, les décalages restent en $\Theta(n)$).</p>
        <p>Tri par insertion : partir d'une liste vide $r$ et y insérer successivement chaque élément avec $\text{insérer\_trié}(r, x)$ : c'est exactement l'algorithme du cours.</p>`
    },
    {
      id: 'invariant', title: 'Prouver le tri par sélection', diff: 2,
      enonce: R`<p>Montrer par un invariant de boucle que la procédure <i>tri_sélection</i> du cours trie la liste. Justifier aussi que la boucle interne calcule bien l'indice du minimum de $t[i..n-1]$.</p>`,
      correction: R`<p><b>Boucle interne</b> (pour $i$ fixé) : invariant « $t[\text{imin}]$ est le minimum de $t[i..j-1]$ ». Vrai pour $j = i + 1$ ; si $t[j] < t[\text{imin}]$, on met à jour $\text{imin} \leftarrow j$, sinon le minimum ne change pas. En sortie ($j = n$), $t[\text{imin}]$ est le minimum de $t[i..n-1]$.</p>
        <p><b>Boucle externe</b> : invariant $P(i)$ « après le tour $i$, $t[0] \le \dots \le t[i]$ et ce sont les $i + 1$ plus petits éléments ». Le tour $i$ place en position $i$ le minimum des éléments restants, qui est $\ge$ tous ceux déjà placés : $P(i)$ est vrai. Après le tour $n - 2$, il ne reste que $t[n-1]$, le plus grand : la liste est triée. Les échanges ne font que permuter les éléments.</p>`,
      similaires: [
        {
          title: 'Prouver la recherche dichotomique',
          enonce: R`<p>Prouver la terminaison et la correction de <i>dichotomie</i> : on donnera un invariant et une quantité entière qui décroît strictement.</p>`,
          correction: R`<p><b>Terminaison</b> : $d - g + 1 \ge 0$ diminue strictement à chaque tour sans succès (on remplace $g$ par $m + 1 > g$ ou $d$ par $m - 1 < d$, avec $g \le m \le d$).</p>
            <p><b>Correction</b> : invariant « si $x \in t$, alors $x \in t[g..d]$ ». Si l'on renvoie $m$, c'est que $t[m] = x$. Si l'on sort avec $g > d$, la zone est vide, donc $x \notin t$ : renvoyer $-1$ est correct.</p>`
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
      enonce: R`<p>La liste triée $t$ peut contenir des doublons. Écrire une recherche dichotomique qui renvoie l'indice de la <b>première</b> occurrence de $x$ (ou $-1$), en $\Theta(\log n)$.</p>`,
      indication: R`<p>Maintenir l'invariant : tous les éléments de $t[0..g-1]$ sont $< x$ et tous ceux de $t[d..n-1]$ sont $\ge x$.</p>`,
      correction: algo(`fonction première_occurrence(t, x)    // t triée, doublons possibles
    g ← 0
    d ← longueur(t)                     // invariant : t[0..g−1] < x ≤ t[d..n−1]
    tant que g < d faire
        m ← ⌊(g + d) / 2⌋
        si t[m] < x alors
            g ← m + 1
        sinon
            d ← m
        fin si
    fin tant que
    si g < longueur(t) et t[g] = x alors
        retourner g
    fin si
    retourner −1
fin fonction`) + R`<p>À la fin $g = d$ : tous les éléments avant $g$ sont $< x$ et $t[g]$ (s'il existe) est le premier élément $\ge x$. La zone $t[g..d-1]$ est au moins divisée par 2 à chaque tour : $\Theta(\log n)$ tours.</p>`
    },
    {
      id: 'fusion', title: 'Fusionner deux listes triées', diff: 2,
      enonce: R`<p>Écrire une fonction $\text{fusion}(a, b)$ qui renvoie la liste triée contenant les éléments de deux listes triées $a$ (longueur $n$) et $b$ (longueur $m$), en $\Theta(n + m)$. Combien de comparaisons au plus ?</p>`,
      correction: algo(`fonction fusion(a, b)
    i ← 0
    j ← 0
    r ← liste vide
    tant que i < longueur(a) et j < longueur(b) faire
        si a[i] ≤ b[j] alors
            ajouter_fin(r, a[i])
            i ← i + 1
        sinon
            ajouter_fin(r, b[j])
            j ← j + 1
        fin si
    fin tant que
    tant que i < longueur(a) faire      // il reste au plus une des deux listes
        ajouter_fin(r, a[i])
        i ← i + 1
    fin tant que
    tant que j < longueur(b) faire
        ajouter_fin(r, b[j])
        j ← j + 1
    fin tant que
    retourner r
fin fonction`) + R`<p>Chaque comparaison place un élément dans $r$, et la liste restante est recopiée sans comparaison : au plus $n + m - 1$ comparaisons, $\Theta(n + m)$ au total.</p>`
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiches méthodes                                                     */
  /* ------------------------------------------------------------------ */
  const methodes = [
    {
      title: 'Dérouler un algorithme sur un exemple', gen: 'triTrace',
      cas: R`« Donner l'état de la liste après chaque étape »`, debut: R`Recopier le pseudo-code, puis faire un <b>tableau</b> : une ligne par tour de la boucle externe, une colonne par variable.`,
      etapes: [
        R`Repérer la <b>boucle externe</b> et ce qu'elle garantit (invariant) : c'est elle qui définit « une étape ».`,
        R`Pour chaque tour, noter les variables ($i$, $\text{imin}$, $j$, $g$, $d$, $m$…) et l'état de la liste.`,
        R`Compter au fur et à mesure les <b>comparaisons</b> et les échanges / décalages.`,
        R`Vérifier avec l'invariant (ex. : après le tour $i$ du tri par sélection, les $i + 1$ premiers sont les plus petits) et avec les formules du cours.`
      ],
      exemple: {
        enonce: R`<p>Tri à bulles de <code>[3, 1, 4, 2]</code>.</p>`,
        solution: R`<p>Passage 0 : <code>[1, 3, 4, 2]</code> → <code>[1, 3, 2, 4]</code> (2 échanges, 3 comparaisons). Passage 1 : <code>[1, 2, 3, 4]</code> (1 échange, 2 comparaisons). Passage 2 : aucun échange (1 comparaison) → arrêt. Total 6 comparaisons, 3 échanges = 3 inversions.</p>`
      },
      pieges: [R`Confondre l'indice et la valeur.`, R`Oublier que « pour $i$ de $a$ à $b$ » <b>inclut</b> $b$.`]
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
        R`<b>Formuler</b> l'invariant (ce que la boucle a déjà accompli) : « $t[0..i-1]$ est triée », « si $x \in t$ alors $x \in t[g..d]$ »…`,
        R`<b>Initialisation</b> : il est vrai avant le premier tour.`,
        R`<b>Conservation</b> : s'il est vrai au début d'un tour, il l'est à la fin.`,
        R`<b>Conclusion</b> : en sortie de boucle, invariant + condition d'arrêt donnent le résultat.`,
        R`<b>Terminaison</b> (boucle « tant que ») : une quantité entière positive qui décroît strictement.`
      ],
      exemple: {
        enonce: R`<p>Invariant du tri par insertion.</p>`,
        solution: R`<p>« Au début du tour $i$, $t[0..i-1]$ est triée. » Vrai pour $i = 1$ ; le tour $i$ insère $t[i]$ à sa place dans cette partie triée ; à la sortie ($i = n$), $t[0..n-1]$ est triée.</p>`
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
        questions: [R`La liste peut-elle être vide ?`, R`Fonction (qui renvoie un résultat) ou procédure (qui modifie $t$) ?`] },
      { titre: 'Choisir ou écrire l’algorithme', faire: R`Reconnaître un schéma connu (recherche, insertion, tri, dichotomie, fusion) ; écrire le pseudo-code avec des <b>indices</b> explicites et des bornes précises.` },
      { titre: 'Dérouler sur un exemple', faire: R`Faire un <b>tableau</b> des variables tour par tour sur une petite liste ; vérifier les cas limites (liste vide, un élément, élément absent).` },
      { titre: 'Prouver', faire: R`<b>Invariant</b> de boucle (initialisation, conservation, conclusion) et <b>terminaison</b>.` },
      { titre: 'Évaluer le coût', faire: R`Compter les comparaisons : <b>pire cas</b>, meilleur cas, <b>moyenne</b> ; conclure par un ordre de grandeur ($\Theta$).` }
    ]
  };
  const reperes = [
    { etape: 1, si: R`« Liste triée » dans l'énoncé`, alors: R`Penser <b>dichotomie</b> (recherche en $\Theta(\log n)$) ou exploiter que les égaux sont <b>voisins</b>.` },
    { etape: 1, si: R`« En place », « modifier la liste »`, alors: R`Écrire une <b>procédure</b> sans créer de nouvelle liste : indices et $\text{échanger}(t[i], t[j])$.` },
    { etape: 2, si: R`Insérer ou supprimer au milieu d'une liste`, alors: R`<b>Décaler</b> : vers la droite en partant de la <b>fin</b> (insertion), vers la gauche en partant de $i$ (suppression).` },
    { etape: 2, si: R`Supprimer ou filtrer plusieurs éléments`, alors: R`Deux indices : un de <b>lecture</b> $i$, un d'<b>écriture</b> $k$ ; un seul parcours, $\Theta(n)$.` },
    { etape: 2, si: R`Combiner deux listes triées`, alors: R`<b>Fusion</b> avec deux indices qui avancent : $\Theta(n + m)$.` },
    { etape: 3, si: R`Une boucle « tant que » avec $g$, $d$`, alors: R`Tableau $(g, d, m, t[m])$ ; s'arrêter quand <b>$g > d$</b> (élément absent).` },
    { etape: 3, si: R`Un doute sur les bornes d'une boucle « pour »`, alors: R`« pour $i$ de $a$ à $b$ » fait <b>$b - a + 1$</b> tours ($b$ inclus) ; « de $n$ à $i + 1$ par pas de $-1$ » descend jusqu'à $i + 1$.` },
    { etape: 4, si: R`Une boucle « pour » qui construit le résultat petit à petit`, alors: R`Invariant du type « <b>$t[0..i-1]$ est triée</b> » ou « $t[0..k-1]$ contient les éléments déjà traités ».` },
    { etape: 4, si: R`Une boucle « tant que » (dichotomie…)`, alors: R`<b>Terminaison</b> : $d - g$ décroît strictement ; <b>invariant</b> : « si $x \in t$, alors $x \in t[g..d]$ ».` },
    { etape: 5, si: R`Deux boucles imbriquées, la boucle interne dépendant de $i$`, alors: R`Coût $= \sum_i (\text{tours internes})$, souvent <b>$\frac{n(n-1)}{2}$</b>.` },
    { etape: 5, si: R`La zone de recherche est divisée par 2 à chaque tour`, alors: R`<b>$\lfloor\log_2 n\rfloor + 1$</b> tours au plus.` },
    { etape: 5, si: R`Des échanges ou décalages de <b>voisins</b>`, alors: R`Leur nombre est le <b>nombre d'inversions</b> ; en moyenne $\frac{n(n-1)}{4}$.` },
    { etape: 5, si: R`Une instruction « en une ligne » : appartenance $x \in t$, insertion au milieu…`, alors: R`Elle cache un parcours ou des décalages : compter <b>$\Theta(n)$</b>.` }
  ];


  /* ------------------------------------------------------------------ */
  /* Corrections détaillées (bouton « Correction détaillée »)            */
  /* ------------------------------------------------------------------ */
  const details = {
    selection: {
      but: R`<p>Dérouler le tri par sélection sur <code>[5, 2, 8, 1, 9, 3]</code> et compter comparaisons et échanges.</p>`,
      methode: R`<p>Au tour $i$, la boucle interne cherche l'indice <code>imin</code> du minimum de $t[i..n-1]$ (une comparaison par valeur de $j$), puis on échange $t[i]$ et $t[\text{imin}]$. Après le tour $i$, $t[0..i]$ contient les $i + 1$ plus petits éléments, triés.</p>`,
      etapes: [
        R`<b>Tour $i = 0$</b> : on parcourt $t[1..5]$. $2 \lt 5$ → imin $= 1$ ; $8$ non ; $1 \lt 2$ → imin $= 3$ ; $9$ non ; $3$ non. Minimum $1$ (indice 3), 5 comparaisons. Échange de $t[0]$ et $t[3]$ : <code>[1, 2, 8, 5, 9, 3]</code>.`,
        R`<b>Tour $i = 1$</b> : $t[1..5] = 2, 8, 5, 9, 3$ ; le minimum $2$ est déjà en position 1 (4 comparaisons). Échange de $t[1]$ avec lui-même : rien ne change.`,
        R`<b>Tour $i = 2$</b> : $t[2..5] = 8, 5, 9, 3$ ; $5 \lt 8$ → imin $= 3$ ; $9$ non ; $3 \lt 5$ → imin $= 5$ (3 comparaisons). Échange de $t[2]$ et $t[5]$ : <code>[1, 2, 3, 5, 9, 8]</code>.`,
        R`<b>Tour $i = 3$</b> : $t[3..5] = 5, 9, 8$ ; minimum $5$ déjà en place (2 comparaisons).`,
        R`<b>Tour $i = 4$</b> : $t[4..5] = 9, 8$ ; minimum $8$ en position 5 (1 comparaison). Échange : <code>[1, 2, 3, 5, 8, 9]</code>. La boucle s'arrête à $i = n - 2 = 4$ : le dernier élément est forcément le plus grand.`,
        R`<b>Bilan.</b> Comparaisons : $5 + 4 + 3 + 2 + 1 = 15 = \frac{6 \times 5}{2}$. Échanges effectifs (positions différentes) : 3, aux tours 0, 2 et 4.`
      ],
      retenir: R`<p>Le tri par sélection fait toujours $\frac{n(n-1)}{2}$ comparaisons, quelle que soit la liste, mais au plus $n - 1$ échanges.</p>`
    },
    insertion: {
      but: R`<p>Dérouler le tri par insertion sur <code>[4, 1, 3, 5, 2]</code>, compter décalages et comparaisons, puis les relier aux inversions.</p>`,
      methode: R`<p>Au tour $i$, $t[0..i-1]$ est triée ; on mémorise $x = t[i]$ et on décale vers la droite les éléments $\gt x$ (de droite à gauche), puis on place $x$ dans le trou. La condition « $j \gt 0$ <b>et</b> $t[j-1] \gt x$ » est évaluée en court-circuit : si $j = 0$, on ne compare pas.</p>`,
      etapes: [
        R`<b>$i = 1$, $x = 1$</b> : $t[0] = 4 \gt 1$ → décalage, $j = 0$ ; la boucle s'arrête sans comparaison (court-circuit). 1 comparaison, 1 décalage : <code>[1, 4, 3, 5, 2]</code>.`,
        R`<b>$i = 2$, $x = 3$</b> : $4 \gt 3$ → décalage ; $1 \gt 3$ ? non → arrêt. 2 comparaisons, 1 décalage : <code>[1, 3, 4, 5, 2]</code>.`,
        R`<b>$i = 3$, $x = 5$</b> : $4 \gt 5$ ? non → arrêt immédiat. 1 comparaison, 0 décalage.`,
        R`<b>$i = 4$, $x = 2$</b> : $5 \gt 2$, $4 \gt 2$, $3 \gt 2$ → 3 décalages ; $1 \gt 2$ ? non → arrêt. 4 comparaisons : <code>[1, 2, 3, 4, 5]</code>.`,
        R`<b>Totaux.</b> $1 + 1 + 0 + 3 = 5$ décalages et $1 + 2 + 1 + 4 = 8$ comparaisons.`,
        R`<b>Inversions</b> (couples de positions $i \lt j$ avec $t[i] \gt t[j]$) : $(4, 1), (4, 3), (4, 2), (3, 2), (5, 2)$, soit 5.`,
        R`<b>Explication.</b> Un décalage fait passer $x$ devant un élément plus grand situé avant lui : il corrige exactement une inversion. La liste triée n'en a aucune, donc nombre de décalages = nombre d'inversions.`
      ],
      retenir: R`<p>Tri par insertion : décalages = inversions ; il est rapide sur une liste presque triée.</p>`
    },
    dicho: {
      but: R`<p>Dérouler la recherche dichotomique pour une valeur présente (23) puis absente (10).</p>`,
      methode: R`<p>Zone de recherche $t[g..d]$ ; $m = \lfloor (g + d)/2 \rfloor$ ; si $t[m] \lt x$, $x$ ne peut être qu'à droite : $g \leftarrow m + 1$ ; si $t[m] \gt x$, à gauche : $d \leftarrow m - 1$. On s'arrête si on trouve, ou si $g \gt d$ (zone vide).</p>`,
      etapes: [
        R`<b>$x = 23$, tour 1.</b> $g = 0$, $d = 9$, $m = \lfloor 9/2 \rfloor = 4$, $t[4] = 16 \lt 23$ → $g \leftarrow 5$.`,
        R`<b>Tour 2.</b> $g = 5$, $d = 9$, $m = 7$, $t[7] = 56 \gt 23$ → $d \leftarrow 6$.`,
        R`<b>Tour 3.</b> $g = 5$, $d = 6$, $m = \lfloor 11/2 \rfloor = 5$, $t[5] = 23$ : trouvé, résultat <b>5</b>.`,
        R`<b>$x = 10$, tours 1 et 2.</b> $(0, 9)$ : $m = 4$, $16 \gt 10$ → $d \leftarrow 3$ ; $(0, 3)$ : $m = 1$, $5 \lt 10$ → $g \leftarrow 2$.`,
        R`<b>Tours 3 et 4.</b> $(2, 3)$ : $m = 2$, $8 \lt 10$ → $g \leftarrow 3$ ; $(3, 3)$ : $m = 3$, $12 \gt 10$ → $d \leftarrow 2$.`,
        R`<b>Sortie.</b> $g = 3 \gt d = 2$ : zone vide, 10 est absent (il serait entre $t[2] = 8$ et $t[3] = 12$), résultat <b>$-1$</b> après 4 tours $= \lfloor\log_2 10\rfloor + 1$.`
      ],
      retenir: R`<p>À chaque tour, la zone est au moins divisée par 2 : au plus $\lfloor\log_2 n\rfloor + 1$ tours.</p>`
    },
    couts: {
      but: R`<p>Meilleur et pire cas (en comparaisons) des trois tris élémentaires.</p>`,
      methode: R`<p>Compter, pour chaque tour de la boucle externe, le nombre de tours de la boucle interne, puis sommer : $1 + 2 + \dots + (n-1) = \frac{n(n-1)}{2}$.</p>`,
      etapes: [
        R`<b>Sélection.</b> Au tour $i$, la boucle « pour $j$ de $i + 1$ à $n - 1$ » fait $n - 1 - i$ comparaisons, sans jamais s'arrêter avant. Total $\sum_{i=0}^{n-2}(n-1-i) = \frac{n(n-1)}{2}$ pour <b>toute</b> liste : pas de meilleur ni de pire cas.`,
        R`<b>Insertion, meilleur cas.</b> Liste déjà triée : au tour $i$, la première comparaison $t[i-1] \gt x$ est fausse, on s'arrête. $n - 1$ comparaisons, aucun décalage : $\Theta(n)$.`,
        R`<b>Insertion, pire cas.</b> Liste décroissante : $x$ est plus petit que tous les éléments précédents, on fait $i$ comparaisons et $i$ décalages. Total $\frac{n(n-1)}{2}$ : $\Theta(n^2)$.`,
        R`<b>Bulles, meilleur cas.</b> Liste triée : le premier passage ($n - 1$ comparaisons) ne fait aucun échange, la variable <code>échange</code> reste à faux et l'on s'arrête : $\Theta(n)$.`,
        R`<b>Bulles, pire cas.</b> Liste décroissante : chaque passage fait des échanges, on fait les $n - 1$ passages, le passage $i$ comptant $n - 1 - i$ comparaisons : $\frac{n(n-1)}{2}$.`,
        R`<b>Piège.</b> <code>[2, 3, …, n, 1]</code> n'a que $n - 1$ inversions, mais le 1 ne recule que d'une case par passage : il faut aussi $n - 1$ passages, donc $\frac{n(n-1)}{2}$ comparaisons.`
      ],
      retenir: R`<p>Insertion et bulles (avec arrêt) : $\Theta(n)$ au mieux, $\Theta(n^2)$ au pire ; sélection : toujours $\Theta(n^2)$.</p>`
    },
    'supprimer-valeur': {
      but: R`<p>Comparer la suppression naïve de toutes les occurrences de $x$ à une méthode en un seul parcours.</p>`,
      methode: R`<p>Deux indices : $i$ <b>lit</b> chaque case, $k$ <b>écrit</b> les éléments conservés. On tronque à la fin.</p>`,
      etapes: [
        R`<b>Coût de la méthode naïve.</b> Une recherche séquentielle coûte jusqu'à $n$ comparaisons et une suppression jusqu'à $n - 1$ décalages. Si $t$ ne contient que des $x$, on recommence $n$ fois sur des listes de tailles $n, n-1, \dots$ : de l'ordre de $\frac{n^2}{2}$ opérations, $\Theta(n^2)$.`,
        R`<b>Idée.</b> On recopie vers la gauche les éléments $\neq x$, dans l'ordre, sans jamais décaler toute la fin de la liste.`,
        R`<b>Exemple</b> avec $x = 7$ et <code>[3, 7, 1, 7, 7, 2]</code> : $i = 0$ : $3 \neq 7$, $t[0] \leftarrow 3$, $k = 1$ ; $i = 1$ : ignoré ; $i = 2$ : $t[1] \leftarrow 1$, $k = 2$ ; $i = 3, 4$ : ignorés ; $i = 5$ : $t[2] \leftarrow 2$, $k = 3$. On obtient <code>[3, 1, 2, 7, 7, 2]</code> puis on retire les 3 dernières cases : <code>[3, 1, 2]</code>.`,
        R`<b>Invariant.</b> Avant le tour $i$, $t[0..k-1]$ contient, dans l'ordre, les éléments $\neq x$ de la liste d'origine situés en positions $0..i-1$ (et $k \le i$, donc on n'écrase jamais une case non lue).`,
        R`<b>Coût.</b> $n$ tours en $O(1)$, puis $n - k$ appels à <code>retirer_fin</code> en $O(1)$ : $\Theta(n)$.`
      ],
      retenir: R`<p>Technique « lecture / écriture » : un seul parcours remplace des suppressions répétées.</p>`
    },
    'supprimer-valeur#1': {
      but: R`<p>Supprimer les doublons d'une liste triée en $\Theta(n)$.</p>`,
      methode: R`<p>Même technique lecture / écriture ; dans une liste <b>triée</b>, les valeurs égales sont voisines, il suffit de comparer à la dernière valeur conservée $t[k-1]$.</p>`,
      etapes: [
        R`<b>Initialisation.</b> Liste vide : rien à faire. Sinon $t[0]$ est conservé : $k = 1$.`,
        R`<b>Tour $i$.</b> Si $t[i] \neq t[k-1]$, c'est une nouvelle valeur (plus grande, car la liste est triée) : on l'écrit en $t[k]$ et $k \leftarrow k + 1$. Sinon c'est un doublon, on l'ignore.`,
        R`<b>Exemple.</b> <code>[1, 1, 2, 2, 2, 5]</code> : on garde 1, ignore 1, garde 2, ignore 2, 2, garde 5 → $k = 3$, puis troncature : <code>[1, 2, 5]</code>.`,
        R`<b>Coût.</b> Un parcours et des retraits en fin : $\Theta(n)$.`
      ],
      retenir: R`<p>Sur une liste triée, « déjà vu » se teste en comparant au dernier élément gardé.</p>`
    },
    'inserer-trie': {
      but: R`<p>Insérer $x$ dans une liste triée en la gardant triée, et analyser le coût.</p>`,
      methode: R`<p>Ouvrir une case à la fin, puis décaler vers la droite les éléments $\gt x$ en partant de la fin, et placer $x$ dans le trou.</p>`,
      etapes: [
        R`<b>Faire de la place.</b> <code>ajouter_fin(t, x)</code> agrandit la liste ; le trou est en position $j = n$ (dernière case).`,
        R`<b>Décaler.</b> Tant que $j \gt 0$ et $t[j-1] \gt x$ : $t[j] \leftarrow t[j-1]$, $j \leftarrow j - 1$. Les éléments décalés sont tous $\gt x$ et restent dans l'ordre.`,
        R`<b>Placer.</b> On sort quand $j = 0$ ou $t[j-1] \le x$ : $t[0..j-1] \le x \lt t[j+1..n]$, donc $t[j] \leftarrow x$ laisse la liste triée.`,
        R`<b>Coût.</b> Meilleur cas ($x \ge$ dernier élément) : 1 comparaison. Pire cas ($x$ plus petit que tous) : $n$ comparaisons et $n$ décalages, $\Theta(n)$.`,
        R`<b>Et la dichotomie ?</b> Elle trouve la position en $\Theta(\log n)$, mais il faut toujours décaler jusqu'à $n$ éléments : le coût reste $\Theta(n)$.`,
        R`<b>Tri par insertion.</b> Insérer successivement chaque élément dans une liste triée qui grandit : c'est exactement l'algorithme du cours.`
      ],
      retenir: R`<p>Dans un tableau, insérer au milieu coûte des décalages : $\Theta(n)$ dans le pire cas.</p>`
    },
    invariant: {
      but: R`<p>Prouver que <i>tri_sélection</i> trie la liste.</p>`,
      methode: R`<p>Un invariant par boucle : on le vérifie à l'entrée (initialisation), on montre qu'un tour le conserve, puis on regarde ce qu'il donne à la sortie.</p>`,
      etapes: [
        R`<b>Boucle interne : invariant.</b> « Avant le tour $j$, $t[\text{imin}]$ est le minimum de $t[i..j-1]$. »`,
        R`<b>Initialisation.</b> Avant $j = i + 1$ : imin $= i$ et $t[i..i]$ n'a qu'un élément.`,
        R`<b>Conservation.</b> Si $t[j] \lt t[\text{imin}]$, $t[j]$ est le nouveau minimum de $t[i..j]$ et on fait imin $\leftarrow j$ ; sinon l'ancien reste le minimum.`,
        R`<b>Sortie.</b> Après $j = n - 1$ : $t[\text{imin}]$ est le minimum de $t[i..n-1]$.`,
        R`<b>Boucle externe : invariant.</b> « Après le tour $i$, $t[0] \le \dots \le t[i]$ sont les $i + 1$ plus petits éléments, et tout élément de $t[i+1..n-1]$ est $\ge t[i]$. »`,
        R`<b>Conservation.</b> Au tour $i$, on place en position $i$ le minimum de $t[i..n-1]$, qui est $\ge t[i-1]$ (par l'invariant au tour précédent) et $\le$ tous les éléments restants.`,
        R`<b>Fin.</b> Après le tour $n - 2$, $t[0..n-2]$ est triée et $t[n-1]$, qui est $\ge t[n-2]$, est à sa place : la liste est triée. Les échanges ne font que permuter les éléments : c'est bien la même liste, triée. La terminaison est immédiate (boucles « pour »).`
      ],
      retenir: R`<p>Preuve d'algorithme : invariant (initialisation, conservation, conclusion) + terminaison.</p>`
    },
    'invariant#1': {
      but: R`<p>Prouver la terminaison et la correction de la recherche dichotomique.</p>`,
      methode: R`<p>Terminaison : un <b>variant</b> entier positif qui décroît strictement. Correction : un <b>invariant</b> sur la zone $t[g..d]$.</p>`,
      etapes: [
        R`<b>Variant.</b> $v = d - g + 1$ (taille de la zone). Tant que $g \le d$, $v \ge 1$.`,
        R`<b>Décroissance.</b> $g \le m \le d$. Si $g \leftarrow m + 1$, $g$ augmente d'au moins 1 ; si $d \leftarrow m - 1$, $d$ diminue d'au moins 1. Donc $v$ décroît strictement : la boucle s'arrête.`,
        R`<b>Invariant.</b> « Si $x$ est dans $t$, il est dans $t[g..d]$. » Vrai au départ (zone entière).`,
        R`<b>Conservation.</b> Si $t[m] \lt x$, comme $t$ est triée, $t[g..m] \lt x$ : $x$ ne peut être que dans $t[m+1..d]$. Symétrique si $t[m] \gt x$.`,
        R`<b>Conclusion.</b> Si l'on renvoie $m$, c'est que $t[m] = x$. Si l'on sort avec $g \gt d$, la zone est vide, donc par l'invariant $x \notin t$ et $-1$ est correct.`
      ],
      retenir: R`<p>Terminaison : variant ; correction : invariant + condition de sortie.</p>`
    },
    moyenne: {
      but: R`<p>Nombre moyen de comparaisons d'une recherche séquentielle quand $x$ est présent avec probabilité $p$.</p>`,
      methode: R`<p>Distinguer « présent » / « absent » (système complet) et utiliser la formule des probabilités totales pour l'espérance.</p>`,
      etapes: [
        R`<b>Si $x$ est en position $k$</b> ($1 \le k \le n$, en comptant à partir de 1) : la recherche fait $k$ comparaisons.`,
        R`<b>Présent.</b> La position est uniforme : moyenne $\frac{1 + 2 + \dots + n}{n} = \frac{n(n+1)/2}{n} = \frac{n+1}{2}$.`,
        R`<b>Absent.</b> On parcourt toute la liste : $n$ comparaisons.`,
        R`<b>Moyenne globale.</b> $C_{\text{moy}}(n) = p \cdot \frac{n+1}{2} + (1 - p) \cdot n$.`,
        R`<b>Cas particuliers.</b> $p = 1$ : $\frac{n+1}{2}$ ; $p = 0$ : $n$ ; $p = \frac12$ : $\frac{n+1}{4} + \frac n2 = \frac{3n+1}{4}$.`
      ],
      retenir: R`<p>Coût moyen = somme des coûts pondérés par les probabilités des cas.</p>`
    },
    premiere: {
      but: R`<p>Trouver la première occurrence de $x$ dans une liste triée avec doublons, en $\Theta(\log n)$.</p>`,
      methode: R`<p>Ne pas s'arrêter au premier $t[m] = x$ : maintenir l'invariant $t[0..g-1] \lt x \le t[d..n-1]$ jusqu'à ce que $g = d$.</p>`,
      etapes: [
        R`<b>Pourquoi l'algorithme du cours ne suffit pas.</b> Il renvoie une occurrence quelconque : avec <code>[3, 3, 3]</code> et $x = 3$, il renvoie l'indice 1.`,
        R`<b>Initialisation.</b> $g = 0$, $d = n$ : les deux zones $t[0..-1]$ et $t[n..n-1]$ sont vides, l'invariant est vrai.`,
        R`<b>Un tour.</b> $g \le m \lt d$. Si $t[m] \lt x$ : par tri, $t[0..m] \lt x$, on pose $g \leftarrow m + 1$. Sinon $t[m] \ge x$ et donc $t[m..n-1] \ge x$ : $d \leftarrow m$. L'invariant est conservé.`,
        R`<b>Terminaison.</b> $d - g$ décroît strictement ($m + 1 \gt g$ et $m \lt d$).`,
        R`<b>Sortie.</b> $g = d$ : tout ce qui précède $g$ est $\lt x$ et $t[g]$ (si $g \lt n$) est le premier élément $\ge x$. C'est la première occurrence si et seulement si $t[g] = x$.`,
        R`<b>Exemple.</b> <code>[1, 3, 3, 3, 5]</code>, $x = 3$ : $(g, d) = (0, 5)$, $m = 2$, $t[2] = 3 \ge 3$ → $d = 2$ ; $m = 1$, $3 \ge 3$ → $d = 1$ ; $m = 0$, $1 \lt 3$ → $g = 1$ ; $g = d = 1$ et $t[1] = 3$ : résultat 1.`
      ],
      retenir: R`<p>Dichotomie « borne inférieure » : chercher le premier indice où $t[i] \ge x$, puis tester l'égalité.</p>`
    },
    fusion: {
      but: R`<p>Fusionner deux listes triées en $\Theta(n + m)$ et compter les comparaisons.</p>`,
      methode: R`<p>Deux indices $i$, $j$ ; à chaque étape on compare $a[i]$ et $b[j]$ et on ajoute le plus petit à $r$. Quand une liste est épuisée, on recopie l'autre.</p>`,
      etapes: [
        R`<b>Invariant.</b> $r$ contient, triés, les $i + j$ plus petits éléments de $a$ et $b$ ; $a[i]$ et $b[j]$ sont les plus petits des éléments non encore placés.`,
        R`<b>Exemple.</b> $a = $ <code>[1, 4, 9]</code>, $b = $ <code>[2, 3, 10]</code> : $1 \le 2$ → 1 ; $4 \gt 2$ → 2 ; $4 \gt 3$ → 3 ; $4 \le 10$ → 4 ; $9 \le 10$ → 9 ; $a$ est épuisé, on recopie 10. Résultat <code>[1, 2, 3, 4, 9, 10]</code> avec 5 comparaisons.`,
        R`<b>Fin.</b> Quand $a$ (ou $b$) est épuisé, les éléments restants de l'autre liste sont tous plus grands que ceux de $r$ et déjà triés : on les recopie sans comparaison.`,
        R`<b>Comptage.</b> Chaque comparaison place un élément ; le dernier élément est toujours placé sans comparaison. Donc au plus $n + m - 1$ comparaisons, et $n + m$ ajouts : $\Theta(n + m)$.`
      ],
      retenir: R`<p>La fusion de deux listes triées est la brique de base du tri fusion.</p>`
    }
  };
  L2.chapter('algo', 'listes', {
    intro: R`<p>Les listes sont la structure de base pour stocker une suite de valeurs. On étudie le coût des opérations élémentaires (recherche, insertion, suppression), puis le cas des listes <b>triées</b> : trois tris élémentaires et la recherche dichotomique. On termine par la notion d'efficacité d'un algorithme : pire des cas et cas moyen. Les algorithmes sont écrits en <b>pseudo-code</b> (conventions ci-dessous).</p>`,
    cours, fiche, exercices, methodes, generateurs, plan, reperes, details
  });
})();
