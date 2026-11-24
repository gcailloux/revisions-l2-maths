/* Algèbre 3 — Chapitre 2 : Diagonalisation */
(function () {
  'use strict';
  const R = String.raw;
  const { F, poly, mat, vec, tuple, kernel, rref, rank, matMul, matVec, inv, det, trace, unimod, factored,
    polyFromRoots, minusLambda, subLambda, lin, isProportional, sqrtSimplify } = ML;
  const Mat = R`\mathrm{Mat}`;

  /* ------------------------------------------------------------------ */
  /* Outils de génération                                                */
  /* ------------------------------------------------------------------ */
  function diag(l) { return l.map((x, i) => l.map((_, j) => (i === j ? x : 0))); }
  function isTriangular(A) {
    const n = A.length;
    let up = true, lo = true;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (i > j && A[i][j] !== 0) up = false;
      if (i < j && A[i][j] !== 0) lo = false;
    }
    return up || lo;
  }
  const toInt = M => M.map(r => r.map(x => F(x).val()));
  const maxAbs = M => Math.max(...M.flat().map(Math.abs));
  /* A = P J P^{-1} à coefficients entiers et petits (P de déterminant 1), ou null */
  function randSimilar(r, J, maxEntry, tries) {
    const n = J.length;
    for (let t = 0; t < (tries || 3000); t++) {
      const P = unimod(r, n, n === 2 ? r.int(2, 3) : r.int(3, 5));
      const A = matMul(matMul(P, J), toInt(inv(P)));
      const zeros = A.flat().filter(x => x === 0).length;
      if (maxAbs(A) <= maxEntry && zeros <= Math.floor(n * n / 3) && !isTriangular(A)) return A;
    }
    return null;
  }
  /* A = P D P^{-1} diagonalisable. pickEigs() tire les valeurs propres (re-tirées régulièrement). */
  function randDiagonalizable(r, n, pickEigs, maxEntry) {
    for (let k = 0; k < 75; k++) {
      const eigs = pickEigs();
      const A = randSimilar(r, diag(eigs), maxEntry, 40);
      if (A) return { A, eigs };
    }
    // secours (cohérent : valeurs propres exactes de la matrice renvoyée)
    return n === 2 ? { A: [[4, -2], [1, 1]], eigs: [2, 3] } : { A: [[2, 0, 4], [3, -4, 12], [1, -2, 5]], eigs: [0, 1, 2] };
  }
  function pick2(r) {
    return () => {
      let l1 = r.int(-3, 4), l2;
      do { l2 = r.int(-3, 5); } while (l2 === l1 || Math.abs(l2 - l1) > 5);
      return l1 < l2 ? [l1, l2] : [l2, l1];
    };
  }
  function pick3(r, pool) { return () => r.sample(pool, 3).sort((a, b) => a - b); }
  const AmL = (l, n) => minusLambda('A', l, 'I_' + n);
  const vectTex = vs => R`\Vect\left(` + vs.map(tuple).join(R`,\,`) + R`\right)`;
  const pn = x => (F(x).val() < 0 ? '(' + F(x).tex() + ')' : F(x).tex());   // nombre entre parenthèses s'il est négatif
  const minor = (A, i, j) => A[i][i] * A[j][j] - A[i][j] * A[j][i];     // mineur principal (lignes/colonnes i, j)
  const sumTex = s => s.replace(/\+ -/g, '- ');
  /* Système MX = 0 échelonné, équations à coefficients entiers */
  function eqsTex(M, vars) {
    const { R: Rr } = rref(M);
    const eqs = Rr.filter(row => row.some(x => !x.isZero())).map(row => lin(ML.primitive(row), vars) + ' = 0');
    return eqs.length === 1 ? eqs[0] : R`\begin{cases} ${eqs.join(R` \\ `)} \end{cases}`;
  }
  /* c·q^n (q entier), pour écrire u_n = λ r1^n + μ r2^n */
  const qn = q => (q === 1 ? '' : q < 0 ? '(' + q + ')^n' : q + '^n');
  function combo(pairs) {
    const t = pairs.filter(([c]) => c !== 0).map(([c, q]) => {
      const b = qn(q);
      if (!b) return String(c);
      return (c === 1 ? '' : c === -1 ? '-' : c + R`\cdot `) + b;
    });
    return sumTex(t.join(' + ')) || '0';
  }
  const s2of = A => minor(A, 0, 1) + minor(A, 0, 2) + minor(A, 1, 2);

  /* ------------------------------------------------------------------ */
  /* Générateurs                                                         */
  /* ------------------------------------------------------------------ */
  const generateurs = {
    det3: {
      title: 'Déterminant et trace d’une matrice 3×3', diff: 1,
      make(r) {
        let A;
        const zeroLine = M => [0, 1, 2].some(k => M[k].every(x => x === 0) || M.every(rw => rw[k] === 0));
        do {
          A = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => r.int(-3, 4)));
          const k = r.int(1, 2);
          for (let z = 0; z < k; z++) A[r.int(0, 2)][r.int(0, 2)] = 0;
        } while (A.flat().filter(x => x === 0).length > 3 || isTriangular(A) || zeroLine(A));
        let best = { type: 'ligne', k: 0, z: -1 };
        for (let k = 0; k < 3; k++) {
          const zr = A[k].filter(x => x === 0).length, zc = A.map(rw => rw[k]).filter(x => x === 0).length;
          if (zr > best.z) best = { type: 'ligne', k, z: zr };
          if (zc > best.z) best = { type: 'colonne', k, z: zc };
        }
        const d = det(A), t = trace(A);
        const cells = [0, 1, 2].map(j => (best.type === 'ligne' ? [best.k, j] : [j, best.k]));
        const terms = cells.map(([i, j]) => {
          const Mn = A.filter((_, ii) => ii !== i).map(rw => rw.filter((_, jj) => jj !== j));
          return { i, j, a: A[i][j], s: (i + j) % 2 ? -1 : 1, Mn, m: det(Mn) };
        }).filter(x => x.a !== 0);
        const sgn = (s, first) => (s < 0 ? '- ' : first ? '' : '+ ');
        const devTex = terms.map((x, k) => sgn(x.s, k === 0) + pn(x.a) + mat(x.Mn, 'vmatrix')).join(' ');
        const valTex = terms.map((x, k) => sgn(x.s, k === 0) + pn(x.a) + R` \times ` + pn(x.m)).join(' ');
        const where = R`la ${best.type} ${best.k + 1}`;
        const sarrus = A[0][0] * A[1][1] * A[2][2] + A[0][1] * A[1][2] * A[2][0] + A[0][2] * A[1][0] * A[2][1];
        const sarrus2 = A[0][2] * A[1][1] * A[2][0] + A[0][0] * A[1][2] * A[2][1] + A[0][1] * A[1][0] * A[2][2];
        const concl = d !== 0
          ? R`$\det A = ${d} \neq 0$ : <strong>$A$ est inversible</strong>, et $\det(A^{-1}) = ${F(1, d).tex()}$.`
          : R`$\det A = 0$ : <strong>$A$ n'est pas inversible</strong> ; $0$ est valeur propre de $A$.`;
        return {
          enonce: R`<p>Soit $A = ${mat(A)}$. Calculer $\det A$ et $\tr A$. La matrice $A$ est-elle inversible ?</p>`,
          indication: R`<p>Développez selon une ligne ou une colonne qui contient un zéro (signes $(-1)^{i+j}$), ou utilisez la règle de Sarrus.</p>`,
          correction: R`<p>On développe selon ${where}, qui contient ${best.z === 1 ? 'un zéro' : best.z + ' zéros'} (le coefficient en position $(i, j)$ est affecté du signe $(-1)^{i+j}$) :</p>
            $$\det A = ${devTex} = ${valTex} = ${d}.$$
            <p>$\tr A = ${A[0][0]} + ${pn(A[1][1])} + ${pn(A[2][2])} = ${t}$.</p>
            <p>${concl}</p>`,
          detail: {
            but: R`<p>Calculer le déterminant et la trace de $A$, et conclure sur l'inversibilité.</p>`,
            methode: R`<p>Développer selon la ligne ou la colonne <strong>qui a le plus de zéros</strong> ; contrôler avec la règle de Sarrus.</p>`,
            etapes: [
              R`<b>Choix.</b> ${where[0].toUpperCase() + where.slice(1)} contient ${best.z === 1 ? 'un zéro' : best.z + ' zéros'} : moins de termes à calculer.`,
              R`<b>Signes.</b> Le coefficient $a_{ij}$ est affecté du signe $(-1)^{i+j}$ (damier $\begin{smallmatrix} + & - & + \\ - & + & - \\ + & - & + \end{smallmatrix}$) et multiplié par le déterminant obtenu en barrant la ligne $i$ et la colonne $j$.`,
              R`<b>Développement.</b> $\det A = ${devTex}$.`,
              R`<b>Mineurs.</b> ${terms.map(x => R`$${mat(x.Mn, 'vmatrix')} = ${x.Mn[0][0]} \times ${pn(x.Mn[1][1])} - ${pn(x.Mn[0][1])} \times ${pn(x.Mn[1][0])} = ${x.m}$`).join(' ; ')}, d'où $\det A = ${valTex} = ${d}$.`,
              R`<b>Contrôle (Sarrus).</b> $(${sumTex([A[0][0] * A[1][1] * A[2][2], A[0][1] * A[1][2] * A[2][0], A[0][2] * A[1][0] * A[2][1]].join(' + '))}) - (${sumTex([A[0][2] * A[1][1] * A[2][0], A[0][0] * A[1][2] * A[2][1], A[0][1] * A[1][0] * A[2][2]].join(' + '))}) = ${sarrus} - ${pn(sarrus2)} = ${d}$ ✓.`,
              R`<b>Trace.</b> Somme des coefficients diagonaux : $\tr A = ${t}$.`,
              R`<b>Conclusion.</b> ${concl}`
            ],
            retenir: R`<p>$A$ inversible $\iff \det A \neq 0 \iff 0 \notin \Sp(A)$.</p>`
          }
        };
      }
    },

    spectre2: {
      title: 'Éléments propres d’une matrice 2×2', diff: 1,
      make(r) {
        const { A, eigs: [l1, l2] } = randDiagonalizable(r, 2, pick2(r), 9);
        const t = trace(A), d = det(A);
        let cor = R`<p><strong>Polynôme caractéristique.</strong> Pour une matrice $2\times2$ : $\chi_A(X) = X^2 - \tr(A)\,X + \det(A)$, avec $\tr(A) = ${t}$ et $\det(A) = ${d}$. Donc</p>
          $$\chi_A(X) = ${poly([d, -t, 1])}.$$
          <p>Discriminant : $\Delta = ${t}^2 - 4\times(${d}) = ${t * t - 4 * d}$, d'où deux racines distinctes et</p>
          $$\chi_A(X) = ${factored([[l1, 1], [l2, 1]])}, \qquad \Sp(A) = \{${l1},\,${l2}\}.$$`;
        [l1, l2].forEach(l => {
          const B = subLambda(A, l), ker = kernel(B);
          const row = B[0].some(x => x !== 0) ? B[0] : B[1];
          cor += R`<p><strong>Sous-espace propre pour $\lambda = ${l}$.</strong> $${AmL(l, 2)} = ${mat(B)}$ est de rang $1$ (ses lignes sont proportionnelles). Le système $(${AmL(l, 2)})X = 0$ se réduit à $${lin(row, ['x', 'y'])} = 0$, donc</p>
            $$E_{${l}}(A) = ${vectTex(ker)}.$$`;
        });
        cor += R`<p><em>Vérification :</em> $\lambda_1 + \lambda_2 = ${l1 + l2} = \tr A$ et $\lambda_1\lambda_2 = ${l1 * l2} = \det A$.</p>`;
        return {
          detail: {
            but: R`<p>Polynôme caractéristique, valeurs propres et bases des sous-espaces propres de $A = ${mat(A)}$.</p>`,
            methode: R`<p>En taille 2 : $\chi_A(X) = X^2 - \tr(A)X + \det(A)$. Pour chaque valeur propre $\lambda$, $E_\lambda(A) = \Ker(A - \lambda I_2)$ ; comme $A - \lambda I_2$ est de rang 1, une seule équation suffit.</p>`,
            etapes: [
              R`<b>Trace et déterminant.</b> $\tr A = ${A[0][0]} + ${pn(A[1][1])} = ${t}$ (somme de la diagonale) et $\det A = ${A[0][0]} \times ${pn(A[1][1])} - ${pn(A[0][1])} \times ${pn(A[1][0])} = ${d}$.`,
              R`<b>Polynôme caractéristique.</b> $\chi_A(X) = ${poly([d, -t, 1])}$.`,
              R`<b>Racines.</b> $\Delta = ${pn(t)}^2 - 4 \times ${pn(d)} = ${t * t - 4 * d}$, $\sqrt\Delta = ${l2 - l1}$, donc $\lambda = \frac{${t} \pm ${l2 - l1}}{2}$ : $\lambda_1 = ${l1}$ et $\lambda_2 = ${l2}$.`,
              ...[l1, l2].map(l => {
                const B = subLambda(A, l), ker = kernel(B);
                const row = B[0].some(x => x !== 0) ? B[0] : B[1];
                const v = ker[0], Av = matVec(A, v);
                return R`<b>$E_{${l}}(A)$.</b> $A - ${pn(l)}I_2 = ${mat(B)}$ : ses lignes sont proportionnelles (son déterminant est nul), le système se réduit à $${lin(row, ['x', 'y'])} = 0$. Une solution non nulle est $v = ${tuple(v)}$, donc $E_{${l}}(A) = ${vectTex(ker)}$. Contrôle : $Av = ${vec(Av)} = ${pn(l)}\,v$ ✓.`;
              }),
              R`<b>Vérification globale.</b> $\lambda_1 + \lambda_2 = ${l1 + l2} = \tr A$ et $\lambda_1\lambda_2 = ${l1 * l2} = \det A$.`
            ],
            retenir: R`<p>En dimension 2 : somme des valeurs propres = trace, produit = déterminant.</p>`
          },
          enonce: R`<p>Soit $A = ${mat(A)} \in \M_2(\R)$. Déterminer le polynôme caractéristique de $A$, ses valeurs propres, et une base de chaque sous-espace propre.</p>`,
          indication: R`<p>Utilisez $\chi_A(X) = X^2 - \tr(A)X + \det(A)$, puis résolvez $(A - \lambda I_2)X = 0$ pour chaque valeur propre : une seule équation suffit.</p>`,
          correction: cor
        };
      }
    },

    polycar2: {
      title: 'Spectre réel ou complexe (2×2)', diff: 1,
      make(r) {
        let A;
        do { A = [[r.int(-5, 5), r.int(-5, 5)], [r.int(-5, 5), r.int(-5, 5)]]; } while (isTriangular(A));
        const t = trace(A), d = det(A), D = t * t - 4 * d;
        let cor = R`<p>$\chi_A(X) = X^2 - \tr(A)X + \det(A) = ${poly([d, -t, 1])}$, de discriminant $\Delta = ${t}^2 - 4\times(${d}) = ${D}$.</p>`;
        const a = F(t, 2);
        if (D === 0) {
          cor += R`<p>$\Delta = 0$ : une valeur propre double $\lambda = ${a.tex()}$. Ici $A \neq ${a.tex()}\,I_2$, donc $A - \lambda I_2 \neq 0$ est de rang $1$ et $\dim E_\lambda(A) = 1 < 2 = m(\lambda)$ : <strong>$A$ n'est pas diagonalisable</strong>.</p>`;
        } else {
          const { k, m } = sqrtSimplify(Math.abs(D));
          const b = F(k, 2);
          const rad = m === 1 ? '' : R`\sqrt{${m}}`;
          const im = D < 0 ? 'i' : '';
          let part;
          if (b.d === 1) part = (b.isOne() ? '' : b.tex()) + rad + im || '1';
          else part = R`\frac{${b.n === 1 && (rad || im) ? '' : b.n}${rad}${im}}{${b.d}}`;
          const lt = (a.isZero() ? '' : a.tex() + ' ') + R`\pm ` + part;
          if (D > 0) {
            cor += R`<p>$\Delta > 0$ : deux valeurs propres réelles distinctes $\lambda = \dfrac{${t} \pm \sqrt{${D}}}{2}$, soit $\lambda = ${lt}$. Chacune est racine simple, donc chaque sous-espace propre est une droite, et <strong>$A$ est diagonalisable dans $\M_2(\R)$</strong>.</p>`;
          } else {
            cor += R`<p>$\Delta < 0$ : <strong>aucune valeur propre réelle</strong>, $\Sp_\R(A) = \varnothing$ ($A$ n'est pas diagonalisable dans $\M_2(\R)$). Dans $\C$ : $\lambda = \dfrac{${t} \pm i\sqrt{${-D}}}{2}$, soit $\lambda = ${lt}$ : deux valeurs propres complexes conjuguées distinctes, donc $A$ est diagonalisable dans $\M_2(\C)$.</p>`;
          }
        }
        return {
          detail: (() => {
            const steps = [
              R`<b>Trace et déterminant.</b> $\tr A = ${A[0][0]} + ${pn(A[1][1])} = ${t}$ ; $\det A = ${A[0][0]} \times ${pn(A[1][1])} - ${pn(A[0][1])} \times ${pn(A[1][0])} = ${d}$.`,
              R`<b>Polynôme caractéristique.</b> $\chi_A(X) = X^2 - \tr(A)X + \det(A) = ${poly([d, -t, 1])}$.`,
              R`<b>Discriminant.</b> $\Delta = ${pn(t)}^2 - 4 \times ${pn(d)} = ${D}$.`
            ];
            if (D > 0) steps.push(R`<b>$\Delta \gt 0$.</b> Deux racines réelles distinctes $\lambda = \frac{${t} \pm \sqrt{${D}}}{2}$ : $\Sp_\R(A) = \Sp_\C(A)$ a deux éléments, chaque sous-espace propre est une droite, et $A$ est diagonalisable sur $\R$.`);
            else if (D === 0) steps.push(R`<b>$\Delta = 0$.</b> Une racine double $\lambda = \frac{${t}}{2} = ${F(t, 2).tex()}$. Comme $A$ n'est pas égale à $\lambda I_2$, la matrice $A - \lambda I_2$ est non nulle, de rang 1 : $\dim E_\lambda = 1$, inférieure à la multiplicité 2, donc $A$ n'est pas diagonalisable.`);
            else steps.push(R`<b>$\Delta \lt 0$.</b> Pas de racine réelle : $\Sp_\R(A) = \varnothing$. Dans $\C$ : $\lambda = \frac{${t} \pm i\sqrt{${-D}}}{2}$, deux valeurs propres complexes conjuguées (le polynôme est à coefficients réels), distinctes : $A$ est diagonalisable sur $\C$.`);
            steps.push(R`<b>Contrôle.</b> La somme des valeurs propres (dans $\C$) vaut $\tr A = ${t}$ et leur produit $\det A = ${d}$.`);
            return {
              but: R`<p>Déterminer les valeurs propres réelles et complexes de $A$.</p>`,
              methode: R`<p>$\chi_A = X^2 - \tr(A)X + \det(A)$ ; le <strong>signe du discriminant</strong> décide.</p>`,
              etapes: steps,
              retenir: R`<p>Sur $\R$, une matrice peut n'avoir aucune valeur propre ; sur $\C$, elle en a toujours.</p>`
            };
          })(),
          enonce: R`<p>Soit $A = ${mat(A)}$. Déterminer $\Sp_\R(A)$ et $\Sp_\C(A)$. La matrice $A$ est-elle diagonalisable dans $\M_2(\R)$ ? dans $\M_2(\C)$ ?</p>`,
          correction: cor
        };
      }
    },

    testvec: {
      title: 'Est-ce un vecteur propre ?', diff: 1,
      make(r) {
        const { A, eigs } = randDiagonalizable(r, 3, pick3(r, [-2, -1, 0, 1, 2, 3]), 10);
        let v;
        const isEig = r.chance(0.55);
        if (isEig) {
          const l = r.pick(eigs);
          v = kernel(subLambda(A, l))[0].map(x => x * r.pick([1, -1, 2]));
        } else {
          do { v = [r.int(-2, 2), r.int(-2, 2), r.int(-2, 2)]; }
          while (v.every(x => x === 0) || isProportional(matVec(A, v), v) !== null);
        }
        const Av = matVec(A, v);
        const lam = isProportional(Av, v);
        let cor = R`<p>On calcule $Av = ${mat(A)}${vec(v)} = ${vec(Av)}$.</p>`;
        if (lam !== null) {
          cor += R`<p>On constate que $Av = ${lam.tex()}\,v$ et $v \neq 0$ : <strong>$v$ est un vecteur propre</strong> de $A$, associé à la valeur propre $${lam.tex()}$.</p>`;
        } else {
          const i = v.findIndex(x => x !== 0);
          const j = v.findIndex((x, k) => k !== i && (x !== 0 || Av[k] !== 0));
          cor += R`<p>Si l'on avait $Av = \lambda v$, on aurait $\lambda = ${F(Av[i], v[i]).tex()}$ (coordonnée ${i + 1}), mais la coordonnée ${j + 1} donne $${Av[j]} \neq ${F(Av[i], v[i]).tex()}\times(${v[j]})$. <strong>$v$ n'est pas un vecteur propre</strong> de $A$.</p>`;
        }
        return {
          detail: (() => {
            const rows = A.map((row, i) => row.map((a, j) => pn(a) + R` \times ` + pn(v[j])).join(' + ') + ' = ' + Av[i]);
            const steps = [
              R`<b>Définition.</b> $v$ est vecteur propre de $A$ si $v \neq 0$ et s'il existe $\lambda$ tel que $Av = \lambda v$. Ici $v \neq 0$ ; il suffit de calculer $Av$.`,
              R`<b>Produit $Av$, ligne par ligne.</b> ${rows.map((s, i) => R`ligne ${i + 1} : $${s}$`).join(' ; ')}. Donc $Av = ${vec(Av)}$.`
            ];
            if (lam !== null) {
              steps.push(R`<b>Comparaison.</b> Chaque coordonnée de $Av$ est celle de $v$ multipliée par $${lam.tex()}$ : $Av = ${lam.tex()}\,v$. <strong>$v$ est vecteur propre</strong> pour la valeur propre $${lam.tex()}$.`);
            } else {
              const i = v.findIndex(x => x !== 0), j = v.findIndex((x, k) => k !== i && (x !== 0 || Av[k] !== 0)), q = F(Av[i], v[i]);
              steps.push(R`<b>Comparaison.</b> La coordonnée ${i + 1} imposerait $\lambda = \frac{${Av[i]}}{${v[i]}} = ${q.tex()}$, mais alors la coordonnée ${j + 1} de $Av$ devrait valoir $${q.tex()} \times ${pn(v[j])} = ${q.mul(v[j]).tex()}$, et elle vaut $${Av[j]}$. $Av$ n'est pas colinéaire à $v$ : <strong>$v$ n'est pas vecteur propre</strong>.`);
            }
            return {
              but: R`<p>Décider si $v$ est un vecteur propre de $A$.</p>`,
              methode: R`<p>Pas besoin de $\chi_A$ : calculer $Av$ et tester s'il est <strong>colinéaire</strong> à $v$.</p>`,
              etapes: steps,
              retenir: R`<p>Tester un vecteur propre ne coûte qu'un produit matrice-vecteur.</p>`
            };
          })(),
          enonce: R`<p>Soit $A = ${mat(A)}$ et $v = ${vec(v)}$. Le vecteur $v$ est-il un vecteur propre de $A$ ? Si oui, pour quelle valeur propre ?</p>`,
          indication: R`<p>Inutile de calculer $\chi_A$ : calculez $Av$ et regardez s'il est colinéaire à $v$.</p>`,
          correction: cor
        };
      }
    },

    spectre3: {
      title: 'Éléments propres d’une matrice 3×3', diff: 2,
      make(r) {
        const { A, eigs } = randDiagonalizable(r, 3, pick3(r, [-2, -1, 0, 1, 2, 3, 4]), 12);
        const c = polyFromRoots(eigs);
        const d = det(A), t = trace(A);
        const vars = ['x', 'y', 'z'];
        let cor = R`<p><strong>Polynôme caractéristique.</strong> On calcule $\chi_A(X) = \det(XI_3 - A)$ (développement ou formule $X^3 - \tr(A)X^2 + s_2X - \det A$) :</p>
          $$\chi_A(X) = ${poly(c)}.$$
          <p>Le terme constant vaut $(-1)^3\det A = ${-d}$. On cherche une racine évidente parmi ses diviseurs : $\chi_A(${eigs[0]}) = 0$. On factorise alors par $${ML.xMinus(eigs[0])}$ et on résout l'équation du second degré restante :</p>
          $$\chi_A(X) = ${factored(eigs.map(l => [l, 1]))}, \qquad \Sp(A) = \{${eigs.join(',\\,')}\}.$$
          <p><em>Contrôle :</em> $${sumTex(eigs.join(' + '))} = ${t} = \tr A$.</p>`;
        eigs.forEach(l => {
          const B = subLambda(A, l), ker = kernel(B);
          cor += R`<p><strong>$\lambda = ${l}$.</strong> $${AmL(l, 3)} = ${mat(B)}$. Après échelonnement, le système $(${AmL(l, 3)})X = 0$ équivaut à $${eqsTex(B, vars)}$, d'où $E_{${l}}(A) = ${vectTex(ker)}$.</p>`;
        });
        cor += R`<p>Les trois valeurs propres sont distinctes : les trois vecteurs propres obtenus forment une famille libre, donc une base de $\R^3$, et $A$ est diagonalisable.</p>`;
        return {
          detail: (() => {
            const r0 = d === 0 ? 0 : eigs[0], i0 = eigs.indexOf(r0), rest = eigs.filter((x, i) => i !== i0);
            const s2 = s2of(A);
            const steps = [
              R`<b>Trace.</b> $\tr A = ${A[0][0]} + ${pn(A[1][1])} + ${pn(A[2][2])} = ${t}$.`,
              R`<b>Mineurs principaux d'ordre 2</b> (on garde les lignes et colonnes $i$ et $j$) : $\begin{vmatrix} ${A[0][0]} & ${A[0][1]} \\ ${A[1][0]} & ${A[1][1]} \end{vmatrix} = ${minor(A, 0, 1)}$, $\begin{vmatrix} ${A[0][0]} & ${A[0][2]} \\ ${A[2][0]} & ${A[2][2]} \end{vmatrix} = ${minor(A, 0, 2)}$, $\begin{vmatrix} ${A[1][1]} & ${A[1][2]} \\ ${A[2][1]} & ${A[2][2]} \end{vmatrix} = ${minor(A, 1, 2)}$ ; leur somme est $s_2 = ${s2}$.`,
              R`<b>Déterminant.</b> $\det A = ${d}$ (développement selon une ligne ou une colonne).`,
              R`<b>Polynôme caractéristique.</b> $\chi_A(X) = X^3 - \tr(A)X^2 + s_2X - \det A = ${poly(c)}$.`,
              R`<b>Racine évidente.</b> ${d === 0 ? R`$\det A = 0$ : $0$ est racine.` : R`Une racine entière divise le terme constant $${-d}$ ; en testant ses diviseurs, on trouve $\chi_A(${r0}) = 0$.`}`,
              R`<b>Factorisation.</b> $\chi_A(X) = ${r0 === 0 ? 'X' : '(' + ML.xMinus(r0) + ')'}\big(${poly([rest[0] * rest[1], -(rest[0] + rest[1]), 1])}\big)$ (division euclidienne ou identification des coefficients). Le trinôme a pour racines $${rest[0]}$ et $${rest[1]}$ (somme $${rest[0] + rest[1]}$, produit $${rest[0] * rest[1]}$). Donc $\Sp(A) = \{${eigs.join(',\\,')}\}$, trois valeurs propres simples.`
            ];
            eigs.forEach(l => {
              const B = subLambda(A, l), ker = kernel(B);
              const v = ker[0], Av = matVec(A, v);
              steps.push(R`<b>$E_{${l}}(A)$.</b> $A - ${pn(l)}I_3 = ${mat(B)}$. On échelonne (les opérations sur les lignes ne changent pas les solutions) : $${eqsTex(B, vars)}$. Il reste une inconnue libre ; en la fixant, on obtient $v = ${tuple(v)}$ et $E_{${l}}(A) = ${vectTex(ker)}$. Contrôle : $Av = ${vec(Av)} = ${pn(l)}\,v$ ✓.`);
            });
            steps.push(R`<b>Conclusion.</b> Les trois valeurs propres sont distinctes : chaque sous-espace propre est une droite et les trois vecteurs propres forment une base de $\R^3$.`);
            return {
              but: R`<p>Polynôme caractéristique, spectre et sous-espaces propres d'une matrice $3 \times 3$.</p>`,
              methode: R`<p>$\chi_A(X) = X^3 - \tr(A)X^2 + s_2X - \det(A)$, où $s_2$ est la somme des mineurs principaux d'ordre 2 ; racine évidente, factorisation ; puis $(A - \lambda I_3)X = 0$ par échelonnement.</p>`,
              etapes: steps,
              retenir: R`<p>Racine évidente : chercher parmi les diviseurs du terme constant ; vérifier chaque vecteur propre avec $Av = \lambda v$.</p>`
            };
          })(),
          enonce: R`<p>Soit $A = ${mat(A)}$. Calculer $\chi_A$, en déduire le spectre de $A$, puis une base de chacun de ses sous-espaces propres.</p>`,
          indication: R`<p>Les valeurs propres sont entières. Le terme constant de $\chi_A$ est $-\det A = ${-d}$ : testez ses diviseurs (et $0$ si $\det A = 0$) pour trouver une racine évidente.</p>`,
          correction: cor
        };
      }
    },

    diag3: {
      title: 'Diagonaliser une matrice 3×3', diff: 2,
      make(r) {
        const dbl = r.chance(0.5);
        const pool = [-2, -1, 0, 1, 2, 3];
        const pick = dbl ? () => { const [a, b] = r.sample(pool, 2); return [a, a, b].sort((x, y) => x - y); } : pick3(r, pool);
        const { A, eigs } = randDiagonalizable(r, 3, pick, 9);
        const vals = [...new Set(eigs)];
        const mult = v => eigs.filter(x => x === v).length;
        const c = polyFromRoots(eigs), d = det(A), t = trace(A), s2 = s2of(A);
        const vars = ['x', 'y', 'z'];
        const spaces = vals.map(v => { const B = subLambda(A, v); return { v, B, ker: kernel(B), m: mult(v) }; });
        const cols = [], dg = [];
        spaces.forEach(s => s.ker.forEach(k => { cols.push(k); dg.push(s.v); }));
        const P = [0, 1, 2].map(i => cols.map(k => k[i]));
        const D = diag(dg);
        const chiF = factored(vals.map(v => [v, mult(v)]));
        const spTxt = vals.map(v => v + (mult(v) > 1 ? R` \text{ (double)}` : '')).join(',\\ ');
        const crit = vals.length === 3
          ? R`Les trois valeurs propres sont <strong>distinctes</strong> : $A$ est diagonalisable (condition suffisante).`
          : R`$\dim E_{${spaces.find(s => s.m === 2).v}}(A) = 2$ est égale à la multiplicité, et la valeur propre simple donne une droite : $\sum \dim E_\lambda = 3$, donc <strong>$A$ est diagonalisable</strong>.`;
        const spTex = spaces.map(s => R`<li>$\lambda = ${s.v}$ : $${AmL(s.v, 3)} = ${mat(s.B)}$, système $${eqsTex(s.B, vars)}$, d'où $E_{${s.v}}(A) = ${vectTex(s.ker)}$ (dimension ${s.ker.length}).</li>`).join('');
        return {
          enonce: R`<p>Soit $A = ${mat(A)}$. Montrer que $A$ est diagonalisable et déterminer une matrice inversible $P$ et une matrice diagonale $D$ telles que $A = PDP^{-1}$.</p>`,
          indication: R`<p>$\chi_A(X) = X^3 - \tr(A)X^2 + s_2X - \det A$ ($s_2$ : somme des mineurs principaux d'ordre 2). Les valeurs propres sont entières.</p>`,
          correction: R`<p><strong>Polynôme caractéristique.</strong> $\tr A = ${t}$, $s_2 = ${s2}$, $\det A = ${d}$, donc $\chi_A = ${poly(c)} = ${chiF}$ : $\Sp(A) = \{${spTxt}\}$.</p>
            <p><strong>Sous-espaces propres.</strong></p><ul>${spTex}</ul>
            <p>${crit}</p>
            <p>En rangeant les vecteurs propres en colonnes (dans l'ordre des valeurs propres de $D$) :</p>
            $$P = ${mat(P)}, \qquad D = ${mat(D)}, \qquad A = PDP^{-1}.$$
            <p><em>Contrôle :</em> $AP = PD = ${mat(matMul(A, P))}$.</p>`,
          detail: {
            but: R`<p>Diagonaliser $A$ : trouver une base de vecteurs propres.</p>`,
            methode: R`<p>$\chi_A$ ; pour chaque valeur propre, une base de $E_\lambda$ ; vérifier $\sum \dim E_\lambda = 3$ ; $P$ = vecteurs propres en colonnes, $D$ = valeurs propres dans le même ordre.</p>`,
            etapes: [
              R`<b>Coefficients de $\chi_A$.</b> $\tr A = ${t}$ ; mineurs principaux : $${minor(A, 0, 1)}$, $${minor(A, 0, 2)}$, $${minor(A, 1, 2)}$, donc $s_2 = ${s2}$ ; $\det A = ${d}$.`,
              R`<b>Factorisation.</b> $\chi_A = ${poly(c)}$. Racine évidente parmi les diviseurs de $${-d === 0 ? 0 : -d}$${d === 0 ? ' (ici $0$ est racine)' : ''}, puis trinôme : $\chi_A = ${chiF}$.`,
              ...spaces.map(s => R`<b>$E_{${s.v}}(A)$.</b> $${AmL(s.v, 3)} = ${mat(s.B)}$ est de rang $${3 - s.ker.length}$ ; système $${eqsTex(s.B, vars)}$ ; base : $${s.ker.map(tuple).join(',\\ ')}$.`),
              R`<b>Critère.</b> ${crit}`,
              R`<b>Matrices.</b> $P = ${mat(P)}$, $D = ${mat(D)}$ ; l'ordre des colonnes de $P$ doit correspondre à l'ordre des valeurs propres dans $D$.`,
              R`<b>Contrôle.</b> Inutile de calculer $P^{-1}$ : on vérifie $AP = PD$, c'est-à-dire $Av_j = \lambda_jv_j$ pour chaque colonne.`
            ],
            retenir: R`<p>Diagonalisable $\iff \sum_\lambda \dim E_\lambda = n$. On vérifie $AP = PD$ plutôt que $P^{-1}AP = D$.</p>`
          }
        };
      }
    },

    diagornot: {
      title: 'Diagonalisable ou non ? (valeur propre double)', diff: 2,
      make(r) {
        const a = r.int(-2, 3); let b;
        do { b = r.int(-2, 3); } while (b === a);
        const ok = r.chance(0.5);
        const J = [[a, ok ? 0 : 1, 0], [0, a, 0], [0, 0, b]];
        let A = randSimilar(r, J, 9);
        if (!A) { const P0 = [[1, 1, 0], [0, 1, 1], [1, 1, 1]]; A = matMul(matMul(P0, J), toInt(inv(P0))); }
        const vars = ['x', 'y', 'z'];
        const Ba = subLambda(A, a), Bb = subLambda(A, b);
        const rk = rank(Ba), Ea = kernel(Ba), Eb = kernel(Bb);
        const chiF = factored([[a, 2], [b, 1]]);
        let concl;
        if (ok) {
          const P = [0, 1, 2].map(i => [Ea[0][i], Ea[1][i], Eb[0][i]]);
          concl = R`<p>$\dim E_{${a}}(A) = 2 = m(${a})$ et $\dim E_{${b}}(A) = 1 = m(${b})$ : <strong>$A$ est diagonalisable</strong>. Avec $E_{${a}}(A) = ${vectTex(Ea)}$ et $E_{${b}}(A) = ${vectTex(Eb)}$ :</p>
            $$P = ${mat(P)}, \qquad D = ${mat(diag([a, a, b]))}, \qquad A = PDP^{-1}.$$`;
        } else {
          concl = R`<p>$\dim E_{${a}}(A) = 1 < 2 = m(${a})$ : <strong>$A$ n'est pas diagonalisable</strong> ($E_{${a}}(A) = ${vectTex(Ea)}$, $E_{${b}}(A) = ${vectTex(Eb)}$ : on ne trouve que deux vecteurs propres indépendants, pas une base de $\R^3$).</p>`;
        }
        return {
          enonce: R`<p>Soit $A = ${mat(A)}$. On admet que $\chi_A = ${chiF}$. La matrice $A$ est-elle diagonalisable ? Si oui, la diagonaliser.</p>`,
          indication: R`<p>Seule la valeur propre double pose question : calculez le rang de $${AmL(a, 3)}$.</p>`,
          correction: R`<p>$\chi_A$ est scindé. La valeur propre $${b}$ est simple, donc $\dim E_{${b}}(A) = 1$. Pour la valeur propre double $${a}$ : $${AmL(a, 3)} = ${mat(Ba)}$ ; le système $(${AmL(a, 3)})X = 0$ se réduit à $${eqsTex(Ba, vars)}$, donc $\rg(${AmL(a, 3)}) = ${rk}$ et $\dim E_{${a}}(A) = 3 - ${rk} = ${3 - rk}$.</p>${concl}`,
          detail: {
            but: R`<p>Décider si $A$ est diagonalisable, sachant $\chi_A = ${chiF}$.</p>`,
            methode: R`<p>$A$ diagonalisable $\iff \chi_A$ scindé et $\dim E_\lambda = m(\lambda)$ pour tout $\lambda$. Pour une valeur propre simple, c'est automatique ; seule la valeur propre double est à tester, via le rang : $\dim E_\lambda = 3 - \rg(A - \lambda I_3)$.</p>`,
            etapes: [
              R`<b>Polynôme scindé.</b> $\chi_A = ${chiF}$ : valeurs propres $${a}$ (double) et $${b}$ (simple).`,
              R`<b>Valeur propre simple.</b> $1 \le \dim E_{${b}} \le m(${b}) = 1$, donc $\dim E_{${b}} = 1$.`,
              R`<b>Valeur propre double.</b> $${AmL(a, 3)} = ${mat(Ba)}$. ${rk === 1 ? 'Ses lignes sont toutes proportionnelles' : 'Deux de ses lignes ne sont pas proportionnelles, et son déterminant est nul'} : rang $${rk}$.`,
              R`<b>Dimension.</b> $\dim E_{${a}} = 3 - ${rk} = ${3 - rk}$ ${ok ? R`$= m(${a})$` : R`$\lt m(${a}) = 2$`}.`,
              ok ? R`<b>Conclusion.</b> $A$ est diagonalisable ; $E_{${a}} = ${vectTex(Ea)}$, $E_{${b}} = ${vectTex(Eb)}$, et $P$ a ces trois vecteurs en colonnes, $D = \mathrm{diag}(${a}, ${a}, ${b})$.`
                : R`<b>Conclusion.</b> $A$ n'est pas diagonalisable : il manque un vecteur propre pour former une base.`
            ],
            retenir: R`<p>Valeur propre double : diagonalisable si et seulement si $\rg(A - \lambda I_3) = 1$.</p>`
          }
        };
      }
    },

    rec2: {
      title: 'Suite récurrente linéaire d’ordre 2', diff: 2,
      make(r) {
        const dbl = r.chance(0.3);
        let r1, r2, a, b, lam, mu, u0, u1;
        if (!dbl) {
          do { r1 = r.nz(-3, 4); r2 = r.nz(-3, 4); } while (r1 === r2);
          if (r1 > r2) [r1, r2] = [r2, r1];
          a = r1 + r2; b = -r1 * r2; lam = r.nz(-3, 3); mu = r.nz(-3, 3);
          u0 = lam + mu; u1 = lam * r1 + mu * r2;
        } else {
          r1 = r2 = r.pick([-2, -1, 1, 2, 3]);
          a = 2 * r1; b = -r1 * r1; lam = r.nz(-3, 3); mu = r.nz(-3, 3);
          u0 = lam; u1 = (lam + mu) * r1;
        }
        const u2 = a * u1 + b * u0;
        const recTex = R`u_{n+2} = ${lin([a, b], ['u_{n+1}', 'u_n'])}`;
        const A = [[0, 1], [b, a]];
        const chi = poly([-b, -a, 1]);
        let formula, chiF, sol, gen;
        if (!dbl) {
          chiF = factored([[r1, 1], [r2, 1]]);
          gen = R`u_n = \lambda\,${qn(r1) || '1'} + \mu\,${qn(r2) || '1'}`;
          formula = combo([[lam, r1], [mu, r2]]);
          sol = R`$\begin{cases} \lambda + \mu = ${u0} \\ ${lin([r1, r2], ['\\lambda', '\\mu'])} = ${u1} \end{cases}$ donne $\mu = \dfrac{${u1} - ${pn(r1)} \times ${pn(u0)}}{${r2} - ${pn(r1)}} = ${mu}$ et $\lambda = ${u0} - ${pn(mu)} = ${lam}$`;
        } else {
          chiF = factored([[r1, 2]]);
          gen = R`u_n = (\lambda + \mu n)${qn(r1)}`;
          const inner = lam + (mu < 0 ? ' - ' : ' + ') + (Math.abs(mu) === 1 ? '' : Math.abs(mu)) + 'n';
          formula = r1 === 1 ? inner : R`(${inner})${qn(r1)}`;
          sol = R`$n = 0$ : $\lambda = ${u0}$ ; $n = 1$ : $(\lambda + \mu)\times${pn(r1)} = ${u1}$, donc $\lambda + \mu = ${u1 / r1}$ et $\mu = ${mu}$`;
        }
        const diagTxt = dbl
          ? R`$\chi_A = ${chiF}$ a une racine double $${r1}$ ; $A - ${pn(r1)}I_2 = ${mat(subLambda(A, r1))} \neq 0$ donc $A$ n'est pas diagonalisable. D'après le cours, les solutions sont alors les suites $${gen}$.`
          : R`$\chi_A = ${chiF}$ a deux racines distinctes $${r1}$ et $${r2}$ : $A$ est diagonalisable, $A = PDP^{-1}$ avec $D = \mathrm{diag}(${r1}, ${r2})$, et $X_n = A^nX_0 = PD^nP^{-1}X_0$. La première coordonnée $u_n$ est donc de la forme $${gen}$.`;
        return {
          enonce: R`<p>Soit $(u_n)$ la suite définie par $u_0 = ${u0}$, $u_1 = ${u1}$ et, pour tout $n \in \N$, $${recTex}$.</p>
            <ol><li>Écrire la relation sous la forme $X_{n+1} = AX_n$ avec $X_n = \begin{pmatrix} u_n \\ u_{n+1} \end{pmatrix}$.</li><li>Calculer $\chi_A$ et ses racines.</li><li>En déduire $u_n$ en fonction de $n$.</li></ol>`,
          indication: R`<p>$\chi_A$ est le polynôme de l'équation caractéristique $${poly([-b, -a, 1], 'r')} = 0$. Selon que ses racines sont distinctes ou confondues, $u_n = \lambda r_1^n + \mu r_2^n$ ou $u_n = (\lambda + \mu n)r^n$.</p>`,
          correction: R`<p>1. $X_{n+1} = \begin{pmatrix} u_{n+1} \\ u_{n+2} \end{pmatrix} = ${mat(A)}\begin{pmatrix} u_n \\ u_{n+1} \end{pmatrix}$ : $A = ${mat(A)}$.</p>
            <p>2. $\chi_A(X) = X^2 - \tr(A)X + \det A = ${chi} = ${chiF}$.</p>
            <p>3. ${diagTxt} Avec les conditions initiales : ${sol}. Donc</p>
            $$u_n = ${formula}.$$
            <p><em>Contrôle :</em> la relation donne $u_2 = ${u2}$, et la formule aussi.</p>`,
          detail: {
            but: R`<p>Exprimer $u_n$ en fonction de $n$ pour la récurrence $${recTex}$.</p>`,
            methode: R`<p>Matrice compagnon $A = \begin{pmatrix} 0 & 1 \\ b & a \end{pmatrix}$, $\chi_A = X^2 - aX - b$. Racines distinctes $r_1, r_2$ : $u_n = \lambda r_1^n + \mu r_2^n$ ; racine double $r$ : $u_n = (\lambda + \mu n)r^n$. Les constantes viennent de $u_0$ et $u_1$.</p>`,
            etapes: [
              R`<b>Mise sous forme matricielle.</b> La 1<sup>re</sup> ligne de $X_{n+1} = AX_n$ dit $u_{n+1} = u_{n+1}$, la 2<sup>e</sup> est la relation : $A = ${mat(A)}$.`,
              R`<b>Polynôme caractéristique.</b> $\tr A = ${a}$, $\det A = ${-b}$ : $\chi_A = ${chi} = ${chiF}$.`,
              dbl ? R`<b>Forme des solutions.</b> Racine double $${r1}$ : $${gen}$ (les suites $${qn(r1) || '1'}$ et $n${qn(r1)}$ sont solutions et forment une base de l'espace des solutions, de dimension 2).`
                : R`<b>Forme des solutions.</b> Deux racines distinctes : $A$ est diagonalisable et $X_n = PD^nP^{-1}X_0$ ; donc $${gen}$.`,
              R`<b>Constantes.</b> ${sol}.`,
              R`<b>Résultat.</b> $u_n = ${formula}$.`,
              R`<b>Contrôle.</b> $u_2 = ${pn(a)} \times ${pn(u1)} + ${pn(b)} \times ${pn(u0)} = ${u2}$ par la relation ; la formule en $n = 2$ donne aussi $${u2}$ ✓.`
            ],
            retenir: R`<p>Équation caractéristique $r^2 = ar + b$ : ses racines donnent la forme de $u_n$, les deux premiers termes donnent les constantes.</p>`
          }
        };
      }
    },

    sys2: {
      title: 'Suites récurrentes couplées', diff: 2,
      make(r) {
        const { A, eigs: [l1, l2] } = randDiagonalizable(r, 2, () => {
          let x, y;
          do { x = r.nz(-3, 4); y = r.nz(-3, 4); } while (x === y);
          return x < y ? [x, y] : [y, x];
        }, 7);
        const v1 = kernel(subLambda(A, l1))[0], v2 = kernel(subLambda(A, l2))[0];
        const c1 = r.nz(-2, 2), c2 = r.nz(-2, 2);
        const X0 = [c1 * v1[0] + c2 * v2[0], c1 * v1[1] + c2 * v2[1]];
        const un = combo([[c1 * v1[0], l1], [c2 * v2[0], l2]]);
        const vn = combo([[c1 * v1[1], l1], [c2 * v2[1], l2]]);
        const X1 = matVec(A, X0);
        const t = trace(A), d = det(A);
        const P = [[v1[0], v2[0]], [v1[1], v2[1]]];
        const dec = R`$${X0[0]} = ${lin([v1[0], v2[0]], ['c_1', 'c_2'])}$ et $${X0[1]} = ${lin([v1[1], v2[1]], ['c_1', 'c_2'])}$ donnent $c_1 = ${c1}$, $c_2 = ${c2}$`;
        return {
          enonce: R`<p>On définit deux suites par $u_0 = ${X0[0]}$, $v_0 = ${X0[1]}$ et, pour tout $n \in \N$ :</p>
            $$\begin{cases} u_{n+1} = ${lin(A[0], ['u_n', 'v_n'])} \\ v_{n+1} = ${lin(A[1], ['u_n', 'v_n'])} \end{cases}$$
            <p>Exprimer $u_n$ et $v_n$ en fonction de $n$.</p>`,
          indication: R`<p>Écrire $X_{n+1} = AX_n$ avec $X_n = \begin{pmatrix} u_n \\ v_n \end{pmatrix}$, diagonaliser $A$ et décomposer $X_0$ sur une base de vecteurs propres.</p>`,
          correction: R`<p>Avec $X_n = \begin{pmatrix} u_n \\ v_n \end{pmatrix}$ : $X_{n+1} = AX_n$, $A = ${mat(A)}$, donc $X_n = A^nX_0$.</p>
            <p>$\chi_A = X^2 - ${pn(t)}X + ${pn(d)} = ${factored([[l1, 1], [l2, 1]])}$ : deux valeurs propres distinctes, $A$ est diagonalisable, avec $E_{${l1}}(A) = \Vect(w_1)$, $w_1 = ${tuple(v1)}$ et $E_{${l2}}(A) = \Vect(w_2)$, $w_2 = ${tuple(v2)}$.</p>
            <p>On décompose $X_0 = c_1w_1 + c_2w_2$ : ${dec}. Comme $A^nw_i = \lambda_i^nw_i$ :</p>
            $$X_n = A^nX_0 = ${sumTex(combo([[c1, l1]]) + R`\,` + vec(v1) + ' + ' + combo([[c2, l2]]) + R`\,` + vec(v2))},$$
            <p>soit <strong>$u_n = ${un}$</strong> et <strong>$v_n = ${vn}$</strong>.</p>
            <p><em>Contrôle ($n = 1$) :</em> $AX_0 = ${vec(X1)}$, et les formules donnent bien $u_1 = ${X1[0]}$, $v_1 = ${X1[1]}$.</p>`,
          detail: {
            but: R`<p>Expliciter deux suites définies par une récurrence linéaire couplée.</p>`,
            methode: R`<p>$X_{n+1} = AX_n$ donc $X_n = A^nX_0$. Dans une base de vecteurs propres, $A^n$ agit simplement : $A^nw = \lambda^nw$. On décompose $X_0$ sur cette base.</p>`,
            etapes: [
              R`<b>Forme matricielle.</b> $A = ${mat(A)}$, $X_0 = ${vec(X0)}$.`,
              R`<b>Valeurs propres.</b> $\tr A = ${t}$, $\det A = ${d}$ : $\chi_A = ${poly([d, -t, 1])} = ${factored([[l1, 1], [l2, 1]])}$.`,
              R`<b>Vecteurs propres.</b> $${AmL(l1, 2)} = ${mat(subLambda(A, l1))}$ donne $w_1 = ${tuple(v1)}$ ; $${AmL(l2, 2)} = ${mat(subLambda(A, l2))}$ donne $w_2 = ${tuple(v2)}$. (Ce sont les colonnes de $P = ${mat(P)}$, et $A = P\,\mathrm{diag}(${l1}, ${l2})\,P^{-1}$.)`,
              R`<b>Décomposition de $X_0$.</b> ${dec}.`,
              R`<b>Puissances.</b> $A^nX_0 = c_1A^nw_1 + c_2A^nw_2 = c_1\,${pn(l1)}^n\,w_1 + c_2\,${pn(l2)}^n\,w_2$.`,
              R`<b>Résultat.</b> $u_n = ${un}$, $v_n = ${vn}$ ; pour $n = 1$ on retrouve $AX_0 = ${vec(X1)}$ ✓.`
            ],
            retenir: R`<p>Décomposer la condition initiale sur les vecteurs propres évite de calculer $P^{-1}$.</p>`
          }
        };
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Cours                                                               */
  /* ------------------------------------------------------------------ */
  const cours = [
    { t: 'p', body: R`<p>Dans tout le chapitre, $\K$ désigne $\R$ ou $\C$, $E$ un $\K$-espace vectoriel de dimension finie $n \ge 1$ (sauf mention contraire) et $u \in \Lin(E)$.</p>` },

    { t: 'h', title: 'Déterminant, trace' },
    { t: 'h2', title: 'Déterminant d’une matrice carrée' },
    { t: 'def', title: 'rappel', body: R`
      <p>Le <strong>déterminant</strong> de $A = (a_{ij}) \in \M_n(\K)$ est le scalaire</p>
      $$\det A = \sum_{\sigma \in S_n} \varepsilon(\sigma)\,a_{\sigma(1)1}\,a_{\sigma(2)2}\cdots a_{\sigma(n)n},$$
      <p>où $S_n$ est l'ensemble des permutations de $\{1, \dots, n\}$ et $\varepsilon(\sigma) = \pm1$ leur signature. On le note aussi avec des barres verticales.</p>
      <ul>
        <li>$n = 2$ : $\begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad - bc$.</li>
        <li>$n = 3$ (règle de <strong>Sarrus</strong>) : $\begin{vmatrix} a & b & c \\ d & e & f \\ g & h & i \end{vmatrix} = aei + bfg + cdh - ceg - afh - bdi$.</li>
      </ul>` },
    { t: 'thm', title: 'développement selon une ligne ou une colonne', body: R`
      <p>Notons $\Delta_{ij}$ le déterminant de la matrice obtenue en supprimant la ligne $i$ et la colonne $j$ de $A$. Pour toute ligne $i$ et toute colonne $j$ :</p>
      $$\det A = \sum_{k=1}^n (-1)^{i+k}a_{ik}\,\Delta_{ik} = \sum_{k=1}^n (-1)^{k+j}a_{kj}\,\Delta_{kj}.$$`,
      proof: R`<p>Admis (conséquence de la multilinéarité du déterminant par rapport aux colonnes, ou aux lignes).</p>` },
    { t: 'prop', title: 'propriétés', body: R`
      <ol>
        <li>$\det$ est linéaire par rapport à chaque colonne (et chaque ligne) ; échanger deux colonnes change le signe ; ajouter à une colonne une combinaison des <em>autres</em> ne change pas le déterminant. Idem pour les lignes.</li>
        <li>Si $A$ est <strong>triangulaire</strong>, $\det A$ est le produit des coefficients diagonaux.</li>
        <li>$\det(A^T) = \det A$ et $\det(\lambda A) = \lambda^n\det A$.</li>
        <li>$\det(AB) = \det A\,\det B$.</li>
        <li><strong>$A$ est inversible $\iff \det A \neq 0$</strong>, et alors $\det(A^{-1}) = \dfrac{1}{\det A}$.</li>
      </ol>`,
      proof: R`<p>Les points 1 à 4 sont des rappels (admis). Pour 5 : si $A$ est inversible, $\det A\,\det A^{-1} = \det I_n = 1$, donc $\det A \neq 0$. Si $A$ n'est pas inversible, ses colonnes sont liées : l'une est combinaison des autres, et en la remplaçant par $0$ (opération qui ne change pas le déterminant) on obtient une colonne nulle, donc $\det A = 0$.</p>` },
    { t: 'meth', body: R`<p>Pour calculer un déterminant : faire apparaître des <strong>zéros</strong> par opérations sur les lignes ou colonnes ($L_i \leftarrow L_i - \lambda L_j$), puis développer selon la ligne ou la colonne la plus creuse. Penser à mettre un <strong>facteur commun</strong> en évidence (linéarité par rapport à une ligne).</p>` },
    { t: 'ex', body: R`<p>$\begin{vmatrix} 1 & 1 & 1 \\ 1 & a & 1 \\ 1 & 1 & a \end{vmatrix} \underset{L_2 - L_1,\ L_3 - L_1}{=} \begin{vmatrix} 1 & 1 & 1 \\ 0 & a - 1 & 0 \\ 0 & 0 & a - 1 \end{vmatrix} = (a - 1)^2$ : la matrice est inversible si et seulement si $a \neq 1$.</p>` },

    { t: 'h2', title: 'Déterminant d’un endomorphisme' },
    { t: 'prop', body: R`<p>Si $A$ et $A' = P^{-1}AP$ sont semblables, $\det A' = \det A$. On peut donc définir $\det u = \det ${Mat}_{\mathcal{B}}(u)$, indépendamment de la base $\mathcal{B}$. On a $\det(v \circ u) = \det v\,\det u$, et <strong>$u$ est bijectif $\iff \det u \neq 0$</strong>.</p>`,
      proof: R`<p>$\det(P^{-1}AP) = \det(P)^{-1}\det(A)\det(P) = \det A$. Le reste découle des propriétés des matrices ($${Mat}(v \circ u) = ${Mat}(v)${Mat}(u)$ ; $u$ bijectif si et seulement si sa matrice est inversible).</p>` },

    { t: 'h2', title: 'Trace' },
    { t: 'def', body: R`<p>La <strong>trace</strong> de $A \in \M_n(\K)$ est la somme de ses coefficients diagonaux : $\tr A = \sum_{i=1}^n a_{ii}$.</p>` },
    { t: 'prop', body: R`
      <ol>
        <li>$\tr$ est une forme linéaire sur $\M_n(\K)$, et $\tr(A^T) = \tr A$.</li>
        <li>Pour $A \in \M_{n,p}(\K)$ et $B \in \M_{p,n}(\K)$ : <strong>$\tr(AB) = \tr(BA)$</strong>.</li>
        <li>Deux matrices semblables ont la même trace : on définit $\tr u = \tr ${Mat}_{\mathcal{B}}(u)$, indépendamment de la base.</li>
      </ol>`,
      proof: R`<p>1. Immédiat. 2. $\tr(AB) = \sum_{i=1}^n\sum_{k=1}^p a_{ik}b_{ki} = \sum_{k=1}^p\sum_{i=1}^n b_{ki}a_{ik} = \tr(BA)$. 3. $\tr(P^{-1}AP) = \tr\big((P^{-1}A)P\big) = \tr\big(P(P^{-1}A)\big) = \tr A$.</p>` },
    { t: 'warn', body: R`<p>$\tr(AB) \neq \tr A\,\tr B$ en général, et $\tr(ABC) \neq \tr(BAC)$ en général : on peut seulement faire « tourner » les facteurs, $\tr(ABC) = \tr(BCA) = \tr(CAB)$.</p>` },
    { t: 'ex', body: R`<p>Si $p$ est une projection, dans une base adaptée sa matrice est $\mathrm{diag}(1, \dots, 1, 0, \dots, 0)$ : <strong>$\tr p = \rg p$</strong>. Pour une symétrie $s$ par rapport à $F$ parallèlement à $G$ : $\tr s = \dim F - \dim G$.</p>` },

    { t: 'h', title: 'Valeurs propres, vecteurs propres' },
    { t: 'h2', title: 'Éléments propres d’un endomorphisme' },
    { t: 'def', title: 'valeur propre, vecteur propre', body: R`
      <p>On dit que $\lambda \in \K$ est une <strong>valeur propre</strong> de $u$ s'il existe $x \in E$, <strong>$x \neq 0$</strong>, tel que $u(x) = \lambda x$. Un tel vecteur $x$ est appelé <strong>vecteur propre</strong> de $u$ associé à $\lambda$.</p>
      <p>L'ensemble des valeurs propres de $u$ est le <strong>spectre</strong> de $u$, noté $\Sp(u)$.</p>` },
    { t: 'rem', body: R`
      <ul>
        <li>Un vecteur propre est <em>non nul</em> par définition (sinon tout $\lambda$ conviendrait, puisque $u(0) = \lambda\cdot 0$).</li>
        <li>Un vecteur propre est associé à une <em>unique</em> valeur propre : si $u(x) = \lambda x = \mu x$ avec $x \neq 0$, alors $(\lambda - \mu)x = 0$ donc $\lambda = \mu$.</li>
        <li>Géométriquement : $x \neq 0$ est un vecteur propre si et seulement si la droite $\K x$ est <em>stable</em> par $u$.</li>
      </ul>` },
    { t: 'ex', body: R`
      <ol>
        <li><strong>Homothétie</strong> $u = \lambda\,\Id_E$ : $\Sp(u) = \{\lambda\}$ et tout vecteur non nul est propre.</li>
        <li><strong>Projection</strong> $p$ sur $F$ parallèlement à $G$ ($F, G \neq \{0\}$) : $p(x) = x$ pour $x \in F$ et $p(x) = 0$ pour $x \in G$, donc $\Sp(p) = \{0, 1\}$. <strong>Symétrie</strong> : $\Sp(s) = \{1, -1\}$.</li>
        <li><strong>Rotation</strong> d'angle $\pi/2$ dans $\R^2$ : aucune droite n'est stable, donc $u$ n'a <em>aucune</em> valeur propre réelle.</li>
        <li><strong>Dérivation</strong> $D : f \mapsto f'$ sur $C^\infty(\R, \R)$ (dimension infinie) : pour tout $\lambda \in \R$, $f_\lambda : x \mapsto e^{\lambda x}$ vérifie $D(f_\lambda) = \lambda f_\lambda$. Donc $\Sp(D) = \R$.</li>
      </ol>` },
    { t: 'prop', title: 'caractérisation', body: R`
      $$\lambda \in \Sp(u) \iff u - \lambda\,\Id_E \text{ n'est pas injectif} \iff \det(u - \lambda\,\Id_E) = 0.$$
      <p>En particulier, $0 \in \Sp(u) \iff u$ n'est pas injectif $\iff \det u = 0$.</p>`,
      proof: R`<p>$\lambda$ est valeur propre si et seulement s'il existe $x \neq 0$ avec $(u - \lambda\Id_E)(x) = 0$, c'est-à-dire si $\Ker(u - \lambda\Id_E) \neq \{0\}$. En dimension finie, un endomorphisme est injectif si et seulement s'il est bijectif, si et seulement si son déterminant est non nul.</p>` },

    { t: 'h2', title: 'Le cas des matrices' },
    { t: 'def', body: R`<p>Soit $A \in \M_n(\K)$. On dit que $\lambda \in \K$ est valeur propre de $A$ s'il existe $X \in \K^n$, $X \neq 0$, tel que $AX = \lambda X$ ; $X$ est un vecteur propre de $A$. On note $\Sp_\K(A)$ le spectre.</p>` },
    { t: 'prop', body: R`<p>Soit $\mathcal{B}$ une base de $E$ et $A = ${Mat}_\mathcal{B}(u)$. Alors $\Sp(u) = \Sp(A)$, et $x$ est vecteur propre de $u$ si et seulement si sa colonne de coordonnées $X$ est vecteur propre de $A$.</p>`,
      proof: R`<p>La colonne des coordonnées de $u(x)$ est $AX$, et l'application $x \mapsto X$ est un isomorphisme ; donc $u(x) = \lambda x \iff AX = \lambda X$, et $x \neq 0 \iff X \neq 0$.</p>` },
    { t: 'prop', title: 'matrices semblables', body: R`<p>Si $B = P^{-1}AP$ avec $P \in GL_n(\K)$, alors $\Sp(A) = \Sp(B)$, et $Y$ est vecteur propre de $B$ si et seulement si $PY$ est vecteur propre de $A$.</p>`,
      proof: R`<p>$BY = \lambda Y \iff P^{-1}APY = \lambda Y \iff A(PY) = \lambda (PY)$, et $Y \neq 0 \iff PY \neq 0$.</p>` },
    { t: 'rem', title: 'le spectre dépend du corps', body: R`
      <p>Une matrice réelle peut être vue dans $\M_n(\C)$ : on a toujours $\Sp_\R(A) \subset \Sp_\C(A)$, et l'inclusion peut être stricte. Pour $A = \begin{pmatrix} 0 & -1 \\ 1 & 0\end{pmatrix}$ : $\Sp_\R(A) = \varnothing$ mais $\Sp_\C(A) = \{i, -i\}$, avec les vecteurs propres $(1, -i)$ pour $i$ et $(1, i)$ pour $-i$.</p>` },

    { t: 'h', title: 'Polynôme caractéristique' },
    { t: 'def', body: R`
      <p>Le <strong>polynôme caractéristique</strong> de $A \in \M_n(\K)$ est $\chi_A(X) = \det(X I_n - A)$.</p>
      <p>Pour $u \in \Lin(E)$, on pose $\chi_u = \chi_A$ où $A$ est la matrice de $u$ dans une base quelconque (c'est indépendant de la base, voir ci-dessous).</p>` },
    { t: 'warn', body: R`<p>Certains cours définissent $\chi_A = \det(A - XI_n) = (-1)^n\det(XI_n - A)$. Les racines sont les mêmes ; seul le signe change quand $n$ est impair. Avec la convention $\det(XI_n - A)$, le polynôme est <strong>unitaire</strong>.</p>` },
    { t: 'prop', body: R`
      <p>$\chi_A$ est un polynôme unitaire de degré $n$, et</p>
      $$\chi_A(X) = X^n - \tr(A)\,X^{n-1} + \dots + (-1)^n\det(A).$$
      <p>En particulier : $n = 2$ : $\chi_A(X) = X^2 - \tr(A)\,X + \det(A)$ ; $\ n = 3$ : $\chi_A(X) = X^3 - \tr(A)X^2 + s_2X - \det A$, où $s_2$ est la somme des trois mineurs principaux d'ordre 2 (déterminants $2 \times 2$ obtenus en gardant les lignes et colonnes $i$ et $j$).</p>`,
      proof: R`<p>Par la formule $\det(M) = \sum_{\sigma \in S_n}\varepsilon(\sigma)\prod_{i} m_{\sigma(i),i}$ appliquée à $M = XI_n - A$, chaque terme est un polynôme en $X$ de degré égal au nombre de points fixes de $\sigma$. Si $\sigma \neq \Id$, $\sigma$ a au plus $n-2$ points fixes ; les termes de degré $n$ et $n-1$ viennent donc uniquement de $\sigma = \Id$, c'est-à-dire de $\prod_{i=1}^n (X - a_{ii}) = X^n - (a_{11} + \dots + a_{nn})X^{n-1} + \cdots$.</p>
      <p>Le terme constant vaut $\chi_A(0) = \det(-A) = (-1)^n\det A$. (Le coefficient $s_2$ pour $n = 3$ s'obtient en développant, admis.)</p>` },
    { t: 'thm', body: R`<p>$\lambda \in \Sp(A) \iff \chi_A(\lambda) = 0$. Les valeurs propres de $A$ sont exactement les racines de $\chi_A$ dans $\K$.</p>`,
      proof: R`<p>$\lambda \in \Sp(A) \iff A - \lambda I_n$ non inversible $\iff \det(\lambda I_n - A) = 0 \iff \chi_A(\lambda) = 0$.</p>` },
    { t: 'cor', body: R`
      <ul>
        <li>$A \in \M_n(\K)$ a au plus $n$ valeurs propres.</li>
        <li>Si $\K = \C$, $A$ a <strong>au moins une</strong> valeur propre (théorème de d'Alembert–Gauss).</li>
        <li>Si $A \in \M_n(\R)$ avec $n$ <strong>impair</strong>, $A$ a au moins une valeur propre réelle.</li>
      </ul>`,
      proof: R`<p>Les deux premiers points découlent du théorème : $\chi_A$ est de degré $n$, et tout polynôme non constant de $\C[X]$ a une racine. Pour le troisième : $\chi_A$ est réel, unitaire, de degré impair, donc $\chi_A(x) \to -\infty$ en $-\infty$ et $+\infty$ en $+\infty$ ; le théorème des valeurs intermédiaires donne une racine réelle.</p>` },
    { t: 'prop', body: R`
      <ol>
        <li>Deux matrices semblables ont le même polynôme caractéristique (donc $\chi_u$ est bien défini).</li>
        <li>$\chi_{A^T} = \chi_A$.</li>
        <li>Si $A$ est triangulaire, $\chi_A = \prod_{i=1}^n (X - a_{ii})$ : les valeurs propres sont les coefficients diagonaux.</li>
      </ol>`,
      proof: R`<p>1. $\det(XI_n - P^{-1}AP) = \det\big(P^{-1}(XI_n - A)P\big) = \det(P)^{-1}\det(XI_n - A)\det(P) = \chi_A(X)$.</p>
      <p>2. $XI_n - A^T = (XI_n - A)^T$ et $\det(M^T) = \det(M)$.</p>
      <p>3. $XI_n - A$ est triangulaire, de déterminant le produit de ses coefficients diagonaux $X - a_{ii}$.</p>` },
    { t: 'def', title: 'multiplicité', body: R`<p>La <strong>multiplicité</strong> (algébrique) $m(\lambda)$ d'une valeur propre $\lambda$ est son ordre de multiplicité en tant que racine de $\chi_A$. On dit que $\chi_A$ est <strong>scindé</strong> sur $\K$ s'il s'écrit $\prod_k (X - \lambda_k)^{m_k}$ avec des $\lambda_k \in \K$ (toujours vrai sur $\C$).</p>` },
    { t: 'prop', title: 'trace et déterminant', body: R`
      <p>Si $\chi_A$ est scindé, $\chi_A = \prod_{k}(X - \lambda_k)^{m_k}$, alors</p>
      $$\tr A = \sum_k m_k\lambda_k, \qquad \det A = \prod_k \lambda_k^{m_k}.$$`,
      proof: R`<p>On développe $\prod_k (X - \lambda_k)^{m_k}$ : le coefficient de $X^{n-1}$ vaut $-\sum m_k\lambda_k$ et le terme constant $(-1)^n\prod\lambda_k^{m_k}$. On identifie avec la proposition précédente.</p>` },
    { t: 'ex', title: 'matrice 2×2', body: R`<p>$A = \begin{pmatrix} 1 & 2 \\ 2 & 1 \end{pmatrix}$ : $\chi_A = X^2 - 2X - 3 = (X - 3)(X + 1)$, donc $\Sp(A) = \{-1, 3\}$ ; contrôle : $3 + (-1) = 2 = \tr A$ et $3 \times (-1) = -3 = \det A$.</p>` },
    { t: 'ex', title: 'matrice 3×3', body: R`
      <p>$A = \begin{pmatrix} 0 & 1 & 1 \\ 1 & 0 & 1 \\ 1 & 1 & 0 \end{pmatrix}$. Dans $\det(XI_3 - A)$, on fait $C_1 \leftarrow C_1 + C_2 + C_3$ (la somme de chaque ligne est constante) :</p>
      $$\chi_A = \begin{vmatrix} X & -1 & -1 \\ -1 & X & -1 \\ -1 & -1 & X \end{vmatrix} = (X - 2)\begin{vmatrix} 1 & -1 & -1 \\ 1 & X & -1 \\ 1 & -1 & X \end{vmatrix} = (X-2)\begin{vmatrix} 1 & -1 & -1 \\ 0 & X+1 & 0 \\ 0 & 0 & X+1 \end{vmatrix} = (X-2)(X+1)^2.$$
      <p>$\Sp(A) = \{2, -1\}$, avec $m(2) = 1$ et $m(-1) = 2$.</p>` },

    { t: 'h', title: 'Sous-espaces propres' },
    { t: 'h2', title: 'Définition' },
    { t: 'def', body: R`<p>Pour $\lambda \in \K$, on note $E_\lambda(u) = \Ker(u - \lambda\,\Id_E) = \{x \in E \mid u(x) = \lambda x\}$. Lorsque $\lambda \in \Sp(u)$, $E_\lambda(u)$ est appelé <strong>sous-espace propre</strong> de $u$ associé à $\lambda$ : il est formé des vecteurs propres associés à $\lambda$ et du vecteur nul. Pour une matrice : $E_\lambda(A) = \Ker(A - \lambda I_n)$.</p>` },
    { t: 'prop', body: R`
      <p>$E_\lambda(u)$ est un sous-espace vectoriel de $E$, stable par $u$, et $\lambda \in \Sp(u) \iff E_\lambda(u) \neq \{0\}$. Pour une matrice, $\dim E_\lambda(A) = n - \rg(A - \lambda I_n)$.</p>`,
      proof: R`<p>C'est le noyau d'une application linéaire. Si $u(x) = \lambda x$, alors $u(u(x)) = \lambda u(x)$ : $u(x) \in E_\lambda(u)$. La dimension vient du théorème du rang.</p>` },
    { t: 'ex', body: R`<p>Pour $A = \begin{pmatrix} 0 & 1 & 1 \\ 1 & 0 & 1 \\ 1 & 1 & 0 \end{pmatrix}$ : $A - 2I_3$ est de rang 2 et $(1, 1, 1)$ est dans son noyau, donc $E_2(A) = \Vect\big((1,1,1)\big)$ ; $A + I_3$ a toutes ses lignes égales à $(1\ 1\ 1)$, donc $E_{-1}(A) = \{x + y + z = 0\} = \Vect\big((1,-1,0), (1,0,-1)\big)$.</p>` },

    { t: 'h2', title: 'Somme directe des sous-espaces propres' },
    { t: 'thm', body: R`
      <p>Soient $\lambda_1, \dots, \lambda_p$ des valeurs propres <strong>deux à deux distinctes</strong> de $u$. Alors la somme $E_{\lambda_1}(u) + \dots + E_{\lambda_p}(u)$ est <strong>directe</strong>.</p>`,
      proof: R`<p>Récurrence sur $p$. Pour $p = 1$ il n'y a rien à montrer. Supposons le résultat vrai pour $p - 1$ valeurs propres distinctes, et soient $x_i \in E_{\lambda_i}(u)$ tels que</p>
      $$x_1 + x_2 + \dots + x_p = 0. \quad (1)$$
      <p>En appliquant $u$ : $\lambda_1 x_1 + \dots + \lambda_p x_p = 0$ (2). En faisant $(2) - \lambda_p\times(1)$ :</p>
      $$(\lambda_1 - \lambda_p)x_1 + \dots + (\lambda_{p-1} - \lambda_p)x_{p-1} = 0.$$
      <p>Chaque $(\lambda_i - \lambda_p)x_i$ appartient à $E_{\lambda_i}(u)$ ; par hypothèse de récurrence, $(\lambda_i - \lambda_p)x_i = 0$ pour $i \le p-1$. Comme $\lambda_i \neq \lambda_p$, on obtient $x_i = 0$ pour $i \le p-1$, puis $x_p = 0$ grâce à (1). La décomposition de $0$ est donc unique : la somme est directe.</p>` },
    { t: 'cor', body: R`
      <p>Une famille $(x_1, \dots, x_p)$ de vecteurs propres associés à des valeurs propres <strong>deux à deux distinctes</strong> est libre. En juxtaposant des bases de sous-espaces propres distincts, on obtient une famille libre.</p>`,
      proof: R`<p>Si $\sum a_i x_i = 0$, chaque $a_i x_i$ est dans $E_{\lambda_i}(u)$ ; la somme étant directe, $a_i x_i = 0$ pour tout $i$, et comme $x_i \neq 0$, $a_i = 0$. Le second point est la caractérisation d'une somme directe par les bases.</p>` },
    { t: 'cor', body: R`<p>$u$ possède <strong>au plus $n$ valeurs propres</strong> distinctes, et $\displaystyle\sum_{\lambda \in \Sp(u)} \dim E_\lambda(u) \le n$.</p>`,
      proof: R`<p>La somme des $E_\lambda(u)$ est directe, donc sa dimension est $\sum \dim E_\lambda(u)$, et c'est un sous-espace de $E$. Chaque $\dim E_\lambda(u) \ge 1$, d'où au plus $n$ valeurs propres.</p>` },
    { t: 'ex', body: R`<p>Pour $\lambda_1 < \dots < \lambda_p$ réels, les fonctions $x \mapsto e^{\lambda_k x}$ sont des vecteurs propres de $D : f \mapsto f'$ associés à des valeurs propres distinctes : la famille $(e^{\lambda_1 x}, \dots, e^{\lambda_p x})$ est <strong>libre</strong>, sans aucun calcul.</p>` },

    { t: 'h2', title: 'Dimension d’un sous-espace propre' },
    { t: 'thm', body: R`<p>Si $\lambda \in \Sp(u)$, alors $\quad 1 \le \dim E_\lambda(u) \le m(\lambda).$</p>`,
      proof: R`<p>On a $\dim E_\lambda(u) \ge 1$ car $\lambda$ est valeur propre. Soit $d = \dim E_\lambda(u)$ et $(e_1, \dots, e_d)$ une base de $E_\lambda(u)$, complétée en une base $\mathcal{B}$ de $E$. Comme $u(e_i) = \lambda e_i$ pour $i \le d$,</p>
      $$${Mat}_\mathcal{B}(u) = \begin{pmatrix} \lambda I_d & B \\ 0 & C \end{pmatrix}, \quad\text{donc}\quad \chi_u(X) = \det\begin{pmatrix} (X - \lambda)I_d & -B \\ 0 & XI_{n-d} - C \end{pmatrix} = (X - \lambda)^d\,\chi_C(X)$$
      <p>(déterminant triangulaire par blocs). Ainsi $(X - \lambda)^d$ divise $\chi_u$, d'où $d \le m(\lambda)$.</p>` },
    { t: 'cor', body: R`<p>Si $\lambda$ est une racine <strong>simple</strong> de $\chi_u$, alors $\dim E_\lambda(u) = 1$.</p>` },
    { t: 'ex', body: R`<p>$A = \begin{pmatrix} 1 & 1 \\ 0 & 1\end{pmatrix}$ : $\chi_A = (X-1)^2$, $m(1) = 2$, mais $A - I_2 = \begin{pmatrix} 0 & 1 \\ 0 & 0\end{pmatrix}$ est de rang $1$, donc $\dim E_1(A) = 1 < 2$. Ce défaut de dimension est exactement ce qui empêche la diagonalisation (partie suivante).</p>` },
    { t: 'prop', title: 'endomorphismes qui commutent', body: R`<p>Si $u, v \in \Lin(E)$ commutent ($u \circ v = v \circ u$), alors tout sous-espace propre de $u$ est stable par $v$.</p>`,
      proof: R`<p>Soit $x \in E_\lambda(u)$. Alors $u(v(x)) = v(u(x)) = v(\lambda x) = \lambda v(x)$, donc $v(x) \in E_\lambda(u)$.</p>` },

    { t: 'h', title: 'Diagonalisation' },
    { t: 'h2', title: 'Définitions' },
    { t: 'def', body: R`
      <p>$u \in \Lin(E)$ est <strong>diagonalisable</strong> s'il existe une base de $E$ dans laquelle sa matrice est diagonale, c'est-à-dire une <strong>base de $E$ formée de vecteurs propres</strong> de $u$.</p>
      <p>$A \in \M_n(\K)$ est <strong>diagonalisable</strong> si elle est semblable à une matrice diagonale : il existe $P \in GL_n(\K)$ et $D$ diagonale telles que $A = PDP^{-1}$ (c'est-à-dire $D = P^{-1}AP$).</p>` },
    { t: 'prop', title: 'lecture de P et D', body: R`<p>$A = PDP^{-1}$ avec $D = \mathrm{diag}(\lambda_1, \dots, \lambda_n)$ si et seulement si $AP = PD$, c'est-à-dire si et seulement si la $j$-ème colonne $C_j$ de $P$ vérifie $AC_j = \lambda_jC_j$. Ainsi : <strong>les colonnes de $P$ sont des vecteurs propres</strong> (formant une base) et <strong>$D$ contient les valeurs propres correspondantes, dans le même ordre</strong>.</p>`,
      proof: R`<p>La $j$-ème colonne de $AP$ est $AC_j$ et celle de $PD$ est $\lambda_jC_j$. $P$ est inversible si et seulement si ses colonnes forment une base de $\K^n$.</p>` },

    { t: 'h2', title: 'Critères de diagonalisabilité' },
    { t: 'thm', title: 'condition nécessaire et suffisante', body: R`
      <p>Les propriétés suivantes sont équivalentes :</p>
      <ol>
        <li>$u$ est diagonalisable ;</li>
        <li>$E = \bigoplus_{\lambda \in \Sp(u)} E_\lambda(u)$ ;</li>
        <li>$\displaystyle\sum_{\lambda \in \Sp(u)} \dim E_\lambda(u) = n$ ;</li>
        <li><strong>$\chi_u$ est scindé sur $\K$ et $\dim E_\lambda(u) = m(\lambda)$ pour toute valeur propre $\lambda$</strong>.</li>
      </ol>`,
      proof: R`<p>(1) ⇒ (3) : une base de vecteurs propres se répartit dans les $E_\lambda$ ; la famille des vecteurs associés à $\lambda$ est libre dans $E_\lambda$, donc il y en a au plus $\dim E_\lambda$, d'où $n \le \sum\dim E_\lambda$ ; l'autre inégalité est le corollaire de la somme directe.</p>
      <p>(3) ⇒ (2) : la somme des $E_\lambda$ est directe, de dimension $\sum\dim E_\lambda = n$, donc égale à $E$. (2) ⇒ (1) : en juxtaposant des bases des $E_\lambda$, on obtient une base de $E$ formée de vecteurs propres.</p>
      <p>(1) ⇒ (4) : si $D = \mathrm{diag}(\lambda_1, \dots, \lambda_n)$ est la matrice de $u$ dans une base de vecteurs propres, $\chi_u = \prod(X - \lambda_i)$ est scindé, et $m(\lambda)$ est le nombre de $\lambda_i$ égaux à $\lambda$, qui est aussi $\dim E_\lambda$ ($E_\lambda(D)$ est engendré par les vecteurs de base correspondants). (4) ⇒ (3) : $\chi_u$ scindé de degré $n$ donne $\sum m(\lambda) = n$, donc $\sum\dim E_\lambda = n$.</p>` },
    { t: 'cor', title: 'condition suffisante', body: R`<p>Si $\chi_u$ est scindé à racines <strong>simples</strong> (c'est-à-dire si $u$ a <strong>$n$ valeurs propres distinctes</strong>), alors $u$ est diagonalisable, et chaque sous-espace propre est une droite.</p>`,
      proof: R`<p>Chaque $\dim E_\lambda$ vaut $1 = m(\lambda)$ (racine simple), et $\chi_u$ est scindé : on applique le critère (4).</p>` },
    { t: 'warn', body: R`<p>La condition « $n$ valeurs propres distinctes » est <strong>suffisante mais pas nécessaire</strong> : $I_n$ est diagonale avec une seule valeur propre. Inversement, une matrice dont le spectre est $\{\lambda\}$ n'est diagonalisable que si elle vaut $\lambda I_n$ (car alors $A = P(\lambda I_n)P^{-1} = \lambda I_n$).</p>` },
    { t: 'ex', body: R`
      <ul>
        <li>$\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$ <strong>n'est pas diagonalisable</strong> : $\dim E_1 = 1 < 2 = m(1)$.</li>
        <li>La rotation $\begin{pmatrix} 0 & -1 \\ 1 & 0 \end{pmatrix}$ n'est pas diagonalisable dans $\M_2(\R)$ ($\chi = X^2 + 1$ n'est pas scindé sur $\R$), mais elle l'est dans $\M_2(\C)$ (deux valeurs propres distinctes $\pm i$).</li>
        <li>Les projections et les symétries sont diagonalisables (base adaptée, chapitre 1).</li>
      </ul>` },

    { t: 'h2', title: 'Méthode et exemple' },
    { t: 'meth', title: 'diagonaliser une matrice', body: R`
      <ol>
        <li>Calculer $\chi_A$ et le <strong>factoriser</strong> : valeurs propres et multiplicités. S'il n'est pas scindé sur $\K$ : pas diagonalisable sur $\K$.</li>
        <li>Pour chaque valeur propre, déterminer une base de $E_\lambda(A)$ (échelonner $A - \lambda I_n$). Les valeurs propres simples donnent automatiquement des droites.</li>
        <li>Conclure : diagonalisable si et seulement si $\dim E_\lambda = m(\lambda)$ pour tout $\lambda$.</li>
        <li>$P$ : vecteurs propres en colonnes ; $D$ : valeurs propres dans le même ordre. Contrôler $AP = PD$.</li>
      </ol>` },
    { t: 'ex', body: R`
      <p>$A = \begin{pmatrix} 0 & 1 & 1 \\ 1 & 0 & 1 \\ 1 & 1 & 0 \end{pmatrix}$ : $\chi_A = (X - 2)(X + 1)^2$ est scindé ; $\dim E_2 = 1 = m(2)$ et $\dim E_{-1} = 2 = m(-1)$. Donc $A$ est diagonalisable :</p>
      $$P = \begin{pmatrix} 1 & 1 & 1 \\ 1 & -1 & 0 \\ 1 & 0 & -1 \end{pmatrix}, \qquad D = \begin{pmatrix} 2 & 0 & 0 \\ 0 & -1 & 0 \\ 0 & 0 & -1 \end{pmatrix}, \qquad A = PDP^{-1}.$$` },
    { t: 'prop', title: 'puissances', body: R`<p>Si $A = PDP^{-1}$ avec $D = \mathrm{diag}(\lambda_1, \dots, \lambda_n)$, alors pour tout $k \in \N$ : $A^k = PD^kP^{-1}$ avec $D^k = \mathrm{diag}(\lambda_1^k, \dots, \lambda_n^k)$.</p>`,
      proof: R`<p>$A^k = (PDP^{-1})(PDP^{-1})\cdots(PDP^{-1}) = PD^kP^{-1}$ (les $P^{-1}P$ intermédiaires valent $I_n$), et le produit de matrices diagonales se fait coefficient par coefficient.</p>` },

    { t: 'h', title: 'Application aux suites récurrentes linéaires' },
    { t: 'h2', title: 'Systèmes récurrents' },
    { t: 'prop', body: R`
      <p>Soit $A \in \M_p(\K)$ et $(X_n)$ une suite de vecteurs de $\K^p$ telle que $X_{n+1} = AX_n$ pour tout $n$. Alors $X_n = A^nX_0$. Si $A$ est diagonalisable, de base de vecteurs propres $(w_1, \dots, w_p)$ associés à $\lambda_1, \dots, \lambda_p$, et si $X_0 = c_1w_1 + \dots + c_pw_p$, alors</p>
      $$X_n = c_1\lambda_1^n\,w_1 + c_2\lambda_2^n\,w_2 + \dots + c_p\lambda_p^n\,w_p.$$`,
      proof: R`<p>Récurrence immédiate pour $X_n = A^nX_0$. Puis $A^nw_i = \lambda_i^nw_i$ (récurrence) et la linéarité donnent $A^nX_0 = \sum c_iA^nw_i = \sum c_i\lambda_i^nw_i$.</p>` },
    { t: 'ex', body: R`
      <p>$u_0 = 3$, $v_0 = 2$ et $u_{n+1} = 4u_n - 2v_n$, $v_{n+1} = u_n + v_n$. Ici $A = \begin{pmatrix} 4 & -2 \\ 1 & 1 \end{pmatrix}$, $\chi_A = (X - 2)(X - 3)$, $w_1 = (1, 1)$ pour $2$ et $w_2 = (2, 1)$ pour $3$. On décompose $X_0 = (3, 2) = w_1 + w_2$, donc</p>
      $$u_n = 2^n + 2\cdot3^n, \qquad v_n = 2^n + 3^n.$$
      <p>Contrôle : $u_1 = 4 \times 3 - 2 \times 2 = 8 = 2 + 6$ ✓.</p>` },

    { t: 'h2', title: 'Suites récurrentes linéaires d’ordre 2' },
    { t: 'p', body: R`<p>Soient $a, b \in \K$ avec $b \neq 0$, et $(u_n)$ telle que $u_{n+2} = au_{n+1} + bu_n$ pour tout $n$. En posant $X_n = \begin{pmatrix} u_n \\ u_{n+1} \end{pmatrix}$ :</p>
      $$X_{n+1} = AX_n, \qquad A = \begin{pmatrix} 0 & 1 \\ b & a \end{pmatrix}, \qquad \chi_A(X) = X^2 - aX - b.$$
      <p>L'équation $r^2 = ar + b$ s'appelle l'<strong>équation caractéristique</strong> de la récurrence.</p>` },
    { t: 'thm', body: R`
      <ol>
        <li>Si l'équation caractéristique a <strong>deux racines distinctes</strong> $r_1, r_2$ dans $\K$, les solutions sont les suites $u_n = \lambda r_1^n + \mu r_2^n$, $\lambda, \mu \in \K$.</li>
        <li>Si elle a une <strong>racine double</strong> $r$, les solutions sont les suites $u_n = (\lambda + \mu n)\,r^n$.</li>
      </ol>
      <p>Les constantes $\lambda, \mu$ sont déterminées de façon unique par $u_0$ et $u_1$.</p>`,
      proof: R`<p>L'ensemble $\mathcal{S}$ des suites solutions est un espace vectoriel, et $u \mapsto (u_0, u_1)$ est un isomorphisme de $\mathcal{S}$ sur $\K^2$ (une solution est déterminée par ses deux premiers termes, qu'on peut choisir librement) : $\dim\mathcal{S} = 2$.</p>
      <p>1. $A$ a deux valeurs propres distinctes : elle est diagonalisable, $A = PDP^{-1}$, $X_n = PD^nP^{-1}X_0$, et la première coordonnée $u_n$ est une combinaison de $r_1^n$ et $r_2^n$. Réciproquement $(r_i^n)$ est solution car $r_i^2 = ar_i + b$. Les suites $(r_1^n)$ et $(r_2^n)$ sont libres (leurs deux premiers termes $(1, r_1)$, $(1, r_2)$ le sont) : c'est une base de $\mathcal{S}$.</p>
      <p>2. Ici $A - rI_2 = \begin{pmatrix} -r & 1 \\ b & a - r \end{pmatrix} \neq 0$ : $A$ n'est pas diagonalisable, on raisonne directement. La somme et le produit des racines donnent $a = 2r$ et $-b = r^2$ ; comme $b \neq 0$, $r \neq 0$. $(r^n)$ est solution ; pour $v_n = nr^n$ : $v_{n+2} - av_{n+1} - bv_n = r^n\big(n(r^2 - ar - b) + (2r^2 - ar)\big) = r^n \cdot r(2r - a) = 0$. Les suites $(r^n)$ et $(nr^n)$ ont pour premiers termes $(1, r)$ et $(0, r)$, libres car $r \neq 0$ : elles forment une base de $\mathcal{S}$.</p>` },
    { t: 'rem', title: 'cas réel avec racines complexes', body: R`<p>Si $a, b \in \R$ et que l'équation caractéristique a deux racines complexes conjuguées $\rho e^{\pm i\theta}$, les suites réelles solutions sont $u_n = \rho^n\big(\lambda\cos(n\theta) + \mu\sin(n\theta)\big)$, $\lambda, \mu \in \R$.</p>` },
    { t: 'ex', title: 'Fibonacci', body: R`<p>$F_0 = 0$, $F_1 = 1$, $F_{n+2} = F_{n+1} + F_n$. Équation caractéristique $r^2 = r + 1$ : $\varphi = \frac{1 + \sqrt5}{2}$, $\psi = \frac{1 - \sqrt5}{2}$. $F_n = \lambda\varphi^n + \mu\psi^n$ avec $\lambda + \mu = 0$ et $\lambda\varphi + \mu\psi = 1$, d'où $\lambda = \frac{1}{\sqrt5} = -\mu$ :</p>
      $$F_n = \frac{1}{\sqrt5}\left(\varphi^n - \psi^n\right).$$` },
    { t: 'ex', title: 'racine double', body: R`<p>$u_0 = 1$, $u_1 = 4$, $u_{n+2} = 4u_{n+1} - 4u_n$ : $r^2 - 4r + 4 = (r - 2)^2$, donc $u_n = (\lambda + \mu n)2^n$ ; $\lambda = 1$ et $2(\lambda + \mu) = 4$ donnent $\mu = 1$ : $u_n = (n + 1)2^n$. Contrôle : $u_2 = 16 - 4 = 12 = 3 \times 4$ ✓.</p>` }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche                                                               */
  /* ------------------------------------------------------------------ */
  const fiche = [
    { part: '1. Déterminant, trace' },
    { k: 'form', t: 'Déterminant', prio: true,
      concl: [R`$\begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad - bc$ ; $3 \times 3$ : Sarrus ou développement (signes $(-1)^{i+j}$)`, R`Triangulaire : <u>produit de la diagonale</u>`, R`$\det(AB) = \det A\det B$, $\det A^T = \det A$, $\det(\lambda A) = \lambda^n\det A$`] },
    { k: 'thm', t: 'Inversibilité', prio: true,
      concl: [R`<u>$A$ inversible $\iff \det A \neq 0$</u>`, R`$\det(A^{-1}) = 1/\det A$ ; $\det(P^{-1}AP) = \det A$`] },
    { k: 'prop', t: 'Trace',
      concl: [R`$\tr A = \sum a_{ii}$, linéaire`, R`<u>$\tr(AB) = \tr(BA)$</u> ; semblables ⇒ même trace`, R`Projection : $\tr p = \rg p$`] },

    { part: '2. Valeurs propres, vecteurs propres' },
    { k: 'def', t: 'Valeur propre, vecteur propre', prio: true,
      hyp: R`Soit $u \in \Lin(E)$ et $\lambda \in \K$`,
      concl: [R`$\lambda$ valeur propre <u>ssi $\exists x \neq 0$, $u(x) = \lambda x$</u>`, R`$x$ : vecteur propre ; $\Sp(u)$ : ensemble des valeurs propres`] },
    { k: 'prop', t: 'Caractérisation',
      concl: [R`$\lambda \in \Sp(u) \iff u - \lambda\Id$ non injectif $\iff \det(u - \lambda\Id) = 0$`, R`$0 \in \Sp(u) \iff \det u = 0$`, R`Semblables ⇒ même spectre ; le spectre dépend du corps`] },

    { part: '3. Polynôme caractéristique' },
    { k: 'def', t: 'Polynôme caractéristique', prio: true,
      concl: [R`$\chi_A(X) = \det(XI_n - A)$, unitaire de degré $n$`, R`$n = 2$ : <u>$\chi_A = X^2 - \tr(A)\,X + \det A$</u>`, R`$n = 3$ : $\chi_A = X^3 - \tr(A)X^2 + s_2X - \det A$`] },
    { k: 'thm', t: 'Valeurs propres et racines', prio: true,
      concl: [R`$\lambda \in \Sp(A)$ <u>ssi $\chi_A(\lambda) = 0$</u>`, R`$A$ triangulaire ⇒ valeurs propres = <u>coefficients diagonaux</u>`, R`Sur $\C$ : au moins une valeur propre`] },
    { k: 'prop', t: 'Trace et déterminant',
      hyp: R`$\chi_A$ scindé : $\chi_A = \prod_k (X - \lambda_k)^{m_k}$`,
      concl: [R`$\tr A = \sum_k m_k \lambda_k$`, R`$\det A = \prod_k \lambda_k^{m_k}$`],
      b: R`Sert à vérifier ses calculs.` },

    { part: '4. Sous-espaces propres' },
    { k: 'def', t: 'Sous-espace propre',
      concl: [R`$E_\lambda(u) = \Ker(u - \lambda\,\Id)$`, R`$\dim E_\lambda(A) = n - \rg(A - \lambda I_n)$`] },
    { k: 'thm', t: 'Valeurs propres distinctes',
      hyp: R`$\lambda_1, \dots, \lambda_p$ <u>deux à deux distinctes</u>`,
      concl: [R`$E_{\lambda_1} + \dots + E_{\lambda_p}$ est <b>directe</b>`, R`Vecteurs propres associés : famille <b>libre</b>`] },
    { k: 'thm', t: 'Dimension', prio: true,
      concl: [R`<u>$1 \le \dim E_\lambda \le m(\lambda)$</u>`, R`Racine simple ⇒ $\dim E_\lambda = 1$`] },

    { part: '5. Diagonalisation' },
    { k: 'def', t: 'Diagonalisable',
      concl: [R`$u$ : il existe une <u>base de vecteurs propres</u>`, R`$A = PDP^{-1}$ : <b>colonnes de $P$</b> = vecteurs propres, <b>$D$</b> = valeurs propres dans le même ordre`] },
    { k: 'thm', t: 'Critère', prio: true,
      concl: [R`Diagonalisable $\iff \sum_\lambda \dim E_\lambda = n \iff E = \bigoplus E_\lambda$`, R`$\iff$ <u>$\chi$ scindé et $\dim E_\lambda = m(\lambda)$ pour tout $\lambda$</u>`] },
    { k: 'cor', t: 'Condition suffisante', prio: true,
      hyp: R`<u>$n$ valeurs propres distinctes</u>`,
      concl: [R`Diagonalisable (non nécessaire : $I_n$)`] },
    { k: 'form', t: 'Puissances',
      concl: [R`$A = PDP^{-1}$ ⇒ <u>$A^k = PD^kP^{-1}$</u>`] },

    { part: '6. Suites récurrentes linéaires' },
    { k: 'form', t: 'Systèmes', prio: true,
      hyp: R`$X_{n+1} = AX_n$, $A$ diagonalisable, $X_0 = \sum c_iw_i$ ($w_i$ propres)`,
      concl: [R`$X_n = A^nX_0 = \sum c_i\lambda_i^n\,w_i$`] },
    { k: 'thm', t: 'Ordre 2 : $u_{n+2} = au_{n+1} + bu_n$', prio: true,
      hyp: R`Équation caractéristique <u>$r^2 = ar + b$</u> ($b \neq 0$)`,
      concl: [R`Racines distinctes $r_1, r_2$ : $u_n = \lambda r_1^n + \mu r_2^n$`, R`Racine double $r$ : $u_n = (\lambda + \mu n)r^n$`, R`$\lambda, \mu$ : avec $u_0$ et $u_1$`] },
    { k: 'warn', t: 'Pièges',
      concl: [R`Un vecteur propre est <b>non nul</b> ; $E_\lambda = \{0\}$ signale une erreur`, R`$\det(A - XI_n) = (-1)^n \chi_A$`, R`Même ordre dans $P$ et dans $D$`, R`Diagonalisable sur $\C$ $\not\Rightarrow$ sur $\R$`] }
  ];

  /* ------------------------------------------------------------------ */
  /* Exercices                                                           */
  /* ------------------------------------------------------------------ */
  const exercices = [
    {
      id: 'det-calc', title: 'Calcul de déterminants', diff: 1, gen: 'det3',
      enonce: R`<p>Calculer le déterminant et la trace de $A = \begin{pmatrix} 2 & 1 & 3 \\ 0 & -1 & 4 \\ 1 & 0 & 2 \end{pmatrix}$. Cette matrice est-elle inversible ?</p>`,
      indication: R`<p>Développez selon la 2<sup>e</sup> ligne, qui contient un zéro.</p>`,
      correction: R`<p>Développement selon la 2<sup>e</sup> ligne (signes $-, +, -$) :</p>
        $$\det A = -0 + (-1)\begin{vmatrix} 2 & 3 \\ 1 & 2 \end{vmatrix} - 4\begin{vmatrix} 2 & 1 \\ 1 & 0 \end{vmatrix} = -1 \times 1 - 4 \times (-1) = 3.$$
        <p>(Sarrus : $-4 + 4 + 0 - (-3 + 0 + 0) = 3$.) $\tr A = 2 - 1 + 2 = 3$. Comme $\det A \neq 0$, $A$ est inversible.</p>`,
      similaires: [
        {
          title: 'Déterminant avec paramètre',
          enonce: R`<p>Pour $a \in \R$, calculer $\det\begin{pmatrix} 1 & 1 & 1 \\ 1 & a & 1 \\ 1 & 1 & a \end{pmatrix}$. Pour quelles valeurs de $a$ la matrice est-elle inversible ?</p>`,
          correction: R`<p>Avec $L_2 \leftarrow L_2 - L_1$ et $L_3 \leftarrow L_3 - L_1$ (opérations qui ne changent pas le déterminant), on obtient une matrice triangulaire de diagonale $1, a - 1, a - 1$ : le déterminant vaut $(a - 1)^2$. La matrice est inversible si et seulement si $a \neq 1$.</p>`
        }
      ]
    },
    {
      id: 'trace', title: 'Propriétés de la trace', diff: 2,
      enonce: R`<ol><li>Montrer que $\tr(AB) = \tr(BA)$ pour $A, B \in \M_n(\K)$.</li><li>En déduire qu'il n'existe pas de matrices $A, B \in \M_n(\R)$ telles que $AB - BA = I_n$.</li><li>Les matrices $\begin{pmatrix} 1 & 2 \\ 0 & 3 \end{pmatrix}$ et $\begin{pmatrix} 2 & 0 \\ 0 & 3 \end{pmatrix}$ sont-elles semblables ?</li></ol>`,
      correction: R`<p>1. $\tr(AB) = \sum_i\sum_k a_{ik}b_{ki} = \sum_k\sum_i b_{ki}a_{ik} = \tr(BA)$.</p>
        <p>2. Par linéarité, $\tr(AB - BA) = \tr(AB) - \tr(BA) = 0$, alors que $\tr I_n = n \neq 0$.</p>
        <p>3. Non : leurs traces valent $4$ et $5$, or deux matrices semblables ont la même trace.</p>`,
      similaires: [
        {
          title: 'Trace d’un projecteur',
          enonce: R`<p>Soit $p$ un projecteur de $E$ ($p \circ p = p$). Montrer que $\tr p = \rg p$. Application : $M = \begin{pmatrix} 2 & -2 \\ 1 & -1 \end{pmatrix}$ vérifie $M^2 = M$ ; quel est son rang ?</p>`,
          correction: R`<p>$E = \Imm p \oplus \Ker p$ et, dans une base adaptée, $${Mat}(p) = \mathrm{diag}(1, \dots, 1, 0, \dots, 0)$ avec $\rg p$ coefficients égaux à $1$. La trace ne dépend pas de la base : $\tr p = \rg p$. Pour $M$ : $\tr M = 2 - 1 = 1$, donc $\rg M = 1$.</p>`
        }
      ]
    },
    {
      id: 'mat2', title: 'Éléments propres d’une matrice 2×2', diff: 1, gen: 'spectre2',
      enonce: R`<p>Soit $A = \begin{pmatrix} 4 & -2 \\ 1 & 1 \end{pmatrix}$. Déterminer $\chi_A$, $\Sp(A)$ et une base de chaque sous-espace propre.</p>`,
      indication: R`<p>$\chi_A = X^2 - \tr(A)X + \det(A)$.</p>`,
      correction: R`<p>$\tr A = 5$, $\det A = 4 + 2 = 6$, donc $\chi_A = X^2 - 5X + 6 = (X - 2)(X - 3)$ et $\Sp(A) = \{2, 3\}$.</p>
        <p>$\lambda = 2$ : $A - 2I_2 = \begin{pmatrix} 2 & -2 \\ 1 & -1\end{pmatrix}$, système $x - y = 0$, donc $E_2(A) = \Vect\big((1,1)\big)$.</p>
        <p>$\lambda = 3$ : $A - 3I_2 = \begin{pmatrix} 1 & -2 \\ 1 & -2\end{pmatrix}$, système $x - 2y = 0$, donc $E_3(A) = \Vect\big((2,1)\big)$.</p>
        <p>Vérification : $A\begin{pmatrix}2\\1\end{pmatrix} = \begin{pmatrix}6\\3\end{pmatrix} = 3\begin{pmatrix}2\\1\end{pmatrix}$.</p>`
    },
    {
      id: 'mat3', title: 'Éléments propres d’une matrice 3×3', diff: 2, gen: 'spectre3',
      enonce: R`<p>Soit $A = \begin{pmatrix} 2 & 0 & 4 \\ 3 & -4 & 12 \\ 1 & -2 & 5 \end{pmatrix}$. Calculer $\chi_A$, puis déterminer les valeurs propres et les sous-espaces propres de $A$.</p>`,
      indication: R`<p>Calculez d'abord $\tr A$ et $\det A$ : ils donnent deux coefficients de $\chi_A$. Pour le coefficient de $X$, sommez les mineurs principaux d'ordre 2.</p>`,
      correction: R`<p>On a $\tr A = 3$ et $\det A = 2(-20 + 24) - 0 + 4(-6 + 4) = 0$. Le coefficient de $X$ dans $\chi_A$ est la somme des mineurs principaux d'ordre 2 :
        $\begin{vmatrix} 2 & 0 \\ 3 & -4\end{vmatrix} + \begin{vmatrix} 2 & 4 \\ 1 & 5\end{vmatrix} + \begin{vmatrix} -4 & 12 \\ -2 & 5\end{vmatrix} = -8 + 6 + 4 = 2.$</p>
        $$\chi_A = X^3 - 3X^2 + 2X = X(X-1)(X-2), \qquad \Sp(A) = \{0, 1, 2\}.$$
        <ul>
          <li>$\lambda = 0$ : $AX = 0$ donne $x = -2z$ et $y = \tfrac32 z$, donc $E_0(A) = \Vect\big((-4, 3, 2)\big)$.</li>
          <li>$\lambda = 1$ : $(A - I_3)X = 0$, la 1<sup>re</sup> ligne donne $x = -4z$, la 2<sup>e</sup> $3x - 5y + 12z = 0$ d'où $y = 0$ : $E_1(A) = \Vect\big((-4, 0, 1)\big)$.</li>
          <li>$\lambda = 2$ : la 1<sup>re</sup> ligne de $A - 2I_3$ donne $z = 0$, puis $3x - 6y = 0$ : $E_2(A) = \Vect\big((2, 1, 0)\big)$.</li>
        </ul>
        <p>Chaque valeur propre est simple, et on trouve bien des droites. Trois valeurs propres distinctes : $A$ est diagonalisable.</p>`
    },
    {
      id: 'param', title: 'Discussion selon un paramètre', diff: 2, gen: 'polycar2',
      enonce: R`<p>Pour $a \in \R$, on pose $A_a = \begin{pmatrix} 1 & a \\ 1 & 1\end{pmatrix}$. Selon les valeurs de $a$, déterminer les valeurs propres réelles de $A_a$ et ses sous-espaces propres. Pour quelles valeurs de $a$ la matrice est-elle diagonalisable dans $\M_2(\R)$ ? dans $\M_2(\C)$ ?</p>`,
      correction: R`<p>$\chi_{A_a} = X^2 - 2X + 1 - a = (X - 1)^2 - a$.</p>
        <ul>
          <li><strong>$a > 0$</strong> : deux valeurs propres réelles distinctes $1 \pm \sqrt a$ : diagonalisable sur $\R$. Pour $\lambda = 1 + \sqrt a$, la 2<sup>e</sup> ligne de $A_a - \lambda I_2$ donne $x - \sqrt a\,y = 0$ : $E_{1+\sqrt a} = \Vect\big((\sqrt a, 1)\big)$. De même $E_{1-\sqrt a} = \Vect\big((-\sqrt a, 1)\big)$.</li>
          <li><strong>$a = 0$</strong> : $\chi = (X-1)^2$, $\Sp = \{1\}$. $A_0 - I_2 = \begin{pmatrix} 0 & 0 \\ 1 & 0\end{pmatrix}$ donne $x = 0$ : $E_1 = \Vect\big((0,1)\big)$, de dimension $1 < m(1) = 2$ : <strong>non diagonalisable</strong> (ni sur $\R$, ni sur $\C$).</li>
          <li><strong>$a < 0$</strong> : $\Sp_\R(A_a) = \varnothing$, pas diagonalisable sur $\R$. Dans $\C$ : $\lambda = 1 \pm i\sqrt{-a}$, distinctes, donc diagonalisable sur $\C$, avec $E_{1 + i\sqrt{-a}} = \Vect\big((i\sqrt{-a}, 1)\big)$.</li>
        </ul>`
    },
    {
      id: 'lignes-constantes', title: 'Une valeur propre évidente', diff: 1, gen: 'testvec',
      enonce: R`<p>Soit $A \in \M_n(\K)$ telle que la somme des coefficients de chaque ligne vaut $s$. Montrer que $s$ est valeur propre de $A$. Application : trouver une valeur propre et un vecteur propre de $\begin{pmatrix} 2 & 1 & 4 \\ 3 & 3 & 1 \\ 0 & 5 & 2\end{pmatrix}$ sans calcul de polynôme caractéristique.</p>`,
      correction: R`<p>Soit $U = (1, \dots, 1)^T \neq 0$. La $i$-ème coordonnée de $AU$ est $\sum_j a_{ij} = s$, donc $AU = sU$ : $s \in \Sp(A)$ et $U$ est vecteur propre.</p>
        <p>Application : chaque ligne a pour somme $7$ ; donc $7$ est valeur propre, de vecteur propre $(1, 1, 1)$.</p>`
    },
    {
      id: 'projecteur', title: 'Spectre d’un projecteur', diff: 1,
      enonce: R`<p>Soit $p \in \Lin(E)$ tel que $p \circ p = p$.</p>
        <ol><li>Montrer que $\Sp(p) \subset \{0, 1\}$.</li><li>Montrer que $E_1(p) = \Imm p$. En déduire que si $p \neq 0$ et $p \neq \Id_E$, alors $\Sp(p) = \{0,1\}$.</li></ol>`,
      indication: R`<p>Appliquer $p$ deux fois à un vecteur propre.</p>`,
      correction: R`<p>1. Soit $\lambda \in \Sp(p)$ et $x \neq 0$ avec $p(x) = \lambda x$. Alors $p(p(x)) = \lambda p(x) = \lambda^2 x$, et $p(p(x)) = p(x) = \lambda x$. Donc $(\lambda^2 - \lambda)x = 0$, et comme $x \neq 0$, $\lambda(\lambda - 1) = 0$.</p>
        <p>2. Si $p(x) = x$ alors $x = p(x) \in \Imm p$. Réciproquement si $y = p(x) \in \Imm p$, alors $p(y) = p(p(x)) = p(x) = y$. Donc $E_1(p) = \Imm p$. Si $p \neq 0$, $\Imm p \neq \{0\}$ donc $1 \in \Sp(p)$. Si $p \neq \Id_E$, il existe $x$ avec $p(x) \neq x$ ; alors $y = x - p(x) \neq 0$ vérifie $p(y) = p(x) - p(x) = 0$, donc $0 \in \Sp(p)$.</p>`,
      similaires: [
        {
          title: 'Spectre d’une symétrie',
          enonce: R`<p>Soit $s \in \Lin(E)$ tel que $s \circ s = \Id_E$. Montrer que $\Sp(s) \subset \{-1, 1\}$, puis que $E = E_1(s) \oplus E_{-1}(s)$ (on pourra écrire $x = \frac{x + s(x)}{2} + \frac{x - s(x)}{2}$). En déduire que $s$ est diagonalisable.</p>`,
          correction: R`<p>Si $s(x) = \lambda x$ avec $x \neq 0$ : $x = s(s(x)) = \lambda^2 x$ donc $\lambda^2 = 1$.</p>
            <p>Pour tout $x$ : $s\big(\frac{x + s(x)}{2}\big) = \frac{s(x) + x}{2}$, donc $\frac{x + s(x)}{2} \in E_1(s)$ ; et $s\big(\frac{x - s(x)}{2}\big) = -\frac{x - s(x)}{2}$, donc $\frac{x - s(x)}{2} \in E_{-1}(s)$. Ainsi $E = E_1(s) + E_{-1}(s)$, et la somme est directe car $1 \neq -1$. $E$ est somme directe de sous-espaces propres : $s$ est diagonalisable.</p>`
        },
        {
          title: 'Relation u³ = u',
          enonce: R`<p>Soit $u \in \Lin(E)$ tel que $u^3 = u$. Montrer que $\Sp(u) \subset \{-1, 0, 1\}$. Donner un exemple de matrice $A \in \M_3(\R)$ avec $A^3 = A$ et $\Sp(A) = \{-1, 0, 1\}$.</p>`,
          correction: R`<p>Si $u(x) = \lambda x$, $x \neq 0$ : $u^3(x) = \lambda^3 x = u(x) = \lambda x$, donc $\lambda^3 - \lambda = \lambda(\lambda - 1)(\lambda + 1) = 0$.</p>
            <p>Exemple : $A = \mathrm{diag}(-1, 0, 1)$ vérifie $A^3 = \mathrm{diag}(-1, 0, 1) = A$ et son spectre est sa diagonale.</p>`
        }
      ]
    },
    {
      id: 'nilpotent', title: 'Matrice nilpotente', diff: 2,
      enonce: R`<p>Soit $A \in \M_n(\C)$ <em>nilpotente</em> : il existe $p \ge 1$ tel que $A^p = 0$.</p>
        <ol><li>Montrer que $\Sp(A) = \{0\}$.</li><li>En déduire $\chi_A$, puis $\tr A$.</li><li>Montrer que si $A$ est diagonalisable, alors $A = 0$.</li></ol>`,
      correction: R`<p>1. Si $AX = \lambda X$ avec $X \neq 0$, alors $A^pX = \lambda^pX = 0$ donc $\lambda^p = 0$, $\lambda = 0$. Ainsi $\Sp(A) \subset \{0\}$. Réciproquement, $\det(A)^p = \det(A^p) = 0$ donc $A$ n'est pas inversible et $0 \in \Sp(A)$.</p>
        <p>2. $\chi_A$ est unitaire de degré $n$, scindé sur $\C$, et sa seule racine est $0$ : $\chi_A = X^n$. Le coefficient de $X^{n-1}$ est nul, donc $\tr A = 0$.</p>
        <p>3. Si $A = PDP^{-1}$, $D$ est diagonale avec les valeurs propres, toutes nulles : $D = 0$, donc $A = 0$.</p>`,
      similaires: [
        {
          title: 'Valeurs propres de l’inverse',
          enonce: R`<p>Soit $A \in GL_n(\K)$. Montrer que $0 \notin \Sp(A)$ et que $\lambda \in \Sp(A) \iff \frac1\lambda \in \Sp(A^{-1})$, avec $E_\lambda(A) = E_{1/\lambda}(A^{-1})$.</p>`,
          correction: R`<p>$A$ inversible donc injective : $0 \notin \Sp(A)$. Si $AX = \lambda X$ avec $X \neq 0$, en multipliant par $A^{-1}$ : $X = \lambda A^{-1}X$, soit $A^{-1}X = \frac1\lambda X$. Le raisonnement est symétrique (échanger $A$ et $A^{-1}$), d'où l'égalité des sous-espaces propres.</p>`
        }
      ]
    },
    {
      id: 'derivation', title: 'Dérivation sur un espace de polynômes', diff: 2,
      enonce: R`<p>Soit $n \ge 1$ et $\varphi : \R_n[X] \to \R_n[X]$, $P \mapsto P'$.</p>
        <ol><li>Déterminer $\Sp(\varphi)$ et les sous-espaces propres (on raisonnera sur les degrés).</li><li>Retrouver le résultat avec la matrice de $\varphi$ dans la base canonique. $\varphi$ est-il diagonalisable ?</li><li>Comparer avec la dérivation sur $C^\infty(\R,\R)$.</li></ol>`,
      correction: R`<p>1. Soit $P \neq 0$ avec $P' = \lambda P$. Si $\lambda \neq 0$, $\deg(\lambda P) = \deg P$ alors que $\deg P' < \deg P$ (ou $P' = 0$) : contradiction. Donc $\lambda = 0$ et $P' = 0$, c'est-à-dire $P$ constant. Réciproquement les constantes non nulles conviennent : $\Sp(\varphi) = \{0\}$ et $E_0(\varphi) = \R_0[X]$.</p>
        <p>2. $\varphi(X^k) = kX^{k-1}$ : la matrice est triangulaire supérieure stricte, donc $\chi_\varphi = X^{n+1}$ et $\Sp(\varphi) = \{0\}$. $\dim E_0 = 1 < n + 1$ : $\varphi$ <strong>n'est pas diagonalisable</strong>.</p>
        <p>3. Sur $C^\infty(\R, \R)$, tout réel $\lambda$ est valeur propre ($x \mapsto e^{\lambda x}$). La différence vient de ce que $e^{\lambda x}$ n'est pas un polynôme si $\lambda \neq 0$.</p>`,
      similaires: [
        {
          title: 'L’endomorphisme P ↦ XP′',
          enonce: R`<p>Soit $\psi : \R_n[X] \to \R_n[X]$, $P \mapsto XP'$. Calculer $\psi(X^k)$ ; en déduire $\Sp(\psi)$ et ses sous-espaces propres. $\psi$ est-il diagonalisable ?</p>`,
          correction: R`<p>$\psi(X^k) = X\cdot kX^{k-1} = kX^k$ : chaque $X^k$ est vecteur propre pour la valeur propre $k$. La matrice dans la base canonique est $\mathrm{diag}(0, 1, \dots, n)$ : $\psi$ est diagonalisable (la base canonique est formée de vecteurs propres), $\Sp(\psi) = \{0, 1, \dots, n\}$ et $E_k(\psi) = \Vect(X^k)$.</p>`
        },
        {
          title: 'L’endomorphisme P ↦ P − P′',
          enonce: R`<p>Soit $\theta : \R_n[X] \to \R_n[X]$, $P \mapsto P - P'$. Déterminer $\Sp(\theta)$ et $E_\lambda(\theta)$. $\theta$ est-il diagonalisable ?</p>`,
          correction: R`<p>$\theta(X^k) = X^k - kX^{k-1}$ : la matrice dans la base canonique est triangulaire supérieure avec des $1$ sur la diagonale, donc $\chi_\theta = (X-1)^{n+1}$ et $\Sp(\theta) = \{1\}$. $E_1(\theta) = \{P \mid P' = 0\} = \R_0[X]$, de dimension $1 < n + 1$ : $\theta$ n'est pas diagonalisable.</p>`
        }
      ]
    },
    {
      id: 'transposee', title: 'A et sa transposée', diff: 1,
      enonce: R`<p>Montrer que $A$ et $A^T$ ont le même spectre. Ont-elles les mêmes sous-espaces propres ? (On étudiera $A = \begin{pmatrix} 1 & 1 \\ 0 & 2\end{pmatrix}$.)</p>`,
      correction: R`<p>$\chi_{A^T}(X) = \det\big((XI_n - A)^T\big) = \det(XI_n - A) = \chi_A(X)$, donc même spectre.</p>
        <p>Pour $A = \begin{pmatrix} 1 & 1 \\ 0 & 2\end{pmatrix}$ : $E_1(A) = \Vect\big((1,0)\big)$, $E_2(A) = \Vect\big((1,1)\big)$. Pour $A^T = \begin{pmatrix} 1 & 0 \\ 1 & 2\end{pmatrix}$ : $A^T - I_2 = \begin{pmatrix} 0 & 0 \\ 1 & 1\end{pmatrix}$ donne $E_1(A^T) = \Vect\big((1,-1)\big)$ et $E_2(A^T) = \Vect\big((0,1)\big)$. Les sous-espaces propres sont <strong>différents</strong> en général (seules leurs dimensions coïncident, car $\rg(M^T) = \rg(M)$).</p>`
    },
    {
      id: 'ab-ba', title: 'Spectres de AB et BA', diff: 3,
      enonce: R`<p>Soient $A, B \in \M_n(\K)$.</p>
        <ol><li>Soit $\lambda \neq 0$ une valeur propre de $AB$ et $X$ un vecteur propre associé. Montrer que $BX \neq 0$ et que $BX$ est vecteur propre de $BA$.</li><li>Montrer que $0 \in \Sp(AB) \iff 0 \in \Sp(BA)$.</li><li>Conclure.</li></ol>`,
      indication: R`<p>Pour 2., utiliser le déterminant.</p>`,
      correction: R`<p>1. Si $BX = 0$, alors $ABX = 0 = \lambda X$ avec $\lambda \neq 0$, donc $X = 0$ : absurde. Puis $BA(BX) = B(ABX) = B(\lambda X) = \lambda BX$ : $BX$ est vecteur propre de $BA$ pour $\lambda$.</p>
        <p>2. $0 \in \Sp(AB) \iff \det(AB) = 0 \iff \det A\det B = 0 \iff \det(BA) = 0 \iff 0 \in \Sp(BA)$.</p>
        <p>3. D'après 1. (et par symétrie des rôles), $AB$ et $BA$ ont les mêmes valeurs propres non nulles ; d'après 2., elles ont aussi $0$ en commun ou non simultanément. Donc $\Sp(AB) = \Sp(BA)$.</p>`
    },
    {
      id: 'diag-double', title: 'Diagonaliser une matrice 3×3', diff: 2, gen: 'diag3',
      enonce: R`<p>Soit $A = \begin{pmatrix} 2 & 1 & -1 \\ 1 & 2 & -1 \\ 1 & 1 & 0 \end{pmatrix}$. Montrer que $A$ est diagonalisable et trouver $P$ inversible et $D$ diagonale telles que $A = PDP^{-1}$.</p>`,
      indication: R`<p>$\tr A = 4$, $\det A = 2$ ; une valeur propre est double.</p>`,
      correction: R`<p>$\tr A = 4$, $s_2 = 3 + 1 + 1 = 5$, $\det A = 2$, donc $\chi_A = X^3 - 4X^2 + 5X - 2 = (X - 1)^2(X - 2)$.</p>
        <ul>
          <li>$A - I_3 = \begin{pmatrix} 1 & 1 & -1 \\ 1 & 1 & -1 \\ 1 & 1 & -1 \end{pmatrix}$, de rang 1 : $E_1(A) = \{x + y - z = 0\} = \Vect\big((1, 0, 1), (0, 1, 1)\big)$, de dimension $2 = m(1)$.</li>
          <li>$A - 2I_3 = \begin{pmatrix} 0 & 1 & -1 \\ 1 & 0 & -1 \\ 1 & 1 & -2 \end{pmatrix}$ : $y = z$ et $x = z$, donc $E_2(A) = \Vect\big((1, 1, 1)\big)$.</li>
        </ul>
        <p>$\chi_A$ est scindé et $\dim E_\lambda = m(\lambda)$ pour chaque valeur propre : $A$ est diagonalisable, avec</p>
        $$P = \begin{pmatrix} 1 & 0 & 1 \\ 0 & 1 & 1 \\ 1 & 1 & 1 \end{pmatrix}, \qquad D = \begin{pmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 0 & 0 & 2 \end{pmatrix}.$$`
    },
    {
      id: 'diag-param', title: 'Diagonalisable selon un paramètre', diff: 2, gen: 'diagornot',
      enonce: R`<p>Pour $a \in \R$, soit $A_a = \begin{pmatrix} 1 & a & 1 \\ 0 & 1 & 1 \\ 0 & 0 & 2 \end{pmatrix}$. Pour quelles valeurs de $a$ la matrice $A_a$ est-elle diagonalisable ? La diagonaliser dans ce cas.</p>`,
      correction: R`<p>$A_a$ est triangulaire : $\chi_{A_a} = (X - 1)^2(X - 2)$. La valeur propre $2$ est simple. Pour $1$ : $A_a - I_3 = \begin{pmatrix} 0 & a & 1 \\ 0 & 0 & 1 \\ 0 & 0 & 1 \end{pmatrix}$.</p>
        <ul>
          <li>Si $a \neq 0$, les deux premières lignes sont indépendantes : rang $2$, $\dim E_1 = 1 < 2$ : <strong>non diagonalisable</strong>.</li>
          <li>Si $a = 0$, toutes les lignes valent $(0\ 0\ 1)$ : rang $1$, $\dim E_1 = 2$ : <strong>diagonalisable</strong>. $E_1 = \{z = 0\} = \Vect(e_1, e_2)$ ; $A_0 - 2I_3 = \begin{pmatrix} -1 & 0 & 1 \\ 0 & -1 & 1 \\ 0 & 0 & 0 \end{pmatrix}$ donne $x = y = z$, $E_2 = \Vect\big((1, 1, 1)\big)$. Donc $P = \begin{pmatrix} 1 & 0 & 1 \\ 0 & 1 & 1 \\ 0 & 0 & 1 \end{pmatrix}$, $D = \mathrm{diag}(1, 1, 2)$.</li>
        </ul>`
    },
    {
      id: 'rotation', title: 'Matrice de rotation', diff: 1,
      enonce: R`<p>Pour $\theta \in \R$, soit $R_\theta = \begin{pmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{pmatrix}$. Pour quelles valeurs de $\theta$ la matrice $R_\theta$ est-elle diagonalisable dans $\M_2(\R)$ ? Montrer qu'elle est toujours diagonalisable dans $\M_2(\C)$.</p>`,
      correction: R`<p>$\chi = X^2 - 2\cos\theta\,X + 1$, de discriminant $4\cos^2\theta - 4 = -4\sin^2\theta$.</p>
        <p>Si $\theta \notin \pi\Z$, $\Delta < 0$ : pas de valeur propre réelle, <strong>non diagonalisable sur $\R$</strong>. Sur $\C$, les racines $e^{i\theta}$ et $e^{-i\theta}$ sont distinctes : diagonalisable, avec les vecteurs propres $(1, -i)$ pour $e^{i\theta}$ et $(1, i)$ pour $e^{-i\theta}$ (vérification : $R_\theta(1, -i)^T = (\cos\theta + i\sin\theta,\ \sin\theta - i\cos\theta)^T = e^{i\theta}(1, -i)^T$).</p>
        <p>Si $\theta \in \pi\Z$, $R_\theta = \pm I_2$ est déjà diagonale.</p>`
    },
    {
      id: 'puissances', title: 'Puissances d’une matrice', diff: 2, gen: 'sys2',
      enonce: R`<p>Soit $A = \begin{pmatrix} 1 & 2 \\ 2 & 1 \end{pmatrix}$. Diagonaliser $A$, puis calculer $A^n$ pour $n \in \N$.</p>`,
      correction: R`<p>$\chi_A = X^2 - 2X - 3 = (X - 3)(X + 1)$ ; $E_3 = \Vect\big((1, 1)\big)$, $E_{-1} = \Vect\big((1, -1)\big)$. Avec $P = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$, $P^{-1} = \frac12\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$ et $D = \mathrm{diag}(3, -1)$ :</p>
        $$A^n = PD^nP^{-1} = \frac12\begin{pmatrix} 3^n + (-1)^n & 3^n - (-1)^n \\ 3^n - (-1)^n & 3^n + (-1)^n \end{pmatrix}.$$
        <p>Contrôle : $n = 1$ donne $\frac12\begin{pmatrix} 2 & 4 \\ 4 & 2 \end{pmatrix} = A$ ✓.</p>`,
      similaires: [
        {
          title: 'Suites couplées',
          enonce: R`<p>On pose $u_0 = 3$, $v_0 = 2$ et $u_{n+1} = 4u_n - 2v_n$, $v_{n+1} = u_n + v_n$. Exprimer $u_n$ et $v_n$ en fonction de $n$.</p>`,
          correction: R`<p>$X_{n+1} = AX_n$ avec $A = \begin{pmatrix} 4 & -2 \\ 1 & 1 \end{pmatrix}$, $\chi_A = (X - 2)(X - 3)$, $w_1 = (1, 1)$ pour $2$, $w_2 = (2, 1)$ pour $3$. $X_0 = (3, 2) = w_1 + w_2$, donc $X_n = 2^nw_1 + 3^nw_2$ :</p>
            $$u_n = 2^n + 2\cdot3^n, \qquad v_n = 2^n + 3^n.$$`
        }
      ]
    },
    {
      id: 'fibonacci', title: 'Suite de Fibonacci', diff: 2, gen: 'rec2',
      enonce: R`<p>Soit $F_0 = 0$, $F_1 = 1$ et $F_{n+2} = F_{n+1} + F_n$.</p>
        <ol><li>Écrire $X_{n+1} = AX_n$ avec $X_n = (F_n, F_{n+1})^T$ et montrer que $A$ est diagonalisable.</li><li>En déduire une expression de $F_n$ en fonction de $n$.</li></ol>`,
      correction: R`<p>1. $A = \begin{pmatrix} 0 & 1 \\ 1 & 1 \end{pmatrix}$, $\chi_A = X^2 - X - 1$, de racines distinctes $\varphi = \frac{1 + \sqrt5}{2}$ et $\psi = \frac{1 - \sqrt5}{2}$ : $A$ est diagonalisable.</p>
        <p>2. Donc $F_n = \lambda\varphi^n + \mu\psi^n$. $n = 0$ : $\lambda + \mu = 0$ ; $n = 1$ : $\lambda(\varphi - \psi) = 1$, avec $\varphi - \psi = \sqrt5$. D'où</p>
        $$F_n = \frac{1}{\sqrt5}\left(\left(\frac{1 + \sqrt5}{2}\right)^n - \left(\frac{1 - \sqrt5}{2}\right)^n\right).$$`,
      similaires: [
        {
          title: 'Racine double',
          enonce: R`<p>Déterminer la suite définie par $u_0 = 1$, $u_1 = 4$ et $u_{n+2} = 4u_{n+1} - 4u_n$. La matrice $A$ associée est-elle diagonalisable ?</p>`,
          correction: R`<p>$A = \begin{pmatrix} 0 & 1 \\ -4 & 4 \end{pmatrix}$, $\chi_A = X^2 - 4X + 4 = (X - 2)^2$ ; $A - 2I_2 \neq 0$ donc $A$ <strong>n'est pas diagonalisable</strong>. Racine double : $u_n = (\lambda + \mu n)2^n$, avec $\lambda = 1$ et $2(1 + \mu) = 4$, soit $\mu = 1$ : $u_n = (n + 1)2^n$.</p>`
        }
      ]
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiches méthodes                                                     */
  /* ------------------------------------------------------------------ */
  const methodes = [
    {
      title: 'Calculer un déterminant', gen: 'det3',
      cas: R`Un déterminant $3 \times 3$ (ou plus), éventuellement avec un paramètre`,
      debut: R`<b>Faire apparaître des zéros</b> ($L_i \leftarrow L_i - \lambda L_j$), mettre un facteur en évidence, puis <b>développer</b> selon la ligne/colonne la plus creuse.`,
      etapes: [
        R`Repérer une ligne ou une colonne avec des zéros, ou des lignes qui se ressemblent.`,
        R`Opérations qui ne changent pas le déterminant : ajouter à une ligne une combinaison des autres. Échanger deux lignes change le signe.`,
        R`Développer selon la ligne/colonne choisie, avec les signes $(-1)^{i+j}$.`,
        R`Contrôler avec Sarrus en taille 3.`
      ],
      exemple: {
        enonce: R`<p>$\begin{vmatrix} 1 & 2 & 3 \\ 2 & 4 & 7 \\ 1 & 3 & 5 \end{vmatrix}$.</p>`,
        solution: R`<p>$L_2 \leftarrow L_2 - 2L_1$, $L_3 \leftarrow L_3 - L_1$ : $\begin{vmatrix} 1 & 2 & 3 \\ 0 & 0 & 1 \\ 0 & 1 & 2 \end{vmatrix} = 1 \times \begin{vmatrix} 0 & 1 \\ 1 & 2 \end{vmatrix} = -1$.</p>`
      },
      pieges: [R`Oublier les signes $(-1)^{i+j}$.`, R`Faire $L_i \leftarrow 2L_i - L_j$ : cela multiplie le déterminant par $2$.`]
    },
    {
      title: 'Trouver les valeurs propres d’une matrice donnée', gen: 'spectre3',
      cas: R`Matrice explicite : on veut $\Sp(A)$`, debut: R`$n = 2$ : écrire $X^2 - \tr(A)X + \det A$. Sinon, dans $\det(XI_n - A)$, <b>faire des opérations sur lignes/colonnes</b> pour factoriser <b>avant</b> de développer.`,
      etapes: [
        R`Si $n = 2$ : écrire directement $\chi_A = X^2 - \tr(A)X + \det(A)$.`,
        R`Sinon calculer $\det(XI_n - A)$ en <strong>faisant apparaître des zéros ou un facteur commun avant de développer</strong> : $C_1 \leftarrow C_1 + C_2 + \dots$ si les sommes de lignes sont constantes, $L_i \leftarrow L_i - L_j$ si deux lignes se ressemblent… Ou, en taille 3, $\chi_A = X^3 - \tr(A)X^2 + s_2X - \det A$.`,
        R`Si on a développé : chercher une racine évidente parmi les diviseurs du terme constant $(-1)^n\det A$, puis factoriser.`,
        R`Contrôler : la somme des valeurs propres (avec multiplicité) vaut $\tr A$, leur produit vaut $\det A$.`
      ],
      exemple: {
        enonce: R`<p>Valeurs propres de $A = \begin{pmatrix} 3 & 1 & 1 \\ 1 & 3 & 1 \\ 1 & 1 & 3\end{pmatrix}$.</p>`,
        solution: R`<p>Chaque ligne a pour somme $5$. Dans $\det(XI_3 - A)$, $C_1 \leftarrow C_1 + C_2 + C_3$ fait apparaître le facteur $X - 5$ :</p>
          $$\chi_A = (X - 5)\begin{vmatrix} 1 & -1 & -1 \\ 1 & X-3 & -1 \\ 1 & -1 & X-3\end{vmatrix} \underset{L_2 - L_1,\ L_3 - L_1}{=} (X-5)\begin{vmatrix} 1 & -1 & -1 \\ 0 & X-2 & 0 \\ 0 & 0 & X-2\end{vmatrix} = (X-5)(X-2)^2.$$
          <p>Contrôle : $5 + 2 + 2 = 9 = \tr A$ ✓.</p>`
      },
      pieges: [
        R`Développer brutalement puis tomber sur un polynôme de degré 3 sans racine évidente : factoriser <em>pendant</em> le calcul.`,
        R`Oublier le signe $(-1)^n$ si l'on utilise la convention $\det(A - XI_n)$.`,
        R`Oublier de préciser le corps : $\Sp_\R(A)$ et $\Sp_\C(A)$ peuvent différer.`
      ]
    },
    {
      title: 'Déterminer un sous-espace propre', gen: 'spectre2',
      cas: R`On connaît $\lambda$, on veut une base de $E_\lambda(A)$`, debut: R`<b>Échelonner $A - \lambda I_n$</b> : $\dim E_\lambda = n - \rg(A - \lambda I_n)$.`,
      etapes: [
        R`Écrire $A - \lambda I_n$ et l'échelonner (pivot de Gauss).`,
        R`Lire le rang $r$ : $\dim E_\lambda(A) = n - r$ (théorème du rang).`,
        R`Exprimer les inconnues principales en fonction des inconnues libres et en déduire une base.`,
        R`Contrôle : $1 \le \dim E_\lambda \le m(\lambda)$. Si on trouve $\{0\}$, il y a une erreur (soit sur $\lambda$, soit dans le calcul).`
      ],
      exemple: {
        enonce: R`<p>Avec $A = \begin{pmatrix} 3 & 1 & 1 \\ 1 & 3 & 1 \\ 1 & 1 & 3\end{pmatrix}$, déterminer $E_2(A)$ et $E_5(A)$.</p>`,
        solution: R`<p>$A - 2I_3$ a toutes ses lignes égales à $(1\ 1\ 1)$ : rang $1$, donc $\dim E_2 = 2$ et $E_2(A) = \{x + y + z = 0\} = \Vect\big((1,-1,0),(1,0,-1)\big)$.</p>
          <p>$A - 5I_3 = \begin{pmatrix} -2 & 1 & 1 \\ 1 & -2 & 1 \\ 1 & 1 & -2\end{pmatrix}$, de rang $2$ ; $(1,1,1)$ est dans le noyau (sommes de lignes nulles), donc $E_5(A) = \Vect\big((1,1,1)\big)$.</p>`
      },
      pieges: [R`Confondre $E_\lambda(A)$ (sous-espace de $\K^n$) et l'image de $A - \lambda I_n$.`, R`Donner un vecteur nul dans une « base ».`]
    },
    {
      title: 'Diagonaliser une matrice', gen: 'diag3',
      cas: R`On demande de diagonaliser $A$ (trouver $P$ et $D$)`,
      debut: R`$\chi_A$ factorisé, puis une <b>base de chaque $E_\lambda$</b> ; <b>$P$ = vecteurs propres en colonnes</b>, $D$ = valeurs propres <b>dans le même ordre</b>.`,
      etapes: [
        R`Factoriser $\chi_A$ : valeurs propres et multiplicités.`,
        R`Pour chaque valeur propre, base de $E_\lambda(A)$.`,
        R`Vérifier $\dim E_\lambda = m(\lambda)$ pour tout $\lambda$ (automatique pour les valeurs propres simples).`,
        R`Écrire $P$ et $D$ ; contrôler $AP = PD$ (pas besoin de $P^{-1}$, sauf si on la demande, par exemple pour $A^n$).`
      ],
      exemple: {
        enonce: R`<p>Diagonaliser $A = \begin{pmatrix} 1 & 2 \\ 2 & 1 \end{pmatrix}$.</p>`,
        solution: R`<p>$\chi_A = (X - 3)(X + 1)$, $E_3 = \Vect\big((1, 1)\big)$, $E_{-1} = \Vect\big((1, -1)\big)$ : $P = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$, $D = \mathrm{diag}(3, -1)$.</p>`
      },
      pieges: [R`Ranger les valeurs propres dans $D$ dans un ordre différent des colonnes de $P$.`, R`Conclure « diagonalisable » sans vérifier les dimensions quand une valeur propre est multiple.`]
    },
    {
      title: 'Montrer qu’une matrice n’est pas diagonalisable', gen: 'diagornot',
      cas: R`Une valeur propre multiple, ou un $\chi_A$ non scindé`,
      debut: R`Trouver une valeur propre avec <b>$\dim E_\lambda \lt m(\lambda)$</b> (calcul du rang), ou montrer que <b>$\chi_A$ n'est pas scindé</b> sur $\K$.`,
      etapes: [
        R`Si $\chi_A$ n'a pas toutes ses racines dans $\K$ : non diagonalisable sur $\K$.`,
        R`Pour chaque valeur propre multiple, calculer $\rg(A - \lambda I_n)$ et $\dim E_\lambda = n - \rg$.`,
        R`Si une dimension est strictement inférieure à la multiplicité : non diagonalisable.`,
        R`Raccourci : si $\Sp(A) = \{\lambda\}$ et $A \neq \lambda I_n$, $A$ n'est pas diagonalisable.`
      ],
      exemple: {
        enonce: R`<p>$A = \begin{pmatrix} 2 & 1 \\ -1 & 4 \end{pmatrix}$.</p>`,
        solution: R`<p>$\chi_A = X^2 - 6X + 9 = (X - 3)^2$ et $A \neq 3I_2$ : non diagonalisable ($\dim E_3 = 1$).</p>`
      },
      pieges: [R`Croire qu'une valeur propre double empêche toujours la diagonalisation : $I_n$ est diagonale.`]
    },
    {
      title: 'Puissances et suites récurrentes couplées', gen: 'sys2',
      cas: R`On veut $A^n$, ou des suites définies par $X_{n+1} = AX_n$`,
      debut: R`<b>Diagonaliser $A$</b>, puis $A^n = PD^nP^{-1}$ ; ou <b>décomposer $X_0$ sur les vecteurs propres</b> : $X_n = \sum c_i\lambda_i^nw_i$.`,
      etapes: [
        R`Écrire le système sous la forme $X_{n+1} = AX_n$, donc $X_n = A^nX_0$.`,
        R`Diagonaliser $A$ : valeurs propres $\lambda_i$, vecteurs propres $w_i$.`,
        R`Pour $A^n$ : calculer $P^{-1}$ et le produit $PD^nP^{-1}$.`,
        R`Pour $X_n$ seulement : écrire $X_0 = \sum c_iw_i$ (petit système), puis $X_n = \sum c_i\lambda_i^nw_i$.`,
        R`Contrôler avec $n = 0$ et $n = 1$.`
      ],
      exemple: {
        enonce: R`<p>$u_{n+1} = 2u_n + v_n$, $v_{n+1} = u_n + 2v_n$, $u_0 = 1$, $v_0 = 0$.</p>`,
        solution: R`<p>$A = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}$ : valeurs propres $3$ ($w_1 = (1, 1)$) et $1$ ($w_2 = (1, -1)$). $X_0 = \frac12w_1 + \frac12w_2$, donc $u_n = \frac{3^n + 1}{2}$ et $v_n = \frac{3^n - 1}{2}$.</p>`
      },
      pieges: [R`Écrire $A^n = P^nD^nP^{-n}$.`, R`Oublier de vérifier que $A$ est diagonalisable.`]
    },
    {
      title: 'Suite récurrente linéaire d’ordre 2', gen: 'rec2',
      cas: R`$u_{n+2} = au_{n+1} + bu_n$ avec $u_0$, $u_1$ donnés`,
      debut: R`Résoudre l'<b>équation caractéristique $r^2 = ar + b$</b> : racines distinctes → $\lambda r_1^n + \mu r_2^n$ ; racine double → $(\lambda + \mu n)r^n$.`,
      etapes: [
        R`Écrire l'équation caractéristique $r^2 - ar - b = 0$ (c'est $\chi_A$ pour $A = \begin{pmatrix} 0 & 1 \\ b & a \end{pmatrix}$).`,
        R`Selon ses racines, écrire la forme générale de $u_n$.`,
        R`Déterminer $\lambda$ et $\mu$ avec $u_0$ et $u_1$.`,
        R`Contrôler sur $u_2$.`
      ],
      exemple: {
        enonce: R`<p>$u_0 = 2$, $u_1 = 1$, $u_{n+2} = u_{n+1} + 2u_n$.</p>`,
        solution: R`<p>$r^2 = r + 2$ : $r = 2$ ou $r = -1$. $u_n = \lambda 2^n + \mu(-1)^n$, avec $\lambda + \mu = 2$ et $2\lambda - \mu = 1$ : $\lambda = 1$, $\mu = 1$. Donc $u_n = 2^n + (-1)^n$ ; contrôle $u_2 = 1 + 4 = 5 = 4 + 1$ ✓.</p>`
      },
      pieges: [R`Écrire l'équation caractéristique avec les mauvais signes : $r^2 - ar - b = 0$.`, R`Utiliser $\lambda r_1^n + \mu r_2^n$ quand la racine est double.`]
    },
    {
      title: 'Montrer qu’un scalaire est valeur propre sans calculer χ', gen: 'testvec',
      cas: R`Vérifier qu'un $\lambda$ est valeur propre, ou trouver une valeur propre « évidente »`, debut: R`<b>Chercher un vecteur</b> $X \neq 0$ avec $AX = \lambda X$ (sommes de lignes égales à $s$ ⇒ $X = (1, \dots, 1)$), ou montrer $\rg(A - \lambda I_n) < n$.`,
      etapes: [
        R`Exhiber un vecteur $X \neq 0$ avec $AX = \lambda X$ (ex. : sommes de lignes constantes égales à $s$ $\Rightarrow$ $A(1,\dots,1)^T = s(1,\dots,1)^T$).`,
        R`Ou montrer que $\rg(A - \lambda I_n) < n$ : deux lignes ou deux colonnes proportionnelles, une ligne nulle…`,
        R`Ou calculer $\det(A - \lambda I_n) = 0$.`
      ],
      exemple: {
        enonce: R`<p>Montrer que $0 \in \Sp(A)$ pour $A = \begin{pmatrix} 1 & 2 & 3 \\ 2 & 4 & 6 \\ 1 & 1 & 1\end{pmatrix}$ et trouver $E_0(A)$.</p>`,
        solution: R`<p>$L_2 = 2L_1$ donc $\rg A \le 2 < 3$ : $A$ n'est pas inversible, $0 \in \Sp(A)$. $E_0(A) = \Ker A$ : $x + 2y + 3z = 0$ et $x + y + z = 0$ ; par différence $y + 2z = 0$, d'où $y = -2z$, $x = z$ : $E_0(A) = \Vect\big((1,-2,1)\big)$.</p>`
      }
    },
    {
      title: 'Endomorphisme vérifiant une relation polynomiale',
      cas: R`Une relation $P(u) = 0$ ($u^2 = u$, $u^p = 0$…), pas de matrice`, debut: R`Prendre $u(x) = \lambda x$ avec $x \neq 0$ et <b>appliquer la relation à $x$</b> : $P(\lambda)\,x = 0$.`,
      etapes: [
        R`Prendre $\lambda \in \Sp(u)$ et $x \neq 0$ tel que $u(x) = \lambda x$.`,
        R`Montrer par récurrence $u^k(x) = \lambda^k x$, donc $P(u)(x) = P(\lambda)x$.`,
        R`Si $P(u) = 0$ : $P(\lambda)x = 0$ et $x \neq 0$, donc $P(\lambda) = 0$. Conclure $\Sp(u) \subset \{\text{racines de } P\}$.`,
        R`Pour l'inclusion réciproque, il faut un argument supplémentaire (exhiber un vecteur propre).`
      ],
      exemple: {
        enonce: R`<p>Soit $u$ tel que $u^2 - 3u + 2\Id_E = 0$. Que peut-on dire de $\Sp(u)$ ?</p>`,
        solution: R`<p>Si $u(x) = \lambda x$, $x \neq 0$ : $0 = (u^2 - 3u + 2\Id)(x) = (\lambda^2 - 3\lambda + 2)x$, donc $\lambda^2 - 3\lambda + 2 = (\lambda - 1)(\lambda - 2) = 0$. Ainsi $\Sp(u) \subset \{1, 2\}$. L'inclusion peut être stricte : $u = \Id_E$ vérifie la relation et $\Sp(\Id_E) = \{1\}$.</p>`
      },
      pieges: [R`Conclure $\Sp(u) = \{\text{racines de } P\}$ : faux en général.`]
    },
    {
      title: 'Endomorphisme d’un espace de polynômes ou de fonctions',
      cas: R`$u$ agit sur des polynômes ($P \mapsto P'$, $XP'$…) ou des fonctions`, debut: R`<b>Calculer $u(X^k)$</b> : si la matrice est triangulaire, lire la diagonale ; sinon raisonner sur le <b>degré</b>.`,
      etapes: [
        R`Écrire l'équation $u(P) = \lambda P$ et raisonner sur le <strong>degré</strong> ou le <strong>coefficient dominant</strong>.`,
        R`En dimension finie, calculer l'image des vecteurs de la base canonique : si la matrice est triangulaire, les valeurs propres se lisent sur la diagonale.`,
        R`Pour des fonctions, $u(f) = \lambda f$ devient souvent une équation différentielle à résoudre.`
      ],
      exemple: {
        enonce: R`<p>Valeurs propres de $u : P \mapsto (X+1)P'$ sur $\R_2[X]$. Est-il diagonalisable ?</p>`,
        solution: R`<p>$u(1) = 0$, $u(X) = X + 1$, $u(X^2) = 2X^2 + 2X$. Matrice dans $(1, X, X^2)$ : $\begin{pmatrix} 0 & 1 & 0 \\ 0 & 1 & 2 \\ 0 & 0 & 2\end{pmatrix}$, triangulaire : $\Sp(u) = \{0, 1, 2\}$, trois valeurs propres distinctes en dimension 3 : diagonalisable (vecteurs propres $1$, $X+1$, $(X+1)^2$).</p>`
      }
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche méthode, partie 1 : plan de travail ; partie 2 : cas à reconnaître */
  /* ------------------------------------------------------------------ */
  const plan = {
    etapes: [
      { titre: 'Identifier l’objet', faire: R`Matrice <b>explicite</b> → calcul direct. Endomorphisme <b>abstrait</b> (relation, polynômes, fonctions) → revenir à la <b>définition</b> $u(x) = \lambda x$ avec $x \neq 0$.`,
        questions: [R`Ai-je une matrice ? Dans quel espace travaille-t-on ?`, R`Sur quel corps : $\R$ ou $\C$ ?`] },
      { titre: 'Trouver les valeurs propres', faire: R`Calculer $\chi_A = \det(XI_n - A)$ et le <b>factoriser</b> (déterminant : opérations sur les lignes, développement), ou résoudre $u(x) = \lambda x$.`,
        questions: [R`Dimension 2 ? → $X^2 - \tr(A)X + \det A$.`, R`Une valeur propre « évidente » ?`] },
      { titre: 'Trouver les sous-espaces propres', faire: R`Pour chaque $\lambda$ : résoudre $(A - \lambda I_n)X = 0$ par <b>échelonnement</b> ; $\dim E_\lambda = n - \rg(A - \lambda I_n)$.` },
      { titre: 'Conclure sur la diagonalisation', faire: R`<b>$\chi$ scindé et $\dim E_\lambda = m(\lambda)$</b> pour tout $\lambda$ ; $n$ valeurs propres distinctes suffit. Écrire $P$ et $D$.` },
      { titre: 'Exploiter', faire: R`<b>$A^n = PD^nP^{-1}$</b>, systèmes $X_{n+1} = AX_n$, suites d'ordre 2 par l'<b>équation caractéristique</b>.` },
      { titre: 'Vérifier', faire: R`<b>$\sum m_k\lambda_k = \tr A$</b>, $\prod \lambda_k^{m_k} = \det A$, $AX = \lambda X$ sur un vecteur trouvé, $AP = PD$, premiers termes d'une suite.` }
    ]
  };
  const reperes = [
    { etape: 1, si: R`Une relation $P(u) = 0$ : $u^2 = u$, $u^p = 0$, $u^3 = u$…`, alors: R`Prendre un vecteur propre $x$ et <b>appliquer la relation à $x$</b> : $P(\lambda)\,x = 0$ donc $P(\lambda) = 0$.`, ex: R`$u^2 = u$ ⇒ $\lambda^2 = \lambda$ ⇒ $\Sp(u) \subset \{0, 1\}$.` },
    { etape: 1, si: R`Un espace de polynômes $\K_n[X]$`, alors: R`Calculer les images de la <b>base canonique</b> $u(X^k)$ et écrire la matrice ; ou comparer les <b>degrés</b> dans $u(P) = \lambda P$.`, ex: R`$P \mapsto XP'$ : $u(X^k) = kX^k$, matrice diagonale, $\Sp = \{0, \dots, n\}$.` },
    { etape: 1, si: R`Une matrice réelle et une question sur $\C$`, alors: R`Les valeurs propres non réelles viennent par <b>paires conjuguées</b> $\lambda, \bar\lambda$, avec des vecteurs propres conjugués.`, ex: R`$\begin{pmatrix}0&-1\\1&0\end{pmatrix}$ : $\Sp_\C = \{i, -i\}$, $\Sp_\R = \varnothing$.` },
    { etape: 2, si: R`Un déterminant avec des lignes qui se ressemblent`, alors: R`<b>$L_i \leftarrow L_i - L_j$</b> avant de développer ; factoriser au fur et à mesure.` },
    { etape: 2, si: R`Des sommes de lignes toutes égales à $s$`, alors: R`$s$ est valeur propre de vecteur $(1, \dots, 1)$ ; dans $\det(XI - A)$, faire <b>$C_1 \leftarrow C_1 + C_2 + \dots + C_n$</b> pour factoriser $X - s$.` },
    { etape: 2, si: R`Deux lignes (ou deux colonnes) proportionnelles`, alors: R`$\rg A < n$, donc <b>$0$ est valeur propre</b> ($\det A = 0$).` },
    { etape: 2, si: R`Une matrice triangulaire (ou triangulaire par blocs)`, alors: R`Les valeurs propres se lisent sur la <b>diagonale</b> (ou sont celles des blocs diagonaux).` },
    { etape: 2, si: R`Un polynôme caractéristique de degré 3 déjà développé`, alors: R`Chercher une <b>racine évidente</b> parmi les diviseurs du terme constant, puis factoriser par $X - \lambda$.` },
    { etape: 3, si: R`$A - \lambda I_n$ de rang $1$ (lignes proportionnelles)`, alors: R`<b>Une seule équation</b> : $\dim E_\lambda = n - 1$.` },
    { etape: 3, si: R`On trouve $E_\lambda = \{0\}$`, alors: R`C'est une <b>erreur</b> : $\lambda$ n'est pas valeur propre ou le calcul est faux. Revérifier $\chi(\lambda) = 0$.` },
    { etape: 4, si: R`$n$ valeurs propres <b>distinctes</b>`, alors: R`<b>Diagonalisable</b> sans autre calcul, sous-espaces propres de dimension 1.` },
    { etape: 4, si: R`Une valeur propre <b>multiple</b>`, alors: R`Calculer <b>$\rg(A - \lambda I_n)$</b> : diagonalisable ssi $n - \rg = m(\lambda)$.`, ex: R`$\begin{pmatrix}1&1\\0&1\end{pmatrix}$ : rang 1, $\dim E_1 = 1 \lt 2$.` },
    { etape: 4, si: R`Une seule valeur propre $\lambda$`, alors: R`Diagonalisable <b>ssi $A = \lambda I_n$</b>.` },
    { etape: 4, si: R`$\chi_A$ sans racine réelle (discriminant négatif…)`, alors: R`Non diagonalisable <b>sur $\R$</b> ; regarder sur $\C$.` },
    { etape: 5, si: R`On demande $A^n$`, alors: R`Diagonaliser puis <b>$A^n = PD^nP^{-1}$</b>.` },
    { etape: 5, si: R`Deux suites définies l'une par l'autre`, alors: R`Poser <b>$X_n = (u_n, v_n)^T$</b>, $X_{n+1} = AX_n$, et décomposer $X_0$ sur les vecteurs propres.` },
    { etape: 5, si: R`$u_{n+2} = au_{n+1} + bu_n$`, alors: R`<b>Équation caractéristique $r^2 = ar + b$</b>.`, ex: R`Fibonacci : $r^2 = r + 1$.` },
    { etape: 6, si: R`Un doute sur le résultat`, alors: R`Calculer $AX$ pour un vecteur trouvé (on doit obtenir $\lambda X$) et vérifier <b>$\sum \lambda_i = \tr A$</b>.` }
  ];

  /* ------------------------------------------------------------------ */
  /* Corrections détaillées (bouton « Correction détaillée »)            */
  /* ------------------------------------------------------------------ */
  const details = {
    'det-calc': {
      but: R`<p>Calculer $\det A$ et $\tr A$, puis conclure sur l'inversibilité.</p>`,
      methode: R`<p>Développer selon la ligne qui contient un zéro ; contrôler par Sarrus.</p>`,
      etapes: [
        R`<b>Choix de la ligne.</b> La 2<sup>e</sup> ligne $(0, -1, 4)$ contient un zéro ; ses signes sont $-, +, -$.`,
        R`<b>Développement.</b> $\det A = -0 \cdot \Delta_{21} + (-1)\begin{vmatrix} 2 & 3 \\ 1 & 2 \end{vmatrix} - 4\begin{vmatrix} 2 & 1 \\ 1 & 0 \end{vmatrix}$.`,
        R`<b>Mineurs.</b> $\begin{vmatrix} 2 & 3 \\ 1 & 2 \end{vmatrix} = 4 - 3 = 1$ et $\begin{vmatrix} 2 & 1 \\ 1 & 0 \end{vmatrix} = 0 - 1 = -1$.`,
        R`<b>Résultat.</b> $\det A = -1 + 4 = 3$.`,
        R`<b>Contrôle (Sarrus).</b> $(2 \cdot (-1) \cdot 2 + 1 \cdot 4 \cdot 1 + 3 \cdot 0 \cdot 0) - (3 \cdot (-1) \cdot 1 + 2 \cdot 4 \cdot 0 + 1 \cdot 0 \cdot 2) = 0 - (-3) = 3$ ✓.`,
        R`<b>Trace et conclusion.</b> $\tr A = 3$ ; $\det A \neq 0$ donc $A$ est inversible.`
      ],
      retenir: R`<p>Toujours développer selon la ligne ou la colonne la plus creuse.</p>`
    },
    'det-calc#1': {
      but: R`<p>Déterminant d'une matrice à paramètre et valeurs de $a$ où elle est inversible.</p>`,
      methode: R`<p>Faire apparaître une matrice triangulaire par opérations sur les lignes.</p>`,
      etapes: [
        R`<b>Opérations.</b> $L_2 \leftarrow L_2 - L_1$ : $(0, a - 1, 0)$ ; $L_3 \leftarrow L_3 - L_1$ : $(0, 0, a - 1)$.`,
        R`<b>Matrice triangulaire.</b> Le déterminant est le produit de la diagonale : $1 \times (a - 1) \times (a - 1)$.`,
        R`<b>Inversibilité.</b> $(a - 1)^2 \neq 0 \iff a \neq 1$.`
      ],
      retenir: R`<p>Avec un paramètre, garder le déterminant <strong>factorisé</strong>.</p>`
    },
    trace: {
      but: R`<p>Établir $\tr(AB) = \tr(BA)$ et l'utiliser.</p>`,
      methode: R`<p>Écrire la trace avec une double somme et échanger les sommes.</p>`,
      etapes: [
        R`<b>Coefficients diagonaux.</b> $(AB)_{ii} = \sum_k a_{ik}b_{ki}$, donc $\tr(AB) = \sum_i\sum_k a_{ik}b_{ki}$.`,
        R`<b>Échange des sommes.</b> $\sum_k\sum_i b_{ki}a_{ik} = \sum_k (BA)_{kk} = \tr(BA)$.`,
        R`<b>Commutateur.</b> $\tr(AB - BA) = 0 \neq n = \tr I_n$ : impossible.`,
        R`<b>Matrices semblables.</b> $\tr(P^{-1}AP) = \tr(APP^{-1}) = \tr A$ ; ici $1 + 3 = 4 \neq 5 = 2 + 3$ : pas semblables.`
      ],
      retenir: R`<p>La trace est un invariant de similitude, comme le déterminant et le polynôme caractéristique.</p>`
    },
    'trace#1': {
      but: R`<p>Montrer $\tr p = \rg p$ pour un projecteur.</p>`,
      methode: R`<p>Calculer la trace dans une base adaptée à $E = \Imm p \oplus \Ker p$.</p>`,
      etapes: [
        R`<b>Base adaptée.</b> Une base de $\Imm p$ (vecteurs fixes) puis une base de $\Ker p$ (vecteurs envoyés sur $0$).`,
        R`<b>Matrice.</b> $\mathrm{diag}(1, \dots, 1, 0, \dots, 0)$ avec $\dim\Imm p = \rg p$ coefficients égaux à $1$.`,
        R`<b>Trace.</b> Elle vaut $\rg p$, et elle ne dépend pas de la base.`,
        R`<b>Application.</b> $\tr M = 2 + (-1) = 1$ donc $\rg M = 1$ (en effet, les lignes de $M$ sont proportionnelles).`
      ],
      retenir: R`<p>Projecteur : trace = rang.</p>`
    },
    mat2: {
      but: R`<p>Trouver le polynôme caractéristique, les valeurs propres et une base de chaque sous-espace propre de $A = \begin{pmatrix} 4 & -2 \\ 1 & 1 \end{pmatrix}$.</p>`,
      methode: R`<p>En taille 2 : $\chi_A(X) = X^2 - \tr(A)X + \det(A)$. Les valeurs propres sont ses racines ; $E_\lambda(A) = \Ker(A - \lambda I_2)$ s'obtient en résolvant un système (une seule équation utile).</p>`,
      etapes: [
        R`<b>Trace et déterminant.</b> $\tr A = 4 + 1 = 5$ (somme de la diagonale) ; $\det A = 4 \times 1 - (-2) \times 1 = 6$.`,
        R`<b>Polynôme caractéristique.</b> $\chi_A(X) = X^2 - 5X + 6$. Ses racines ont pour somme 5 et pour produit 6 : ce sont 2 et 3. Donc $\chi_A = (X - 2)(X - 3)$ et $\Sp(A) = \{2, 3\}$.`,
        R`<b>$E_2(A)$.</b> $A - 2I_2 = \begin{pmatrix} 2 & -2 \\ 1 & -1 \end{pmatrix}$. Ses lignes sont proportionnelles (normal : $\det(A - 2I_2) = 0$), le système $(A - 2I_2)X = 0$ se réduit à $x - y = 0$. Les solutions sont $(y, y) = y(1, 1)$ : $E_2(A) = \Vect\big((1, 1)\big)$.`,
        R`<b>$E_3(A)$.</b> $A - 3I_2 = \begin{pmatrix} 1 & -2 \\ 1 & -2 \end{pmatrix}$ : équation $x - 2y = 0$, solutions $y(2, 1)$, donc $E_3(A) = \Vect\big((2, 1)\big)$.`,
        R`<b>Vérification.</b> $A\begin{pmatrix}1\\1\end{pmatrix} = \begin{pmatrix}2\\2\end{pmatrix}$ et $A\begin{pmatrix}2\\1\end{pmatrix} = \begin{pmatrix}6\\3\end{pmatrix} = 3\begin{pmatrix}2\\1\end{pmatrix}$ ✓.`
      ],
      retenir: R`<p>Toujours vérifier un vecteur propre en calculant $Av$ : c'est rapide et ça évite les erreurs de signe.</p>`
    },
    mat3: {
      but: R`<p>Calculer $\chi_A$, le spectre et les sous-espaces propres d'une matrice $3 \times 3$.</p>`,
      methode: R`<p>$\chi_A(X) = X^3 - \tr(A)X^2 + s_2X - \det(A)$, où $s_2$ est la somme des mineurs principaux d'ordre 2. Puis, pour chaque valeur propre, résoudre $(A - \lambda I_3)X = 0$.</p>`,
      etapes: [
        R`<b>Trace.</b> $\tr A = 2 + (-4) + 5 = 3$.`,
        R`<b>Déterminant</b> (développement selon la 1<sup>re</sup> ligne) : $2\begin{vmatrix} -4 & 12 \\ -2 & 5 \end{vmatrix} - 0 + 4\begin{vmatrix} 3 & -4 \\ 1 & -2 \end{vmatrix} = 2 \times 4 + 4 \times (-2) = 0$. Donc $0$ est valeur propre.`,
        R`<b>Mineurs principaux</b> (on barre la ligne et la colonne $k$) : $\begin{vmatrix} 2 & 0 \\ 3 & -4\end{vmatrix} = -8$, $\begin{vmatrix} 2 & 4 \\ 1 & 5\end{vmatrix} = 6$, $\begin{vmatrix} -4 & 12 \\ -2 & 5\end{vmatrix} = 4$ ; $s_2 = 2$.`,
        R`<b>Polynôme.</b> $\chi_A = X^3 - 3X^2 + 2X = X(X^2 - 3X + 2) = X(X - 1)(X - 2)$ : $\Sp(A) = \{0, 1, 2\}$, trois valeurs propres simples.`,
        R`<b>$E_0(A) = \Ker A$.</b> Ligne 1 : $2x + 4z = 0$, donc $x = -2z$. Ligne 3 : $x - 2y + 5z = 0$, donc $-2y + 3z = 0$, $y = \frac32z$. Avec $z = 2$ : $(-4, 3, 2)$. Contrôle ligne 2 : $3(-4) - 4 \times 3 + 12 \times 2 = 0$ ✓.`,
        R`<b>$E_1(A)$.</b> $A - I_3 = \begin{pmatrix} 1 & 0 & 4 \\ 3 & -5 & 12 \\ 1 & -2 & 4 \end{pmatrix}$. Ligne 1 : $x = -4z$ ; ligne 2 : $-12z - 5y + 12z = 0$, donc $y = 0$. Vecteur $(-4, 0, 1)$.`,
        R`<b>$E_2(A)$.</b> $A - 2I_3 = \begin{pmatrix} 0 & 0 & 4 \\ 3 & -6 & 12 \\ 1 & -2 & 3 \end{pmatrix}$. Ligne 1 : $z = 0$ ; ligne 3 : $x = 2y$. Vecteur $(2, 1, 0)$.`,
        R`<b>Cohérence.</b> Chaque valeur propre est simple, donc chaque sous-espace propre est une droite ($1 \le \dim E_\lambda \le m(\lambda) = 1$) ; trois valeurs propres distinctes : $A$ est diagonalisable.`
      ],
      retenir: R`<p>$\chi_A = X^3 - \tr(A)X^2 + s_2X - \det A$ évite de développer $\det(XI - A)$ ; si $\det A = 0$, $0$ est valeur propre.</p>`
    },
    param: {
      but: R`<p>Discuter, selon $a$, les valeurs propres de $A_a$, ses sous-espaces propres et sa diagonalisabilité.</p>`,
      methode: R`<p>Écrire $\chi_{A_a}$ sous forme canonique $(X - 1)^2 - a$ : le signe de $a$ décide du nombre de racines réelles.</p>`,
      etapes: [
        R`<b>Polynôme.</b> $\tr A_a = 2$, $\det A_a = 1 - a$ : $\chi = X^2 - 2X + 1 - a = (X - 1)^2 - a$.`,
        R`<b>Cas $a \gt 0$.</b> $(X-1)^2 = a \iff X = 1 \pm \sqrt a$ : deux valeurs propres réelles distinctes, donc diagonalisable. Pour $\lambda = 1 + \sqrt a$ : $A_a - \lambda I_2 = \begin{pmatrix} -\sqrt a & a \\ 1 & -\sqrt a \end{pmatrix}$, la 2<sup>e</sup> ligne donne $x = \sqrt a\,y$ : $E_{1+\sqrt a} = \Vect\big((\sqrt a, 1)\big)$. De même $E_{1-\sqrt a} = \Vect\big((-\sqrt a, 1)\big)$.`,
        R`<b>Cas $a = 0$.</b> $\chi = (X - 1)^2$, valeur propre double $1$. $A_0 - I_2 = \begin{pmatrix} 0 & 0 \\ 1 & 0 \end{pmatrix}$ donne $x = 0$ : $E_1 = \Vect\big((0, 1)\big)$, de dimension $1$ alors que la multiplicité est $2$ : non diagonalisable.`,
        R`<b>Cas $a \lt 0$ dans $\R$.</b> $(X - 1)^2 = a \lt 0$ est impossible : $\Sp_\R(A_a) = \varnothing$.`,
        R`<b>Cas $a \lt 0$ dans $\C$.</b> $X - 1 = \pm i\sqrt{-a}$, soit $\lambda = 1 \pm i\sqrt{-a}$, distinctes : diagonalisable sur $\C$. Pour $\lambda = 1 + i\sqrt{-a}$, la 2<sup>e</sup> ligne donne $x = i\sqrt{-a}\,y$ : $E_\lambda = \Vect\big((i\sqrt{-a}, 1)\big)$.`
      ],
      retenir: R`<p>Matrice à paramètre : mettre $\chi$ sous forme canonique et discuter le signe du discriminant.</p>`
    },
    'lignes-constantes': {
      but: R`<p>Montrer que la somme commune des lignes est valeur propre, et l'appliquer.</p>`,
      methode: R`<p>Tester le vecteur $U = (1, \dots, 1)$ : $AU$ contient les sommes des lignes.</p>`,
      etapes: [
        R`<b>Calcul de $AU$.</b> La $i$-ème coordonnée de $AU$ est $\sum_j a_{ij} \times 1 = s$.`,
        R`<b>Conclusion.</b> $AU = sU$ et $U \neq 0$ : $s \in \Sp(A)$ et $U$ est un vecteur propre associé.`,
        R`<b>Application.</b> $2 + 1 + 4 = 3 + 3 + 1 = 0 + 5 + 2 = 7$ : $7$ est valeur propre, de vecteur propre $(1, 1, 1)$.`
      ],
      retenir: R`<p>Sommes des lignes constantes ⟹ $(1, \dots, 1)$ vecteur propre ; sommes des colonnes constantes ⟹ valeur propre de $A^T$, donc de $A$.</p>`
    },
    projecteur: {
      but: R`<p>Montrer que les valeurs propres d'un projecteur sont 0 et 1, et identifier $E_1(p)$.</p>`,
      methode: R`<p>Appliquer la relation $p^2 = p$ à un <strong>vecteur propre</strong> : on obtient une équation polynomiale sur $\lambda$.</p>`,
      etapes: [
        R`<b>Vecteur propre.</b> Soit $\lambda \in \Sp(p)$ et $x \neq 0$ tel que $p(x) = \lambda x$.`,
        R`<b>Appliquer $p$ deux fois.</b> $p(p(x)) = p(\lambda x) = \lambda p(x) = \lambda^2x$ (linéarité). Mais $p \circ p = p$, donc $p(p(x)) = p(x) = \lambda x$.`,
        R`<b>Conclure.</b> $\lambda^2x = \lambda x$, soit $(\lambda^2 - \lambda)x = 0$ ; comme $x \neq 0$, $\lambda(\lambda - 1) = 0$ : $\lambda \in \{0, 1\}$.`,
        R`<b>$E_1(p) \subset \Imm p$.</b> Si $p(x) = x$, alors $x = p(x)$ est une image.`,
        R`<b>$\Imm p \subset E_1(p)$.</b> Si $y = p(x)$, alors $p(y) = p(p(x)) = p(x) = y$.`,
        R`<b>$1$ et $0$ sont atteints.</b> Si $p \neq 0$, $\Imm p \neq \{0\}$ contient un vecteur non nul invariant : $1 \in \Sp(p)$. Si $p \neq \Id$, il existe $x$ avec $y = x - p(x) \neq 0$, et $p(y) = p(x) - p(p(x)) = 0$ : $0 \in \Sp(p)$.`
      ],
      retenir: R`<p>Si $P(u) = 0$ pour un polynôme $P$, toute valeur propre $\lambda$ vérifie $P(\lambda) = 0$.</p>`
    },
    'projecteur#1': {
      but: R`<p>Spectre d'une symétrie, décomposition $E = E_1(s) \oplus E_{-1}(s)$, diagonalisabilité.</p>`,
      methode: R`<p>Relation $s^2 = \Id$ appliquée à un vecteur propre ; puis décomposition explicite de tout vecteur.</p>`,
      etapes: [
        R`<b>Valeurs propres.</b> Si $s(x) = \lambda x$, $x \neq 0$ : $x = s(s(x)) = \lambda^2x$, donc $\lambda^2 = 1$, $\lambda = \pm1$.`,
        R`<b>Partie paire.</b> $a = \frac{x + s(x)}2$ vérifie $s(a) = \frac{s(x) + s^2(x)}{2} = \frac{s(x) + x}{2} = a$ : $a \in E_1(s)$.`,
        R`<b>Partie impaire.</b> $b = \frac{x - s(x)}2$ vérifie $s(b) = \frac{s(x) - x}{2} = -b$ : $b \in E_{-1}(s)$.`,
        R`<b>Somme.</b> $x = a + b$, donc $E = E_1(s) + E_{-1}(s)$.`,
        R`<b>Directe.</b> Si $x \in E_1 \cap E_{-1}$, alors $x = s(x) = -x$, donc $x = 0$.`,
        R`<b>Diagonalisable.</b> $E$ est somme directe de sous-espaces propres : une base adaptée est formée de vecteurs propres.`
      ],
      retenir: R`<p>Écrire $x = \frac{x + s(x)}{2} + \frac{x - s(x)}{2}$ : c'est la même idée que fonction paire + fonction impaire.</p>`
    },
    'projecteur#2': {
      but: R`<p>Valeurs propres possibles de $u$ si $u^3 = u$, et un exemple.</p>`,
      methode: R`<p>Appliquer $u^3 = u$ à un vecteur propre.</p>`,
      etapes: [
        R`<b>Vecteur propre.</b> $u(x) = \lambda x$, $x \neq 0$ : $u^3(x) = \lambda^3x$ (récurrence : $u^k(x) = \lambda^kx$).`,
        R`<b>Relation.</b> $\lambda^3x = u(x) = \lambda x$, donc $(\lambda^3 - \lambda)x = 0$ et $\lambda(\lambda - 1)(\lambda + 1) = 0$.`,
        R`<b>Exemple.</b> $A = \mathrm{diag}(-1, 0, 1)$ : $A^3 = \mathrm{diag}((-1)^3, 0, 1) = A$, et le spectre d'une matrice diagonale est sa diagonale.`
      ],
      retenir: R`<p>Le spectre est inclus dans les racines de tout polynôme annulateur.</p>`
    },
    nilpotent: {
      but: R`<p>Spectre, polynôme caractéristique et trace d'une matrice nilpotente ; diagonalisabilité.</p>`,
      methode: R`<p>Appliquer $A^p = 0$ à un vecteur propre ; puis utiliser que $\chi_A$ est scindé sur $\C$.</p>`,
      etapes: [
        R`<b>Seule valeur propre possible.</b> Si $AX = \lambda X$, $X \neq 0$, alors $A^pX = \lambda^pX$. Or $A^p = 0$, donc $\lambda^pX = 0$ et $\lambda = 0$.`,
        R`<b>$0$ est bien valeur propre.</b> $\det(A)^p = \det(A^p) = 0$, donc $\det A = 0$ : $A$ n'est pas inversible et $0 \in \Sp(A)$.`,
        R`<b>Polynôme caractéristique.</b> $\chi_A$ est unitaire de degré $n$ et scindé sur $\C$ ; sa seule racine est $0$, donc $\chi_A = X^n$.`,
        R`<b>Trace.</b> Le coefficient de $X^{n-1}$ dans $\chi_A$ vaut $-\tr A$ ; il est nul, donc $\tr A = 0$.`,
        R`<b>Diagonalisable ⇒ nulle.</b> Si $A = PDP^{-1}$, la diagonale de $D$ est formée de valeurs propres, toutes nulles : $D = 0$ et $A = 0$.`
      ],
      retenir: R`<p>Nilpotente ⟹ $\Sp = \{0\}$, $\chi_A = X^n$, $\tr A = 0$, $\det A = 0$ ; et non diagonalisable si $A \neq 0$.</p>`
    },
    'nilpotent#1': {
      but: R`<p>Relier les valeurs propres de $A$ et de $A^{-1}$.</p>`,
      methode: R`<p>Multiplier l'égalité $AX = \lambda X$ par $A^{-1}$.</p>`,
      etapes: [
        R`<b>$0$ n'est pas valeur propre.</b> $A$ inversible ⟹ $\Ker A = \{0\}$ : aucun $X \neq 0$ ne vérifie $AX = 0$.`,
        R`<b>Sens direct.</b> $AX = \lambda X$ ($X \neq 0$, $\lambda \neq 0$) ⟹ $X = \lambda A^{-1}X$ ⟹ $A^{-1}X = \frac1\lambda X$.`,
        R`<b>Réciproque.</b> Même calcul en échangeant $A$ et $A^{-1}$ ; d'où $E_\lambda(A) = E_{1/\lambda}(A^{-1})$.`
      ],
      retenir: R`<p>Mêmes vecteurs propres, valeurs propres inversées.</p>`
    },
    derivation: {
      but: R`<p>Éléments propres de la dérivation sur $\R_n[X]$ ; comparaison avec $C^\infty$.</p>`,
      methode: R`<p>Comparer les <strong>degrés</strong> dans $P' = \lambda P$ ; ou écrire la matrice dans la base canonique (triangulaire).</p>`,
      etapes: [
        R`<b>Raisonnement par les degrés.</b> Soit $P \neq 0$ avec $P' = \lambda P$. Si $\lambda \neq 0$, $\deg(\lambda P) = \deg P$, alors que $P'$ est nul ou de degré $\deg P - 1$ : impossible. Donc $\lambda = 0$.`,
        R`<b>$E_0$.</b> $P' = 0 \iff P$ constant : $E_0(\varphi) = \R_0[X]$, et $\Sp(\varphi) = \{0\}$.`,
        R`<b>Avec la matrice.</b> $\varphi(X^k) = kX^{k-1}$ : la colonne $k$ n'a qu'un coefficient, au-dessus de la diagonale. La matrice est triangulaire supérieure stricte, sa diagonale est nulle : $\chi_\varphi = X^{n+1}$.`,
        R`<b>Non diagonalisable.</b> $\dim E_0 = 1 \lt n + 1 = m(0)$.`,
        R`<b>Sur $C^\infty$.</b> $f(x) = e^{\lambda x}$ vérifie $f' = \lambda f$ pour tout $\lambda \in \R$ : tout réel est valeur propre. Ces fonctions ne sont pas des polynômes (sauf $\lambda = 0$).`
      ],
      retenir: R`<p>Le spectre dépend de l'espace sur lequel on travaille.</p>`
    },
    'derivation#1': {
      but: R`<p>Éléments propres de $\psi : P \mapsto XP'$.</p>`,
      methode: R`<p>Calculer l'image de la base canonique : si elle est formée de vecteurs propres, la matrice est diagonale.</p>`,
      etapes: [
        R`<b>Image de $X^k$.</b> $\psi(X^k) = X \cdot kX^{k-1} = kX^k$ : $X^k$ est vecteur propre pour $k$.`,
        R`<b>Matrice.</b> Dans $(1, X, \dots, X^n)$ : $\mathrm{diag}(0, 1, \dots, n)$ ; $\psi$ est diagonalisable.`,
        R`<b>Conclusion.</b> $n + 1$ valeurs propres distinctes $0, 1, \dots, n$ en dimension $n + 1$ : chaque sous-espace propre est une droite, $E_k(\psi) = \Vect(X^k)$.`
      ],
      retenir: R`<p>$n$ valeurs propres distinctes en dimension $n$ : diagonalisable, sous-espaces propres de dimension 1.</p>`
    },
    'derivation#2': {
      but: R`<p>Éléments propres de $\theta : P \mapsto P - P'$.</p>`,
      methode: R`<p>Matrice dans la base canonique (triangulaire), puis noyau de $\theta - \Id$.</p>`,
      etapes: [
        R`<b>Image de $X^k$.</b> $\theta(X^k) = X^k - kX^{k-1}$ : coefficient 1 sur la diagonale, $-k$ juste au-dessus.`,
        R`<b>Spectre.</b> Matrice triangulaire à diagonale de 1 : $\chi_\theta = (X - 1)^{n+1}$, $\Sp(\theta) = \{1\}$.`,
        R`<b>Sous-espace propre.</b> $\theta(P) = P \iff P' = 0 \iff P$ constant : $E_1(\theta) = \R_0[X]$, de dimension 1, bien moins que la multiplicité $n + 1$ : non diagonalisable.`
      ],
      retenir: R`<p>Une seule valeur propre $\lambda$ et $u \neq \lambda\Id$ : jamais diagonalisable.</p>`
    },
    transposee: {
      but: R`<p>Comparer spectres et sous-espaces propres de $A$ et $A^T$.</p>`,
      methode: R`<p>Le déterminant est invariant par transposition ; les sous-espaces propres se calculent séparément.</p>`,
      etapes: [
        R`<b>Même polynôme.</b> $XI_n - A^T = (XI_n - A)^T$ et $\det(M^T) = \det M$, donc $\chi_{A^T} = \chi_A$.`,
        R`<b>Sous-espaces de $A$.</b> $A - I_2 = \begin{pmatrix} 0 & 1 \\ 0 & 1 \end{pmatrix}$ : $y = 0$, $E_1(A) = \Vect\big((1, 0)\big)$. $A - 2I_2 = \begin{pmatrix} -1 & 1 \\ 0 & 0 \end{pmatrix}$ : $y = x$, $E_2(A) = \Vect\big((1, 1)\big)$.`,
        R`<b>Sous-espaces de $A^T$.</b> $A^T - I_2 = \begin{pmatrix} 0 & 0 \\ 1 & 1 \end{pmatrix}$ : $x + y = 0$, $E_1(A^T) = \Vect\big((1, -1)\big)$. $A^T - 2I_2 = \begin{pmatrix} -1 & 0 \\ 1 & 0 \end{pmatrix}$ : $x = 0$, $E_2(A^T) = \Vect\big((0, 1)\big)$.`,
        R`<b>Conclusion.</b> Sous-espaces différents, mais de mêmes dimensions car $\rg(M^T) = \rg(M)$.`
      ],
      retenir: R`<p>$A$ et $A^T$ : même spectre, mêmes dimensions de sous-espaces propres, mais pas les mêmes sous-espaces.</p>`
    },
    'ab-ba': {
      but: R`<p>Montrer que $AB$ et $BA$ ont le même spectre.</p>`,
      methode: R`<p>Valeurs propres non nulles : transporter un vecteur propre de $AB$ par $B$. Valeur propre 0 : déterminant.</p>`,
      etapes: [
        R`<b>$BX \neq 0$.</b> Si $BX = 0$, alors $ABX = 0$ ; or $ABX = \lambda X$ avec $\lambda \neq 0$, donc $X = 0$ : absurde.`,
        R`<b>$BX$ vecteur propre de $BA$.</b> $BA(BX) = B(ABX) = B(\lambda X) = \lambda BX$, et $BX \neq 0$.`,
        R`<b>Valeur propre 0.</b> $0 \in \Sp(AB) \iff \det(AB) = 0 \iff \det A \det B = 0 \iff \det(BA) = 0 \iff 0 \in \Sp(BA)$.`,
        R`<b>Conclusion.</b> Les valeurs propres non nulles de $AB$ sont valeurs propres de $BA$ et inversement (rôles symétriques) ; $0$ est commun ou absent des deux. Donc $\Sp(AB) = \Sp(BA)$.`
      ],
      retenir: R`<p>Traiter séparément $\lambda \neq 0$ (vecteurs propres) et $\lambda = 0$ (déterminant).</p>`
    },
    'diag-double': {
      but: R`<p>Diagonaliser une matrice $3 \times 3$ qui a une valeur propre double.</p>`,
      methode: R`<p>$\chi_A$ par trace, $s_2$ et déterminant ; puis vérifier $\dim E_1 = 2$ par le rang de $A - I_3$.</p>`,
      etapes: [
        R`<b>Coefficients.</b> $\tr A = 2 + 2 + 0 = 4$ ; mineurs principaux $\begin{vmatrix} 2 & 1 \\ 1 & 2 \end{vmatrix} = 3$, $\begin{vmatrix} 2 & -1 \\ 1 & 0 \end{vmatrix} = 1$, $\begin{vmatrix} 2 & -1 \\ 1 & 0 \end{vmatrix} = 1$, donc $s_2 = 5$ ; $\det A = 2(0 + 1) - 1(0 + 1) - 1(1 - 2) = 2$.`,
        R`<b>Factorisation.</b> $\chi_A = X^3 - 4X^2 + 5X - 2$ ; $\chi_A(1) = 0$, et $\chi_A = (X - 1)(X^2 - 3X + 2) = (X - 1)^2(X - 2)$.`,
        R`<b>$E_1$.</b> Les trois lignes de $A - I_3$ valent $(1\ 1\ {-1})$ : rang 1, $\dim E_1 = 2 = m(1)$, base $(1, 0, 1), (0, 1, 1)$.`,
        R`<b>$E_2$.</b> Lignes 1 et 2 de $A - 2I_3$ : $y = z$ et $x = z$ ; $E_2 = \Vect\big((1, 1, 1)\big)$.`,
        R`<b>Conclusion.</b> $\dim E_1 + \dim E_2 = 3$ : diagonalisable, $P = \begin{pmatrix} 1 & 0 & 1 \\ 0 & 1 & 1 \\ 1 & 1 & 1 \end{pmatrix}$, $D = \mathrm{diag}(1, 1, 2)$.`,
        R`<b>Contrôle.</b> $A(1, 1, 1)^T = (2, 2, 2)^T$ ✓ et $A(1, 0, 1)^T = (1, 0, 1)^T$ ✓.`
      ],
      retenir: R`<p>Valeur propre double : il faut que $A - \lambda I_3$ soit de rang 1.</p>`
    },
    'diag-param': {
      but: R`<p>Discuter la diagonalisabilité de $A_a$ selon $a$.</p>`,
      methode: R`<p>Matrice triangulaire : spectre lu sur la diagonale ; seule la valeur propre double $1$ est à étudier, via le rang de $A_a - I_3$.</p>`,
      etapes: [
        R`<b>Spectre.</b> $A_a$ triangulaire : $\chi = (X - 1)^2(X - 2)$.`,
        R`<b>Valeur propre simple.</b> $\dim E_2 = 1$ automatiquement.`,
        R`<b>Rang de $A_a - I_3$.</b> Lignes $(0, a, 1)$, $(0, 0, 1)$, $(0, 0, 1)$ : rang 2 si $a \neq 0$, rang 1 si $a = 0$.`,
        R`<b>Conclusion.</b> $a \neq 0$ : $\dim E_1 = 1 \lt 2$, non diagonalisable. $a = 0$ : $\dim E_1 = 2$, diagonalisable.`,
        R`<b>Diagonalisation ($a = 0$).</b> $E_1 = \Vect(e_1, e_2)$, $E_2 = \Vect\big((1, 1, 1)\big)$ : $P = \begin{pmatrix} 1 & 0 & 1 \\ 0 & 1 & 1 \\ 0 & 0 & 1 \end{pmatrix}$, $D = \mathrm{diag}(1, 1, 2)$.`
      ],
      retenir: R`<p>Avec un paramètre : la diagonalisabilité se joue sur le rang de $A - \lambda I$ pour les valeurs propres multiples.</p>`
    },
    rotation: {
      but: R`<p>Diagonalisabilité d'une matrice de rotation sur $\R$ et sur $\C$.</p>`,
      methode: R`<p>$\chi = X^2 - \tr(R)X + \det R$, puis signe du discriminant.</p>`,
      etapes: [
        R`<b>Polynôme.</b> $\tr R_\theta = 2\cos\theta$, $\det R_\theta = \cos^2\theta + \sin^2\theta = 1$ : $\chi = X^2 - 2\cos\theta\,X + 1$.`,
        R`<b>Discriminant.</b> $\Delta = 4\cos^2\theta - 4 = -4\sin^2\theta \le 0$, nul si et seulement si $\theta \in \pi\Z$.`,
        R`<b>$\theta \notin \pi\Z$, sur $\R$.</b> Pas de racine réelle : non diagonalisable.`,
        R`<b>Sur $\C$.</b> $\lambda = \cos\theta \pm i\sin\theta = e^{\pm i\theta}$, distinctes : diagonalisable. Pour $e^{i\theta}$, la 1<sup>re</sup> ligne de $R_\theta - e^{i\theta}I_2$ est $(-i\sin\theta,\ -\sin\theta)$, d'où le vecteur $(1, -i)$.`,
        R`<b>$\theta \in \pi\Z$.</b> $R_\theta = \pm I_2$, déjà diagonale.`
      ],
      retenir: R`<p>Une rotation non triviale du plan n'a pas de droite stable : pas de valeur propre réelle.</p>`
    },
    puissances: {
      but: R`<p>Calculer $A^n$ en diagonalisant $A$.</p>`,
      methode: R`<p>$A = PDP^{-1}$ donc $A^n = PD^nP^{-1}$.</p>`,
      etapes: [
        R`<b>Valeurs propres.</b> $\tr A = 2$, $\det A = -3$ : $\chi_A = X^2 - 2X - 3 = (X - 3)(X + 1)$.`,
        R`<b>Vecteurs propres.</b> $A - 3I_2$ : $-x + y = 0$, $(1, 1)$ ; $A + I_2$ : $x + y = 0$, $(1, -1)$.`,
        R`<b>$P$ et $P^{-1}$.</b> $P = \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$, $\det P = -2$, $P^{-1} = \frac12\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$.`,
        R`<b>Produit.</b> $PD^n = \begin{pmatrix} 3^n & (-1)^n \\ 3^n & -(-1)^n \end{pmatrix}$, puis $PD^nP^{-1} = \frac12\begin{pmatrix} 3^n + (-1)^n & 3^n - (-1)^n \\ 3^n - (-1)^n & 3^n + (-1)^n \end{pmatrix}$.`,
        R`<b>Contrôle.</b> $n = 0$ : $I_2$ ✓ ; $n = 1$ : $A$ ✓.`
      ],
      retenir: R`<p>$A^n = PD^nP^{-1}$ ; contrôler avec $n = 0$ et $n = 1$.</p>`
    },
    'puissances#1': {
      but: R`<p>Expliciter deux suites couplées.</p>`,
      methode: R`<p>$X_n = A^nX_0$ ; décomposer $X_0$ sur une base de vecteurs propres.</p>`,
      etapes: [
        R`<b>Forme matricielle.</b> $A = \begin{pmatrix} 4 & -2 \\ 1 & 1 \end{pmatrix}$, $\tr A = 5$, $\det A = 6$ : $\chi_A = (X - 2)(X - 3)$.`,
        R`<b>Vecteurs propres.</b> $A - 2I_2$ : $x - y = 0$, $w_1 = (1, 1)$ ; $A - 3I_2$ : $x - 2y = 0$, $w_2 = (2, 1)$.`,
        R`<b>Décomposition.</b> $(3, 2) = c_1(1, 1) + c_2(2, 1)$ : $c_1 + 2c_2 = 3$, $c_1 + c_2 = 2$, d'où $c_1 = c_2 = 1$.`,
        R`<b>Résultat.</b> $X_n = 2^nw_1 + 3^nw_2$ : $u_n = 2^n + 2\cdot3^n$, $v_n = 2^n + 3^n$.`,
        R`<b>Contrôle.</b> $u_1 = 12 - 4 = 8 = 2 + 6$, $v_1 = 3 + 2 = 5$ ✓.`
      ],
      retenir: R`<p>Pas besoin de $P^{-1}$ : il suffit de décomposer la condition initiale.</p>`
    },
    fibonacci: {
      but: R`<p>Formule explicite de la suite de Fibonacci.</p>`,
      methode: R`<p>Équation caractéristique $r^2 = r + 1$, deux racines distinctes : $F_n = \lambda\varphi^n + \mu\psi^n$.</p>`,
      etapes: [
        R`<b>Matrice.</b> $X_{n+1} = \begin{pmatrix} 0 & 1 \\ 1 & 1 \end{pmatrix}X_n$, $\chi_A = X^2 - X - 1$.`,
        R`<b>Racines.</b> $\Delta = 5$ : $\varphi = \frac{1 + \sqrt5}{2}$, $\psi = \frac{1 - \sqrt5}{2}$, distinctes, donc $A$ est diagonalisable.`,
        R`<b>Forme.</b> $F_n = \lambda\varphi^n + \mu\psi^n$.`,
        R`<b>Constantes.</b> $F_0 = 0$ : $\mu = -\lambda$ ; $F_1 = 1$ : $\lambda(\varphi - \psi) = \lambda\sqrt5 = 1$.`,
        R`<b>Résultat.</b> $F_n = \frac{1}{\sqrt5}(\varphi^n - \psi^n)$ ; contrôle $F_2 = \frac{1}{\sqrt5}(\varphi^2 - \psi^2) = \frac{1}{\sqrt5}(\varphi - \psi)(\varphi + \psi) = 1$ ✓.`
      ],
      retenir: R`<p>Bien que $F_n$ soit entier, la formule fait intervenir $\sqrt5$.</p>`
    },
    'fibonacci#1': {
      but: R`<p>Suite récurrente d'ordre 2 avec racine double.</p>`,
      methode: R`<p>Racine double $r$ : $u_n = (\lambda + \mu n)r^n$.</p>`,
      etapes: [
        R`<b>Équation caractéristique.</b> $r^2 - 4r + 4 = (r - 2)^2$ : racine double $2$.`,
        R`<b>Non diagonalisable.</b> $A - 2I_2 = \begin{pmatrix} -2 & 1 \\ -4 & 2 \end{pmatrix} \neq 0$ : $\dim E_2 = 1$.`,
        R`<b>Forme.</b> $u_n = (\lambda + \mu n)2^n$.`,
        R`<b>Constantes.</b> $u_0 = \lambda = 1$ ; $u_1 = 2(\lambda + \mu) = 4$, donc $\mu = 1$.`,
        R`<b>Résultat.</b> $u_n = (n + 1)2^n$ ; contrôle $u_2 = 4 \times 4 - 4 \times 1 = 12 = 3 \times 4$ ✓.`
      ],
      retenir: R`<p>Racine double : ne pas oublier le facteur $n$.</p>`
    }
  };

  L2.chapter('algebre3', 'diagonalisation', {
    intro: R`<p>Diagonaliser un endomorphisme, c'est trouver une base dans laquelle il se contente de <strong>multiplier chaque vecteur par un scalaire</strong> : sa matrice y est diagonale. Après des rappels sur le <strong>déterminant</strong> et la <strong>trace</strong>, on définit les <strong>valeurs propres</strong> et <strong>vecteurs propres</strong>, on les calcule grâce au <strong>polynôme caractéristique</strong>, on étudie les <strong>sous-espaces propres</strong>, puis on établit les critères de <strong>diagonalisation</strong>. Application : calcul de puissances de matrices et <strong>suites récurrentes linéaires</strong>.</p>`,
    cours, fiche, exercices, methodes, generateurs, plan, reperes, details
  });
})();
