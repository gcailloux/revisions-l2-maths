/* Probabilités et statistiques 1 — Chapitre 1 : Dénombrement et probabilités sur un univers fini
   1. Dénombrements  2. Espaces probabilisés et probabilités  3. Probabilités conditionnelles et indépendance */
(function () {
  'use strict';
  const R = String.raw;
  const { binom, arr, fact, bpow, big, F, dec } = ML;
  const C = (n, k) => R`\binom{${n}}{${k}}`;
  const fr = (n, d) => F(Number(n), Number(d)).tex();          // fraction irréductible (LaTeX)
  const approx = x => R`\approx ${dec(x, 4)}`;

  /* Deux dés : événements tirés au hasard (univers {1..6}², 36 issues) */
  const DES_A = [
    r => { const s = r.int(3, 11); return { txt: R`la somme des deux résultats vaut $${s}$`, f: (a, b) => a + b === s }; },
    r => { const s = r.int(7, 10); return { txt: R`la somme des deux résultats est supérieure ou égale à $${s}$`, f: (a, b) => a + b >= s }; },
    r => { const m = r.int(2, 6); return { txt: R`le plus grand des deux résultats vaut $${m}$`, f: (a, b) => Math.max(a, b) === m }; },
    r => { const m = r.int(1, 5); return { txt: R`le plus petit des deux résultats vaut $${m}$`, f: (a, b) => Math.min(a, b) === m }; },
    r => { const d = r.int(1, 4); return { txt: R`l'écart entre les deux résultats vaut $${d}$`, f: (a, b) => Math.abs(a - b) === d }; },
    () => ({ txt: 'le produit des deux résultats est pair', f: (a, b) => a * b % 2 === 0 })
  ];
  const DES_B = [
    { txt: 'le premier dé donne un nombre pair', f: a => a % 2 === 0 },
    { txt: 'au moins un des deux dés donne 6', f: (a, b) => a === 6 || b === 6 },
    { txt: 'le premier dé donne au plus 3', f: a => a <= 3 },
    { txt: 'les deux résultats sont différents', f: (a, b) => a !== b },
    { txt: 'la somme des deux résultats est paire', f: (a, b) => (a + b) % 2 === 0 },
    { txt: 'le premier dé donne 6', f: a => a === 6 }
  ];
  const OMEGA2 = [];
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) OMEGA2.push([a, b]);
  const couples = L => L.map(([a, b]) => '(' + a + ',' + b + ')').join(',\\ ');
  const ensTex = L => (L.length ? (L.length <= 9 ? R`\{${couples(L)}\}` : '') : R`\varnothing`);

  /* ------------------------------------------------------------------ */
  /* Générateurs                                                         */
  /* ------------------------------------------------------------------ */
  const MOTS = ['ANANAS', 'BANANE', 'CERISE', 'POMMES', 'MATHEMATIQUES', 'PROBABILITE', 'STATISTIQUE', 'ALGEBRE',
    'NORMANDIE', 'ABRICOT', 'COCCINELLE', 'PAPILLON', 'SERIES', 'ESPERANCE', 'VARIANCE', 'ELLIPSE', 'TOMATE',
    'PARALLELE', 'INTEGRALE', 'MATRICE', 'DENOMBREMENT', 'CARACTERE'];
  function counts(w) { const m = {}; for (const c of w) m[c] = (m[c] || 0) + 1; return m; }
  function multinomial(cnt) {
    const n = Object.values(cnt).reduce((s, x) => s + x, 0);
    let r = fact(n);
    Object.values(cnt).forEach(k => { r /= fact(k); });
    return r;
  }
  function multiTex(cnt) {
    const n = Object.values(cnt).reduce((s, x) => s + x, 0);
    const den = Object.entries(cnt).filter(([, k]) => k > 1).sort().map(([l, k]) => k + '!');
    return den.length ? R`\dfrac{${n}!}{${den.join(R`\,`)}}` : n + '!';
  }
  function repTex(cnt) {
    return Object.entries(cnt).sort().map(([l, k]) => R`\text{${l}}\,(${k})`).join(',\\ ');
  }

  const generateurs = {
    anagrammes: {
      title: 'Anagrammes d’un mot', diff: 1,
      make(r) {
        const w = r.pick(MOTS);
        const cnt = counts(w);
        const total = multinomial(cnt);
        const letters = Object.keys(cnt);
        const L = r.pick(letters);
        const cnt2 = Object.assign({}, cnt); cnt2[L]--; if (!cnt2[L]) delete cnt2[L];
        const startL = multinomial(cnt2);
        return {
          enonce: R`<p>Combien d'anagrammes (mots de ${w.length} lettres, ayant un sens ou non) peut-on former avec les lettres du mot <strong>${w}</strong> ? Combien commencent par la lettre <strong>${L}</strong> ?</p>`,
          indication: R`<p>On place les lettres une par une dans ${w.length} cases : il faut ensuite diviser par les permutations des lettres identiques entre elles.</p>`,
          correction: R`<p>Le mot a $${w.length}$ lettres, avec les répétitions : $${repTex(cnt)}$.</p>
            <p>Une anagramme est déterminée par le choix des positions de chaque lettre. Si toutes les lettres étaient distinctes, il y aurait $${w.length}!$ anagrammes ; chaque mot est compté autant de fois qu'il y a de façons de permuter les lettres identiques entre elles. D'où</p>
            $$N = ${multiTex(cnt)} = ${big(total)}.$$
            <p>Commençant par ${L} : on fixe ${L} en tête et on permute les $${w.length - 1}$ lettres restantes : $${multiTex(cnt2)} = ${big(startL)}$.</p>`
        };
      }
    },

    urne: {
      title: 'Tirages dans une urne', diff: 2,
      make(r) {
        const rr = r.int(3, 8), bb = r.int(3, 8), n = rr + bb;
        const k = r.int(2, 4);
        let j; do { j = r.int(1, k - 1); } while (j > rr || k - j > bb);
        const mode = r.pick(['simul', 'remise', 'sans']);
        const modeTxt = { simul: 'simultanément', remise: 'successivement <strong>avec remise</strong>', sans: 'successivement <strong>sans remise</strong>' }[mode];
        let cor;
        if (mode === 'simul') {
          const tot = binom(n, k), ex = binom(rr, j) * binom(bb, k - j), al = tot - binom(bb, k);
          cor = R`<p>Un tirage simultané est une <strong>partie</strong> à $${k}$ éléments de l'ensemble des $${n}$ boules (l'ordre ne compte pas).</p>
            <ol><li>Nombre de tirages : $${C(n, k)} = ${big(tot)}$.</li>
            <li>Exactement $${j}$ rouges : on choisit $${j}$ rouges parmi $${rr}$ <em>et</em> $${k - j}$ blanches parmi $${bb}$ : $${C(rr, j)}\times${C(bb, k - j)} = ${big(ex)}$.</li>
            <li>Au moins une rouge : on passe au complémentaire (aucune rouge = que des blanches) : $${C(n, k)} - ${C(bb, k)} = ${big(al)}$.</li></ol>`;
        } else if (mode === 'remise') {
          const tot = bpow(n, k), ex = binom(k, j) * bpow(rr, j) * bpow(bb, k - j), al = tot - bpow(bb, k);
          cor = R`<p>Un résultat est une <strong>$${k}$-liste</strong> (ordonnée, avec répétitions possibles) de boules.</p>
            <ol><li>Nombre de tirages : $${n}^{${k}} = ${big(tot)}$.</li>
            <li>Exactement $${j}$ rouges : on choisit les positions des rouges parmi les $${k}$ tirages ($${C(k, j)}$ façons), puis une boule rouge pour chacune ($${rr}^{${j}}$) et une blanche pour les autres ($${bb}^{${k - j}}$) : $${C(k, j)}\,${rr}^{${j}}\,${bb}^{${k - j}} = ${big(ex)}$.</li>
            <li>Au moins une rouge : $${n}^{${k}} - ${bb}^{${k}} = ${big(al)}$.</li></ol>`;
        } else {
          const tot = arr(n, k), ex = binom(k, j) * arr(rr, j) * arr(bb, k - j), al = tot - arr(bb, k);
          cor = R`<p>Un résultat est une <strong>$${k}$-liste sans répétition</strong> (arrangement) de boules.</p>
            <ol><li>Nombre de tirages : $A_{${n}}^{${k}} = ${Array.from({ length: k }, (_, i) => n - i).join(R`\times`)} = ${big(tot)}$.</li>
            <li>Exactement $${j}$ rouges : positions des rouges ($${C(k, j)}$), rouges ordonnées ($A_{${rr}}^{${j}}$), blanches ordonnées ($A_{${bb}}^{${k - j}}$) : $${C(k, j)}\,A_{${rr}}^{${j}}\,A_{${bb}}^{${k - j}} = ${big(ex)}$.</li>
            <li>Au moins une rouge : $A_{${n}}^{${k}} - A_{${bb}}^{${k}} = ${big(al)}$.</li></ol>`;
        }
        return {
          enonce: R`<p>Une urne contient $${rr}$ boules rouges et $${bb}$ boules blanches, toutes discernables. On tire $${k}$ boules ${modeTxt}.</p>
            <ol><li>Combien y a-t-il de tirages possibles ?</li><li>Combien contiennent exactement $${j}$ boule${j > 1 ? 's' : ''} rouge${j > 1 ? 's' : ''} ?</li><li>Combien contiennent au moins une boule rouge ?</li></ol>`,
          indication: R`<p>Identifier d'abord le modèle : l'ordre compte-t-il ? les répétitions sont-elles possibles ?</p>`,
          correction: cor
        };
      }
    },

    mots: {
      title: 'Mots, codes et répétitions', diff: 1,
      make(r) {
        const ctx = r.pick([
          { n: 26, txt: 'lettres de l’alphabet (26 lettres)', obj: 'mots' },
          { n: 10, txt: 'chiffres de 0 à 9', obj: 'codes' },
          { n: r.int(5, 8), txt: null, obj: 'mots' }
        ]);
        const n = ctx.n, p = r.int(3, Math.min(6, n - 1));
        const txt = ctx.txt || R`lettres d'un alphabet à $${n}$ symboles`;
        const tot = bpow(n, p), sr = arr(n, p);
        return {
          enonce: R`<p>On forme des ${ctx.obj} de longueur $${p}$ à l'aide des ${txt}.</p><ol><li>Combien y en a-t-il ?</li><li>Combien sont formés de ${p} symboles tous distincts ?</li><li>Combien comportent au moins une répétition ?</li></ol>`,
          correction: R`<ol><li>Un ${ctx.obj.slice(0, -1)} est une $${p}$-liste d'éléments d'un ensemble à $${n}$ éléments : $${n}^{${p}} = ${big(tot)}$.</li>
            <li>Symboles distincts : arrangement, $A_{${n}}^{${p}} = \dfrac{${n}!}{${n - p}!} = ${Array.from({ length: p }, (_, i) => n - i).join(R`\times`)} = ${big(sr)}$.</li>
            <li>« Au moins une répétition » est le contraire de « tous distincts » : $${big(tot)} - ${big(sr)} = ${big(tot - sr)}$.</li></ol>`
        };
      }
    },

    equation: {
      title: 'Solutions entières d’une équation', diff: 2,
      make(r) {
        const k = r.int(3, 5), n = r.int(k + 2, 15);
        const a = binom(n + k - 1, k - 1), b = binom(n - 1, k - 1);
        const vars = Array.from({ length: k }, (_, i) => 'x_' + (i + 1)).join(' + ');
        return {
          enonce: R`<p>Combien l'équation $${vars} = ${n}$ admet-elle de solutions $(x_1, \dots, x_${k})$ :</p><ol><li>en entiers naturels ($x_i \ge 0$) ?</li><li>en entiers strictement positifs ($x_i \ge 1$) ?</li></ol>`,
          indication: R`<p>Méthode « étoiles et barres » : une solution correspond à une suite de $${n}$ étoiles et $${k - 1}$ barres.</p>`,
          correction: R`<p>1. On représente une solution par $${n}$ étoiles séparées en $${k}$ paquets par $${k - 1}$ barres ($x_i$ = nombre d'étoiles du $i$-ème paquet). Une solution correspond donc au choix des positions des $${k - 1}$ barres parmi $${n + k - 1}$ places :</p>
            $$${C(n + k - 1, k - 1)} = ${big(a)}.$$
            <p>2. On pose $y_i = x_i - 1 \ge 0$ : $y_1 + \dots + y_${k} = ${n - k}$, d'où, par la question 1, $${C(n - k + k - 1, k - 1)} = ${big(b)}$ solutions. (Autre vision : placer $${k - 1}$ barres dans les $${n - 1}$ espaces entre les étoiles.)</p>`
        };
      }
    },

    comite: {
      title: 'Former un comité', diff: 2,
      make(r) {
        const h = r.int(5, 12), f = r.int(4, 10), n = h + f, k = r.int(3, 5);
        let j; do { j = r.int(1, k - 1); } while (j > f || k - j > h);
        const tot = binom(n, k), ex = binom(f, j) * binom(h, k - j), mix = tot - binom(h, k) - binom(f, k), pres = BigInt(n) * binom(n - 1, k - 1);
        return {
          enonce: R`<p>Un groupe de travail réunit $${h}$ étudiants de L2 et $${f}$ étudiants de L3. On forme un comité de $${k}$ personnes.</p>
            <ol><li>Combien de comités possibles ?</li><li>Combien comportent exactement $${j}$ étudiant${j > 1 ? 's' : ''} de L3 ?</li><li>Combien comportent au moins un étudiant de chaque année ?</li><li>Combien de comités avec un président désigné parmi les membres ?</li></ol>`,
          correction: R`<ol><li>Parties à $${k}$ éléments parmi $${n}$ : $${C(n, k)} = ${big(tot)}$.</li>
            <li>$${C(f, j)}\times${C(h, k - j)} = ${big(ex)}$.</li>
            <li>Complémentaire : on retire les comités « tout L2 » et « tout L3 » : $${C(n, k)} - ${C(h, k)} - ${C(f, k)} = ${big(mix)}$.</li>
            <li>On choisit le président ($${n}$ façons) puis les $${k - 1}$ autres membres parmi les $${n - 1}$ restants : $${n}\times${C(n - 1, k - 1)} = ${big(pres)}$. On retrouve la formule $k${C('n', 'k')} = n${C('n-1', 'k-1')}$ : $${k}\times${big(tot)} = ${big(pres)}$.</li></ol>`
        };
      }
    },

    /* ---------- Partie 2 : probabilités sur un univers fini ---------- */
    probaUrne: {
      title: 'Probabilités de tirages dans une urne', diff: 1,
      make(r) {
        const rr = r.int(3, 8), bb = r.int(3, 8), n = rr + bb, k = r.int(2, 4);
        let j; do { j = r.int(1, k); } while (j > rr || k - j > bb);
        const tot = binom(n, k), ex = binom(rr, j) * binom(bb, k - j);
        const none = binom(bb, k), same = binom(rr, k) + binom(bb, k);
        return {
          enonce: R`<p>Une urne contient $${rr}$ boules rouges et $${bb}$ boules blanches, indiscernables au toucher. On tire simultanément $${k}$ boules.</p>
            <ol><li>Quelle est la probabilité d'obtenir exactement $${j}$ boule${j > 1 ? 's' : ''} rouge${j > 1 ? 's' : ''} ?</li><li>Quelle est la probabilité d'obtenir au moins une boule rouge ?</li><li>Quelle est la probabilité que toutes les boules tirées soient de la même couleur ?</li></ol>`,
          indication: R`<p>Numéroter les boules : l'univers est l'ensemble des parties à $${k}$ éléments, muni de l'équiprobabilité.</p>`,
          correction: R`<p>On numérote les boules (elles deviennent discernables). Univers : $\Omega$ = ensemble des parties à $${k}$ éléments de l'ensemble des $${n}$ boules ; $\Card\Omega = ${C(n, k)} = ${big(tot)}$. Les boules étant indiscernables au toucher, les issues sont <strong>équiprobables</strong> : $\Proba(A) = \dfrac{\Card A}{\Card \Omega}$.</p>
            <ol><li>$\Proba = \dfrac{${C(rr, j)}${C(bb, k - j)}}{${C(n, k)}} = \dfrac{${big(ex)}}{${big(tot)}} = ${fr(ex, tot)} ${approx(Number(ex) / Number(tot))}$.</li>
            <li>Contraire : « aucune rouge » = « que des blanches ». $\Proba = 1 - \dfrac{${C(bb, k)}}{${C(n, k)}} = 1 - ${fr(none, tot)} = ${fr(tot - none, tot)}$.</li>
            <li>« Toutes rouges » et « toutes blanches » sont incompatibles : $\Proba = \dfrac{${C(rr, k)} + ${C(bb, k)}}{${C(n, k)}} = \dfrac{${big(same)}}{${big(tot)}} = ${fr(same, tot)}$.</li></ol>
            <p><em>Remarque</em> : avec des tirages successifs sans remise, on trouverait les mêmes probabilités (numérateur et dénominateur sont multipliés par $${k}!$).</p>`
        };
      }
    },

    des: {
      title: 'Deux dés : probabilité, conditionnement, indépendance', diff: 2,
      make(r) {
        let A, B, LA, LB, LAB;
        do {
          A = r.pick(DES_A)(r); B = r.pick(DES_B);
          LA = OMEGA2.filter(([a, b]) => A.f(a, b)); LB = OMEGA2.filter(([a, b]) => B.f(a, b));
          LAB = LA.filter(([a, b]) => B.f(a, b));
        } while (!LA.length || LA.length === 36);
        const x = LA.length, y = LB.length, z = LAB.length, indep = z * 36 === x * y;
        const cmp = indep ? '' : (z * 36 > x * y ? 'augmente' : 'diminue');
        return {
          enonce: R`<p>On lance deux dés équilibrés. On note $A$ : « ${A.txt} » et $B$ : « ${B.txt} ».</p>
            <ol><li>Calculer $\Proba(A)$.</li><li>Calculer $\Proba(A \mid B)$.</li><li>Les événements $A$ et $B$ sont-ils indépendants ?</li></ol>`,
          indication: R`<p>Rendre les dés discernables : $\Omega = \{1, \dots, 6\}^2$, 36 issues équiprobables. En équiprobabilité, $\Proba(A \mid B) = \dfrac{\Card(A \cap B)}{\Card B}$.</p>`,
          correction: R`<p>On distingue les deux dés (un rouge, un bleu) : $\Omega = \{1, \dots, 6\}^2$, $\Card\Omega = 36$, issues <strong>équiprobables</strong>.</p>
            <ol><li>${x <= 9 ? R`$A = ${ensTex(LA)}$ : ` : ''}$\Card A = ${x}$, donc $\Proba(A) = \dfrac{${x}}{36} = ${fr(x, 36)}$.</li>
            <li>$\Card B = ${y}$ et ${z <= 9 ? R`$A \cap B = ${ensTex(LAB)}$, ` : ''}$\Card(A \cap B) = ${z}$. Donc $\Proba(A \mid B) = \dfrac{\Proba(A \cap B)}{\Proba(B)} = \dfrac{${z}}{${y}} = ${fr(z, y)}$.</li>
            <li>$\Proba(A)\Proba(B) = ${fr(x, 36)} \times ${fr(y, 36)} = ${fr(x * y, 1296)}$ et $\Proba(A \cap B) = ${fr(z, 36)}$. ${indep
              ? R`Ces nombres sont égaux : <strong>$A$ et $B$ sont indépendants</strong> (savoir que $B$ est réalisé ne change pas la probabilité de $A$ : $\Proba(A \mid B) = \Proba(A)$).`
              : R`Ces nombres sont différents : <strong>$A$ et $B$ ne sont pas indépendants</strong> ; savoir que $B$ est réalisé ${cmp} la probabilité de $A$ ($${fr(z, y)}$ au lieu de $${fr(x, 36)}$).`}</li></ol>`
        };
      }
    },

    independance: {
      title: 'Calculs avec deux événements indépendants', diff: 1,
      make(r) {
        const FR = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 6], [5, 6]];
        const pa = r.pick(FR), pb = r.pick(FR), a = F(pa[0], pa[1]), b = F(pb[0], pb[1]);
        if (r.chance(0.5)) {
          const ab = a.mul(b), u = a.add(b).sub(ab), anb = a.mul(F(1).sub(b)), ni = F(1).sub(a).mul(F(1).sub(b)), un = a.add(b).sub(ab.mul(2));
          return {
            enonce: R`<p>$A$ et $B$ sont deux événements <strong>indépendants</strong> avec $\Proba(A) = ${a.tex()}$ et $\Proba(B) = ${b.tex()}$. Calculer :</p>
              <ol><li>$\Proba(A \cap B)$ et $\Proba(A \cup B)$ ;</li><li>$\Proba(A \cap \overline B)$ ;</li><li>la probabilité que ni $A$ ni $B$ ne soit réalisé ;</li><li>la probabilité qu'un seul des deux événements soit réalisé.</li></ol>`,
            correction: R`<ol><li>Indépendance : $\Proba(A \cap B) = \Proba(A)\Proba(B) = ${ab.tex()}$. Puis $\Proba(A \cup B) = \Proba(A) + \Proba(B) - \Proba(A \cap B) = ${a.tex()} + ${b.tex()} - ${ab.tex()} = ${u.tex()}$.</li>
              <li>$A$ et $\overline B$ sont indépendants : $\Proba(A \cap \overline B) = \Proba(A)(1 - \Proba(B)) = ${anb.tex()}$. (Ou : $\Proba(A) - \Proba(A \cap B)$.)</li>
              <li>$\Proba(\overline A \cap \overline B) = (1 - \Proba(A))(1 - \Proba(B)) = ${ni.tex()}$, et on vérifie $1 - \Proba(A \cup B) = ${F(1).sub(u).tex()}$.</li>
              <li>« Un seul » $= (A \cap \overline B) \cup (\overline A \cap B)$, réunion de deux événements incompatibles : $\Proba = \Proba(A) + \Proba(B) - 2\Proba(A \cap B) = ${un.tex()}$.</li></ol>`
          };
        }
        const lo = Math.max(0, a.add(b).sub(1).val()), hi = Math.min(a.val(), b.val()), d = pa[1] * pb[1];
        const ab = a.mul(b), cands = [];
        for (let k = Math.ceil(lo * d - 1e-9); k <= Math.floor(hi * d + 1e-9); k++) if (!F(k, d).eq(ab)) cands.push(F(k, d));
        const inter = (cands.length && r.chance(0.6)) ? r.pick(cands) : ab;
        const u = a.add(b).sub(inter), indep = inter.eq(ab);
        return {
          enonce: R`<p>On donne $\Proba(A) = ${a.tex()}$, $\Proba(B) = ${b.tex()}$ et $\Proba(A \cup B) = ${u.tex()}$.</p>
            <ol><li>Calculer $\Proba(A \cap B)$ et $\Proba(A \mid B)$.</li><li>$A$ et $B$ sont-ils indépendants ?</li></ol>`,
          correction: R`<ol><li>$\Proba(A \cap B) = \Proba(A) + \Proba(B) - \Proba(A \cup B) = ${a.tex()} + ${b.tex()} - ${u.tex()} = ${inter.tex()}$, puis $\Proba(A \mid B) = \dfrac{\Proba(A \cap B)}{\Proba(B)} = ${inter.div(b).tex()}$.</li>
            <li>$\Proba(A)\Proba(B) = ${ab.tex()}$ ${indep ? '=' : R`\neq`} $\Proba(A \cap B)$ : ${indep ? R`<strong>$A$ et $B$ sont indépendants</strong> (et on a bien $\Proba(A \mid B) = \Proba(A)$).` : R`<strong>$A$ et $B$ ne sont pas indépendants</strong> ($\Proba(A \mid B) = ${inter.div(b).tex()} \neq \Proba(A)$).`}</li></ol>`
        };
      }
    },

    /* ---------- Partie 3 : conditionnement ---------- */
    totales: {
      title: 'Urnes choisies au hasard (probabilités totales, Bayes)', diff: 2,
      make(r) {
        const mode = r.pick(['piece', 'de2', 'de3']);
        let urnes, choix;
        if (mode === 'piece') {
          urnes = [{ p: F(1, 2) }, { p: F(1, 2) }];
          choix = R`On lance une pièce équilibrée : si elle donne pile, on tire une boule dans $U_1$, sinon dans $U_2$.`;
        } else if (mode === 'de2') {
          const k = r.int(1, 2);
          urnes = [{ p: F(k, 6) }, { p: F(6 - k, 6) }];
          choix = R`On lance un dé équilibré : s'il donne ${k === 1 ? '1' : '1 ou 2'}, on tire une boule dans $U_1$, sinon dans $U_2$.`;
        } else {
          urnes = [{ p: F(1, 6) }, { p: F(2, 6) }, { p: F(3, 6) }];
          choix = R`On lance un dé équilibré : s'il donne 1, on tire une boule dans $U_1$ ; s'il donne 2 ou 3, dans $U_2$ ; sinon dans $U_3$.`;
        }
        urnes.forEach(u => { u.r = r.int(1, 6); u.b = r.int(1, 6); u.n = u.r + u.b; });
        const m = urnes.length, last = urnes[m - 1];
        const pR = urnes.reduce((s, u) => s.add(u.p.mul(F(u.r, u.n))), F(0)), pB = F(1).sub(pR);
        const j1 = urnes[0].p.mul(F(urnes[0].r, urnes[0].n));
        const post1 = j1.div(pR), postL = last.p.mul(F(last.b, last.n)).div(pB);
        const desc = urnes.map((u, i) => R`$U_${i + 1}$ contient $${u.r}$ rouge${u.r > 1 ? 's' : ''} et $${u.b}$ blanche${u.b > 1 ? 's' : ''}`).join(' ; ');
        const sys = urnes.map((u, i) => 'U_' + (i + 1)).join(', ');
        const somme = urnes.map(u => R`${u.p.tex()} \times \frac{${u.r}}{${u.n}}`).join(' + ');
        return {
          enonce: R`<p>On dispose de ${m} urnes : ${desc}. ${choix} On note $R$ l'événement « la boule tirée est rouge ».</p>
            <ol><li>Calculer $\Proba(R)$.</li><li>La boule tirée est rouge. Quelle est la probabilité qu'elle provienne de $U_1$ ?</li><li>La boule tirée est blanche. Quelle est la probabilité qu'elle provienne de $U_${m}$ ?</li></ol>`,
          indication: R`<p>$(${sys})$ est un système complet d'événements : faire un arbre pondéré.</p>`,
          correction: R`<p>Notons $U_i$ : « on tire dans l'urne $U_i$ ». $(${sys})$ est un <strong>système complet d'événements</strong> avec ${urnes.map((u, i) => R`$\Proba(U_${i + 1}) = ${u.p.tex()}$`).join(', ')}, et $\Proba_{U_i}(R)$ est la proportion de boules rouges dans $U_i$.</p>
            <ol><li><strong>Probabilités totales</strong> : $\Proba(R) = \sum_i \Proba(U_i)\Proba_{U_i}(R) = ${somme} = ${pR.tex()}$.</li>
            <li><strong>Bayes</strong> : $\Proba_R(U_1) = \dfrac{\Proba(U_1)\Proba_{U_1}(R)}{\Proba(R)} = \dfrac{${j1.tex()}}{${pR.tex()}} = ${post1.tex()}$.</li>
            <li>$\Proba(\overline R) = 1 - ${pR.tex()} = ${pB.tex()}$, et $\Proba_{\overline R}(U_${m}) = \dfrac{\Proba(U_${m})\Proba_{U_${m}}(\overline R)}{\Proba(\overline R)} = \dfrac{${last.p.tex()} \times \frac{${last.b}}{${last.n}}}{${pB.tex()}} = ${postL.tex()}$.</li></ol>`
        };
      }
    },

    bayes: {
      title: 'Test de dépistage, filtre, contrôle (Bayes)', diff: 2,
      make(r) {
        const ctx = r.pick(['maladie', 'spam', 'usine']);
        const a = ctx === 'spam' ? r.pick([20, 30, 40, 50]) : r.pick([1, 2, 3, 5, 10]);
        const s = r.pick([90, 95, 98, 99]), q = r.pick([90, 95, 97, 98, 99]);
        const L = {
          maladie: { M: 'la personne est malade', T: 'le test est positif',
            intro: R`Une maladie touche $${a}\,\%$ d'une population. Un test de dépistage est positif chez $${s}\,\%$ des malades et négatif chez $${q}\,\%$ des personnes saines. On teste une personne choisie au hasard.`,
            q2: 'Le test est positif. Quelle est la probabilité que la personne soit malade ?',
            q3: 'Le test est négatif. Quelle est la probabilité que la personne soit saine ?' },
          spam: { M: 'le courriel est un spam', T: 'le filtre classe le courriel en spam',
            intro: R`$${a}\,\%$ des courriels reçus sont des spams. Un filtre classe en « spam » $${s}\,\%$ des spams et seulement $${100 - q}\,\%$ des courriels légitimes. On reçoit un courriel au hasard.`,
            q2: 'Le courriel est classé en spam. Quelle est la probabilité que ce soit vraiment un spam ?',
            q3: 'Le courriel n’est pas classé en spam. Quelle est la probabilité qu’il soit légitime ?' },
          usine: { M: 'la pièce est défectueuse', T: 'la pièce est rejetée',
            intro: R`$${a}\,\%$ des pièces produites par une usine sont défectueuses. Un contrôle automatique rejette $${s}\,\%$ des pièces défectueuses et $${100 - q}\,\%$ des pièces correctes. On contrôle une pièce prise au hasard.`,
            q2: 'La pièce est rejetée. Quelle est la probabilité qu’elle soit défectueuse ?',
            q3: 'La pièce est acceptée. Quelle est la probabilité qu’elle soit correcte ?' }
        }[ctx];
        const mt = a * s, nt = (100 - a) * (100 - q), T = mt + nt;           // en 1/10 000
        const sn = (100 - a) * q, mn = a * (100 - s);
        const pT = T / 1e4, post = mt / T, post2 = sn / (sn + mn);
        return {
          enonce: R`<p>${L.intro}</p><ol><li>Quelle est la probabilité de l'événement $T$ : « ${L.T} » ?</li><li>${L.q2}</li><li>${L.q3}</li></ol>`,
          indication: R`<p>Noter $M$ : « ${L.M} ». Traduire les pourcentages en $\Proba(M)$, $\Proba_M(T)$, $\Proba_{\overline M}(\overline T)$, puis faire un arbre pondéré.</p>`,
          correction: R`<p>Notons $M$ : « ${L.M} » et $T$ : « ${L.T} ». Données : $\Proba(M) = ${dec(a / 100, 2)}$, $\Proba_M(T) = ${dec(s / 100, 2)}$, $\Proba_{\overline M}(\overline T) = ${dec(q / 100, 2)}$ donc $\Proba_{\overline M}(T) = ${dec((100 - q) / 100, 2)}$.</p>
            <ol><li><strong>Probabilités totales</strong> avec le système complet $(M, \overline M)$ : $\Proba(T) = \Proba(M)\Proba_M(T) + \Proba(\overline M)\Proba_{\overline M}(T) = ${dec(a / 100, 2)} \times ${dec(s / 100, 2)} + ${dec((100 - a) / 100, 2)} \times ${dec((100 - q) / 100, 2)} = ${dec(mt / 1e4, 4)} + ${dec(nt / 1e4, 4)} = ${dec(pT, 4)}$.</li>
            <li><strong>Bayes</strong> : $\Proba_T(M) = \dfrac{\Proba(M)\Proba_M(T)}{\Proba(T)} = \dfrac{${dec(mt / 1e4, 4)}}{${dec(pT, 4)}} = ${fr(mt, T)} ${approx(post)}$.</li>
            <li>$\Proba(\overline T) = 1 - ${dec(pT, 4)} = ${dec(1 - pT, 4)}$ et $\Proba_{\overline T}(\overline M) = \dfrac{\Proba(\overline M)\Proba_{\overline M}(\overline T)}{\Proba(\overline T)} = \dfrac{${dec(sn / 1e4, 4)}}{${dec(1 - pT, 4)}} ${approx(post2)}$.</li></ol>
            ${post < 0.5 ? R`<p>Interprétation : moins d'une chance sur deux malgré un dispositif fiable, car l'événement $M$ est <strong>rare</strong> : la plupart des cas où $T$ est réalisé viennent de $\overline M$ (faux positifs).</p>` : ''}`
        };
      }
    },

    auMoinsUn: {
      title: 'Épreuves indépendantes : « au moins une fois »', diff: 2,
      make(r) {
        const ctx = r.pick(['de', 'double', 'tir', 'loterie']);
        let p, n, txt, ev;
        if (ctx === 'de') { p = F(1, 6); n = r.int(3, 8); txt = R`On lance $${n}$ fois un dé équilibré.`; ev = 'obtenir 6'; }
        else if (ctx === 'double') { p = F(1, 36); n = r.int(10, 30); txt = R`On lance $${n}$ fois deux dés équilibrés.`; ev = 'obtenir un double six'; }
        else if (ctx === 'tir') { p = F(r.int(1, 3), 10); n = r.int(3, 6); txt = R`Un tireur atteint sa cible avec la probabilité $${p.tex()}$ à chaque tir, indépendamment des autres tirs. Il tire $${n}$ fois.`; ev = 'atteindre la cible'; }
        else { p = F(1, 20); n = r.int(5, 20); txt = R`Dans une loterie, chaque billet est gagnant avec la probabilité $${p.tex()}$, indépendamment des autres. On achète $${n}$ billets.`; ev = 'avoir un billet gagnant'; }
        const q = F(1).sub(p), qv = q.val(), c = r.pick([0.5, 0.9, 0.95, 0.99]);
        const pn = 1 - Math.pow(qv, n), one = n * p.val() * Math.pow(qv, n - 1);
        const nmin = Math.ceil(Math.log(1 - c) / Math.log(qv) - 1e-12);
        return {
          enonce: R`<p>${txt} On s'intéresse à l'événement « ${ev} » (probabilité $${p.tex()}$ à chaque épreuve).</p>
            <ol><li>Quelle est la probabilité de ${ev} au moins une fois ?</li><li>Quelle est la probabilité de ${ev} exactement une fois ?</li><li>Combien d'épreuves faut-il au minimum pour que la probabilité de ${ev} au moins une fois dépasse $${dec(c, 2)}$ ?</li></ol>`,
          indication: R`<p>Passer au contraire : « ne jamais ${ev} », intersection d'événements <strong>mutuellement indépendants</strong>.</p>`,
          correction: R`<p>Notons $E_i$ : « ${ev} à la $i$-ème épreuve » ; les $E_i$ sont mutuellement indépendants, de probabilité $${p.tex()}$, donc les $\overline{E_i}$ aussi (probabilité $${q.tex()}$).</p>
            <ol><li>Le contraire de « au moins une fois » est $\overline{E_1} \cap \dots \cap \overline{E_{${n}}}$ : $\Proba = 1 - \left(${q.tex()}\right)^{${n}} ${approx(pn)}$.</li>
            <li>« Exactement une fois » est la réunion des $${n}$ événements incompatibles « succès à l'épreuve $i$ et échec aux autres », chacun de probabilité $${p.tex()}\left(${q.tex()}\right)^{${n - 1}}$ : $\Proba = ${n} \times ${p.tex()}\left(${q.tex()}\right)^{${n - 1}} ${approx(one)}$.</li>
            <li>Avec $m$ épreuves : $1 - \left(${q.tex()}\right)^m \ge ${dec(c, 2)} \iff \left(${q.tex()}\right)^m \le ${dec(1 - c, 2)} \iff m \ge \dfrac{\ln(${dec(1 - c, 2)})}{\ln(${q.tex()})} \approx ${dec(Math.log(1 - c) / Math.log(qv), 2)}$ (on divise par $\ln(${q.tex()}) \lt 0$, ce qui change le sens). Il faut au minimum <strong>$${nmin}$ épreuves</strong>.</li></ol>`
        };
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Cours                                                               */
  /* ------------------------------------------------------------------ */
  const cours = [
    /* ================= Partie 1 ================= */
    { t: 'h', title: 'Dénombrements' },
    { t: 'h2', title: 'Ensembles finis et cardinal' },
    { t: 'def', body: R`<p>Un ensemble $E$ est <strong>fini</strong> s'il est vide ou en bijection avec $\{1, \dots, n\}$ pour un certain $n \in \N^*$. Cet entier $n$ (unique) est le <strong>cardinal</strong> de $E$, noté $\Card(E)$, $|E|$ ou $\#E$. On pose $\Card(\varnothing) = 0$.</p>` },
    { t: 'prop', title: 'règles de base', body: R`<p>Soient $A, B$ des parties finies d'un ensemble $E$ fini.</p>
      <ol>
        <li><strong>Principe additif</strong> : si $A \cap B = \varnothing$, $\Card(A \cup B) = \Card A + \Card B$.</li>
        <li>$\Card(\overline{A}) = \Card E - \Card A$ (complémentaire dans $E$).</li>
        <li>$\Card(A \cup B) = \Card A + \Card B - \Card(A \cap B)$.</li>
        <li><strong>Principe multiplicatif</strong> : $\Card(A \times B) = \Card A \times \Card B$.</li>
      </ol>`,
      proof: R`<p>1. On juxtapose une bijection $A \to \{1..a\}$ et une bijection $B \to \{a+1..a+b\}$. 2. $E = A \sqcup \overline A$. 3. $A \cup B = A \sqcup (B \setminus A)$ et $B = (B\setminus A) \sqcup (A \cap B)$. 4. $A \times B = \bigsqcup_{a \in A}\{a\} \times B$ : réunion disjointe de $\Card A$ ensembles de cardinal $\Card B$.</p>` },
    { t: 'thm', title: 'formule du crible de Poincaré', body: R`<p>Pour des parties finies $A_1, \dots, A_n$ :</p>
      $$\Card\Big(\bigcup_{i=1}^n A_i\Big) = \sum_{k=1}^n (-1)^{k+1}\sum_{1 \le i_1 < \dots < i_k \le n}\Card(A_{i_1} \cap \dots \cap A_{i_k}).$$
      <p>Pour trois ensembles : $|A \cup B \cup C| = |A| + |B| + |C| - |A \cap B| - |A \cap C| - |B \cap C| + |A \cap B \cap C|$.</p>`,
      proof: R`<p>Soit $x$ appartenant à exactement $m \ge 1$ des $A_i$. Dans le membre de droite, $x$ est compté $\sum_{k=1}^m(-1)^{k+1}\binom mk$ fois (nombre de façons de choisir $k$ ensembles parmi les $m$ qui le contiennent). Or $\sum_{k=0}^m(-1)^k\binom mk = (1 - 1)^m = 0$, donc $\sum_{k=1}^m(-1)^{k+1}\binom mk = 1$ : chaque élément de la réunion est compté exactement une fois.</p>` },
    { t: 'prop', title: 'applications', body: R`<p>Si $E$ et $F$ sont finis de même cardinal et $f : E \to F$, alors $f$ injective $\iff$ $f$ surjective $\iff$ $f$ bijective.</p>`,
      proof: R`<p>$f$ injective $\Rightarrow$ $\Card f(E) = \Card E = \Card F$, donc $f(E) = F$. $f$ surjective $\Rightarrow$ si $f$ n'était pas injective, $\Card f(E) < \Card E = \Card F$, contradiction.</p>` },

    { t: 'h2', title: 'Listes et arrangements' },
    { t: 'def', body: R`<p>Soit $E$ un ensemble à $n$ éléments et $p \in \N$. Une <strong>$p$-liste</strong> d'éléments de $E$ est un élément $(x_1, \dots, x_p)$ de $E^p$ : l'ordre compte et les répétitions sont permises.</p>` },
    { t: 'prop', body: R`<ol><li>Il y a $n^p$ $p$-listes d'éléments de $E$.</li><li>Si $\Card E = p$ et $\Card F = n$, il y a $n^p$ applications de $E$ dans $F$.</li><li>$E$ possède $2^n$ parties : $\Card\mathcal{P}(E) = 2^n$.</li></ol>`,
      proof: R`<p>1. Principe multiplicatif : $\Card(E^p) = (\Card E)^p$. 2. Une application $f : \{e_1, \dots, e_p\} \to F$ est déterminée par la liste $(f(e_1), \dots, f(e_p)) \in F^p$. 3. L'application $A \mapsto \mathbb{1}_A$ est une bijection de $\mathcal P(E)$ sur l'ensemble des applications $E \to \{0, 1\}$, qui a $2^n$ éléments.</p>` },
    { t: 'def', body: R`<p>Un <strong>arrangement</strong> de $p$ éléments de $E$ est une $p$-liste d'éléments <strong>deux à deux distincts</strong>. Une <strong>permutation</strong> de $E$ est un arrangement de ses $n$ éléments, c'est-à-dire une bijection de $E$ dans $E$.</p>` },
    { t: 'thm', body: R`<p>Pour $0 \le p \le n$, le nombre d'arrangements de $p$ éléments parmi $n$ est</p>
      $$A_n^p = n(n-1)\cdots(n-p+1) = \frac{n!}{(n-p)!}.$$
      <p>C'est aussi le nombre d'<strong>injections</strong> d'un ensemble à $p$ éléments dans un ensemble à $n$ éléments. Il y a $n!$ permutations d'un ensemble à $n$ éléments. Si $p > n$, il n'y a aucun arrangement.</p>`,
      proof: R`<p>On choisit $x_1$ ($n$ choix), puis $x_2 \neq x_1$ ($n - 1$ choix), …, puis $x_p$ distinct des $p - 1$ précédents ($n - p + 1$ choix). Le principe multiplicatif (généralisé : le nombre de choix à chaque étape ne dépend pas des choix précédents) donne le produit.</p>` },

    { t: 'h2', title: 'Combinaisons et coefficients binomiaux' },
    { t: 'def', body: R`<p>Une <strong>combinaison</strong> de $p$ éléments de $E$ est une <strong>partie</strong> de $E$ à $p$ éléments (l'ordre ne compte pas, pas de répétition). On note $\binom np$ (« $p$ parmi $n$ ») leur nombre.</p>` },
    { t: 'thm', body: R`$$\binom np = \frac{A_n^p}{p!} = \frac{n!}{p!\,(n-p)!} \quad (0 \le p \le n), \qquad \binom np = 0 \text{ si } p > n.$$`,
      proof: R`<p>On compte les arrangements de deux façons : choisir un arrangement de $p$ éléments revient à choisir une partie à $p$ éléments ($\binom np$ façons) puis à ordonner ses éléments ($p!$ façons). Donc $A_n^p = \binom np\, p!$.</p>` },
    { t: 'prop', body: R`<ol>
        <li><strong>Symétrie</strong> : $\binom np = \binom n{n-p}$.</li>
        <li><strong>Formule de Pascal</strong> : $\binom np = \binom{n-1}{p-1} + \binom{n-1}{p}$ pour $1 \le p \le n-1$.</li>
        <li><strong>Formule du pion</strong> : $p\binom np = n\binom{n-1}{p-1}$.</li></ol>`,
      proof: R`<p>1. $A \mapsto \overline A$ est une bijection entre parties à $p$ éléments et parties à $n - p$ éléments.</p>
      <p>2. Fixons $a \in E$. Les parties à $p$ éléments se répartissent en celles qui contiennent $a$ ($\binom{n-1}{p-1}$ : on complète $\{a\}$ par $p-1$ éléments parmi les $n-1$ autres) et celles qui ne le contiennent pas ($\binom{n-1}{p}$).</p>
      <p>3. On compte les couples (comité à $p$ membres, président dans le comité) : $\binom np \times p$ ; ou président d'abord ($n$ choix) puis les $p-1$ autres membres : $n\binom{n-1}{p-1}$.</p>` },
    { t: 'thm', title: 'binôme de Newton', body: R`<p>Pour $a, b$ dans un anneau commutatif (par exemple $\R$ ou $\C$) et $n \in \N$ :</p>
      $$(a + b)^n = \sum_{k=0}^n\binom nk a^k b^{n-k}.$$`,
      proof: R`<p>En développant $(a+b)(a+b)\cdots(a+b)$ ($n$ facteurs), on obtient une somme de $2^n$ produits, chacun obtenu en choisissant $a$ ou $b$ dans chaque facteur. Le produit $a^kb^{n-k}$ apparaît autant de fois qu'il y a de façons de choisir les $k$ facteurs où l'on prend $a$, soit $\binom nk$.</p>` },
    { t: 'cor', body: R`$$\sum_{k=0}^n\binom nk = 2^n, \qquad \sum_{k=0}^n(-1)^k\binom nk = 0 \ (n \ge 1).$$`,
      proof: R`<p>Binôme avec $a = b = 1$, puis $a = -1$, $b = 1$. La première égalité se lit aussi : $\mathcal P(E)$ est la réunion disjointe des ensembles de parties à $k$ éléments, $k = 0..n$.</p>` },
    { t: 'prop', title: 'formule de Vandermonde', body: R`$$\sum_{k=0}^{n}\binom ak\binom b{n-k} = \binom{a+b}{n}.$$`,
      proof: R`<p>Dans un ensemble formé de $a$ filles et $b$ garçons, choisir $n$ personnes revient à choisir, pour un certain $k$, $k$ filles et $n - k$ garçons ; on somme sur $k$.</p>` },
    { t: 'ex', body: R`<p>Mains de 5 cartes dans un jeu de 52 cartes : $\binom{52}{5} = 2\,598\,960$. Nombre de <em>full</em> (trois cartes d'une hauteur, deux d'une autre) : on choisit la hauteur du brelan ($13$), ses 3 couleurs ($\binom43$), la hauteur de la paire ($12$), ses 2 couleurs ($\binom42$) : $13 \times 4 \times 12 \times 6 = 3\,744$.</p>` },

    { t: 'h2', title: 'Permutations avec répétition, combinaisons avec répétition' },
    { t: 'thm', title: 'coefficients multinomiaux', body: R`<p>Le nombre de façons de ranger $n$ objets dont $n_1$ sont identiques de type 1, …, $n_r$ identiques de type $r$ ($n_1 + \dots + n_r = n$) est</p>
      $$\binom{n}{n_1, \dots, n_r} = \frac{n!}{n_1!\,n_2!\cdots n_r!}.$$`,
      proof: R`<p>On choisit les $n_1$ positions des objets de type 1 ($\binom n{n_1}$), puis les $n_2$ positions de type 2 parmi les $n - n_1$ restantes, etc. Le produit $\binom n{n_1}\binom{n - n_1}{n_2}\cdots$ se simplifie en $\frac{n!}{n_1!\cdots n_r!}$.</p>` },
    { t: 'ex', body: R`<p>Anagrammes de MISSISSIPPI (M : 1, I : 4, S : 4, P : 2) : $\dfrac{11!}{1!\,4!\,4!\,2!} = 34\,650$.</p>` },
    { t: 'thm', title: 'étoiles et barres', body: R`<p>Le nombre de solutions $(x_1, \dots, x_k) \in \N^k$ de $x_1 + \dots + x_k = n$ est $\displaystyle\binom{n + k - 1}{k - 1}$. C'est aussi le nombre de façons de choisir $n$ objets parmi $k$ types, avec répétition et sans ordre (<strong>combinaisons avec répétition</strong>).</p>`,
      proof: R`<p>Une solution s'encode de façon unique par un mot de $n$ étoiles et $k - 1$ barres : $x_1$ étoiles, une barre, $x_2$ étoiles, …, une barre, $x_k$ étoiles. Un tel mot est déterminé par les positions des $k - 1$ barres parmi les $n + k - 1$ symboles.</p>` },

    { t: 'h2', title: 'Choisir le bon modèle' },
    { t: 'meth', title: 'tableau récapitulatif', body: R`<p>On tire $p$ objets parmi $n$ :</p>
      <table class="t"><tr><th></th><th>avec répétition</th><th>sans répétition</th></tr>
      <tr><th>ordre important</th><td>$p$-listes : $n^p$<br><small>tirages successifs avec remise</small></td><td>arrangements : $A_n^p$<br><small>tirages successifs sans remise</small></td></tr>
      <tr><th>ordre sans importance</th><td>$\binom{n+p-1}{p}$<br><small>combinaisons avec répétition</small></td><td>combinaisons : $\binom np$<br><small>tirage simultané</small></td></tr></table>` },
    { t: 'rem', body: R`<p>Pour compter « au moins un », on passe presque toujours au <strong>complémentaire</strong> (« aucun »). Et pour éviter de compter deux fois le même objet, on vérifie que la description choisie est une <strong>bijection</strong> : chaque objet correspond à exactement une suite de choix.</p>` },

    /* ================= Partie 2 ================= */
    { t: 'h', title: 'Espaces probabilisés et probabilités' },
    { t: 'h2', title: 'Expérience aléatoire, univers, événements' },
    { t: 'def', body: R`<p>Une <strong>expérience aléatoire</strong> est une expérience dont on ne peut pas prévoir le résultat. L'ensemble de ses résultats possibles, les <strong>issues</strong>, est l'<strong>univers</strong>, noté $\Omega$. Un <strong>événement</strong> est une partie $A$ de $\Omega$ ; on dit que $A$ est <strong>réalisé</strong> si l'issue obtenue $\omega$ appartient à $A$. Les singletons $\{\omega\}$ sont les <strong>événements élémentaires</strong>.</p>` },
    { t: 'ex', body: R`<p>Lancer d'un dé : $\Omega = \{1, \dots, 6\}$ et « le résultat est pair » est l'événement $A = \{2, 4, 6\}$. Lancer de deux dés : $\Omega = \{1, \dots, 6\}^2$, $\Card\Omega = 36$, et « la somme vaut 4 » est $\{(1,3), (2,2), (3,1)\}$.</p>` },
    { t: 'nota', title: 'dictionnaire ensembles / probabilités', body: R`<table class="t"><tr><th>Ensembles</th><th>Probabilités</th></tr>
      <tr><td>$\Omega$</td><td>événement certain</td></tr>
      <tr><td>$\varnothing$</td><td>événement impossible</td></tr>
      <tr><td>$\overline A = \Omega \setminus A$</td><td>événement contraire « non $A$ »</td></tr>
      <tr><td>$A \cup B$</td><td>« $A$ ou $B$ » (au moins l'un des deux)</td></tr>
      <tr><td>$A \cap B$</td><td>« $A$ et $B$ »</td></tr>
      <tr><td>$A \cap B = \varnothing$</td><td>$A$ et $B$ sont <strong>incompatibles</strong></td></tr>
      <tr><td>$A \subset B$</td><td>$A$ implique $B$</td></tr></table>` },
    { t: 'def', body: R`<p>Une famille $(A_1, \dots, A_n)$ d'événements est un <strong>système complet d'événements</strong> si les $A_i$ sont <strong>deux à deux incompatibles</strong> et si $A_1 \cup \dots \cup A_n = \Omega$ : à chaque expérience, un et un seul des $A_i$ est réalisé.</p>` },
    { t: 'ex', body: R`<p>Pour tout événement $A$, $(A, \overline A)$ est un système complet. Pour un dé : $(\{1, 2\}, \{3, 4, 5\}, \{6\})$.</p>` },

    { t: 'h2', title: 'Tribus et probabilités' },
    { t: 'def', title: 'tribu', body: R`<p>Une <strong>tribu</strong> (ou $\sigma$-algèbre) sur $\Omega$ est un ensemble $\mathcal A$ de parties de $\Omega$ tel que :</p>
      <ol><li>$\Omega \in \mathcal A$ ;</li><li>$A \in \mathcal A \Rightarrow \overline A \in \mathcal A$ (stabilité par passage au contraire) ;</li><li>pour toute suite $(A_n)$ d'éléments de $\mathcal A$, $\bigcup_n A_n \in \mathcal A$ (stabilité par réunion dénombrable).</li></ol>
      <p>Le couple $(\Omega, \mathcal A)$ est un <strong>espace probabilisable</strong> ; les éléments de $\mathcal A$ sont les événements.</p>` },
    { t: 'rem', body: R`<p>Une tribu contient $\varnothing$ et est stable par intersection dénombrable ($\bigcap A_n = \overline{\bigcup \overline{A_n}}$). Sur un univers <strong>fini</strong> (ou dénombrable), on prend toujours $\mathcal A = \mathcal P(\Omega)$ : toute partie est un événement. La notion de tribu ne devient indispensable que pour des univers comme $\R$ (variables à densité).</p>` },
    { t: 'def', title: 'probabilité', body: R`<p>Une <strong>probabilité</strong> sur $(\Omega, \mathcal A)$ est une application $\Proba : \mathcal A \to [0, 1]$ telle que :</p>
      <ol><li>$\Proba(\Omega) = 1$ ;</li><li>(<strong>$\sigma$-additivité</strong>) pour toute suite $(A_n)$ d'événements <strong>deux à deux incompatibles</strong>, $\displaystyle\Proba\Big(\bigcup_{n} A_n\Big) = \sum_{n} \Proba(A_n)$.</li></ol>
      <p>Le triplet $(\Omega, \mathcal A, \Proba)$ est un <strong>espace probabilisé</strong>. Si $\Omega$ est fini, il suffit de vérifier l'additivité : $\Proba(A \cup B) = \Proba(A) + \Proba(B)$ dès que $A \cap B = \varnothing$.</p>` },
    { t: 'prop', title: 'règles de calcul', body: R`<p>Pour tous événements $A$, $B$, $A_1, \dots, A_n$ :</p>
      <ol><li>$\Proba(\varnothing) = 0$, et $\Proba(A_1 \cup \dots \cup A_n) = \sum \Proba(A_i)$ si les $A_i$ sont deux à deux incompatibles ;</li>
      <li>$\Proba(\overline A) = 1 - \Proba(A)$ ;</li>
      <li>si $A \subset B$ : $\Proba(B \setminus A) = \Proba(B) - \Proba(A)$, donc $\Proba(A) \le \Proba(B)$ (<strong>croissance</strong>) ;</li>
      <li>$\Proba(A \cup B) = \Proba(A) + \Proba(B) - \Proba(A \cap B)$ ;</li>
      <li>$\Proba(A_1 \cup \dots \cup A_n) \le \Proba(A_1) + \dots + \Proba(A_n)$ (<strong>sous-additivité</strong>).</li></ol>`,
      proof: R`<p>1. Avec $A_n = \varnothing$ pour tout $n$, la $\sigma$-additivité donne $\Proba(\varnothing) = \sum_n \Proba(\varnothing)$, ce qui impose $\Proba(\varnothing) = 0$. On complète alors une famille finie par des $\varnothing$.</p>
      <p>2. $\Omega = A \sqcup \overline A$ donc $1 = \Proba(A) + \Proba(\overline A)$.</p>
      <p>3. $B = A \sqcup (B \setminus A)$ donc $\Proba(B) = \Proba(A) + \Proba(B \setminus A) \ge \Proba(A)$.</p>
      <p>4. $A \cup B = A \sqcup (B \setminus (A \cap B))$ et, par 3, $\Proba(B \setminus (A \cap B)) = \Proba(B) - \Proba(A \cap B)$.</p>
      <p>5. Par 4, $\Proba(A \cup B) \le \Proba(A) + \Proba(B)$ ; récurrence sur $n$.</p>` },
    { t: 'thm', title: 'formule du crible (de Poincaré)', body: R`$$\Proba\Big(\bigcup_{i=1}^n A_i\Big) = \sum_{k=1}^n (-1)^{k+1}\sum_{1 \le i_1 \lt \dots \lt i_k \le n}\Proba(A_{i_1} \cap \dots \cap A_{i_k}).$$
      <p>Pour trois événements : $\Proba(A \cup B \cup C) = \Proba(A) + \Proba(B) + \Proba(C) - \Proba(A \cap B) - \Proba(A \cap C) - \Proba(B \cap C) + \Proba(A \cap B \cap C)$.</p>`,
      proof: R`<p>Récurrence sur $n$, le cas $n = 2$ étant la règle 4. Si la formule est vraie au rang $n$, on pose $B = A_1 \cup \dots \cup A_n$ : $\Proba(B \cup A_{n+1}) = \Proba(B) + \Proba(A_{n+1}) - \Proba\big(\bigcup_{i \le n}(A_i \cap A_{n+1})\big)$. On applique l'hypothèse de récurrence à $\Proba(B)$ et à la dernière réunion (de $n$ événements $A_i \cap A_{n+1}$) ; en regroupant, on obtient tous les termes de rang $n+1$ avec les bons signes (ceux qui contiennent $A_{n+1}$ viennent du dernier terme, avec un signe de plus).</p>` },
    { t: 'prop', title: 'continuité monotone', body: R`<ol><li>Si $(A_n)$ est une suite <strong>croissante</strong> d'événements ($A_n \subset A_{n+1}$) : $\Proba\big(\bigcup_n A_n\big) = \lim_{n \to +\infty}\Proba(A_n)$.</li>
      <li>Si $(A_n)$ est <strong>décroissante</strong> : $\Proba\big(\bigcap_n A_n\big) = \lim_{n \to +\infty}\Proba(A_n)$.</li></ol>`,
      proof: R`<p>1. On pose $B_0 = A_0$ et $B_n = A_n \setminus A_{n-1}$ : les $B_n$ sont deux à deux incompatibles, $A_n = B_0 \sqcup \dots \sqcup B_n$ et $\bigcup A_n = \bigsqcup B_n$. Par $\sigma$-additivité, $\Proba(\bigcup A_n) = \sum_{k=0}^{+\infty}\Proba(B_k) = \lim_n \sum_{k=0}^n \Proba(B_k) = \lim_n \Proba(A_n)$.</p>
      <p>2. On applique 1 à la suite croissante $(\overline{A_n})$ et on passe au contraire.</p>` },
    { t: 'rem', body: R`<p>Ce résultat ne sert que pour les univers infinis (par exemple « obtenir 6 au moins une fois si l'on lance le dé indéfiniment ») ; sur un univers fini, toute suite monotone d'événements est stationnaire.</p>` },

    { t: 'h2', title: 'Probabilités sur un univers fini' },
    { t: 'thm', body: R`<p>Soit $\Omega = \{\omega_1, \dots, \omega_n\}$ un univers fini.</p>
      <ol><li>Si $\Proba$ est une probabilité sur $(\Omega, \mathcal P(\Omega))$, les nombres $p_i = \Proba(\{\omega_i\})$ sont positifs, de somme $1$, et pour tout événement $A$ : $\displaystyle\Proba(A) = \sum_{\omega_i \in A} p_i$.</li>
      <li>Réciproquement, si $p_1, \dots, p_n$ sont des réels positifs de somme $1$, il existe une <strong>unique</strong> probabilité $\Proba$ sur $\Omega$ telle que $\Proba(\{\omega_i\}) = p_i$ pour tout $i$.</li></ol>`,
      proof: R`<p>1. $A$ est la réunion disjointe des singletons $\{\omega_i\}$, $\omega_i \in A$ ; on applique l'additivité. Avec $A = \Omega$ : $\sum p_i = 1$.</p>
      <p>2. <em>Unicité</em> : par 1, $\Proba$ est forcément donnée par $\Proba(A) = \sum_{\omega_i \in A} p_i$. <em>Existence</em> : cette formule définit une application à valeurs dans $[0, 1]$ (somme de termes positifs, majorée par $\sum p_i = 1$), avec $\Proba(\Omega) = 1$, et si $A \cap B = \varnothing$, la somme sur $A \cup B$ se coupe en la somme sur $A$ plus la somme sur $B$.</p>` },
    { t: 'ex', body: R`<p>Dé truqué : la probabilité d'obtenir $k$ est proportionnelle à $k$. On cherche $p_k = ck$ avec $\sum_{k=1}^6 ck = 21c = 1$, donc $p_k = \frac{k}{21}$. Alors $\Proba(\text{pair}) = \frac{2 + 4 + 6}{21} = \frac47$.</p>` },
    { t: 'def', title: 'équiprobabilité', body: R`<p>La <strong>probabilité uniforme</strong> sur $\Omega$ fini est celle pour laquelle toutes les issues ont la même probabilité. On dit alors que les issues sont <strong>équiprobables</strong>.</p>` },
    { t: 'thm', body: R`<p>Sous l'hypothèse d'équiprobabilité, $\Proba(\{\omega\}) = \dfrac{1}{\Card\Omega}$ et pour tout événement $A$ :</p>
      $$\Proba(A) = \frac{\Card A}{\Card\Omega} = \frac{\text{nombre de cas favorables}}{\text{nombre de cas possibles}}.$$`,
      proof: R`<p>Si $\Proba(\{\omega\}) = p$ pour tout $\omega$, alors $1 = \sum_{\omega \in \Omega} p = p\Card\Omega$. Puis $\Proba(A) = \sum_{\omega \in A} p = \frac{\Card A}{\Card\Omega}$.</p>` },
    { t: 'ex', body: R`<p>Deux dés équilibrés : « la somme vaut 7 » $= \{(1,6), (2,5), (3,4), (4,3), (5,2), (6,1)\}$, de probabilité $\frac{6}{36} = \frac16$, alors que « la somme vaut 2 » $= \{(1,1)\}$ a pour probabilité $\frac1{36}$.</p>` },
    { t: 'warn', body: R`<p>Les sommes $2, 3, \dots, 12$ ne sont <strong>pas</strong> équiprobables. Pour utiliser $\frac{\Card A}{\Card\Omega}$, il faut choisir un univers dont les issues sont équiprobables : on rend les objets <strong>discernables</strong> (dés de couleurs différentes, boules numérotées), même s'ils ne le sont pas en réalité.</p>` },
    { t: 'ex', title: 'paradoxe des anniversaires', body: R`<p>$n$ personnes ($n \le 365$), dates d'anniversaire équiprobables parmi 365 jours : $\Omega = \{1, \dots, 365\}^n$. L'événement contraire de « deux personnes au moins ont le même anniversaire » est « les $n$ dates sont distinctes », formé de $A_{365}^n$ listes. Donc</p>
      $$\Proba(\text{au moins une coïncidence}) = 1 - \frac{A_{365}^n}{365^n} = 1 - \frac{365 \times 364 \times \dots \times (365 - n + 1)}{365^n}.$$
      <p>Pour $n = 23$, cette probabilité vaut environ $0{,}507$ : plus d'une chance sur deux !</p>` },
    { t: 'meth', title: 'tirages et univers', body: R`<p>On tire $k$ boules dans une urne de $n$ boules numérotées :</p>
      <ul><li><strong>simultanément</strong> : $\Omega$ = parties à $k$ éléments, $\Card\Omega = \binom nk$ ;</li>
      <li><strong>successivement sans remise</strong> : $\Omega$ = arrangements, $\Card\Omega = A_n^k$ ;</li>
      <li><strong>successivement avec remise</strong> : $\Omega$ = $k$-listes, $\Card\Omega = n^k$.</li></ul>
      <p>Pour un événement qui ne dépend pas de l'ordre (« exactement 2 rouges »), le tirage simultané et le tirage successif sans remise donnent la même probabilité.</p>` },

    /* ================= Partie 3 ================= */
    { t: 'h', title: 'Probabilités conditionnelles et indépendance' },
    { t: 'h2', title: 'Probabilité conditionnelle' },
    { t: 'def', body: R`<p>Soit $(\Omega, \mathcal A, \Proba)$ un espace probabilisé et $B$ un événement tel que $\Proba(B) \gt 0$. La <strong>probabilité de $A$ sachant $B$</strong> est</p>
      $$\Proba_B(A) = \Proba(A \mid B) = \frac{\Proba(A \cap B)}{\Proba(B)}.$$` },
    { t: 'rem', body: R`<p>En situation d'équiprobabilité, $\Proba_B(A) = \dfrac{\Card(A \cap B)}{\Card B}$ : savoir que $B$ est réalisé revient à <strong>restreindre l'univers à $B$</strong>.</p>` },
    { t: 'prop', body: R`<p>Si $\Proba(B) \gt 0$, l'application $\Proba_B : A \mapsto \Proba_B(A)$ est une probabilité sur $(\Omega, \mathcal A)$. En particulier $\Proba_B(\overline A) = 1 - \Proba_B(A)$ et $\Proba_B(A \cup A') = \Proba_B(A) + \Proba_B(A') - \Proba_B(A \cap A')$.</p>`,
      proof: R`<p>$A \cap B \subset B$ donc $0 \le \Proba_B(A) \le 1$. $\Proba_B(\Omega) = \frac{\Proba(B)}{\Proba(B)} = 1$. Si les $A_n$ sont deux à deux incompatibles, les $A_n \cap B$ aussi et $\Proba_B(\bigcup A_n) = \frac{\Proba(\bigcup (A_n \cap B))}{\Proba(B)} = \sum \frac{\Proba(A_n \cap B)}{\Proba(B)} = \sum \Proba_B(A_n)$.</p>` },
    { t: 'warn', body: R`<p>$\Proba_B(\overline A) = 1 - \Proba_B(A)$, mais en général $\Proba_{\overline B}(A) \neq 1 - \Proba_B(A)$ : on peut changer ce qu'on mesure, pas ce qu'on sait. Et $\Proba_B(A) \neq \Proba_A(B)$ en général.</p>` },
    { t: 'thm', title: 'formule des probabilités composées', body: R`<p>Si $\Proba(A_1 \cap \dots \cap A_{n-1}) \gt 0$ :</p>
      $$\Proba(A_1 \cap A_2 \cap \dots \cap A_n) = \Proba(A_1)\,\Proba_{A_1}(A_2)\,\Proba_{A_1 \cap A_2}(A_3)\cdots\Proba_{A_1 \cap \dots \cap A_{n-1}}(A_n).$$`,
      proof: R`<p>Chaque intersection $A_1 \cap \dots \cap A_k$ ($k \le n - 1$) contient $A_1 \cap \dots \cap A_{n-1}$, donc est de probabilité $\gt 0$ : les conditionnements ont un sens. En remplaçant chaque $\Proba_{A_1 \cap \dots \cap A_{k}}(A_{k+1})$ par $\frac{\Proba(A_1 \cap \dots \cap A_{k+1})}{\Proba(A_1 \cap \dots \cap A_k)}$, le produit se télescope et il reste $\Proba(A_1 \cap \dots \cap A_n)$.</p>` },
    { t: 'ex', body: R`<p>Une urne contient 4 boules rouges et 6 blanches ; on tire 3 boules successivement sans remise. Avec $R_i$ : « la $i$-ème boule est rouge » :</p>
      $$\Proba(R_1 \cap R_2 \cap \overline{R_3}) = \frac{4}{10} \times \frac{3}{9} \times \frac{6}{8} = \frac{1}{10}.$$` },

    { t: 'h2', title: 'Formule des probabilités totales, formule de Bayes' },
    { t: 'thm', title: 'formule des probabilités totales', body: R`<p>Soit $(A_1, \dots, A_n)$ un système complet d'événements avec $\Proba(A_i) \gt 0$ pour tout $i$. Pour tout événement $B$ :</p>
      $$\Proba(B) = \sum_{i=1}^n \Proba(A_i \cap B) = \sum_{i=1}^n \Proba(A_i)\,\Proba_{A_i}(B).$$`,
      proof: R`<p>$B = B \cap \Omega = \bigsqcup_i (B \cap A_i)$, réunion d'événements deux à deux incompatibles ; on applique l'additivité, puis $\Proba(A_i \cap B) = \Proba(A_i)\Proba_{A_i}(B)$.</p>` },
    { t: 'rem', title: 'arbre pondéré', body: R`<p>Cas le plus fréquent : $\Proba(B) = \Proba(A)\Proba_A(B) + \Proba(\overline A)\Proba_{\overline A}(B)$. Sur un <strong>arbre pondéré</strong>, la probabilité d'un chemin est le <strong>produit</strong> des poids de ses branches (probabilités composées), et $\Proba(B)$ est la <strong>somme</strong> des probabilités des chemins qui mènent à $B$ (probabilités totales). La somme des poids issus d'un même nœud vaut 1.</p>` },
    { t: 'thm', title: 'formule de Bayes', body: R`<p>Si $\Proba(A) \gt 0$ et $\Proba(B) \gt 0$ : $\displaystyle\Proba_B(A) = \frac{\Proba(A)\,\Proba_A(B)}{\Proba(B)}$. Avec un système complet $(A_1, \dots, A_n)$ d'événements de probabilités non nulles :</p>
      $$\Proba_B(A_j) = \frac{\Proba(A_j)\,\Proba_{A_j}(B)}{\sum_{i=1}^n \Proba(A_i)\,\Proba_{A_i}(B)}.$$`,
      proof: R`<p>$\Proba(A \cap B) = \Proba_B(A)\Proba(B) = \Proba_A(B)\Proba(A)$ ; on divise par $\Proba(B)$, puis on développe $\Proba(B)$ par la formule des probabilités totales.</p>` },
    { t: 'rem', body: R`<p>Bayes permet d'<strong>inverser le conditionnement</strong> : on connaît la probabilité de l'« effet » sachant la « cause » ($\Proba_{A_j}(B)$) et l'on cherche la probabilité de la cause sachant qu'on a observé l'effet ($\Proba_B(A_j)$). Sur l'arbre : <em>chemin qui passe par $A_j$ et mène à $B$</em> divisé par <em>somme des chemins qui mènent à $B$</em>.</p>` },
    { t: 'ex', title: 'test de dépistage', body: R`<p>Une maladie touche $1\,\%$ de la population ($M$). Un test ($T$ : « positif ») a une sensibilité $\Proba_M(T) = 0{,}99$ et une spécificité $\Proba_{\overline M}(\overline T) = 0{,}98$. Alors</p>
      $$\Proba(T) = 0{,}01 \times 0{,}99 + 0{,}99 \times 0{,}02 = 0{,}0297, \qquad \Proba_T(M) = \frac{0{,}0099}{0{,}0297} = \frac13.$$
      <p>Un test positif ne signifie « malade » qu'une fois sur trois : la maladie étant rare, les faux positifs (venant des $99\,\%$ de sains) sont plus nombreux que les vrais positifs.</p>` },

    { t: 'h2', title: 'Indépendance' },
    { t: 'def', body: R`<p>Deux événements $A$ et $B$ sont <strong>indépendants</strong> (pour la probabilité $\Proba$) si</p>
      $$\Proba(A \cap B) = \Proba(A)\,\Proba(B).$$` },
    { t: 'prop', body: R`<p>Si $\Proba(B) \gt 0$ : $A$ et $B$ sont indépendants $\iff$ $\Proba_B(A) = \Proba(A)$ (savoir que $B$ est réalisé ne modifie pas la probabilité de $A$).</p>`,
      proof: R`<p>On divise ou on multiplie l'égalité $\Proba(A \cap B) = \Proba(A)\Proba(B)$ par $\Proba(B) \gt 0$.</p>` },
    { t: 'prop', body: R`<p>Si $A$ et $B$ sont indépendants, alors $A$ et $\overline B$, $\overline A$ et $B$, $\overline A$ et $\overline B$ le sont aussi.</p>`,
      proof: R`<p>$\Proba(A \cap \overline B) = \Proba(A) - \Proba(A \cap B) = \Proba(A) - \Proba(A)\Proba(B) = \Proba(A)(1 - \Proba(B)) = \Proba(A)\Proba(\overline B)$. On applique ce résultat au couple $(\overline B, A)$, puis à $(\overline A, \overline B)$.</p>` },
    { t: 'warn', title: 'indépendants ≠ incompatibles', body: R`<p>Si $A$ et $B$ sont incompatibles avec $\Proba(A) \gt 0$ et $\Proba(B) \gt 0$, alors $\Proba(A \cap B) = 0 \neq \Proba(A)\Proba(B)$ : ils ne sont <strong>jamais</strong> indépendants (savoir que $B$ est réalisé dit que $A$ ne l'est pas). L'indépendance dépend de la probabilité $\Proba$, pas seulement des ensembles $A$ et $B$.</p>` },
    { t: 'def', title: 'indépendance mutuelle', body: R`<p>Les événements $A_1, \dots, A_n$ sont <strong>mutuellement indépendants</strong> si pour toute partie non vide $I \subset \{1, \dots, n\}$ :</p>
      $$\Proba\Big(\bigcap_{i \in I} A_i\Big) = \prod_{i \in I}\Proba(A_i).$$
      <p>Ils sont <strong>deux à deux indépendants</strong> si cette égalité est vraie pour les parties $I$ à deux éléments.</p>` },
    { t: 'prop', body: R`<p>Mutuellement indépendants $\Rightarrow$ deux à deux indépendants. La <strong>réciproque est fausse</strong>.</p>`,
      proof: R`<p>Le sens direct est le cas $\Card I = 2$. Contre-exemple pour la réciproque : on lance deux pièces équilibrées, $A$ : « la 1<sup>re</sup> donne pile », $B$ : « la 2<sup>e</sup> donne pile », $C$ : « les deux pièces donnent le même résultat ». Chacun a pour probabilité $\frac12$, et $A \cap B = A \cap C = B \cap C = \{PP\}$ a pour probabilité $\frac14 = \frac12 \times \frac12$ : ils sont deux à deux indépendants. Mais $\Proba(A \cap B \cap C) = \Proba(\{PP\}) = \frac14 \neq \frac18$.</p>` },
    { t: 'prop', body: R`<p>Si $A_1, \dots, A_n$ sont mutuellement indépendants, on obtient encore une famille mutuellement indépendante en remplaçant certains $A_i$ par leur contraire. En conséquence :</p>
      $$\Proba(A_1 \cup \dots \cup A_n) = 1 - \prod_{i=1}^n \big(1 - \Proba(A_i)\big).$$`,
      proof: R`<p>Il suffit de remplacer un seul événement, disons $A_1$. Pour $I \ni 1$, avec $J = I \setminus \{1\}$ et $D = \bigcap_{i \in J} A_i$ : $\Proba(\overline{A_1} \cap D) = \Proba(D) - \Proba(A_1 \cap D) = \prod_{J}\Proba(A_i) - \Proba(A_1)\prod_J\Proba(A_i) = \Proba(\overline{A_1})\prod_J \Proba(A_i)$. Puis le contraire de $\bigcup A_i$ est $\bigcap \overline{A_i}$, de probabilité $\prod(1 - \Proba(A_i))$.</p>` },
    { t: 'rem', title: 'modélisation', body: R`<p>« On répète $n$ fois une expérience de façon indépendante » (lancers successifs, tirages <strong>avec remise</strong>, composants qui tombent en panne indépendamment) signifie que des événements portant sur des épreuves différentes sont mutuellement indépendants. Exemple : la probabilité d'obtenir au moins un 6 en 4 lancers d'un dé est $1 - \left(\frac56\right)^4 \approx 0{,}518$.</p>` },
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche                                                               */
  /* ------------------------------------------------------------------ */
  const fiche = [
    { part: '1. Dénombrements' },
    { k: 'prop', t: 'Cardinaux',
      hyp: R`$A$, $B$ parties finies de $E$`,
      concl: [R`$|A \cup B| = |A| + |B| - |A \cap B|$`, R`$|\overline A| = |E| - |A|$`, R`$|A \times B| = |A|\,|B|$`] },
    { k: 'thm', t: 'Crible (3 ensembles)',
      concl: [R`$|A \cup B \cup C| = \sum |A| - \sum |A \cap B| + |A \cap B \cap C|$`],
      b: R`Signes alternés en général.` },
    { k: 'form', t: 'Listes',
      hyp: R`$|E| = n$ ; <u>ordre + répétitions</u>`,
      concl: [R`$n^p$ listes de $p$ éléments`, R`$|F|^{|E|}$ applications de $E$ dans $F$`, R`$2^n$ parties de $E$`] },
    { k: 'form', t: 'Arrangements',
      hyp: R`<u>ordre, sans répétition</u>`,
      concl: [R`$A_n^p = n(n-1)\cdots(n-p+1) = \dfrac{n!}{(n-p)!}$`, R`= nombre d'injections ; $n!$ permutations`] },
    { k: 'form', t: 'Combinaisons', prio: true,
      hyp: R`<u>sans ordre, sans répétition</u>`,
      concl: [R`$\dbinom np = \dfrac{n!}{p!\,(n-p)!}$ parties à $p$ éléments`] },
    { k: 'meth', t: 'Quel modèle ?', prio: true,
      hyp: R`On choisit $p$ objets parmi $n$`,
      concl: [R`ordre + répétitions : $n^p$`, R`ordre, sans répétition : $A_n^p$`, R`<u>sans ordre</u>, sans répétition : $\binom np$ (tirage simultané)`, R`sans ordre, avec répétitions : $\binom{n+p-1}{p}$`] },
    { k: 'prop', t: 'Propriétés des coefficients binomiaux',
      concl: [R`$\binom np = \binom n{n-p}$`, R`Pascal : $\binom np = \binom{n-1}{p-1} + \binom{n-1}{p}$`, R`Pion : $p\binom np = n\binom{n-1}{p-1}$`] },
    { k: 'thm', t: 'Binôme de Newton', prio: true,
      concl: [R`$(a+b)^n = \displaystyle\sum_{k=0}^n \binom nk a^k b^{n-k}$`, R`$\sum_k \binom nk = 2^n$ et $\sum_k (-1)^k \binom nk = 0$`] },
    { k: 'prop', t: 'Vandermonde',
      concl: [R`$\displaystyle\sum_k \binom ak \binom b{n-k} = \binom{a+b}{n}$`] },
    { k: 'form', t: 'Anagrammes',
      hyp: R`$n$ objets dont $n_1, \dots, n_r$ <u>identiques</u>`,
      concl: [R`$\dfrac{n!}{n_1!\,n_2!\cdots n_r!}$ rangements`] },
    { k: 'form', t: 'Étoiles et barres',
      hyp: R`$x_1 + \dots + x_k = n$`,
      concl: [R`$x_i \ge 0$ : $\binom{n+k-1}{k-1}$ solutions`, R`$x_i \ge 1$ : $\binom{n-1}{k-1}$ solutions`] },
    { k: 'meth', t: '« Au moins un »',
      concl: [R`Passer au <u>complémentaire</u> : total − « aucun »`] },
    { k: 'warn', t: 'Pièges',
      concl: [R`Introduire un ordre artificiel (deux paires : $\binom{13}{2}$, pas $13 \times 12$)`, R`Oublier de diviser par les symétries`, R`« J'en choisis un, puis le reste » compte plusieurs fois`] },

    { part: '2. Espaces probabilisés et probabilités' },
    { k: 'def', t: 'Vocabulaire',
      hyp: R`$\Omega$ univers, événement = partie de $\Omega$`,
      concl: [R`$\overline A$ : contraire ; $A \cap B$ : « $A$ et $B$ » ; $A \cup B$ : « $A$ ou $B$ »`, R`<u>Incompatibles</u> : $A \cap B = \varnothing$`, R`<u>Système complet</u> : $A_i$ deux à deux incompatibles, de réunion $\Omega$`] },
    { k: 'def', t: 'Probabilité',
      hyp: R`$(\Omega, \mathcal A)$, $\mathcal A$ tribu ($\mathcal A = \mathcal P(\Omega)$ si $\Omega$ fini)`,
      concl: [R`$\Proba : \mathcal A \to [0, 1]$, $\Proba(\Omega) = 1$`, R`<u>$\sigma$-additivité</u> : $A_n$ deux à deux incompatibles $\Rightarrow \Proba(\bigcup A_n) = \sum \Proba(A_n)$`] },
    { k: 'prop', t: 'Règles de calcul', prio: true,
      concl: [R`$\Proba(\overline A) = 1 - \Proba(A)$`, R`$A \subset B \Rightarrow \Proba(A) \le \Proba(B)$`, R`$\Proba(A \cup B) = \Proba(A) + \Proba(B) - \Proba(A \cap B)$`] },
    { k: 'thm', t: 'Crible (3 événements)',
      concl: [R`$\Proba(A \cup B \cup C) = \sum\Proba(A) - \sum\Proba(A \cap B) + \Proba(A \cap B \cap C)$`] },
    { k: 'prop', t: 'Continuité monotone',
      concl: [R`$(A_n)$ <u>croissante</u> : $\Proba(\bigcup A_n) = \lim \Proba(A_n)$`, R`$(A_n)$ <u>décroissante</u> : $\Proba(\bigcap A_n) = \lim \Proba(A_n)$`] },
    { k: 'thm', t: 'Univers fini',
      hyp: R`$\Omega = \{\omega_1, \dots, \omega_n\}$`,
      concl: [R`$\Proba(A) = \sum_{\omega_i \in A}\Proba(\{\omega_i\})$`, R`$p_i \ge 0$ de <u>somme 1</u> $\Rightarrow$ une unique $\Proba$ avec $\Proba(\{\omega_i\}) = p_i$`] },
    { k: 'form', t: 'Équiprobabilité', prio: true,
      hyp: R`Issues <u>équiprobables</u>`,
      concl: [R`$\Proba(A) = \dfrac{\Card A}{\Card \Omega} = \dfrac{\text{cas favorables}}{\text{cas possibles}}$`],
      b: R`Rendre les objets discernables (dés de couleurs, boules numérotées).` },
    { part: '3. Probabilités conditionnelles et indépendance' },
    { k: 'def', t: 'Probabilité conditionnelle', prio: true,
      hyp: R`<u>$\Proba(B) \gt 0$</u>`,
      concl: [R`$\Proba_B(A) = \Proba(A \mid B) = \dfrac{\Proba(A \cap B)}{\Proba(B)}$`, R`$\Proba_B$ est une probabilité : $\Proba_B(\overline A) = 1 - \Proba_B(A)$`] },
    { k: 'thm', t: 'Probabilités composées',
      hyp: R`$\Proba(A_1 \cap \dots \cap A_{n-1}) \gt 0$`,
      concl: [R`$\Proba(A_1 \cap \dots \cap A_n) = \Proba(A_1)\Proba_{A_1}(A_2)\cdots\Proba_{A_1 \cap \dots \cap A_{n-1}}(A_n)$`],
      b: R`Tirages successifs : produit le long d'une branche.` },
    { k: 'thm', t: 'Probabilités totales', prio: true,
      hyp: R`$(A_1, \dots, A_n)$ <u>système complet</u>, $\Proba(A_i) \gt 0$`,
      concl: [R`$\Proba(B) = \displaystyle\sum_{i} \Proba(A_i)\,\Proba_{A_i}(B)$`, R`$\Proba(B) = \Proba(A)\Proba_A(B) + \Proba(\overline A)\Proba_{\overline A}(B)$`] },
    { k: 'thm', t: 'Bayes', prio: true,
      concl: [R`$\Proba_B(A) = \dfrac{\Proba(A)\,\Proba_A(B)}{\Proba(B)}$`, R`$\Proba_B(A_j) = \dfrac{\Proba(A_j)\Proba_{A_j}(B)}{\sum_i \Proba(A_i)\Proba_{A_i}(B)}$`],
      b: R`« Cause sachant effet » : branche / somme des branches.` },
    { k: 'def', t: 'Indépendance', prio: true,
      concl: [R`$A$, $B$ indépendants $\iff$ <u>$\Proba(A \cap B) = \Proba(A)\Proba(B)$</u>`, R`$\iff \Proba_B(A) = \Proba(A)$ si $\Proba(B) \gt 0$`, R`alors $(A, \overline B)$, $(\overline A, B)$, $(\overline A, \overline B)$ aussi`] },
    { k: 'def', t: 'Indépendance mutuelle',
      concl: [R`$\Proba(\bigcap_{i \in I} A_i) = \prod_{i \in I}\Proba(A_i)$ <u>pour toute</u> sous-famille $I$`, R`mutuelle $\Rightarrow$ deux à deux ; <u>réciproque fausse</u>`] },
    { k: 'meth', t: '« Au moins un » (indépendants)',
      concl: [R`$\Proba(A_1 \cup \dots \cup A_n) = 1 - \prod (1 - \Proba(A_i))$`] },
    { k: 'warn', t: 'Pièges',
      concl: [R`Incompatibles $\neq$ indépendants`, R`$\Proba_{\overline B}(A) \neq 1 - \Proba_B(A)$ ; $\Proba_B(A) \neq \Proba_A(B)$`, R`Sommes de deux dés : <u>pas</u> équiprobables`] }

  ];
  /* ------------------------------------------------------------------ */
  /* Exercices                                                           */
  /* ------------------------------------------------------------------ */
  const exercices = [
    {
      id: 'anagrammes', title: 'Anagrammes', diff: 1, gen: 'anagrammes',
      enonce: R`<p>Combien d'anagrammes du mot <strong>ANAGRAMME</strong> ? Combien dans lesquelles les trois A sont consécutifs ?</p>`,
      correction: R`<p>ANAGRAMME : 9 lettres, A (3), M (2), N, G, R, E (1). Nombre d'anagrammes : $\dfrac{9!}{3!\,2!} = \dfrac{362\,880}{12} = 30\,240$.</p>
        <p>Trois A consécutifs : on colle « AAA » en un seul bloc ; on permute alors 7 objets (le bloc, M, M, N, G, R, E) dont deux M identiques : $\dfrac{7!}{2!} = 2\,520$.</p>`
    },
    {
      id: 'urne', title: 'Tirages dans une urne', diff: 2, gen: 'urne',
      enonce: R`<p>Une urne contient 5 boules rouges et 4 boules noires. On tire simultanément 3 boules. Combien de tirages contiennent : a) exactement 2 rouges ? b) au moins une rouge ? c) des boules des deux couleurs ?</p>`,
      correction: R`<p>Total : $\binom93 = 84$.</p><ul>
        <li>a) $\binom52\binom41 = 10 \times 4 = 40$.</li>
        <li>b) Complémentaire de « 3 noires » : $84 - \binom43 = 84 - 4 = 80$.</li>
        <li>c) On retire « 3 rouges » et « 3 noires » : $84 - \binom53 - \binom43 = 84 - 10 - 4 = 70$.</li></ul>`
    },
    {
      id: 'poker', title: 'Mains de poker', diff: 2,
      enonce: R`<p>On tire 5 cartes d'un jeu de 52 (13 hauteurs, 4 couleurs). Dénombrer : a) les mains contenant exactement une paire ; b) exactement deux paires ; c) une couleur (5 cartes de la même couleur).</p>`,
      indication: R`<p>Choisir d'abord les <em>hauteurs</em> (en distinguant leurs rôles), puis les <em>couleurs</em> des cartes.</p>`,
      correction: R`<ul>
        <li>a) Hauteur de la paire : $13$ ; ses couleurs : $\binom42 = 6$ ; les 3 autres hauteurs, distinctes entre elles et de la paire : $\binom{12}{3} = 220$ ; une couleur pour chacune : $4^3$. Total : $13 \times 6 \times 220 \times 64 = 1\,098\,240$.</li>
        <li>b) Les deux hauteurs des paires (rôles symétriques, <strong>non ordonnées</strong>) : $\binom{13}{2} = 78$ ; leurs couleurs : $\binom42^2 = 36$ ; la 5<sup>e</sup> carte : $11 \times 4 = 44$. Total : $78 \times 36 \times 44 = 123\,552$.</li>
        <li>c) Couleur : $4$ ; 5 hauteurs parmi 13 : $\binom{13}5 = 1\,287$. Total : $5\,148$ (quintes flush incluses).</li></ul>
        <p>Piège en b) : écrire $13 \times 12$ pour les hauteurs compte chaque main deux fois.</p>`,
      similaires: [
        {
          title: 'Brelans et carrés',
          enonce: R`<p>Toujours avec 5 cartes parmi 52, dénombrer les mains contenant un carré (4 cartes de même hauteur), puis celles contenant exactement un brelan (3 cartes de même hauteur, les 2 autres de hauteurs différentes entre elles et du brelan).</p>`,
          correction: R`<p>Carré : hauteur ($13$), la 5<sup>e</sup> carte ($48$) : $624$.</p><p>Brelan : hauteur ($13$), couleurs ($\binom43 = 4$), deux autres hauteurs distinctes ($\binom{12}2 = 66$), leurs couleurs ($4^2$) : $13 \times 4 \times 66 \times 16 = 54\,912$.</p>`
        }
      ]
    },
    {
      id: 'identites', title: 'Identités combinatoires', diff: 2,
      enonce: R`<p>Montrer de deux façons (calcul, puis dénombrement) que $\displaystyle\sum_{k=0}^n k\binom nk = n\,2^{n-1}$.</p>`,
      correction: R`<p><strong>Par le calcul</strong> : $k\binom nk = n\binom{n-1}{k-1}$ (formule du pion), donc $\sum_{k=1}^n k\binom nk = n\sum_{k=1}^n\binom{n-1}{k-1} = n\sum_{j=0}^{n-1}\binom{n-1}j = n2^{n-1}$. (Ou dériver $(1+x)^n = \sum\binom nk x^k$ et prendre $x = 1$.)</p>
        <p><strong>Par dénombrement</strong> : on compte les couples (comité $A \subset E$, président $x \in A$) avec $|E| = n$. En choisissant d'abord le comité de taille $k$ puis son président : $\sum_k k\binom nk$. En choisissant d'abord le président ($n$ choix) puis le reste du comité, partie quelconque des $n - 1$ autres ($2^{n-1}$) : $n2^{n-1}$.</p>`,
      similaires: [
        {
          title: 'Somme des carrés des binomiaux',
          enonce: R`<p>Montrer que $\sum_{k=0}^n\binom nk^2 = \binom{2n}{n}$.</p>`,
          correction: R`<p>Par symétrie $\binom nk^2 = \binom nk\binom n{n-k}$, et par Vandermonde avec $a = b = n$ : $\sum_k\binom nk\binom n{n-k} = \binom{2n}n$.</p>`
        },
        {
          title: 'Somme sur une diagonale',
          enonce: R`<p>Montrer que $\sum_{k=p}^n\binom kp = \binom{n+1}{p+1}$ (formule « de la crosse de hockey »).</p>`,
          correction: R`<p>Récurrence sur $n$ avec Pascal : $\binom{n+1}{p+1} + \binom{n+1}{p} = \binom{n+2}{p+1}$. Ou par dénombrement : les parties à $p+1$ éléments de $\{1, \dots, n+1\}$ dont le plus grand élément est $k + 1$ sont au nombre de $\binom kp$ ; on somme sur $k$ de $p$ à $n$.</p>`
        }
      ]
    },
    {
      id: 'crible', title: 'Formule du crible', diff: 2,
      enonce: R`<p>Combien d'entiers de $\{1, \dots, 1000\}$ ne sont divisibles ni par 2, ni par 3, ni par 5 ?</p>`,
      indication: R`<p>Le nombre de multiples de $d$ dans $\{1, \dots, N\}$ est $\lfloor N/d\rfloor$, et « divisible par 2 et par 3 » équivaut à « divisible par 6 ».</p>`,
      correction: R`<p>Soient $A_2, A_3, A_5$ les ensembles de multiples. $|A_2| = 500$, $|A_3| = 333$, $|A_5| = 200$, $|A_2 \cap A_3| = |A_6| = 166$, $|A_{10}| = 100$, $|A_{15}| = 66$, $|A_{30}| = 33$.</p>
        $$|A_2 \cup A_3 \cup A_5| = 1033 - 332 + 33 = 734.$$
        <p>Réponse : $1000 - 734 = 266$.</p>`,
      similaires: [
        {
          title: 'Dérangements',
          diff: 3,
          enonce: R`<p>Un <em>dérangement</em> de $\{1, \dots, n\}$ est une permutation sans point fixe. À l'aide du crible appliqué aux ensembles $A_i = \{\sigma : \sigma(i) = i\}$, montrer que le nombre de dérangements est $D_n = \sum_{k=0}^n(-1)^k\frac{n!}{k!}$, puis calculer $D_4$.</p>`,
          correction: R`<p>$|A_{i_1} \cap \dots \cap A_{i_k}| = (n - k)!$ (les $k$ points sont fixés, on permute les autres). Par le crible, $|\bigcup A_i| = \sum_{k=1}^n(-1)^{k+1}\binom nk(n-k)! = \sum_{k=1}^n(-1)^{k+1}\frac{n!}{k!}$. Donc $D_n = n! - |\bigcup A_i| = \sum_{k=0}^n(-1)^k\frac{n!}{k!}$.</p>
            <p>$D_4 = 24 - 24 + 12 - 4 + 1 = 9$.</p>`
        }
      ]
    },
    {
      id: 'chemins', title: 'Chemins dans un quadrillage', diff: 1,
      enonce: R`<p>Combien de chemins vont de $(0,0)$ à $(5,3)$ en faisant des pas unitaires vers la droite ou vers le haut ? Combien passent par le point $(2,1)$ ?</p>`,
      correction: R`<p>Un chemin est un mot de 8 pas dont 5 « droite » et 3 « haut » : il est déterminé par les positions des 3 pas « haut » : $\binom83 = 56$.</p>
        <p>Par $(2,1)$ : chemins de $(0,0)$ à $(2,1)$ ($\binom31 = 3$), puis de $(2,1)$ à $(5,3)$ (3 droite, 2 haut : $\binom52 = 10$). Total : $30$.</p>`
    },
    {
      id: 'surjections', title: 'Surjections', diff: 3,
      enonce: R`<p>Combien y a-t-il de surjections de $\{1, \dots, n+1\}$ sur $\{1, \dots, n\}$ ?</p>`,
      indication: R`<p>Exactement un élément de l'ensemble d'arrivée a deux antécédents.</p>`,
      correction: R`<p>Une telle surjection a exactement un élément $y$ de l'arrivée possédant deux antécédents, les autres en ayant un seul. On choisit la paire d'antécédents $\{a, b\}$ ($\binom{n+1}2$ façons) ; on obtient alors $n$ « blocs » ($\{a, b\}$ et les $n - 1$ singletons) à envoyer bijectivement sur les $n$ éléments de l'arrivée : $n!$ façons. Total : $\binom{n+1}{2}\,n! = \dfrac{n(n+1)!}{2}$.</p>`
    },
    {
      id: 'etoiles', title: 'Répartitions', diff: 2, gen: 'equation',
      enonce: R`<p>De combien de façons peut-on répartir 10 bonbons identiques entre 4 enfants ? Et si chaque enfant doit en recevoir au moins un ?</p>`,
      correction: R`<p>Solutions de $x_1 + x_2 + x_3 + x_4 = 10$ dans $\N$ : $\binom{13}{3} = 286$. Avec $x_i \ge 1$ : $\binom93 = 84$.</p>`
    },

    /* ---------- Partie 2 : espaces probabilisés ---------- */
    {
      id: 'deux-des', title: 'Deux dés', diff: 1, gen: 'des',
      enonce: R`<p>On lance deux dés équilibrés. Calculer la probabilité des événements : a) « la somme vaut 7 » ; b) « la somme vaut 8 » ; c) « au moins un des dés donne 6 » ; d) « la somme est paire ».</p>`,
      indication: R`<p>Les 11 sommes possibles ne sont pas équiprobables : travailler avec les 36 couples.</p>`,
      correction: R`<p>On rend les dés discernables : $\Omega = \{1, \dots, 6\}^2$, 36 issues équiprobables.</p><ul>
        <li>a) $\{(1,6), (2,5), (3,4), (4,3), (5,2), (6,1)\}$ : $\frac{6}{36} = \frac16$.</li>
        <li>b) $\{(2,6), (3,5), (4,4), (5,3), (6,2)\}$ : $\frac{5}{36}$.</li>
        <li>c) Contraire : « aucun 6 », $5^2 = 25$ couples. $\Proba = 1 - \frac{25}{36} = \frac{11}{36}$.</li>
        <li>d) La somme est paire si les deux dés ont la même parité : $3 \times 3 + 3 \times 3 = 18$ couples, $\Proba = \frac12$.</li></ul>`
    },
    {
      id: 'urne-proba', title: 'Probabilités dans une urne', diff: 1, gen: 'probaUrne',
      enonce: R`<p>Une urne contient 6 boules rouges et 4 boules blanches. On tire 3 boules.</p>
        <ol><li>Tirage simultané : probabilité d'obtenir exactement 2 rouges ? au moins une blanche ?</li><li>Tirages successifs sans remise : retrouver la probabilité d'obtenir exactement 2 rouges avec la formule des probabilités composées.</li></ol>`,
      correction: R`<ol><li>$\Omega$ = parties à 3 boules, $\Card\Omega = \binom{10}{3} = 120$, équiprobabilité. Exactement 2 rouges : $\frac{\binom62\binom41}{120} = \frac{60}{120} = \frac12$. Au moins une blanche : $1 - \frac{\binom63}{120} = 1 - \frac{20}{120} = \frac56$.</li>
        <li>« Exactement 2 rouges » est la réunion des trois événements incompatibles $RR\overline R$, $R\overline RR$, $\overline RRR$ (position de la blanche). Par les probabilités composées : $\Proba(R_1 \cap R_2 \cap \overline{R_3}) = \frac6{10} \cdot \frac59 \cdot \frac48 = \frac16$, et de même pour les deux autres (mêmes facteurs dans un autre ordre). Total : $3 \times \frac16 = \frac12$.</li></ol>`
    },
    {
      id: 'anniversaires', title: 'Paradoxe des anniversaires', diff: 2,
      enonce: R`<p>Dans un groupe de $n$ personnes, on suppose les dates d'anniversaire indépendantes et uniformément réparties sur 365 jours.</p>
        <ol><li>Exprimer la probabilité $p_n$ qu'au moins deux personnes aient le même anniversaire.</li><li>Montrer que $1 - p_n \le \exp\!\left(-\frac{n(n-1)}{730}\right)$ et en déduire que $p_{23} \gt \frac12$.</li></ol>`,
      indication: R`<p>Utiliser $1 - x \le e^{-x}$ et $\sum_{k=0}^{n-1} k = \frac{n(n-1)}2$.</p>`,
      correction: R`<ol><li>$\Omega = \{1, \dots, 365\}^n$, équiprobable, $\Card\Omega = 365^n$. Le contraire « dates toutes distinctes » contient $A_{365}^n$ issues : $p_n = 1 - \dfrac{365 \times 364 \times \dots \times (365 - n + 1)}{365^n} = 1 - \prod_{k=0}^{n-1}\left(1 - \frac{k}{365}\right)$.</li>
        <li>Avec $1 - x \le e^{-x}$ : $1 - p_n \le \prod_k e^{-k/365} = e^{-\sum_k k/365} = e^{-n(n-1)/730}$. Pour $n = 23$ : $\frac{23 \times 22}{730} = \frac{506}{730} \approx 0{,}693\,15 \gt \ln 2 \approx 0{,}693\,14$ (de justesse !), donc $1 - p_{23} \le e^{-0{,}6932} \lt \frac12$, soit $p_{23} \gt \frac12$ (valeur exacte $p_{23} \approx 0{,}507$).</li></ol>`
    },
    {
      id: 'crible-proba', title: 'Union, intersection, contraire', diff: 1, gen: 'independance',
      enonce: R`<p>On donne $\Proba(A) = 0{,}5$, $\Proba(B) = 0{,}4$ et $\Proba(A \cup B) = 0{,}7$. Calculer $\Proba(A \cap B)$, $\Proba(\overline A \cap \overline B)$, $\Proba(A \cap \overline B)$ et la probabilité qu'un seul des deux événements soit réalisé. $A$ et $B$ sont-ils indépendants ? incompatibles ?</p>`,
      correction: R`<ul><li>$\Proba(A \cap B) = 0{,}5 + 0{,}4 - 0{,}7 = 0{,}2$.</li>
        <li>$\Proba(\overline A \cap \overline B) = \Proba(\overline{A \cup B}) = 1 - 0{,}7 = 0{,}3$ (loi de De Morgan).</li>
        <li>$\Proba(A \cap \overline B) = \Proba(A) - \Proba(A \cap B) = 0{,}3$.</li>
        <li>Un seul : $\Proba(A \cup B) - \Proba(A \cap B) = 0{,}5$.</li>
        <li>$\Proba(A)\Proba(B) = 0{,}2 = \Proba(A \cap B)$ : <strong>indépendants</strong>. Pas incompatibles puisque $\Proba(A \cap B) \neq 0$.</li></ul>`
    },
    {
      id: 'de-truque', title: 'Dé truqué', diff: 1,
      enonce: R`<p>Un dé est truqué de sorte que la probabilité d'obtenir la face $k$ soit proportionnelle à $k$. Déterminer cette probabilité, puis la probabilité d'obtenir un résultat pair, et celle d'obtenir au moins 5.</p>`,
      correction: R`<p>On cherche $p_k = ck$ avec $p_k \ge 0$ et $\sum_{k=1}^6 p_k = 21c = 1$ : $c = \frac1{21}$. Cela définit bien une probabilité (théorème sur les univers finis).</p>
        <p>$\Proba(\text{pair}) = \frac{2 + 4 + 6}{21} = \frac{12}{21} = \frac47$ et $\Proba(\ge 5) = \frac{5 + 6}{21} = \frac{11}{21}$. Attention : l'univers n'est pas équiprobable, on ne peut pas faire « favorables / possibles ».</p>`
    },

    /* ---------- Partie 3 : conditionnement et indépendance ---------- */
    {
      id: 'deux-enfants', title: 'Famille de deux enfants', diff: 2,
      enonce: R`<p>Une famille a deux enfants ; on suppose que chaque enfant est une fille ou un garçon avec probabilité $\frac12$, indépendamment. Quelle est la probabilité que les deux enfants soient des filles : a) sachant que l'aînée est une fille ? b) sachant qu'au moins un des enfants est une fille ?</p>`,
      correction: R`<p>$\Omega = \{FF, FG, GF, GG\}$ (aîné en premier), équiprobable. Soit $D = \{FF\}$.</p>
        <ul><li>a) $A$ : « l'aînée est une fille » $= \{FF, FG\}$. $\Proba_A(D) = \frac{\Card(D \cap A)}{\Card A} = \frac12$.</li>
        <li>b) $B$ : « au moins une fille » $= \{FF, FG, GF\}$. $\Proba_B(D) = \frac13$.</li></ul>
        <p>Les deux réponses diffèrent car l'information n'est pas la même : en b), on ne sait pas <em>quel</em> enfant est une fille.</p>`
    },
    {
      id: 'cles', title: 'Essayer des clés', diff: 2, gen: 'probaUrne',
      enonce: R`<p>Un gardien a un trousseau de $n$ clés dont une seule ouvre la porte. Il les essaie au hasard, l'une après l'autre.</p>
        <ol><li>Il met de côté les clés déjà essayées. Quelle est la probabilité que la porte s'ouvre au $k$-ième essai ($1 \le k \le n$) ?</li><li>Il remet chaque clé dans le trousseau après l'avoir essayée. Même question ($k \ge 1$).</li></ol>`,
      correction: R`<p>Notons $E_i$ : « le $i$-ème essai échoue ». L'ouverture au $k$-ième essai est $E_1 \cap \dots \cap E_{k-1} \cap \overline{E_k}$.</p>
        <ol><li>Sans remise, par les probabilités composées : $\frac{n-1}{n} \times \frac{n-2}{n-1} \times \dots \times \frac{n-k+1}{n-k+2} \times \frac{1}{n-k+1} = \frac1n$ (produit télescopique). Chaque rang est également probable.</li>
        <li>Avec remise, les essais sont indépendants : $\left(1 - \frac1n\right)^{k-1}\frac1n$. (On retrouvera cette loi au chapitre suivant : loi géométrique.)</li></ol>`
    },
    {
      id: 'depistage', title: 'Test de dépistage', diff: 2, gen: 'bayes',
      enonce: R`<p>Une maladie touche $1\,\%$ de la population. Un test est positif chez $99\,\%$ des malades et chez $2\,\%$ des personnes saines. Une personne prise au hasard a un test positif ; quelle est la probabilité qu'elle soit malade ? Même question si le test est négatif.</p>`,
      correction: R`<p>$M$ : « malade », $T$ : « test positif ». $\Proba(M) = 0{,}01$, $\Proba_M(T) = 0{,}99$, $\Proba_{\overline M}(T) = 0{,}02$.</p>
        <p>Probabilités totales : $\Proba(T) = 0{,}01 \times 0{,}99 + 0{,}99 \times 0{,}02 = 0{,}0297$. Bayes : $\Proba_T(M) = \frac{0{,}0099}{0{,}0297} = \frac13$.</p>
        <p>Test négatif : $\Proba(\overline T) = 0{,}9703$ et $\Proba_{\overline T}(M) = \frac{\Proba(M)\Proba_M(\overline T)}{\Proba(\overline T)} = \frac{0{,}01 \times 0{,}01}{0{,}9703} \approx 0{,}0001$. Le test est très fiable pour <em>exclure</em> la maladie, beaucoup moins pour la confirmer.</p>`
    },
    {
      id: 'urnes-de', title: 'Urne choisie par un dé', diff: 2, gen: 'totales',
      enonce: R`<p>L'urne $U_1$ contient 2 boules rouges et 3 blanches, l'urne $U_2$ contient 4 rouges et 1 blanche. On lance un dé équilibré : s'il donne 6, on tire une boule dans $U_1$, sinon dans $U_2$. Probabilité de tirer une boule rouge ? La boule est rouge : probabilité qu'elle vienne de $U_1$ ?</p>`,
      correction: R`<p>$(U_1, U_2)$ système complet, $\Proba(U_1) = \frac16$, $\Proba(U_2) = \frac56$.</p>
        <p>$\Proba(R) = \frac16 \times \frac25 + \frac56 \times \frac45 = \frac{2}{30} + \frac{20}{30} = \frac{11}{15}$. Bayes : $\Proba_R(U_1) = \frac{2/30}{22/30} = \frac{1}{11}$.</p>`
    },
    {
      id: 'deux-a-deux', title: 'Deux à deux, mais pas mutuellement', diff: 2,
      enonce: R`<p>On lance deux pièces équilibrées. $A$ : « la première donne pile », $B$ : « la seconde donne pile », $C$ : « les deux pièces donnent le même résultat ». Montrer que $A$, $B$, $C$ sont deux à deux indépendants mais pas mutuellement indépendants. Calculer $\Proba_{A \cap B}(C)$ et interpréter.</p>`,
      correction: R`<p>$\Omega = \{PP, PF, FP, FF\}$ équiprobable. $A = \{PP, PF\}$, $B = \{PP, FP\}$, $C = \{PP, FF\}$ : probabilités $\frac12$.</p>
        <p>$A \cap B = A \cap C = B \cap C = \{PP\}$, de probabilité $\frac14 = \frac12 \cdot \frac12$ : deux à deux indépendants. Mais $\Proba(A \cap B \cap C) = \frac14 \neq \frac18$.</p>
        <p>$\Proba_{A \cap B}(C) = 1$ : connaître $A$ et $B$ <em>ensemble</em> détermine $C$, alors que chacun seul n'apporte aucune information sur $C$.</p>`
    },
    {
      id: 'fiabilite', title: 'Fiabilité d’un circuit', diff: 2, gen: 'independance',
      enonce: R`<p>Un système est formé de deux composants $A$ et $B$ montés en série, ce bloc étant monté en parallèle avec un composant $C$. Les composants fonctionnent indépendamment, avec les probabilités $0{,}9$, $0{,}8$ et $0{,}7$.</p>
        <ol><li>Quelle est la probabilité que le système fonctionne ?</li><li>Le système fonctionne : quelle est la probabilité que $C$ fonctionne ?</li></ol>`,
      indication: R`<p>Série : il faut les deux ; parallèle : il suffit d'un des deux. Le système fonctionne si $(A \cap B) \cup C$ est réalisé.</p>`,
      correction: R`<ol><li>$S = (A \cap B) \cup C$. $\Proba(S) = \Proba(A \cap B) + \Proba(C) - \Proba(A \cap B \cap C) = 0{,}72 + 0{,}7 - 0{,}504 = 0{,}916$ (indépendance mutuelle). Autre méthode : $\Proba(\overline S) = \Proba(\overline{A \cap B})\Proba(\overline C) = 0{,}28 \times 0{,}3 = 0{,}084$.</li>
        <li>$C \subset S$ donc $\Proba_S(C) = \frac{\Proba(C)}{\Proba(S)} = \frac{0{,}7}{0{,}916} \approx 0{,}764$.</li></ol>`
    },
    {
      id: 'de-mere', title: 'Le problème du chevalier de Méré', diff: 2, gen: 'auMoinsUn',
      enonce: R`<p>Est-il plus probable d'obtenir au moins un 6 en lançant 4 fois un dé, ou au moins un double six en lançant 24 fois deux dés ?</p>`,
      correction: R`<p>Les lancers sont indépendants. Au moins un 6 en 4 lancers : $1 - \left(\frac56\right)^4 = 1 - \frac{625}{1296} = \frac{671}{1296} \approx 0{,}518$.</p>
        <p>Au moins un double six en 24 lancers (probabilité $\frac1{36}$ à chaque fois) : $1 - \left(\frac{35}{36}\right)^{24} \approx 0{,}491$.</p>
        <p>Le premier pari est donc (légèrement) favorable, le second défavorable, bien que $\frac4 6 = \frac{24}{36}$ : le raisonnement « proportionnel » est faux.</p>`
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiches méthodes                                                     */
  /* ------------------------------------------------------------------ */
  const methodes = [
    {
      title: 'Identifier le bon modèle de tirage', gen: 'urne',
      cas: R`« Combien de… » : des objets choisis parmi d'autres`, debut: R`Décrire <b>un</b> résultat, puis se demander : <b>l'ordre compte-t-il ?</b> <b>Répétitions possibles ?</b>`,
      quand: R`<p>Toute question « combien de… » portant sur des choix d'objets.</p>`,
      etapes: [
        R`Décrire précisément <strong>un résultat</strong> (un objet compté) : une liste ? une partie ? une application ?`,
        R`Se demander : l'<strong>ordre</strong> compte-t-il ? Les <strong>répétitions</strong> sont-elles possibles ?`,
        R`Appliquer la formule du tableau : $n^p$, $A_n^p$, $\binom np$, $\binom{n+p-1}p$.`,
        R`Vérifier sur un petit cas (énumération à la main).`
      ],
      exemple: {
        enonce: R`<p>Un code de cadenas a 4 chiffres. Combien de codes ? Combien avec 4 chiffres distincts ? Combien avec des chiffres strictement croissants ?</p>`,
        solution: R`<p>Ordre et répétitions : $10^4$. Ordre sans répétition : $A_{10}^4 = 5\,040$. Strictement croissants : un tel code est déterminé par l'<em>ensemble</em> de ses chiffres (on les range dans l'ordre) : $\binom{10}4 = 210$.</p>`
      },
      pieges: [R`Les « chiffres croissants » transforment une liste en partie : penser bijection plutôt que formule.`]
    },
    {
      title: 'Dénombrer « au moins un »', gen: 'comite',
      cas: R`« Au moins un », « pas tous », « au moins deux couleurs »`, debut: R`Passer au <b>complémentaire</b> : compter « aucun », puis soustraire au total.`,
      quand: R`<p>La question contient « au moins un », « au moins deux couleurs », « pas tous »…</p>`,
      etapes: [
        R`Écrire l'événement contraire (« aucun », « tous de la même couleur »…).`,
        R`Compter le contraire, qui est en général un modèle simple.`,
        R`Soustraire au total.`
      ],
      exemple: {
        enonce: R`<p>Combien de mains de 5 cartes (parmi 52) contiennent au moins un as ?</p>`,
        solution: R`<p>Contraire : aucun as, soit 5 cartes parmi les 48 autres. Réponse : $\binom{52}5 - \binom{48}5 = 2\,598\,960 - 1\,712\,304 = 886\,656$.</p>`
      },
      pieges: [R`Le calcul « je choisis un as ($4$), puis 4 cartes quelconques ($\binom{51}4$) » compte plusieurs fois les mains à plusieurs as : $4\binom{51}{4} = 999\,600 \neq 886\,656$.`]
    },
    {
      title: 'Compter par étapes sans doublon', gen: 'anagrammes',
      cas: R`Objet construit par choix successifs (hauteurs puis couleurs…)`, debut: R`Écrire une procédure qui fabrique <b>chaque objet une seule fois</b>, puis multiplier les nombres de choix.`,
      quand: R`<p>L'objet se construit par choix successifs (hauteurs puis couleurs, positions puis lettres…).</p>`,
      etapes: [
        R`Décrire une procédure de construction <strong>qui produit chaque objet exactement une fois</strong>.`,
        R`Multiplier les nombres de choix à chaque étape (ils ne doivent pas dépendre des choix précédents).`,
        R`Si la procédure produit chaque objet exactement $k$ fois (rôles symétriques), diviser par $k$.`
      ],
      exemple: {
        enonce: R`<p>De combien de façons peut-on répartir 6 personnes en 3 binômes (non numérotés) ?</p>`,
        solution: R`<p>Si les binômes étaient numérotés : $\binom62\binom42\binom22 = 15 \times 6 \times 1 = 90$. Chaque répartition est obtenue $3! = 6$ fois (ordre des binômes). Réponse : $90/6 = 15$.</p>`
      }
    },
    {
      title: 'Démontrer une identité combinatoire',
      cas: R`Égalité entre sommes de $\binom nk$`, debut: R`<b>Binôme de Newton</b> ou formule du pion ; sinon <b>double comptage</b> d'un même ensemble.`,
      quand: R`<p>On demande de prouver une égalité entre sommes de coefficients binomiaux.</p>`,
      etapes: [
        R`<strong>Voie algébrique</strong> : formule du pion, Pascal, binôme de Newton (éventuellement dérivé), changement d'indice.`,
        R`<strong>Double comptage</strong> : trouver un ensemble que chaque membre dénombre de façon différente (comités, chemins, parties).`,
        R`<strong>Récurrence</strong> avec la formule de Pascal.`
      ],
      exemple: {
        enonce: R`<p>Montrer $\sum_{k=0}^n\binom nk 2^k = 3^n$.</p>`,
        solution: R`<p>Binôme : $(1 + 2)^n = \sum\binom nk 2^k1^{n-k}$. Dénombrement : les applications $\{1..n\} \to \{a, b, c\}$ sont $3^n$ ; en classant selon le nombre $k$ d'éléments envoyés dans $\{a, b\}$ (choix de ces éléments : $\binom nk$, puis $a$ ou $b$ pour chacun : $2^k$) on trouve la somme.</p>`
      }
    },
    {
      title: 'Utiliser la formule du crible',
      cas: R`« Divisible par 2 <i>ou</i> 3 <i>ou</i> 5 », « aucun point fixe »`, debut: R`Nommer les ensembles $A_i$ et <b>compter leurs intersections</b>.`,
      quand: R`<p>On compte des éléments vérifiant <em>au moins une</em> de plusieurs propriétés (ou <em>aucune</em>), et les intersections sont faciles à compter.</p>`,
      etapes: [
        R`Nommer les ensembles $A_1, \dots, A_n$ (« l'élément vérifie la propriété $i$ »).`,
        R`Calculer les cardinaux des intersections (souvent ils ne dépendent que du nombre d'ensembles intersectés).`,
        R`Appliquer la formule avec les signes alternés ; pour « aucune propriété », prendre le complémentaire.`
      ],
      exemple: {
        enonce: R`<p>Combien d'entiers de 1 à 100 sont divisibles par 2 ou par 7 ?</p>`,
        solution: R`<p>$|A_2| + |A_7| - |A_{14}| = 50 + 14 - 7 = 57$.</p>`
      }
    },

    {
      title: 'Modéliser une expérience : choisir l’univers', gen: 'des',
      cas: R`« On lance… », « on tire… », « au hasard »`, debut: R`Écrire $\Omega$ avec des issues <b>équiprobables</b> (objets rendus discernables), puis $\Proba(A) = \frac{\Card A}{\Card\Omega}$.`,
      quand: R`<p>Calculer une probabilité dans une situation « symétrique » (dés, pièces, cartes, urnes).</p>`,
      etapes: [
        R`Décrire une issue : un couple, une liste, une partie… en <strong>numérotant</strong> les objets identiques.`,
        R`Justifier l'<strong>équiprobabilité</strong> (dés équilibrés, boules indiscernables au toucher, choix au hasard).`,
        R`Traduire l'événement en sous-ensemble de $\Omega$ et le <strong>dénombrer</strong> (ou son contraire).`,
        R`Conclure : $\Proba(A) = \dfrac{\Card A}{\Card\Omega}$.`
      ],
      exemple: {
        enonce: R`<p>On lance trois pièces équilibrées. Probabilité d'obtenir exactement deux piles ?</p>`,
        solution: R`<p>$\Omega = \{P, F\}^3$, 8 issues équiprobables. Exactement deux piles : choisir les 2 pièces qui font pile, $\binom32 = 3$. $\Proba = \frac38$ (et non $\frac14$ en considérant « 0, 1, 2 ou 3 piles », qui ne sont pas équiprobables).</p>`
      },
      pieges: [R`Prendre comme issues des résultats non équiprobables (somme de deux dés, nombre de piles).`]
    },
    {
      title: 'Succession d’épreuves : probabilités composées', gen: 'probaUrne',
      cas: R`Tirages successifs <b>sans remise</b>, épreuves enchaînées`, debut: R`Nommer $A_i$ (événement à la $i$-ème étape) et écrire $\Proba(A_1)\Proba_{A_1}(A_2)\Proba_{A_1 \cap A_2}(A_3)\cdots$`,
      quand: R`<p>L'expérience se déroule en étapes et chaque étape dépend des précédentes.</p>`,
      etapes: [
        R`Introduire les événements $A_i$ relatifs à chaque étape.`,
        R`Écrire l'événement cherché comme une <strong>intersection</strong> $A_1 \cap \dots \cap A_n$ (ou une réunion disjointe de telles intersections).`,
        R`Calculer chaque probabilité conditionnelle en <strong>regardant l'état</strong> du système après les étapes précédentes.`,
        R`Multiplier (et additionner les cas disjoints).`
      ],
      exemple: {
        enonce: R`<p>Une urne contient 3 rouges et 2 noires ; on tire sans remise jusqu'à obtenir une noire. Probabilité qu'il faille exactement 3 tirages ?</p>`,
        solution: R`<p>$\Proba(R_1 \cap R_2 \cap N_3) = \frac35 \times \frac24 \times \frac23 = \frac15$.</p>`
      },
      pieges: [R`Multiplier des probabilités non conditionnelles ($\frac35 \times \frac35 \times \frac25$) : c'est le calcul <em>avec</em> remise.`]
    },
    {
      title: 'Formule des probabilités totales', gen: 'totales',
      cas: R`L'expérience a <b>deux étapes</b> : la 1<sup>re</sup> influence la 2<sup>e</sup>`, debut: R`Prendre comme <b>système complet</b> les résultats de la 1<sup>re</sup> étape et faire un <b>arbre pondéré</b>.`,
      quand: R`<p>On connaît les probabilités de $B$ <em>dans chaque cas</em> (sachant $A_1$, sachant $A_2$…) et l'on cherche $\Proba(B)$.</p>`,
      etapes: [
        R`Identifier le système complet $(A_1, \dots, A_n)$ (souvent $(A, \overline A)$) et vérifier que c'en est un.`,
        R`Lire dans l'énoncé les $\Proba(A_i)$ et les $\Proba_{A_i}(B)$ ; les placer sur l'arbre.`,
        R`$\Proba(B) = \sum_i \Proba(A_i)\Proba_{A_i}(B)$ : somme des chemins menant à $B$.`
      ],
      exemple: {
        enonce: R`<p>$60\,\%$ des pièces viennent de l'usine $A$ (défaut : $2\,\%$), le reste de l'usine $B$ (défaut : $5\,\%$). Probabilité qu'une pièce soit défectueuse ?</p>`,
        solution: R`<p>$\Proba(D) = 0{,}6 \times 0{,}02 + 0{,}4 \times 0{,}05 = 0{,}012 + 0{,}02 = 0{,}032$.</p>`
      },
      pieges: [R`Oublier une branche, ou utiliser une famille qui n'est pas un système complet.`]
    },
    {
      title: 'Inverser un conditionnement : Bayes', gen: 'bayes',
      cas: R`On connaît $\Proba(\text{effet} \mid \text{cause})$, on demande $\Proba(\text{cause} \mid \text{effet})$`, debut: R`$\Proba_B(A_j) = \dfrac{\text{chemin } A_j \to B}{\text{somme des chemins vers } B}$ : <b>totales au dénominateur</b>.`,
      quand: R`<p>Question du type « sachant que le test est positif / que la boule est rouge, quelle est la probabilité que… ».</p>`,
      etapes: [
        R`Repérer l'événement observé $B$ (l'« effet ») et l'événement cherché $A_j$ (la « cause »).`,
        R`Calculer $\Proba(B)$ par les probabilités totales.`,
        R`Écrire $\Proba_B(A_j) = \dfrac{\Proba(A_j)\Proba_{A_j}(B)}{\Proba(B)}$.`,
        R`Interpréter (comparer à $\Proba(A_j)$ : l'observation a-t-elle augmenté sa probabilité ?).`
      ],
      exemple: {
        enonce: R`<p>Avec l'exemple précédent (usines $A$ et $B$), une pièce est défectueuse : probabilité qu'elle vienne de $B$ ?</p>`,
        solution: R`<p>$\Proba_D(B) = \frac{0{,}4 \times 0{,}05}{0{,}032} = \frac{0{,}02}{0{,}032} = 0{,}625$.</p>`
      },
      pieges: [R`Confondre $\Proba_B(A)$ et $\Proba_A(B)$ (« $99\,\%$ des malades sont positifs » ne veut pas dire « $99\,\%$ des positifs sont malades »).`]
    },
    {
      title: 'Utiliser ou démontrer l’indépendance', gen: 'independance',
      cas: R`« Indépendamment », « avec remise », composants indépendants`, debut: R`<b>Multiplier</b> les probabilités ; pour « au moins un » : $1 - \prod(1 - p_i)$.`,
      quand: R`<p>L'énoncé affirme l'indépendance (et on l'utilise), ou demande de la vérifier.</p>`,
      etapes: [
        R`<strong>Pour démontrer</strong> : calculer séparément $\Proba(A \cap B)$ et $\Proba(A)\Proba(B)$ et comparer (ou $\Proba_B(A)$ et $\Proba(A)$).`,
        R`<strong>Pour utiliser</strong> : $\Proba(A \cap B) = \Proba(A)\Proba(B)$, valable aussi pour les contraires.`,
        R`Plus de deux événements : vérifier que l'énoncé donne l'indépendance <strong>mutuelle</strong>.`,
        R`« Au moins un » : passer au contraire, $\Proba(\bigcup A_i) = 1 - \prod(1 - \Proba(A_i))$.`
      ],
      exemple: {
        enonce: R`<p>Trois tireurs indépendants touchent la cible avec les probabilités $0{,}5$, $0{,}6$ et $0{,}8$. Probabilité que la cible soit touchée ?</p>`,
        solution: R`<p>$1 - 0{,}5 \times 0{,}4 \times 0{,}2 = 1 - 0{,}04 = 0{,}96$.</p>`
      },
      pieges: [R`Croire que des événements incompatibles sont indépendants.`, R`Additionner les probabilités des $A_i$ pour « au moins un » (on peut dépasser 1 !).`]
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche méthode, partie 1 : plan de travail ; partie 2 : cas à reconnaître */
  /* ------------------------------------------------------------------ */
  const plan = {
    etapes: [
      { titre: 'Modéliser', faire: R`Décrire <b>une issue</b> sur un exemple concret et l'univers $\Omega$ ; préciser la probabilité (équiprobabilité ? données de l'énoncé ?).`,
        questions: [R`Les issues sont-elles <b>équiprobables</b> ?`, R`L'<b>ordre</b> compte-t-il ? Des <b>répétitions</b> ?`, R`L'expérience a-t-elle <b>plusieurs étapes</b> ?`] },
      { titre: 'Traduire les événements', faire: R`<b>Nommer</b> les événements ($A$, $R_i$, $M$…) et écrire l'événement demandé avec $\cap$, $\cup$, contraire. Repérer les « <b>sachant</b> ».` },
      { titre: 'Choisir l’outil', faire: R`Dénombrement ($\frac{\Card A}{\Card\Omega}$), contraire, crible, probabilités <b>composées</b>, <b>totales</b>, <b>Bayes</b>, <b>indépendance</b>.` },
      { titre: 'Calculer', faire: R`<b>Compter</b> par une procédure qui fabrique chaque objet une seule fois, ou faire un <b>arbre pondéré</b> (produit le long d'un chemin, somme des chemins).` },
      { titre: 'Vérifier', faire: R`Une probabilité est dans $[0, 1]$ ; les branches issues d'un nœud ont pour somme 1 ; tester un <b>petit cas</b> ; interpréter le résultat.` }
    ]
  };
  const reperes = [
    { etape: 1, si: R`« On lance deux dés », « deux pièces »`, alors: R`Dés <b>discernables</b> : $\Omega = \{1, \dots, 6\}^2$, 36 issues équiprobables (les sommes ne le sont pas).` },
    { etape: 1, si: R`« Au hasard », « équilibré », « indiscernables au toucher »`, alors: R`<b>Équiprobabilité</b> : $\Proba(A) = \frac{\Card A}{\Card\Omega}$ ; il faut alors <b>dénombrer</b>.` },
    { etape: 1, si: R`Des probabilités <b>différentes</b> selon les issues (dé truqué)`, alors: R`Trouver les $p_i \ge 0$ de <b>somme 1</b>, puis $\Proba(A) = \sum_{\omega_i \in A} p_i$.` },
    { etape: 2, si: R`« Sachant que », « si l'on sait que », « parmi les… quelle proportion »`, alors: R`Probabilité <b>conditionnelle</b> $\Proba_B(A) = \frac{\Proba(A \cap B)}{\Proba(B)}$ : identifier ce qu'on <b>sait</b> ($B$).` },
    { etape: 2, si: R`« Au moins un »`, alors: R`Écrire le <b>contraire</b> : « aucun ».` },
    { etape: 2, si: R`« Exactement un » parmi $A$ et $B$`, alors: R`$(A \cap \overline B) \cup (\overline A \cap B)$, réunion <b>disjointe</b>.` },
    { etape: 2, si: R`« Ni $A$ ni $B$ »`, alors: R`$\overline A \cap \overline B = \overline{A \cup B}$ (De Morgan).` },
    { etape: 3, si: R`Tirages <b>successifs sans remise</b>, épreuves enchaînées`, alors: R`Probabilités <b>composées</b> : $\Proba(A_1)\Proba_{A_1}(A_2)\cdots$` },
    { etape: 3, si: R`La 2<sup>e</sup> étape <b>dépend du résultat</b> de la 1<sup>re</sup> (choix d'une urne, malade ou non)`, alors: R`Probabilités <b>totales</b> avec le système complet des résultats de la 1<sup>re</sup> étape.` },
    { etape: 3, si: R`On demande la probabilité de la <b>cause</b> sachant l'<b>effet</b> observé`, alors: R`<b>Bayes</b> : chemin / somme des chemins.`, ex: R`Test positif : probabilité d'être malade.` },
    { etape: 3, si: R`« Indépendamment », « avec remise », composants indépendants`, alors: R`<b>Produit</b> des probabilités ; « au moins un » : $1 - \prod(1 - p_i)$.` },
    { etape: 5, si: R`Une probabilité négative ou supérieure à 1`, alors: R`Erreur : cas comptés plusieurs fois, ou probabilités additionnées alors que les événements ne sont pas incompatibles.` },
    { etape: 5, si: R`Comparer $\Proba_B(A)$ et $\Proba(A)$`, alors: R`Égales : <b>indépendance</b> ; sinon savoir $B$ augmente ou diminue les chances de $A$.` },
    { etape: 1, si: R`« Simultanément », « une poignée », « un comité », « une main »`, alors: R`L'ordre ne compte pas : <b>parties</b>, $\binom np$.` },
    { etape: 1, si: R`« Successivement », « un mot », « un code », « un classement »`, alors: R`L'ordre compte : <b>listes</b> ($n^p$, avec remise) ou <b>arrangements</b> ($A_n^p$, sans remise).` },
    { etape: 4, si: R`Des objets <b>identiques</b> à ranger (lettres répétées)`, alors: R`<b>Coefficient multinomial</b> $\frac{n!}{n_1!\cdots n_r!}$.`, ex: R`ANANAS : $\frac{6!}{3!\,2!} = 60$.` },
    { etape: 4, si: R`Des objets identiques à répartir dans des boîtes`, alors: R`<b>Étoiles et barres</b> : $\binom{n+k-1}{k-1}$ ($x_i \ge 0$), $\binom{n-1}{k-1}$ ($x_i \ge 1$).` },
    { etape: 4, si: R`« Strictement croissant », « rangés dans l'ordre »`, alors: R`Un tel objet est déterminé par un <b>ensemble</b> : $\binom np$.` },
    { etape: 4, si: R`Des éléments qui doivent être <b>côte à côte</b>`, alors: R`Les <b>coller en un bloc</b>, permuter les blocs, puis permuter à l'intérieur du bloc.`, ex: R`Mots de ABCDE avec A et B voisins : $4! \times 2 = 48$.` },
    { etape: 4, si: R`Des éléments qui ne doivent <b>pas</b> être côte à côte`, alors: R`Placer d'abord les autres, puis insérer dans les <b>espaces</b> entre eux ; ou passer au complémentaire.` },
    { etape: 4, si: R`Plusieurs groupes de même taille <b>non numérotés</b> (binômes, équipes)`, alors: R`Compter comme s'ils étaient numérotés, puis <b>diviser par $k!$</b> (ordres possibles des $k$ groupes).` },
    { etape: 4, si: R`Des <b>rôles distincts</b> (président, trésorier…)`, alors: R`Attribuer d'abord les rôles (l'ordre compte), puis choisir le reste (parties).` },
    { etape: 3, si: R`« Au moins un », « au moins deux couleurs »`, alors: R`<b>Complémentaire</b> : total − « aucun » (ou − « une seule couleur »).` },
    { etape: 3, si: R`Un « ou » entre conditions qui se chevauchent`, alors: R`<b>Crible</b> : $|A \cup B| = |A| + |B| - |A \cap B|$.` },
    { etape: 4, si: R`« Exactement $k$ »`, alors: R`Choisir <b>lesquels</b> ($\binom nk$), puis compter le reste avec la contrainte « pas les autres ».` },
    { etape: 4, si: R`Une somme $\sum_k \binom nk \cdots$ à calculer`, alors: R`<b>Binôme de Newton</b> avec des valeurs bien choisies de $a$ et $b$, ou dériver $(1+x)^n$.` },
    { etape: 5, si: R`Un résultat non entier, ou plus grand que le nombre total de cas`, alors: R`Erreur : vérifier qu'on n'a pas <b>compté plusieurs fois</b> le même objet ou divisé à tort.` }
  ];

  L2.chapter('probas', 'denombrement', {
    intro: R`<p>Ce chapitre pose les bases du calcul des probabilités sur un univers fini. On commence par les outils de <strong>dénombrement</strong> : avec l'équiprobabilité, $\Proba(A) = \dfrac{\Card A}{\Card\Omega}$, et calculer une probabilité revient alors à compter. On définit ensuite les <strong>espaces probabilisés</strong> et les règles de calcul, puis le <strong>conditionnement</strong> (probabilités composées, probabilités totales, formule de Bayes) et l'<strong>indépendance</strong>.</p>`,
    cours, fiche, exercices, methodes, generateurs, plan, reperes
  });
})();
