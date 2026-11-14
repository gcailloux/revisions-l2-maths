/* Probabilités et statistiques 1 — Chapitre 2 : Variables aléatoires discrètes
   1. Généralités  2. Lois usuelles discrètes  3. Couples de variables aléatoires discrètes
   4. Lois conditionnelles, indépendance */
(function () {
  'use strict';
  const R = String.raw;
  const { binom, bpow, big, F, dec } = ML;

  /* ---------- Outils ---------- */
  const bgcd = (a, b) => { if (a < 0n) a = -a; if (b < 0n) b = -b; while (b) { const t = a % b; a = b; b = t; } return a; };
  function bq(n, d) {                      // fraction exacte en BigInt
    n = BigInt(n); d = BigInt(d);
    const g = bgcd(n, d) || 1n; n /= g; d /= g;
    return { v: Number(n) / Number(d), tex: d === 1n ? big(n) : R`\frac{${big(n)}}{${big(d)}}` };
  }
  const sum = L => L.reduce((s, x) => s + x, 0);
  const sumF = L => L.reduce((s, x) => s.add(x), F(0));
  const approx = x => R`\approx ${dec(x, 4)}`;
  const lamTex = l => (Number.isInteger(l) ? String(l) : dec(l, 1));
  const lamPow = (l, k) => (Number.isInteger(l) ? R`${l}^{${k}}` : R`(${dec(l, 1)})^{${k}}`);
  const pl = (n, s) => (n > 1 ? s + 's' : s);
  /* tableau de loi : ligne des valeurs, ligne des probabilités (chaînes LaTeX) */
  function lawTable(name, xs, ps, head) {
    return '<table class="t"><tr><th>$k$</th>' + xs.map(x => '<td>$' + x + '$</td>').join('') + '</tr>' +
      '<tr><th>$' + (head || '\\Proba(' + name + ' = k)') + '$</th>' + ps.map(p => '<td>$' + p + '$</td>').join('') + '</tr></table>';
  }
  const prodTex = (x, p) => (x < 0 ? '(' + x + ')' : x) + R` \times ${p}`;

  /* ------------------------------------------------------------------ */
  /* Générateurs                                                         */
  /* ------------------------------------------------------------------ */
  const RECO = [
    r => { const n = r.int(5, 20); return { s: R`On choisit au hasard un entier entre $1$ et $${n}$ ; $X$ est l'entier choisi.`,
      w: 'issues équiprobables', loi: R`loi uniforme $\mathcal U(\{1, \dots, ${n}\})$`, E: F(n + 1, 2), V: F(n * n - 1, 12) }; },
    r => { const c = r.pick([['un cœur', 1, 4], ['un as', 1, 8], ['une figure (valet, dame ou roi)', 3, 8]]), p = F(c[1], c[2]);
      return { s: R`On tire une carte d'un jeu de 32 cartes ; $X$ vaut $1$ si c'est ${c[0]}, $0$ sinon.`,
        w: 'deux valeurs 0 et 1 (indicatrice d’un événement)', loi: R`loi de Bernoulli $\mathcal B(${p.tex()})$`, E: p, V: p.mul(F(1).sub(p)) }; },
    r => { const n = r.int(5, 12); return { s: R`On lance $${n}$ fois un dé équilibré ; $X$ est le nombre de 6 obtenus.`,
      w: R`nombre de succès dans $${n}$ épreuves de Bernoulli indépendantes de même paramètre`, loi: R`loi binomiale $\mathcal B(${n}, \frac16)$`, E: F(n, 6), V: F(5 * n, 36) }; },
    r => { const rr = r.int(2, 6), bb = r.int(2, 8), n = r.int(3, 6), p = F(rr, rr + bb);
      return { s: R`Une urne contient $${rr}$ boules rouges et $${bb}$ blanches ; on tire $${n}$ boules <strong>avec remise</strong> ; $X$ est le nombre de rouges.`,
        w: 'tirages avec remise : épreuves indépendantes de même paramètre', loi: R`loi binomiale $\mathcal B(${n}, ${p.tex()})$`, E: p.mul(n), V: p.mul(F(1).sub(p)).mul(n) }; },
    r => { const rr = r.int(2, 6), bb = r.int(4, 8), n = r.int(2, 4), N = rr + bb, p = F(rr, N);
      return { s: R`Une urne contient $${rr}$ boules rouges et $${bb}$ blanches ; on tire <strong>simultanément</strong> $${n}$ boules ; $X$ est le nombre de rouges.`,
        w: 'tirage simultané (sans remise) : nombre de boules d’un type', loi: R`loi hypergéométrique $\mathcal H(${N}, ${n}, ${p.tex()})$`, E: p.mul(n), V: F(n * rr * bb * (N - n), N * N * (N - 1)) }; },
    r => { const c = r.pick([['une pièce équilibrée', '« pile »', 1, 2], ['un dé équilibré', '6', 1, 6], ['un dé équilibré', 'un multiple de 3', 1, 3]]), p = F(c[2], c[3]);
      return { s: R`On lance ${c[0]} jusqu'à obtenir ${c[1]} ; $X$ est le nombre de lancers effectués.`,
        w: 'rang du premier succès dans des épreuves indépendantes', loi: R`loi géométrique $\mathcal G(${p.tex()})$`, E: F(c[3], c[2]), V: F(1).sub(p).div(p.mul(p)) }; },
    r => { const k = r.int(2, 4); return { s: R`On lance un dé équilibré jusqu'à obtenir $${k}$ fois le 6 ; $X$ est le nombre de lancers effectués.`,
      w: R`rang du $${k}$-ième succès`, loi: R`loi de Pascal de paramètres $(${k}, \frac16)$`, E: F(6 * k), V: F(30 * k) }; },
    r => { const l = r.int(2, 8); return { s: R`Un standard reçoit en moyenne $${l}$ appels par minute, de façon indépendante et « au hasard » ; $X$ est le nombre d'appels reçus pendant une minute donnée.`,
      w: 'nombre d’événements rares, de moyenne connue', loi: R`loi de Poisson $\mathcal P(${l})$`, E: F(l), V: F(l) }; }
  ];

  const generateurs = {
    /* ---------- Partie 1 ---------- */
    loiTable: {
      title: 'Loi finie : constante, espérance, transfert, variance', diff: 1,
      make(r) {
        const vals = r.sample([-2, -1, 0, 1, 2, 3], 4).sort((a, b) => a - b);
        const w = vals.map(() => r.int(1, 4)), S = sum(w);
        const p = w.map(k => F(k, S));
        const E = sumF(vals.map((x, i) => p[i].mul(x))), E2 = sumF(vals.map((x, i) => p[i].mul(x * x)));
        const V = E2.sub(E.mul(E)), t = vals[1], Ft = p[0].add(p[1]);
        const ys = [...new Set(vals.map(x => x * x))].sort((a, b) => a - b);
        const py = ys.map(y => sumF(vals.map((x, i) => (x * x === y ? p[i] : F(0)))));
        const wa = k => (k === 1 ? 'a' : k + 'a');
        return {
          enonce: R`<p>Une variable aléatoire $X$ a pour loi :</p>${lawTable('X', vals, w.map(wa))}<p>où $a$ est un réel.</p>
            <ol><li>Déterminer $a$.</li><li>Calculer $\Esp(X)$.</li><li>Déterminer la loi de $Y = X^2$ et calculer $\Esp(Y)$ de deux façons.</li><li>En déduire $\Var(X)$.</li><li>Calculer $F_X(${t}) = \Proba(X \le ${t})$ et $\Proba(X \gt ${t})$.</li></ol>`,
          indication: R`<p>La somme des probabilités vaut 1. Pour $\Esp(X^2)$, utiliser le théorème de transfert : $\Esp(X^2) = \sum x_i^2\,\Proba(X = x_i)$.</p>`,
          correction: R`<ol><li>Les probabilités sont positives (donc $a \ge 0$) et de somme 1 : $${S}a = 1$, d'où $a = ${F(1, S).tex()}$. La loi de $X$ est donc :${lawTable('X', vals, p.map(f => f.tex()))}</li>
            <li>$\Esp(X) = ${vals.map((x, i) => prodTex(x, p[i].tex())).join(' + ')} = ${E.tex()}$.</li>
            <li>$Y(\Omega) = \{${ys.join(', ')}\}$ et $\Proba(Y = y) = \sum_{x_i^2 = y}\Proba(X = x_i)$ :${lawTable('Y', ys, py.map(f => f.tex()))}
              <p>$\Esp(Y) = ${ys.map((y, i) => prodTex(y, py[i].tex())).join(' + ')} = ${E2.tex()}$. Par le <strong>théorème de transfert</strong>, sans calculer la loi de $Y$ : $\Esp(X^2) = ${vals.map((x, i) => prodTex(x * x, p[i].tex())).join(' + ')} = ${E2.tex()}$.</p></li>
            <li><strong>König-Huygens</strong> : $\Var(X) = \Esp(X^2) - \Esp(X)^2 = ${E2.tex()} - \left(${E.tex()}\right)^2 = ${V.tex()}$.</li>
            <li>$F_X(${t}) = \Proba(X = ${vals[0]}) + \Proba(X = ${vals[1]}) = ${Ft.tex()}$ et $\Proba(X \gt ${t}) = 1 - F_X(${t}) = ${F(1).sub(Ft).tex()}$.</li></ol>`
        };
      }
    },

    /* ---------- Partie 2 ---------- */
    binomiale: {
      title: 'Loi binomiale', diff: 1,
      make(r) {
        const ctx = r.pick(['de', 'qcm', 'urne', 'piece', 'defaut']);
        let n, a, d, txt;
        if (ctx === 'de') { n = r.int(4, 10); a = 1; d = 6; txt = R`On lance $${n}$ fois un dé équilibré. On note $X$ le nombre de 6 obtenus.`; }
        else if (ctx === 'qcm') { const c = r.pick([3, 4, 5]); n = r.int(5, 10); a = 1; d = c; txt = R`Un QCM comporte $${n}$ questions ; chacune propose $${c}$ réponses dont une seule est juste. Un candidat répond au hasard à chaque question, indépendamment. On note $X$ le nombre de bonnes réponses.`; }
        else if (ctx === 'urne') { const rr = r.int(1, 5), bb = r.int(1, 6), f = F(rr, rr + bb); a = f.n; d = f.d; n = r.int(3, 8); txt = R`Une urne contient $${rr}$ ${pl(rr, 'boule')} ${pl(rr, 'rouge')} et $${bb}$ ${pl(bb, 'boule')} ${pl(bb, 'blanche')}. On effectue $${n}$ tirages <strong>avec remise</strong> et on note $X$ le nombre de boules rouges obtenues.`; }
        else if (ctx === 'piece') { n = r.int(4, 10); a = 1; d = 2; txt = R`On lance $${n}$ fois une pièce équilibrée et on note $X$ le nombre de « pile ».`; }
        else { n = r.int(5, 10); a = 1; d = 10; txt = R`Chaque pièce produite par une machine est défectueuse avec la probabilité $\frac1{10}$, indépendamment des autres. On prélève $${n}$ pièces et on note $X$ le nombre de pièces défectueuses.`; }
        const b = d - a, k = r.int(2, n - 1), p = F(a, d), q = F(b, d), pt = p.tex(), qt = q.tex();
        const den = bpow(d, n);
        const pk = bq(binom(n, k) * bpow(a, k) * bpow(b, n - k), den);
        const ge1 = bq(den - bpow(b, n), den), le1 = bq(bpow(b, n) + BigInt(n * a) * bpow(b, n - 1), den);
        return {
          enonce: R`<p>${txt}</p><ol><li>Quelle est la loi de $X$ ? Donner $\Esp(X)$ et $\Var(X)$.</li><li>Calculer $\Proba(X = ${k})$.</li><li>Calculer $\Proba(X \ge 1)$.</li><li>Calculer $\Proba(X \le 1)$.</li></ol>`,
          indication: R`<p>Repérer une épreuve de Bernoulli (succès / échec) répétée $${n}$ fois de façon indépendante.</p>`,
          correction: R`<ol><li>On répète $${n}$ fois, de façon indépendante, une épreuve de Bernoulli dont le succès a pour probabilité $p = ${pt}$, et $X$ compte les succès : $X \sim \mathcal B(${n}, ${pt})$. Donc $\Esp(X) = np = ${p.mul(n).tex()}$ et $\Var(X) = np(1-p) = ${p.mul(q).mul(n).tex()}$.</li>
            <li>$\Proba(X = ${k}) = \binom{${n}}{${k}}\left(${pt}\right)^{${k}}\left(${qt}\right)^{${n - k}} = ${pk.tex} ${approx(pk.v)}$.</li>
            <li>Contraire : $\Proba(X \ge 1) = 1 - \Proba(X = 0) = 1 - \left(${qt}\right)^{${n}} = ${ge1.tex} ${approx(ge1.v)}$.</li>
            <li>$\Proba(X \le 1) = \Proba(X = 0) + \Proba(X = 1) = \left(${qt}\right)^{${n}} + ${n} \times ${pt}\left(${qt}\right)^{${n - 1}} = ${le1.tex} ${approx(le1.v)}$.</li></ol>`
        };
      }
    },

    geometrique: {
      title: 'Loi géométrique, absence de mémoire', diff: 2,
      make(r) {
        const ctx = r.pick(['de', 'tir', 'panne', 'urne']);
        let a, d, txt;
        if (ctx === 'de') { a = 1; d = 6; txt = R`On lance un dé équilibré jusqu'à obtenir 6. On note $X$ le nombre de lancers effectués.`; }
        else if (ctx === 'tir') { [a, d] = r.pick([[1, 3], [1, 4], [2, 5], [3, 10]]); txt = R`Un joueur de fléchettes atteint le centre de la cible avec la probabilité $${F(a, d).tex()}$ à chaque lancer, indépendamment des autres. Il lance jusqu'à atteindre le centre ; $X$ est le nombre de lancers.`; }
        else if (ctx === 'panne') { a = 1; d = r.pick([10, 20]); txt = R`Chaque jour, une machine tombe en panne avec la probabilité $\frac1{${d}}$, indépendamment des autres jours. $X$ est le numéro du jour de la première panne.`; }
        else { const rr = r.int(1, 4), bb = r.int(2, 6), f = F(rr, rr + bb); a = f.n; d = f.d; txt = R`Une urne contient $${rr}$ ${pl(rr, 'boule')} ${pl(rr, 'rouge')} et $${bb}$ blanches. On tire avec remise jusqu'à obtenir une boule rouge ; $X$ est le nombre de tirages.`; }
        const b = d - a, p = F(a, d), q = F(b, d), pt = p.tex(), qt = q.tex();
        const k = r.int(2, 6), m = r.int(2, 5), s = r.int(1, 4);
        const pk = bq(bpow(b, k - 1) * BigInt(a), bpow(d, k)), gm = bq(bpow(b, m), bpow(d, m)), gs = bq(bpow(b, s), bpow(d, s));
        return {
          enonce: R`<p>${txt}</p><ol><li>Justifier que $X$ suit une loi géométrique ; donner $\Esp(X)$ et $\Var(X)$.</li><li>Calculer $\Proba(X = ${k})$.</li><li>Calculer $\Proba(X \gt ${m})$.</li><li>Calculer $\Proba(X \gt ${m + s} \mid X \gt ${m})$ et comparer à $\Proba(X \gt ${s})$.</li></ol>`,
          indication: R`<p>$\{X \gt n\}$ signifie : les $n$ premières épreuves sont des échecs.</p>`,
          correction: R`<ol><li>Notons $S_i$ : « succès à la $i$-ème épreuve » ; les $S_i$ sont mutuellement indépendants de probabilité $p = ${pt}$. Pour $k \ge 1$, $\{X = k\} = \overline{S_1} \cap \dots \cap \overline{S_{k-1}} \cap S_k$, donc $\Proba(X = k) = (1-p)^{k-1}p$ : $X \sim \mathcal G(${pt})$. Ainsi $\Esp(X) = \frac1p = ${F(d, a).tex()}$ et $\Var(X) = \frac{1-p}{p^2} = ${F(b * d, a * a).tex()}$.</li>
            <li>$\Proba(X = ${k}) = \left(${qt}\right)^{${k - 1}} \times ${pt} = ${pk.tex} ${approx(pk.v)}$.</li>
            <li>$\{X \gt ${m}\} = \overline{S_1} \cap \dots \cap \overline{S_{${m}}}$ donc $\Proba(X \gt ${m}) = \left(${qt}\right)^{${m}} = ${gm.tex}$.</li>
            <li>$\{X \gt ${m + s}\} \subset \{X \gt ${m}\}$, donc $\Proba(X \gt ${m + s} \mid X \gt ${m}) = \dfrac{\Proba(X \gt ${m + s})}{\Proba(X \gt ${m})} = \dfrac{(${qt})^{${m + s}}}{(${qt})^{${m}}} = \left(${qt}\right)^{${s}} = ${gs.tex} = \Proba(X \gt ${s})$ : c'est l'<strong>absence de mémoire</strong> de la loi géométrique (les échecs passés ne changent rien à l'attente restante).</li></ol>`
        };
      }
    },

    hypergeo: {
      title: 'Loi hypergéométrique (tirages sans remise)', diff: 2,
      make(r) {
        const ctx = r.pick(['urne', 'lot', 'deleg']);
        const N1 = r.int(3, 8), N2 = r.int(6, 14), N = N1 + N2, n = r.int(3, 5), k = r.int(1, Math.min(n, N1));
        const txt = {
          urne: R`Une urne contient $${N1}$ boules rouges et $${N2}$ boules noires. On tire simultanément $${n}$ boules et on note $X$ le nombre de boules rouges obtenues.`,
          lot: R`Un lot de $${N}$ pièces contient $${N1}$ pièces défectueuses. On prélève au hasard $${n}$ pièces du lot (sans remise) et on note $X$ le nombre de pièces défectueuses prélevées.`,
          deleg: R`Un groupe compte $${N1}$ étudiantes et $${N2}$ étudiants. On tire au sort une délégation de $${n}$ personnes et on note $X$ le nombre d'étudiantes de la délégation.`
        }[ctx];
        const tot = binom(N, n), pk = bq(binom(N1, k) * binom(N2, n - k), tot), p0 = bq(binom(N2, n), tot), ge1 = bq(tot - binom(N2, n), tot);
        const p = F(N1, N), E = p.mul(n), V = F(n * N1 * N2 * (N - n), N * N * (N - 1)), Vb = F(n * N1 * N2, N * N);
        return {
          enonce: R`<p>${txt}</p><ol><li>Donner la loi de $X$.</li><li>Calculer $\Proba(X = ${k})$.</li><li>Calculer $\Proba(X \ge 1)$.</li><li>Donner $\Esp(X)$ et $\Var(X)$ ; comparer avec le cas de tirages avec remise.</li></ol>`,
          indication: R`<p>L'univers est l'ensemble des parties à $${n}$ éléments parmi $${N}$, muni de l'équiprobabilité.</p>`,
          correction: R`<ol><li>Tirage simultané de $${n}$ objets parmi $${N}$, dont $${N1}$ « marqués » : $X \sim \mathcal H(${N}, ${n}, ${p.tex()})$. $X(\Omega) = \{0, \dots, ${Math.min(n, N1)}\}$ et $\Proba(X = j) = \dfrac{\binom{${N1}}{j}\binom{${N2}}{${n} - j}}{\binom{${N}}{${n}}}$.</li>
            <li>$\Proba(X = ${k}) = \dfrac{\binom{${N1}}{${k}}\binom{${N2}}{${n - k}}}{\binom{${N}}{${n}}} = ${pk.tex} ${approx(pk.v)}$.</li>
            <li>$\Proba(X \ge 1) = 1 - \Proba(X = 0) = 1 - \dfrac{\binom{${N2}}{${n}}}{\binom{${N}}{${n}}} = 1 - ${p0.tex} = ${ge1.tex} ${approx(ge1.v)}$.</li>
            <li>$\Esp(X) = np = ${n} \times ${p.tex()} = ${E.tex()}$ et $\Var(X) = np(1-p)\dfrac{N-n}{N-1} = ${V.tex()}$. Avec remise, on aurait $X \sim \mathcal B(${n}, ${p.tex()})$ : même espérance, mais variance $np(1-p) = ${Vb.tex()}$, plus grande (facteur $\frac{${N - n}}{${N - 1}}$).</li></ol>`
        };
      }
    },

    poisson: {
      title: 'Loi de Poisson', diff: 1,
      make(r) {
        const l = r.pick([0.5, 1, 1.5, 2, 2.5, 3, 4]), lt = lamTex(l), k = r.int(2, 5);
        const ctx = r.pick([
          R`Le nombre $X$ d'appels reçus par un standard en une minute suit une loi de Poisson de paramètre $${lt}$.`,
          R`Le nombre $X$ de clients entrant dans une boutique en dix minutes suit une loi de Poisson de paramètre $${lt}$.`,
          R`Le nombre $X$ de fautes de frappe sur une page d'un livre suit une loi de Poisson de paramètre $${lt}$.`,
          R`Le nombre $X$ de pannes d'un réseau en un mois suit une loi de Poisson de paramètre $${lt}$.`
        ]);
        let fk = 1; for (let i = 2; i <= k; i++) fk *= i;
        const e = Math.exp(-l), pk = e * Math.pow(l, k) / fk, le2 = e * (1 + l + l * l / 2), ge1 = 1 - e, cond = (1 - e - l * e) / (1 - e);
        return {
          enonce: R`<p>${ctx}</p><ol><li>Rappeler $\Esp(X)$ et $\Var(X)$.</li><li>Calculer $\Proba(X = 0)$ et $\Proba(X = ${k})$.</li><li>Calculer $\Proba(X \le 2)$.</li><li>Calculer $\Proba(X \ge 2 \mid X \ge 1)$.</li></ol>`,
          correction: R`<ol><li>$X \sim \mathcal P(${lt})$ : $\Esp(X) = \Var(X) = ${lt}$.</li>
            <li>$\Proba(X = k) = e^{-\lambda}\dfrac{\lambda^k}{k!}$ : $\Proba(X = 0) = e^{-${lt}} ${approx(e)}$ et $\Proba(X = ${k}) = e^{-${lt}}\dfrac{${lamPow(l, k)}}{${k}!} ${approx(pk)}$.</li>
            <li>$\Proba(X \le 2) = e^{-${lt}}\left(1 + ${lt} + \dfrac{${lamPow(l, 2)}}{2}\right) ${approx(le2)}$.</li>
            <li>$\{X \ge 2\} \subset \{X \ge 1\}$, donc $\Proba(X \ge 2 \mid X \ge 1) = \dfrac{\Proba(X \ge 2)}{\Proba(X \ge 1)} = \dfrac{1 - e^{-${lt}} - ${lt}e^{-${lt}}}{1 - e^{-${lt}}} ${approx(cond)}$.</li></ol>`
        };
      }
    },

    reconnaitre: {
      title: 'Reconnaître une loi usuelle', diff: 1,
      make(r) {
        const items = r.sample(RECO, 4).map(f => f(r));
        return {
          enonce: R`<p>Pour chacune des situations suivantes, reconnaître la loi de $X$ (avec ses paramètres) et donner $\Esp(X)$ et $\Var(X)$.</p><ol>${items.map(it => '<li>' + it.s + '</li>').join('')}</ol>`,
          indication: R`<p>Se demander : que compte $X$ ? un nombre de succès (sur un nombre fixé d'épreuves) ou un rang (on attend un succès) ? avec ou sans remise ?</p>`,
          correction: R`<ol>${items.map(it => R`<li>${it.w[0].toUpperCase() + it.w.slice(1)} : ${it.loi}. $\Esp(X) = ${it.E.tex()}$, $\Var(X) = ${it.V.tex()}$.</li>`).join('')}</ol>`
        };
      }
    },

    /* ---------- Parties 3 et 4 ---------- */
    couple: {
      title: 'Couple : marginales, indépendance, loi conditionnelle', diff: 2,
      make(r) {
        const xs = r.pick([[0, 1, 2], [-1, 0, 1], [1, 2, 3]]), ys = r.pick([[0, 1], [1, 2], [0, 1, 2]]);
        const nx = xs.length, ny = ys.length;
        let K, D;
        if (r.chance(0.35)) {
          const ax = xs.map(() => r.int(1, 3)), by = ys.map(() => r.int(1, 3));
          D = sum(ax) * sum(by); K = ax.map(u => by.map(v => u * v));
        } else {
          D = r.pick([12, 16, 20, 24]); K = xs.map(() => ys.map(() => 1));
          for (let t = nx * ny; t < D; t++) K[r.int(0, nx - 1)][r.int(0, ny - 1)]++;
        }
        const row = K.map(sum), col = ys.map((_, j) => sum(K.map(rw => rw[j])));
        const pX = row.map(k => F(k, D)), pY = col.map(k => F(k, D));
        const EX = sumF(xs.map((x, i) => pX[i].mul(x))), EY = sumF(ys.map((y, j) => pY[j].mul(y)));
        let EXY = F(0), bad = null;
        xs.forEach((x, i) => ys.forEach((y, j) => {
          EXY = EXY.add(F(K[i][j] * x * y, D));
          if (!bad && K[i][j] * D !== row[i] * col[j]) bad = [i, j];
        }));
        const cov = EXY.sub(EX.mul(EY)), y0 = ys[0];
        const head = '<tr><th>$X \\,\\backslash\\, Y$</th>' + ys.map(y => '<th>$' + y + '$</th>').join('');
        const tab = '<table class="t">' + head + '</tr>' + xs.map((x, i) => '<tr><th>$' + x + '$</th>' + ys.map((y, j) => '<td>$\\frac{' + K[i][j] + '}{' + D + '}$</td>').join('') + '</tr>').join('') + '</table>';
        const tabM = '<table class="t">' + head + '<th>$\\Proba(X = x)$</th></tr>' + xs.map((x, i) => '<tr><th>$' + x + '$</th>' + ys.map((y, j) => '<td>$\\frac{' + K[i][j] + '}{' + D + '}$</td>').join('') + '<td><b>$' + pX[i].tex() + '$</b></td></tr>').join('') +
          '<tr><th>$\\Proba(Y = y)$</th>' + pY.map(f => '<td><b>$' + f.tex() + '$</b></td>').join('') + '<td>$1$</td></tr></table>';
        let indep;
        if (bad) {
          const [i, j] = bad;
          indep = R`$\Proba(X = ${xs[i]}, Y = ${ys[j]}) = \frac{${K[i][j]}}{${D}}$ alors que $\Proba(X = ${xs[i]})\Proba(Y = ${ys[j]}) = ${pX[i].tex()} \times ${pY[j].tex()} = ${pX[i].mul(pY[j]).tex()}$ : <strong>$X$ et $Y$ ne sont pas indépendantes</strong>.${cov.isZero() ? ' (Leur covariance est pourtant nulle : covariance nulle n’implique pas indépendance.)' : ''}`;
        } else {
          indep = R`On vérifie que <strong>chaque case</strong> est le produit des deux marges (par exemple $\frac{${K[0][0]}}{${D}} = ${pX[0].tex()} \times ${pY[0].tex()}$) : <strong>$X$ et $Y$ sont indépendantes</strong>.`;
        }
        return {
          enonce: R`<p>La loi conjointe d'un couple $(X, Y)$ est donnée par le tableau (en ligne les valeurs de $X$, en colonne celles de $Y$) :</p>${tab}
            <ol><li>Déterminer les lois marginales de $X$ et de $Y$.</li><li>Calculer $\Esp(X)$ et $\Esp(Y)$.</li><li>$X$ et $Y$ sont-elles indépendantes ?</li><li>Déterminer la loi conditionnelle de $X$ sachant $\{Y = ${y0}\}$.</li><li>Calculer $\Cov(X, Y)$.</li></ol>`,
          indication: R`<p>Lois marginales : sommer les lignes et les colonnes. Indépendance : chaque case doit être le produit de sa marge-ligne et de sa marge-colonne.</p>`,
          correction: R`<ol><li>Par la formule des probabilités totales, $\Proba(X = x_i) = \sum_j \Proba(X = x_i, Y = y_j)$ (somme de la ligne) et $\Proba(Y = y_j)$ = somme de la colonne :${tabM}</li>
            <li>$\Esp(X) = ${xs.map((x, i) => prodTex(x, pX[i].tex())).join(' + ')} = ${EX.tex()}$ et $\Esp(Y) = ${ys.map((y, j) => prodTex(y, pY[j].tex())).join(' + ')} = ${EY.tex()}$.</li>
            <li>${indep}</li>
            <li>$\Proba(X = x \mid Y = ${y0}) = \dfrac{\Proba(X = x, Y = ${y0})}{\Proba(Y = ${y0})}$ avec $\Proba(Y = ${y0}) = \frac{${col[0]}}{${D}}$ :${lawTable('X', xs, xs.map((x, i) => F(K[i][0], col[0]).tex()), R`\Proba(X = k \mid Y = ${y0})`)}<p>${bad ? 'Elle diffère de la loi de $X$.' : 'C’est la loi de $X$, ce qui confirme l’indépendance.'}</p></li>
            <li>Par transfert, $\Esp(XY) = \sum_{i,j} x_iy_j\,\Proba(X = x_i, Y = y_j) = ${EXY.tex()}$, donc $\Cov(X, Y) = \Esp(XY) - \Esp(X)\Esp(Y) = ${EXY.tex()} - ${EX.mul(EY).tex()} = ${cov.tex()}$.</li></ol>`
        };
      }
    },

    bayesVA: {
      title: 'Loi conditionnelle et Bayes (dé puis pièces)', diff: 3,
      make(r) {
        const m = r.int(3, 6);
        const c = r.pick([{ a: 1, d: 2, obj: 'une pièce équilibrée', s: '« pile »' }, { a: 1, d: 6, obj: 'un dé équilibré', s: '6' }]);
        const p = F(c.a, c.d), q = F(c.d - c.a, c.d), pt = p.tex(), qt = q.tex(), um = F(1, m);
        const terms = []; for (let k = 1; k <= m; k++) terms.push(q.pow(k));
        const P0 = um.mul(sumF(terms)), post1 = um.mul(q).div(P0), postm = um.mul(q.pow(m)).div(P0), Pm = um.mul(p.pow(m));
        return {
          enonce: R`<p>On choisit un entier $X$ au hasard (uniformément) entre $1$ et $${m}$, puis on lance $X$ fois ${c.obj}. On note $Y$ le nombre de ${c.s} obtenus.</p>
            <ol><li>Pour $k \in \{1, \dots, ${m}\}$, quelle est la loi de $Y$ sachant $\{X = k\}$ ?</li><li>Calculer $\Proba(Y = 0)$.</li><li>On n'a obtenu aucun ${c.s}. Quelle est la probabilité que $X = 1$ ? que $X = ${m}$ ?</li><li>Calculer $\Proba(Y = ${m})$. Les variables $X$ et $Y$ sont-elles indépendantes ?</li></ol>`,
          indication: R`<p>$(\{X = k\})_{1 \le k \le ${m}}$ est un système complet : probabilités totales, puis Bayes.</p>`,
          correction: R`<ol><li>Sachant $\{X = k\}$, on fait $k$ lancers indépendants avec une probabilité de succès $${pt}$ : la loi conditionnelle de $Y$ est $\mathcal B(k, ${pt})$, i.e. $\Proba(Y = j \mid X = k) = \binom kj\left(${pt}\right)^j\left(${qt}\right)^{k-j}$.</li>
            <li>Probabilités totales : $\Proba(Y = 0) = \sum_{k=1}^{${m}}\Proba(X = k)\Proba(Y = 0 \mid X = k) = \frac1{${m}}\sum_{k=1}^{${m}}\left(${qt}\right)^k = ${P0.tex()} ${approx(P0.val())}$.</li>
            <li><strong>Bayes</strong> : $\Proba(X = 1 \mid Y = 0) = \dfrac{\Proba(X = 1)\Proba(Y = 0 \mid X = 1)}{\Proba(Y = 0)} = \dfrac{\frac1{${m}} \times ${qt}}{${P0.tex()}} = ${post1.tex()}$, et de même $\Proba(X = ${m} \mid Y = 0) = \dfrac{\frac1{${m}}\left(${qt}\right)^{${m}}}{${P0.tex()}} = ${postm.tex()}$. Ne rien obtenir rend les petites valeurs de $X$ plus probables.</li>
            <li>$Y = ${m}$ impose $X = ${m}$ : $\Proba(Y = ${m}) = \frac1{${m}}\left(${pt}\right)^{${m}} = ${Pm.tex()}$. Alors $\Proba(X = 1, Y = ${m}) = 0 \neq \Proba(X = 1)\Proba(Y = ${m})$ : $X$ et $Y$ <strong>ne sont pas indépendantes</strong>.</li></ol>`
        };
      }
    },

    somme: {
      title: 'Loi d’une somme de variables indépendantes', diff: 2,
      make(r) {
        const xs = [0, 1, 2], ax = xs.map(() => r.int(1, 4)), A = sum(ax);
        const ys = r.chance(0.5) ? [0, 1] : [0, 1, 2], by = ys.map(() => r.int(1, 4)), B = sum(by);
        const pX = ax.map(k => F(k, A)), pY = by.map(k => F(k, B));
        const smax = 2 + ys[ys.length - 1], ss = [];
        for (let s = 0; s <= smax; s++) ss.push(s);
        const terms = s => xs.filter(i => s - i >= 0 && s - i < ys.length).map(i => [i, s - i]);
        const pS = ss.map(s => sumF(terms(s).map(([i, j]) => pX[i].mul(pY[j]))));
        const E = (vals, ps) => sumF(vals.map((v, i) => ps[i].mul(v)));
        const EX = E(xs, pX), EY = E(ys, pY), ES = E(ss, pS);
        const VX = E(xs.map(v => v * v), pX).sub(EX.mul(EX)), VY = E(ys.map(v => v * v), pY).sub(EY.mul(EY));
        const VS = E(ss.map(v => v * v), pS).sub(ES.mul(ES));
        const eq = sumF(ys.map(k => pX[k].mul(pY[k])));
        const s1 = 2;
        return {
          enonce: R`<p>$X$ et $Y$ sont deux variables aléatoires <strong>indépendantes</strong> de lois :</p>${lawTable('X', xs, pX.map(f => f.tex()))}${lawTable('Y', ys, pY.map(f => f.tex()))}
            <ol><li>Déterminer la loi de $S = X + Y$.</li><li>Calculer $\Esp(S)$ de deux façons.</li><li>Calculer $\Var(X)$, $\Var(Y)$ et $\Var(S)$ ; vérifier que $\Var(S) = \Var(X) + \Var(Y)$.</li><li>Calculer $\Proba(X = Y)$.</li></ol>`,
          indication: R`<p>$\{S = s\} = \bigsqcup_k \{X = k\} \cap \{Y = s - k\}$, et l'indépendance donne le produit des probabilités.</p>`,
          correction: R`<ol><li>$S(\Omega) = \{0, \dots, ${smax}\}$ et $\Proba(S = s) = \sum_k \Proba(X = k)\Proba(Y = s - k)$ (indépendance). Par exemple $\Proba(S = ${s1}) = ${terms(s1).map(([i, j]) => R`${pX[i].tex()} \times ${pY[j].tex()}`).join(' + ')} = ${pS[s1].tex()}$. D'où :${lawTable('S', ss, pS.map(f => f.tex()))}</li>
            <li>Avec la loi : $\Esp(S) = ${ES.tex()}$. Par linéarité : $\Esp(X) + \Esp(Y) = ${EX.tex()} + ${EY.tex()} = ${EX.add(EY).tex()}$.</li>
            <li>König-Huygens : $\Var(X) = ${VX.tex()}$, $\Var(Y) = ${VY.tex()}$ et $\Var(S) = ${VS.tex()}$ ; on a bien $${VX.tex()} + ${VY.tex()} = ${VX.add(VY).tex()}$ (vrai car $X$ et $Y$ sont indépendantes).</li>
            <li>$\Proba(X = Y) = \sum_k \Proba(X = k)\Proba(Y = k) = ${ys.map(k => R`${pX[k].tex()} \times ${pY[k].tex()}`).join(' + ')} = ${eq.tex()}$.</li></ol>`
        };
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Cours                                                               */
  /* ------------------------------------------------------------------ */
  const cours = [
    { t: 'nota', title: 'cadre', body: R`<p>Dans tout le chapitre, $(\Omega, \mathcal A, \Proba)$ est un espace probabilisé. Pour une probabilité de succès $p \in [0, 1]$, on note $q = 1 - p$.</p>` },

    /* ================= Partie 1 ================= */
    { t: 'h', title: 'Généralités' },
    { t: 'h2', title: 'Variable aléatoire et loi' },
    { t: 'def', body: R`<p>Une <strong>variable aléatoire réelle</strong> est une application $X : \Omega \to \R$ telle que, pour tout intervalle $I$ de $\R$, l'ensemble $\{X \in I\} = X^{-1}(I) = \{\omega \in \Omega : X(\omega) \in I\}$ soit un événement. On note $\{X = x\}$, $\{X \le x\}$, etc.</p>` },
    { t: 'rem', body: R`<p>Si $\Omega$ est fini (ou dénombrable) et $\mathcal A = \mathcal P(\Omega)$, toute application $X : \Omega \to \R$ est une variable aléatoire. Une variable aléatoire est une <strong>quantité numérique qui dépend du résultat</strong> de l'expérience : somme de deux dés, nombre de piles, rang du premier succès…</p>` },
    { t: 'def', body: R`<p>La <strong>loi</strong> de $X$ est l'application $\Proba_X : B \mapsto \Proba(X \in B)$, définie sur les parties $B$ de $\R$ pour lesquelles $\{X \in B\}$ est un événement (intervalles, réunions dénombrables d'intervalles…). C'est une probabilité sur $\R$. Deux variables de même loi sont dites <strong>de même loi</strong>, ce qu'on note $X \sim Y$.</p>` },
    { t: 'def', title: 'fonction de répartition', body: R`<p>La <strong>fonction de répartition</strong> de $X$ est $F_X : \R \to [0, 1]$, $F_X(x) = \Proba(X \le x)$.</p>` },
    { t: 'prop', body: R`<ol><li>$F_X$ est croissante, $\lim_{-\infty} F_X = 0$ et $\lim_{+\infty} F_X = 1$.</li><li>$F_X$ est continue à droite en tout point.</li><li>Pour $a \lt b$ : $\Proba(a \lt X \le b) = F_X(b) - F_X(a)$ et $\Proba(X \gt a) = 1 - F_X(a)$.</li></ol>
      <p>On admet que $F_X$ <strong>caractérise</strong> la loi de $X$ : deux variables ont la même loi si et seulement si elles ont la même fonction de répartition.</p>`,
      proof: R`<p>3. $\{X \le b\} = \{X \le a\} \sqcup \{a \lt X \le b\}$. Croissance : si $a \le b$, $\{X \le a\} \subset \{X \le b\}$.</p>
      <p>1 et 2 : par continuité monotone. Les événements $\{X \le n\}$ croissent vers $\Omega$ et $\{X \le -n\}$ décroissent vers $\varnothing$, d'où les limites (la monotonie de $F_X$ permet de passer de la suite à la fonction). De même $\{X \le x + \frac1n\}$ décroît vers $\{X \le x\}$, donc $F_X(x + \frac1n) \to F_X(x)$.</p>` },

    { t: 'h2', title: 'Variables aléatoires discrètes' },
    { t: 'def', body: R`<p>$X$ est <strong>discrète</strong> si $X(\Omega)$ est fini ou dénombrable : $X(\Omega) = \{x_i,\ i \in I\}$ avec $I \subset \N$ et les $x_i$ distincts.</p>` },
    { t: 'prop', title: 'loi d’une variable discrète', body: R`<p>Si $X$ est discrète, $(\{X = x_i\})_{i \in I}$ est un système complet d'événements, donc</p>
      $$\sum_{i \in I}\Proba(X = x_i) = 1 \quad \text{et} \quad \Proba(X \in B) = \sum_{x_i \in B}\Proba(X = x_i).$$
      <p>La loi de $X$ est donc entièrement déterminée par la donnée de $X(\Omega)$ et des nombres $\Proba(X = x_i)$. Réciproquement (admis), si $(p_i)$ est une famille de réels positifs de somme 1, il existe une variable aléatoire $X$ telle que $\Proba(X = x_i) = p_i$ pour tout $i$.</p>`,
      proof: R`<p>Les $\{X = x_i\}$ sont deux à deux incompatibles (les $x_i$ sont distincts) et leur réunion est $\Omega$. $\{X \in B\}$ est la réunion disjointe des $\{X = x_i\}$, $x_i \in B$ : on applique la $\sigma$-additivité.</p>` },
    { t: 'meth', title: 'déterminer la loi de X', body: R`<ol><li>Déterminer l'ensemble des valeurs $X(\Omega)$.</li><li>Pour chaque valeur $x$, calculer $\Proba(X = x)$ (en décrivant l'événement $\{X = x\}$).</li><li>Vérifier que la somme vaut 1.</li></ol>` },
    { t: 'ex', body: R`<p>On lance deux dés et $X$ est le plus grand des deux résultats. $X(\Omega) = \{1, \dots, 6\}$ et $\{X \le k\}$ = « les deux dés donnent au plus $k$ », donc $F_X(k) = \frac{k^2}{36}$ et</p>
      $$\Proba(X = k) = \Proba(X \le k) - \Proba(X \le k - 1) = \frac{k^2 - (k-1)^2}{36} = \frac{2k - 1}{36}.$$` },
    { t: 'prop', title: 'fonction d’une variable', body: R`<p>Si $f : \R \to \R$, $Y = f(X)$ est une variable discrète, $Y(\Omega) = f(X(\Omega))$ et pour tout $y \in Y(\Omega)$ :</p>
      $$\Proba(Y = y) = \sum_{i \,:\, f(x_i) = y}\Proba(X = x_i).$$`,
      proof: R`<p>$\{f(X) = y\}$ est la réunion disjointe des $\{X = x_i\}$ pour les $x_i$ tels que $f(x_i) = y$.</p>` },

    { t: 'h2', title: 'Espérance' },
    { t: 'def', body: R`<p>Soit $X$ discrète, $X(\Omega) = \{x_i,\ i \in I\}$. On dit que $X$ <strong>admet une espérance</strong> si la série $\sum x_i\,\Proba(X = x_i)$ est <strong>absolument convergente</strong>. On pose alors</p>
      $$\Esp(X) = \sum_{i \in I} x_i\,\Proba(X = x_i).$$
      <p>Si $X(\Omega)$ est fini, $X$ admet toujours une espérance. Si $\Esp(X) = 0$, $X$ est dite <strong>centrée</strong>.</p>` },
    { t: 'rem', body: R`<p>$\Esp(X)$ est la <strong>moyenne</strong> des valeurs de $X$ pondérées par leurs probabilités. La convergence absolue garantit que la somme ne dépend pas de l'ordre dans lequel on range les $x_i$.</p>` },
    { t: 'ex', body: R`<p>Si $\Proba(X = k) = \frac{1}{k(k+1)}$ pour $k \ge 1$ (c'est une loi : $\frac1{k(k+1)} = \frac1k - \frac1{k+1}$, somme télescopique égale à 1), alors $\sum k\,\Proba(X = k) = \sum \frac1{k+1}$ diverge : $X$ <strong>n'admet pas d'espérance</strong>.</p>` },
    { t: 'thm', title: 'théorème de transfert', body: R`<p>Soit $f : \R \to \R$. La variable $f(X)$ admet une espérance si et seulement si la série $\sum f(x_i)\Proba(X = x_i)$ converge absolument, et alors</p>
      $$\Esp\big(f(X)\big) = \sum_{i \in I} f(x_i)\,\Proba(X = x_i).$$`,
      proof: R`<p>On regroupe les termes selon la valeur $y = f(x_i)$ (licite par convergence absolue) : $\sum_i f(x_i)\Proba(X = x_i) = \sum_{y}y\sum_{f(x_i) = y}\Proba(X = x_i) = \sum_y y\,\Proba(f(X) = y) = \Esp(f(X))$.</p>` },
    { t: 'rem', body: R`<p>Le théorème de transfert permet de calculer $\Esp(X^2)$, $\Esp(e^{X})$, $\Esp\big(\frac1{X+1}\big)$… <strong>sans déterminer la loi</strong> de $f(X)$.</p>` },
    { t: 'prop', title: 'propriétés', body: R`<p>Soient $X$, $Y$ admettant une espérance et $a, b \in \R$.</p>
      <ol><li><strong>Linéarité</strong> : $\Esp(aX + b) = a\Esp(X) + b$ et $\Esp(X + Y) = \Esp(X) + \Esp(Y)$.</li>
      <li><strong>Positivité</strong> : si $X \ge 0$, alors $\Esp(X) \ge 0$.</li>
      <li><strong>Croissance</strong> : si $X \le Y$, alors $\Esp(X) \le \Esp(Y)$.</li></ol>`,
      proof: R`<p>1. Transfert avec $f(x) = ax + b$ : $\sum(ax_i + b)\Proba(X = x_i) = a\sum x_i\Proba(X = x_i) + b\sum\Proba(X = x_i) = a\Esp(X) + b$. La formule $\Esp(X + Y) = \Esp(X) + \Esp(Y)$ est démontrée dans la partie « couples ».</p>
      <p>2. Tous les termes $x_i\Proba(X = x_i)$ sont positifs. 3. On applique 2 à $Y - X$ et la linéarité.</p>` },

    { t: 'h2', title: 'Variance' },
    { t: 'def', body: R`<p>Si $X^2$ admet une espérance (on dit que $X$ admet un <strong>moment d'ordre 2</strong>), alors $X$ admet une espérance et on définit la <strong>variance</strong> et l'<strong>écart-type</strong> de $X$ :</p>
      $$\Var(X) = \Esp\Big(\big(X - \Esp(X)\big)^2\Big), \qquad \sigma(X) = \sqrt{\Var(X)}.$$`,
      proof: R`<p>Existence de $\Esp(X)$ : $|x| \le \frac{1 + x^2}2$, donc la série $\sum |x_i|\Proba(X = x_i)$ est majorée par $\frac12\sum(1 + x_i^2)\Proba(X = x_i)$, qui converge.</p>` },
    { t: 'rem', body: R`<p>La variance mesure la <strong>dispersion</strong> de $X$ autour de sa moyenne : c'est la moyenne des carrés des écarts à la moyenne. L'écart-type s'exprime dans la même unité que $X$.</p>` },
    { t: 'thm', title: 'formule de König-Huygens', body: R`$$\Var(X) = \Esp(X^2) - \Esp(X)^2.$$`,
      proof: R`<p>Avec $m = \Esp(X)$ : $(X - m)^2 = X^2 - 2mX + m^2$ ; par linéarité, $\Var(X) = \Esp(X^2) - 2m\Esp(X) + m^2 = \Esp(X^2) - m^2$.</p>` },
    { t: 'prop', body: R`<ol><li>$\Var(X) \ge 0$, et $\Var(X) = 0$ si et seulement si $\Proba(X = \Esp(X)) = 1$ ($X$ est presque sûrement constante).</li><li>$\Var(aX + b) = a^2\Var(X)$ et $\sigma(aX + b) = |a|\,\sigma(X)$.</li><li>Si $\sigma(X) \gt 0$, la variable $X^* = \dfrac{X - \Esp(X)}{\sigma(X)}$ est <strong>centrée réduite</strong> : $\Esp(X^*) = 0$, $\Var(X^*) = 1$.</li></ol>`,
      proof: R`<p>1. $\Var(X) = \sum(x_i - m)^2\Proba(X = x_i)$ est une somme de termes positifs ; elle est nulle si et seulement si $\Proba(X = x_i) = 0$ pour tout $x_i \neq m$.</p>
      <p>2. $\Esp(aX + b) = am + b$, donc $(aX + b) - \Esp(aX + b) = a(X - m)$ et $\Var(aX + b) = \Esp(a^2(X - m)^2) = a^2\Var(X)$.</p>
      <p>3. Par 2 et la linéarité : $\Esp(X^*) = \frac{\Esp(X) - m}{\sigma} = 0$ et $\Var(X^*) = \frac{\Var(X)}{\sigma^2} = 1$.</p>` },
    { t: 'thm', title: 'inégalités de Markov et de Bienaymé-Tchebychev', body: R`<ol><li>Si $X \ge 0$ admet une espérance : pour tout $a \gt 0$, $\Proba(X \ge a) \le \dfrac{\Esp(X)}{a}$.</li>
      <li>Si $X$ admet une variance : pour tout $\eps \gt 0$, $\Proba\big(|X - \Esp(X)| \ge \eps\big) \le \dfrac{\Var(X)}{\eps^2}$.</li></ol>`,
      proof: R`<p>1. $\Esp(X) = \sum x_i\Proba(X = x_i) \ge \sum_{x_i \ge a}x_i\Proba(X = x_i) \ge a\sum_{x_i \ge a}\Proba(X = x_i) = a\Proba(X \ge a)$ (on a retiré des termes positifs).</p>
      <p>2. On applique 1 à la variable positive $(X - \Esp(X))^2$ et à $a = \eps^2$, en remarquant que $\{|X - \Esp(X)| \ge \eps\} = \{(X - \Esp(X))^2 \ge \eps^2\}$.</p>` },

    /* ================= Partie 2 ================= */
    { t: 'h', title: 'Lois usuelles discrètes' },
    { t: 'h2', title: 'Loi uniforme' },
    { t: 'def', body: R`<p>$X$ suit la <strong>loi uniforme</strong> sur un ensemble fini $E = \{x_1, \dots, x_n\}$, noté $X \sim \mathcal U(E)$, si $X(\Omega) = E$ et $\Proba(X = x_k) = \dfrac1n$ pour tout $k$.</p>` },
    { t: 'prop', body: R`<p>Si $X \sim \mathcal U(\{1, \dots, n\})$ : $\displaystyle\Esp(X) = \frac{n + 1}{2}$ et $\displaystyle\Var(X) = \frac{n^2 - 1}{12}$.</p>`,
      proof: R`<p>$\Esp(X) = \frac1n\sum_{k=1}^n k = \frac{n+1}2$ et $\Esp(X^2) = \frac1n\sum_{k=1}^n k^2 = \frac{(n+1)(2n+1)}{6}$. Donc $\Var(X) = \frac{(n+1)(2n+1)}6 - \frac{(n+1)^2}4 = \frac{(n+1)\big(2(2n+1) - 3(n+1)\big)}{12} = \frac{(n+1)(n-1)}{12}$.</p>` },
    { t: 'ex', body: R`<p>Résultat d'un dé équilibré : $\Esp(X) = 3{,}5$ et $\Var(X) = \frac{35}{12}$.</p>` },

    { t: 'h2', title: 'Loi de Bernoulli' },
    { t: 'def', body: R`<p>Une <strong>épreuve de Bernoulli</strong> est une expérience à deux issues, « succès » (probabilité $p$) et « échec ». $X$ suit la <strong>loi de Bernoulli</strong> de paramètre $p$, noté $X \sim \mathcal B(p)$, si $X(\Omega) \subset \{0, 1\}$, $\Proba(X = 1) = p$ et $\Proba(X = 0) = q$.</p>` },
    { t: 'prop', body: R`<p>$\Esp(X) = p$ et $\Var(X) = pq$. Pour tout événement $A$, l'<strong>indicatrice</strong> $\mathbb 1_A$ suit la loi $\mathcal B(\Proba(A))$, donc $\Esp(\mathbb 1_A) = \Proba(A)$.</p>`,
      proof: R`<p>$\Esp(X) = 0 \cdot q + 1 \cdot p = p$ ; $X^2 = X$ donc $\Esp(X^2) = p$ et $\Var(X) = p - p^2 = pq$.</p>` },

    { t: 'h2', title: 'Loi binomiale' },
    { t: 'def', body: R`<p>$X$ suit la <strong>loi binomiale</strong> de paramètres $n \in \N^*$ et $p \in [0, 1]$, noté $X \sim \mathcal B(n, p)$, si $X(\Omega) = \{0, \dots, n\}$ et</p>
      $$\Proba(X = k) = \binom nk p^k q^{n-k} \qquad (0 \le k \le n).$$
      <p>Par le binôme de Newton, $\sum_k\binom nk p^kq^{n-k} = (p + q)^n = 1$ : c'est bien une loi.</p>` },
    { t: 'thm', title: 'schéma de Bernoulli', body: R`<p>On répète $n$ fois, de façon <strong>indépendante</strong>, une épreuve de Bernoulli de paramètre $p$. Le <strong>nombre de succès</strong> $X$ suit la loi $\mathcal B(n, p)$.</p>`,
      proof: R`<p>Notons $S_i$ : « succès à la $i$-ème épreuve ». Pour une partie $J \subset \{1, \dots, n\}$ à $k$ éléments, l'événement « succès exactement aux épreuves de $J$ » est $\bigcap_{i \in J}S_i \cap \bigcap_{i \notin J}\overline{S_i}$, de probabilité $p^kq^{n-k}$ par indépendance mutuelle. $\{X = k\}$ est la réunion disjointe de ces $\binom nk$ événements.</p>` },
    { t: 'prop', body: R`<p>Si $X \sim \mathcal B(n, p)$ : $\Esp(X) = np$ et $\Var(X) = npq$.</p>`,
      proof: R`<p>Formule du pion $k\binom nk = n\binom{n-1}{k-1}$ : $\Esp(X) = \sum_{k=1}^n n\binom{n-1}{k-1}p^kq^{n-k} = np\sum_{j=0}^{n-1}\binom{n-1}{j}p^jq^{n-1-j} = np(p+q)^{n-1} = np$.</p>
      <p>De même $k(k-1)\binom nk = n(n-1)\binom{n-2}{k-2}$ donne $\Esp(X(X-1)) = n(n-1)p^2$. Donc $\Var(X) = \Esp(X(X-1)) + \Esp(X) - \Esp(X)^2 = n(n-1)p^2 + np - n^2p^2 = np(1 - p)$.</p>
      <p>(On retrouvera ces formules en écrivant $X$ comme somme de $n$ variables de Bernoulli indépendantes, partie 4.)</p>` },
    { t: 'ex', body: R`<p>On lance 10 fois une pièce équilibrée. Probabilité d'obtenir exactement 5 piles : $\binom{10}{5}\frac1{2^{10}} = \frac{252}{1024} \approx 0{,}246$.</p>` },

    { t: 'h2', title: 'Loi géométrique' },
    { t: 'def', body: R`<p>$X$ suit la <strong>loi géométrique</strong> de paramètre $p \in ]0, 1]$, noté $X \sim \mathcal G(p)$, si $X(\Omega) = \N^*$ et</p>
      $$\Proba(X = k) = q^{k-1}p \qquad (k \ge 1).$$
      <p>C'est une loi : $\sum_{k \ge 1}q^{k-1}p = \frac{p}{1 - q} = 1$ (série géométrique).</p>` },
    { t: 'thm', body: R`<p>On répète indéfiniment, de façon indépendante, une épreuve de Bernoulli de paramètre $p \gt 0$. Le <strong>rang du premier succès</strong> suit la loi $\mathcal G(p)$.</p>`,
      proof: R`<p>$\{X = k\} = \overline{S_1} \cap \dots \cap \overline{S_{k-1}} \cap S_k$, de probabilité $q^{k-1}p$ par indépendance.</p>` },
    { t: 'prop', body: R`<p>Si $X \sim \mathcal G(p)$ : $\displaystyle\Esp(X) = \frac1p$ et $\displaystyle\Var(X) = \frac{q}{p^2}$.</p>`,
      proof: R`<p>On utilise, pour $|x| \lt 1$, $\sum_{k \ge 1}kx^{k-1} = \frac{1}{(1-x)^2}$ et $\sum_{k \ge 2}k(k-1)x^{k-2} = \frac{2}{(1-x)^3}$ (dérivées de la série géométrique, voir le cours d'analyse). Ainsi $\Esp(X) = p\sum kq^{k-1} = \frac{p}{p^2} = \frac1p$ et $\Esp(X(X-1)) = pq\sum k(k-1)q^{k-2} = \frac{2q}{p^2}$. Donc $\Var(X) = \frac{2q}{p^2} + \frac1p - \frac1{p^2} = \frac{2q + p - 1}{p^2} = \frac{q}{p^2}$.</p>` },
    { t: 'prop', title: 'absence de mémoire', body: R`<p>Si $X \sim \mathcal G(p)$ : $\Proba(X \gt n) = q^n$ pour tout $n \in \N$, et pour tous $n, m \in \N$ :</p>
      $$\Proba(X \gt n + m \mid X \gt n) = \Proba(X \gt m).$$`,
      proof: R`<p>$\{X \gt n\}$ = « les $n$ premières épreuves sont des échecs », de probabilité $q^n$ (ou : $\sum_{k \gt n}q^{k-1}p = q^n$). Comme $\{X \gt n + m\} \subset \{X \gt n\}$ : $\Proba(X \gt n + m \mid X \gt n) = \frac{q^{n+m}}{q^n} = q^m$.</p>` },
    { t: 'rem', body: R`<p>Avoir déjà attendu $n$ épreuves sans succès ne change rien à l'attente restante. On admet que la loi géométrique est la seule loi à valeurs dans $\N^*$ ayant cette propriété.</p>` },

    { t: 'h2', title: 'Loi de Pascal' },
    { t: 'def', body: R`<p>$X$ suit la <strong>loi de Pascal</strong> de paramètres $r \in \N^*$ et $p \in ]0, 1]$ si $X(\Omega) = \{r, r + 1, \dots\}$ et</p>
      $$\Proba(X = k) = \binom{k-1}{r-1}p^rq^{k-r} \qquad (k \ge r).$$
      <p>Pour $r = 1$, c'est la loi géométrique $\mathcal G(p)$.</p>` },
    { t: 'thm', body: R`<p>Dans une suite d'épreuves de Bernoulli indépendantes de paramètre $p$, le <strong>rang du $r$-ième succès</strong> suit la loi de Pascal de paramètres $(r, p)$.</p>`,
      proof: R`<p>$\{X = k\}$ = « exactement $r - 1$ succès lors des $k - 1$ premières épreuves » $\cap$ « succès à la $k$-ième épreuve ». Ces deux événements portent sur des épreuves différentes, donc sont indépendants ; le premier a pour probabilité $\binom{k-1}{r-1}p^{r-1}q^{k-r}$ (loi binomiale $\mathcal B(k-1, p)$), le second $p$.</p>` },
    { t: 'prop', body: R`<p>$\Esp(X) = \dfrac rp$ et $\Var(X) = \dfrac{rq}{p^2}$.</p>`,
      proof: R`<p>$X = T_1 + \dots + T_r$, où $T_j$ est le nombre d'épreuves entre le $(j-1)$-ième succès (exclu) et le $j$-ième (inclus). On admet que les $T_j$ sont indépendantes et de loi $\mathcal G(p)$. La linéarité de l'espérance et l'additivité de la variance pour des variables indépendantes (partie 4) donnent $\Esp(X) = \frac rp$ et $\Var(X) = \frac{rq}{p^2}$.</p>` },
    { t: 'warn', body: R`<p>Certains ouvrages appellent « loi de Pascal » ou « loi binomiale négative » la loi du <strong>nombre d'échecs</strong> avant le $r$-ième succès, c'est-à-dire $X - r$, à valeurs dans $\N$. Vérifier la convention de l'énoncé.</p>` },

    { t: 'h2', title: 'Loi hypergéométrique' },
    { t: 'def', body: R`<p>Une urne contient $N$ boules dont $N_1 = Np$ sont blanches. On tire <strong>simultanément</strong> (ou successivement <strong>sans remise</strong>) $n \le N$ boules et $X$ est le nombre de boules blanches obtenues. Alors $X$ suit la <strong>loi hypergéométrique</strong> $\mathcal H(N, n, p)$ :</p>
      $$\Proba(X = k) = \frac{\binom{N_1}{k}\binom{N - N_1}{n - k}}{\binom Nn} \qquad \text{pour } \max(0, n - N + N_1) \le k \le \min(n, N_1).$$`,
      proof: R`<p>Univers : parties à $n$ boules, $\binom Nn$ issues équiprobables. Un tirage contenant exactement $k$ blanches s'obtient en choisissant $k$ blanches parmi $N_1$ et $n - k$ autres boules parmi $N - N_1$.</p>` },
    { t: 'prop', body: R`<p>Si $X \sim \mathcal H(N, n, p)$ : $\Esp(X) = np$ et $\Var(X) = npq\,\dfrac{N - n}{N - 1}$ (admis).</p>`,
      proof: R`<p>Pour l'espérance : numérotons les blanches de 1 à $N_1$ ; $X = \sum_{i=1}^{N_1}\mathbb 1_{B_i}$ où $B_i$ : « la blanche $i$ est tirée ». $\Proba(B_i) = \binom{N-1}{n-1}/\binom Nn = \frac nN$, donc par linéarité $\Esp(X) = N_1\frac nN = np$.</p>` },
    { t: 'rem', title: 'avec ou sans remise', body: R`<p>Sans remise : $\mathcal H(N, n, p)$ ; avec remise : $\mathcal B(n, p)$. Même espérance $np$, mais la variance est plus faible sans remise. Lorsque $N$ est grand devant $n$, les deux lois sont très proches (on admet que $\mathcal H(N, n, p)$ tend vers $\mathcal B(n, p)$ quand $N \to +\infty$).</p>` },

    { t: 'h2', title: 'Loi de Poisson' },
    { t: 'def', body: R`<p>$X$ suit la <strong>loi de Poisson</strong> de paramètre $\lambda \gt 0$, noté $X \sim \mathcal P(\lambda)$, si $X(\Omega) = \N$ et</p>
      $$\Proba(X = k) = e^{-\lambda}\frac{\lambda^k}{k!} \qquad (k \in \N).$$
      <p>C'est une loi car $\sum_{k \ge 0}\frac{\lambda^k}{k!} = e^\lambda$.</p>` },
    { t: 'prop', body: R`<p>Si $X \sim \mathcal P(\lambda)$ : $\Esp(X) = \Var(X) = \lambda$.</p>`,
      proof: R`<p>$\Esp(X) = \sum_{k \ge 1}k e^{-\lambda}\frac{\lambda^k}{k!} = \lambda e^{-\lambda}\sum_{k \ge 1}\frac{\lambda^{k-1}}{(k-1)!} = \lambda$. De même $\Esp(X(X-1)) = \lambda^2e^{-\lambda}\sum_{k \ge 2}\frac{\lambda^{k-2}}{(k-2)!} = \lambda^2$, donc $\Var(X) = \lambda^2 + \lambda - \lambda^2 = \lambda$.</p>` },
    { t: 'thm', title: 'approximation de la loi binomiale par la loi de Poisson', body: R`<p>Soit $X_n \sim \mathcal B(n, p_n)$ avec $np_n \to \lambda \gt 0$. Alors pour tout $k \in \N$ :</p>
      $$\Proba(X_n = k) \xrightarrow[n \to +\infty]{} e^{-\lambda}\frac{\lambda^k}{k!}.$$`,
      proof: R`<p>Pour $n \ge k$ : $\Proba(X_n = k) = \dfrac{n(n-1)\cdots(n-k+1)}{n^k} \cdot \dfrac{(np_n)^k}{k!} \cdot (1 - p_n)^{n-k}$. Le premier facteur tend vers 1 ($k$ fixé), le deuxième vers $\frac{\lambda^k}{k!}$. Enfin $p_n \to 0$, donc $(n - k)\ln(1 - p_n) \sim -np_n \to -\lambda$ et $(1 - p_n)^{n-k} \to e^{-\lambda}$.</p>` },
    { t: 'rem', body: R`<p>La loi de Poisson modélise le <strong>nombre d'événements rares</strong> survenant dans un intervalle de temps ou d'espace (appels, pannes, clients, fautes de frappe), $\lambda$ étant le nombre moyen. En pratique, on approche $\mathcal B(n, p)$ par $\mathcal P(np)$ lorsque $n$ est grand et $p$ petit.</p>` },

    { t: 'meth', title: 'tableau récapitulatif', body: R`<table class="t"><tr><th>Loi</th><th>$X(\Omega)$</th><th>$\Proba(X = k)$</th><th>$\Esp(X)$</th><th>$\Var(X)$</th></tr>
      <tr><td>$\mathcal U(\{1..n\})$</td><td>$\{1, \dots, n\}$</td><td>$\frac1n$</td><td>$\frac{n+1}2$</td><td>$\frac{n^2-1}{12}$</td></tr>
      <tr><td>$\mathcal B(p)$</td><td>$\{0, 1\}$</td><td>$\Proba(X = 1) = p$</td><td>$p$</td><td>$pq$</td></tr>
      <tr><td>$\mathcal B(n, p)$</td><td>$\{0, \dots, n\}$</td><td>$\binom nk p^kq^{n-k}$</td><td>$np$</td><td>$npq$</td></tr>
      <tr><td>$\mathcal G(p)$</td><td>$\N^*$</td><td>$q^{k-1}p$</td><td>$\frac1p$</td><td>$\frac q{p^2}$</td></tr>
      <tr><td>Pascal $(r, p)$</td><td>$\{r, r+1, \dots\}$</td><td>$\binom{k-1}{r-1}p^rq^{k-r}$</td><td>$\frac rp$</td><td>$\frac{rq}{p^2}$</td></tr>
      <tr><td>$\mathcal H(N, n, p)$</td><td>$\subset \{0, \dots, n\}$</td><td>$\frac{\binom{Np}k\binom{Nq}{n-k}}{\binom Nn}$</td><td>$np$</td><td>$npq\frac{N-n}{N-1}$</td></tr>
      <tr><td>$\mathcal P(\lambda)$</td><td>$\N$</td><td>$e^{-\lambda}\frac{\lambda^k}{k!}$</td><td>$\lambda$</td><td>$\lambda$</td></tr></table>` },

    /* ================= Partie 3 ================= */
    { t: 'h', title: 'Couples de variables aléatoires discrètes' },
    { t: 'h2', title: 'Loi conjointe' },
    { t: 'def', body: R`<p>Soient $X$, $Y$ deux variables discrètes définies sur le même espace, $X(\Omega) = \{x_i\}$, $Y(\Omega) = \{y_j\}$. La <strong>loi conjointe</strong> du couple $(X, Y)$ est la donnée des nombres</p>
      $$p_{ij} = \Proba(X = x_i, Y = y_j) = \Proba\big(\{X = x_i\} \cap \{Y = y_j\}\big).$$
      <p>Les événements $\{X = x_i, Y = y_j\}$ forment un système complet, donc $\sum_{i,j}p_{ij} = 1$.</p>` },
    { t: 'rem', body: R`<p>Lorsque $X$ et $Y$ prennent un nombre fini de valeurs, on présente la loi conjointe dans un <strong>tableau</strong> : une ligne par valeur de $X$, une colonne par valeur de $Y$.</p>` },
    { t: 'ex', body: R`<p>Une urne contient trois boules numérotées 1, 2, 3. On en tire deux successivement sans remise ; $X$ est le premier numéro, $Y$ le second. Les 6 couples $(i, j)$ avec $i \neq j$ sont équiprobables :</p>
      <table class="t"><tr><th>$X \,\backslash\, Y$</th><th>1</th><th>2</th><th>3</th></tr><tr><th>1</th><td>$0$</td><td>$\frac16$</td><td>$\frac16$</td></tr><tr><th>2</th><td>$\frac16$</td><td>$0$</td><td>$\frac16$</td></tr><tr><th>3</th><td>$\frac16$</td><td>$\frac16$</td><td>$0$</td></tr></table>` },

    { t: 'h2', title: 'Lois marginales' },
    { t: 'prop', body: R`<p>Les lois de $X$ et de $Y$, appelées <strong>lois marginales</strong> du couple, s'obtiennent à partir de la loi conjointe :</p>
      $$\Proba(X = x_i) = \sum_j p_{ij}, \qquad \Proba(Y = y_j) = \sum_i p_{ij}.$$`,
      proof: R`<p>$(\{Y = y_j\})_j$ est un système complet : par la formule des probabilités totales, $\Proba(X = x_i) = \sum_j\Proba(\{X = x_i\} \cap \{Y = y_j\})$. De même pour $Y$.</p>` },
    { t: 'rem', body: R`<p>Dans le tableau, on somme chaque <strong>ligne</strong> (loi de $X$) et chaque <strong>colonne</strong> (loi de $Y$) : on écrit les résultats dans les marges, d'où le nom. Dans l'exemple de l'urne, $X$ et $Y$ suivent toutes deux la loi uniforme sur $\{1, 2, 3\}$.</p>` },
    { t: 'warn', body: R`<p>Les lois marginales ne déterminent <strong>pas</strong> la loi conjointe. Si $X \sim \mathcal B(\frac12)$, les couples $(X, X)$ et $(X, 1 - X)$ ont les mêmes lois marginales (Bernoulli de paramètre $\frac12$) mais des lois conjointes différentes : $\Proba(X = 1, X = 1) = \frac12$ alors que $\Proba(X = 1, 1 - X = 1) = 0$.</p>` },

    { t: 'h2', title: 'Fonction d’un couple, espérance' },
    { t: 'prop', body: R`<p>Si $f : \R^2 \to \R$, $Z = f(X, Y)$ est une variable discrète et $\displaystyle\Proba(Z = z) = \sum_{(i,j) \,:\, f(x_i, y_j) = z}p_{ij}$.</p>`,
      proof: R`<p>$\{Z = z\}$ est la réunion disjointe des $\{X = x_i, Y = y_j\}$ pour lesquels $f(x_i, y_j) = z$.</p>` },
    { t: 'thm', title: 'théorème de transfert pour un couple', body: R`<p>Sous réserve de convergence absolue de la série double :</p>
      $$\Esp\big(f(X, Y)\big) = \sum_{i,j}f(x_i, y_j)\,p_{ij}.$$` },
    { t: 'cor', body: R`<ol><li><strong>Linéarité</strong> : si $X$ et $Y$ admettent une espérance, $\Esp(X + Y) = \Esp(X) + \Esp(Y)$.</li><li>$\Esp(XY) = \sum_{i,j}x_iy_j\,p_{ij}$.</li></ol>`,
      proof: R`<p>1. Transfert avec $f(x, y) = x + y$ : $\sum_{i,j}(x_i + y_j)p_{ij} = \sum_i x_i\sum_j p_{ij} + \sum_j y_j\sum_i p_{ij} = \sum_i x_i\Proba(X = x_i) + \sum_j y_j\Proba(Y = y_j)$ (lois marginales). 2. Transfert avec $f(x, y) = xy$.</p>` },
    { t: 'ex', body: R`<p>Le nombre de piles $X$ obtenus en $n$ lancers est la somme des indicatrices $X_i$ (« pile au $i$-ème lancer ») : $\Esp(X) = \sum \Esp(X_i) = np$, sans aucun calcul de loi.</p>` },

    /* ================= Partie 4 ================= */
    { t: 'h', title: 'Lois conditionnelles, indépendance' },
    { t: 'h2', title: 'Lois conditionnelles et théorème de Bayes' },
    { t: 'def', body: R`<p>Soit $y_j$ tel que $\Proba(Y = y_j) \gt 0$. La <strong>loi conditionnelle de $X$ sachant $\{Y = y_j\}$</strong> est la loi de probabilité</p>
      $$x_i \longmapsto \Proba(X = x_i \mid Y = y_j) = \frac{\Proba(X = x_i, Y = y_j)}{\Proba(Y = y_j)} = \frac{p_{ij}}{\Proba(Y = y_j)}.$$
      <p>C'est bien une loi : ces nombres sont positifs, de somme $\frac{\sum_i p_{ij}}{\Proba(Y = y_j)} = 1$.</p>` },
    { t: 'rem', body: R`<p>Dans le tableau : on prend la <strong>colonne</strong> $y_j$ et on la divise par son total. Inversement, la loi conjointe se reconstruit à partir de la loi de $Y$ et des lois conditionnelles : $p_{ij} = \Proba(Y = y_j)\,\Proba(X = x_i \mid Y = y_j)$. C'est ainsi qu'on modélise une expérience en deux temps (on tire $Y$, puis $X$ dépend de $Y$).</p>` },
    { t: 'prop', title: 'probabilités totales', body: R`$$\Proba(X = x_i) = \sum_j\Proba(Y = y_j)\,\Proba(X = x_i \mid Y = y_j).$$`,
      proof: R`<p>Formule des probabilités totales avec le système complet $(\{Y = y_j\})_j$ (les termes avec $\Proba(Y = y_j) = 0$ étant nuls).</p>` },
    { t: 'thm', title: 'théorème de Bayes', body: R`<p>Si $\Proba(X = x_i) \gt 0$ :</p>
      $$\Proba(Y = y_j \mid X = x_i) = \frac{\Proba(Y = y_j)\,\Proba(X = x_i \mid Y = y_j)}{\sum_k\Proba(Y = y_k)\,\Proba(X = x_i \mid Y = y_k)}.$$`,
      proof: R`<p>Formule de Bayes appliquée aux événements $\{Y = y_j\}$ et $\{X = x_i\}$, avec le système complet $(\{Y = y_k\})_k$ au dénominateur.</p>` },
    { t: 'ex', body: R`<p>On lance un dé ; s'il donne $X = k$, on lance $k$ pièces équilibrées et $Y$ est le nombre de piles. Sachant $\{X = k\}$, $Y$ suit la loi $\mathcal B(k, \frac12)$. Donc $\Proba(Y = 0) = \sum_{k=1}^6\frac16 \cdot \frac1{2^k} = \frac16\left(1 - \frac1{64}\right) = \frac{21}{128}$ et, par Bayes, $\Proba(X = 1 \mid Y = 0) = \dfrac{\frac16 \cdot \frac12}{\frac{21}{128}} = \frac{32}{63}$.</p>` },

    { t: 'h2', title: 'Indépendance de variables aléatoires' },
    { t: 'def', body: R`<p>$X$ et $Y$ sont <strong>indépendantes</strong> si pour tous $i, j$ :</p>
      $$\Proba(X = x_i, Y = y_j) = \Proba(X = x_i)\,\Proba(Y = y_j).$$
      <p>On admet que cela équivaut à : $\Proba(X \in A, Y \in B) = \Proba(X \in A)\Proba(Y \in B)$ pour toutes parties $A, B$ de $\R$.</p>` },
    { t: 'prop', body: R`<p>$X$ et $Y$ sont indépendantes si et seulement si, pour tout $y_j$ tel que $\Proba(Y = y_j) \gt 0$, la loi conditionnelle de $X$ sachant $\{Y = y_j\}$ est la loi de $X$.</p>`,
      proof: R`<p>Pour $\Proba(Y = y_j) \gt 0$, l'égalité $p_{ij} = \Proba(X = x_i)\Proba(Y = y_j)$ équivaut à $\Proba(X = x_i \mid Y = y_j) = \Proba(X = x_i)$ ; si $\Proba(Y = y_j) = 0$, les deux membres sont nuls.</p>` },
    { t: 'meth', title: 'tester l’indépendance sur un tableau', body: R`<p>Chaque case doit être égale au <strong>produit</strong> de sa marge-ligne et de sa marge-colonne. Une seule case qui ne convient pas suffit à prouver la non-indépendance ; en particulier, une case nulle alors que les deux marges sont non nulles. Dans l'exemple de l'urne, $\Proba(X = 1, Y = 1) = 0 \neq \frac19$ : $X$ et $Y$ ne sont pas indépendantes.</p>` },
    { t: 'def', title: 'indépendance mutuelle', body: R`<p>$X_1, \dots, X_n$ sont <strong>mutuellement indépendantes</strong> si pour toutes valeurs $a_1, \dots, a_n$ :</p>
      $$\Proba(X_1 = a_1, \dots, X_n = a_n) = \prod_{k=1}^n\Proba(X_k = a_k).$$` },
    { t: 'prop', body: R`<p>(Admis.) Si $X$ et $Y$ sont indépendantes, alors $f(X)$ et $g(Y)$ le sont pour toutes fonctions $f, g$. Plus généralement, des fonctions de paquets disjoints de variables mutuellement indépendantes sont indépendantes (lemme des coalitions).</p>` },
    { t: 'thm', body: R`<p>Si $X$ et $Y$ sont indépendantes et admettent une espérance, alors $XY$ admet une espérance et</p>
      $$\Esp(XY) = \Esp(X)\,\Esp(Y).$$`,
      proof: R`<p>Par transfert et indépendance : $\sum_{i,j}|x_iy_j|\,p_{ij} = \sum_i|x_i|\Proba(X = x_i)\sum_j|y_j|\Proba(Y = y_j) \lt +\infty$, et le même calcul sans valeurs absolues donne $\Esp(XY) = \Esp(X)\Esp(Y)$.</p>` },
    { t: 'def', title: 'covariance', body: R`<p>Si $X$ et $Y$ admettent un moment d'ordre 2, leur <strong>covariance</strong> est</p>
      $$\Cov(X, Y) = \Esp\Big(\big(X - \Esp(X)\big)\big(Y - \Esp(Y)\big)\Big) = \Esp(XY) - \Esp(X)\Esp(Y).$$` },
    { t: 'prop', body: R`<ol><li>$\Var(X + Y) = \Var(X) + \Var(Y) + 2\Cov(X, Y)$.</li><li>Si $X$ et $Y$ sont indépendantes : $\Cov(X, Y) = 0$ et $\Var(X + Y) = \Var(X) + \Var(Y)$.</li><li>Si $X_1, \dots, X_n$ sont mutuellement indépendantes : $\Var(X_1 + \dots + X_n) = \Var(X_1) + \dots + \Var(X_n)$.</li></ol>`,
      proof: R`<p>1. Avec $X' = X - \Esp(X)$ et $Y' = Y - \Esp(Y)$ : $\Var(X + Y) = \Esp((X' + Y')^2) = \Esp(X'^2) + \Esp(Y'^2) + 2\Esp(X'Y')$. La deuxième expression de la covariance s'obtient en développant.</p>
      <p>2. Par le théorème précédent. 3. On développe $\Var(\sum X_k) = \sum\Var(X_k) + 2\sum_{i \lt j}\Cov(X_i, X_j)$, et les covariances sont nulles.</p>` },
    { t: 'warn', title: 'covariance nulle ≠ indépendance', body: R`<p>Soit $X \sim \mathcal U(\{-1, 0, 1\})$ et $Y = X^2$. $\Esp(X) = 0$ et $\Esp(XY) = \Esp(X^3) = 0$, donc $\Cov(X, Y) = 0$. Pourtant $\Proba(X = 0, Y = 1) = 0 \neq \Proba(X = 0)\Proba(Y = 1) = \frac13 \times \frac23$.</p>` },
    { t: 'ex', body: R`<p>Si $X_1, \dots, X_n$ sont indépendantes de loi $\mathcal B(p)$, alors $S = X_1 + \dots + X_n \sim \mathcal B(n, p)$ (schéma de Bernoulli) et l'on retrouve $\Esp(S) = np$, $\Var(S) = npq$.</p>` },

    { t: 'h2', title: 'Loi d’une somme de variables indépendantes' },
    { t: 'prop', body: R`<p>Si $X$ et $Y$ sont indépendantes, à valeurs dans $\N$, alors pour tout $n \in \N$ :</p>
      $$\Proba(X + Y = n) = \sum_{k=0}^n\Proba(X = k)\,\Proba(Y = n - k).$$`,
      proof: R`<p>$\{X + Y = n\} = \bigsqcup_{k=0}^n\big(\{X = k\} \cap \{Y = n - k\}\big)$, puis indépendance.</p>` },
    { t: 'thm', title: 'stabilité', body: R`<ol><li>Si $X \sim \mathcal B(n, p)$ et $Y \sim \mathcal B(m, p)$ sont indépendantes : $X + Y \sim \mathcal B(n + m, p)$.</li><li>Si $X \sim \mathcal P(\lambda)$ et $Y \sim \mathcal P(\mu)$ sont indépendantes : $X + Y \sim \mathcal P(\lambda + \mu)$.</li></ol>`,
      proof: R`<p>1. $\Proba(X + Y = s) = \sum_k\binom nk\binom m{s-k}p^sq^{n+m-s} = \binom{n+m}{s}p^sq^{n+m-s}$ par la formule de Vandermonde.</p>
      <p>2. $\Proba(X + Y = s) = \sum_{k=0}^s e^{-\lambda}\frac{\lambda^k}{k!}e^{-\mu}\frac{\mu^{s-k}}{(s-k)!} = \frac{e^{-(\lambda+\mu)}}{s!}\sum_{k=0}^s\binom sk\lambda^k\mu^{s-k} = e^{-(\lambda+\mu)}\frac{(\lambda + \mu)^s}{s!}$ (binôme de Newton).</p>` }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche                                                               */
  /* ------------------------------------------------------------------ */
  const fiche = [
    { part: '1. Généralités' },
    { k: 'def', t: 'Variable aléatoire, loi',
      hyp: R`$X : \Omega \to \R$, $\{X \in I\}$ <u>événement</u> pour tout intervalle $I$`,
      concl: [R`Loi : $\Proba_X(B) = \Proba(X \in B)$`, R`$F_X(x) = \Proba(X \le x)$ : croissante, continue à droite, limites $0$ et $1$`, R`$\Proba(a \lt X \le b) = F_X(b) - F_X(a)$`] },
    { k: 'prop', t: 'Loi d’une variable discrète', prio: true,
      hyp: R`$X(\Omega) = \{x_i\}$ fini ou dénombrable`,
      concl: [R`Donnée par $X(\Omega)$ et les $\Proba(X = x_i)$, avec <u>$\sum_i\Proba(X = x_i) = 1$</u>`, R`$\Proba(X \in B) = \sum_{x_i \in B}\Proba(X = x_i)$`, R`$\Proba(X = k) = F_X(k) - F_X(k - 1)$ (valeurs entières)`] },
    { k: 'def', t: 'Espérance',
      hyp: R`$\sum x_i\Proba(X = x_i)$ <u>absolument convergente</u>`,
      concl: [R`$\Esp(X) = \sum_i x_i\,\Proba(X = x_i)$`, R`Linéarité : $\Esp(aX + bY + c) = a\Esp(X) + b\Esp(Y) + c$`, R`$X \le Y \Rightarrow \Esp(X) \le \Esp(Y)$`] },
    { k: 'thm', t: 'Transfert', prio: true,
      concl: [R`$\Esp(f(X)) = \sum_i f(x_i)\,\Proba(X = x_i)$`],
      b: R`Sans calculer la loi de $f(X)$.` },
    { k: 'thm', t: 'Variance', prio: true,
      hyp: R`$X$ admet un moment d'ordre 2`,
      concl: [R`$\Var(X) = \Esp\big((X - \Esp X)^2\big) = \Esp(X^2) - \Esp(X)^2$`, R`$\Var(aX + b) = a^2\Var(X)$`, R`$\Var(X) = 0 \iff X$ constante p.s.`] },
    { k: 'thm', t: 'Markov, Bienaymé-Tchebychev',
      concl: [R`$X \ge 0$ : $\Proba(X \ge a) \le \dfrac{\Esp(X)}{a}$`, R`$\Proba(|X - \Esp X| \ge \eps) \le \dfrac{\Var(X)}{\eps^2}$`] },

    { part: '2. Lois usuelles discrètes' },
    { k: 'form', t: 'Uniforme $\\mathcal U(\\{1, \\dots, n\\})$',
      concl: [R`$\Proba(X = k) = \frac1n$`, R`$\Esp = \frac{n+1}2$, $\Var = \frac{n^2 - 1}{12}$`] },
    { k: 'form', t: 'Bernoulli $\\mathcal B(p)$',
      hyp: R`Deux issues, $\Proba(X = 1) = p$`,
      concl: [R`$\Esp = p$, $\Var = pq$`, R`$\mathbb 1_A \sim \mathcal B(\Proba(A))$`] },
    { k: 'form', t: 'Binomiale $\\mathcal B(n, p)$', prio: true,
      hyp: R`<u>Nombre de succès</u> en $n$ épreuves de Bernoulli <u>indépendantes</u>`,
      concl: [R`$\Proba(X = k) = \binom nk p^kq^{n-k}$, $0 \le k \le n$`, R`$\Esp = np$, $\Var = npq$`] },
    { k: 'form', t: 'Géométrique $\\mathcal G(p)$', prio: true,
      hyp: R`<u>Rang du premier succès</u>`,
      concl: [R`$\Proba(X = k) = q^{k-1}p$, $k \ge 1$ ; $\Proba(X \gt n) = q^n$`, R`$\Esp = \frac1p$, $\Var = \frac q{p^2}$`, R`Sans mémoire : $\Proba(X \gt n + m \mid X \gt n) = \Proba(X \gt m)$`] },
    { k: 'form', t: 'Pascal $(r, p)$',
      hyp: R`<u>Rang du $r$-ième succès</u>`,
      concl: [R`$\Proba(X = k) = \binom{k-1}{r-1}p^rq^{k-r}$, $k \ge r$`, R`$\Esp = \frac rp$, $\Var = \frac{rq}{p^2}$`] },
    { k: 'form', t: 'Hypergéométrique $\\mathcal H(N, n, p)$',
      hyp: R`$n$ tirages <u>sans remise</u> parmi $N$, dont $Np$ « succès »`,
      concl: [R`$\Proba(X = k) = \dfrac{\binom{Np}k\binom{Nq}{n-k}}{\binom Nn}$`, R`$\Esp = np$, $\Var = npq\frac{N-n}{N-1}$`] },
    { k: 'form', t: 'Poisson $\\mathcal P(\\lambda)$', prio: true,
      hyp: R`Événements <u>rares</u>, $\lambda$ = nombre moyen`,
      concl: [R`$\Proba(X = k) = e^{-\lambda}\dfrac{\lambda^k}{k!}$, $k \in \N$`, R`$\Esp = \Var = \lambda$`, R`$\mathcal B(n, p) \approx \mathcal P(np)$ si $n$ grand, $p$ petit`] },

    { part: '3. Couples de variables discrètes' },
    { k: 'def', t: 'Loi conjointe',
      concl: [R`$p_{ij} = \Proba(X = x_i, Y = y_j)$, $\sum_{i,j}p_{ij} = 1$`] },
    { k: 'prop', t: 'Lois marginales', prio: true,
      concl: [R`$\Proba(X = x_i) = \sum_j p_{ij}$ (somme de la <u>ligne</u>)`, R`$\Proba(Y = y_j) = \sum_i p_{ij}$ (somme de la <u>colonne</u>)`],
      b: R`Les marginales ne déterminent pas la loi conjointe.` },
    { k: 'thm', t: 'Transfert pour un couple',
      concl: [R`$\Esp(f(X, Y)) = \sum_{i,j}f(x_i, y_j)\,p_{ij}$`, R`$\Esp(X + Y) = \Esp(X) + \Esp(Y)$ ; $\Esp(XY) = \sum x_iy_jp_{ij}$`] },

    { part: '4. Lois conditionnelles, indépendance' },
    { k: 'def', t: 'Loi conditionnelle',
      hyp: R`<u>$\Proba(Y = y_j) \gt 0$</u>`,
      concl: [R`$\Proba(X = x_i \mid Y = y_j) = \dfrac{p_{ij}}{\Proba(Y = y_j)}$`, R`$\Proba(X = x_i) = \sum_j\Proba(Y = y_j)\Proba(X = x_i \mid Y = y_j)$`] },
    { k: 'thm', t: 'Bayes',
      concl: [R`$\Proba(Y = y_j \mid X = x_i) = \dfrac{\Proba(Y = y_j)\Proba(X = x_i \mid Y = y_j)}{\sum_k\Proba(Y = y_k)\Proba(X = x_i \mid Y = y_k)}$`] },
    { k: 'def', t: 'Indépendance', prio: true,
      concl: [R`$\Proba(X = x_i, Y = y_j) = \Proba(X = x_i)\Proba(Y = y_j)$ <u>pour tous</u> $i, j$`, R`$\iff$ loi de $X$ sachant $Y = y_j$ = loi de $X$`, R`Alors $f(X)$ et $g(Y)$ indépendantes`] },
    { k: 'prop', t: 'Covariance', prio: true,
      concl: [R`$\Cov(X, Y) = \Esp(XY) - \Esp(X)\Esp(Y)$`, R`$\Var(X + Y) = \Var X + \Var Y + 2\Cov(X, Y)$`, R`Indépendantes $\Rightarrow \Esp(XY) = \Esp X\,\Esp Y$, <u>$\Var(X + Y) = \Var X + \Var Y$</u>`] },
    { k: 'prop', t: 'Somme de variables indépendantes',
      concl: [R`$\Proba(X + Y = n) = \sum_k\Proba(X = k)\Proba(Y = n - k)$`, R`$\mathcal B(n, p) + \mathcal B(m, p) = \mathcal B(n + m, p)$`, R`$\mathcal P(\lambda) + \mathcal P(\mu) = \mathcal P(\lambda + \mu)$`] },
    { k: 'warn', t: 'Pièges',
      concl: [R`Covariance nulle $\not\Rightarrow$ indépendance`, R`Une case nulle avec des marges non nulles : <u>pas</u> indépendantes`, R`Avec remise : binomiale ; sans remise : hypergéométrique`, R`Géométrique : $X \ge 1$ (rang), pas le nombre d'échecs`] }
  ];

  /* ------------------------------------------------------------------ */
  /* Exercices                                                           */
  /* ------------------------------------------------------------------ */
  const exercices = [
    /* ---------- Généralités ---------- */
    {
      id: 'loi-finie', title: 'Une loi finie', diff: 1, gen: 'loiTable',
      enonce: R`<p>$X$ prend les valeurs $-1, 0, 1, 2$ avec les probabilités $0{,}1$, $a$, $0{,}3$, $2a$.</p><ol><li>Déterminer $a$.</li><li>Calculer $\Esp(X)$, $\Esp(X^2)$ et $\Var(X)$.</li><li>Tracer la fonction de répartition de $X$.</li><li>Déterminer la loi de $Y = X^2$.</li></ol>`,
      correction: R`<ol><li>$0{,}4 + 3a = 1$ donc $a = 0{,}2$ : la loi est $(0{,}1 ;\ 0{,}2 ;\ 0{,}3 ;\ 0{,}4)$.</li>
        <li>$\Esp(X) = -0{,}1 + 0 + 0{,}3 + 0{,}8 = 1$. Transfert : $\Esp(X^2) = 0{,}1 + 0 + 0{,}3 + 1{,}6 = 2$. König-Huygens : $\Var(X) = 2 - 1 = 1$.</li>
        <li>$F_X$ est en escalier : $0$ sur $]-\infty, -1[$, $0{,}1$ sur $[-1, 0[$, $0{,}3$ sur $[0, 1[$, $0{,}6$ sur $[1, 2[$, $1$ sur $[2, +\infty[$. Les sauts ont lieu aux valeurs de $X$ et ont pour hauteur les probabilités.</li>
        <li>$Y(\Omega) = \{0, 1, 4\}$ : $\Proba(Y = 0) = 0{,}2$, $\Proba(Y = 1) = \Proba(X = -1) + \Proba(X = 1) = 0{,}4$, $\Proba(Y = 4) = 0{,}4$. On retrouve $\Esp(Y) = 0{,}4 + 1{,}6 = 2 = \Esp(X^2)$.</li></ol>`
    },
    {
      id: 'max-des', title: 'Maximum et minimum de deux dés', diff: 2, gen: 'loiTable',
      enonce: R`<p>On lance deux dés équilibrés ; $M$ est le plus grand résultat, $m$ le plus petit.</p><ol><li>Calculer $\Proba(M \le k)$ puis la loi de $M$ et $\Esp(M)$.</li><li>Calculer $\Proba(m \ge k)$, puis la loi de $m$. En utilisant $M + m$, retrouver $\Esp(m)$.</li></ol>`,
      indication: R`<p>$\{M \le k\}$ = « les deux dés donnent au plus $k$ ». Puis $\Proba(M = k) = \Proba(M \le k) - \Proba(M \le k - 1)$.</p>`,
      correction: R`<ol><li>$\Proba(M \le k) = \frac{k^2}{36}$, donc $\Proba(M = k) = \frac{k^2 - (k-1)^2}{36} = \frac{2k - 1}{36}$ pour $1 \le k \le 6$. $\Esp(M) = \frac1{36}\sum_{k=1}^6 k(2k - 1) = \frac{2 \times 91 - 21}{36} = \frac{161}{36} \approx 4{,}47$.</li>
        <li>$\Proba(m \ge k) = \frac{(7 - k)^2}{36}$, donc $\Proba(m = k) = \Proba(m \ge k) - \Proba(m \ge k + 1) = \frac{(7-k)^2 - (6-k)^2}{36} = \frac{13 - 2k}{36}$. Comme $M + m$ est la somme des deux dés, $\Esp(M) + \Esp(m) = 7$ par linéarité, donc $\Esp(m) = 7 - \frac{161}{36} = \frac{91}{36}$.</li></ol>`
    },
    {
      id: 'sans-esperance', title: 'Une variable sans espérance', diff: 2,
      enonce: R`<p>Pour $k \in \N^*$, on pose $p_k = \frac{1}{k(k+1)}$.</p><ol><li>Montrer que $(p_k)$ définit une loi de probabilité sur $\N^*$.</li><li>Soit $X$ de loi $\Proba(X = k) = p_k$. Calculer $\Proba(X \ge n)$.</li><li>$X$ admet-elle une espérance ?</li></ol>`,
      correction: R`<ol><li>$p_k \ge 0$ et $p_k = \frac1k - \frac1{k+1}$ : $\sum_{k=1}^N p_k = 1 - \frac1{N+1} \to 1$.</li>
        <li>$\Proba(X \ge n) = \sum_{k \ge n}\left(\frac1k - \frac1{k+1}\right) = \frac1n$ (télescopage).</li>
        <li>$kp_k = \frac1{k+1}$ : la série harmonique diverge, donc $X$ n'admet pas d'espérance, bien que $X$ soit finie.</li></ol>`
    },
    {
      id: 'inegalites', title: 'Markov et Bienaymé-Tchebychev', diff: 2, gen: 'binomiale',
      enonce: R`<p>On lance 100 fois une pièce équilibrée ; $X$ est le nombre de piles.</p><ol><li>Majorer $\Proba(X \ge 75)$ par l'inégalité de Markov.</li><li>Majorer $\Proba(|X - 50| \ge 10)$ par l'inégalité de Bienaymé-Tchebychev. En déduire une minoration de $\Proba(40 \lt X \lt 60)$.</li></ol>`,
      correction: R`<p>$X \sim \mathcal B(100, \frac12)$ : $\Esp(X) = 50$, $\Var(X) = 25$.</p>
        <ol><li>$X \ge 0$ : $\Proba(X \ge 75) \le \frac{50}{75} = \frac23$ (majoration très grossière).</li>
        <li>$\Proba(|X - 50| \ge 10) \le \frac{25}{10^2} = \frac14$. Le contraire est $\{|X - 50| \lt 10\} = \{40 \lt X \lt 60\}$, de probabilité au moins $\frac34$.</li></ol>`
    },

    /* ---------- Lois usuelles ---------- */
    {
      id: 'qcm', title: 'Répondre au hasard à un QCM', diff: 1, gen: 'binomiale',
      enonce: R`<p>Un QCM comporte 10 questions, chacune avec 4 réponses dont une seule est juste. Un candidat répond au hasard. Il est reçu s'il a au moins 5 bonnes réponses. Quelle est sa probabilité d'être reçu ? Combien de bonnes réponses obtient-il en moyenne ?</p>`,
      correction: R`<p>Les réponses sont indépendantes, chacune juste avec probabilité $\frac14$ : le nombre $X$ de bonnes réponses suit $\mathcal B(10, \frac14)$.</p>
        <p>$\Proba(X \ge 5) = \sum_{k=5}^{10}\binom{10}{k}\frac{3^{10-k}}{4^{10}} = \frac{61\,236 + 17\,010 + 3\,240 + 405 + 30 + 1}{1\,048\,576} = \frac{81\,922}{1\,048\,576} \approx 0{,}078$.</p>
        <p>En moyenne : $\Esp(X) = 10 \times \frac14 = 2{,}5$ bonnes réponses (écart-type $\sqrt{1{,}875} \approx 1{,}37$).</p>`
    },
    {
      id: 'moments-binomiale', title: 'Espérance et variance de la loi binomiale', diff: 2, gen: 'binomiale',
      enonce: R`<p>Soit $X \sim \mathcal B(n, p)$. En dérivant $f(x) = (px + q)^n = \sum_k\binom nk p^kq^{n-k}x^k$, retrouver $\Esp(X)$ et $\Esp(X(X-1))$, puis $\Var(X)$.</p>`,
      correction: R`<p>$f'(x) = np(px + q)^{n-1} = \sum_k k\binom nk p^kq^{n-k}x^{k-1}$, donc $f'(1) = np = \Esp(X)$.</p>
        <p>$f''(x) = n(n-1)p^2(px + q)^{n-2} = \sum_k k(k-1)\binom nkp^kq^{n-k}x^{k-2}$, donc $\Esp(X(X-1)) = f''(1) = n(n-1)p^2$.</p>
        <p>$\Var(X) = \Esp(X(X-1)) + \Esp(X) - \Esp(X)^2 = n(n-1)p^2 + np - n^2p^2 = np(1 - p)$.</p>`
    },
    {
      id: 'premier-six', title: 'Attendre le premier 6', diff: 2, gen: 'geometrique',
      enonce: R`<p>On lance un dé équilibré jusqu'à obtenir 6 ; $X$ est le nombre de lancers.</p><ol><li>Loi, espérance et variance de $X$.</li><li>Probabilité qu'il faille plus de 10 lancers.</li><li>Probabilité que $X$ soit pair.</li></ol>`,
      correction: R`<ol><li>Rang du premier succès dans des épreuves indépendantes de paramètre $\frac16$ : $X \sim \mathcal G(\frac16)$, $\Esp(X) = 6$, $\Var(X) = \frac{5/6}{1/36} = 30$.</li>
        <li>$\Proba(X \gt 10) = \left(\frac56\right)^{10} \approx 0{,}162$.</li>
        <li>$\Proba(X \in 2\N^*) = \sum_{j \ge 1}q^{2j-1}p = \frac{pq}{1 - q^2} = \frac{q}{1 + q} = \frac{5/6}{11/6} = \frac5{11}$.</li></ol>`
    },
    {
      id: 'standard', title: 'Appels à un standard', diff: 1, gen: 'poisson',
      enonce: R`<p>Le nombre $X$ d'appels reçus par un standard en une minute suit la loi $\mathcal P(2)$.</p><ol><li>Probabilité de ne recevoir aucun appel ? au moins 3 appels ?</li><li>Montrer que $\Proba(X \text{ pair}) = \frac{1 + e^{-4}}2$.</li></ol>`,
      correction: R`<ol><li>$\Proba(X = 0) = e^{-2} \approx 0{,}135$. $\Proba(X \ge 3) = 1 - e^{-2}\left(1 + 2 + \frac{2^2}{2}\right) = 1 - 5e^{-2} \approx 0{,}323$.</li>
        <li>$\Proba(X \text{ pair}) = e^{-2}\sum_{k}\frac{2^{2k}}{(2k)!} = e^{-2}\cosh 2 = e^{-2}\,\frac{e^2 + e^{-2}}{2} = \frac{1 + e^{-4}}2 \approx 0{,}509$.</li></ol>`
    },
    {
      id: 'controle-lot', title: 'Contrôle d’un lot (sans remise)', diff: 2, gen: 'hypergeo',
      enonce: R`<p>Un lot de 20 pièces contient 4 pièces défectueuses. On en prélève 5 au hasard, sans remise ; $X$ est le nombre de pièces défectueuses prélevées. Loi de $X$, $\Proba(X = 0)$, $\Proba(X \ge 2)$ et $\Esp(X)$.</p>`,
      correction: R`<p>$X \sim \mathcal H(20, 5, \frac15)$, $X(\Omega) = \{0, \dots, 4\}$, $\Proba(X = k) = \binom4k\binom{16}{5-k}/\binom{20}5$ avec $\binom{20}5 = 15\,504$.</p>
        <p>$\Proba(X = 0) = \frac{4\,368}{15\,504} = \frac{91}{323} \approx 0{,}282$ ; $\Proba(X = 1) = \frac{4 \times 1\,820}{15\,504} = \frac{455}{969} \approx 0{,}470$ ; donc $\Proba(X \ge 2) = 1 - \frac{273}{969} - \frac{455}{969} = \frac{241}{969} \approx 0{,}249$.</p>
        <p>$\Esp(X) = 5 \times \frac{4}{20} = 1$.</p>`
    },
    {
      id: 'deuxieme-six', title: 'Attendre le deuxième 6 (loi de Pascal)', diff: 2, gen: 'reconnaitre',
      enonce: R`<p>On lance un dé équilibré jusqu'à obtenir 6 pour la deuxième fois ; $X$ est le nombre de lancers. Déterminer la loi de $X$, $\Proba(X = 3)$, $\Esp(X)$ et $\Var(X)$.</p>`,
      correction: R`<p>$\{X = k\}$ = « exactement un 6 lors des $k - 1$ premiers lancers » et « 6 au $k$-ième » : $\Proba(X = k) = (k - 1)\frac16\left(\frac56\right)^{k-2}\frac16$ pour $k \ge 2$. C'est la loi de Pascal de paramètres $(2, \frac16)$.</p>
        <p>$\Proba(X = 3) = 2 \times \frac1{36} \times \frac56 = \frac5{108}$. $\Esp(X) = \frac{2}{1/6} = 12$ et $\Var(X) = \frac{2 \times 5/6}{1/36} = 60$.</p>`
    },
    {
      id: 'reconnaitre-lois', title: 'Reconnaître la loi', diff: 1, gen: 'reconnaitre',
      enonce: R`<p>Donner la loi de $X$ dans chaque cas : a) nombre de garçons dans une famille de 4 enfants (sexes indépendants, équiprobables) ; b) nombre de cartes tirées (avec remise) d'un jeu de 32 jusqu'à obtenir un as ; c) nombre de rois dans une main de 5 cartes d'un jeu de 32 ; d) nombre de coquilles dans un livre de 300 pages, chaque page en contenant une avec probabilité $0{,}01$ indépendamment.</p>`,
      correction: R`<ul><li>a) $\mathcal B(4, \frac12)$.</li><li>b) $\mathcal G(\frac18)$ (rang du premier succès, avec remise).</li><li>c) $\mathcal H(32, 5, \frac18)$ (tirage simultané).</li><li>d) $\mathcal B(300;\ 0{,}01)$, bien approchée par $\mathcal P(3)$ ($n$ grand, $p$ petit).</li></ul>`
    },
    {
      id: 'anniversaire-poisson', title: 'Approximation par une loi de Poisson', diff: 3, gen: 'poisson',
      enonce: R`<p>Dans un amphithéâtre de 500 étudiants, $X$ est le nombre d'étudiants dont c'est l'anniversaire aujourd'hui (365 jours équiprobables, indépendance).</p><ol><li>Loi de $X$ ? Calculer $\Proba(X = 0)$.</li><li>Par quelle loi peut-on l'approcher ? Comparer.</li><li>Démontrer le théorème d'approximation utilisé.</li></ol>`,
      correction: R`<ol><li>$X \sim \mathcal B(500, \frac1{365})$ et $\Proba(X = 0) = \left(\frac{364}{365}\right)^{500} \approx 0{,}2537$.</li>
        <li>$n$ grand, $p$ petit, $np = \frac{500}{365} \approx 1{,}37$ : $X \approx \mathcal P(1{,}37)$, qui donne $e^{-500/365} \approx 0{,}2541$. L'erreur est de l'ordre de $4 \cdot 10^{-4}$.</li>
        <li>Voir le cours : $\binom nk p_n^k(1 - p_n)^{n-k} = \frac{n(n-1)\cdots(n-k+1)}{n^k}\frac{(np_n)^k}{k!}(1 - p_n)^{n-k} \to e^{-\lambda}\frac{\lambda^k}{k!}$, car $(n - k)\ln(1 - p_n) \sim -np_n \to -\lambda$.</li></ol>`
    },

    /* ---------- Couples ---------- */
    {
      id: 'couple-tableau', title: 'Lire un tableau de loi conjointe', diff: 1, gen: 'couple',
      enonce: R`<p>La loi de $(X, Y)$ est donnée par :</p><table class="t"><tr><th>$X \,\backslash\, Y$</th><th>0</th><th>1</th><th>2</th></tr><tr><th>0</th><td>$0{,}1$</td><td>$0{,}2$</td><td>$0{,}1$</td></tr><tr><th>1</th><td>$0{,}2$</td><td>$0{,}1$</td><td>$0{,}3$</td></tr></table>
        <ol><li>Lois marginales, $\Esp(X)$, $\Esp(Y)$.</li><li>$X$ et $Y$ sont-elles indépendantes ?</li><li>Loi conditionnelle de $X$ sachant $Y = 2$.</li><li>$\Cov(X, Y)$.</li></ol>`,
      correction: R`<ol><li>$X$ : $\Proba(X = 0) = 0{,}4$, $\Proba(X = 1) = 0{,}6$ ; $Y$ : $(0{,}3 ;\ 0{,}3 ;\ 0{,}4)$. $\Esp(X) = 0{,}6$ et $\Esp(Y) = 0{,}3 + 0{,}8 = 1{,}1$.</li>
        <li>$\Proba(X = 0, Y = 0) = 0{,}1 \neq 0{,}4 \times 0{,}3 = 0{,}12$ : non indépendantes.</li>
        <li>On divise la colonne $Y = 2$ par son total $0{,}4$ : $\Proba(X = 0 \mid Y = 2) = \frac14$, $\Proba(X = 1 \mid Y = 2) = \frac34$.</li>
        <li>$\Esp(XY) = 1 \times 1 \times 0{,}1 + 1 \times 2 \times 0{,}3 = 0{,}7$, donc $\Cov(X, Y) = 0{,}7 - 0{,}6 \times 1{,}1 = 0{,}04$.</li></ol>`
    },
    {
      id: 'urne-avec-sans', title: 'Deux tirages, avec ou sans remise', diff: 2, gen: 'couple',
      enonce: R`<p>Une urne contient trois boules numérotées 1, 2, 3. On tire deux boules ; $X$ est le premier numéro, $Y$ le second, $M = \max(X, Y)$.</p><ol><li>Avec remise : loi conjointe, indépendance, loi de $M$ et $\Esp(M)$.</li><li>Sans remise : mêmes questions.</li></ol>`,
      correction: R`<ol><li>Les 9 couples sont équiprobables : $p_{ij} = \frac19 = \frac13 \times \frac13$, donc $X$ et $Y$ sont indépendantes (uniformes sur $\{1, 2, 3\}$). $\Proba(M = 1) = \frac19$, $\Proba(M = 2) = \frac39$ (couples $(1,2), (2,1), (2,2)$), $\Proba(M = 3) = \frac59$. $\Esp(M) = \frac{1 + 6 + 15}9 = \frac{22}9$.</li>
        <li>Les 6 couples $(i, j)$, $i \neq j$, sont équiprobables (tableau du cours) ; les marginales sont encore uniformes, mais $\Proba(X = 1, Y = 1) = 0 \neq \frac19$ : non indépendantes. $\Proba(M = 2) = \frac26$, $\Proba(M = 3) = \frac46$, $\Esp(M) = \frac{4 + 12}{6} = \frac83$.</li></ol>`
    },
    {
      id: 'min-uniformes', title: 'Minimum de deux variables uniformes', diff: 2,
      enonce: R`<p>$X$ et $Y$ sont indépendantes de loi $\mathcal U(\{1, \dots, n\})$ et $Z = \min(X, Y)$. Calculer $\Proba(Z \ge k)$, puis la loi de $Z$.</p>`,
      correction: R`<p>$\{Z \ge k\} = \{X \ge k\} \cap \{Y \ge k\}$, donc par indépendance $\Proba(Z \ge k) = \left(\frac{n - k + 1}{n}\right)^2$ pour $1 \le k \le n$.</p>
        <p>$\Proba(Z = k) = \Proba(Z \ge k) - \Proba(Z \ge k + 1) = \frac{(n - k + 1)^2 - (n - k)^2}{n^2} = \frac{2(n - k) + 1}{n^2}$.</p>`
    },

    /* ---------- Lois conditionnelles, indépendance ---------- */
    {
      id: 'de-pieces', title: 'Un dé, puis des pièces', diff: 2, gen: 'bayesVA',
      enonce: R`<p>On lance un dé équilibré ; s'il donne $X = k$, on lance $k$ pièces équilibrées et $Y$ est le nombre de piles obtenus.</p><ol><li>Loi de $Y$ sachant $X = k$.</li><li>Calculer $\Proba(Y = 0)$ et $\Proba(Y = 6)$.</li><li>Sachant qu'on n'a obtenu aucun pile, quelle est la probabilité que le dé ait donné 6 ?</li></ol>`,
      correction: R`<ol><li>$\mathcal B(k, \frac12)$ : $\Proba(Y = j \mid X = k) = \binom kj\frac1{2^k}$.</li>
        <li>$\Proba(Y = 0) = \sum_{k=1}^6\frac16\cdot\frac1{2^k} = \frac16\left(1 - \frac1{64}\right) = \frac{21}{128}$. $\Proba(Y = 6) = \Proba(X = 6)\frac1{2^6} = \frac1{384}$.</li>
        <li>Bayes : $\Proba(X = 6 \mid Y = 0) = \dfrac{\frac16 \cdot \frac1{64}}{\frac{21}{128}} = \frac{1}{63}$.</li></ol>`
    },
    {
      id: 'poisson-filtre', title: 'Clients et achats (Poisson filtré)', diff: 3, gen: 'bayesVA',
      enonce: R`<p>Le nombre $X$ de clients entrant dans une boutique en une heure suit $\mathcal P(\lambda)$. Chaque client achète avec la probabilité $p$, indépendamment des autres ; $Y$ est le nombre d'acheteurs, de sorte que la loi de $Y$ sachant $\{X = n\}$ est $\mathcal B(n, p)$. Montrer que $Y \sim \mathcal P(\lambda p)$.</p>`,
      indication: R`<p>Probabilités totales avec le système complet $(\{X = n\})_{n \ge 0}$, puis reconnaître une série exponentielle.</p>`,
      correction: R`<p>Pour $k \in \N$ : $\Proba(Y = k) = \sum_{n \ge k}\Proba(X = n)\Proba(Y = k \mid X = n) = \sum_{n \ge k}e^{-\lambda}\frac{\lambda^n}{n!}\binom nk p^kq^{n-k}$.</p>
        <p>Comme $\frac1{n!}\binom nk = \frac1{k!(n-k)!}$ : $\Proba(Y = k) = e^{-\lambda}\frac{(\lambda p)^k}{k!}\sum_{n \ge k}\frac{(\lambda q)^{n-k}}{(n-k)!} = e^{-\lambda}\frac{(\lambda p)^k}{k!}e^{\lambda q} = e^{-\lambda p}\frac{(\lambda p)^k}{k!}$.</p>`
    },
    {
      id: 'cov-nulle', title: 'Covariance nulle sans indépendance', diff: 2, gen: 'couple',
      enonce: R`<p>$X$ suit la loi uniforme sur $\{-2, -1, 1, 2\}$ et $Y = X^2$. Calculer $\Cov(X, Y)$. $X$ et $Y$ sont-elles indépendantes ?</p>`,
      correction: R`<p>$\Esp(X) = 0$ (loi symétrique) et $\Esp(XY) = \Esp(X^3) = \frac{-8 - 1 + 1 + 8}{4} = 0$, donc $\Cov(X, Y) = 0$.</p>
        <p>Mais $\Proba(X = 1, Y = 4) = 0$ alors que $\Proba(X = 1)\Proba(Y = 4) = \frac14 \times \frac12 \neq 0$ : $X$ et $Y$ ne sont pas indépendantes ($Y$ est même une fonction de $X$).</p>`
    },
    {
      id: 'somme-des', title: 'Somme de deux dés', diff: 1, gen: 'somme',
      enonce: R`<p>$X$ et $Y$ sont les résultats de deux dés équilibrés indépendants, $S = X + Y$. Déterminer la loi de $S$, $\Esp(S)$ et $\Var(S)$.</p>`,
      correction: R`<p>$\Proba(S = s) = \sum_k\Proba(X = k)\Proba(Y = s - k) = \frac{\text{nombre de } k \in \{1..6\} \text{ avec } 1 \le s - k \le 6}{36} = \frac{6 - |s - 7|}{36}$ pour $2 \le s \le 12$.</p>
        <p>$\Esp(S) = 3{,}5 + 3{,}5 = 7$ (linéarité) et, par indépendance, $\Var(S) = \frac{35}{12} + \frac{35}{12} = \frac{35}{6}$.</p>`
    },
    {
      id: 'somme-poisson', title: 'Somme de deux lois de Poisson', diff: 3, gen: 'somme',
      enonce: R`<p>$X \sim \mathcal P(\lambda)$ et $Y \sim \mathcal P(\mu)$ sont indépendantes, $S = X + Y$.</p><ol><li>Montrer que $S \sim \mathcal P(\lambda + \mu)$.</li><li>Déterminer la loi conditionnelle de $X$ sachant $\{S = n\}$.</li></ol>`,
      correction: R`<ol><li>Voir le cours : $\Proba(S = n) = \sum_{k=0}^n e^{-\lambda}\frac{\lambda^k}{k!}e^{-\mu}\frac{\mu^{n-k}}{(n-k)!} = e^{-(\lambda + \mu)}\frac{(\lambda + \mu)^n}{n!}$.</li>
        <li>Pour $0 \le k \le n$ : $\Proba(X = k \mid S = n) = \dfrac{\Proba(X = k)\Proba(Y = n - k)}{\Proba(S = n)} = \binom nk\dfrac{\lambda^k\mu^{n-k}}{(\lambda + \mu)^n}$ : c'est la loi $\mathcal B\!\left(n, \frac{\lambda}{\lambda + \mu}\right)$.</li></ol>`
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiches méthodes                                                     */
  /* ------------------------------------------------------------------ */
  const methodes = [
    {
      title: 'Déterminer la loi d’une variable', gen: 'loiTable',
      cas: R`« Déterminer la loi de $X$ »`, debut: R`Écrire <b>$X(\Omega)$</b>, puis calculer <b>$\Proba(X = k)$</b> pour chaque $k$, et vérifier que la somme vaut 1.`,
      quand: R`<p>Toute variable définie par une expérience (somme, maximum, nombre de…, rang de…).</p>`,
      etapes: [
        R`Lister les valeurs possibles $X(\Omega)$.`,
        R`Décrire l'événement $\{X = k\}$ par une phrase, puis avec des événements simples.`,
        R`Calculer sa probabilité (dénombrement, indépendance, probabilités totales). Pour un max ou un min, passer par $\Proba(X \le k)$ ou $\Proba(X \ge k)$.`,
        R`Vérifier $\sum_k\Proba(X = k) = 1$.`
      ],
      exemple: {
        enonce: R`<p>On tire 2 boules simultanément parmi 5 numérotées de 1 à 5 ; $X$ est le plus grand numéro. Loi de $X$ ?</p>`,
        solution: R`<p>$X(\Omega) = \{2, 3, 4, 5\}$ ; $\{X = k\}$ : la boule $k$ et une boule parmi les $k - 1$ plus petites. $\Proba(X = k) = \frac{k-1}{\binom52} = \frac{k - 1}{10}$ ; somme $\frac{1 + 2 + 3 + 4}{10} = 1$.</p>`
      },
      pieges: [R`Oublier des valeurs de $X(\Omega)$ (vérifier la somme !).`]
    },
    {
      title: 'Calculer une espérance et une variance', gen: 'loiTable',
      cas: R`« Calculer $\Esp(X)$, $\Var(X)$ »`, debut: R`Loi usuelle → <b>formule du cours</b> ; sinon <b>transfert</b> pour $\Esp(X^2)$ et <b>König-Huygens</b>.`,
      quand: R`<p>Dès qu'on demande une moyenne, une dispersion, ou $\Esp(f(X))$.</p>`,
      etapes: [
        R`Si $X$ suit une loi usuelle, utiliser directement le tableau ($np$, $\frac1p$, $\lambda$…).`,
        R`Si $X$ est une <strong>somme</strong> (d'indicatrices, de variables simples), utiliser la <strong>linéarité</strong> ; pour la variance, l'indépendance.`,
        R`Sinon : $\Esp(X) = \sum x_i\Proba(X = x_i)$, puis $\Esp(X^2) = \sum x_i^2\Proba(X = x_i)$ (transfert).`,
        R`$\Var(X) = \Esp(X^2) - \Esp(X)^2$ ; contrôler que le résultat est positif.`
      ],
      exemple: {
        enonce: R`<p>On lance $n$ dés ; $X$ est le nombre de valeurs de $\{1, \dots, 6\}$ qui n'apparaissent pas. Calculer $\Esp(X)$.</p>`,
        solution: R`<p>$X = \sum_{v=1}^6\mathbb 1_{A_v}$ où $A_v$ : « $v$ n'apparaît pas », $\Proba(A_v) = \left(\frac56\right)^n$. Linéarité : $\Esp(X) = 6\left(\frac56\right)^n$, sans connaître la loi de $X$.</p>`
      },
      pieges: [R`Écrire $\Esp(X^2) = \Esp(X)^2$.`, R`$\Var(X + Y) = \Var X + \Var Y$ sans indépendance.`]
    },
    {
      title: 'Reconnaître une loi usuelle', gen: 'reconnaitre',
      cas: R`Une situation concrète : lancers, tirages, attentes, événements rares`, debut: R`Que compte $X$ ? <b>nombre de succès</b> (binomiale, hypergéométrique) ou <b>rang</b> d'un succès (géométrique, Pascal) ?`,
      quand: R`<p>Avant tout calcul : reconnaître une loi donne immédiatement $\Proba(X = k)$, $\Esp(X)$, $\Var(X)$.</p>`,
      etapes: [
        R`Identifier l'épreuve élémentaire et le « succès » (probabilité $p$).`,
        R`Nombre d'épreuves <strong>fixé</strong> et on compte les succès : $\mathcal B(n, p)$ si indépendance (avec remise), $\mathcal H(N, n, p)$ si tirage sans remise.`,
        R`On <strong>attend</strong> un succès : $\mathcal G(p)$ (premier), Pascal $(r, p)$ ($r$-ième).`,
        R`Événements rares avec une moyenne $\lambda$ : $\mathcal P(\lambda)$. Issues équiprobables : loi uniforme.`
      ],
      exemple: {
        enonce: R`<p>On tire avec remise dans un jeu de 32 cartes jusqu'à obtenir un cœur. Loi du nombre de tirages ?</p>`,
        solution: R`<p>Rang du premier succès, épreuves indépendantes de paramètre $\frac14$ : $\mathcal G(\frac14)$, espérance 4.</p>`
      },
      pieges: [R`Confondre « nombre de succès » (binomiale) et « nombre d'épreuves jusqu'au succès » (géométrique).`]
    },
    {
      title: 'Calculs avec la loi binomiale ou géométrique', gen: 'binomiale',
      cas: R`$\Proba(X \ge 1)$, $\Proba(X \le k)$, $\Proba(X \gt n)$`, debut: R`<b>Complémentaire</b> : $\Proba(X \ge 1) = 1 - q^n$ ; géométrique : $\Proba(X \gt n) = q^n$.`,
      quand: R`<p>Questions « au moins », « au plus », « plus de $n$ essais ».</p>`,
      etapes: [
        R`Binomiale : $\Proba(X \ge k)$ avec $k$ petit → $1 - \sum_{j \lt k}\Proba(X = j)$.`,
        R`Géométrique : $\{X \gt n\}$ = « $n$ échecs », probabilité $q^n$ ; $\Proba(X \le n) = 1 - q^n$.`,
        R`Conditionnement « sachant $X \gt n$ » : utiliser l'absence de mémoire.`
      ],
      exemple: {
        enonce: R`<p>$X \sim \mathcal G(0{,}2)$. Calculer $\Proba(3 \lt X \le 6)$.</p>`,
        solution: R`<p>$\Proba(X \gt 3) - \Proba(X \gt 6) = 0{,}8^3 - 0{,}8^6 = 0{,}512 - 0{,}262\,144 = 0{,}249\,856$.</p>`
      }
    },
    {
      title: 'Calculs avec la loi de Poisson', gen: 'poisson',
      cas: R`$X \sim \mathcal P(\lambda)$, sommes $\sum_k \frac{\lambda^k}{k!}\cdots$`, debut: R`Faire apparaître la <b>série exponentielle</b> $\sum\frac{\lambda^k}{k!} = e^\lambda$ (décaler l'indice).`,
      quand: R`<p>Calculs de probabilités, d'espérances $\Esp(f(X))$, de lois conditionnelles avec une loi de Poisson.</p>`,
      etapes: [
        R`Écrire $\Proba(X = k) = e^{-\lambda}\frac{\lambda^k}{k!}$.`,
        R`Pour $\Esp(f(X))$ : transfert, puis simplifier $\frac{k}{k!} = \frac1{(k-1)!}$ et réindexer.`,
        R`Reconnaître $e^\lambda$, $\cosh\lambda$ (termes pairs), $\sinh\lambda$ (termes impairs).`
      ],
      exemple: {
        enonce: R`<p>$X \sim \mathcal P(\lambda)$. Calculer $\Esp\left(\frac1{X+1}\right)$.</p>`,
        solution: R`<p>$\sum_k\frac{1}{k+1}e^{-\lambda}\frac{\lambda^k}{k!} = \frac{e^{-\lambda}}{\lambda}\sum_k\frac{\lambda^{k+1}}{(k+1)!} = \frac{e^{-\lambda}}{\lambda}(e^\lambda - 1) = \frac{1 - e^{-\lambda}}{\lambda}$.</p>`
      }
    },
    {
      title: 'Couple : marginales et indépendance', gen: 'couple',
      cas: R`Un tableau de loi conjointe`, debut: R`Sommer <b>lignes et colonnes</b> (marges), puis comparer <b>chaque case</b> au produit des marges.`,
      quand: R`<p>On donne (ou on doit construire) la loi d'un couple $(X, Y)$.</p>`,
      etapes: [
        R`Construire le tableau : $p_{ij} = \Proba(X = x_i, Y = y_j)$ ; vérifier que le total vaut 1.`,
        R`Marges : $\Proba(X = x_i)$ = somme de la ligne, $\Proba(Y = y_j)$ = somme de la colonne.`,
        R`Indépendance : $p_{ij} = \Proba(X = x_i)\Proba(Y = y_j)$ pour <strong>toutes</strong> les cases ; un contre-exemple suffit pour conclure « non ».`,
        R`$\Esp(XY) = \sum x_iy_jp_{ij}$ puis $\Cov(X, Y) = \Esp(XY) - \Esp(X)\Esp(Y)$.`
      ],
      exemple: {
        enonce: R`<p>On lance une pièce deux fois ; $X$ = nombre de piles au 1<sup>er</sup> lancer, $Y$ = nombre total de piles. Indépendantes ?</p>`,
        solution: R`<p>$\Proba(X = 0, Y = 2) = 0$ mais $\Proba(X = 0)\Proba(Y = 2) = \frac12 \cdot \frac14$ : non.</p>`
      },
      pieges: [R`Conclure à l'indépendance en vérifiant une seule case.`, R`Déduire l'indépendance d'une covariance nulle.`]
    },
    {
      title: 'Expérience en deux temps : loi conditionnelle et Bayes', gen: 'bayesVA',
      cas: R`« On tire $X$, puis selon la valeur de $X$… »`, debut: R`Écrire la loi de $Y$ <b>sachant $X = k$</b>, puis <b>probabilités totales</b> sur $(\{X = k\})_k$, puis <b>Bayes</b>.`,
      quand: R`<p>La deuxième variable dépend de la valeur de la première (nombre de lancers, de clients…).</p>`,
      etapes: [
        R`Loi de $X$, puis loi conditionnelle de $Y$ sachant $\{X = k\}$ (souvent une loi usuelle).`,
        R`Loi conjointe : $\Proba(X = k, Y = j) = \Proba(X = k)\Proba(Y = j \mid X = k)$.`,
        R`Loi de $Y$ : $\Proba(Y = j) = \sum_k\Proba(X = k)\Proba(Y = j \mid X = k)$.`,
        R`« Sachant $Y = j$, probabilité que $X = k$ » : Bayes $= \frac{\Proba(X = k, Y = j)}{\Proba(Y = j)}$.`
      ],
      exemple: {
        enonce: R`<p>$X \sim \mathcal U(\{1, 2\})$ ; sachant $X = k$, $Y \sim \mathcal B(k, \frac12)$. Calculer $\Proba(X = 2 \mid Y = 1)$.</p>`,
        solution: R`<p>$\Proba(Y = 1) = \frac12 \cdot \frac12 + \frac12 \cdot \frac12 = \frac12$ et $\Proba(X = 2, Y = 1) = \frac12 \cdot 2 \cdot \frac14 = \frac14$, d'où $\frac{1/4}{1/2} = \frac12$.</p>`
      }
    },
    {
      title: 'Loi d’une somme de variables indépendantes', gen: 'somme',
      cas: R`$S = X + Y$ avec $X$, $Y$ indépendantes`, debut: R`<b>Convolution</b> : $\Proba(S = n) = \sum_k\Proba(X = k)\Proba(Y = n - k)$ ; reconnaître une <b>stabilité</b>.`,
      quand: R`<p>On demande la loi de $X + Y$ (ou de $X_1 + \dots + X_n$).</p>`,
      etapes: [
        R`Déterminer $S(\Omega)$.`,
        R`Écrire $\{S = n\} = \bigsqcup_k\{X = k\} \cap \{Y = n - k\}$ en précisant les bornes de $k$.`,
        R`Utiliser l'indépendance, puis simplifier (Vandermonde, binôme de Newton).`,
        R`Contrôle : $\Esp(S) = \Esp X + \Esp Y$ et $\Var(S) = \Var X + \Var Y$.`
      ],
      exemple: {
        enonce: R`<p>$X, Y$ indépendantes de loi $\mathcal G(p)$. Loi de $X + Y$ ?</p>`,
        solution: R`<p>Pour $n \ge 2$ : $\sum_{k=1}^{n-1}q^{k-1}p\,q^{n-k-1}p = (n-1)p^2q^{n-2}$ : loi de Pascal $(2, p)$.</p>`
      },
      pieges: [R`Oublier les bornes de la somme (il faut $X = k$ et $Y = n - k$ possibles).`]
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche méthode, partie 1 : plan de travail ; partie 2 : cas à reconnaître */
  /* ------------------------------------------------------------------ */
  const plan = {
    etapes: [
      { titre: 'Identifier la variable', faire: R`Dire en une phrase ce que <b>compte ou mesure</b> $X$, et écrire <b>$X(\Omega)$</b>.`,
        questions: [R`$X$ compte-t-elle des <b>succès</b> ou donne-t-elle un <b>rang</b> ?`, R`Tirages <b>avec</b> ou <b>sans</b> remise ?`, R`Plusieurs variables en jeu ?`] },
      { titre: 'Déterminer la loi', faire: R`<b>Reconnaître une loi usuelle</b> (et justifier), sinon calculer $\Proba(X = k)$ pour chaque $k$ ; vérifier que la somme vaut 1.` },
      { titre: 'Calculer espérance et variance', faire: R`Formules du cours, <b>linéarité</b> (sommes d'indicatrices), <b>transfert</b>, <b>König-Huygens</b>.` },
      { titre: 'Traiter plusieurs variables', faire: R`Loi conjointe (tableau), <b>marginales</b>, lois conditionnelles, <b>Bayes</b>, <b>indépendance</b>, loi d'une somme.` },
      { titre: 'Vérifier', faire: R`Somme des probabilités = 1, $\Var \ge 0$, $\Esp(X)$ dans l'intervalle des valeurs ; cohérence avec l'intuition.` }
    ]
  };
  const reperes = [
    { etape: 1, si: R`« Nombre de succès » en $n$ épreuves <b>indépendantes</b> identiques`, alors: R`$\mathcal B(n, p)$.` },
    { etape: 1, si: R`« Nombre de… » dans un tirage <b>sans remise</b> / simultané`, alors: R`$\mathcal H(N, n, p)$.` },
    { etape: 1, si: R`« Nombre d'essais jusqu'à… », « rang du premier… »`, alors: R`$\mathcal G(p)$ ; « jusqu'au $r$-ième » : Pascal $(r, p)$.` },
    { etape: 1, si: R`« En moyenne $\lambda$ par heure / par page », événements rares`, alors: R`$\mathcal P(\lambda)$.` },
    { etape: 2, si: R`$X$ = maximum (ou minimum) de plusieurs variables`, alors: R`Calculer d'abord $\Proba(X \le k)$ (ou $\Proba(X \ge k)$) puis <b>faire la différence</b>.`, ex: R`Max de deux dés : $\frac{k^2 - (k-1)^2}{36}$.` },
    { etape: 2, si: R`Une constante inconnue $a$ dans la loi`, alors: R`Écrire $\sum\Proba(X = x_i) = 1$ (et $a \ge 0$).` },
    { etape: 2, si: R`$Y = f(X)$`, alors: R`$\Proba(Y = y) = \sum_{f(x_i) = y}\Proba(X = x_i)$ : <b>regrouper</b> les valeurs de même image.` },
    { etape: 3, si: R`$X$ est un « nombre de … » compliqué`, alors: R`L'écrire comme <b>somme d'indicatrices</b> et utiliser la linéarité : $\Esp(\mathbb 1_A) = \Proba(A)$.` },
    { etape: 3, si: R`$\Esp(f(X))$ demandé`, alors: R`<b>Transfert</b> : $\sum f(x_i)\Proba(X = x_i)$, sans chercher la loi de $f(X)$.` },
    { etape: 3, si: R`Une série $\sum k\,x^{k-1}$ ou $\sum\frac{\lambda^k}{(k-1)!}$`, alors: R`Dérivée de la série géométrique, ou série exponentielle après <b>décalage d'indice</b>.` },
    { etape: 3, si: R`Majorer $\Proba(|X - \Esp X| \ge \eps)$ ou $\Proba(X \ge a)$`, alors: R`<b>Bienaymé-Tchebychev</b> ou <b>Markov</b>.` },
    { etape: 4, si: R`Un tableau de loi conjointe`, alors: R`Marges = sommes des lignes / colonnes ; indépendance case par case.` },
    { etape: 4, si: R`« Sachant $Y = y$ »`, alors: R`Loi conditionnelle : colonne $y$ divisée par $\Proba(Y = y)$.` },
    { etape: 4, si: R`La loi de $Y$ dépend de la valeur de $X$`, alors: R`Probabilités totales : $\Proba(Y = j) = \sum_k\Proba(X = k)\Proba(Y = j \mid X = k)$, puis Bayes.` },
    { etape: 4, si: R`Loi de $X + Y$ avec $X$, $Y$ indépendantes`, alors: R`Convolution ; binomiales de même $p$ ou Poisson : <b>stabilité</b>.` },
    { etape: 4, si: R`$\Var(X + Y)$`, alors: R`$\Var X + \Var Y + 2\Cov(X, Y)$ ; covariance nulle si indépendantes.` },
    { etape: 5, si: R`Une case nulle dans le tableau, marges non nulles`, alors: R`$X$ et $Y$ <b>ne sont pas</b> indépendantes.` },
    { etape: 5, si: R`Une variance négative`, alors: R`Erreur de calcul : revoir $\Esp(X^2)$ (transfert) et $\Esp(X)^2$.` }
  ];

  L2.chapter('probas', 'va-discretes', {
    intro: R`<p>Une <strong>variable aléatoire</strong> associe un nombre au résultat d'une expérience. On étudie ici celles qui prennent un nombre fini ou dénombrable de valeurs : leur <strong>loi</strong>, leur <strong>espérance</strong> et leur <strong>variance</strong>, les <strong>lois usuelles</strong> (uniforme, Bernoulli, binomiale, géométrique, Pascal, hypergéométrique, Poisson), puis les <strong>couples</strong> de variables : loi conjointe, lois marginales, lois conditionnelles et indépendance.</p>`,
    cours, fiche, exercices, methodes, generateurs, plan, reperes
  });
})();
