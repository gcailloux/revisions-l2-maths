/* Algèbre 3 — Chapitre 1 : Coordonnées, changement de base (projections, symétries) */
(function () {
  'use strict';
  const R = String.raw;
  const { F, gcd, lcm, mat, vec, tuple, lin, kernel, rref, matMul, matVec, inv, det, unimod, subLambda } = ML;

  const B = R`\mathcal{B}`, Bp = R`\mathcal{B}'`;
  const Mat = R`\mathrm{Mat}`;

  /* ------------------------------------------------------------------ */
  /* Outils de génération                                                */
  /* ------------------------------------------------------------------ */
  const pn = x => (F(x).val() < 0 ? '(' + F(x).tex() + ')' : F(x).tex());   // nombre entre parenthèses s'il est négatif
  const col = (M, j) => M.map(r => r[j]);
  const offDiag = M => M.reduce((s, r, i) => s + r.filter((x, j) => j !== i && F(x).val() !== 0).length, 0);
  const maxAbs = M => Math.max(...M.flat().map(x => Math.abs(F(x).val())));
  const toInt = M => M.map(r => r.map(x => F(x).val()));
  const ident = n => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  const nz = v => v.filter(x => x !== 0).length;
  const gcdAll = v => v.reduce((g, x) => gcd(g, x), 0);
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const vectTex = vs => R`\Vect\left(` + vs.map(tuple).join(R`,\,`) + R`\right)`;
  const sumTex = s => s.replace(/\+ -/g, '- ');

  /* Matrice entière de déterminant ±1, petits coefficients, « vraiment » non triviale */
  function niceUnimod(r, n, bound) {
    for (let t = 0; t < 3000; t++) {
      const P = unimod(r, n, n === 2 ? r.int(2, 3) : r.int(3, 5));
      if (maxAbs(P) <= bound && offDiag(P) >= n) return P;
    }
    return n === 2 ? [[1, 2], [1, 1]] : [[1, 1, 0], [0, 1, 1], [1, 1, 1]];
  }
  /* Matrice de fractions écrite « 1/d × matrice entière » */
  function scaledTex(M) {
    const Mf = M.map(r => r.map(x => F(x)));
    const L = Mf.flat().reduce((l, x) => lcm(l, x.d), 1);
    if (L === 1) return mat(Mf);
    return R`\dfrac{1}{${L}}` + mat(Mf.map(r => r.map(x => x.mul(L))));
  }
  /* Combinaison c1 v1 + c2 v2 … écrite avec les vecteurs explicites */
  function combTex(cs, vs) {
    const t = cs.map((c, j) => (c === 0 ? null : (c === 1 ? '' : c === -1 ? '-' : c) + tuple(vs[j]))).filter(Boolean);
    return sumTex(t.join(' + '));
  }
  /* Système (M - λI)X = 0 échelonné : équations lisibles */
  function eqsTex(M, vars) {
    const { R: Rr } = rref(M);
    const eqs = Rr.filter(row => row.some(x => !x.isZero())).map(row => lin(ML.primitive(row), vars) + ' = 0');
    return eqs.length === 1 ? eqs[0] : R`\begin{cases} ${eqs.join(R` \\ `)} \end{cases}`;
  }

  /* ------------------------------------------------------------------ */
  /* Générateurs                                                         */
  /* ------------------------------------------------------------------ */
  const generateurs = {
    coord: {
      title: 'Coordonnées d’un vecteur dans une base', diff: 1,
      make(r) {
        const n = r.chance(0.5) ? 2 : 3;
        const P = niceUnimod(r, n, 3);
        let Xp;
        do { Xp = Array.from({ length: n }, () => r.int(-3, 3)); } while (nz(Xp) < 2);
        const x = matVec(P, Xp);
        const V = Array.from({ length: n }, (_, j) => col(P, j));
        const names = V.map((_, j) => 'v_' + (j + 1));
        const unk = ['a', 'b', 'c'].slice(0, n);
        const Pi = toInt(inv(P));
        const d = det(P);
        const sys = P.map((row, i) => lin(row, unk) + ' = ' + x[i]).join(R` \\ `);
        const base = V.map((v, j) => names[j] + ' = ' + tuple(v)).join(R`,\ `);
        const comb = unk.map((u, i) => u + names[i]).join(' + ');
        const sol = unk.map((u, i) => u + ' = ' + Xp[i]).join(R`,\ `);
        return {
          enonce: R`<p>Dans $\R^${n}$, on pose $${base}$. Montrer que $${Bp} = (${names.join(', ')})$ est une base de $\R^${n}$, puis déterminer les coordonnées du vecteur $x = ${tuple(x)}$ dans $${Bp}$.</p>`,
          indication: R`<p>Écrivez $x = ${comb}$ et identifiez les coordonnées : on obtient un système dont la matrice $P$ a pour colonnes les $v_j$.</p>`,
          correction: R`<p>On cherche ${unk.map(u => '$' + u + '$').join(', ')} tels que $x = ${comb}$. En identifiant les coordonnées :</p>
            $$\begin{cases} ${sys} \end{cases}$$
            <p>La matrice de ce système est $P = ${mat(P)}$ (ses colonnes sont les $v_j$). Elle est inversible ($\det P = ${d} \neq 0$), donc le système a une unique solution pour tout second membre : <strong>$${Bp}$ est une base</strong> de $\R^${n}$. Ici $P^{-1} = ${mat(Pi)}$ et</p>
            $$X' = P^{-1}X = ${mat(Pi)}${vec(x)} = ${vec(Xp)}.$$
            <p><strong>Coordonnées de $x$ dans $${Bp}$ : $${tuple(Xp)}$</strong>, c'est-à-dire $x = ${lin(Xp, names)}$.</p>
            <p><em>Vérification :</em> $${combTex(Xp, V)} = ${tuple(x)}$ ✓.</p>`,
          detail: {
            but: R`<p>Trouver les coordonnées de $x$ dans la base $${Bp}$, après avoir vérifié que c'est une base.</p>`,
            methode: R`<p>Écrire $x$ comme combinaison des $v_j$ : c'est un système de matrice $P$ (colonnes = les $v_j$). $${Bp}$ est une base si et seulement si $P$ est inversible, et alors $X' = P^{-1}X$.</p>`,
            etapes: [
              R`<b>Mise en équation.</b> $x = ${comb}$ donne, coordonnée par coordonnée, $\begin{cases} ${sys} \end{cases}$`,
              R`<b>C'est une base.</b> La matrice du système est $P = ${mat(P)}$, de déterminant $${d} \neq 0$ (ou : l'échelonnement fait apparaître ${n} pivots). Le système a donc une unique solution quel que soit $x$ : la famille est libre et génératrice.`,
              n === 2
                ? R`<b>Inverse de $P$.</b> Pour une matrice $2\times2$ : $\begin{pmatrix} a & b \\ c & d\end{pmatrix}^{-1} = \frac{1}{ad - bc}\begin{pmatrix} d & -b \\ -c & a\end{pmatrix}$, d'où $P^{-1} = ${mat(Pi)}$.`
                : R`<b>Inverse de $P$.</b> Par la méthode de Gauss-Jordan sur $(P \mid I_3)$ : $P^{-1} = ${mat(Pi)}$ (contrôle : $PP^{-1} = I_3$).`,
              R`<b>Résolution.</b> $X' = P^{-1}X = ${vec(Xp)}$, soit $${sol}$. (On peut aussi résoudre le système par substitution.)`,
              R`<b>Vérification.</b> $${combTex(Xp, V)} = ${tuple(x)}$ ✓.`
            ],
            retenir: R`<p>Les coordonnées dans la nouvelle base s'obtiennent par $X' = P^{-1}X$, où $P$ a pour colonnes les nouveaux vecteurs.</p>`
          }
        };
      }
    },

    passage: {
      title: 'Matrice d’un endomorphisme dans une nouvelle base', diff: 2,
      make(r) {
        let Ap;
        const kind = r.pick(['diag', 'diag', 'tri']);
        if (kind === 'diag') {
          const a = r.int(-3, 4); let b;
          do { b = r.int(-3, 4); } while (b === a);
          Ap = [[a, 0], [0, b]];
        } else Ap = [[r.int(-2, 3), r.nz(-2, 2)], [0, r.int(-2, 3)]];
        let P, A;
        for (let t = 0; t < 3000; t++) {
          P = niceUnimod(r, 2, 3);
          A = matMul(matMul(P, Ap), toInt(inv(P)));
          if (maxAbs(A) <= 9 && offDiag(A) === 2) break;
        }
        const Pi = toInt(inv(P)), AP = matMul(A, P), d = det(P);
        const e1 = col(P, 0), e2 = col(P, 1);
        const ctrl = [0, 1].map(j => R`$u(e'_${j + 1}) = A\,e'_${j + 1} = ${tuple(col(AP, j))} = ${sumTex(lin([Ap[0][j], Ap[1][j]], ["e'_1", "e'_2"]))}$`);
        return {
          enonce: R`<p>Soit $u \in \Lin(\R^2)$ de matrice $A = ${mat(A)}$ dans la base canonique $${B} = (e_1, e_2)$. On pose $e'_1 = ${tuple(e1)}$ et $e'_2 = ${tuple(e2)}$.</p>
            <ol><li>Montrer que $${Bp} = (e'_1, e'_2)$ est une base de $\R^2$ et écrire la matrice de passage $P = P_{${B}\to${Bp}}$.</li><li>Calculer $P^{-1}$.</li><li>En déduire $A' = ${Mat}_{${Bp}}(u)$.</li></ol>`,
          indication: R`<p>Les colonnes de $P$ sont les coordonnées de $e'_1$ et $e'_2$ dans $${B}$ ; puis $A' = P^{-1}AP$.</p>`,
          correction: R`<p>1. $P = ${mat(P)}$ (colonnes : coordonnées de $e'_1$, $e'_2$). $\det P = ${d} \neq 0$, donc $(e'_1, e'_2)$ est libre : deux vecteurs libres en dimension 2 forment une base.</p>
            <p>2. $P^{-1} = \dfrac{1}{${d}}${mat([[P[1][1], -P[0][1]], [-P[1][0], P[0][0]]])} = ${mat(Pi)}$.</p>
            <p>3. Formule de changement de base : $A' = P^{-1}AP$. On calcule $AP = ${mat(AP)}$, puis</p>
            $$A' = P^{-1}(AP) = ${mat(Pi)}${mat(AP)} = ${mat(Ap)}.$$
            <p><em>Contrôle direct :</em> ${ctrl.join(' et ')}, ce qui redonne les colonnes de $A'$.${kind === 'diag' ? R` Dans la base $${Bp}$, $u$ multiplie simplement $e'_1$ par $${Ap[0][0]}$ et $e'_2$ par $${Ap[1][1]}$.` : ''}</p>`,
          detail: {
            but: R`<p>Écrire la matrice de $u$ dans la base $${Bp}$ à partir de sa matrice dans la base canonique.</p>`,
            methode: R`<p>Matrice de passage $P = P_{${B}\to${Bp}}$ (colonnes = nouveaux vecteurs exprimés dans l'ancienne base), puis $A' = P^{-1}AP$.</p>`,
            etapes: [
              R`<b>Matrice de passage.</b> On range en colonnes les coordonnées de $e'_1$ et $e'_2$ : $P = ${mat(P)}$.`,
              R`<b>C'est une base.</b> $\det P = ${P[0][0]} \times ${pn(P[1][1])} - ${pn(P[0][1])} \times ${pn(P[1][0])} = ${d} \neq 0$.`,
              R`<b>Inverse.</b> $P^{-1} = \frac{1}{\det P}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix} = ${mat(Pi)}$ ; contrôle : $PP^{-1} = I_2$.`,
              R`<b>Produit $AP$.</b> Ses colonnes sont $Ae'_1$ et $Ae'_2$ : $AP = ${mat(AP)}$.`,
              R`<b>Produit $P^{-1}(AP)$.</b> $A' = ${mat(Ap)}$.`,
              R`<b>Contrôle.</b> ${ctrl.join(' ; ')} : on lit bien les colonnes de $A'$.`
            ],
            retenir: R`<p>$A' = P^{-1}AP$ ; la colonne $j$ de $A'$ contient les coordonnées de $u(e'_j)$ dans la nouvelle base.</p>`
          }
        };
      }
    },

    proj2: {
      title: 'Projection et symétrie dans R² (deux droites)', diff: 1,
      make(r) {
        let u, v, d;
        const norm = w => (w[0] < 0 || (w[0] === 0 && w[1] < 0) ? w.map(x => -x) : w);
        do {
          u = norm([r.int(-3, 3), r.int(-3, 3)]); v = norm([r.int(-3, 3), r.int(-3, 3)]);
          d = u[0] * v[1] - u[1] * v[0];
        } while (d === 0 || Math.abs(d) > 3 || gcdAll(u) !== 1 || gcdAll(v) !== 1 || (nz(u) < 2 && nz(v) < 2));
        let psi = [v[1], -v[0]];
        if (d < 0) { psi = psi.map(x => -x); d = -d; }
        const Pm = [[F(u[0] * psi[0], d), F(u[0] * psi[1], d)], [F(u[1] * psi[0], d), F(u[1] * psi[1], d)]];
        const Sm = Pm.map((row, i) => row.map((x, j) => x.mul(2).sub(i === j ? 1 : 0)));
        const psiTex = lin(psi, ['x', 'y']);
        const alpha = d === 1 ? psiTex : R`\dfrac{${psiTex}}{${d}}`;
        const pxy = Pm.map(row => lin(row, ['x', 'y']));
        const sxy = Sm.map(row => lin(row, ['x', 'y']));
        return {
          enonce: R`<p>Dans $\R^2$, on note $D_1 = \Vect(u)$ et $D_2 = \Vect(v)$ avec $u = ${tuple(u)}$ et $v = ${tuple(v)}$.</p>
            <ol><li>Montrer que $\R^2 = D_1 \oplus D_2$.</li><li>Déterminer la matrice, dans la base canonique, de la projection $p$ sur $D_1$ parallèlement à $D_2$.</li><li>En déduire celle de la symétrie $s$ par rapport à $D_1$ parallèlement à $D_2$.</li></ol>`,
          indication: R`<p>Une équation de $D_2$ est $${psiTex} = 0$. Écrivez $(x, y) = \alpha u + \beta v$ et appliquez cette forme linéaire pour trouver $\alpha$.</p>`,
          correction: R`<p>1. $u$ et $v$ ne sont pas colinéaires ($${u[0]} \times ${pn(v[1])} - ${pn(u[1])} \times ${pn(v[0])} \neq 0$) : $(u, v)$ est une base de $\R^2$, donc $\R^2 = D_1 \oplus D_2$.</p>
            <p>2. Une équation de $D_2$ est $\psi(x, y) = ${psiTex} = 0$, et $\psi(u) = ${d}$. Si $(x, y) = \alpha u + \beta v$, en appliquant $\psi$ (qui s'annule sur $v$) : $\psi(x, y) = ${d === 1 ? '' : d}\alpha$, donc $\alpha = ${alpha}$ et $p(x, y) = \alpha u = \big(${pxy[0]},\ ${pxy[1]}\big)$ :</p>
            $$${Mat}(p) = ${scaledTex(Pm)}.$$
            <p>3. $s = 2p - \Id$ : $s(x, y) = \big(${sxy[0]},\ ${sxy[1]}\big)$ et</p>
            $$${Mat}(s) = ${scaledTex(Sm)}.$$
            <p><em>Contrôles :</em> $p(u) = u$, $p(v) = 0$, $s(u) = u$, $s(v) = -v$.</p>`,
          detail: {
            but: R`<p>Matrices de la projection sur $D_1$ parallèlement à $D_2$ et de la symétrie associée.</p>`,
            methode: R`<p>Décomposer $X = \alpha u + \beta v$ ; une forme linéaire qui <strong>s'annule sur $D_2$</strong> isole $\alpha$. Alors $p(X) = \alpha u$ et $s = 2p - \Id$.</p>`,
            etapes: [
              R`<b>Supplémentaires.</b> Deux droites distinctes de $\R^2$ : $D_1 \cap D_2 = \{0\}$ et $1 + 1 = 2 = \dim \R^2$.`,
              R`<b>Équation de $D_2$.</b> $v = ${tuple(v)}$ vérifie $${psi[0]} \times ${pn(v[0])} + ${pn(psi[1])} \times ${pn(v[1])} = 0$ : $D_2$ a pour équation $\psi(x, y) = ${psiTex} = 0$.`,
              R`<b>Calcul de $\alpha$.</b> $\psi(\alpha u + \beta v) = \alpha\psi(u) + \beta\psi(v) = ${d === 1 ? '' : d}\alpha$, d'où $\alpha = ${alpha}$.`,
              R`<b>Projection.</b> $p(x, y) = \alpha u = \big(${pxy[0]},\ ${pxy[1]}\big)$ ; les colonnes de la matrice sont $p(1, 0)$ et $p(0, 1)$ : $${scaledTex(Pm)}$.`,
              R`<b>Symétrie.</b> $s(X) = \alpha u - \beta v = 2\alpha u - X = 2p(X) - X$, d'où $${Mat}(s) = 2${Mat}(p) - I_2 = ${scaledTex(Sm)}$.`,
              R`<b>Contrôle.</b> $p(u) = u$ (car $\alpha = 1$ pour $X = u$) et $p(v) = 0$ ; on vérifie de même $s(v) = -v$.`
            ],
            retenir: R`<p>Pour projeter parallèlement à $\Ker\psi$ : $p(X) = \dfrac{\psi(X)}{\psi(u)}\,u$. Et toujours $s = 2p - \Id$.</p>`
          }
        };
      }
    },

    projPlan: {
      title: 'Projection sur un plan parallèlement à une droite (R³)', diff: 2,
      make(r) {
        let phi, w, k;
        do {
          phi = [r.int(-2, 2), r.int(-2, 2), r.int(-2, 2)];
          w = [r.int(-2, 2), r.int(-2, 2), r.int(-2, 2)];
          k = dot(phi, w);
        } while (nz(phi) < 2 || nz(w) < 2 || k === 0 || Math.abs(k) > 3 || gcdAll(phi) !== 1 || gcdAll(w) !== 1);
        if (phi.find(x => x !== 0) < 0) { phi = phi.map(x => -x); k = -k; }
        if (k < 0) { w = w.map(x => -x); k = -k; }
        const wphi = w.map(wi => phi.map(pj => wi * pj));
        const Pm = wphi.map((row, i) => row.map((x, j) => F((i === j ? k : 0) - x, k)));
        const Sm = wphi.map((row, i) => row.map((x, j) => F((i === j ? k : 0) - 2 * x, k)));
        const [f1, f2] = kernel([phi]);
        const xyz = ['x', 'y', 'z'];
        const eq = lin(phi, xyz);
        const tTex = k === 1 ? R`\varphi(X)` : R`\dfrac{\varphi(X)}{${k}}`;
        const ft = k === 1 ? '' : R`\frac{1}{${k}}`;
        return {
          enonce: R`<p>Dans $\R^3$, on considère le plan $F : ${eq} = 0$ et la droite $G = \Vect(w)$ avec $w = ${tuple(w)}$.</p>
            <ol><li>Montrer que $\R^3 = F \oplus G$.</li><li>Déterminer la matrice, dans la base canonique, de la projection $p$ sur $F$ parallèlement à $G$.</li><li>Même question pour la symétrie $s$ par rapport à $F$ parallèlement à $G$.</li><li>Donner une base de $\R^3$ dans laquelle les matrices de $p$ et $s$ sont diagonales.</li></ol>`,
          indication: R`<p>Posez $\varphi(x, y, z) = ${eq}$. Écrivez $X = a + tw$ avec $a \in F$ et appliquez $\varphi$ pour trouver $t$.</p>`,
          correction: R`<p>1. Avec $\varphi(x, y, z) = ${eq}$ : $\varphi(w) = ${k} \neq 0$, donc $w \notin F$ et $F \cap G = \{0\}$. De plus $\dim F + \dim G = 2 + 1 = 3$ : $\R^3 = F \oplus G$.</p>
            <p>2. Soit $X \in \R^3$, $X = a + tw$ avec $a \in F$. En appliquant $\varphi$ : $\varphi(X) = 0 + t\varphi(w) = ${k === 1 ? '' : k}t$, donc $t = ${tTex}$ et</p>
            $$p(X) = X - ${tTex}\,w, \qquad ${Mat}(p) = I_3 - ${ft} w\,\varphi = ${scaledTex(Pm)}$$
            <p>où $w\,\varphi$ désigne la matrice $${mat(w.map(x => [x]))}${mat([phi])} = ${mat(wphi)}$.</p>
            <p>3. $s(X) = a - tw = X - 2tw$, donc</p>
            $$${Mat}(s) = I_3 - ${k === 1 ? '2' : R`\frac{2}{${k}}`} w\,\varphi = ${scaledTex(Sm)}.$$
            <p>4. $f_1 = ${tuple(f1)}$ et $f_2 = ${tuple(f2)}$ forment une base de $F$ ; dans la base $(f_1, f_2, w)$, adaptée à $F \oplus G$ :</p>
            $$${Mat}(p) = \begin{pmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 0 \end{pmatrix}, \qquad ${Mat}(s) = \begin{pmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & -1 \end{pmatrix}.$$`,
          detail: {
            but: R`<p>Matrices de la projection et de la symétrie par rapport au plan $F$ parallèlement à la droite $G$.</p>`,
            methode: R`<p>$F = \Ker\varphi$ est un plan, $G = \Vect(w)$ avec $\varphi(w) \neq 0$ : $p(X) = X - \dfrac{\varphi(X)}{\varphi(w)}\,w$ et $s(X) = X - 2\dfrac{\varphi(X)}{\varphi(w)}\,w$.</p>`,
            etapes: [
              R`<b>Supplémentaires.</b> $\varphi(w) = ${sumTex(phi.map((c, i) => c + R` \times ` + pn(w[i])).join(' + '))} = ${k} \neq 0$ : $w \notin F$, donc $F \cap G = \{0\}$ ; et $2 + 1 = 3$.`,
              R`<b>Décomposition.</b> $X = a + tw$ avec $a \in F$ ; $\varphi(a) = 0$ donne $\varphi(X) = ${k === 1 ? '' : k}t$, donc $t = ${tTex}$ et $p(X) = a = X - tw$.`,
              R`<b>Matrice de $p$.</b> $X \mapsto \varphi(X)\,w$ a pour matrice $w\,\varphi = ${mat(wphi)}$ (colonne fois ligne). Donc $${Mat}(p) = I_3 - ${ft} w\,\varphi = ${scaledTex(Pm)}$.`,
              R`<b>Matrice de $s$.</b> $s = 2p - \Id$, soit $${Mat}(s) = ${scaledTex(Sm)}$.`,
              R`<b>Contrôle.</b> $p(w) = 0$ : chaque ligne de $${Mat}(p)$ appliquée à $w$ donne $0$ ; $p(f_1) = f_1$ car $\varphi(f_1) = 0$.`,
              R`<b>Base adaptée.</b> $f_1 = ${tuple(f1)}$, $f_2 = ${tuple(f2)}$ (deux solutions indépendantes de $${eq} = 0$), puis $w$ : matrices $\mathrm{diag}(1, 1, 0)$ et $\mathrm{diag}(1, 1, -1)$.`
            ],
            retenir: R`<p>Projection sur l'hyperplan $\Ker\varphi$ parallèlement à $\Vect(w)$ : $p(X) = X - \frac{\varphi(X)}{\varphi(w)}w$ ; la symétrie double le terme retiré.</p>`
          }
        };
      }
    },

    reconnaitre: {
      title: 'Reconnaître une projection ou une symétrie', diff: 2,
      make(r) {
        const n = r.chance(0.5) ? 2 : 3;
        const sym = r.chance(0.5);
        const D = n === 2 ? (sym ? [1, -1] : [1, 0])
          : (sym ? r.pick([[1, -1, -1], [1, 1, -1]]) : r.pick([[1, 0, 0], [1, 1, 0]]));
        const Dm = D.map((x, i) => D.map((_, j) => (i === j ? x : 0)));
        let M;
        for (let t = 0; t < 3000; t++) {
          const P = niceUnimod(r, n, 2);
          M = matMul(matMul(P, Dm), toInt(inv(P)));
          if (maxAbs(M) <= 6 && offDiag(M) >= n) break;
        }
        const M2 = matMul(M, M);
        const I = ident(n);
        const vars = ['x', 'y', 'z'].slice(0, n);
        const Fk = kernel(subLambda(M, 1));
        const Gm = sym ? subLambda(M, -1) : M;
        const Gk = kernel(Gm);
        const Gname = sym ? R`\Ker(M + I_${n})` : R`\Ker M`;
        const nat = sym ? 'symétrie' : 'projection';
        const verdict = sym
          ? R`$M^2 = I_${n}$ : l'endomorphisme $s$ de $\R^${n}$ canoniquement associé à $M$ vérifie $s \circ s = \Id$, c'est une <strong>symétrie</strong>, par rapport à $F = \Ker(M - I_${n})$ parallèlement à $G = \Ker(M + I_${n})$.`
          : R`$M^2 = M$ : l'endomorphisme $p$ de $\R^${n}$ canoniquement associé à $M$ vérifie $p \circ p = p$, c'est une <strong>projection</strong>, sur $F = \Imm p = \Ker(M - I_${n})$ parallèlement à $G = \Ker M$.`;
        const fTxt = R`$M - I_${n} = ${mat(subLambda(M, 1))}$ ; le système $(M - I_${n})X = 0$ se réduit à $${eqsTex(subLambda(M, 1), vars)}$, d'où $F = ${vectTex(Fk)}$.`;
        const gTxt = R`$${sym ? R`M + I_${n} = ` : ''}${mat(Gm)}$ ; le système se réduit à $${eqsTex(Gm, vars)}$, d'où $G = ${vectTex(Gk)}$.`;
        return {
          enonce: R`<p>Soit $M = ${mat(M)}$. Calculer $M^2$. En déduire la nature de l'endomorphisme de $\R^${n}$ canoniquement associé à $M$ et préciser ses éléments caractéristiques.</p>`,
          indication: R`<p>Si $M^2 = M$, c'est une projection sur $\Ker(M - I)$ parallèlement à $\Ker M$ ; si $M^2 = I$, une symétrie par rapport à $\Ker(M - I)$ parallèlement à $\Ker(M + I)$.</p>`,
          correction: R`<p>$M^2 = ${mat(M2)}$ ${sym ? R`$= I_${n}$` : R`$= M$`}.</p>
            <p>${verdict}</p>
            <ul><li><strong>$F$</strong> : ${fTxt}</li><li><strong>$G$</strong> : ${gTxt}</li></ul>
            <p>Contrôle : $\dim F + \dim G = ${Fk.length} + ${Gk.length} = ${n}$. Dans la base adaptée formée des vecteurs ci-dessus, la matrice est $\mathrm{diag}(${D.slice().sort((a, b) => b - a).join(', ')})$.</p>`,
          detail: {
            but: R`<p>Reconnaître la ${nat} associée à $M$ et trouver ses éléments caractéristiques.</p>`,
            methode: R`<p>Calculer $M^2$. Projection ($M^2 = M$) : sur $\Ker(M - I)$ parallèlement à $\Ker M$. Symétrie ($M^2 = I$) : par rapport à $\Ker(M - I)$ parallèlement à $\Ker(M + I)$.</p>`,
            etapes: [
              R`<b>Calcul de $M^2$.</b> $M^2 = ${mat(M2)}$, ${sym ? R`c'est $I_${n}$` : R`c'est $M$`}.`,
              R`<b>Nature.</b> ${verdict}`,
              R`<b>Calcul de $F$.</b> ${fTxt}`,
              R`<b>Calcul de $G$.</b> ${gTxt}`,
              R`<b>Contrôle.</b> Les dimensions s'ajoutent : $${Fk.length} + ${Gk.length} = ${n}$ ; et par exemple $M${vec(Fk[0])} = ${vec(matVec(M, Fk[0]))}$ ✓.`
            ],
            retenir: R`<p>$M^2 = M$ ou $M^2 = I$ : on reconnaît une projection ou une symétrie ; $F$ est toujours l'ensemble des vecteurs fixes, $\Ker(M - I)$.</p>`
          }
        };
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Cours                                                               */
  /* ------------------------------------------------------------------ */
  const cours = [
    { t: 'p', body: R`<p>Dans tout le chapitre, $\K$ désigne $\R$ ou $\C$ et $E$ un $\K$-espace vectoriel de <strong>dimension finie</strong> $n \ge 1$.</p>` },

    { t: 'h', title: 'Coordonnées' },
    { t: 'h2', title: 'Base et coordonnées d’un vecteur' },
    { t: 'thm', title: 'coordonnées dans une base', body: R`
      <p>Soit $${B} = (e_1, \dots, e_n)$ une base de $E$. Tout vecteur $x \in E$ s'écrit de manière <strong>unique</strong></p>
      $$x = x_1e_1 + x_2e_2 + \dots + x_ne_n, \qquad (x_1, \dots, x_n) \in \K^n.$$
      <p>Les scalaires $x_1, \dots, x_n$ sont les <strong>coordonnées</strong> de $x$ dans $${B}$. On note $${Mat}_{${B}}(x) = \begin{pmatrix} x_1 \\ \vdots \\ x_n \end{pmatrix}$ la colonne des coordonnées.</p>`,
      proof: R`<p><em>Existence</em> : la famille $${B}$ est génératrice. <em>Unicité</em> : si $\sum x_ie_i = \sum y_ie_i$, alors $\sum (x_i - y_i)e_i = 0$ et, la famille étant libre, $x_i = y_i$ pour tout $i$.</p>` },
    { t: 'prop', body: R`<p>L'application $x \mapsto ${Mat}_{${B}}(x)$ est un <strong>isomorphisme</strong> de $E$ sur $\K^n$ : les coordonnées de $\lambda x + \mu y$ sont $\lambda X + \mu Y$.</p>`,
      proof: R`<p>Si $x = \sum x_ie_i$ et $y = \sum y_ie_i$, alors $\lambda x + \mu y = \sum(\lambda x_i + \mu y_i)e_i$ et, par unicité, ce sont les coordonnées de $\lambda x + \mu y$ : l'application est linéaire. Elle est bijective d'après le théorème (à toute colonne correspond un unique vecteur).</p>` },
    { t: 'rem', body: R`
      <ul>
        <li>Une base est une famille <strong>ordonnée</strong> : changer l'ordre des vecteurs permute les coordonnées.</li>
        <li>Dans la base canonique de $\K^n$, les coordonnées de $(x_1, \dots, x_n)$ sont ses composantes. Dans la base canonique $(1, X, \dots, X^n)$ de $\K_n[X]$, ce sont les coefficients du polynôme.</li>
      </ul>` },
    { t: 'ex', body: R`
      <ol>
        <li>Dans $\R^2$, $${Bp} = \big((1, 1), (1, -1)\big)$ est une base et $(x, y) = \frac{x + y}{2}(1, 1) + \frac{x - y}{2}(1, -1)$ : les coordonnées de $(x, y)$ dans $${Bp}$ sont $\left(\frac{x+y}2, \frac{x-y}2\right)$. Pour $(3, 1)$ : $(2, 1)$.</li>
        <li>Dans $\R_2[X]$, la famille $\big(1, X - 1, (X - 1)^2\big)$ est une base (degrés échelonnés). En écrivant $X = (X - 1) + 1$ : $X^2 = (X-1)^2 + 2(X - 1) + 1$, donc les coordonnées de $X^2$ sont $(1, 2, 1)$.</li>
      </ol>` },

    { t: 'h2', title: 'Matrice d’une famille de vecteurs' },
    { t: 'def', body: R`<p>Soit $(v_1, \dots, v_p)$ une famille de vecteurs de $E$. Sa <strong>matrice dans la base $${B}$</strong> est la matrice $${Mat}_{${B}}(v_1, \dots, v_p) \in \M_{n,p}(\K)$ dont la $j$-ème <strong>colonne</strong> contient les coordonnées de $v_j$.</p>` },
    { t: 'prop', body: R`
      <p>Soit $M = ${Mat}_{${B}}(v_1, \dots, v_p)$. Alors :</p>
      <ul>
        <li>$(v_1, \dots, v_p)$ est libre $\iff \rg M = p$ ;</li>
        <li>$(v_1, \dots, v_p)$ est génératrice de $E$ $\iff \rg M = n$ ;</li>
        <li>$(v_1, \dots, v_n)$ ($p = n$) est une <strong>base</strong> de $E$ $\iff M$ est <strong>inversible</strong>.</li>
      </ul>`,
      proof: R`<p>Par l'isomorphisme $x \mapsto ${Mat}_{${B}}(x)$, la famille $(v_j)$ a les mêmes propriétés (liberté, rang) que la famille des colonnes de $M$ dans $\K^n$ ; et le rang de $M$ est le rang de ses colonnes. Pour $p = n$ : base $\iff$ rang $n$ $\iff$ $M$ inversible.</p>` },
    { t: 'meth', body: R`<p>Pour montrer que $n$ vecteurs de $\K^n$ forment une base : on les écrit en colonnes et on vérifie que la matrice est inversible (échelonnement avec $n$ pivots, ou déterminant non nul). En pratique, résoudre $x = \sum a_jv_j$ pour un $x$ quelconque montre en même temps que c'est une base et donne les coordonnées.</p>` },

    { t: 'h2', title: 'Matrice d’une application linéaire' },
    { t: 'def', body: R`
      <p>Soient $E$, $F$ de dimensions $p$ et $n$, $${B} = (e_1, \dots, e_p)$ une base de $E$, $\mathcal{C}$ une base de $F$, et $u \in \Lin(E, F)$. La <strong>matrice de $u$</strong> dans les bases $${B}$ et $\mathcal{C}$ est</p>
      $$${Mat}_{${B},\mathcal{C}}(u) = ${Mat}_{\mathcal{C}}\big(u(e_1), \dots, u(e_p)\big) \in \M_{n,p}(\K) :$$
      <p>la colonne $j$ contient les coordonnées de <strong>$u(e_j)$ dans $\mathcal{C}$</strong>. Si $E = F$ et $${B} = \mathcal{C}$, on note simplement $${Mat}_{${B}}(u)$.</p>` },
    { t: 'prop', body: R`
      <ol>
        <li>Si $A = ${Mat}_{${B},\mathcal{C}}(u)$, $X = ${Mat}_{${B}}(x)$ et $Y = ${Mat}_{\mathcal{C}}(u(x))$, alors <strong>$Y = AX$</strong>.</li>
        <li>$${Mat}_{${B},\mathcal{D}}(v \circ u) = ${Mat}_{\mathcal{C},\mathcal{D}}(v)\;${Mat}_{${B},\mathcal{C}}(u)$.</li>
        <li>$u$ est un isomorphisme $\iff$ sa matrice est inversible, et alors $${Mat}_{\mathcal{C},${B}}(u^{-1}) = ${Mat}_{${B},\mathcal{C}}(u)^{-1}$.</li>
      </ol>`,
      proof: R`<p>1. $u(x) = u\big(\sum_j x_je_j\big) = \sum_j x_j\,u(e_j) = \sum_j x_j\sum_i a_{ij}f_i = \sum_i\big(\sum_j a_{ij}x_j\big)f_i$ : la $i$-ème coordonnée de $u(x)$ est $(AX)_i$.</p>
      <p>2. Pour tout $x$, les coordonnées de $v(u(x))$ sont $B(AX) = (BA)X$ ; en prenant $x = e_j$, les colonnes de la matrice de $v \circ u$ sont celles de $BA$.</p>
      <p>3. Si $u$ est bijective, $u^{-1} \circ u = \Id_E$ et $u \circ u^{-1} = \Id_F$ donnent, par 2., $A'A = I$ et $AA' = I$. Réciproquement, si $A$ est inversible, l'application de matrice $A^{-1}$ est une réciproque de $u$.</p>` },
    { t: 'ex', body: R`<p>La dérivation $D : \R_2[X] \to \R_2[X]$, $P \mapsto P'$ : $D(1) = 0$, $D(X) = 1$, $D(X^2) = 2X$, donc dans la base canonique $${Mat}(D) = \begin{pmatrix} 0 & 1 & 0 \\ 0 & 0 & 2 \\ 0 & 0 & 0 \end{pmatrix}$. Pour $P = 3 - X + 5X^2$ : $\begin{pmatrix} 0 & 1 & 0 \\ 0 & 0 & 2 \\ 0 & 0 & 0 \end{pmatrix}\begin{pmatrix} 3 \\ -1 \\ 5 \end{pmatrix} = \begin{pmatrix} -1 \\ 10 \\ 0 \end{pmatrix}$, et en effet $P' = -1 + 10X$.</p>` },

    { t: 'h', title: 'Changement de base' },
    { t: 'h2', title: 'Matrice de passage' },
    { t: 'def', body: R`
      <p>Soient $${B} = (e_1, \dots, e_n)$ (« ancienne base ») et $${Bp} = (e'_1, \dots, e'_n)$ (« nouvelle base ») deux bases de $E$. La <strong>matrice de passage</strong> de $${B}$ à $${Bp}$ est</p>
      $$P_{${B}\to${Bp}} = ${Mat}_{${B}}(e'_1, \dots, e'_n) :$$
      <p>sa colonne $j$ contient les coordonnées du <strong>nouveau vecteur $e'_j$ dans l'ancienne base</strong>.</p>` },
    { t: 'rem', body: R`<p>Autrement dit, $P_{${B}\to${Bp}} = ${Mat}_{${Bp},${B}}(\Id_E)$ : c'est la matrice de l'identité, avec $${Bp}$ au départ et $${B}$ à l'arrivée (l'ordre est inversé par rapport à la notation $P_{${B}\to${Bp}}$).</p>` },
    { t: 'prop', body: R`
      <ol>
        <li>$P_{${B}\to${Bp}}$ est inversible et $\big(P_{${B}\to${Bp}}\big)^{-1} = P_{${Bp}\to${B}}$.</li>
        <li>Pour trois bases : $P_{${B}\to${B}''} = P_{${B}\to${Bp}}\;P_{${Bp}\to${B}''}$.</li>
      </ol>`,
      proof: R`<p>Avec $P_{${B}\to${Bp}} = ${Mat}_{${Bp},${B}}(\Id)$ et la formule de composition : $P_{${B}\to${Bp}}P_{${Bp}\to${B}''} = ${Mat}_{${Bp},${B}}(\Id)\,${Mat}_{${B}'',${Bp}}(\Id) = ${Mat}_{${B}'',${B}}(\Id \circ \Id) = P_{${B}\to${B}''}$. En prenant $${B}'' = ${B}$ : $P_{${B}\to${Bp}}P_{${Bp}\to${B}} = ${Mat}_{${B}}(\Id) = I_n$.</p>` },
    { t: 'ex', body: R`<p>Dans $\R^2$, de la base canonique $${B}$ à $${Bp} = \big((1, 1), (1, -1)\big)$ : $P = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$ et $P^{-1} = P_{${Bp}\to${B}} = \frac12\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$.</p>` },

    { t: 'h2', title: 'Changement de coordonnées' },
    { t: 'thm', title: 'formule de changement de coordonnées', body: R`
      <p>Soit $P = P_{${B}\to${Bp}}$, et pour $x \in E$, $X = ${Mat}_{${B}}(x)$ (anciennes coordonnées), $X' = ${Mat}_{${Bp}}(x)$ (nouvelles coordonnées). Alors</p>
      $$X = P\,X' \qquad\text{et}\qquad X' = P^{-1}X.$$`,
      proof: R`<p>$x = \sum_j x'_je'_j = \sum_j x'_j\sum_i p_{ij}e_i = \sum_i\big(\sum_j p_{ij}x'_j\big)e_i$, donc $x_i = (PX')_i$. (Ou : $X = ${Mat}_{${Bp},${B}}(\Id)\,X'$.)</p>` },
    { t: 'warn', body: R`<p>La matrice de passage donne les <strong>anciennes</strong> coordonnées en fonction des <strong>nouvelles</strong> : $X = PX'$. Pour obtenir les nouvelles, il faut <strong>inverser</strong> $P$.</p>` },
    { t: 'ex', body: R`<p>Avec $${Bp} = \big((1, 1), (1, -1)\big)$ : $\begin{cases} x = x' + y' \\ y = x' - y'\end{cases}$ et $\begin{cases} x' = \frac{x + y}2 \\ y' = \frac{x - y}2\end{cases}$. La droite d'équation $y = x$ dans $${B}$ a pour équation $y' = 0$ dans $${Bp}$ : c'est l'axe porté par $e'_1 = (1, 1)$. L'hyperbole $xy = 1$ a pour équation $x'^2 - y'^2 = 1$.</p>` },

    { t: 'h2', title: 'Changement de base pour une application linéaire' },
    { t: 'thm', title: 'formule de changement de base', body: R`
      <p>Soit $u \in \Lin(E, F)$, $${B}, ${Bp}$ deux bases de $E$ avec $P = P_{${B}\to${Bp}}$, et $\mathcal{C}, \mathcal{C}'$ deux bases de $F$ avec $Q = P_{\mathcal{C}\to\mathcal{C}'}$. Si $A = ${Mat}_{${B},\mathcal{C}}(u)$ et $A' = ${Mat}_{${Bp},\mathcal{C}'}(u)$, alors</p>
      $$A' = Q^{-1}AP.$$`,
      proof: R`<p>On écrit $u = \Id_F \circ u \circ \Id_E$ en choisissant les bases : $${Mat}_{${Bp},\mathcal{C}'}(u) = ${Mat}_{\mathcal{C},\mathcal{C}'}(\Id_F)\;${Mat}_{${B},\mathcal{C}}(u)\;${Mat}_{${Bp},${B}}(\Id_E) = Q^{-1}AP$, car $${Mat}_{\mathcal{C},\mathcal{C}'}(\Id_F) = P_{\mathcal{C}'\to\mathcal{C}} = Q^{-1}$.</p>` },
    { t: 'cor', title: 'cas d’un endomorphisme', body: R`<p>Si $u \in \Lin(E)$, $A = ${Mat}_{${B}}(u)$ et $A' = ${Mat}_{${Bp}}(u)$, alors <strong>$A' = P^{-1}AP$</strong>, c'est-à-dire $A = PA'P^{-1}$.</p>` },
    { t: 'meth', body: R`<p>Deux façons de calculer $A'$ : (1) la formule $P^{-1}AP$ ; (2) <strong>directement</strong> : calculer chaque $u(e'_j)$ et l'écrire dans la base $${Bp}$ ; ses coordonnées forment la colonne $j$ de $A'$. La seconde est souvent plus rapide quand les $u(e'_j)$ sont simples.</p>` },
    { t: 'ex', body: R`<p>Soit $u$ de matrice $A = \begin{pmatrix} 1 & 2 \\ 2 & 1 \end{pmatrix}$ dans la base canonique, et $${Bp} = \big((1, 1), (1, -1)\big)$. On a $u(1, 1) = (3, 3) = 3e'_1$ et $u(1, -1) = (-1, 1) = -e'_2$, donc</p>
      $$A' = ${Mat}_{${Bp}}(u) = \begin{pmatrix} 3 & 0 \\ 0 & -1 \end{pmatrix}.$$
      <p>Dans cette base, $u$ dilate d'un facteur $3$ selon $(1, 1)$ et retourne $(1, -1)$ : on lit tout sur la matrice. Trouver une telle base, c'est le but de la <strong>diagonalisation</strong> (chapitre 2).</p>` },

    { t: 'h2', title: 'Matrices semblables' },
    { t: 'def', body: R`<p>Deux matrices $A, A' \in \M_n(\K)$ sont <strong>semblables</strong> s'il existe $P \in GL_n(\K)$ telle que $A' = P^{-1}AP$. Autrement dit, $A$ et $A'$ représentent le <strong>même endomorphisme</strong> dans deux bases.</p>` },
    { t: 'prop', body: R`
      <ol>
        <li>« Être semblables » est une relation d'équivalence sur $\M_n(\K)$.</li>
        <li>Deux matrices semblables ont le <strong>même rang</strong> (et, on le verra au chapitre 2, la même trace et le même déterminant).</li>
        <li>Si $A' = P^{-1}AP$, alors $A'^k = P^{-1}A^kP$ pour tout $k \in \N$.</li>
      </ol>`,
      proof: R`<p>1. $A = I_n^{-1}AI_n$ ; si $A' = P^{-1}AP$ alors $A = PA'P^{-1} = (P^{-1})^{-1}A'P^{-1}$ ; si de plus $A'' = Q^{-1}A'Q$, alors $A'' = (PQ)^{-1}A(PQ)$.</p>
      <p>2. Multiplier par une matrice inversible ne change pas le rang.</p>
      <p>3. $A'^k = (P^{-1}AP)(P^{-1}AP)\cdots(P^{-1}AP) = P^{-1}A^kP$ (les $PP^{-1}$ intermédiaires se simplifient).</p>` },
    { t: 'ex', body: R`
      <ul>
        <li>La seule matrice semblable à $\lambda I_n$ est $\lambda I_n$ : $P^{-1}(\lambda I_n)P = \lambda I_n$. Donc $\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$ n'est pas semblable à $I_2$.</li>
        <li><strong>Puissances</strong> : si $A = PDP^{-1}$ avec $D$ diagonale, alors $A^k = PD^kP^{-1}$, et $D^k$ s'obtient en élevant les coefficients diagonaux à la puissance $k$.</li>
      </ul>` },

    { t: 'h', title: 'Projections' },
    { t: 'h2', title: 'Sous-espaces supplémentaires' },
    { t: 'def', body: R`
      <p>Soient $F$ et $G$ deux sous-espaces de $E$. La somme $F + G = \{a + b \mid a \in F,\ b \in G\}$ est dite <strong>directe</strong>, notée $F \oplus G$, si tout vecteur de $F + G$ s'écrit de manière <strong>unique</strong> $a + b$.</p>
      <p>$F$ et $G$ sont <strong>supplémentaires</strong> dans $E$ si $E = F \oplus G$ : tout $x \in E$ s'écrit de manière unique $x = a + b$ avec $a \in F$ et $b \in G$.</p>` },
    { t: 'prop', body: R`<p>La somme $F + G$ est directe si et seulement si $F \cap G = \{0\}$.</p>`,
      proof: R`<p>Si la somme est directe et $x \in F \cap G$, alors $x = x + 0 = 0 + x$ sont deux décompositions, donc $x = 0$. Réciproquement, si $a + b = a' + b'$, alors $a - a' = b' - b \in F \cap G = \{0\}$.</p>` },
    { t: 'thm', title: 'caractérisations en dimension finie', body: R`
      <p>Les propriétés suivantes sont équivalentes :</p>
      <ol>
        <li>$E = F \oplus G$ ;</li>
        <li>$F \cap G = \{0\}$ et $\dim F + \dim G = \dim E$ ;</li>
        <li>en <strong>juxtaposant</strong> une base de $F$ et une base de $G$, on obtient une base de $E$ (appelée <strong>base adaptée</strong> à la décomposition).</li>
      </ol>`,
      proof: R`<p>On utilise la formule de Grassmann $\dim(F + G) = \dim F + \dim G - \dim(F \cap G)$.</p>
      <p>(1) ⇒ (2) : $F \cap G = \{0\}$ et $\dim E = \dim(F + G) = \dim F + \dim G$. (2) ⇒ (1) : $\dim(F + G) = \dim E$ donc $F + G = E$, et la somme est directe. (1) ⇔ (3) : la famille juxtaposée est génératrice de $E$ si et seulement si $F + G = E$, et libre si et seulement si la décomposition de $0$ est unique (regrouper les termes de $F$ et ceux de $G$).</p>` },
    { t: 'ex', body: R`<p>Dans $\R^3$, le plan $F : x + y + z = 0$ et la droite $G = \Vect\big((1, 0, 0)\big)$ sont supplémentaires : $(1, 0, 0) \notin F$ (car $1 \neq 0$), donc $F \cap G = \{0\}$, et $2 + 1 = 3$. Plus généralement, toute droite <strong>non contenue</strong> dans un plan de $\R^3$ en est un supplémentaire : un sous-espace a une infinité de supplémentaires.</p>` },
    { t: 'warn', body: R`<p>Ne pas confondre <strong>supplémentaire</strong> et <strong>complémentaire</strong> : $F \cup G$ n'est pas $E$ (un vecteur $a + b$ avec $a \neq 0$, $b \neq 0$ n'est ni dans $F$ ni dans $G$). Et « $F \cap G = \{0\}$ » seul ne suffit pas : il faut aussi la condition sur les dimensions.</p>` },

    { t: 'h2', title: 'Projection sur F parallèlement à G' },
    { t: 'def', body: R`<p>Supposons $E = F \oplus G$ et écrivons $x = a + b$ ($a \in F$, $b \in G$). L'application $p : x \mapsto a$ est la <strong>projection sur $F$ parallèlement à $G$</strong>.</p>` },
    { t: 'prop', body: R`
      <ol>
        <li>$p$ est linéaire et $p \circ p = p$.</li>
        <li>$\Imm p = F = \{x \mid p(x) = x\} = \Ker(p - \Id_E)$ et $\Ker p = G$.</li>
        <li>$q = \Id_E - p$ est la projection sur $G$ parallèlement à $F$, et $p + q = \Id_E$, $p \circ q = q \circ p = 0$.</li>
      </ol>`,
      proof: R`<p>1. Si $x = a + b$ et $y = a' + b'$, alors $\lambda x + \mu y = (\lambda a + \mu a') + (\lambda b + \mu b')$ avec $\lambda a + \mu a' \in F$, $\lambda b + \mu b' \in G$ : par unicité, $p(\lambda x + \mu y) = \lambda p(x) + \mu p(y)$. Puis $p(a) = a$ (car $a = a + 0$), donc $p(p(x)) = p(a) = a = p(x)$.</p>
      <p>2. $\Imm p \subset F$ par définition, et tout $a \in F$ vérifie $p(a) = a$ : $F \subset \Ker(p - \Id) \subset \Imm p$. Enfin $p(x) = 0 \iff a = 0 \iff x = b \in G$.</p>
      <p>3. $q(x) = x - a = b$ : c'est la projection sur $G$ parallèlement à $F$. $p(q(x)) = p(b) = 0$ et de même $q(p(x)) = q(a) = 0$.</p>` },
    { t: 'thm', title: 'caractérisation des projections', body: R`<p>Soit $p \in \Lin(E)$ tel que $p \circ p = p$ (on dit que $p$ est un <strong>projecteur</strong>). Alors $E = \Imm p \oplus \Ker p$, et $p$ est la projection sur $\Imm p$ parallèlement à $\Ker p$.</p>`,
      proof: R`<p>Pour $x \in E$, on écrit $x = p(x) + \big(x - p(x)\big)$ : $p(x) \in \Imm p$ et $p\big(x - p(x)\big) = p(x) - p^2(x) = 0$, donc $x - p(x) \in \Ker p$. Ainsi $E = \Imm p + \Ker p$. Si $y \in \Imm p \cap \Ker p$, $y = p(z)$ et $0 = p(y) = p^2(z) = p(z) = y$ : la somme est directe. Enfin la composante de $x$ sur $\Imm p$ est $p(x)$ : $p$ est bien la projection annoncée.</p>` },

    { t: 'h2', title: 'Matrice d’une projection' },
    { t: 'prop', body: R`<p>Soit $p$ la projection sur $F$ parallèlement à $G$, $r = \dim F$. Dans une base adaptée à $E = F \oplus G$ (une base de $F$, puis une base de $G$) :</p>
      $$${Mat}(p) = \begin{pmatrix} I_r & 0 \\ 0 & 0_{n-r} \end{pmatrix} = \mathrm{diag}(1, \dots, 1, 0, \dots, 0), \qquad \rg p = r.$$`,
      proof: R`<p>Les $r$ premiers vecteurs sont dans $F$, ils sont fixes ; les suivants sont dans $G$, ils sont envoyés sur $0$.</p>` },
    { t: 'prop', title: 'projection sur un hyperplan', body: R`<p>Soit $\varphi$ une forme linéaire non nulle, $F = \Ker\varphi$ (un hyperplan, de dimension $n - 1$) et $G = \Vect(w)$ avec <strong>$\varphi(w) \neq 0$</strong>. Alors $E = F \oplus G$ et la projection sur $F$ parallèlement à $G$ est</p>
      $$p(x) = x - \frac{\varphi(x)}{\varphi(w)}\,w.$$`,
      proof: R`<p>$w \notin F$ donc $F \cap G = \{0\}$, et $(n - 1) + 1 = n$. Pour $x \in E$, on cherche $t$ tel que $x - tw \in F$ : $\varphi(x - tw) = \varphi(x) - t\varphi(w) = 0 \iff t = \frac{\varphi(x)}{\varphi(w)}$. Alors $x = (x - tw) + tw$ est la décomposition de $x$, et $p(x) = x - tw$.</p>` },
    { t: 'ex', body: R`<p>Dans $\R^3$, projection sur $F : x + y + z = 0$ parallèlement à $G = \Vect\big((1, 0, 0)\big)$ : ici $\varphi(w) = 1$, donc $p(x, y, z) = (x, y, z) - (x + y + z)(1, 0, 0) = (-y - z,\ y,\ z)$ et</p>
      $$${Mat}(p) = \begin{pmatrix} 0 & -1 & -1 \\ 0 & 1 & 0 \\ 0 & 0 & 1 \end{pmatrix}.$$
      <p>On vérifie $${Mat}(p)^2 = ${Mat}(p)$. Dans la base adaptée $\big((1, -1, 0), (1, 0, -1), (1, 0, 0)\big)$, la matrice est $\mathrm{diag}(1, 1, 0)$.</p>` },

    { t: 'h', title: 'Symétries' },
    { t: 'h2', title: 'Symétrie par rapport à F parallèlement à G' },
    { t: 'def', body: R`<p>Supposons $E = F \oplus G$ et écrivons $x = a + b$ ($a \in F$, $b \in G$). L'application $s : x \mapsto a - b$ est la <strong>symétrie par rapport à $F$ parallèlement à $G$</strong>.</p>` },
    { t: 'prop', body: R`
      <ol>
        <li>$s = 2p - \Id_E$, où $p$ est la projection sur $F$ parallèlement à $G$ ; en particulier $s$ est linéaire.</li>
        <li>$s \circ s = \Id_E$ : $s$ est bijective et $s^{-1} = s$.</li>
        <li>$F = \Ker(s - \Id_E)$ (vecteurs fixes) et $G = \Ker(s + \Id_E)$ (vecteurs changés en leur opposé).</li>
      </ol>`,
      proof: R`<p>1. $2p(x) - x = 2a - (a + b) = a - b$. 2. $s(s(x)) = s(a - b) = a + b = x$ (la décomposition de $a - b$ est $a + (-b)$). 3. $s(x) = x \iff a - b = a + b \iff b = 0 \iff x \in F$ ; $s(x) = -x \iff a = 0 \iff x \in G$.</p>` },
    { t: 'thm', title: 'caractérisation des symétries', body: R`<p>Soit $s \in \Lin(E)$ tel que $s \circ s = \Id_E$. Alors $E = \Ker(s - \Id_E) \oplus \Ker(s + \Id_E)$, et $s$ est la symétrie par rapport à $\Ker(s - \Id_E)$ parallèlement à $\Ker(s + \Id_E)$.</p>`,
      proof: R`<p>Pour $x \in E$ : $x = \dfrac{x + s(x)}{2} + \dfrac{x - s(x)}{2}$. Le premier terme $a$ vérifie $s(a) = \frac{s(x) + x}{2} = a$, le second $b$ vérifie $s(b) = \frac{s(x) - x}{2} = -b$. Donc $E = \Ker(s - \Id) + \Ker(s + \Id)$. Si $x$ est dans l'intersection, $x = s(x) = -x$ donc $x = 0$ : la somme est directe. Enfin $s(x) = a - b$.</p>` },
    { t: 'rem', body: R`<p>$\Id_E$ est la symétrie par rapport à $E$ (parallèlement à $\{0\}$) et $-\Id_E$ la symétrie par rapport à $\{0\}$ parallèlement à $E$ (symétrie centrale). Une symétrie par rapport à un hyperplan s'appelle une <strong>réflexion</strong>.</p>` },

    { t: 'h2', title: 'Matrice d’une symétrie' },
    { t: 'prop', body: R`<p>Dans une base adaptée à $E = F \oplus G$, avec $r = \dim F$ :</p>
      $$${Mat}(s) = \begin{pmatrix} I_r & 0 \\ 0 & -I_{n-r} \end{pmatrix} = \mathrm{diag}(1, \dots, 1, -1, \dots, -1).$$
      <p>Si $F = \Ker\varphi$ est un hyperplan et $G = \Vect(w)$ avec $\varphi(w) \neq 0$ : $\quad s(x) = x - 2\,\dfrac{\varphi(x)}{\varphi(w)}\,w.$</p>`,
      proof: R`<p>Base adaptée : les vecteurs de $F$ sont fixes, ceux de $G$ changés en leur opposé. Formule : $s = 2p - \Id$ avec la formule de la projection sur un hyperplan.</p>` },
    { t: 'ex', body: R`
      <ol>
        <li>Dans $\R^2$, symétrie par rapport à $D_1 = \Vect\big((1, 0)\big)$ parallèlement à $D_2 = \Vect\big((1, 1)\big)$ : $(x, y) = (x - y)(1, 0) + y(1, 1)$, donc $s(x, y) = (x - y)(1, 0) - y(1, 1) = (x - 2y, -y)$ et $${Mat}(s) = \begin{pmatrix} 1 & -2 \\ 0 & -1 \end{pmatrix}$ ; on vérifie $${Mat}(s)^2 = I_2$.</li>
        <li>Dans $\M_n(\K)$, la transposition $s : M \mapsto M^T$ vérifie $s \circ s = \Id$ : c'est la symétrie par rapport aux matrices <strong>symétriques</strong> parallèlement aux matrices <strong>antisymétriques</strong>, et $M = \frac{M + M^T}{2} + \frac{M - M^T}{2}$.</li>
      </ol>` },
    { t: 'rem', title: 'vers la diagonalisation', body: R`<p>Dans une base adaptée, projections et symétries ont une matrice <strong>diagonale</strong> : les vecteurs de $F$ et de $G$ sont simplement multipliés par $1$, $0$ ou $-1$. Le chapitre 2 généralise cette idée : chercher une base formée de vecteurs que $u$ se contente de multiplier par un scalaire.</p>` }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche                                                               */
  /* ------------------------------------------------------------------ */
  const fiche = [
    { part: '1. Coordonnées' },
    { k: 'thm', t: 'Coordonnées dans une base', prio: true,
      hyp: R`$${B} = (e_1, \dots, e_n)$ base de $E$`,
      concl: [R`Tout $x$ s'écrit <u>de façon unique</u> $x = x_1e_1 + \dots + x_ne_n$`, R`$${Mat}_{${B}}(x) = (x_i)$ en colonne ; $x \mapsto ${Mat}_{${B}}(x)$ isomorphisme $E \to \K^n$`] },
    { k: 'prop', t: 'Famille de vecteurs',
      hyp: R`$M = ${Mat}_{${B}}(v_1, \dots, v_p)$ : <u>colonne $j$ = coordonnées de $v_j$</u>`,
      concl: [R`Libre $\iff \rg M = p$ ; génératrice $\iff \rg M = n$`, R`$n$ vecteurs : <b>base $\iff M$ inversible</b>`] },
    { k: 'def', t: 'Matrice d’une application linéaire', prio: true,
      hyp: R`$u \in \Lin(E, F)$, bases $${B} = (e_j)$ et $\mathcal{C}$`,
      concl: [R`<u>Colonne $j$ = coordonnées de $u(e_j)$ dans $\mathcal{C}$</u>`, R`$y = u(x) \iff Y = AX$`, R`$${Mat}(v \circ u) = ${Mat}(v)\,${Mat}(u)$ ; $${Mat}(u^{-1}) = ${Mat}(u)^{-1}$`] },

    { part: '2. Changement de base' },
    { k: 'def', t: 'Matrice de passage', prio: true,
      hyp: R`$${B}$ ancienne base, $${Bp} = (e'_j)$ nouvelle base`,
      concl: [R`$P_{${B}\to${Bp}}$ : <u>colonne $j$ = coordonnées de $e'_j$ dans $${B}$</u>`, R`$P_{${B}\to${Bp}}^{-1} = P_{${Bp}\to${B}}$ ; $P_{${B}\to${B}''} = P_{${B}\to${Bp}}P_{${Bp}\to${B}''}$`] },
    { k: 'form', t: 'Changement de coordonnées', prio: true,
      concl: [R`<b>$X = PX'$</b> (anciennes = $P$ × nouvelles)`, R`$X' = P^{-1}X$`] },
    { k: 'form', t: 'Changement de base', prio: true,
      hyp: R`$P = P_{${B}\to${Bp}}$ (départ), $Q = P_{\mathcal{C}\to\mathcal{C}'}$ (arrivée)`,
      concl: [R`$A' = Q^{-1}AP$`, R`Endomorphisme : <u>$A' = P^{-1}AP$</u>, $A = PA'P^{-1}$`],
      b: R`Raccourci : colonne $j$ de $A'$ = coordonnées de $u(e'_j)$ dans $${Bp}$.` },
    { k: 'def', t: 'Matrices semblables',
      concl: [R`$A' = P^{-1}AP$, $P \in GL_n(\K)$ : même endomorphisme, deux bases`, R`Même rang ; $A'^k = P^{-1}A^kP$`, R`$A = PDP^{-1}$ ⇒ <u>$A^k = PD^kP^{-1}$</u>`] },
    { k: 'warn', t: 'Sens de P',
      concl: [R`On écrit les <b>nouveaux</b> vecteurs dans l'<b>ancienne</b> base`, R`$P$ donne les anciennes coordonnées, pas les nouvelles`] },

    { part: '3. Projections' },
    { k: 'thm', t: 'Supplémentaires (dimension finie)', prio: true,
      concl: [R`$E = F \oplus G$ : tout $x = a + b$ <u>de façon unique</u>`, R`$\iff F \cap G = \{0\}$ <b>et</b> $\dim F + \dim G = \dim E$`, R`$\iff$ base de $F$ + base de $G$ = base de $E$ (base adaptée)`] },
    { k: 'def', t: 'Projection sur F parallèlement à G',
      hyp: R`$E = F \oplus G$, $x = a + b$`,
      concl: [R`$p(x) = a$ ; $p \circ p = p$`, R`$F = \Imm p = \Ker(p - \Id)$, $G = \Ker p$`, R`$\Id - p$ : projection sur $G$ parallèlement à $F$`] },
    { k: 'thm', t: 'Caractérisation', prio: true,
      hyp: R`<u>$p \circ p = p$</u>`,
      concl: [R`$E = \Imm p \oplus \Ker p$`, R`$p$ = projection sur $\Imm p$ parallèlement à $\Ker p$`] },
    { k: 'form', t: 'Calcul pratique',
      concl: [R`Base adaptée : $${Mat}(p) = \mathrm{diag}(1, \dots, 1, 0, \dots, 0)$`, R`$F = \Ker\varphi$, $G = \Vect(w)$, $\varphi(w) \neq 0$ : <u>$p(x) = x - \frac{\varphi(x)}{\varphi(w)}\,w$</u>`] },

    { part: '4. Symétries' },
    { k: 'def', t: 'Symétrie par rapport à F parallèlement à G',
      hyp: R`$E = F \oplus G$, $x = a + b$`,
      concl: [R`$s(x) = a - b$ ; <u>$s = 2p - \Id$</u>`, R`$s \circ s = \Id$, $s^{-1} = s$`, R`$F = \Ker(s - \Id)$, $G = \Ker(s + \Id)$`] },
    { k: 'thm', t: 'Caractérisation', prio: true,
      hyp: R`<u>$s \circ s = \Id$</u>`,
      concl: [R`$E = \Ker(s - \Id) \oplus \Ker(s + \Id)$`, R`$x = \frac{x + s(x)}{2} + \frac{x - s(x)}{2}$`] },
    { k: 'form', t: 'Matrice',
      concl: [R`Base adaptée : $\mathrm{diag}(1, \dots, 1, -1, \dots, -1)$`, R`Hyperplan : $s(x) = x - 2\frac{\varphi(x)}{\varphi(w)}\,w$`] },
    { k: 'warn', t: 'Pièges',
      concl: [R`Supplémentaire $\neq$ complémentaire`, R`$F \cap G = \{0\}$ ne suffit pas : vérifier les <b>dimensions</b>`, R`Ne pas oublier le « parallèlement à » : il y a une projection par supplémentaire`] }
  ];

  /* ------------------------------------------------------------------ */
  /* Exercices                                                           */
  /* ------------------------------------------------------------------ */
  const exercices = [
    {
      id: 'coord-r3', title: 'Coordonnées dans une base de R³', diff: 1, gen: 'coord',
      enonce: R`<p>On pose $v_1 = (1, 1, 0)$, $v_2 = (0, 1, 1)$, $v_3 = (1, 0, 1)$. Montrer que $${Bp} = (v_1, v_2, v_3)$ est une base de $\R^3$ et déterminer les coordonnées de $x = (1, 2, 3)$ dans $${Bp}$.</p>`,
      indication: R`<p>Résolvez $(x_1, x_2, x_3) = av_1 + bv_2 + cv_3$ pour un vecteur <em>quelconque</em> : additionner les trois équations est efficace.</p>`,
      correction: R`<p>Pour $(x_1, x_2, x_3)$ quelconque, $av_1 + bv_2 + cv_3 = (x_1, x_2, x_3)$ s'écrit $\begin{cases} a + c = x_1 \\ a + b = x_2 \\ b + c = x_3 \end{cases}$. En sommant : $a + b + c = \frac{x_1 + x_2 + x_3}{2}$, d'où</p>
        $$a = \frac{x_1 + x_2 - x_3}{2},\quad b = \frac{-x_1 + x_2 + x_3}{2},\quad c = \frac{x_1 - x_2 + x_3}{2}.$$
        <p>Le système a une unique solution pour tout vecteur : $${Bp}$ est une base. Pour $x = (1, 2, 3)$ : $(a, b, c) = (0, 2, 1)$, et en effet $2(0, 1, 1) + (1, 0, 1) = (1, 2, 3)$.</p>`,
      similaires: [
        {
          title: 'Coordonnées dans une base de R²',
          enonce: R`<p>Montrer que $\big((1, 2), (3, 1)\big)$ est une base de $\R^2$ et donner les coordonnées de $(5, 3)$ dans cette base.</p>`,
          correction: R`<p>$\det\begin{pmatrix} 1 & 3 \\ 2 & 1 \end{pmatrix} = 1 - 6 = -5 \neq 0$ : c'est une base. On résout $a + 3b = 5$, $2a + b = 3$ : $b = 3 - 2a$, puis $a + 9 - 6a = 5$, donc $a = \frac45$ et $b = \frac75$. Vérification : $\frac45(1, 2) + \frac75(3, 1) = \left(\frac{4 + 21}{5}, \frac{8 + 7}{5}\right) = (5, 3)$ ✓.</p>`
        }
      ]
    },
    {
      id: 'coord-poly', title: 'Coordonnées d’un polynôme', diff: 1,
      enonce: R`<p>Dans $\R_2[X]$, on considère $${Bp} = \big(1, X - 1, (X - 1)^2\big)$.</p>
        <ol><li>Montrer que $${Bp}$ est une base de $\R_2[X]$.</li><li>Déterminer les coordonnées de $P = X^2 + 3X - 2$ dans $${Bp}$.</li><li>Plus généralement, exprimer les coordonnées de $P \in \R_2[X]$ dans $${Bp}$ à l'aide de $P(1)$, $P'(1)$, $P''(1)$.</li><li>Écrire la matrice de passage de la base canonique $(1, X, X^2)$ à $${Bp}$.</li></ol>`,
      indication: R`<p>Écrire $X = (X - 1) + 1$ et développer.</p>`,
      correction: R`<p>1. Les degrés $0, 1, 2$ sont distincts : la famille est libre (un coefficient dominant non nul empêche toute combinaison nulle non triviale). Trois vecteurs libres en dimension 3 : c'est une base.</p>
        <p>2. Avec $X = (X - 1) + 1$ : $P = \big((X-1) + 1\big)^2 + 3\big((X - 1) + 1\big) - 2 = (X - 1)^2 + 5(X - 1) + 2$. Coordonnées : $(2, 5, 1)$.</p>
        <p>3. Si $P = a + b(X - 1) + c(X - 1)^2$, alors $P(1) = a$, $P'(1) = b$, $P''(1) = 2c$ : les coordonnées sont $\left(P(1), P'(1), \frac{P''(1)}{2}\right)$ (formule de Taylor pour les polynômes). Contrôle : $P(1) = 2$, $P' = 2X + 3$ donne $P'(1) = 5$, $P'' = 2$.</p>
        <p>4. $1 = 1$, $X - 1 = -1 + X$, $(X - 1)^2 = 1 - 2X + X^2$ : $P_{${B}\to${Bp}} = \begin{pmatrix} 1 & -1 & 1 \\ 0 & 1 & -2 \\ 0 & 0 & 1 \end{pmatrix}$.</p>`,
      similaires: [
        {
          title: 'Base de Lagrange',
          enonce: R`<p>Soient $L_0 = \frac{(X - 1)(X - 2)}{2}$, $L_1 = -X(X - 2)$, $L_2 = \frac{X(X - 1)}{2}$. Calculer $L_i(j)$ pour $i, j \in \{0, 1, 2\}$. En déduire que $(L_0, L_1, L_2)$ est une base de $\R_2[X]$ et que les coordonnées de $P$ dans cette base sont $\big(P(0), P(1), P(2)\big)$. Application : $P = X^2$.</p>`,
          correction: R`<p>$L_i(j) = 1$ si $i = j$ et $0$ sinon (vérification directe). Si $aL_0 + bL_1 + cL_2 = 0$, en évaluant en $0$, $1$, $2$ : $a = b = c = 0$. La famille est libre, de 3 vecteurs en dimension 3 : c'est une base.</p>
            <p>Soit $P \in \R_2[X]$ et $Q = P(0)L_0 + P(1)L_1 + P(2)L_2$. Alors $Q(j) = P(j)$ pour $j = 0, 1, 2$ : $P - Q$ est de degré $\le 2$ avec 3 racines, donc nul. Les coordonnées de $P$ sont $\big(P(0), P(1), P(2)\big)$. Pour $X^2$ : $(0, 1, 4)$, soit $X^2 = L_1 + 4L_2$.</p>`
        }
      ]
    },
    {
      id: 'mat-app', title: 'Matrice de P ↦ P(X + 1)', diff: 1,
      enonce: R`<p>Soit $u : \R_2[X] \to \R_2[X]$, $P \mapsto P(X + 1)$.</p>
        <ol><li>Montrer que $u$ est linéaire et écrire sa matrice $A$ dans la base canonique $(1, X, X^2)$.</li><li>Montrer que $u$ est bijective et donner $A^{-1}$ sans calcul d'inverse.</li></ol>`,
      indication: R`<p>Quelle est la réciproque de « remplacer $X$ par $X + 1$ » ?</p>`,
      correction: R`<p>1. $u(\lambda P + \mu Q) = \lambda P(X + 1) + \mu Q(X + 1)$ : $u$ est linéaire. $u(1) = 1$, $u(X) = 1 + X$, $u(X^2) = 1 + 2X + X^2$, donc</p>
        $$A = \begin{pmatrix} 1 & 1 & 1 \\ 0 & 1 & 2 \\ 0 & 0 & 1 \end{pmatrix}.$$
        <p>2. $v : P \mapsto P(X - 1)$ vérifie $v \circ u = u \circ v = \Id$ : $u$ est bijective et $A^{-1} = ${Mat}(v)$. Comme $v(1) = 1$, $v(X) = -1 + X$, $v(X^2) = 1 - 2X + X^2$ :</p>
        $$A^{-1} = \begin{pmatrix} 1 & -1 & 1 \\ 0 & 1 & -2 \\ 0 & 0 & 1 \end{pmatrix}.$$
        <p>(C'est la matrice de passage de l'exercice précédent.)</p>`,
      similaires: [
        {
          title: 'Matrice dans des bases non canoniques',
          enonce: R`<p>Soit $u : \R^3 \to \R^2$, $u(x, y, z) = (x + 2y - z,\ 3x - y)$. Écrire sa matrice $A$ dans les bases canoniques, puis sa matrice $A'$ dans les bases $${Bp} = \big((1, 1, 1), (1, 0, 1), (0, 1, 2)\big)$ de $\R^3$ et $\mathcal{C}' = \big((1, 1), (1, 2)\big)$ de $\R^2$.</p>`,
          correction: R`<p>$A = \begin{pmatrix} 1 & 2 & -1 \\ 3 & -1 & 0 \end{pmatrix}$. Puis $u(1, 1, 1) = (2, 2) = 2(1, 1) + 0(1, 2)$, $u(1, 0, 1) = (0, 3) = -3(1, 1) + 3(1, 2)$, $u(0, 1, 2) = (0, -1) = (1, 1) - (1, 2)$. Donc</p>
            $$A' = \begin{pmatrix} 2 & -3 & 1 \\ 0 & 3 & -1 \end{pmatrix}.$$
            <p>Contrôle par la formule $A' = Q^{-1}AP$ avec $P = \begin{pmatrix} 1 & 1 & 0 \\ 1 & 0 & 1 \\ 1 & 1 & 2 \end{pmatrix}$, $Q = \begin{pmatrix} 1 & 1 \\ 1 & 2 \end{pmatrix}$, $Q^{-1} = \begin{pmatrix} 2 & -1 \\ -1 & 1 \end{pmatrix}$ : $AP = \begin{pmatrix} 2 & 0 & 0 \\ 2 & 3 & -1 \end{pmatrix}$ et $Q^{-1}AP = A'$ ✓.</p>`
        }
      ]
    },
    {
      id: 'passage', title: 'Changement de base et puissances', diff: 2, gen: 'passage',
      enonce: R`<p>Soit $u \in \Lin(\R^2)$ de matrice $A = \begin{pmatrix} 4 & -2 \\ 1 & 1 \end{pmatrix}$ dans la base canonique. On pose $e'_1 = (1, 1)$, $e'_2 = (2, 1)$.</p>
        <ol><li>Montrer que $${Bp} = (e'_1, e'_2)$ est une base et écrire $P = P_{${B}\to${Bp}}$.</li><li>Calculer $P^{-1}$ et $A' = ${Mat}_{${Bp}}(u)$.</li><li>En déduire $A^k$ pour $k \in \N$.</li></ol>`,
      indication: R`<p>$A' = P^{-1}AP$, puis $A = PA'P^{-1}$ donne $A^k = PA'^kP^{-1}$.</p>`,
      correction: R`<p>1. $P = \begin{pmatrix} 1 & 2 \\ 1 & 1 \end{pmatrix}$, $\det P = -1 \neq 0$ : c'est une base.</p>
        <p>2. $P^{-1} = \frac{1}{-1}\begin{pmatrix} 1 & -2 \\ -1 & 1 \end{pmatrix} = \begin{pmatrix} -1 & 2 \\ 1 & -1 \end{pmatrix}$. $AP = \begin{pmatrix} 2 & 6 \\ 2 & 3 \end{pmatrix}$ et $A' = P^{-1}AP = \begin{pmatrix} 2 & 0 \\ 0 & 3 \end{pmatrix}$. (Directement : $u(e'_1) = (2, 2) = 2e'_1$ et $u(e'_2) = (6, 3) = 3e'_2$.)</p>
        <p>3. $A = PA'P^{-1}$ donc $A^k = PA'^kP^{-1} = \begin{pmatrix} 1 & 2 \\ 1 & 1 \end{pmatrix}\begin{pmatrix} 2^k & 0 \\ 0 & 3^k \end{pmatrix}\begin{pmatrix} -1 & 2 \\ 1 & -1 \end{pmatrix}$, soit</p>
        $$A^k = \begin{pmatrix} -2^k + 2\cdot3^k & 2^{k+1} - 2\cdot3^k \\ -2^k + 3^k & 2^{k+1} - 3^k \end{pmatrix}.$$
        <p>Contrôle : $k = 0$ donne $I_2$, $k = 1$ donne $A$ ✓.</p>`
    },
    {
      id: 'chgt-coord', title: 'Équations dans une nouvelle base', diff: 1,
      enonce: R`<p>Dans $\R^2$, on note $(x, y)$ les coordonnées dans la base canonique et $(x', y')$ celles dans $${Bp} = \big((1, 1), (1, -1)\big)$.</p>
        <ol><li>Exprimer $x, y$ en fonction de $x', y'$, puis $x', y'$ en fonction de $x, y$.</li><li>Quelle est, dans $${Bp}$, l'équation de la droite $x + y = 2$ ? de la courbe $xy = 1$ ?</li></ol>`,
      correction: R`<p>1. $X = PX'$ avec $P = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$ : $x = x' + y'$, $y = x' - y'$. En inversant : $x' = \frac{x + y}{2}$, $y' = \frac{x - y}{2}$.</p>
        <p>2. $x + y = 2x'$, donc la droite a pour équation $x' = 1$. $xy = (x' + y')(x' - y') = x'^2 - y'^2$ : la courbe a pour équation $x'^2 - y'^2 = 1$.</p>`,
      similaires: [
        {
          title: 'Un plan dans une base adaptée',
          enonce: R`<p>Dans $\R^3$, soit $${Bp} = \big((1, -1, 0), (0, 1, -1), (1, 1, 1)\big)$ (on admet que c'est une base). Notons $(a, b, c)$ les coordonnées dans $${Bp}$. Quelle est l'équation du plan $x + y + z = 0$ dans ces coordonnées ?</p>`,
          correction: R`<p>$X = PX'$ donne $x = a + c$, $y = -a + b + c$, $z = -b + c$. Donc $x + y + z = 3c$ et le plan a pour équation $c = 0$ : il est engendré par les deux premiers vecteurs de $${Bp}$ (qui vérifient bien $x + y + z = 0$).</p>`
        }
      ]
    },
    {
      id: 'semblables', title: 'Matrices semblables ou non', diff: 2,
      enonce: R`<ol><li>Montrer que la seule matrice semblable à $\lambda I_n$ est $\lambda I_n$. En déduire que $\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$ n'est pas semblable à $I_2$.</li><li>Soit $B = \begin{pmatrix} 1 & 2 \\ 2 & 4 \end{pmatrix}$. Calculer $B(1, 2)^T$ et $B(2, -1)^T$. En déduire que $B$ est semblable à $\begin{pmatrix} 5 & 0 \\ 0 & 0 \end{pmatrix}$.</li><li>$B$ est-elle semblable à $I_2$ ?</li></ol>`,
      correction: R`<p>1. $P^{-1}(\lambda I_n)P = \lambda P^{-1}P = \lambda I_n$. La matrice $\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix} \neq I_2$ ne peut donc pas être semblable à $I_2$.</p>
        <p>2. $B\begin{pmatrix} 1 \\ 2 \end{pmatrix} = \begin{pmatrix} 5 \\ 10 \end{pmatrix} = 5\begin{pmatrix} 1 \\ 2 \end{pmatrix}$ et $B\begin{pmatrix} 2 \\ -1 \end{pmatrix} = \begin{pmatrix} 0 \\ 0 \end{pmatrix}$. Les vecteurs $(1, 2)$, $(2, -1)$ forment une base ($\det = -5 \neq 0$) dans laquelle l'endomorphisme associé à $B$ a pour matrice $\mathrm{diag}(5, 0)$ : avec $P = \begin{pmatrix} 1 & 2 \\ 2 & -1 \end{pmatrix}$, $P^{-1}BP = \begin{pmatrix} 5 & 0 \\ 0 & 0 \end{pmatrix}$.</p>
        <p>3. Non : $\rg B = 1$ et $\rg I_2 = 2$, or deux matrices semblables ont le même rang.</p>`
    },
    {
      id: 'supplementaires', title: 'Sous-espaces supplémentaires dans R³', diff: 1,
      enonce: R`<p>Dans $\R^3$, soient $F : x + 2y - z = 0$ et $G = \Vect(w)$ avec $w = (1, 1, 1)$.</p>
        <ol><li>Montrer que $\R^3 = F \oplus G$.</li><li>Décomposer $v = (x, y, z)$ sous la forme $a + b$ avec $a \in F$, $b \in G$. Application : $v = (3, 0, 1)$.</li></ol>`,
      correction: R`<p>1. $1 + 2 - 1 = 2 \neq 0$, donc $w \notin F$ et $F \cap G = \{0\}$. $F$ est un plan (équation non triviale), $G$ une droite : $2 + 1 = 3$. Donc $\R^3 = F \oplus G$.</p>
        <p>2. On cherche $b = tw$ avec $v - tw \in F$ : $(x - t) + 2(y - t) - (z - t) = 0$, soit $x + 2y - z - 2t = 0$, d'où $t = \frac{x + 2y - z}{2}$. Pour $v = (3, 0, 1)$ : $t = 1$, $b = (1, 1, 1)$ et $a = (2, -1, 0)$ ; contrôle : $2 - 2 - 0 = 0$ ✓.</p>`,
      similaires: [
        {
          title: 'Plan engendré et droite',
          enonce: R`<p>Dans $\R^3$, $F = \Vect\big((1, 0, 1), (0, 1, 1)\big)$ et $G = \Vect\big((1, 1, 0)\big)$. Sont-ils supplémentaires ?</p>`,
          correction: R`<p>On juxtapose les bases : $\det\begin{pmatrix} 1 & 0 & 1 \\ 0 & 1 & 1 \\ 1 & 1 & 0 \end{pmatrix} = 1(0 - 1) - 0 + 1(0 - 1) = -2 \neq 0$. Les trois vecteurs forment une base de $\R^3$ : $F$ et $G$ sont supplémentaires (base adaptée).</p>`
        },
        {
          title: 'Un faux supplémentaire',
          enonce: R`<p>Dans $\R^3$, $F : x + y + z = 0$ et $G = \Vect\big((1, -1, 0)\big)$. Sont-ils supplémentaires ? Proposer un supplémentaire de $F$.</p>`,
          correction: R`<p>$1 - 1 + 0 = 0$ : $(1, -1, 0) \in F$, donc $G \subset F$ et $F \cap G = G \neq \{0\}$ : <strong>non</strong>. Toute droite $\Vect(w)$ avec $w_1 + w_2 + w_3 \neq 0$ convient, par exemple $\Vect\big((1, 1, 1)\big)$ ou $\Vect\big((0, 0, 1)\big)$.</p>`
        }
      ]
    },
    {
      id: 'proj-r3', title: 'Projection et symétrie dans R³', diff: 2, gen: 'projPlan',
      enonce: R`<p>Avec $F : x + 2y - z = 0$ et $G = \Vect\big((1, 1, 1)\big)$ (exercice précédent) :</p>
        <ol><li>Donner la matrice dans la base canonique de la projection $p$ sur $F$ parallèlement à $G$.</li><li>Même question pour la symétrie $s$ par rapport à $F$ parallèlement à $G$.</li><li>Donner une base de $\R^3$ dans laquelle ces matrices sont diagonales.</li></ol>`,
      indication: R`<p>D'après l'exercice précédent, $p(v) = v - \frac{x + 2y - z}{2}\,w$.</p>`,
      correction: R`<p>1. $p(x, y, z) = (x, y, z) - \frac{x + 2y - z}{2}(1, 1, 1)$, d'où</p>
        $$${Mat}(p) = \frac12\begin{pmatrix} 1 & -2 & 1 \\ -1 & 0 & 1 \\ -1 & -2 & 3 \end{pmatrix}.$$
        <p>2. $s = 2p - \Id$ : $${Mat}(s) = \begin{pmatrix} 0 & -2 & 1 \\ -1 & -1 & 1 \\ -1 & -2 & 2 \end{pmatrix}$.</p>
        <p>3. $(1, 0, 1)$ et $(0, 1, 2)$ forment une base de $F$ ; dans la base $\big((1, 0, 1), (0, 1, 2), (1, 1, 1)\big)$, $${Mat}(p) = \mathrm{diag}(1, 1, 0)$ et $${Mat}(s) = \mathrm{diag}(1, 1, -1)$.</p>
        <p>Contrôles : chaque ligne de $${Mat}(p)$ appliquée à $(1, 1, 1)$ donne $0$, et $${Mat}(s)(1, 1, 1)^T = (-1, -1, -1)^T$.</p>`
    },
    {
      id: 'proj-r2', title: 'Projection sur une droite de R²', diff: 1, gen: 'proj2',
      enonce: R`<p>Dans $\R^2$, soit $p$ la projection sur $D_1 = \Vect\big((1, 2)\big)$ parallèlement à $D_2 = \Vect\big((1, 1)\big)$, et $s$ la symétrie correspondante. Donner leurs matrices dans la base canonique.</p>`,
      correction: R`<p>$D_2$ a pour équation $x - y = 0$. Si $(x, y) = \alpha(1, 2) + \beta(1, 1)$, alors $x - y = \alpha(1 - 2) = -\alpha$, donc $\alpha = y - x$ et $p(x, y) = (y - x)(1, 2) = (-x + y,\ -2x + 2y)$ :</p>
        $$${Mat}(p) = \begin{pmatrix} -1 & 1 \\ -2 & 2 \end{pmatrix}, \qquad ${Mat}(s) = 2${Mat}(p) - I_2 = \begin{pmatrix} -3 & 2 \\ -4 & 3 \end{pmatrix}.$$
        <p>Contrôles : $p(1, 2) = (1, 2)$, $p(1, 1) = (0, 0)$, $s(1, 1) = (-1, -1)$.</p>`
    },
    {
      id: 'reconnaitre', title: 'Reconnaître une projection, une symétrie', diff: 1, gen: 'reconnaitre',
      enonce: R`<p>Soient $M = \begin{pmatrix} 2 & -2 \\ 1 & -1 \end{pmatrix}$ et $N = \begin{pmatrix} 3 & -4 \\ 2 & -3 \end{pmatrix}$. Calculer $M^2$ et $N^2$, et en déduire la nature géométrique des endomorphismes de $\R^2$ associés, avec leurs éléments caractéristiques.</p>`,
      correction: R`<p>$M^2 = \begin{pmatrix} 2 & -2 \\ 1 & -1 \end{pmatrix} = M$ : projection sur $\Ker(M - I_2)$ parallèlement à $\Ker M$. $M - I_2 = \begin{pmatrix} 1 & -2 \\ 1 & -2 \end{pmatrix}$ donne $x = 2y$ : $\Ker(M - I_2) = \Vect\big((2, 1)\big)$ ; $\Ker M$ : $2x - 2y = 0$, soit $\Vect\big((1, 1)\big)$.</p>
        <p>$N^2 = I_2$ : symétrie par rapport à $\Ker(N - I_2) = \Vect\big((2, 1)\big)$ (équation $2x - 4y = 0$) parallèlement à $\Ker(N + I_2) = \Vect\big((1, 1)\big)$ (équation $4x - 4y = 0$).</p>
        <p>On remarque $N = 2M - I_2$ : c'est la symétrie associée à la projection $M$.</p>`
    },
    {
      id: 'projecteur', title: 'Propriétés d’un projecteur', diff: 2,
      enonce: R`<p>Soit $p \in \Lin(E)$ tel que $p \circ p = p$, et $q = \Id_E - p$.</p>
        <ol><li>Montrer que $q \circ q = q$ et $p \circ q = q \circ p = 0$.</li><li>Montrer que $\Imm q = \Ker p$ et $\Ker q = \Imm p$.</li><li>Montrer que $\rg p + \rg q = \dim E$.</li></ol>`,
      correction: R`<p>1. $q^2 = (\Id - p)^2 = \Id - 2p + p^2 = \Id - p = q$ ($\Id$ et $p$ commutent). $p \circ q = p - p^2 = 0$ et $q \circ p = p - p^2 = 0$.</p>
        <p>2. $p \circ q = 0$ donne $\Imm q \subset \Ker p$ ; si $x \in \Ker p$, $q(x) = x - p(x) = x$ donc $x \in \Imm q$. De même $\Ker q = \{x \mid x = p(x)\} \subset \Imm p$, et si $x = p(y)$, $q(x) = p(y) - p^2(y) = 0$.</p>
        <p>3. $\rg q = \dim\Ker p$ et, par le théorème du rang, $\rg p + \dim\Ker p = \dim E$. (Ou : $E = \Imm p \oplus \Ker p$.)</p>`,
      similaires: [
        {
          title: 'Somme de deux projecteurs',
          enonce: R`<p>Soient $p, q$ deux projecteurs de $E$. Montrer que $p + q$ est un projecteur si et seulement si $p \circ q = q \circ p = 0$.</p>`,
          correction: R`<p>$(p + q)^2 = p^2 + pq + qp + q^2 = p + q + (pq + qp)$. Donc $p + q$ est un projecteur $\iff pq + qp = 0$.</p>
            <p>Si $pq = qp = 0$, c'est vrai. Réciproquement, si $pq + qp = 0$ : en composant à gauche par $p$, $pq + pqp = 0$ ; à droite par $p$, $pqp + qp = 0$. Par différence, $pq = qp$, puis $2pq = 0$, donc $pq = qp = 0$.</p>`
        }
      ]
    },
    {
      id: 'transposition', title: 'Matrices symétriques et antisymétriques', diff: 2,
      enonce: R`<p>Soit $s : \M_n(\R) \to \M_n(\R)$, $M \mapsto M^T$. On note $\mathcal{S}_n$ (resp. $\mathcal{A}_n$) l'ensemble des matrices symétriques (resp. antisymétriques).</p>
        <ol><li>Montrer que $s$ est une symétrie ; préciser par rapport à quoi et parallèlement à quoi.</li><li>En déduire $\M_n(\R) = \mathcal{S}_n \oplus \mathcal{A}_n$ et les dimensions de $\mathcal{S}_n$ et $\mathcal{A}_n$.</li><li>Décomposer $M = \begin{pmatrix} 1 & 2 \\ 4 & 3 \end{pmatrix}$.</li></ol>`,
      correction: R`<p>1. $s$ est linéaire et $(M^T)^T = M$ : $s \circ s = \Id$. C'est la symétrie par rapport à $\Ker(s - \Id) = \{M \mid M^T = M\} = \mathcal{S}_n$ parallèlement à $\Ker(s + \Id) = \mathcal{A}_n$.</p>
        <p>2. Par la caractérisation des symétries, $\M_n(\R) = \mathcal{S}_n \oplus \mathcal{A}_n$, avec $M = \frac{M + M^T}{2} + \frac{M - M^T}{2}$. Une matrice symétrique est déterminée par ses coefficients $m_{ij}$, $i \le j$ : $\dim\mathcal{S}_n = \frac{n(n+1)}{2}$ ; une antisymétrique par ses $m_{ij}$, $i \lt j$ (diagonale nulle) : $\dim\mathcal{A}_n = \frac{n(n-1)}{2}$. Contrôle : la somme vaut $n^2$.</p>
        <p>3. $\frac{M + M^T}{2} = \begin{pmatrix} 1 & 3 \\ 3 & 3 \end{pmatrix}$ et $\frac{M - M^T}{2} = \begin{pmatrix} 0 & -1 \\ 1 & 0 \end{pmatrix}$.</p>`,
      similaires: [
        {
          title: 'Polynômes pairs et impairs',
          enonce: R`<p>Soit $\sigma : \R_3[X] \to \R_3[X]$, $P(X) \mapsto P(-X)$. Montrer que $\sigma$ est une symétrie, écrire sa matrice dans la base canonique et préciser ses éléments caractéristiques. Décomposer $P = X^3 + 2X^2 - X + 5$.</p>`,
          correction: R`<p>$\sigma$ est linéaire et $\sigma(\sigma(P)) = P$ : c'est une symétrie. $\sigma(X^k) = (-1)^kX^k$, donc $${Mat}(\sigma) = \mathrm{diag}(1, -1, 1, -1)$ (déjà diagonale : la base canonique est adaptée). $\Ker(\sigma - \Id) = \Vect(1, X^2)$ (polynômes pairs), $\Ker(\sigma + \Id) = \Vect(X, X^3)$ (polynômes impairs).</p>
            <p>$P = (2X^2 + 5) + (X^3 - X)$, avec $\frac{P(X) + P(-X)}{2} = 2X^2 + 5$.</p>`
        }
      ]
    },
    {
      id: 'proj-poly', title: 'Une projection sur des polynômes', diff: 2,
      enonce: R`<p>Soit $p : \R_3[X] \to \R_3[X]$, $P \mapsto P(0) + P'(0)\,X$.</p>
        <ol><li>Montrer que $p$ est un projecteur.</li><li>Déterminer $\Imm p$ et $\Ker p$, et la matrice de $p$ dans la base canonique.</li></ol>`,
      correction: R`<p>1. $p$ est linéaire (évaluation et dérivation le sont). Si $Q = p(P) = a + bX$ avec $a = P(0)$, $b = P'(0)$, alors $Q(0) = a$ et $Q'(0) = b$, donc $p(Q) = Q$ : $p \circ p = p$.</p>
        <p>2. $\Imm p \subset \R_1[X]$, et tout $a + bX$ est fixe : $\Imm p = \R_1[X]$. $\Ker p = \{P \mid P(0) = P'(0) = 0\} = \Vect(X^2, X^3)$ (les coefficients de $1$ et $X$ sont $P(0)$ et $P'(0)$). $p$ est la projection sur $\R_1[X]$ parallèlement à $\Vect(X^2, X^3)$ ; $p(1) = 1$, $p(X) = X$, $p(X^2) = p(X^3) = 0$ :</p>
        $$${Mat}(p) = \mathrm{diag}(1, 1, 0, 0).$$`
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiches méthodes                                                     */
  /* ------------------------------------------------------------------ */
  const methodes = [
    {
      title: 'Coordonnées d’un vecteur dans une base', gen: 'coord',
      cas: R`Un vecteur $x$ et une base $${Bp} = (v_1, \dots, v_n)$ : on veut les coordonnées de $x$`,
      debut: R`<b>Écrire $x = a_1v_1 + \dots + a_nv_n$</b> et résoudre le système (matrice $P$ = les $v_j$ <b>en colonnes</b>).`,
      etapes: [
        R`Poser $x = a_1v_1 + \dots + a_nv_n$ et identifier coordonnée par coordonnée.`,
        R`Résoudre le système (pivot de Gauss ou substitution). Le faire pour un $x$ <strong>quelconque</strong> prouve en même temps que $${Bp}$ est une base (solution unique).`,
        R`Ou, si $P^{-1}$ est connue : $X' = P^{-1}X$.`,
        R`Vérifier en recomposant $\sum a_jv_j$.`
      ],
      exemple: {
        enonce: R`<p>Coordonnées de $(2, 1)$ dans $\big((1, 1), (1, -1)\big)$.</p>`,
        solution: R`<p>$a + b = 2$ et $a - b = 1$ : $a = \frac32$, $b = \frac12$. Vérification : $\frac32(1, 1) + \frac12(1, -1) = (2, 1)$ ✓.</p>`
      },
      pieges: [R`Écrire les vecteurs en <strong>lignes</strong> au lieu de colonnes.`, R`Oublier l'ordre de la base : les coordonnées sont une liste ordonnée.`]
    },
    {
      title: 'Matrice de passage et changement de coordonnées',
      cas: R`Deux bases $${B}$, $${Bp}$ : passer des coordonnées dans l'une à celles dans l'autre`,
      debut: R`<b>$P = P_{${B}\to${Bp}}$ : colonnes = nouveaux vecteurs écrits dans l'ancienne base</b>, puis $X = PX'$.`,
      etapes: [
        R`Écrire chaque $e'_j$ dans la base $${B}$ et ranger ses coordonnées en colonne $j$ de $P$.`,
        R`Anciennes coordonnées en fonction des nouvelles : $X = PX'$.`,
        R`Nouvelles en fonction des anciennes : $X' = P^{-1}X$ (calculer $P^{-1}$, ou inverser le système $X = PX'$).`,
        R`Pour une équation (droite, plan, courbe) : remplacer $x, y, \dots$ par leurs expressions en $x', y', \dots$`
      ],
      exemple: {
        enonce: R`<p>Équation de la droite $y = 2x$ dans la base $${Bp} = \big((1, 2), (0, 1)\big)$.</p>`,
        solution: R`<p>$P = \begin{pmatrix} 1 & 0 \\ 2 & 1 \end{pmatrix}$ : $x = x'$, $y = 2x' + y'$. Alors $y = 2x \iff 2x' + y' = 2x' \iff y' = 0$ : c'est l'axe dirigé par $e'_1 = (1, 2)$, ce qui est cohérent.</p>`
      },
      pieges: [R`Inverser le sens : $P$ donne les <strong>anciennes</strong> coordonnées.`, R`Écrire les anciens vecteurs dans la nouvelle base (c'est $P^{-1}$).`]
    },
    {
      title: 'Matrice d’un endomorphisme dans une nouvelle base', gen: 'passage',
      cas: R`$A = ${Mat}_{${B}}(u)$ connue, on veut $A' = ${Mat}_{${Bp}}(u)$`,
      debut: R`<b>$A' = P^{-1}AP$</b> ; ou plus vite : <b>calculer $u(e'_j)$</b> et l'écrire dans $${Bp}$ (colonne $j$).`,
      etapes: [
        R`Écrire $P = P_{${B}\to${Bp}}$.`,
        R`Méthode directe : calculer $u(e'_j) = Ae'_j$ et l'exprimer comme combinaison des $e'_i$ ; les coefficients forment la colonne $j$ de $A'$.`,
        R`Méthode matricielle : calculer $P^{-1}$, puis $AP$, puis $P^{-1}(AP)$.`,
        R`Pour des puissances : $A = PA'P^{-1}$ donne $A^k = PA'^kP^{-1}$ (utile si $A'$ est diagonale).`
      ],
      exemple: {
        enonce: R`<p>$A = \begin{pmatrix} 1 & 2 \\ 2 & 1 \end{pmatrix}$, $${Bp} = \big((1, 1), (1, -1)\big)$.</p>`,
        solution: R`<p>$A(1, 1)^T = (3, 3)^T = 3e'_1$ et $A(1, -1)^T = (-1, 1)^T = -e'_2$, donc $A' = \begin{pmatrix} 3 & 0 \\ 0 & -1 \end{pmatrix}$, sans calcul d'inverse.</p>`
      },
      pieges: [R`Écrire $PAP^{-1}$ au lieu de $P^{-1}AP$.`, R`Lire les coordonnées de $u(e'_j)$ dans la base canonique au lieu de $${Bp}$.`]
    },
    {
      title: 'Montrer que F et G sont supplémentaires',
      cas: R`Deux sous-espaces $F$, $G$ de $E$ : prouver $E = F \oplus G$ et décomposer un vecteur`,
      debut: R`<b>$F \cap G = \{0\}$ et $\dim F + \dim G = \dim E$</b>, ou : bases juxtaposées = base de $E$.`,
      etapes: [
        R`Déterminer $\dim F$ et $\dim G$ (base ou nombre d'équations indépendantes).`,
        R`Montrer $F \cap G = \{0\}$ (un vecteur de $G$ qui vérifie les équations de $F$ est nul) et vérifier que les dimensions s'ajoutent.`,
        R`Ou juxtaposer des bases de $F$ et $G$ et montrer qu'on obtient une base de $E$ (matrice inversible).`,
        R`Pour décomposer $x = a + b$ : chercher $b \in G$ (paramètre) tel que $x - b$ vérifie les équations de $F$.`
      ],
      exemple: {
        enonce: R`<p>$F : x + y + z = 0$, $G = \Vect\big((1, 1, 1)\big)$ dans $\R^3$ ; décomposer $(3, 0, 0)$.</p>`,
        solution: R`<p>$1 + 1 + 1 = 3 \neq 0$ : $F \cap G = \{0\}$, et $2 + 1 = 3$. Avec $b = t(1, 1, 1)$ : $(3 - t) + (0 - t) + (0 - t) = 0$, donc $t = 1$ : $(3, 0, 0) = (2, -1, -1) + (1, 1, 1)$.</p>`
      },
      pieges: [R`Se contenter de $F \cap G = \{0\}$ sans les dimensions.`, R`Confondre supplémentaire et complémentaire.`]
    },
    {
      title: 'Matrice d’une projection ou d’une symétrie', gen: 'projPlan',
      cas: R`Projection (ou symétrie) sur $F$ parallèlement à $G$ : on veut sa matrice`,
      debut: R`<b>Décomposer $x = a + b$</b> : $p(x) = a$, $s(x) = a - b = 2p(x) - x$. Hyperplan $F = \Ker\varphi$, $G = \Vect(w)$ : <b>$p(x) = x - \frac{\varphi(x)}{\varphi(w)}w$</b>.`,
      etapes: [
        R`Vérifier que $E = F \oplus G$.`,
        R`Écrire $x = a + b$ avec $a \in F$, $b \in G$ ; si $G = \Vect(w)$, $b = tw$ et $t$ s'obtient en écrivant que $x - tw \in F$.`,
        R`$p(x) = a$ ; les colonnes de la matrice sont $p(e_1), \dots, p(e_n)$.`,
        R`$s = 2p - \Id$. Dans une base adaptée : $\mathrm{diag}(1, \dots, 1, 0, \dots, 0)$ et $\mathrm{diag}(1, \dots, 1, -1, \dots, -1)$.`,
        R`Contrôler : $p(w) = 0$, $p(a) = a$ pour $a \in F$, $M^2 = M$ (ou $M^2 = I$).`
      ],
      exemple: {
        enonce: R`<p>Projection sur $\Vect\big((1, 0)\big)$ parallèlement à $\Vect\big((1, 1)\big)$ dans $\R^2$.</p>`,
        solution: R`<p>$(x, y) = \alpha(1, 0) + \beta(1, 1)$ donne $\beta = y$, $\alpha = x - y$. Donc $p(x, y) = (x - y, 0)$, $${Mat}(p) = \begin{pmatrix} 1 & -1 \\ 0 & 0 \end{pmatrix}$, et $${Mat}(s) = \begin{pmatrix} 1 & -2 \\ 0 & -1 \end{pmatrix}$.</p>`
      },
      pieges: [R`Projeter « orthogonalement » par réflexe : ici la direction est $G$, pas la perpendiculaire.`, R`Oublier que $s = 2p - \Id$ et refaire tout le calcul.`]
    },
    {
      title: 'Reconnaître une projection ou une symétrie', gen: 'reconnaitre',
      cas: R`Une matrice $M$ (ou un endomorphisme) donnée : est-ce une projection ? une symétrie ?`,
      debut: R`<b>Calculer $M^2$</b> : $M^2 = M$ → projection sur $\Ker(M - I)$ // $\Ker M$ ; $M^2 = I$ → symétrie par rapport à $\Ker(M - I)$ // $\Ker(M + I)$.`,
      etapes: [
        R`Calculer $M^2$ (ou $u \circ u$).`,
        R`Si $M^2 = M$ : projection sur $F = \Ker(M - I) = \Imm M$ parallèlement à $G = \Ker M$.`,
        R`Si $M^2 = I$ : symétrie par rapport à $F = \Ker(M - I)$ parallèlement à $G = \Ker(M + I)$.`,
        R`Calculer $F$ et $G$ en résolvant les systèmes, et contrôler que $\dim F + \dim G = n$.`
      ],
      exemple: {
        enonce: R`<p>$M = \begin{pmatrix} 1 & 0 \\ 1 & 0 \end{pmatrix}$.</p>`,
        solution: R`<p>$M^2 = \begin{pmatrix} 1 & 0 \\ 1 & 0 \end{pmatrix} = M$ : projection. $\Ker(M - I_2)$ : $x - y = 0$, soit $\Vect\big((1, 1)\big)$ ; $\Ker M$ : $x = 0$, soit $\Vect\big((0, 1)\big)$. C'est la projection sur $\Vect\big((1, 1)\big)$ parallèlement à $\Vect\big((0, 1)\big)$.</p>`
      },
      pieges: [R`Dire « projection sur $\Ker M$ » : c'est l'inverse, on projette <em>sur</em> l'image, <em>parallèlement au</em> noyau.`]
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche méthode, partie 1 : plan de travail ; partie 2 : cas à reconnaître */
  /* ------------------------------------------------------------------ */
  const plan = {
    etapes: [
      { titre: 'Poser le cadre', faire: R`Nommer les espaces, leur <b>dimension</b>, et les bases (<b>ancienne</b> $${B}$, <b>nouvelle</b> $${Bp}$) dans l'ordre.`,
        questions: [R`Quelle est la base de départ, la base d'arrivée ?`, R`Est-ce bien une base (bon nombre de vecteurs, libres) ?`] },
      { titre: 'Traduire en matrices', faire: R`<b>Colonnes = coordonnées</b> : des vecteurs d'une famille, des images $u(e_j)$, des nouveaux vecteurs $e'_j$ (matrice de passage).` },
      { titre: 'Changer de base', faire: R`<b>$X = PX'$</b> pour les coordonnées, <b>$A' = P^{-1}AP$</b> pour un endomorphisme ($Q^{-1}AP$ entre deux espaces).`,
        questions: [R`Est-il plus simple de calculer directement les $u(e'_j)$ ?`] },
      { titre: 'Projections et symétries', faire: R`Vérifier <b>$E = F \oplus G$</b>, décomposer $x = a + b$, puis $p(x) = a$, $s(x) = a - b$ ; ou reconnaître $M^2 = M$, $M^2 = I$.` },
      { titre: 'Vérifier', faire: R`Recomposer un vecteur, contrôler $PP^{-1} = I$, $p(w) = 0$, $M^2 = M$, $\dim F + \dim G = n$.` }
    ]
  };
  const reperes = [
    { etape: 1, si: R`$n$ vecteurs dans un espace de dimension $n$`, alors: R`Il suffit de montrer qu'ils sont <b>libres</b> (ou générateurs) : matrice inversible.` },
    { etape: 1, si: R`Des polynômes de <b>degrés échelonnés</b> $0, 1, \dots, n$`, alors: R`C'est automatiquement une <b>base</b> de $\K_n[X]$.`, ex: R`$\big(1, X - 1, (X - 1)^2\big)$.` },
    { etape: 1, si: R`Une base de polynômes en $(X - a)^k$`, alors: R`Coordonnées par la <b>formule de Taylor</b> : $P(a), P'(a), \frac{P''(a)}{2}, \dots$, ou en écrivant $X = (X - a) + a$.` },
    { etape: 2, si: R`On demande la matrice d'une application <b>définie par une formule</b>`, alors: R`Calculer les images des vecteurs de la base de départ et les <b>ranger en colonnes</b>.` },
    { etape: 2, si: R`Un endomorphisme d'un espace de polynômes`, alors: R`Calculer $u(1), u(X), u(X^2), \dots$ dans la base canonique.`, ex: R`$P \mapsto P'$ sur $\R_2[X]$ : colonnes $(0,0,0), (1,0,0), (0,2,0)$.` },
    { etape: 3, si: R`Les $u(e'_j)$ sont <b>proportionnels</b> aux $e'_j$`, alors: R`$A'$ est <b>diagonale</b> : lire directement les coefficients, sans inverser $P$.` },
    { etape: 3, si: R`On demande $A^k$ et on connaît $A = PDP^{-1}$`, alors: R`<b>$A^k = PD^kP^{-1}$</b>, avec $D^k$ diagonale.` },
    { etape: 3, si: R`Une équation (droite, plan, conique) à écrire dans une autre base`, alors: R`Remplacer les <b>anciennes</b> coordonnées par $X = PX'$.` },
    { etape: 3, si: R`Deux matrices : sont-elles semblables ?`, alors: R`Comparer les <b>invariants</b> (rang ; trace et déterminant au chapitre 2) pour dire non ; pour dire oui, <b>exhiber une base</b>.`, ex: R`$\lambda I_n$ n'est semblable qu'à elle-même.` },
    { etape: 4, si: R`Un plan $F$ d'équation $\varphi = 0$ et une droite $\Vect(w)$`, alors: R`Supplémentaires <b>ssi $\varphi(w) \neq 0$</b> ; projection $x - \frac{\varphi(x)}{\varphi(w)}w$.` },
    { etape: 4, si: R`Une relation $p \circ p = p$`, alors: R`Projection sur <b>$\Imm p$</b> parallèlement à <b>$\Ker p$</b> ; écrire $x = p(x) + (x - p(x))$.` },
    { etape: 4, si: R`Une relation $s \circ s = \Id$`, alors: R`Symétrie ; écrire <b>$x = \frac{x + s(x)}{2} + \frac{x - s(x)}{2}$</b>.`, ex: R`$M \mapsto M^T$ : symétriques ⊕ antisymétriques.` },
    { etape: 4, si: R`On connaît la projection $p$ et on veut la symétrie`, alors: R`<b>$s = 2p - \Id$</b>, sans refaire de calcul.` },
    { etape: 5, si: R`Une matrice de projection calculée`, alors: R`Vérifier <b>$M^2 = M$</b>, $Mw = 0$ pour $w \in G$, et $\rg M = \dim F$.` },
    { etape: 5, si: R`Des coordonnées calculées`, alors: R`<b>Recomposer</b> le vecteur : $\sum a_jv_j$ doit redonner $x$.` }
  ];

  /* ------------------------------------------------------------------ */
  /* Corrections détaillées (bouton « Correction détaillée »)            */
  /* ------------------------------------------------------------------ */
  const details = {
    'coord-r3': {
      but: R`<p>Montrer que $(v_1, v_2, v_3)$ est une base de $\R^3$ et trouver les coordonnées de $(1, 2, 3)$.</p>`,
      methode: R`<p>Résoudre $av_1 + bv_2 + cv_3 = x$ pour $x$ <strong>quelconque</strong> : une solution unique prouve que c'est une base et donne les coordonnées.</p>`,
      etapes: [
        R`<b>Système.</b> $a(1, 1, 0) + b(0, 1, 1) + c(1, 0, 1) = (a + c,\ a + b,\ b + c)$ ; on veut $(x_1, x_2, x_3)$ : $a + c = x_1$, $a + b = x_2$, $b + c = x_3$.`,
        R`<b>Astuce : sommer.</b> $2(a + b + c) = x_1 + x_2 + x_3$.`,
        R`<b>Isoler chaque inconnue.</b> $b = (a + b + c) - (a + c) = \frac{-x_1 + x_2 + x_3}{2}$ ; de même $a = \frac{x_1 + x_2 - x_3}{2}$ et $c = \frac{x_1 - x_2 + x_3}{2}$.`,
        R`<b>Conclusion sur la base.</b> Pour tout $x$, le système a une solution (famille génératrice) et une seule (famille libre) : c'est une base.`,
        R`<b>Application.</b> $x = (1, 2, 3)$ : $a = \frac{1 + 2 - 3}{2} = 0$, $b = \frac{-1 + 2 + 3}{2} = 2$, $c = \frac{1 - 2 + 3}{2} = 1$. Vérification : $2v_2 + v_3 = (0, 2, 2) + (1, 0, 1) = (1, 2, 3)$ ✓.`
      ],
      retenir: R`<p>Résoudre pour un vecteur quelconque fait d'une pierre deux coups : base + coordonnées.</p>`
    },
    'coord-r3#1': {
      but: R`<p>Base de $\R^2$ et coordonnées de $(5, 3)$.</p>`,
      methode: R`<p>Deux vecteurs de $\R^2$ forment une base si leur déterminant est non nul ; puis résoudre un système $2 \times 2$.</p>`,
      etapes: [
        R`<b>Base.</b> $\det\begin{pmatrix} 1 & 3 \\ 2 & 1 \end{pmatrix} = 1 \times 1 - 3 \times 2 = -5 \neq 0$.`,
        R`<b>Système.</b> $a(1, 2) + b(3, 1) = (5, 3)$ : $a + 3b = 5$ et $2a + b = 3$.`,
        R`<b>Résolution.</b> $b = 3 - 2a$, puis $a + 3(3 - 2a) = 5$, soit $-5a = -4$, $a = \frac45$, et $b = 3 - \frac85 = \frac75$.`,
        R`<b>Vérification.</b> $\frac45(1, 2) + \frac75(3, 1) = \left(\frac{25}{5}, \frac{15}{5}\right) = (5, 3)$ ✓.`
      ],
      retenir: R`<p>Les coordonnées peuvent être fractionnaires même si les vecteurs sont entiers.</p>`
    },
    'coord-poly': {
      but: R`<p>Coordonnées d'un polynôme dans la base $\big(1, X - 1, (X - 1)^2\big)$.</p>`,
      methode: R`<p>Écrire $X = (X - 1) + 1$ et développer ; ou utiliser la formule de Taylor en $1$.</p>`,
      etapes: [
        R`<b>Base.</b> Si $a + b(X - 1) + c(X - 1)^2 = 0$, le coefficient de $X^2$ donne $c = 0$, puis celui de $X$ donne $b = 0$, puis $a = 0$. Trois vecteurs libres dans $\R_2[X]$ (dimension 3) : base.`,
        R`<b>Substitution.</b> $X^2 = \big((X - 1) + 1\big)^2 = (X - 1)^2 + 2(X - 1) + 1$ et $3X = 3(X - 1) + 3$.`,
        R`<b>Regroupement.</b> $P = (X - 1)^2 + (2 + 3)(X - 1) + (1 + 3 - 2) = (X - 1)^2 + 5(X - 1) + 2$ : coordonnées $(2, 5, 1)$.`,
        R`<b>Cas général.</b> Si $P = a + b(X - 1) + c(X - 1)^2$ : $P(1) = a$ ; $P' = b + 2c(X - 1)$ donc $P'(1) = b$ ; $P'' = 2c$. Coordonnées : $\left(P(1), P'(1), \frac{P''(1)}{2}\right)$.`,
        R`<b>Matrice de passage.</b> Colonnes = coordonnées de $1$, $X - 1$, $(X - 1)^2 = 1 - 2X + X^2$ dans $(1, X, X^2)$ : $\begin{pmatrix} 1 & -1 & 1 \\ 0 & 1 & -2 \\ 0 & 0 & 1 \end{pmatrix}$.`
      ],
      retenir: R`<p>Dans la base $\big((X - a)^k\big)$, les coordonnées sont $\frac{P^{(k)}(a)}{k!}$.</p>`
    },
    'coord-poly#1': {
      but: R`<p>Montrer que $(L_0, L_1, L_2)$ est une base et identifier les coordonnées.</p>`,
      methode: R`<p>Exploiter $L_i(j) = \delta_{ij}$ : évaluer une combinaison en $0$, $1$, $2$.</p>`,
      etapes: [
        R`<b>Valeurs.</b> $L_0(0) = \frac{(-1)(-2)}{2} = 1$, $L_0(1) = L_0(2) = 0$ ; $L_1(1) = -1 \times (-1) = 1$, $L_1(0) = L_1(2) = 0$ ; $L_2(2) = \frac{2 \times 1}{2} = 1$, $L_2(0) = L_2(1) = 0$.`,
        R`<b>Liberté.</b> Si $aL_0 + bL_1 + cL_2 = 0$, l'évaluation en $0$ donne $a = 0$, en $1$ donne $b = 0$, en $2$ donne $c = 0$.`,
        R`<b>Base.</b> 3 vecteurs libres en dimension 3.`,
        R`<b>Coordonnées.</b> $Q = P(0)L_0 + P(1)L_1 + P(2)L_2$ prend les mêmes valeurs que $P$ en $0, 1, 2$ ; $P - Q$, de degré $\le 2$, a trois racines : il est nul.`,
        R`<b>Application.</b> $X^2$ vaut $0, 1, 4$ en $0, 1, 2$ : $X^2 = L_1 + 4L_2$.`
      ],
      retenir: R`<p>Base de Lagrange : les coordonnées d'un polynôme sont ses valeurs aux points choisis.</p>`
    },
    'mat-app': {
      but: R`<p>Matrice de $u : P \mapsto P(X + 1)$ et de son inverse.</p>`,
      methode: R`<p>Colonnes = images des vecteurs de la base. Pour l'inverse, trouver l'application réciproque.</p>`,
      etapes: [
        R`<b>Linéarité.</b> Remplacer $X$ par $X + 1$ respecte les sommes et les produits par un scalaire.`,
        R`<b>Images.</b> $u(1) = 1$, $u(X) = X + 1$, $u(X^2) = (X + 1)^2 = 1 + 2X + X^2$.`,
        R`<b>Matrice.</b> En colonnes : $A = \begin{pmatrix} 1 & 1 & 1 \\ 0 & 1 & 2 \\ 0 & 0 & 1 \end{pmatrix}$.`,
        R`<b>Réciproque.</b> $v : P \mapsto P(X - 1)$ : $v(u(P)) = P\big((X - 1) + 1\big) = P$ et de même $u(v(P)) = P$.`,
        R`<b>Inverse.</b> $v(1) = 1$, $v(X) = X - 1$, $v(X^2) = 1 - 2X + X^2$ : $A^{-1} = \begin{pmatrix} 1 & -1 & 1 \\ 0 & 1 & -2 \\ 0 & 0 & 1 \end{pmatrix}$ ; contrôle $AA^{-1} = I_3$.`
      ],
      retenir: R`<p>$${Mat}(u^{-1}) = ${Mat}(u)^{-1}$ : trouver la réciproque évite le calcul d'inverse.</p>`
    },
    'mat-app#1': {
      but: R`<p>Matrice de $u$ dans des bases non canoniques au départ et à l'arrivée.</p>`,
      methode: R`<p>Colonne $j$ = coordonnées de $u(e'_j)$ <strong>dans $\mathcal{C}'$</strong>. Contrôle par $A' = Q^{-1}AP$.</p>`,
      etapes: [
        R`<b>Bases canoniques.</b> $u(e_1) = (1, 3)$, $u(e_2) = (2, -1)$, $u(e_3) = (-1, 0)$ : $A = \begin{pmatrix} 1 & 2 & -1 \\ 3 & -1 & 0 \end{pmatrix}$.`,
        R`<b>Images des nouveaux vecteurs.</b> $u(1, 1, 1) = (2, 2)$, $u(1, 0, 1) = (0, 3)$, $u(0, 1, 2) = (0, -1)$.`,
        R`<b>Coordonnées dans $\mathcal{C}'$.</b> $(p, q) = a(1, 1) + b(1, 2)$ donne $b = q - p$, $a = 2p - q$. D'où $(2, 2) \to (2, 0)$, $(0, 3) \to (-3, 3)$, $(0, -1) \to (1, -1)$.`,
        R`<b>Matrice.</b> $A' = \begin{pmatrix} 2 & -3 & 1 \\ 0 & 3 & -1 \end{pmatrix}$.`,
        R`<b>Contrôle.</b> $Q^{-1}(AP)$ avec $Q^{-1} = \begin{pmatrix} 2 & -1 \\ -1 & 1 \end{pmatrix}$ et $AP = \begin{pmatrix} 2 & 0 & 0 \\ 2 & 3 & -1 \end{pmatrix}$ redonne $A'$.`
      ],
      retenir: R`<p>Entre deux espaces différents : $A' = Q^{-1}AP$, avec $Q$ pour l'arrivée et $P$ pour le départ.</p>`
    },
    passage: {
      but: R`<p>Matrice de $u$ dans $${Bp}$, puis puissances de $A$.</p>`,
      methode: R`<p>$A' = P^{-1}AP$ ; si $A'$ est diagonale, $A^k = PA'^kP^{-1}$.</p>`,
      etapes: [
        R`<b>Matrice de passage.</b> $P = \begin{pmatrix} 1 & 2 \\ 1 & 1 \end{pmatrix}$, $\det P = 1 - 2 = -1$.`,
        R`<b>Inverse.</b> $P^{-1} = \frac{1}{-1}\begin{pmatrix} 1 & -2 \\ -1 & 1 \end{pmatrix} = \begin{pmatrix} -1 & 2 \\ 1 & -1 \end{pmatrix}$.`,
        R`<b>Calcul direct de $A'$.</b> $Ae'_1 = (4 - 2,\ 1 + 1) = (2, 2) = 2e'_1$ ; $Ae'_2 = (8 - 2,\ 2 + 1) = (6, 3) = 3e'_2$. Donc $A' = \mathrm{diag}(2, 3)$.`,
        R`<b>Puissances.</b> $A = PA'P^{-1}$, donc $A^k = PA'^kP^{-1}$ et $A'^k = \mathrm{diag}(2^k, 3^k)$.`,
        R`<b>Produit.</b> $PA'^k = \begin{pmatrix} 2^k & 2\cdot3^k \\ 2^k & 3^k \end{pmatrix}$, puis multiplication par $P^{-1}$ : $A^k = \begin{pmatrix} -2^k + 2\cdot3^k & 2^{k+1} - 2\cdot3^k \\ -2^k + 3^k & 2^{k+1} - 3^k \end{pmatrix}$.`,
        R`<b>Contrôle.</b> $k = 1$ : $\begin{pmatrix} -2 + 6 & 4 - 6 \\ -2 + 3 & 4 - 3 \end{pmatrix} = A$ ✓.`
      ],
      retenir: R`<p>Une bonne base rend la matrice diagonale, et les puissances deviennent faciles.</p>`
    },
    'chgt-coord': {
      but: R`<p>Formules de changement de coordonnées et équations dans la nouvelle base.</p>`,
      methode: R`<p>$X = PX'$, puis substituer dans l'équation.</p>`,
      etapes: [
        R`<b>Matrice de passage.</b> $P = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$.`,
        R`<b>Anciennes coordonnées.</b> $X = PX'$ : $x = x' + y'$, $y = x' - y'$.`,
        R`<b>Nouvelles coordonnées.</b> En ajoutant et soustrayant : $x' = \frac{x + y}{2}$, $y' = \frac{x - y}{2}$.`,
        R`<b>Droite.</b> $x + y = (x' + y') + (x' - y') = 2x'$ : l'équation devient $x' = 1$.`,
        R`<b>Courbe.</b> $xy = (x' + y')(x' - y') = x'^2 - y'^2$ : l'équation devient $x'^2 - y'^2 = 1$.`
      ],
      retenir: R`<p>Pour transformer une équation, on remplace les anciennes coordonnées : $X = PX'$.</p>`
    },
    'chgt-coord#1': {
      but: R`<p>Équation d'un plan dans une nouvelle base.</p>`,
      methode: R`<p>Exprimer $x, y, z$ en fonction de $a, b, c$ par $X = PX'$.</p>`,
      etapes: [
        R`<b>Matrice de passage.</b> $P = \begin{pmatrix} 1 & 0 & 1 \\ -1 & 1 & 1 \\ 0 & -1 & 1 \end{pmatrix}$ (vecteurs en colonnes).`,
        R`<b>Formules.</b> $x = a + c$, $y = -a + b + c$, $z = -b + c$.`,
        R`<b>Substitution.</b> $x + y + z = (a - a) + (b - b) + 3c = 3c$.`,
        R`<b>Conclusion.</b> Le plan a pour équation $c = 0$, c'est $\Vect(e'_1, e'_2)$.`
      ],
      retenir: R`<p>Une base adaptée au plan rend son équation triviale.</p>`
    },
    semblables: {
      but: R`<p>Décider si des matrices sont semblables.</p>`,
      methode: R`<p>Pour dire « non » : un invariant (rang) ou un argument direct. Pour dire « oui » : exhiber une base, c'est-à-dire $P$.</p>`,
      etapes: [
        R`<b>Matrices scalaires.</b> $P^{-1}(\lambda I_n)P = \lambda P^{-1}P = \lambda I_n$ : on ne peut obtenir que $\lambda I_n$.`,
        R`<b>Conséquence.</b> $\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix} \neq I_2$ n'est pas semblable à $I_2$.`,
        R`<b>Produits.</b> $B(1, 2)^T = (1 + 4, 2 + 8)^T = (5, 10)^T = 5(1, 2)^T$ et $B(2, -1)^T = (2 - 2, 4 - 4)^T = 0$.`,
        R`<b>Nouvelle base.</b> $(1, 2)$ et $(2, -1)$ ne sont pas colinéaires ; l'endomorphisme associé à $B$ les envoie sur $5 \cdot (1, 2)$ et $0$ : sa matrice dans cette base est $\mathrm{diag}(5, 0) = P^{-1}BP$.`,
        R`<b>Rang.</b> $\rg B = 1$ (lignes proportionnelles) $\neq 2 = \rg I_2$ : pas semblables.`
      ],
      retenir: R`<p>Semblables = même endomorphisme dans deux bases ; le rang est un invariant.</p>`
    },
    supplementaires: {
      but: R`<p>Montrer $\R^3 = F \oplus G$ et décomposer un vecteur.</p>`,
      methode: R`<p>Intersection nulle + dimensions ; décomposition en cherchant $b = tw$.</p>`,
      etapes: [
        R`<b>Dimensions.</b> $F$ est défini par une équation non nulle : plan, $\dim F = 2$ ; $\dim G = 1$.`,
        R`<b>Intersection.</b> Un vecteur $tw = (t, t, t)$ de $G$ est dans $F$ si $t + 2t - t = 2t = 0$, donc $t = 0$.`,
        R`<b>Conclusion.</b> $F \cap G = \{0\}$ et $2 + 1 = 3$ : $\R^3 = F \oplus G$.`,
        R`<b>Décomposition.</b> $v - tw \in F$ : $(x - t) + 2(y - t) - (z - t) = 0 \iff t = \frac{x + 2y - z}{2}$.`,
        R`<b>Application.</b> $v = (3, 0, 1)$ : $t = 1$, $b = (1, 1, 1)$, $a = (2, -1, 0)$ ✓.`
      ],
      retenir: R`<p>Plan $\varphi = 0$ et droite $\Vect(w)$ : supplémentaires dès que $\varphi(w) \neq 0$.</p>`
    },
    'supplementaires#1': {
      but: R`<p>Décider si $F$ et $G$ sont supplémentaires à partir de bases.</p>`,
      methode: R`<p>Juxtaposer les bases : supplémentaires si et seulement si on obtient une base de $\R^3$.</p>`,
      etapes: [
        R`<b>Juxtaposition.</b> $(1, 0, 1)$, $(0, 1, 1)$, $(1, 1, 0)$ en colonnes.`,
        R`<b>Déterminant.</b> Développement selon la 1<sup>re</sup> ligne : $1 \times (0 - 1) - 0 + 1 \times (0 - 1) = -2$.`,
        R`<b>Conclusion.</b> Non nul : base de $\R^3$, donc $\R^3 = F \oplus G$.`
      ],
      retenir: R`<p>Base adaptée ⇔ supplémentaires.</p>`
    },
    'supplementaires#2': {
      but: R`<p>Reconnaître que $G \subset F$ et trouver un vrai supplémentaire.</p>`,
      methode: R`<p>Tester si le vecteur directeur de $G$ vérifie l'équation de $F$.</p>`,
      etapes: [
        R`<b>Test.</b> $1 + (-1) + 0 = 0$ : $(1, -1, 0) \in F$.`,
        R`<b>Conséquence.</b> $F \cap G = G \neq \{0\}$ : pas supplémentaires.`,
        R`<b>Un supplémentaire.</b> Il faut $w$ avec $w_1 + w_2 + w_3 \neq 0$, par exemple $(0, 0, 1)$.`
      ],
      retenir: R`<p>Une droite supplémentaire d'un plan ne doit pas être contenue dans ce plan.</p>`
    },
    'proj-r3': {
      but: R`<p>Matrices de la projection sur $F$ parallèlement à $G$ et de la symétrie associée.</p>`,
      methode: R`<p>$p(v) = v - \frac{\varphi(v)}{\varphi(w)}w$ avec $\varphi(x, y, z) = x + 2y - z$, $\varphi(w) = 2$ ; puis $s = 2p - \Id$.</p>`,
      etapes: [
        R`<b>Formule.</b> $p(x, y, z) = (x, y, z) - \frac{x + 2y - z}{2}(1, 1, 1)$.`,
        R`<b>Colonnes.</b> $p(e_1) = (1, 0, 0) - \frac12(1, 1, 1) = \frac12(1, -1, -1)$ ; $p(e_2) = (0, 1, 0) - (1, 1, 1) = (-1, 0, -1)$ ; $p(e_3) = (0, 0, 1) + \frac12(1, 1, 1) = \frac12(1, 1, 3)$.`,
        R`<b>Matrice de $p$.</b> $\frac12\begin{pmatrix} 1 & -2 & 1 \\ -1 & 0 & 1 \\ -1 & -2 & 3 \end{pmatrix}$.`,
        R`<b>Matrice de $s$.</b> $2${Mat}(p) - I_3 = \begin{pmatrix} 0 & -2 & 1 \\ -1 & -1 & 1 \\ -1 & -2 & 2 \end{pmatrix}$.`,
        R`<b>Base adaptée.</b> $(1, 0, 1)$ et $(0, 1, 2)$ vérifient $x + 2y - z = 0$ et ne sont pas colinéaires ; avec $w$ : $\mathrm{diag}(1, 1, 0)$ et $\mathrm{diag}(1, 1, -1)$.`
      ],
      retenir: R`<p>Colonnes de $${Mat}(p)$ = images des vecteurs de la base canonique.</p>`
    },
    'proj-r2': {
      but: R`<p>Matrices de la projection sur $D_1$ parallèlement à $D_2$ et de la symétrie.</p>`,
      methode: R`<p>Une forme linéaire nulle sur $D_2$ isole la composante sur $D_1$.</p>`,
      etapes: [
        R`<b>Équation de $D_2$.</b> $D_2 = \Vect\big((1, 1)\big)$ : $x - y = 0$.`,
        R`<b>Composante.</b> $(x, y) = \alpha(1, 2) + \beta(1, 1)$ ; on applique $x - y$ : $x - y = \alpha(1 - 2) + \beta \cdot 0 = -\alpha$.`,
        R`<b>Projection.</b> $p(x, y) = \alpha(1, 2) = (y - x)(1, 2)$, matrice $\begin{pmatrix} -1 & 1 \\ -2 & 2 \end{pmatrix}$.`,
        R`<b>Symétrie.</b> $2\begin{pmatrix} -1 & 1 \\ -2 & 2 \end{pmatrix} - I_2 = \begin{pmatrix} -3 & 2 \\ -4 & 3 \end{pmatrix}$.`,
        R`<b>Contrôle.</b> $\begin{pmatrix} -3 & 2 \\ -4 & 3 \end{pmatrix}^2 = \begin{pmatrix} 9 - 8 & -6 + 6 \\ 12 - 12 & -8 + 9 \end{pmatrix} = I_2$ ✓.`
      ],
      retenir: R`<p>$s = 2p - \Id$ et $s^2 = \Id$ : un bon contrôle.</p>`
    },
    reconnaitre: {
      but: R`<p>Identifier la projection $M$ et la symétrie $N$.</p>`,
      methode: R`<p>Calculer le carré, puis les noyaux de $M - I$, $M$ (ou $N + I$).</p>`,
      etapes: [
        R`<b>$M^2$.</b> Ligne 1 : $(4 - 2,\ -4 + 2) = (2, -2)$ ; ligne 2 : $(2 - 1,\ -2 + 1) = (1, -1)$ : $M^2 = M$.`,
        R`<b>Éléments de $M$.</b> $\Ker(M - I_2)$ : $x - 2y = 0$, $\Vect\big((2, 1)\big)$ ; $\Ker M$ : $x - y = 0$, $\Vect\big((1, 1)\big)$.`,
        R`<b>$N^2$.</b> $\begin{pmatrix} 9 - 8 & -12 + 12 \\ 6 - 6 & -8 + 9 \end{pmatrix} = I_2$ : symétrie.`,
        R`<b>Éléments de $N$.</b> $N - I_2 = \begin{pmatrix} 2 & -4 \\ 2 & -4 \end{pmatrix}$ : $\Vect\big((2, 1)\big)$ ; $N + I_2 = \begin{pmatrix} 4 & -4 \\ 2 & -2 \end{pmatrix}$ : $\Vect\big((1, 1)\big)$.`,
        R`<b>Lien.</b> $2M - I_2 = N$ : même décomposition $\R^2 = \Vect\big((2, 1)\big) \oplus \Vect\big((1, 1)\big)$.`
      ],
      retenir: R`<p>Projection : sur $\Ker(M - I)$, parallèlement à $\Ker M$.</p>`
    },
    projecteur: {
      but: R`<p>Propriétés de $q = \Id - p$ quand $p$ est un projecteur.</p>`,
      methode: R`<p>Développer les compositions en utilisant $p^2 = p$.</p>`,
      etapes: [
        R`<b>$q^2$.</b> $(\Id - p) \circ (\Id - p) = \Id - p - p + p^2 = \Id - p$.`,
        R`<b>Produits.</b> $p \circ q = p - p^2 = 0$ et $q \circ p = p - p^2 = 0$.`,
        R`<b>$\Imm q \subset \Ker p$.</b> $p(q(x)) = 0$.`,
        R`<b>$\Ker p \subset \Imm q$.</b> Si $p(x) = 0$, $q(x) = x$.`,
        R`<b>$\Ker q = \Imm p$.</b> $q(x) = 0 \iff x = p(x)$ ; un tel $x$ est une image, et réciproquement $p(p(y)) = p(y)$.`,
        R`<b>Rangs.</b> $\rg q = \dim\Ker p = \dim E - \rg p$ (théorème du rang).`
      ],
      retenir: R`<p>$p$ et $\Id - p$ se partagent l'espace : l'image de l'un est le noyau de l'autre.</p>`
    },
    'projecteur#1': {
      but: R`<p>Condition pour que $p + q$ soit un projecteur.</p>`,
      methode: R`<p>Développer $(p + q)^2$ puis composer par $p$ à gauche et à droite.</p>`,
      etapes: [
        R`<b>Développement.</b> $(p + q)^2 = p^2 + pq + qp + q^2 = p + q + pq + qp$.`,
        R`<b>Équivalence.</b> $p + q$ projecteur $\iff pq + qp = 0$.`,
        R`<b>Composer à gauche par $p$.</b> $p^2q + pqp = pq + pqp = 0$.`,
        R`<b>Composer à droite par $p$.</b> $pqp + qp^2 = pqp + qp = 0$.`,
        R`<b>Conclusion.</b> Par différence $pq = qp$ ; avec $pq + qp = 0$, $2pq = 0$, donc $pq = qp = 0$.`
      ],
      retenir: R`<p>Composer une relation à gauche et à droite par un projecteur est une technique classique.</p>`
    },
    transposition: {
      but: R`<p>Reconnaître la transposition comme une symétrie et en déduire $\M_n = \mathcal{S}_n \oplus \mathcal{A}_n$.</p>`,
      methode: R`<p>$s \circ s = \Id$ ⇒ symétrie par rapport à $\Ker(s - \Id)$ parallèlement à $\Ker(s + \Id)$.</p>`,
      etapes: [
        R`<b>Linéarité et involution.</b> $(\lambda M + \mu N)^T = \lambda M^T + \mu N^T$ ; $(M^T)^T = M$.`,
        R`<b>Éléments.</b> $s(M) = M \iff M \in \mathcal{S}_n$ ; $s(M) = -M \iff M \in \mathcal{A}_n$.`,
        R`<b>Supplémentaires.</b> Caractérisation des symétries : $\M_n(\R) = \mathcal{S}_n \oplus \mathcal{A}_n$.`,
        R`<b>Dimensions.</b> Coefficients libres : $i \le j$ pour $\mathcal{S}_n$ ($\frac{n(n+1)}2$), $i \lt j$ pour $\mathcal{A}_n$ ($\frac{n(n-1)}2$) ; total $n^2$ ✓.`,
        R`<b>Application.</b> $M^T = \begin{pmatrix} 1 & 4 \\ 2 & 3 \end{pmatrix}$ : $\frac{M + M^T}2 = \begin{pmatrix} 1 & 3 \\ 3 & 3 \end{pmatrix}$, $\frac{M - M^T}{2} = \begin{pmatrix} 0 & -1 \\ 1 & 0 \end{pmatrix}$.`
      ],
      retenir: R`<p>$x = \frac{x + s(x)}{2} + \frac{x - s(x)}{2}$ : partie « paire » + partie « impaire ».</p>`
    },
    'transposition#1': {
      but: R`<p>Étudier $\sigma : P(X) \mapsto P(-X)$.</p>`,
      methode: R`<p>Montrer $\sigma^2 = \Id$, puis lire la matrice dans la base canonique.</p>`,
      etapes: [
        R`<b>Involution.</b> $\sigma(\sigma(P))(X) = P(-(-X)) = P(X)$.`,
        R`<b>Matrice.</b> $\sigma(X^k) = (-X)^k = (-1)^kX^k$ : $\mathrm{diag}(1, -1, 1, -1)$.`,
        R`<b>Éléments.</b> Vecteurs fixes : $\Vect(1, X^2)$ ; vecteurs changés en leur opposé : $\Vect(X, X^3)$.`,
        R`<b>Décomposition.</b> $P(-X) = -X^3 + 2X^2 + X + 5$ ; $\frac{P + \sigma(P)}{2} = 2X^2 + 5$, $\frac{P - \sigma(P)}{2} = X^3 - X$.`
      ],
      retenir: R`<p>Dans une base adaptée, la matrice d'une symétrie n'a que des $1$ et des $-1$ sur la diagonale.</p>`
    },
    'proj-poly': {
      but: R`<p>Montrer que $p : P \mapsto P(0) + P'(0)X$ est un projecteur et le décrire.</p>`,
      methode: R`<p>Vérifier $p \circ p = p$, puis $\Imm p$ et $\Ker p$ ; matrice dans la base canonique.</p>`,
      etapes: [
        R`<b>Linéarité.</b> $P \mapsto P(0)$ et $P \mapsto P'(0)$ sont linéaires.`,
        R`<b>Idempotence.</b> $Q = a + bX$ vérifie $Q(0) = a$, $Q'(0) = b$, donc $p(Q) = Q$ ; en particulier $p(p(P)) = p(P)$.`,
        R`<b>Image.</b> $\Imm p \subset \R_1[X]$ et chaque $a + bX$ est fixe : $\Imm p = \R_1[X]$.`,
        R`<b>Noyau.</b> Si $P = a_0 + a_1X + a_2X^2 + a_3X^3$, alors $P(0) = a_0$ et $P'(0) = a_1$ : $\Ker p = \Vect(X^2, X^3)$.`,
        R`<b>Matrice.</b> $p(1) = 1$, $p(X) = X$, $p(X^2) = p(X^3) = 0$ : $\mathrm{diag}(1, 1, 0, 0)$.`
      ],
      retenir: R`<p>La base canonique est ici adaptée : la matrice est directement diagonale.</p>`
    }
  };

  L2.chapter('algebre3', 'coordonnees', {
    intro: R`<p>Un même vecteur, une même application linéaire, se décrivent par des <strong>coordonnées</strong> et des <strong>matrices</strong> qui dépendent de la base choisie. Ce chapitre explique comment passer d'une base à une autre (<strong>matrice de passage</strong>, formules $X = PX'$ et $A' = P^{-1}AP$), puis étudie deux familles d'endomorphismes qui deviennent très simples dans une base bien choisie : les <strong>projections</strong> et les <strong>symétries</strong>. C'est la préparation directe de la diagonalisation (chapitre 2).</p>`,
    cours, fiche, exercices, methodes, generateurs, plan, reperes, details
  });
})();
