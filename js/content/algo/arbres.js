/* Algorithmique — Chapitre 2 : Arbres  (algorithmes en PSEUDO-CODE)
   terminologie ; encodage ; parcours préfixe / postfixe, récursifs et itératifs ;
   arbres binaires de recherche (implémentation, parcours infixe, recherche, insertion, suppression) */
(function () {
  'use strict';
  const R = String.raw;
  const algo = L2.algo;

  /* ------------------------------------------------------------------ */
  /* Arbres binaires en JS : construction, parcours, ABR, dessin SVG      */
  /* ------------------------------------------------------------------ */
  const nd = (v, g, d) => ({ v, g: g || null, d: d || null });
  function prefixe(a, o) { o = o || []; if (a) { o.push(a.v); prefixe(a.g, o); prefixe(a.d, o); } return o; }
  function infixe(a, o) { o = o || []; if (a) { infixe(a.g, o); o.push(a.v); infixe(a.d, o); } return o; }
  function postfixe(a, o) { o = o || []; if (a) { postfixe(a.g, o); postfixe(a.d, o); o.push(a.v); } return o; }
  function largeur(a) { const o = [], f = a ? [a] : []; while (f.length) { const n = f.shift(); o.push(n.v); if (n.g) f.push(n.g); if (n.d) f.push(n.d); } return o; }
  function hauteur(a) { return a ? 1 + Math.max(hauteur(a.g), hauteur(a.d)) : -1; }
  function taille(a) { return a ? 1 + taille(a.g) + taille(a.d) : 0; }
  function feuilles(a, o) { o = o || []; if (a) { if (!a.g && !a.d) o.push(a.v); feuilles(a.g, o); feuilles(a.d, o); } return o; }
  function clone(a) { return a ? nd(a.v, clone(a.g), clone(a.d)) : null; }
  function abrInserer(a, x) {
    if (!a) return nd(x);
    if (x < a.v) a.g = abrInserer(a.g, x); else if (x > a.v) a.d = abrInserer(a.d, x);
    return a;
  }
  function abrMin(a) { while (a.g) a = a.g; return a; }
  function abrSupprimer(a, x) {
    if (!a) return null;
    if (x < a.v) a.g = abrSupprimer(a.g, x);
    else if (x > a.v) a.d = abrSupprimer(a.d, x);
    else {
      if (!a.g) return a.d;
      if (!a.d) return a.g;
      const m = abrMin(a.d); a.v = m.v; a.d = abrSupprimer(a.d, m.v);
    }
    return a;
  }
  function chercher(a, x) { const ch = []; while (a && a.v !== x) { ch.push(a.v); a = x < a.v ? a.g : a.d; } if (a) ch.push(a.v); return { ch, trouve: !!a }; }
  function trouverNoeud(a, x) { while (a && a.v !== x) a = x < a.v ? a.g : a.d; return a; }
  function nbFils(n) { return (n.g ? 1 : 0) + (n.d ? 1 : 0); }
  function tousNoeuds(a, o) { o = o || []; if (a) { o.push(a); tousNoeuds(a.g, o); tousNoeuds(a.d, o); } return o; }

  /* Dessin SVG d'un arbre binaire : abscisse = rang infixe, ordonnée = profondeur */
  function svgBin(a, opt) {
    opt = opt || {};
    if (!a) return '<em>(arbre vide)</em>';
    const hl = new Set(opt.hl || []), del = new Set(opt.del || []);
    const ns = []; let k = 0;
    (function walk(n, p) { if (!n) return; walk(n.g, p + 1); ns.push({ n, x: k++, y: p }); walk(n.d, p + 1); })(a, 0);
    const pos = new Map(ns.map(o => [o.n, o]));
    const dx = 46, dy = 60, rr = 18, pad = 6;
    const X = o => pad + rr + o.x * dx, Y = o => pad + rr + o.y * dy + (opt.index ? 8 : 0);
    const W = 2 * (pad + rr) + (k - 1) * dx, H = 2 * (pad + rr) + hauteur(a) * dy + (opt.index ? 8 : 0);
    let lines = '', nodes = '';
    ns.forEach(o => {
      [o.n.g, o.n.d].forEach(c => { if (c) { const q = pos.get(c); lines += `<line x1="${X(o)}" y1="${Y(o)}" x2="${X(q)}" y2="${Y(q)}"/>`; } });
      const cls = del.has(o.n.v) ? 'del' : hl.has(o.n.v) ? 'hl' : '';
      nodes += `<g class="${cls}"><circle cx="${X(o)}" cy="${Y(o)}" r="${rr}"/><text x="${X(o)}" y="${Y(o)}">${o.n.v}</text>` +
        (opt.index && o.n.i !== undefined ? `<text class="idx" x="${X(o)}" y="${Y(o) - rr - 7}">[${o.n.i}]</text>` : '') + '</g>';
    });
    return `<svg class="tree" viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="${opt.label || 'arbre'}">${lines}${nodes}</svg>`;
  }
  /* Dessin d'un arbre général { v, f: [fils] } : feuilles espacées, père au milieu de ses fils */
  function svgGen(a) {
    let k = 0, hmax = 0; const ns = [];
    (function lay(n, p) {
      hmax = Math.max(hmax, p);
      if (!n.f || !n.f.length) { n._x = k++; } else { n.f.forEach(c => lay(c, p + 1)); n._x = (n.f[0]._x + n.f[n.f.length - 1]._x) / 2; }
      n._y = p; ns.push(n);
    })(a, 0);
    const dx = 46, dy = 60, rr = 18, pad = 6;
    const X = n => pad + rr + n._x * dx, Y = n => pad + rr + n._y * dy;
    const W = 2 * (pad + rr) + (k - 1) * dx, H = 2 * (pad + rr) + hmax * dy;
    let lines = '', nodes = '';
    ns.forEach(n => {
      (n.f || []).forEach(c => { lines += `<line x1="${X(n)}" y1="${Y(n)}" x2="${X(c)}" y2="${Y(c)}"/>`; });
      nodes += `<g><circle cx="${X(n)}" cy="${Y(n)}" r="${rr}"/><text x="${X(n)}" y="${Y(n)}">${n.v}</text></g>`;
    });
    return `<svg class="tree" viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="arbre">${lines}${nodes}</svg>`;
  }
  const fig = (...items) => '<div class="tree-fig">' + items.map(([svg, cap]) => '<figure>' + svg + (cap ? '<figcaption>' + cap + '</figcaption>' : '') + '</figure>').join('') + '</div>';
  const seq = t => t.join(', ');

  /* Arbres d'exemple du cours */
  const gEx = { v: 'A', f: [{ v: 'B', f: [{ v: 'E' }, { v: 'F' }] }, { v: 'C' }, { v: 'D', f: [{ v: 'G', f: [{ v: 'H' }, { v: 'I' }] }, { v: 'J' }] }] };
  const bEx = () => nd('A', nd('B', nd('D'), nd('E', nd('G'))), nd('C', null, nd('F')));
  const abrEx = () => [50, 30, 70, 20, 40, 60, 80, 35].reduce((a, x) => abrInserer(a, x), null);

  /* ------------------------------------------------------------------ */
  /* Algorithmes de référence en pseudo-code                             */
  /* ------------------------------------------------------------------ */
  const PS = {
    noeud: `// un nœud a a trois champs : a.valeur, a.gauche, a.droit
// a.gauche et a.droit sont des nœuds, ou NUL (sous-arbre vide)
fonction nouveau_nœud(x)
    a ← nouveau nœud
    a.valeur ← x
    a.gauche ← NUL
    a.droit ← NUL
    retourner a
fin fonction`,
    taille: `fonction taille(a)
    si a = NUL alors
        retourner 0
    fin si
    retourner 1 + taille(a.gauche) + taille(a.droit)
fin fonction`,
    hauteur: `fonction hauteur(a)                  // convention : hauteur(NUL) = −1
    si a = NUL alors
        retourner −1
    fin si
    retourner 1 + max(hauteur(a.gauche), hauteur(a.droit))
fin fonction`,
    prefixe: `procédure préfixe(a)
    si a ≠ NUL alors
        traiter(a.valeur)               // la racine AVANT ses sous-arbres
        préfixe(a.gauche)
        préfixe(a.droit)
    fin si
fin procédure`,
    postfixe: `procédure postfixe(a)
    si a ≠ NUL alors
        postfixe(a.gauche)
        postfixe(a.droit)
        traiter(a.valeur)               // la racine APRÈS ses sous-arbres
    fin si
fin procédure`,
    infixe: `procédure infixe(a)
    si a ≠ NUL alors
        infixe(a.gauche)
        traiter(a.valeur)               // la racine ENTRE ses deux sous-arbres
        infixe(a.droit)
    fin si
fin procédure`,
    prefixeGen: `procédure préfixe_général(a)         // arbre quelconque : a.fils = liste des fils
    traiter(a.valeur)
    pour chaque fils f de a faire
        préfixe_général(f)
    fin pour
fin procédure`,
    prefixeIt: `procédure préfixe_itératif(a)
    P ← pile vide
    si a ≠ NUL alors
        empiler(P, a)
    fin si
    tant que non est_vide(P) faire
        n ← dépiler(P)
        traiter(n.valeur)
        si n.droit ≠ NUL alors
            empiler(P, n.droit)         // le droit d'abord :
        fin si
        si n.gauche ≠ NUL alors
            empiler(P, n.gauche)        // le gauche sortira en premier
        fin si
    fin tant que
fin procédure`,
    postfixeIt: `procédure postfixe_itératif(a)
    P ← pile vide
    S ← pile vide
    si a ≠ NUL alors
        empiler(P, a)
    fin si
    tant que non est_vide(P) faire
        n ← dépiler(P)
        empiler(S, n)                   // S reçoit l'ordre racine, droit, gauche
        si n.gauche ≠ NUL alors
            empiler(P, n.gauche)
        fin si
        si n.droit ≠ NUL alors
            empiler(P, n.droit)
        fin si
    fin tant que
    tant que non est_vide(S) faire      // dépiler S inverse l'ordre :
        n ← dépiler(S)                  // gauche, droit, racine = postfixe
        traiter(n.valeur)
    fin tant que
fin procédure`,
    infixeIt: `procédure infixe_itératif(a)
    P ← pile vide
    n ← a
    tant que n ≠ NUL ou non est_vide(P) faire
        tant que n ≠ NUL faire          // descendre le plus à gauche possible
            empiler(P, n)
            n ← n.gauche
        fin tant que
        n ← dépiler(P)
        traiter(n.valeur)
        n ← n.droit                     // puis traiter le sous-arbre droit
    fin tant que
fin procédure`,
    largeur: `procédure largeur(a)                 // parcours niveau par niveau
    F ← file vide
    si a ≠ NUL alors
        enfiler(F, a)
    fin si
    tant que non est_vide(F) faire
        n ← défiler(F)
        traiter(n.valeur)
        si n.gauche ≠ NUL alors enfiler(F, n.gauche) fin si
        si n.droit ≠ NUL alors enfiler(F, n.droit) fin si
    fin tant que
fin procédure`,
    rechercher: `fonction rechercher(a, x)            // a : racine d'un ABR
    tant que a ≠ NUL et a.valeur ≠ x faire
        si x < a.valeur alors
            a ← a.gauche
        sinon
            a ← a.droit
        fin si
    fin tant que
    retourner a                         // le nœud contenant x, ou NUL
fin fonction`,
    inserer: `fonction insérer(a, x)               // renvoie la racine de l'ABR modifié
    si a = NUL alors
        retourner nouveau_nœud(x)
    fin si
    si x < a.valeur alors
        a.gauche ← insérer(a.gauche, x)
    sinon si x > a.valeur alors
        a.droit ← insérer(a.droit, x)
    fin si                              // x déjà présent : rien à faire
    retourner a
fin fonction`,
    minimum: `fonction minimum(a)                  // a ≠ NUL
    tant que a.gauche ≠ NUL faire
        a ← a.gauche
    fin tant que
    retourner a
fin fonction`,
    supprimer: `fonction supprimer(a, x)             // renvoie la racine de l'ABR modifié
    si a = NUL alors
        retourner NUL                   // x absent
    fin si
    si x < a.valeur alors
        a.gauche ← supprimer(a.gauche, x)
    sinon si x > a.valeur alors
        a.droit ← supprimer(a.droit, x)
    sinon                               // a contient x
        si a.gauche = NUL alors
            retourner a.droit           // 0 ou 1 fils : on « remonte » le fils
        sinon si a.droit = NUL alors
            retourner a.gauche
        sinon                           // 2 fils
            m ← minimum(a.droit)        // successeur de x
            a.valeur ← m.valeur
            a.droit ← supprimer(a.droit, m.valeur)
        fin si
    fin si
    retourner a
fin fonction`
  };

  /* ------------------------------------------------------------------ */
  /* Générateurs                                                         */
  /* ------------------------------------------------------------------ */
  function formeAleatoire(r, n) {
    if (n === 0) return null;
    const k = r.int(0, n - 1);
    return nd(null, formeAleatoire(r, k), formeAleatoire(r, n - 1 - k));
  }
  function arbreLettres(r, n) {
    let a; do { a = formeAleatoire(r, n); } while (hauteur(a) > 4 || hauteur(a) < 2);
    const lettres = r.sample('ABCDEFGHIJKLMNPRS'.split(''), n);
    let i = 0; tousNoeuds(a).forEach(x => { x.v = lettres[i++]; });
    return a;
  }
  function abrAleatoire(r, n) {
    let vals, a;
    do { vals = r.sample(Array.from({ length: 89 }, (_, k) => k + 10), n); a = vals.reduce((t, x) => abrInserer(t, x), null); }
    while (hauteur(a) > 4);
    return { vals, a };
  }

  const generateurs = {
    parcours: {
      title: 'Parcours d’un arbre binaire', diff: 1,
      make(r) {
        const a = arbreLettres(r, r.int(6, 9));
        return {
          detail: (() => {
            const sg = s => (s ? 'de racine ' + s.v : 'vide');
            const part = (f, s) => (s ? seq(f(s)) : '(rien)');
            return {
              but: R`<p>Donner les trois parcours en profondeur, puis la taille, la hauteur et les feuilles.</p>`,
              methode: R`<p>Définitions récursives : préfixe = racine, puis préfixe(gauche), puis préfixe(droit) ; infixe = infixe(gauche), racine, infixe(droit) ; postfixe = postfixe(gauche), postfixe(droit), racine. On applique la règle à la racine, puis à chaque sous-arbre.</p>`,
              etapes: [
                R`<b>Découpage.</b> Racine ${a.v} ; sous-arbre gauche ${sg(a.g)} ; sous-arbre droit ${sg(a.d)}.`,
                R`<b>Préfixe.</b> ${a.v} | ${part(prefixe, a.g)} | ${part(prefixe, a.d)} → <b>${seq(prefixe(a))}</b>.`,
                R`<b>Infixe.</b> ${part(infixe, a.g)} | ${a.v} | ${part(infixe, a.d)} → <b>${seq(infixe(a))}</b>.`,
                R`<b>Postfixe.</b> ${part(postfixe, a.g)} | ${part(postfixe, a.d)} | ${a.v} → <b>${seq(postfixe(a))}</b>.`,
                R`<b>Taille.</b> $1 + \text{taille(gauche)} + \text{taille(droit)} = 1 + ${taille(a.g)} + ${taille(a.d)} = ${taille(a)}$.`,
                R`<b>Hauteur.</b> $1 + \max(${hauteur(a.g)}, ${hauteur(a.d)}) = ${hauteur(a)}$ (convention : un arbre vide a pour hauteur $-1$).`,
                R`<b>Feuilles</b> (nœuds sans fils), dans l'ordre de gauche à droite : ${seq(feuilles(a))}.`
              ],
              retenir: R`<p>Contrôle rapide : le préfixe commence par la racine, le postfixe finit par la racine, et la racine coupe l'infixe en « gauche » et « droit ».</p>`
            };
          })(),
          enonce: R`<p>On considère l'arbre binaire suivant.</p>${fig([svgBin(a)])}<ol><li>Donner les parcours <b>préfixe</b>, <b>infixe</b> et <b>postfixe</b>.</li><li>Donner sa taille, sa hauteur et ses feuilles.</li></ol>`,
          indication: R`<p>Faire le tour de l'arbre en partant de la racine, le long du bord gauche : préfixe = 1<sup>er</sup> passage près d'un nœud, infixe = passage par-dessous, postfixe = dernier passage.</p>`,
          correction: R`<ul><li>Préfixe (racine, gauche, droit) : <b>${seq(prefixe(a))}</b></li>
            <li>Infixe (gauche, racine, droit) : <b>${seq(infixe(a))}</b></li>
            <li>Postfixe (gauche, droit, racine) : <b>${seq(postfixe(a))}</b></li></ul>
            <p>Taille : $${taille(a)}$ ; hauteur : $${hauteur(a)}$ (nombre d'arêtes du plus long chemin depuis la racine) ; feuilles : ${seq(feuilles(a))}.</p>
            <p><em>Contrôle :</em> le préfixe commence par la racine ${a.v}, le postfixe finit par ${a.v}.</p>`
        };
      }
    },

    abrInsertion: {
      title: 'Construire un ABR par insertions', diff: 1,
      make(r) {
        const { vals, a } = abrAleatoire(r, r.int(7, 9));
        const present = r.chance(0.5);
        let v;
        if (present) v = r.pick(vals); else { do { v = r.int(10, 98); } while (vals.includes(v)); }
        const c = chercher(a, v);
        return {
          detail: (() => {
            const dir = (x, y) => (x < y ? 'gauche' : 'droite');
            let t = null;
            const pas = vals.map((x, k) => {
              const ch = chercher(t, x).ch;
              t = abrInserer(t, x);
              if (!ch.length) return R`<b>${x}</b> devient la racine.`;
              const last = ch[ch.length - 1];
              return R`<b>${x}</b> : ${ch.map(y => y + (x < y ? ' ($' + x + ' \\lt ' + y + '$, gauche)' : ' ($' + x + ' \\gt ' + y + '$, droite)')).join(' → ')} → fils ${x < last ? 'gauche' : 'droit'} de ${last}.`;
            });
            const rc = c.ch.map((y, i) => (i === c.ch.length - 1 && c.trouve ? y + ' (trouvé)' : y + ' (' + dir(v, y) + ')')).join(' → ');
            return {
              but: R`<p>Construire l'ABR par insertions successives, puis lire hauteur, parcours infixe et chemin de recherche.</p>`,
              methode: R`<p>Chaque valeur part de la racine et descend : à gauche si elle est plus petite que le nœud rencontré, à droite si elle est plus grande, jusqu'à une place vide.</p>`,
              etapes: [
                ...pas,
                R`<b>Hauteur.</b> La branche la plus longue compte $${hauteur(a)}$ arêtes : hauteur $${hauteur(a)}$.`,
                R`<b>Parcours infixe.</b> ${seq(infixe(a))} : la liste triée, comme dans tout ABR.`,
                R`<b>Recherche de ${v}.</b> ${rc}${c.trouve ? '' : ' → sous-arbre vide'} : ${c.trouve ? 'recherche fructueuse' : v + ' est absent'}, ${c.ch.length} comparaison${c.ch.length > 1 ? 's' : ''} (au plus hauteur + 1 = ${hauteur(a) + 1}).`
              ],
              retenir: R`<p>Insertion et recherche suivent le même chemin depuis la racine : coût $O(h)$.</p>`
            };
          })(),
          enonce: R`<p>On insère successivement, dans un arbre binaire de recherche initialement vide, les valeurs : <b>${seq(vals)}</b>.</p><ol><li>Dessiner l'arbre obtenu. Quelle est sa hauteur ?</li><li>Donner son parcours infixe.</li><li>Quels nœuds sont visités par la recherche de $${v}$ ? Est-elle fructueuse ?</li></ol>`,
          indication: R`<p>Chaque valeur descend depuis la racine : à gauche si elle est plus petite, à droite si elle est plus grande, jusqu'à une place vide.</p>`,
          correction: R`${fig([svgBin(a, { hl: c.ch, label: 'ABR obtenu' }), 'ABR obtenu (en couleur : chemin de recherche de ' + v + ')'])}
            <p>1. Hauteur : $${hauteur(a)}$.</p>
            <p>2. Parcours infixe : ${seq(infixe(a))} : c'est la liste <b>triée</b> (propriété des ABR).</p>
            <p>3. Nœuds visités : ${seq(c.ch)}. ${c.trouve ? `La recherche est <b>fructueuse</b> (${v} est trouvé après ${c.ch.length} comparaison${c.ch.length > 1 ? 's' : ''}).` : `On arrive sur un sous-arbre vide : ${v} est <b>absent</b> (${c.ch.length} nœuds visités).`}</p>
            <p>Remarque : le nombre de nœuds visités est au plus hauteur + 1 = ${hauteur(a) + 1}.</p>`
        };
      }
    },

    abrSuppression: {
      title: 'Supprimer dans un ABR', diff: 2,
      make(r) {
        let vals, a, cible, cas;
        for (let essai = 0; essai < 50; essai++) {
          ({ vals, a } = abrAleatoire(r, r.int(8, 10)));
          cas = r.pick([0, 1, 2, 2]);
          const cands = tousNoeuds(a).filter(n => nbFils(n) === cas && (cas !== 2 || n !== a || r.chance(0.5)));
          if (cands.length) { cible = r.pick(cands).v; break; }
        }
        if (cible === undefined) { cas = 0; cible = feuilles(a)[0]; }
        const avant = clone(a);
        const n = trouverNoeud(a, cible);
        let expl;
        if (cas === 0) expl = R`${cible} est une <b>feuille</b> : on la retire simplement.`;
        else if (cas === 1) { const f = n.g || n.d; expl = R`${cible} a <b>un seul fils</b> (${f.v}) : on le remplace par ce fils, avec tout son sous-arbre.`; }
        else { const m = abrMin(n.d).v; expl = R`${cible} a <b>deux fils</b> : on le remplace par son <b>successeur</b> ${m} (le minimum de son sous-arbre droit, obtenu en descendant à droite une fois puis à gauche tant que possible), puis on supprime ${m} de ce sous-arbre droit (il a au plus un fils droit).`; }
        const apres = abrSupprimer(a, cible);
        return {
          detail: (() => {
            const ch = chercher(avant, cible).ch;
            const nAv = trouverNoeud(avant, cible);
            const fils = [nAv.g, nAv.d].filter(Boolean).map(f => f.v);
            const steps = [
              R`<b>Trouver le nœud.</b> Depuis la racine : ${ch.map((y, i) => (i === ch.length - 1 ? y : y + ' (' + (cible < y ? 'gauche' : 'droite') + ')')).join(' → ')}.`,
              R`<b>Compter ses fils.</b> ${cible} a ${fils.length === 0 ? 'aucun fils : c’est une feuille' : fils.length === 1 ? 'un seul fils (' + fils[0] + ')' : 'deux fils (' + fils.join(' et ') + ')'}.`
            ];
            if (cas === 0) steps.push(R`<b>Cas 0 fils.</b> On retire simplement la feuille : le lien de son père vers elle devient NUL.`);
            else if (cas === 1) steps.push(R`<b>Cas 1 fils.</b> Le fils ${fils[0]} prend la place de ${cible}, avec tout son sous-arbre. L'ordre est respecté : ce sous-arbre était déjà du bon côté de tous les ancêtres de ${cible}.`);
            else {
              const s = []; let q = nAv.d; s.push(q.v); while (q.g) { q = q.g; s.push(q.v); }
              const m = s[s.length - 1];
              steps.push(R`<b>Cas 2 fils : successeur.</b> Minimum du sous-arbre droit : une fois à droite, puis à gauche tant que possible : ${s.join(' → ')}. Le successeur est ${m}.`);
              steps.push(R`<b>Remplacement.</b> On écrit ${m} à la place de ${cible}, puis on supprime ${m} du sous-arbre droit ; il n'a pas de fils gauche, donc c'est le cas 0 ou 1 fils.`);
              steps.push(R`<b>Pourquoi l'ordre est respecté.</b> ${m} est plus grand que tout le sous-arbre gauche de ${cible} et plus petit que tout ce qui reste à droite.`);
            }
            steps.push(R`<b>Contrôle.</b> Parcours infixe après suppression : ${seq(infixe(apres))}, toujours trié.`);
            return {
              but: R`<p>Supprimer ${cible} de l'ABR en appliquant le bon cas de l'algorithme.</p>`,
              methode: R`<p>Trois cas selon le nombre de fils du nœud : 0 → on le retire ; 1 → son fils remonte ; 2 → on le remplace par son successeur (minimum du sous-arbre droit), que l'on supprime ensuite.</p>`,
              etapes: steps,
              retenir: R`<p>Successeur : une fois à droite, puis tout à gauche ; il a au plus un fils (droit).</p>`
            };
          })(),
          enonce: R`<p>Dans l'arbre binaire de recherche ci-dessous, supprimer la valeur <b>${cible}</b> avec l'algorithme du cours. Dessiner l'arbre obtenu.</p>${fig([svgBin(avant, { del: [cible] })])}`,
          indication: R`<p>Combien de fils a le nœud ${cible} ? Trois cas : 0, 1 ou 2 fils.</p>`,
          correction: R`<p>${expl}</p>${fig([svgBin(apres), 'après suppression de ' + cible])}
            <p><em>Contrôle :</em> le parcours infixe ${seq(infixe(apres))} est toujours trié.</p>`
        };
      }
    },

    tableau: {
      title: 'Arbre binaire rangé dans un tableau', diff: 2,
      make(r) {
        const n = r.int(7, 12);
        const t = r.sample(Array.from({ length: 40 }, (_, k) => k + 1), n);
        const nodes = t.map((v, i) => Object.assign(nd(v), { i }));
        nodes.forEach((x, i) => { if (2 * i + 1 < n) x.g = nodes[2 * i + 1]; if (2 * i + 2 < n) x.d = nodes[2 * i + 2]; });
        const i = r.int(0, Math.floor((n - 2) / 2));
        const j = r.int(1, n - 1);
        const fils = [2 * i + 1, 2 * i + 2].filter(k => k < n);
        const p = Math.floor((j - 1) / 2);
        return {
          detail: (() => {
            const niveaux = [];
            for (let k = 0; Math.pow(2, k) - 1 < n; k++) {
              const a0 = Math.pow(2, k) - 1, a1 = Math.min(Math.pow(2, k + 1) - 2, n - 1);
              niveaux.push(R`niveau ${k} : cases ${a0}${a1 > a0 ? ' à ' + a1 : ''} (${t.slice(a0, a1 + 1).join(', ')})`);
            }
            return {
              but: R`<p>Retrouver l'arbre rangé dans le tableau, puis des fils, un père et la hauteur.</p>`,
              methode: R`<p>Racine en case 0 ; fils de la case $i$ en cases $2i + 1$ et $2i + 2$ (s'ils sont $\lt n$) ; père de la case $i \ge 1$ en case $\lfloor (i-1)/2 \rfloor$. Le niveau $k$ occupe les cases $2^k - 1$ à $2^{k+1} - 2$.</p>`,
              etapes: [
                R`<b>Niveaux.</b> ${niveaux.join(' ; ')}.`,
                R`<b>Fils de la case ${i}.</b> $2 \times ${i} + 1 = ${2 * i + 1}$ et $2 \times ${i} + 2 = ${2 * i + 2}$${2 * i + 2 >= n ? ' (cette case n’existe pas : $' + (2 * i + 2) + ' \\ge ' + n + '$)' : ''} : ${fils.map(k => 'case ' + k + ' (' + t[k] + ')').join(' et ')}.`,
                R`<b>Père de la case ${j}.</b> $\lfloor (${j} - 1)/2 \rfloor = \lfloor ${(j - 1) / 2 === Math.floor((j - 1) / 2) ? (j - 1) / 2 : String((j - 1) / 2).replace('.', '{,}')} \rfloor = ${p}$ : valeur ${t[p]}.`,
                R`<b>Hauteur.</b> La dernière case, $${n - 1}$, est au niveau $\lfloor\log_2 ${n}\rfloor = ${Math.floor(Math.log2(n))}$ (car $2^{${Math.floor(Math.log2(n))}} \le ${n} \lt 2^{${Math.floor(Math.log2(n)) + 1}}$) : hauteur ${Math.floor(Math.log2(n))}.`
              ],
              retenir: R`<p>Un tableau sans trou représente un arbre <b>complet</b> : hauteur $\lfloor\log_2 n\rfloor$, la plus petite possible.</p>`
            };
          })(),
          enonce: R`<p>Un arbre binaire est rangé dans le tableau <code>t = [${t.join(', ')}]</code> selon la convention du cours (racine en case $0$, fils de la case $i$ en cases $2i+1$ et $2i+2$).</p><ol><li>Dessiner l'arbre.</li><li>Quels sont les fils de la case $${i}$ (valeur ${t[i]}) ?</li><li>Quel est le père de la case $${j}$ (valeur ${t[j]}) ?</li><li>Quelle est la hauteur de l'arbre ?</li></ol>`,
          correction: R`${fig([svgBin(nodes[0], { index: true }), 'entre crochets : indice de la case'])}
            <p>2. Fils de la case $${i}$ : cases $${fils.join('$ et $')}$, soit ${fils.map(k => t[k]).join(' et ')}.</p>
            <p>3. Père de la case $${j}$ : case $\lfloor (${j} - 1)/2 \rfloor = ${p}$, valeur ${t[p]}.</p>
            <p>4. Hauteur $\lfloor \log_2 ${n} \rfloor = ${Math.floor(Math.log2(n))}$ : l'arbre est <b>complet</b> (tous les niveaux pleins sauf le dernier, rempli de gauche à droite).</p>`
        };
      }
    },

    hauteurs: {
      title: 'Hauteur et nombre de nœuds', diff: 2,
      make(r) {
        const n = r.pick([7, 10, 15, 20, 31, 50, 100, 1000]);
        const h = r.int(2, 6);
        return {
          detail: {
            but: R`<p>Encadrer la hauteur d'un arbre binaire à $${n}$ nœuds et le nombre de nœuds d'un arbre de hauteur $${h}$.</p>`,
            methode: R`<p>Au niveau $k$, il y a au plus $2^k$ nœuds (chaque nœud a au plus 2 fils) ; et au moins un nœud par niveau jusqu'à la hauteur.</p>`,
            etapes: [
              R`<b>Hauteur maximale.</b> Un seul nœud par niveau (arbre filiforme) : $${n}$ nœuds sur $${n}$ niveaux, hauteur $${n} - 1 = ${n - 1}$.`,
              R`<b>Nœuds au plus.</b> Hauteur $h$ : au plus $1 + 2 + 4 + \dots + 2^h = 2^{h+1} - 1$ nœuds (somme géométrique).`,
              R`<b>Hauteur minimale.</b> Il faut $${n} \le 2^{h+1} - 1$. Or $2^{${Math.floor(Math.log2(n))}} \le ${n} \lt 2^{${Math.floor(Math.log2(n)) + 1}}$ : la plus petite hauteur possible est $${Math.floor(Math.log2(n))} = \lfloor\log_2 ${n}\rfloor$, atteinte par un arbre complet.`,
              R`<b>Hauteur $${h}$ : minimum de nœuds.</b> Un nœud par niveau, niveaux 0 à $${h}$ : $${h + 1}$ nœuds.`,
              R`<b>Hauteur $${h}$ : maximum de nœuds.</b> Tous les niveaux pleins : $2^{${h + 1}} - 1 = ${Math.pow(2, h + 1) - 1}$ nœuds (arbre parfait).`,
              R`<b>Conséquence.</b> Une recherche dans un ABR à $${n}$ nœuds visite au pire hauteur + 1 nœuds : entre $${Math.floor(Math.log2(n)) + 1}$ (arbre complet) et $${n}$ (arbre filiforme).`
            ],
            retenir: R`<p>$h + 1 \le n \le 2^{h+1} - 1$, soit $\lfloor\log_2 n\rfloor \le h \le n - 1$.</p>`
          },
          enonce: R`<p>1. Quelles sont la plus petite et la plus grande hauteur possibles d'un arbre binaire à $${n}$ nœuds ?</p><p>2. Combien de nœuds peut avoir, au minimum et au maximum, un arbre binaire de hauteur $${h}$ ?</p>`,
          indication: R`<p>Au niveau $k$ (profondeur $k$), il y a au plus $2^k$ nœuds.</p>`,
          correction: R`<p>1. Maximum : $n - 1 = ${n - 1}$ (arbre « filiforme », un seul nœud par niveau). Minimum : $\lfloor \log_2 n \rfloor = ${Math.floor(Math.log2(n))}$, car un arbre de hauteur $h$ a au plus $2^{h+1} - 1$ nœuds, donc $${n} \le 2^{h+1} - 1$ impose $h \ge ${Math.floor(Math.log2(n))}$ (et c'est atteint par un arbre complet).</p>
            <p>2. Au minimum $h + 1 = ${h + 1}$ nœuds (un par niveau) ; au maximum $1 + 2 + \dots + 2^{${h}} = 2^{${h + 1}} - 1 = ${Math.pow(2, h + 1) - 1}$ nœuds (arbre parfait).</p>
            <p>Conséquence pour un ABR de $${n}$ nœuds : une recherche visite entre $${Math.floor(Math.log2(n)) + 1}$ et $${n}$ nœuds dans le pire cas, selon la forme de l'arbre.</p>`
        };
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Cours                                                               */
  /* ------------------------------------------------------------------ */
  const exB = bEx(), exA = abrEx();
  const cours = [
    { t: 'nota', title: 'conventions', body: R`<p>Mêmes conventions de pseudo-code qu'au chapitre 1 ($\leftarrow$, <b>pour</b>, <b>tant que</b>, <b>si</b>…). On utilise en plus :</p>
      <ul><li>un <b>nœud</b> $a$ d'arbre binaire a trois champs $a.\text{valeur}$, $a.\text{gauche}$, $a.\text{droit}$ ; <b>NUL</b> représente l'arbre vide ;</li>
      <li>une <b>pile</b> $P$ : $\text{empiler}(P, x)$, $\text{dépiler}(P)$ (renvoie le dernier élément empilé), $\text{est\_vide}(P)$ ;</li>
      <li>une <b>file</b> $F$ : $\text{enfiler}(F, x)$, $\text{défiler}(F)$ (renvoie le premier élément enfilé), $\text{est\_vide}(F)$ ;</li>
      <li>$\text{traiter}(x)$ : action quelconque sur une valeur (l'afficher, l'ajouter à une liste…).</li></ul>` },

    { t: 'h', title: 'Terminologie : nœud, fils, père, racine, hauteur' },
    { t: 'def', title: 'arbre', body: R`<p>Un <strong>arbre</strong> est un ensemble fini de <strong>nœuds</strong> organisés hiérarchiquement : un nœud particulier, la <strong>racine</strong>, n'a pas de père ; tout autre nœud a exactement un <strong>père</strong>. Si $p$ est le père de $f$, on dit que $f$ est un <strong>fils</strong> de $p$. Définition récursive : un arbre est soit vide, soit formé d'une racine et d'une suite d'arbres (ses <b>sous-arbres</b>) dont les racines sont les fils.</p>` },
    { t: 'def', title: 'vocabulaire', body: R`<ul>
        <li><strong>Feuille</strong> : nœud sans fils. <strong>Nœud interne</strong> : nœud qui a au moins un fils.</li>
        <li><strong>Frères</strong> : nœuds de même père. <strong>Degré</strong> (ou arité) d'un nœud : son nombre de fils.</li>
        <li><strong>Ancêtres</strong> d'un nœud : son père, le père de son père, …, jusqu'à la racine ; il est alors un <strong>descendant</strong> de chacun d'eux.</li>
        <li><strong>Profondeur</strong> d'un nœud : nombre d'arêtes du chemin de la racine à ce nœud (la racine est de profondeur $0$). Les nœuds de profondeur $k$ forment le <strong>niveau</strong> $k$.</li>
        <li><strong>Hauteur</strong> de l'arbre : la plus grande profondeur d'un nœud (nombre d'arêtes du plus long chemin racine–feuille). Par convention, l'arbre vide a pour hauteur $-1$.</li>
        <li><strong>Taille</strong> : nombre de nœuds.</li></ul>` },
    { t: 'warn', body: R`<p>Certains cours comptent la hauteur en <b>nombre de niveaux</b> (un arbre réduit à sa racine a alors pour hauteur $1$, et l'arbre vide $0$). Les résultats sont décalés de $1$ : toujours préciser la convention utilisée.</p>` },
    { t: 'ex', body: fig([svgGen(gEx)]) + R`<p>Racine : A. Fils de A : B, C, D. Père de G : D. Feuilles : E, F, C, H, I, J. Nœuds internes : A, B, D, G. Profondeur de G : $2$. Hauteur : $3$ (chemin A–D–G–H). Taille : $10$. Degré de A : $3$.</p>` },
    { t: 'prop', body: R`<p>Un arbre à $n \ge 1$ nœuds possède exactement $n - 1$ arêtes (liens père–fils).</p>`,
      proof: R`<p>Chaque nœud autre que la racine est relié à son père par exactement une arête, et toute arête relie un nœud à son père : les arêtes sont en bijection avec les $n - 1$ nœuds non racine.</p>` },
    { t: 'def', title: 'arbre binaire', body: R`<p>Un <strong>arbre binaire</strong> est soit vide, soit formé d'une racine et de deux arbres binaires : le <strong>sous-arbre gauche</strong> et le <strong>sous-arbre droit</strong>. Chaque nœud a donc au plus deux fils, et on distingue fils gauche et fils droit.</p>` },
    { t: 'prop', title: 'hauteur et taille', body: R`<p>Un arbre binaire de hauteur $h$ a au plus $2^{h+1} - 1$ nœuds, et au moins $h + 1$. Par conséquent, un arbre binaire à $n$ nœuds a une hauteur comprise entre $\lfloor \log_2 n \rfloor$ et $n - 1$.</p>`,
      proof: R`<p>Le niveau $k$ contient au plus $2^k$ nœuds (récurrence : chaque nœud du niveau $k$ a au plus 2 fils). Donc $n \le 1 + 2 + \dots + 2^h = 2^{h+1} - 1$. Le plus long chemin contient $h + 1$ nœuds, donc $n \ge h + 1$.</p>
      <p>De $n \le 2^{h+1} - 1$ on tire $2^{h+1} > n$, soit $h + 1 > \log_2 n$, c'est-à-dire $h \ge \lfloor\log_2 n\rfloor$. De $n \ge h + 1$ on tire $h \le n - 1$.</p>` },
    { t: 'def', title: 'formes particulières', body: R`<p>Un arbre binaire est <strong>parfait</strong> si tous ses niveaux sont pleins ($n = 2^{h+1} - 1$), <strong>complet</strong> si tous ses niveaux sont pleins sauf éventuellement le dernier, rempli de gauche à droite (hauteur $\lfloor\log_2 n\rfloor$), <strong>filiforme</strong> (ou dégénéré) si chaque nœud a au plus un fils (hauteur $n - 1$).</p>` },

    { t: 'h', title: 'Encodage des arbres (implémentations)' },
    { t: 'algo', title: 'arbre binaire par nœuds chaînés', body: algo(PS.noeud) + R`<p>Un arbre est représenté par (une référence vers) sa racine ; l'arbre vide par NUL. C'est l'encodage utilisé dans la suite du chapitre.</p>` },
    { t: 'algo', title: 'taille et hauteur (récursives)', body: algo(PS.taille) + algo(PS.hauteur) + R`<p>Schéma général d'une fonction sur un arbre : <b>cas de base</b> = arbre vide ; sinon on combine les résultats sur les deux sous-arbres. Chaque nœud est visité une fois : coût $\Theta(n)$.</p>` },
    { t: 'prop', title: 'arbre binaire dans un tableau', body: R`<p>On range les nœuds niveau par niveau, de gauche à droite, dans un tableau $t$ : la racine en case $0$ et, pour la case $i$,</p>
      $$\text{fils gauche} : 2i + 1, \qquad \text{fils droit} : 2i + 2, \qquad \text{père} : \left\lfloor \frac{i - 1}{2} \right\rfloor \ (i \ge 1).$$
      <p>Aucun pointeur n'est stocké. Cet encodage est idéal pour un arbre <b>complet</b> (pas de case vide) : c'est celui des <b>tas</b> (chapitre 3). Pour un arbre quelconque, il gaspille de la place (cases vides).</p>`,
      proof: R`<p>Le niveau $k$ occupe les cases $2^k - 1$ à $2^{k+1} - 2$. Si la case $i$ est la $j$-ème du niveau $k$ ($i = 2^k - 1 + j$), ses fils sont les $2j$-ème et $(2j+1)$-ème du niveau $k + 1$, aux cases $2^{k+1} - 1 + 2j = 2i + 1$ et $2i + 2$. Réciproquement, $c = 2i + 1$ ou $2i + 2$ donne $\lfloor (c - 1)/2 \rfloor = i$.</p>` },
    { t: 'ex', body: fig([svgBin((function () { const t = [8, 3, 10, 1, 6, 14, 4]; const ns = t.map((v, i) => Object.assign(nd(v), { i })); ns.forEach((x, i) => { if (2 * i + 1 < 7) x.g = ns[2 * i + 1]; if (2 * i + 2 < 7) x.d = ns[2 * i + 2]; }); return ns[0]; })(), { index: true }), 'le tableau [8, 3, 10, 1, 6, 14, 4]']) + R`<p>La case $1$ (valeur 3) a pour fils les cases $3$ et $4$ (valeurs 1 et 6) ; le père de la case $5$ (valeur 14) est la case $\lfloor 4/2 \rfloor = 2$ (valeur 10).</p>` },
    { t: 'prop', title: 'arbres quelconques', body: R`<p>Pour un arbre de degré quelconque, on peut :</p>
      <ul><li>donner à chaque nœud la <b>liste de ses fils</b> ($a.\text{fils}$) ;</li>
      <li>utiliser la représentation <b>« premier fils – frère droit »</b> : chaque nœud pointe vers son premier fils et vers son frère suivant. Cela transforme tout arbre en <b>arbre binaire</b> (gauche = premier fils, droit = frère suivant) ;</li>
      <li>stocker le <b>tableau des pères</b> : $\text{père}[i]$ = indice du père du nœud $i$ ($-1$ pour la racine). Pratique pour remonter vers la racine, mais retrouver les fils demande un parcours du tableau.</li></ul>` },

    { t: 'h', title: 'Parcours d’arbres : préfixe, postfixe, récursifs et itératifs' },
    { t: 'def', body: R`<p><strong>Parcourir</strong> un arbre, c'est visiter (traiter) chacun de ses nœuds exactement une fois. Dans un <b>parcours en profondeur</b>, on traite entièrement un sous-arbre avant de passer au suivant ; l'ordre dépend du moment où l'on traite la racine :</p>
      <ul><li><strong>préfixe</strong> : la racine <b>avant</b> ses sous-arbres (racine, gauche, droit) ;</li>
      <li><strong>postfixe</strong> (ou suffixe) : la racine <b>après</b> ses sous-arbres (gauche, droit, racine) ;</li>
      <li><strong>infixe</strong> (arbres binaires) : la racine <b>entre</b> les deux sous-arbres (gauche, racine, droit).</li></ul>` },
    { t: 'algo', title: 'parcours préfixe et postfixe récursifs', body: algo(PS.prefixe) + algo(PS.postfixe) + R`<p>Pour un arbre quelconque, on parcourt la liste des fils :</p>` + algo(PS.prefixeGen) },
    { t: 'ex', body: fig([svgBin(exB)]) + R`<p>Préfixe : <b>${seq(prefixe(exB))}</b>. Infixe : <b>${seq(infixe(exB))}</b>. Postfixe : <b>${seq(postfixe(exB))}</b>.</p>
      <p><em>Astuce :</em> on fait le tour de l'arbre en longeant les arêtes, en partant à gauche de la racine. Préfixe = ordre du <b>premier</b> passage à côté de chaque nœud ; postfixe = ordre du <b>dernier</b> passage ; infixe = passage <b>sous</b> le nœud.</p>` },
    { t: 'prop', title: 'coût des parcours', body: R`<p>Les parcours récursifs d'un arbre à $n$ nœuds font $n$ appels sur des nœuds et $n + 1$ appels sur NUL : coût $\Theta(n)$. La profondeur de la récursion vaut la hauteur $+ 1$ : mémoire $\Theta(h)$.</p>`,
      proof: R`<p>Chaque nœud est traité exactement une fois et provoque deux appels (un par fils, éventuellement NUL). Dans un arbre binaire à $n$ nœuds, il y a $2n$ champs fils, dont $n - 1$ pointent vers un nœud (les $n - 1$ arêtes) : il reste $n + 1$ champs NUL.</p>` },
    { t: 'algo', title: 'parcours préfixe itératif (avec une pile)', body: algo(PS.prefixeIt) + R`<p>La pile remplace la pile d'appels de la récursion. On empile le fils <b>droit</b> avant le fils <b>gauche</b> pour que le gauche soit dépilé (donc traité) en premier.</p>` },
    { t: 'ex', title: 'déroulement', body: R`<p>Sur l'arbre ci-dessus (contenu de la pile, sommet à droite) :</p>
      <table class="t"><tr><th>dépilé</th><th>traité</th><th>pile après</th></tr>
      <tr><td>A</td><td>A</td><td>C, B</td></tr><tr><td>B</td><td>B</td><td>C, E, D</td></tr><tr><td>D</td><td>D</td><td>C, E</td></tr>
      <tr><td>E</td><td>E</td><td>C, G</td></tr><tr><td>G</td><td>G</td><td>C</td></tr><tr><td>C</td><td>C</td><td>F</td></tr><tr><td>F</td><td>F</td><td>(vide)</td></tr></table>
      <p>On retrouve l'ordre préfixe A, B, D, E, G, C, F.</p>` },
    { t: 'algo', title: 'parcours postfixe itératif (deux piles)', body: algo(PS.postfixeIt) + R`<p>La première boucle produit, dans $S$, l'ordre « racine, droit, gauche » (un préfixe miroir) ; en dépilant $S$, on obtient l'ordre inverse « gauche, droit, racine » : le postfixe.</p>` },
    { t: 'prop', body: R`<p>Les parcours itératifs ont le même coût $\Theta(n)$ : chaque nœud est empilé et dépilé une seule fois (deux fois pour le postfixe à deux piles).</p>` },
    { t: 'rem', title: 'parcours en largeur', body: R`<p>Le <b>parcours en largeur</b> traite les nœuds niveau par niveau, de gauche à droite. Il s'obtient comme le préfixe itératif en remplaçant la <b>pile</b> par une <b>file</b> (et en ajoutant le fils gauche avant le droit).</p>` + algo(PS.largeur) + R`<p>Sur l'arbre exemple : ${seq(largeur(exB))}.</p>` },

    { t: 'h', title: 'Arbres binaires de recherche' },
    { t: 'def', title: 'ABR', body: R`<p>Un <strong>arbre binaire de recherche</strong> (ABR) est un arbre binaire dont les valeurs (deux à deux distinctes) vérifient, pour <b>chaque</b> nœud $a$ :</p>
      <ul><li>toutes les valeurs du <b>sous-arbre gauche</b> de $a$ sont $< a.\text{valeur}$ ;</li><li>toutes les valeurs du <b>sous-arbre droit</b> sont $> a.\text{valeur}$.</li></ul>` },
    { t: 'warn', body: R`<p>Il ne suffit pas de comparer un nœud à ses <b>fils</b> : c'est tout le sous-arbre qui compte. Par exemple, la racine 50 avec un fils gauche 30 qui a lui-même un fils droit 60 n'est pas un ABR (60 est dans le sous-arbre gauche de 50).</p>` },
    { t: 'algo', title: 'parcours infixe', body: algo(PS.infixe) },
    { t: 'thm', title: 'parcours infixe d’un ABR', body: R`<p>Un arbre binaire est un ABR si et seulement si son parcours infixe donne ses valeurs dans l'ordre <b>strictement croissant</b>.</p>`,
      proof: R`<p>Par récurrence sur la taille. Le parcours infixe de $a$ est : infixe(gauche), puis $a.\text{valeur}$, puis infixe(droit). Si $a$ est un ABR, ses deux sous-arbres sont des ABR (parcours triés par hypothèse de récurrence), les valeurs de gauche sont $< a.\text{valeur} <$ celles de droite : la concaténation est triée. Réciproquement, si le parcours infixe est trié, chaque sous-arbre a un parcours trié (donc est un ABR) et les valeurs du sous-arbre gauche, qui précèdent $a.\text{valeur}$ dans le parcours, lui sont inférieures ; de même à droite.</p>` },
    { t: 'algo', title: 'parcours infixe itératif', body: algo(PS.infixeIt) + R`<p>On descend le long des fils gauches en empilant ; quand on ne peut plus, on dépile un nœud, on le traite, puis on recommence depuis son fils droit.</p>` },
    { t: 'algo', title: 'recherche dans un ABR', body: algo(PS.rechercher) + R`<p>Comme pour la dichotomie, chaque comparaison élimine un sous-arbre entier.</p>` },
    { t: 'algo', title: 'insertion dans un ABR', body: algo(PS.inserer) + R`<p>La nouvelle valeur est toujours insérée comme une <b>feuille</b>, à l'endroit où la recherche échoue.</p>` },
    { t: 'ex', body: R`<p>Insertions successives de 50, 30, 70, 20, 40, 60, 80, 35 dans un ABR vide :</p>` + fig([svgBin(exA)]) + R`<p>Parcours infixe : ${seq(infixe(exA))} (trié). Hauteur : $${hauteur(exA)}$.</p>` },
    { t: 'algo', title: 'suppression dans un ABR', body: algo(PS.minimum) + algo(PS.supprimer) + R`<p>Trois cas pour le nœud contenant $x$ : <b>feuille</b> (on la retire), <b>un fils</b> (on le remplace par ce fils), <b>deux fils</b> (on le remplace par son <b>successeur</b>, le minimum du sous-arbre droit, qui a au plus un fils droit, puis on supprime ce successeur).</p>` },
    { t: 'ex', body: (function () { const a = abrEx(); const b = abrSupprimer(clone(a), 30); return fig([svgBin(a, { del: [30] }), 'avant : on supprime 30'], [svgBin(b), 'après']); })() + R`<p>30 a deux fils : son successeur est 35 (minimum du sous-arbre droit 40–35). On copie 35 à la place de 30, puis on supprime 35, qui était une feuille.</p>` },
    { t: 'thm', title: 'coût des opérations sur un ABR', body: R`<p>Recherche, insertion, suppression et calcul du minimum dans un ABR de hauteur $h$ coûtent $O(h)$ (au plus $h + 1$ nœuds visités). Pour $n$ nœuds, $\lfloor\log_2 n\rfloor \le h \le n - 1$ : le coût est $\Theta(\log n)$ si l'arbre est <b>équilibré</b>, mais $\Theta(n)$ s'il est <b>filiforme</b> (par exemple quand on insère des valeurs déjà triées).</p>`,
      proof: R`<p>Chacun de ces algorithmes descend depuis la racine en suivant un seul chemin, avec un travail constant par nœud (la suppression à deux fils descend une seconde fois dans le sous-arbre droit, ce qui reste $O(h)$). Les bornes sur $h$ viennent de la proposition « hauteur et taille ».</p>` },
    { t: 'rem', body: R`<p><b>Trier avec un ABR</b> : insérer les $n$ valeurs puis faire un parcours infixe. Coût $\Theta(n\log n)$ si l'arbre reste équilibré, $\Theta(n^2)$ dans le pire cas (données déjà triées). Des variantes (arbres AVL, rouges-noirs) maintiennent la hauteur en $O(\log n)$.</p>` }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche (format cahier)                                               */
  /* ------------------------------------------------------------------ */
  const fiche = [
    { k: 'def', t: 'Vocabulaire',
      concl: [R`<b>Racine</b> : sans père ; <b>feuille</b> : sans fils ; tout autre nœud a <u>exactement un père</u>`, R`<b>Profondeur</b> d'un nœud : nombre d'arêtes depuis la racine`, R`<b>Hauteur</b> : plus grande profondeur ; arbre vide : $-1$`] },
    { k: 'prop', t: 'Arêtes', concl: [R`$n$ nœuds $\Rightarrow$ <u>$n - 1$ arêtes</u>`] },
    { k: 'prop', t: 'Hauteur d’un arbre binaire', prio: true,
      hyp: R`Arbre binaire de hauteur $h$ à $n$ nœuds`,
      concl: [R`$h + 1 \le n \le 2^{h+1} - 1$`, R`<u>$\lfloor \log_2 n \rfloor \le h \le n - 1$</u>`] },
    { k: 'form', t: 'Arbre dans un tableau', prio: true,
      hyp: R`Racine en case $0$`,
      concl: [R`Fils de $i$ : <u>$2i + 1$ et $2i + 2$</u>`, R`Père de $i$ : $\lfloor (i - 1)/2 \rfloor$`],
      b: R`Idéal pour un arbre complet (tas).` },
    { k: 'meth', t: 'Fonction récursive sur un arbre', prio: true,
      concl: [R`<b>Cas de base</b> : $a = \text{NUL}$`, R`Sinon : <u>combiner</u> les résultats sur $a.\text{gauche}$ et $a.\text{droit}$`, R`Coût $\Theta(n)$`] },
    { k: 'def', t: 'Parcours en profondeur', prio: true,
      concl: [R`<b>Préfixe</b> : racine, gauche, droit`, R`<b>Infixe</b> : gauche, racine, droit`, R`<b>Postfixe</b> : gauche, droit, racine`],
      b: R`Préfixe commence par la racine, postfixe finit par la racine.` },
    { k: 'meth', t: 'Parcours itératifs',
      concl: [R`Préfixe : <u>pile</u> ; empiler le <b>droit</b> puis le <b>gauche</b>`, R`Postfixe : deux piles (ordre racine–droit–gauche inversé)`, R`Largeur : <u>file</u> à la place de la pile`] },
    { k: 'def', t: 'Arbre binaire de recherche', prio: true,
      hyp: R`Pour <b>chaque</b> nœud $a$`,
      concl: [R`Sous-arbre gauche $< a.\text{valeur} <$ sous-arbre droit`, R`ABR <u>ssi parcours infixe trié</u>`] },
    { k: 'thm', t: 'Opérations sur un ABR',
      concl: [R`Recherche, insertion, minimum : descendre en comparant, <u>$O(h)$</u>`, R`Insertion : toujours en <b>feuille</b>`, R`$h = \Theta(\log n)$ si équilibré, $n - 1$ si filiforme`] },
    { k: 'meth', t: 'Suppression dans un ABR',
      concl: [R`Feuille : on la retire`, R`Un fils : on le fait remonter`, R`Deux fils : remplacer par le <u>successeur</u> (minimum du sous-arbre droit), puis le supprimer`] },
    { k: 'warn', t: 'Pièges',
      concl: [R`ABR : comparer à <b>tout le sous-arbre</b>, pas seulement aux fils`, R`Convention de hauteur (arêtes ou niveaux) : la préciser`, R`Pile pour le préfixe itératif : empiler le droit <b>avant</b> le gauche`] }
  ];

  /* ------------------------------------------------------------------ */
  /* Exercices                                                           */
  /* ------------------------------------------------------------------ */
  const terminoArbre = { v: 'R', f: [{ v: 'S', f: [{ v: 'U' }, { v: 'V', f: [{ v: 'Y' }] }] }, { v: 'T', f: [{ v: 'W' }, { v: 'X' }, { v: 'Z' }] }] };
  const recon = nd('A', nd('B', nd('D'), nd('E')), nd('C', null, nd('F')));
  const exercices = [
    {
      id: 'termino', title: 'Vocabulaire sur un arbre', diff: 1,
      enonce: R`<p>Pour l'arbre suivant, donner : la racine, les feuilles, les nœuds internes, le père de Y, les fils de T, la profondeur de V, la hauteur, la taille et le degré maximal.</p>${fig([svgGen(terminoArbre)])}`,
      correction: R`<ul><li>Racine : R. Feuilles : U, Y, W, X, Z. Nœuds internes : R, S, V, T.</li>
        <li>Père de Y : V. Fils de T : W, X, Z.</li>
        <li>Profondeur de V : $2$. Hauteur : $3$ (chemin R–S–V–Y). Taille : $9$ nœuds (donc $8$ arêtes). Degré maximal : $3$ (nœud T).</li></ul>`
    },
    {
      id: 'parcours', title: 'Les trois parcours en profondeur', diff: 1, gen: 'parcours',
      enonce: R`<p>Donner les parcours préfixe, infixe, postfixe et en largeur de l'arbre :</p>${fig([svgBin(bEx())])}`,
      correction: R`<ul><li>Préfixe : <b>${seq(prefixe(bEx()))}</b></li><li>Infixe : <b>${seq(infixe(bEx()))}</b></li><li>Postfixe : <b>${seq(postfixe(bEx()))}</b></li><li>Largeur : <b>${seq(largeur(bEx()))}</b></li></ul>`
    },
    {
      id: 'recursif', title: 'Fonctions récursives sur un arbre binaire', diff: 2,
      enonce: R`<p>Écrire en pseudo-code des fonctions récursives qui calculent : (a) le nombre de feuilles ; (b) la somme des valeurs (entières) ; (c) le nombre de nœuds ayant exactement un fils. Quel est leur coût ?</p>`,
      indication: R`<p>Cas de base : $a = \text{NUL}$. Pour les feuilles, il faut aussi tester « $a$ sans fils ».</p>`,
      correction: algo(`fonction nb_feuilles(a)
    si a = NUL alors
        retourner 0
    fin si
    si a.gauche = NUL et a.droit = NUL alors
        retourner 1
    fin si
    retourner nb_feuilles(a.gauche) + nb_feuilles(a.droit)
fin fonction

fonction somme(a)
    si a = NUL alors
        retourner 0
    fin si
    retourner a.valeur + somme(a.gauche) + somme(a.droit)
fin fonction

fonction nb_un_fils(a)
    si a = NUL alors
        retourner 0
    fin si
    s ← nb_un_fils(a.gauche) + nb_un_fils(a.droit)
    si (a.gauche = NUL) ≠ (a.droit = NUL) alors   // exactement un des deux est vide
        s ← s + 1
    fin si
    retourner s
fin fonction`) + R`<p>Chacune visite chaque nœud une fois : $\Theta(n)$.</p>`,
      similaires: [
        {
          title: 'Nœuds d’une profondeur donnée',
          enonce: R`<p>Écrire une fonction $\text{nb\_niveau}(a, k)$ qui renvoie le nombre de nœuds de profondeur $k$ dans l'arbre binaire $a$.</p>`,
          correction: algo(`fonction nb_niveau(a, k)
    si a = NUL alors
        retourner 0
    fin si
    si k = 0 alors
        retourner 1                     // a est lui-même à la profondeur cherchée
    fin si
    retourner nb_niveau(a.gauche, k − 1) + nb_niveau(a.droit, k − 1)
fin fonction`) + R`<p>On descend en diminuant $k$ : un nœud de profondeur $k$ dans $a$ est à profondeur $k - 1$ dans le sous-arbre qui le contient.</p>`
        },
        {
          title: 'Maximum d’un arbre binaire quelconque',
          enonce: R`<p>Écrire une fonction qui renvoie la plus grande valeur d'un arbre binaire <b>non vide</b> (pas forcément un ABR). Comparer avec le cas d'un ABR.</p>`,
          correction: algo(`fonction maximum(a)                  // a ≠ NUL
    m ← a.valeur
    si a.gauche ≠ NUL alors
        m ← max(m, maximum(a.gauche))
    fin si
    si a.droit ≠ NUL alors
        m ← max(m, maximum(a.droit))
    fin si
    retourner m
fin fonction`) + R`<p>Coût $\Theta(n)$ : il faut tout visiter. Dans un ABR, il suffit de descendre à droite tant que possible : $O(h)$.</p>`
        }
      ]
    },
    {
      id: 'reconstruction', title: 'Reconstruire un arbre à partir de deux parcours', diff: 3,
      enonce: R`<p>Un arbre binaire (valeurs distinctes) a pour parcours préfixe <b>A, B, D, E, C, F</b> et pour parcours infixe <b>D, B, E, A, C, F</b>. Le dessiner, puis donner son parcours postfixe. Pourquoi le préfixe seul ne suffit-il pas ?</p>`,
      indication: R`<p>Le premier élément du préfixe est la racine ; dans l'infixe, elle sépare le sous-arbre gauche du droit.</p>`,
      correction: R`<p>Racine A (premier du préfixe). Dans l'infixe, D, B, E est à gauche de A et C, F à droite. Sous-arbre gauche : préfixe B, D, E → racine B, avec D à gauche et E à droite (infixe D, B, E). Sous-arbre droit : préfixe C, F, infixe C, F → racine C, F à droite.</p>${fig([svgBin(recon)])}
        <p>Postfixe : <b>${seq(postfixe(recon))}</b>.</p>
        <p>Le préfixe seul ne suffit pas : l'arbre A–(fils gauche B) et l'arbre A–(fils droit B) ont tous deux le préfixe A, B.</p>`
    },
    {
      id: 'tableau', title: 'Arbre dans un tableau', diff: 2, gen: 'tableau',
      enonce: R`<p>Un arbre binaire complet est rangé dans <code>t = [8, 3, 10, 1, 6, 14, 4]</code> (racine en case $0$). Dessiner l'arbre. Donner les fils de la case $1$, le père de la case $6$. Écrire les fonctions $\text{gauche}(i)$, $\text{droit}(i)$, $\text{père}(i)$.</p>`,
      correction: fig([svgBin((function () { const t = [8, 3, 10, 1, 6, 14, 4]; const ns = t.map((v, i) => Object.assign(nd(v), { i })); ns.forEach((x, i) => { if (2 * i + 1 < 7) x.g = ns[2 * i + 1]; if (2 * i + 2 < 7) x.d = ns[2 * i + 2]; }); return ns[0]; })(), { index: true })]) +
        R`<p>Fils de la case $1$ (valeur 3) : cases $3$ et $4$ (valeurs 1 et 6). Père de la case $6$ (valeur 4) : case $\lfloor 5/2 \rfloor = 2$ (valeur 10).</p>` + algo(`fonction gauche(i)
    retourner 2 × i + 1
fin fonction

fonction droit(i)
    retourner 2 × i + 2
fin fonction

fonction père(i)                      // i ≥ 1
    retourner ⌊(i − 1) / 2⌋
fin fonction`) + R`<p>Un fils d'indice $c$ n'existe que si $c < n$.</p>`
    },
    {
      id: 'hauteurs', title: 'Hauteur minimale et maximale', diff: 2, gen: 'hauteurs',
      enonce: R`<p>Montrer par récurrence qu'un arbre binaire de hauteur $h$ a au plus $2^{h+1} - 1$ nœuds. En déduire la hauteur minimale d'un arbre binaire à $n$ nœuds, et la comparer à la hauteur maximale.</p>`,
      correction: R`<p>Notons $N(h)$ le nombre maximal de nœuds d'un arbre de hauteur $h$. $N(0) = 1 = 2^1 - 1$. Un arbre de hauteur $h \ge 1$ est une racine et deux sous-arbres de hauteur $\le h - 1$ : $N(h) \le 1 + 2N(h-1) \le 1 + 2(2^h - 1) = 2^{h+1} - 1$.</p>
        <p>Donc $n \le 2^{h+1} - 1 < 2^{h+1}$, d'où $h > \log_2 n - 1$ et $h \ge \lfloor\log_2 n\rfloor$ (atteint par un arbre complet). La hauteur maximale est $n - 1$ (arbre filiforme). Pour $n = 1000$ : entre $9$ et $999$.</p>`
    },
    {
      id: 'abr-insertion', title: 'Construire un ABR', diff: 1, gen: 'abrInsertion',
      enonce: R`<p>Insérer successivement 50, 30, 70, 20, 40, 60, 80, 35 dans un ABR vide. Dessiner l'arbre, donner sa hauteur, son parcours infixe et le chemin suivi par la recherche de 45.</p>`,
      correction: fig([svgBin(abrEx(), { hl: chercher(abrEx(), 45).ch })]) + R`<p>Hauteur $3$. Infixe : ${seq(infixe(abrEx()))}. Recherche de 45 : 50 → 30 → 40, puis le sous-arbre droit de 40 est vide : 45 est absent (3 comparaisons).</p>`
    },
    {
      id: 'abr-suppression', title: 'Les trois cas de suppression', diff: 2, gen: 'abrSuppression',
      enonce: R`<p>Dans l'ABR de l'exercice précédent, supprimer successivement 20 (feuille), puis 40, puis 50. Dessiner l'arbre après chaque suppression.</p>`,
      correction: (function () {
        const a1 = abrSupprimer(abrEx(), 20), a2 = abrSupprimer(clone(a1), 40), a3 = abrSupprimer(clone(a2), 50);
        return fig([svgBin(a1), 'sans 20'], [svgBin(a2), 'puis sans 40'], [svgBin(a3), 'puis sans 50']) +
          R`<p>20 est une feuille : on la retire. 40 n'a plus qu'un fils (35) : 35 remonte à sa place. 50 a deux fils : son successeur est 60 (minimum du sous-arbre droit) ; 60 prend la place de 50, puis on supprime 60 (une feuille) du sous-arbre droit.</p>`;
      })()
    },
    {
      id: 'est-abr', title: 'Tester si un arbre est un ABR', diff: 3,
      enonce: R`<p>On propose de tester qu'un arbre binaire est un ABR en vérifiant, en chaque nœud, que le fils gauche est plus petit et le fils droit plus grand. Montrer que c'est faux, puis écrire un test correct en $\Theta(n)$.</p>`,
      indication: R`<p>Passer en paramètres l'intervalle $]\text{min}, \text{max}[$ dans lequel doivent se trouver les valeurs du sous-arbre, ou utiliser le parcours infixe.</p>`,
      correction: fig([svgBin(nd(50, nd(30, null, nd(60))), { del: [60] }), 'pas un ABR']) + R`<p>Chaque nœud est bien ordonné par rapport à ses fils, mais 60 est dans le sous-arbre gauche de 50.</p>` + algo(`fonction est_ABR(a, inf, sup)          // appel initial : est_ABR(racine, −∞, +∞)
    si a = NUL alors
        retourner vrai
    fin si
    si a.valeur ≤ inf ou a.valeur ≥ sup alors
        retourner faux
    fin si
    retourner est_ABR(a.gauche, inf, a.valeur) et est_ABR(a.droit, a.valeur, sup)
fin fonction`) + R`<p>Chaque nœud doit être dans l'intervalle imposé par tous ses ancêtres. Variante : faire le parcours infixe et vérifier qu'il est strictement croissant. Coût $\Theta(n)$.</p>`
    },
    {
      id: 'iteratif', title: 'Dérouler un parcours itératif', diff: 2, gen: 'parcours',
      enonce: R`<p>Dérouler <i>infixe_itératif</i> sur l'ABR obtenu à partir de 50, 30, 70, 20, 40, 60, 80, 35 : donner le contenu de la pile à chaque fois qu'un nœud est traité.</p>`,
      correction: R`<table class="t"><tr><th>traité</th><th>pile après le dépilement (sommet à droite)</th></tr>
        <tr><td>20</td><td>50, 30</td></tr><tr><td>30</td><td>50</td></tr><tr><td>35</td><td>50, 40</td></tr><tr><td>40</td><td>50</td></tr>
        <tr><td>50</td><td>(vide)</td></tr><tr><td>60</td><td>70</td></tr><tr><td>70</td><td>(vide)</td></tr><tr><td>80</td><td>(vide)</td></tr></table>
        <p>On obtient bien 20, 30, 35, 40, 50, 60, 70, 80. La pile ne contient jamais plus de hauteur $+ 1 = 4$ nœuds.</p>`
    },
    {
      id: 'tri-abr', title: 'Trier avec un ABR', diff: 2,
      enonce: R`<p>On trie $n$ valeurs distinctes en les insérant dans un ABR puis en faisant un parcours infixe. Quel est le coût si les valeurs arrivent déjà triées ? Dans le meilleur cas ? Donner un ordre d'insertion de 1, 2, …, 7 qui produit un arbre de hauteur minimale.</p>`,
      correction: R`<p>Valeurs triées : chaque insertion descend tout le long de la branche droite, l'arbre est filiforme : $0 + 1 + \dots + (n-1) = \frac{n(n-1)}{2}$ comparaisons, $\Theta(n^2)$. Meilleur cas : arbre équilibré, hauteur $\approx \log_2 n$ : $\Theta(n\log n)$. Le parcours infixe coûte $\Theta(n)$ dans tous les cas.</p>
        <p>Ordre 4, 2, 6, 1, 3, 5, 7 (la médiane d'abord, puis les médianes des moitiés) :</p>` + fig([svgBin([4, 2, 6, 1, 3, 5, 7].reduce((a, x) => abrInserer(a, x), null))]) + R`<p>hauteur $2 = \lfloor\log_2 7\rfloor$.</p>`
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiches méthodes                                                     */
  /* ------------------------------------------------------------------ */
  const methodes = [
    {
      title: 'Écrire une fonction récursive sur un arbre',
      cas: R`Calculer une quantité (taille, hauteur, somme, nombre de feuilles…) ou tester une propriété`, debut: R`Écrire le <b>cas de base</b> $a = \text{NUL}$, puis <b>combiner</b> les résultats des appels sur $a.\text{gauche}$ et $a.\text{droit}$.`,
      etapes: [
        R`Choisir la valeur pour l'<b>arbre vide</b> ($0$ pour une taille ou une somme, $-1$ pour la hauteur, vrai pour un test…).`,
        R`Supposer que les appels récursifs sur les deux sous-arbres renvoient le bon résultat.`,
        R`<b>Combiner</b> : $1 + \ldots + \ldots$ (taille), $1 + \max(\ldots)$ (hauteur), « et » (test)…`,
        R`Coût : chaque nœud est visité une fois, $\Theta(n)$.`
      ],
      exemple: {
        enonce: R`<p>Profondeur moyenne : écrire une fonction qui renvoie la somme des profondeurs des nœuds.</p>`,
        solution: algo(`fonction somme_prof(a, p)              // appel initial : somme_prof(racine, 0)
    si a = NUL alors
        retourner 0
    fin si
    retourner p + somme_prof(a.gauche, p + 1) + somme_prof(a.droit, p + 1)
fin fonction`) + R`<p>On ajoute un paramètre (la profondeur courante) transmis aux sous-arbres.</p>`
      },
      pieges: [R`Oublier le cas $a = \text{NUL}$ et accéder à $a.\text{gauche}$.`, R`Traiter « feuille » comme cas de base sans traiter l'arbre vide.`]
    },
    {
      title: 'Donner un parcours (préfixe, infixe, postfixe)', gen: 'parcours',
      cas: R`« Donner le parcours … de l'arbre »`, debut: R`Faire le <b>tour de l'arbre</b> en longeant les arêtes : préfixe = <b>1<sup>er</sup> passage</b>, infixe = passage <b>dessous</b>, postfixe = <b>dernier passage</b>.`,
      etapes: [
        R`Écrire la règle : préfixe (R, G, D), infixe (G, R, D), postfixe (G, D, R).`,
        R`Appliquer récursivement : chaque sous-arbre est parcouru <b>en entier</b> avant de passer au suivant.`,
        R`Contrôler : préfixe commence par la racine, postfixe finit par la racine ; dans un ABR, l'infixe est trié.`
      ],
      exemple: { enonce: R`<p>Arbre : racine 1, fils gauche 2 (fils 4 et 5), fils droit 3.</p>`, solution: R`<p>Préfixe 1, 2, 4, 5, 3 ; infixe 4, 2, 5, 1, 3 ; postfixe 4, 5, 2, 3, 1.</p>` }
    },
    {
      title: 'Insérer et rechercher dans un ABR', gen: 'abrInsertion',
      cas: R`« Insérer successivement… », « rechercher $x$ »`, debut: R`Partir de la <b>racine</b> et <b>descendre</b> : à gauche si $x$ est plus petit, à droite s'il est plus grand.`,
      etapes: [
        R`Comparer $x$ à la valeur du nœud courant.`,
        R`Descendre du bon côté ; arrêt si on trouve $x$ (recherche) ou si on arrive sur NUL.`,
        R`Insertion : créer une <b>feuille</b> à cet endroit vide.`,
        R`Vérifier : le parcours infixe doit être trié.`
      ],
      exemple: { enonce: R`<p>Insérer 40, 20, 60, 10, 30, 50.</p>`, solution: fig([svgBin([40, 20, 60, 10, 30, 50].reduce((a, x) => abrInserer(a, x), null))]) },
      pieges: [R`L'ordre d'insertion change la forme (et la hauteur) de l'arbre.`]
    },
    {
      title: 'Supprimer dans un ABR', gen: 'abrSuppression',
      cas: R`« Supprimer la valeur $x$ de l'ABR »`, debut: R`Trouver le nœud, puis <b>compter ses fils</b> : 0, 1 ou 2.`,
      etapes: [
        R`0 fils (feuille) : on la retire.`,
        R`1 fils : on remplace le nœud par ce fils (le sous-arbre remonte).`,
        R`2 fils : chercher le <b>successeur</b> (une fois à droite, puis à gauche jusqu'au bout), copier sa valeur, puis supprimer le successeur (il a au plus un fils droit).`,
        R`Vérifier que l'infixe reste trié.`
      ],
      exemple: { enonce: R`<p>Supprimer 30 dans l'ABR de 50, 30, 70, 20, 40, 60, 80, 35.</p>`, solution: R`<p>Successeur de 30 : 35. On obtient la racine 50 avec un fils gauche 35 (fils 20 et 40).</p>` },
      pieges: [R`Prendre le successeur dans le mauvais sous-arbre.`, R`Oublier de supprimer l'ancien successeur.`]
    },
    {
      title: 'Écrire un parcours itératif', gen: 'parcours',
      cas: R`« Écrire une version itérative (sans récursion) »`, debut: R`Remplacer la récursion par une <b>pile</b> explicite (une <b>file</b> pour le parcours en largeur).`,
      etapes: [
        R`Préfixe : empiler la racine ; tant que la pile n'est pas vide, dépiler, traiter, empiler le <b>droit</b> puis le <b>gauche</b>.`,
        R`Infixe : descendre à gauche en empilant ; dépiler, traiter, repartir du fils droit.`,
        R`Postfixe : deux piles, ou préfixe miroir inversé.`,
        R`Dérouler sur un petit arbre (tableau du contenu de la pile) pour vérifier l'ordre.`
      ],
      exemple: { enonce: R`<p>Pourquoi empiler le fils droit avant le gauche ?</p>`, solution: R`<p>La pile renvoie le dernier élément empilé : le gauche, empilé en dernier, est traité en premier, comme dans le préfixe récursif.</p>` }
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche méthode, partie 1 : plan de travail ; partie 2 : cas à reconnaître */
  /* ------------------------------------------------------------------ */
  const plan = {
    etapes: [
      { titre: 'Dessiner et identifier l’arbre', faire: R`Faire un <b>dessin</b>. Préciser le type : arbre quelconque, <b>binaire</b>, <b>ABR</b>, complet (tableau) ; et la convention de hauteur.`,
        questions: [R`L'arbre peut-il être vide ?`, R`Les valeurs sont-elles distinctes ?`] },
      { titre: 'Choisir la stratégie', faire: R`<b>Récursion</b> (cas de base NUL + sous-arbres) pour calculer ou parcourir ; <b>descente</b> le long d'un chemin pour un ABR ; <b>pile / file</b> pour une version itérative.` },
      { titre: 'Écrire le pseudo-code', faire: R`Cas de base d'abord ; ne jamais accéder à $a.\text{gauche}$ si $a = \text{NUL}$ ; pour un ABR, renvoyer la nouvelle racine après modification.` },
      { titre: 'Vérifier sur un exemple', faire: R`Dérouler sur un petit arbre, et sur les cas limites : arbre <b>vide</b>, une seule feuille, arbre <b>filiforme</b>.` },
      { titre: 'Évaluer le coût', faire: R`Parcours et fonctions récursives : <b>$\Theta(n)$</b>. Opérations sur un ABR : <b>$O(h)$</b>, avec $\lfloor\log_2 n\rfloor \le h \le n - 1$.` }
    ]
  };
  const reperes = [
    { etape: 1, si: R`Un tableau avec des indices $2i + 1$, $2i + 2$`, alors: R`C'est un arbre binaire <b>complet</b> rangé niveau par niveau : le dessiner case par case.` },
    { etape: 1, si: R`Deux parcours donnés (préfixe + infixe)`, alors: R`La racine est le <b>premier du préfixe</b> (ou dernier du postfixe) ; dans l'infixe elle <b>sépare</b> gauche et droite.` },
    { etape: 2, si: R`« Calculer » une quantité sur tout l'arbre`, alors: R`Fonction <b>récursive</b> : valeur pour NUL, puis combinaison des deux sous-arbres.` },
    { etape: 2, si: R`Une information qui dépend du chemin depuis la racine (profondeur, intervalle autorisé)`, alors: R`Ajouter un <b>paramètre</b> transmis aux appels récursifs ($p + 1$, $[\text{inf}, \text{sup}]$).` },
    { etape: 2, si: R`Un ABR et une valeur à chercher, insérer ou supprimer`, alors: R`<b>Descendre</b> en comparant : un seul chemin, coût $O(h)$.` },
    { etape: 2, si: R`« Sans récursion », « itératif »`, alors: R`<b>Pile</b> pour un parcours en profondeur, <b>file</b> pour un parcours en largeur.` },
    { etape: 2, si: R`Minimum ou maximum d'un ABR`, alors: R`Descendre <b>tout à gauche</b> (minimum) ou <b>tout à droite</b> (maximum).` },
    { etape: 3, si: R`Une fonction qui modifie un ABR (insérer, supprimer)`, alors: R`Elle <b>renvoie la racine</b> du sous-arbre modifié : $a.\text{gauche} \leftarrow \text{insérer}(a.\text{gauche}, x)$.` },
    { etape: 3, si: R`Un nœud à supprimer qui a deux fils`, alors: R`Le remplacer par son <b>successeur</b> (minimum du sous-arbre droit), puis supprimer ce successeur.` },
    { etape: 3, si: R`Tester « est-ce une feuille ? »`, alors: R`$a \neq \text{NUL}$ <b>et</b> $a.\text{gauche} = \text{NUL}$ <b>et</b> $a.\text{droit} = \text{NUL}$.` },
    { etape: 4, si: R`Un test d'ABR qui ne compare qu'aux fils`, alors: R`Contre-exemple : 50, fils gauche 30, petit-fils droit 60. Il faut un <b>intervalle</b> ou le <b>parcours infixe</b>.` },
    { etape: 5, si: R`Des valeurs insérées dans l'ordre croissant`, alors: R`ABR <b>filiforme</b> : hauteur $n - 1$, opérations en $\Theta(n)$.` },
    { etape: 5, si: R`Un arbre complet ou équilibré`, alors: R`Hauteur <b>$\lfloor\log_2 n\rfloor$</b> (complet), $O(\log n)$ (équilibré) : opérations en $O(\log n)$.` }
  ];


  /* ------------------------------------------------------------------ */
  /* Corrections détaillées (bouton « Correction détaillée »)            */
  /* ------------------------------------------------------------------ */
  const details = {
    termino: {
      but: R`<p>Lire sur un dessin le vocabulaire des arbres : racine, feuilles, père, fils, profondeur, hauteur, taille, degré.</p>`,
      methode: R`<p>Revenir aux définitions : la <b>profondeur</b> d'un nœud est le nombre d'arêtes entre la racine et lui ; la <b>hauteur</b> de l'arbre est la plus grande profondeur ; le <b>degré</b> d'un nœud est son nombre de fils.</p>`,
      etapes: [
        R`<b>Racine.</b> Le seul nœud sans père : R.`,
        R`<b>Feuilles et nœuds internes.</b> Les nœuds sans fils sont U, Y, W, X, Z ; les autres (R, S, V, T) sont internes.`,
        R`<b>Liens.</b> Y est relié à V, au-dessus de lui : le père de Y est V. Les fils de T sont W, X, Z.`,
        R`<b>Profondeur de V.</b> Chemin R → S → V : 2 arêtes.`,
        R`<b>Hauteur.</b> La feuille la plus profonde est Y (R → S → V → Y) : hauteur 3.`,
        R`<b>Taille.</b> On compte les nœuds : R, S, T, U, V, Y, W, X, Z, soit 9. Chaque nœud sauf la racine est relié à son père par une arête : $9 - 1 = 8$ arêtes.`,
        R`<b>Degré maximal.</b> T a 3 fils, les autres en ont au plus 2 : degré maximal 3.`
      ],
      retenir: R`<p>Un arbre à $n$ nœuds a toujours $n - 1$ arêtes.</p>`
    },
    parcours: {
      but: R`<p>Donner les parcours préfixe, infixe, postfixe et en largeur d'un arbre binaire.</p>`,
      methode: R`<p>Parcours en profondeur, définis récursivement : préfixe = racine, puis gauche, puis droit ; infixe = gauche, racine, droit ; postfixe = gauche, droit, racine. Largeur : niveau par niveau, de gauche à droite.</p>`,
      etapes: [
        R`<b>Structure.</b> Racine A ; sous-arbre gauche de racine B (fils D et E, E ayant un fils gauche G) ; sous-arbre droit de racine C (un seul fils, droit, F).`,
        R`<b>Préfixe.</b> A ; puis préfixe du sous-arbre B : B, D, E, G ; puis préfixe du sous-arbre C : C, F. Résultat : <b>A, B, D, E, G, C, F</b>.`,
        R`<b>Infixe.</b> Infixe du sous-arbre B : D, B, puis infixe de E (G, E), soit D, B, G, E ; puis A ; puis infixe de C (pas de fils gauche) : C, F. Résultat : <b>D, B, G, E, A, C, F</b>.`,
        R`<b>Postfixe.</b> Sous-arbre B : D, G, E, B ; sous-arbre C : F, C ; puis A. Résultat : <b>D, G, E, B, F, C, A</b>.`,
        R`<b>Largeur.</b> Niveau 0 : A ; niveau 1 : B, C ; niveau 2 : D, E, F ; niveau 3 : G. Résultat : <b>A, B, C, D, E, F, G</b>.`,
        R`<b>Contrôles.</b> Le préfixe commence par la racine, le postfixe finit par la racine ; chaque parcours contient les 7 nœuds une seule fois.`
      ],
      retenir: R`<p>Préfixe, infixe, postfixe : seule change la position de la racine (avant, entre, après ses sous-arbres).</p>`
    },
    recursif: {
      but: R`<p>Écrire trois fonctions récursives sur un arbre binaire et donner leur coût.</p>`,
      methode: R`<p>Schéma commun : <b>cas de base</b> $a = \text{NUL}$ (arbre vide), puis on <b>combine</b> les résultats des deux sous-arbres avec l'information portée par la racine.</p>`,
      etapes: [
        R`<b>nb_feuilles.</b> Arbre vide : 0 feuille. Si $a$ n'a aucun fils, c'est une feuille : 1. Sinon, les feuilles de $a$ sont celles de ses deux sous-arbres : on additionne. Le test « feuille » est indispensable : sans lui, une feuille donnerait $0 + 0 = 0$.`,
        R`<b>somme.</b> Arbre vide : 0. Sinon : valeur de la racine + somme du sous-arbre gauche + somme du sous-arbre droit.`,
        R`<b>nb_un_fils.</b> On compte d'abord dans les sous-arbres, puis on ajoute 1 si $a$ a exactement un fils. « Exactement un des deux est vide » s'écrit $(\text{a.gauche} = \text{NUL}) \neq (\text{a.droit} = \text{NUL})$ : un « ou exclusif » entre deux booléens.`,
        R`<b>Terminaison.</b> Chaque appel porte sur un sous-arbre strictement plus petit ; on finit par atteindre des arbres vides.`,
        R`<b>Coût.</b> Il y a un appel par nœud et un par sous-arbre vide ($n + 1$ pour un arbre à $n$ nœuds), chacun en $O(1)$ hors appels récursifs : $\Theta(n)$.`
      ],
      retenir: R`<p>Fonction récursive sur un arbre : cas vide, puis combinaison « racine + gauche + droit ».</p>`
    },
    'recursif#1': {
      but: R`<p>Compter les nœuds d'une profondeur $k$ donnée.</p>`,
      methode: R`<p>Un nœud de profondeur $k$ dans $a$ est de profondeur $k - 1$ dans le sous-arbre (gauche ou droit) qui le contient.</p>`,
      etapes: [
        R`<b>Arbre vide.</b> Aucun nœud : 0.`,
        R`<b>$k = 0$.</b> Seule la racine est à la profondeur 0 : 1.`,
        R`<b>$k \ge 1$.</b> On cherche les nœuds de profondeur $k - 1$ dans chacun des deux sous-arbres et on additionne.`,
        R`<b>Coût.</b> On ne descend que jusqu'à la profondeur $k$ : au plus le nombre de nœuds de profondeur $\le k$, donc $O(n)$.`
      ],
      retenir: R`<p>Passer un paramètre qui diminue à chaque descente (ici $k$).</p>`
    },
    'recursif#2': {
      but: R`<p>Maximum d'un arbre binaire quelconque, puis d'un ABR.</p>`,
      methode: R`<p>Sans propriété d'ordre, le maximum peut être n'importe où : il faut comparer la racine aux maxima des sous-arbres non vides.</p>`,
      etapes: [
        R`<b>Initialisation.</b> $m \leftarrow$ valeur de la racine (l'arbre est non vide).`,
        R`<b>Sous-arbres.</b> Pour chaque sous-arbre non vide, $m \leftarrow \max(m, \text{maximum}(\text{sous-arbre}))$ ; on teste « non vide » car la fonction exige un arbre non vide.`,
        R`<b>Coût.</b> Tous les nœuds sont visités : $\Theta(n)$.`,
        R`<b>Dans un ABR.</b> Tout élément du sous-arbre droit est plus grand que la racine : le maximum est le nœud le plus à droite. On descend à droite tant que possible : $O(h)$.`
      ],
      retenir: R`<p>Exploiter l'ordre d'un ABR évite de parcourir tout l'arbre.</p>`
    },
    reconstruction: {
      but: R`<p>Reconstruire un arbre binaire à partir de ses parcours préfixe et infixe.</p>`,
      methode: R`<p>Le <b>premier élément du préfixe</b> est la racine ; dans l'<b>infixe</b>, elle sépare les éléments du sous-arbre gauche (avant) et du sous-arbre droit (après). On recommence sur chaque sous-arbre.</p>`,
      etapes: [
        R`<b>Racine.</b> Préfixe A, B, D, E, C, F : la racine est A.`,
        R`<b>Découpage par l'infixe.</b> Infixe D, B, E, <b>A</b>, C, F : le sous-arbre gauche contient {D, B, E}, le droit {C, F}.`,
        R`<b>Préfixes des sous-arbres.</b> Après A, le préfixe donne d'abord les 3 nœuds du sous-arbre gauche (B, D, E), puis les 2 du droit (C, F).`,
        R`<b>Sous-arbre gauche.</b> Préfixe B, D, E → racine B ; infixe D, B, E → D à gauche de B, E à droite.`,
        R`<b>Sous-arbre droit.</b> Préfixe C, F → racine C ; infixe C, F → rien à gauche de C, F à droite.`,
        R`<b>Postfixe.</b> Gauche (D, E, B), droit (F, C), racine A : <b>D, E, B, F, C, A</b>.`,
        R`<b>Le préfixe seul ne suffit pas.</b> A avec un fils gauche B, et A avec un fils droit B, ont le même préfixe A, B : il faut l'infixe pour savoir de quel côté se trouve B.`
      ],
      retenir: R`<p>Préfixe (ou postfixe) donne la racine, infixe donne le partage gauche / droite.</p>`
    },
    tableau: {
      but: R`<p>Lire un arbre binaire complet rangé dans un tableau.</p>`,
      methode: R`<p>Convention : racine en case 0 ; les fils de la case $i$ sont en cases $2i + 1$ et $2i + 2$ ; le père de la case $i \ge 1$ est en case $\lfloor (i - 1)/2 \rfloor$. Un fils d'indice $c$ n'existe que si $c \lt n$.</p>`,
      etapes: [
        R`<b>Niveaux.</b> Le niveau $k$ occupe les cases $2^k - 1$ à $2^{k+1} - 2$ : case 0 (valeur 8) ; cases 1, 2 (3, 10) ; cases 3 à 6 (1, 6, 14, 4).`,
        R`<b>Liens.</b> Case 0 → cases 1, 2 ; case 1 → cases 3, 4 ; case 2 → cases 5, 6.`,
        R`<b>Fils de la case 1</b> (valeur 3) : $2 \times 1 + 1 = 3$ et $2 \times 1 + 2 = 4$, valeurs 1 et 6.`,
        R`<b>Père de la case 6</b> (valeur 4) : $\lfloor (6 - 1)/2 \rfloor = \lfloor 2{,}5 \rfloor = 2$, valeur 10.`,
        R`<b>Fonctions.</b> gauche$(i) = 2i + 1$, droit$(i) = 2i + 2$, père$(i) = \lfloor (i-1)/2 \rfloor$ : des calculs en $O(1)$, sans pointeurs.`
      ],
      retenir: R`<p>Arbre complet ↔ tableau sans trou : c'est la représentation utilisée par les tas (tri par tas).</p>`
    },
    hauteurs: {
      but: R`<p>Majorer le nombre de nœuds d'un arbre de hauteur $h$, en déduire l'encadrement de la hauteur d'un arbre à $n$ nœuds.</p>`,
      methode: R`<p>Récurrence sur $h$ en décomposant l'arbre en racine + deux sous-arbres de hauteur $\le h - 1$.</p>`,
      etapes: [
        R`<b>Initialisation.</b> Hauteur 0 : un seul nœud, et $2^{0+1} - 1 = 1$.`,
        R`<b>Hérédité.</b> Un arbre de hauteur $h \ge 1$ est une racine et deux sous-arbres de hauteur au plus $h - 1$, qui ont chacun au plus $2^h - 1$ nœuds : $n \le 1 + 2(2^h - 1) = 2^{h+1} - 1$.`,
        R`<b>Hauteur minimale.</b> $n \le 2^{h+1} - 1 \lt 2^{h+1}$, donc $\log_2 n \lt h + 1$, soit $h \gt \log_2 n - 1$ ; $h$ étant entier, $h \ge \lfloor\log_2 n\rfloor$. C'est atteint par un arbre complet.`,
        R`<b>Hauteur maximale.</b> Un nœud par niveau (arbre filiforme) : $h = n - 1$.`,
        R`<b>Exemple.</b> $n = 1000$ : $2^9 = 512 \le 1000 \lt 1024 = 2^{10}$, donc $\lfloor\log_2 1000\rfloor = 9$ ; la hauteur est entre 9 et 999.`
      ],
      retenir: R`<p>$\lfloor\log_2 n\rfloor \le h \le n - 1$ : le coût $O(h)$ des ABR varie de $O(\log n)$ à $O(n)$.</p>`
    },
    'abr-insertion': {
      but: R`<p>Construire un ABR par insertions successives, puis l'exploiter (hauteur, infixe, recherche).</p>`,
      methode: R`<p>Chaque valeur part de la racine et descend : à gauche si elle est plus petite que le nœud, à droite si elle est plus grande, jusqu'à une place vide.</p>`,
      etapes: [
        R`<b>50</b> devient la racine. <b>30</b> $\lt 50$ : fils gauche de 50. <b>70</b> $\gt 50$ : fils droit de 50.`,
        R`<b>20</b> : $\lt 50$ (gauche), $\lt 30$ (gauche) → fils gauche de 30. <b>40</b> : $\lt 50$, $\gt 30$ → fils droit de 30.`,
        R`<b>60</b> : $\gt 50$, $\lt 70$ → fils gauche de 70. <b>80</b> : $\gt 50$, $\gt 70$ → fils droit de 70.`,
        R`<b>35</b> : $\lt 50$, $\gt 30$, $\lt 40$ → fils gauche de 40.`,
        R`<b>Hauteur.</b> La branche la plus longue est 50 → 30 → 40 → 35 : hauteur 3.`,
        R`<b>Infixe.</b> 20, 30, 35, 40, 50, 60, 70, 80 : la liste triée (propriété caractéristique des ABR).`,
        R`<b>Recherche de 45.</b> $45 \lt 50$ → gauche (30) ; $45 \gt 30$ → droite (40) ; $45 \gt 40$ → droite : sous-arbre vide. 45 est absent, après 3 comparaisons.`
      ],
      retenir: R`<p>Insertion et recherche suivent le même chemin ; leur coût est au plus hauteur + 1 comparaisons.</p>`
    },
    'abr-suppression': {
      but: R`<p>Appliquer les trois cas de suppression dans un ABR.</p>`,
      methode: R`<p>Selon le nombre de fils du nœud : 0 fils → on le retire ; 1 fils → le fils (avec son sous-arbre) prend sa place ; 2 fils → on le remplace par son <b>successeur</b> (minimum du sous-arbre droit), qu'on supprime ensuite.</p>`,
      etapes: [
        R`<b>Supprimer 20.</b> On le cherche : 50 → 30 → 20. C'est une feuille : le fils gauche de 30 devient vide.`,
        R`<b>Supprimer 40.</b> Après le retrait de 20, 40 n'a qu'un fils (35, à gauche). On « remonte » 35 : il devient le fils droit de 30. Il reste bien plus grand que 30 et plus petit que 50.`,
        R`<b>Supprimer 50 : successeur.</b> 50 a deux fils. Son successeur est le minimum du sous-arbre droit : on va une fois à droite (70), puis à gauche tant que possible (60).`,
        R`<b>Remplacement.</b> On copie 60 dans la racine, puis on supprime 60 du sous-arbre droit ; c'est une feuille (un successeur n'a jamais de fils gauche).`,
        R`<b>Pourquoi ça marche.</b> 60 est plus grand que tout le sous-arbre gauche (car il était à droite de 50) et plus petit que tout le reste du sous-arbre droit (c'en était le minimum).`,
        R`<b>Contrôle.</b> Infixe final : 30, 35, 60, 70, 80, toujours trié.`
      ],
      retenir: R`<p>Cas à deux fils : successeur = une fois à droite, puis tout à gauche.</p>`
    },
    'est-abr': {
      but: R`<p>Montrer qu'un test « local » ne suffit pas, puis tester correctement qu'un arbre est un ABR.</p>`,
      methode: R`<p>La propriété d'ABR porte sur <b>tous les descendants</b>, pas seulement sur les fils : on transmet à chaque appel l'intervalle $]\text{inf}, \text{sup}[$ autorisé par les ancêtres.</p>`,
      etapes: [
        R`<b>Contre-exemple.</b> 50 a pour fils gauche 30, qui a pour fils droit 60. En chaque nœud, le test local passe ($30 \lt 50$, $60 \gt 30$).`,
        R`<b>Pourquoi ce n'est pas un ABR.</b> 60 est dans le sous-arbre gauche de 50, il devrait être $\lt 50$. D'ailleurs une recherche de 60 irait à droite de 50 et échouerait.`,
        R`<b>Idée du test.</b> Les valeurs du sous-arbre gauche de $a$ doivent être dans $]\text{inf}, a.\text{valeur}[$, celles du droit dans $]a.\text{valeur}, \text{sup}[$, où $\text{inf}$ et $\text{sup}$ viennent des ancêtres.`,
        R`<b>Déroulé sur le contre-exemple.</b> est_ABR(50, $-\infty$, $+\infty$) → est_ABR(30, $-\infty$, 50) → est_ABR(60, 30, 50) : $60 \ge 50$, on renvoie faux.`,
        R`<b>Coût.</b> Chaque nœud est examiné une fois : $\Theta(n)$. Variante équivalente : faire le parcours infixe et vérifier qu'il est strictement croissant.`
      ],
      retenir: R`<p>« Gauche $\lt$ racine $\lt$ droite » doit valoir pour des <b>sous-arbres</b> entiers, pas seulement pour les fils.</p>`
    },
    iteratif: {
      but: R`<p>Dérouler le parcours infixe itératif (avec une pile) sur un ABR.</p>`,
      methode: R`<p>Tant que possible, on descend à gauche en empilant les nœuds ; puis on dépile un nœud, on le traite, et on passe à son sous-arbre droit.</p>`,
      etapes: [
        R`<b>Descente initiale.</b> On empile 50, 30, 20 (descente à gauche) ; le fils gauche de 20 est vide. Pile : 50, 30, 20 (sommet à droite).`,
        R`<b>Traiter 20.</b> On dépile 20 et on le traite ; son fils droit est vide. Pile : 50, 30.`,
        R`<b>Traiter 30.</b> On dépile 30 ; on passe à son fils droit 40, on descend à gauche : on empile 40, 35. Pile : 50, 40, 35.`,
        R`<b>Traiter 35 puis 40.</b> Dépiler 35 (pas de fils droit), pile 50, 40 ; dépiler 40 (pas de fils droit), pile 50.`,
        R`<b>Traiter 50.</b> Pile vide ; on passe à 70 et on descend à gauche : on empile 70, 60.`,
        R`<b>Fin.</b> Dépiler 60 (pile : 70), dépiler 70 (pile vide) ; son fils droit 80 est empilé puis dépilé et traité. La pile est vide et le nœud courant est NUL : arrêt.`,
        R`<b>Bilan.</b> Ordre de traitement : 20, 30, 35, 40, 50, 60, 70, 80 (infixe, donc trié). La pile n'a jamais contenu plus de 3 nœuds ; en général, au plus hauteur + 1.`
      ],
      retenir: R`<p>La pile mémorise les ancêtres dont on n'a pas encore traité la racine et le sous-arbre droit.</p>`
    },
    'tri-abr': {
      but: R`<p>Coût du tri par insertion dans un ABR suivie d'un parcours infixe.</p>`,
      methode: R`<p>Le coût d'une insertion est la profondeur atteinte ; le coût total dépend donc de la <b>forme</b> de l'arbre construit.</p>`,
      etapes: [
        R`<b>Valeurs déjà triées.</b> Chaque nouvelle valeur est plus grande que toutes les précédentes : elle descend toujours à droite, au bout de la branche. La $i$-ème insertion fait $i - 1$ comparaisons.`,
        R`<b>Somme.</b> $0 + 1 + \dots + (n-1) = \frac{n(n-1)}{2}$ : $\Theta(n^2)$, et l'arbre est filiforme.`,
        R`<b>Meilleur cas.</b> Arbre équilibré : chaque insertion coûte au plus $\approx \log_2 n$, total $\Theta(n\log n)$.`,
        R`<b>Parcours infixe.</b> $\Theta(n)$ dans tous les cas : il ne change pas l'ordre de grandeur.`,
        R`<b>Ordre optimal pour 1..7.</b> On insère la médiane 4 (racine), puis les médianes des moitiés, 2 et 6, puis 1, 3, 5, 7 : on obtient un arbre parfait de hauteur $2 = \lfloor\log_2 7\rfloor$.`
      ],
      retenir: R`<p>Un ABR est efficace quand il est équilibré : $O(\log n)$ par opération, sinon jusqu'à $O(n)$.</p>`
    }
  };
  L2.chapter('algo', 'arbres', {
    intro: R`<p>Les arbres représentent des données hiérarchiques (dossiers, expressions, décisions…). On fixe le vocabulaire, on voit comment les stocker en mémoire, comment les parcourir (récursivement et itérativement), puis on étudie les <b>arbres binaires de recherche</b>, qui permettent de rechercher, insérer et supprimer en un temps proportionnel à la hauteur. Algorithmes en <b>pseudo-code</b>.</p>`,
    cours, fiche, exercices, methodes, generateurs, plan, reperes, details
  });
})();
