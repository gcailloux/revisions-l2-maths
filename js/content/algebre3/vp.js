/* Algèbre 3 — Chapitre 3 : Valeurs propres et vecteurs propres */
(function () {
  'use strict';
  const R = String.raw;
  const { F, poly, mat, tuple, kernel, rref, matMul, matVec, inv, det, trace, unimod, factored,
    polyFromRoots, minusLambda, subLambda, lin, isProportional, sqrtSimplify } = ML;

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
  /* A = P D P^{-1} à coefficients entiers, petits.
     pickEigs() tire des valeurs propres (re-tirées régulièrement si on n'arrive pas
     à obtenir de petits coefficients). Renvoie { A, eigs }. */
  function randDiagonalizable(r, n, pickEigs, maxEntry) {
    let eigs = pickEigs();
    for (let t = 0; t < 3000; t++) {
      if (t > 0 && t % 40 === 0) eigs = pickEigs();
      const steps = n === 2 ? r.int(2, 3) : r.int(3, 5);
      const P = unimod(r, n, steps);
      const Pi = inv(P).map(row => row.map(x => x.val()));
      const A = matMul(matMul(P, diag(eigs)), Pi);
      const m = Math.max(...A.flat().map(Math.abs));
      const zeros = A.flat().filter(x => x === 0).length;
      if (m <= maxEntry && zeros <= Math.floor(n * n / 3) && !isTriangular(A)) return { A, eigs };
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
  function eigenSpaceTex(A, l, n) {
    const B = subLambda(A, l);
    const ker = kernel(B);
    const { R: Rr } = rref(B);
    return { B, ker, Rr };
  }
  function vectTex(vs) { return R`\Vect\left(` + vs.map(tuple).join(',\,') + R`\right)`; }

  /* ------------------------------------------------------------------ */
  /* Générateurs                                                         */
  /* ------------------------------------------------------------------ */
  const generateurs = {
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
          const { B, ker } = eigenSpaceTex(A, l, 2);
          const row = B[0].some(x => x !== 0) ? B[0] : B[1];
          cor += R`<p><strong>Sous-espace propre pour $\lambda = ${l}$.</strong> $${AmL(l, 2)} = ${mat(B)}$ est de rang $1$ (ses lignes sont proportionnelles). Le système $(${AmL(l, 2)})X = 0$ se réduit à $${lin(row, ['x', 'y'])} = 0$, donc</p>
            $$E_{${l}}(A) = ${vectTex(ker)}.$$`;
        });
        cor += R`<p><em>Vérification :</em> $\lambda_1 + \lambda_2 = ${l1 + l2} = \tr A$ et $\lambda_1\lambda_2 = ${l1 * l2} = \det A$.</p>`;
        return {
          enonce: R`<p>Soit $A = ${mat(A)} \in \M_2(\R)$. Déterminer le polynôme caractéristique de $A$, ses valeurs propres, et une base de chaque sous-espace propre.</p>`,
          indication: R`<p>Utilisez $\chi_A(X) = X^2 - \tr(A)X + \det(A)$, puis résolvez $(A - \lambda I_2)X = 0$ pour chaque valeur propre : une seule équation suffit.</p>`,
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
        let cor = R`<p><strong>Polynôme caractéristique.</strong> On calcule $\chi_A(X) = \det(XI_3 - A)$ (développement ou opérations sur les lignes/colonnes) :</p>
          $$\chi_A(X) = ${poly(c)}.$$
          <p>Le terme constant vaut $(-1)^3\det A = ${-d}$. On cherche une racine évidente parmi ses diviseurs : $\chi_A(${eigs[0]}) = 0$. On factorise alors par $${ML.xMinus(eigs[0])}$ et on résout l'équation du second degré restante :</p>
          $$\chi_A(X) = ${factored(eigs.map(l => [l, 1]))}, \qquad \Sp(A) = \{${eigs.join(',\\,')}\}.$$
          <p><em>Contrôle :</em> $${eigs.join(' + ').replace(/\+ -/g, '- ')} = ${t} = \tr A$.</p>`;
        eigs.forEach(l => {
          const { B, ker, Rr } = eigenSpaceTex(A, l, 3);
          const eqs = Rr.filter(row => row.some(x => !x.isZero())).map(row => lin(row, ['x', 'y', 'z']) + ' = 0');
          cor += R`<p><strong>$\lambda = ${l}$.</strong> $${AmL(l, 3)} = ${mat(B)}$. Après échelonnement, le système $(${AmL(l, 3)})X = 0$ équivaut à
            $\begin{cases} ${eqs.join(R` \\ `)} \end{cases}$, d'où $E_{${l}}(A) = ${vectTex(ker)}$.</p>`;
        });
        cor += R`<p>Les trois valeurs propres sont distinctes : les trois vecteurs propres obtenus forment une famille libre (ch. 3, corollaire de la somme directe), donc une base de $\R^3$.</p>`;
        return {
          enonce: R`<p>Soit $A = ${mat(A)}$. Calculer $\chi_A$, en déduire le spectre de $A$, puis une base de chacun de ses sous-espaces propres.</p>`,
          indication: R`<p>Les valeurs propres sont entières. Le terme constant de $\chi_A$ est $-\det A = ${-d}$ : testez ses diviseurs (et $0$ si $\det A = 0$) pour trouver une racine évidente.</p>`,
          correction: cor
        };
      }
    },

    testvec: {
      title: 'Est-ce un vecteur propre ?', diff: 1,
      make(r) {
        const { A, eigs } = randDiagonalizable(r, 3, pick3(r, [-2, -1, 0, 1, 2, 3]), 10);
        let v, isEig = r.chance(0.55);
        if (isEig) {
          const l = r.pick(eigs);
          v = kernel(subLambda(A, l))[0].map(x => x * r.pick([1, -1, 2]));
        } else {
          do { v = [r.int(-2, 2), r.int(-2, 2), r.int(-2, 2)]; }
          while (v.every(x => x === 0) || isProportional(matVec(A, v), v) !== null);
        }
        const Av = matVec(A, v);
        const lam = isProportional(Av, v);
        let cor = R`<p>On calcule $Av = ${mat(A)}${ML.vec(v)} = ${ML.vec(Av)}$.</p>`;
        if (lam !== null) {
          cor += R`<p>On constate que $Av = ${lam.tex()}\,v$ et $v \neq 0$ : <strong>$v$ est un vecteur propre</strong> de $A$, associé à la valeur propre $${lam.tex()}$.</p>`;
        } else {
          let i = v.findIndex(x => x !== 0);
          let j = v.findIndex((x, k) => k !== i && (x !== 0 || Av[k] !== 0));
          cor += R`<p>Si l'on avait $Av = \lambda v$, on aurait $\lambda = ${F(Av[i], v[i]).tex()}$ (coordonnée ${i + 1}), mais la coordonnée ${j + 1} donne $${Av[j]} \neq ${F(Av[i], v[i]).tex()}\times(${v[j]})$. <strong>$v$ n'est pas un vecteur propre</strong> de $A$.</p>`;
        }
        return {
          enonce: R`<p>Soit $A = ${mat(A)}$ et $v = ${ML.vec(v)}$. Le vecteur $v$ est-il un vecteur propre de $A$ ? Si oui, pour quelle valeur propre ?</p>`,
          indication: R`<p>Inutile de calculer $\chi_A$ : calculez $Av$ et regardez s'il est colinéaire à $v$.</p>`,
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
          cor += R`<p>$\Delta = 0$ : une valeur propre double $\lambda = ${a.tex()}$. Ici $A \neq ${a.tex()}\,I_2$, donc $A - \lambda I_2 \neq 0$ est de rang $1$ et $\dim E_\lambda(A) = 1 < 2 = m(\lambda)$.</p>`;
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
            cor += R`<p>$\Delta > 0$ : deux valeurs propres réelles distinctes $\lambda = \dfrac{${t} \pm \sqrt{${D}}}{2}$, soit $\lambda = ${lt}$. Chacune est racine simple, donc chaque sous-espace propre est une droite.</p>`;
          } else {
            cor += R`<p>$\Delta < 0$ : <strong>aucune valeur propre réelle</strong>, $\Sp_\R(A) = \varnothing$. Dans $\C$ : $\lambda = \dfrac{${t} \pm i\sqrt{${-D}}}{2}$, soit $\lambda = ${lt}$ (deux valeurs propres complexes conjuguées).</p>`;
          }
        }
        return {
          enonce: R`<p>Soit $A = ${mat(A)}$. Déterminer $\Sp_\R(A)$ et $\Sp_\C(A)$.</p>`,
          correction: cor
        };
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Cours                                                               */
  /* ------------------------------------------------------------------ */
  const cours = [
    { t: 'h', title: 'Éléments propres d’un endomorphisme' },
    { t: 'def', title: 'valeur propre, vecteur propre', body: R`
      <p>Soit $u \in \Lin(E)$. On dit que $\lambda \in \K$ est une <strong>valeur propre</strong> de $u$ s'il existe $x \in E$, <strong>$x \neq 0$</strong>, tel que $u(x) = \lambda x$. Un tel vecteur $x$ est appelé <strong>vecteur propre</strong> de $u$ associé à $\lambda$.</p>
      <p>L'ensemble des valeurs propres de $u$ est le <strong>spectre</strong> de $u$, noté $\Sp(u)$.</p>` },
    { t: 'rem', body: R`
      <ul>
        <li>Un vecteur propre est <em>non nul</em> par définition (sinon tout $\lambda$ conviendrait, puisque $u(0) = \lambda\cdot 0$).</li>
        <li>Un vecteur propre est associé à une <em>unique</em> valeur propre : si $u(x) = \lambda x = \mu x$ avec $x \neq 0$, alors $(\lambda - \mu)x = 0$ donc $\lambda = \mu$.</li>
        <li>Géométriquement : $x \neq 0$ est un vecteur propre si et seulement si la droite $\K x$ est <em>stable</em> par $u$.</li>
      </ul>` },
    { t: 'ex', body: R`
      <ol>
        <li><strong>Homothétie</strong> $u = \lambda\,\Id_E$ ($E \neq \{0\}$) : $\Sp(u) = \{\lambda\}$ et tout vecteur non nul est propre.</li>
        <li><strong>Projection</strong> $p$ sur $F$ parallèlement à $G$, avec $E = F \oplus G$, $F, G \neq \{0\}$ : $p(x) = x$ pour $x \in F$ et $p(x) = 0$ pour $x \in G$, donc $\Sp(p) = \{0, 1\}$.</li>
        <li><strong>Rotation</strong> d'angle $\pi/2$ dans $\R^2$ : aucune droite n'est stable, donc $u$ n'a <em>aucune</em> valeur propre réelle.</li>
        <li><strong>Dérivation</strong> $D : f \mapsto f'$ sur $C^\infty(\R, \R)$ : pour tout $\lambda \in \R$, $f_\lambda : x \mapsto e^{\lambda x}$ vérifie $D(f_\lambda) = \lambda f_\lambda$. Donc $\Sp(D) = \R$ (en dimension infinie, le spectre peut être infini).</li>
      </ol>` },
    { t: 'def', title: 'sous-espace propre', body: R`
      <p>Pour $\lambda \in \K$, on note $E_\lambda(u) = \Ker(u - \lambda\,\Id_E) = \{x \in E \mid u(x) = \lambda x\}$. Lorsque $\lambda \in \Sp(u)$, $E_\lambda(u)$ est appelé <strong>sous-espace propre</strong> de $u$ associé à $\lambda$.</p>` },
    { t: 'prop', body: R`
      <p>Pour tout $\lambda \in \K$, $E_\lambda(u)$ est un sous-espace vectoriel de $E$, et :</p>
      $$\lambda \in \Sp(u) \iff E_\lambda(u) \neq \{0\} \iff u - \lambda\,\Id_E \text{ n'est pas injectif}.$$
      <p>En particulier $0 \in \Sp(u) \iff u$ n'est pas injectif, et $E_0(u) = \Ker u$.</p>`,
      proof: R`<p>$E_\lambda(u)$ est le noyau de l'application linéaire $u - \lambda\Id_E$, c'est donc un sous-espace vectoriel. Ensuite, $\lambda$ est valeur propre si et seulement s'il existe $x \neq 0$ avec $u(x) - \lambda x = 0$, c'est-à-dire $x \in \Ker(u - \lambda \Id_E)\setminus\{0\}$, c'est-à-dire $\Ker(u - \lambda\Id_E) \neq \{0\}$, ce qui équivaut à la non-injectivité. Pour $\lambda = 0$ : $u - 0\cdot\Id_E = u$.</p>` },
    { t: 'cor', title: 'dimension finie', body: R`
      <p>Si $\dim E = n < \infty$ : $\quad\lambda \in \Sp(u) \iff u - \lambda\Id_E \text{ n'est pas bijectif} \iff \det(u - \lambda\Id_E) = 0.$</p>`,
      proof: R`<p>En dimension finie, un endomorphisme est injectif si et seulement s'il est bijectif (théorème du rang), si et seulement si son déterminant est non nul.</p>` },

    { t: 'h', title: 'Indépendance des sous-espaces propres' },
    { t: 'thm', body: R`
      <p>Soient $\lambda_1, \dots, \lambda_p$ des valeurs propres <strong>deux à deux distinctes</strong> de $u$. Alors la somme $E_{\lambda_1}(u) + \dots + E_{\lambda_p}(u)$ est <strong>directe</strong>.</p>`,
      proof: R`<p>Récurrence sur $p$. Pour $p = 1$ il n'y a rien à montrer. Supposons le résultat vrai pour $p - 1$ valeurs propres distinctes, et soient $x_i \in E_{\lambda_i}(u)$ tels que</p>
      $$x_1 + x_2 + \dots + x_p = 0. \quad (1)$$
      <p>En appliquant $u$ : $\lambda_1 x_1 + \dots + \lambda_p x_p = 0$ (2). En faisant $(2) - \lambda_p\times(1)$ :</p>
      $$(\lambda_1 - \lambda_p)x_1 + \dots + (\lambda_{p-1} - \lambda_p)x_{p-1} = 0.$$
      <p>Chaque $(\lambda_i - \lambda_p)x_i$ appartient à $E_{\lambda_i}(u)$ ; par hypothèse de récurrence, $(\lambda_i - \lambda_p)x_i = 0$ pour $i \le p-1$. Comme $\lambda_i \neq \lambda_p$, on obtient $x_i = 0$ pour $i \le p-1$, puis $x_p = 0$ grâce à (1). La décomposition de $0$ est donc unique : la somme est directe.</p>` },
    { t: 'cor', body: R`
      <p>Une famille $(x_1, \dots, x_p)$ de vecteurs propres associés à des valeurs propres <strong>deux à deux distinctes</strong> est libre.</p>`,
      proof: R`<p>Si $\sum a_i x_i = 0$, chaque $a_i x_i$ est dans $E_{\lambda_i}(u)$ ; la somme étant directe, $a_i x_i = 0$ pour tout $i$, et comme $x_i \neq 0$, $a_i = 0$.</p>` },
    { t: 'cor', body: R`
      <p>Si $\dim E = n$, alors $u$ possède <strong>au plus $n$ valeurs propres</strong> distinctes, et $\displaystyle\sum_{\lambda \in \Sp(u)} \dim E_\lambda(u) \le n$.</p>`,
      proof: R`<p>La somme des $E_\lambda(u)$ est directe, donc sa dimension est $\sum \dim E_\lambda(u)$, et c'est un sous-espace de $E$. Chaque $\dim E_\lambda(u) \ge 1$, d'où au plus $n$ valeurs propres.</p>` },
    { t: 'ex', body: R`<p>Pour $\lambda_1 < \dots < \lambda_p$ réels, les fonctions $x \mapsto e^{\lambda_k x}$ sont des vecteurs propres de $D : f \mapsto f'$ associés à des valeurs propres distinctes : la famille $(e^{\lambda_1 x}, \dots, e^{\lambda_p x})$ est <strong>libre</strong>. Le corollaire évite tout calcul.</p>` },

    { t: 'h', title: 'Le cas des matrices' },
    { t: 'def', body: R`
      <p>Soit $A \in \M_n(\K)$. On dit que $\lambda \in \K$ est valeur propre de $A$ s'il existe $X \in \K^n$, $X \neq 0$, tel que $AX = \lambda X$. On note $\Sp_\K(A)$ le spectre et $E_\lambda(A) = \Ker(A - \lambda I_n)$.</p>` },
    { t: 'prop', body: R`
      <p>Soit $\mathcal{B}$ une base de $E$ et $A = \mathrm{Mat}_\mathcal{B}(u)$. Alors $\Sp(u) = \Sp(A)$, et $x \in E_\lambda(u)$ si et seulement si sa colonne de coordonnées $X$ est dans $E_\lambda(A)$.</p>`,
      proof: R`<p>La colonne des coordonnées de $u(x)$ est $AX$, et l'application $x \mapsto X$ est un isomorphisme ; donc $u(x) = \lambda x \iff AX = \lambda X$, et $x \neq 0 \iff X \neq 0$.</p>` },
    { t: 'prop', title: 'matrices semblables', body: R`
      <p>Si $B = P^{-1}AP$ avec $P \in GL_n(\K)$, alors $\Sp(A) = \Sp(B)$ et $E_\lambda(B) = P^{-1}E_\lambda(A)$.</p>`,
      proof: R`<p>$BY = \lambda Y \iff P^{-1}APY = \lambda Y \iff A(PY) = \lambda (PY)$, et $Y \neq 0 \iff PY \neq 0$.</p>` },
    { t: 'rem', title: 'le spectre dépend du corps', body: R`
      <p>Une matrice réelle peut être vue dans $\M_n(\C)$ : on a toujours $\Sp_\R(A) \subset \Sp_\C(A)$, et l'inclusion peut être stricte. Pour $A = \begin{pmatrix} 0 & -1 \\ 1 & 0\end{pmatrix}$ : $\Sp_\R(A) = \varnothing$ mais $\Sp_\C(A) = \{i, -i\}$, avec $E_i(A) = \Vect\big((1, -i)\big)$ et $E_{-i}(A) = \Vect\big((1, i)\big)$.</p>` },

    { t: 'h', title: 'Polynôme caractéristique' },
    { t: 'def', body: R`
      <p>Le <strong>polynôme caractéristique</strong> de $A \in \M_n(\K)$ est $\chi_A(X) = \det(X I_n - A)$.</p>
      <p>Pour $u \in \Lin(E)$, on pose $\chi_u = \chi_A$ où $A$ est la matrice de $u$ dans une base quelconque (c'est indépendant de la base, voir ci-dessous).</p>` },
    { t: 'warn', body: R`<p>Certains cours définissent $\chi_A = \det(A - XI_n) = (-1)^n\det(XI_n - A)$. Les racines sont les mêmes ; seul le signe change quand $n$ est impair. Avec la convention $\det(XI_n - A)$, le polynôme est <strong>unitaire</strong>.</p>` },
    { t: 'prop', body: R`
      <p>$\chi_A$ est un polynôme unitaire de degré $n$, et</p>
      $$\chi_A(X) = X^n - \tr(A)\,X^{n-1} + \dots + (-1)^n\det(A).$$
      <p>En particulier, pour $n = 2$ : $\chi_A(X) = X^2 - \tr(A)\,X + \det(A)$.</p>`,
      proof: R`<p>Par la formule $\det(M) = \sum_{\sigma \in S_n}\varepsilon(\sigma)\prod_{i} m_{\sigma(i),i}$ appliquée à $M = XI_n - A$, chaque terme est un polynôme en $X$ de degré égal au nombre de points fixes de $\sigma$. Si $\sigma \neq \Id$, $\sigma$ a au plus $n-2$ points fixes ; les termes de degré $n$ et $n-1$ viennent donc uniquement de $\sigma = \Id$, c'est-à-dire de $\prod_{i=1}^n (X - a_{ii}) = X^n - (a_{11} + \dots + a_{nn})X^{n-1} + \cdots$.</p>
      <p>Le terme constant vaut $\chi_A(0) = \det(-A) = (-1)^n\det A$.</p>` },
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
    { t: 'def', title: 'multiplicité', body: R`<p>La <strong>multiplicité</strong> (algébrique) $m(\lambda)$ d'une valeur propre $\lambda$ est son ordre de multiplicité en tant que racine de $\chi_A$.</p>` },
    { t: 'prop', title: 'trace et déterminant', body: R`
      <p>Si $\chi_A$ est scindé, $\chi_A = \prod_{k}(X - \lambda_k)^{m_k}$, alors</p>
      $$\tr A = \sum_k m_k\lambda_k, \qquad \det A = \prod_k \lambda_k^{m_k}.$$`,
      proof: R`<p>On développe $\prod_k (X - \lambda_k)^{m_k}$ : le coefficient de $X^{n-1}$ vaut $-\sum m_k\lambda_k$ et le terme constant $(-1)^n\prod\lambda_k^{m_k}$. On identifie avec la proposition précédente.</p>` },
    { t: 'ex', title: 'matrice 2×2', body: R`
      <p>$A = \begin{pmatrix} 1 & 2 \\ 2 & 1 \end{pmatrix}$ : $\chi_A = X^2 - 2X - 3 = (X - 3)(X + 1)$, donc $\Sp(A) = \{-1, 3\}$.</p>
      <p>$A - 3I_2 = \begin{pmatrix} -2 & 2 \\ 2 & -2\end{pmatrix}$ : $E_3(A) = \Vect\big((1,1)\big)$. $\quad A + I_2 = \begin{pmatrix} 2 & 2 \\ 2 & 2\end{pmatrix}$ : $E_{-1}(A) = \Vect\big((1,-1)\big)$.</p>` },
    { t: 'ex', title: 'matrice 3×3', body: R`
      <p>$A = \begin{pmatrix} 0 & 1 & 1 \\ 1 & 0 & 1 \\ 1 & 1 & 0 \end{pmatrix}$. Dans $\det(XI_3 - A)$, on fait $C_1 \leftarrow C_1 + C_2 + C_3$ (la somme de chaque ligne est constante) :</p>
      $$\chi_A = \begin{vmatrix} X & -1 & -1 \\ -1 & X & -1 \\ -1 & -1 & X \end{vmatrix} = (X - 2)\begin{vmatrix} 1 & -1 & -1 \\ 1 & X & -1 \\ 1 & -1 & X \end{vmatrix} = (X-2)\begin{vmatrix} 1 & -1 & -1 \\ 0 & X+1 & 0 \\ 0 & 0 & X+1 \end{vmatrix} = (X-2)(X+1)^2.$$
      <p>$E_2(A) = \Vect\big((1,1,1)\big)$ ; $A + I_3$ a toutes ses lignes égales à $(1\ 1\ 1)$ donc $E_{-1}(A) = \{x + y + z = 0\} = \Vect\big((1,-1,0), (1,0,-1)\big)$, de dimension $2 = m(-1)$.</p>` },

    { t: 'h', title: 'Dimension des sous-espaces propres' },
    { t: 'thm', body: R`<p>Si $\dim E = n$ et $\lambda \in \Sp(u)$, alors $\quad 1 \le \dim E_\lambda(u) \le m(\lambda).$</p>`,
      proof: R`<p>On a $\dim E_\lambda(u) \ge 1$ car $\lambda$ est valeur propre. Soit $d = \dim E_\lambda(u)$ et $(e_1, \dots, e_d)$ une base de $E_\lambda(u)$, complétée en une base $\mathcal{B}$ de $E$. Comme $u(e_i) = \lambda e_i$ pour $i \le d$,</p>
      $$\mathrm{Mat}_\mathcal{B}(u) = \begin{pmatrix} \lambda I_d & B \\ 0 & C \end{pmatrix}, \quad\text{donc}\quad \chi_u(X) = \det\begin{pmatrix} (X - \lambda)I_d & -B \\ 0 & XI_{n-d} - C \end{pmatrix} = (X - \lambda)^d\,\chi_C(X)$$
      <p>(déterminant triangulaire par blocs). Ainsi $(X - \lambda)^d$ divise $\chi_u$, d'où $d \le m(\lambda)$.</p>` },
    { t: 'cor', body: R`<p>Si $\lambda$ est une racine <strong>simple</strong> de $\chi_u$, alors $\dim E_\lambda(u) = 1$.</p>` },
    { t: 'ex', body: R`<p>$A = \begin{pmatrix} 1 & 1 \\ 0 & 1\end{pmatrix}$ : $\chi_A = (X-1)^2$, $m(1) = 2$, mais $A - I_2 = \begin{pmatrix} 0 & 1 \\ 0 & 0\end{pmatrix}$ est de rang $1$, donc $\dim E_1(A) = 1 < 2$. Ce défaut de dimension est exactement ce qui empêchera la diagonalisation (chapitre 4).</p>` },

    { t: 'h', title: 'Endomorphismes qui commutent' },
    { t: 'prop', body: R`<p>Si $u, v \in \Lin(E)$ commutent ($u \circ v = v \circ u$), alors tout sous-espace propre de $u$ est stable par $v$.</p>`,
      proof: R`<p>Soit $x \in E_\lambda(u)$. Alors $u(v(x)) = v(u(x)) = v(\lambda x) = \lambda v(x)$, donc $v(x) \in E_\lambda(u)$.</p>` },
    { t: 'rem', body: R`<p>De même, $\Ker u$ et $\Imm u$ sont stables par $v$. Ce résultat sert à réduire simultanément deux endomorphismes qui commutent.</p>` }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche                                                               */
  /* ------------------------------------------------------------------ */
  const fiche = [
    { k: 'def', t: 'Valeur propre, vecteur propre', prio: true,
      hyp: R`Soit $u \in \Lin(E)$ et $\lambda \in \K$`,
      concl: [R`$\lambda$ valeur propre <u>ssi $\exists x \neq 0$, $u(x) = \lambda x$</u>`, R`$x$ : vecteur propre ; $\Sp(u)$ : ensemble des valeurs propres`] },
    { k: 'def', t: 'Sous-espace propre',
      concl: [R`$E_\lambda(u) = \Ker(u - \lambda\,\Id)$`, R`$\lambda \in \Sp(u)$ <u>ssi $E_\lambda(u) \neq \{0\}$</u>`, R`$0 \in \Sp(u)$ ssi $u$ non injectif ; $E_0(u) = \Ker u$`] },
    { k: 'thm', t: 'Valeurs propres distinctes',
      hyp: R`$\lambda_1, \dots, \lambda_p$ valeurs propres <u>deux à deux distinctes</u>`,
      concl: [R`$E_{\lambda_1} + \dots + E_{\lambda_p}$ est <b>directe</b>`, R`Des vecteurs propres associés forment une famille <b>libre</b>`, R`$\dim E = n$ $\Rightarrow$ au plus $n$ valeurs propres`] },
    { k: 'def', t: 'Polynôme caractéristique', prio: true,
      concl: [R`$\chi_A(X) = \det(XI_n - A)$, unitaire de degré $n$`, R`$\chi_A = X^n - \tr(A)\,X^{n-1} + \dots + (-1)^n \det A$`, R`$n = 2$ : <u>$\chi_A = X^2 - \tr(A)\,X + \det A$</u>`] },
    { k: 'thm', t: 'Valeurs propres et racines', prio: true,
      concl: [R`$\lambda \in \Sp(A)$ <u>ssi $\chi_A(\lambda) = 0$</u>`, R`ssi $A - \lambda I_n$ non inversible ssi $\det(A - \lambda I_n) = 0$`] },
    { k: 'prop', t: 'Invariances',
      concl: [R`$A$ et $B$ semblables $\Rightarrow$ même $\chi$, même spectre`, R`$\chi_{A^T} = \chi_A$`, R`$A$ triangulaire $\Rightarrow$ valeurs propres = <u>coefficients diagonaux</u>`] },
    { k: 'prop', t: 'Trace et déterminant',
      hyp: R`$\chi_A$ scindé : $\chi_A = \prod_k (X - \lambda_k)^{m_k}$`,
      concl: [R`$\tr A = \sum_k m_k \lambda_k$`, R`$\det A = \prod_k \lambda_k^{m_k}$`],
      b: R`Sert à vérifier ses calculs.` },
    { k: 'thm', t: 'Dimension d’un sous-espace propre', prio: true,
      hyp: R`$\lambda$ valeur propre de multiplicité $m(\lambda)$`,
      concl: [R`<u>$1 \le \dim E_\lambda \le m(\lambda)$</u>`, R`Racine simple $\Rightarrow$ $\dim E_\lambda = 1$`] },
    { k: 'cor', t: 'Existence',
      concl: [R`Sur $\C$ : au moins une valeur propre`, R`Sur $\R$ avec $n$ impair : au moins une valeur propre réelle`] },
    { k: 'prop', t: 'Endomorphismes qui commutent',
      hyp: R`$u \circ v = v \circ u$`,
      concl: [R`$E_\lambda(u)$ est <u>stable</u> par $v$`] },
    { k: 'meth', t: 'Relation polynomiale',
      hyp: R`$P(u) = 0$`,
      concl: [R`$\Sp(u) \subset \{\text{racines de } P\}$`, R`<u>Inclusion seulement</u> : $\Id$ vérifie $u^2 - 3u + 2\Id = 0$ mais $\Sp(\Id) = \{1\}$`] },
    { k: 'warn', t: 'Pièges',
      concl: [R`Un vecteur propre est <b>non nul</b>`, R`Le spectre dépend du corps ($\R$ ou $\C$)`, R`$\det(A - XI_n) = (-1)^n \chi_A$`] }
  ];

  /* ------------------------------------------------------------------ */
  /* Exercices                                                           */
  /* ------------------------------------------------------------------ */
  const exercices = [
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
        <p>(On peut aussi développer $\det(XI_3 - A)$ directement.)</p>
        <ul>
          <li>$\lambda = 0$ : $AX = 0$ donne $x = -2z$ et $y = \tfrac32 z$, donc $E_0(A) = \Vect\big((-4, 3, 2)\big)$.</li>
          <li>$\lambda = 1$ : $(A - I_3)X = 0$, la 1<sup>re</sup> ligne donne $x = -4z$, la 2<sup>e</sup> $3x - 5y + 12z = 0$ d'où $y = 0$ : $E_1(A) = \Vect\big((-4, 0, 1)\big)$.</li>
          <li>$\lambda = 2$ : la 1<sup>re</sup> ligne de $A - 2I_3$ donne $z = 0$, puis $3x - 6y = 0$ : $E_2(A) = \Vect\big((2, 1, 0)\big)$.</li>
        </ul>
        <p>Chaque valeur propre est simple, et on trouve bien des droites (théorème de la dimension).</p>`
    },
    {
      id: 'param', title: 'Discussion selon un paramètre', diff: 2, gen: 'polycar2',
      enonce: R`<p>Pour $a \in \R$, on pose $A_a = \begin{pmatrix} 1 & a \\ 1 & 1\end{pmatrix}$. Selon les valeurs de $a$, déterminer les valeurs propres réelles de $A_a$ et ses sous-espaces propres. Que se passe-t-il dans $\C$ lorsque $a < 0$ ?</p>`,
      correction: R`<p>$\chi_{A_a} = X^2 - 2X + 1 - a = (X - 1)^2 - a$.</p>
        <ul>
          <li><strong>$a > 0$</strong> : deux valeurs propres réelles $1 \pm \sqrt a$. Pour $\lambda = 1 + \sqrt a$, la 2<sup>e</sup> ligne de $A_a - \lambda I_2$ donne $x - \sqrt a\,y = 0$ : $E_{1+\sqrt a} = \Vect\big((\sqrt a, 1)\big)$. De même $E_{1-\sqrt a} = \Vect\big((-\sqrt a, 1)\big)$.</li>
          <li><strong>$a = 0$</strong> : $\chi = (X-1)^2$, $\Sp = \{1\}$. $A_0 - I_2 = \begin{pmatrix} 0 & 0 \\ 1 & 0\end{pmatrix}$ donne $x = 0$ : $E_1 = \Vect\big((0,1)\big)$, de dimension $1 < m(1) = 2$.</li>
          <li><strong>$a < 0$</strong> : $(X - 1)^2 = a < 0$ n'a pas de solution réelle : $\Sp_\R(A_a) = \varnothing$. Dans $\C$ : $\lambda = 1 \pm i\sqrt{-a}$, et pour $\lambda = 1 + i\sqrt{-a}$ on obtient $E_\lambda = \Vect\big((i\sqrt{-a}, 1)\big)$ (vérifier avec la 1<sup>re</sup> ligne : $-i\sqrt{-a}\cdot i\sqrt{-a} + a = -a + a = 0$).</li>
        </ul>`
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
          enonce: R`<p>Soit $s \in \Lin(E)$ tel que $s \circ s = \Id_E$. Montrer que $\Sp(s) \subset \{-1, 1\}$, puis que $E = E_1(s) \oplus E_{-1}(s)$ (on pourra écrire $x = \frac{x + s(x)}{2} + \frac{x - s(x)}{2}$).</p>`,
          correction: R`<p>Si $s(x) = \lambda x$ avec $x \neq 0$ : $x = s(s(x)) = \lambda^2 x$ donc $\lambda^2 = 1$.</p>
            <p>Pour tout $x$ : $s\big(\frac{x + s(x)}{2}\big) = \frac{s(x) + x}{2}$, donc $\frac{x + s(x)}{2} \in E_1(s)$ ; et $s\big(\frac{x - s(x)}{2}\big) = -\frac{x - s(x)}{2}$, donc $\frac{x - s(x)}{2} \in E_{-1}(s)$. Ainsi $E = E_1(s) + E_{-1}(s)$, et la somme est directe car $1 \neq -1$ (théorème de la somme directe).</p>`
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
        <ol><li>Montrer que $\Sp(A) = \{0\}$.</li><li>En déduire $\chi_A$, puis $\tr A$.</li></ol>`,
      correction: R`<p>1. Si $AX = \lambda X$ avec $X \neq 0$, alors $A^pX = \lambda^pX = 0$ donc $\lambda^p = 0$, $\lambda = 0$. Ainsi $\Sp(A) \subset \{0\}$. Réciproquement, $\Sp(A) \neq \varnothing$ car on est sur $\C$ (ou : $\det(A)^p = \det(A^p) = 0$ donc $A$ n'est pas inversible et $0 \in \Sp(A)$).</p>
        <p>2. $\chi_A$ est unitaire de degré $n$, scindé sur $\C$, et sa seule racine est $0$ : $\chi_A = X^n$. Le coefficient de $X^{n-1}$ est nul, donc $\tr A = 0$.</p>`,
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
        <ol><li>Déterminer $\Sp(\varphi)$ et les sous-espaces propres (on raisonnera sur les degrés).</li><li>Retrouver le résultat avec la matrice de $\varphi$ dans la base canonique.</li><li>Comparer avec la dérivation sur $C^\infty(\R,\R)$.</li></ol>`,
      correction: R`<p>1. Soit $P \neq 0$ avec $P' = \lambda P$. Si $\lambda \neq 0$, $\deg(\lambda P) = \deg P$ alors que $\deg P' < \deg P$ (ou $P' = 0$) : contradiction. Donc $\lambda = 0$ et $P' = 0$, c'est-à-dire $P$ constant. Réciproquement les constantes non nulles conviennent : $\Sp(\varphi) = \{0\}$ et $E_0(\varphi) = \R_0[X]$.</p>
        <p>2. $\varphi(X^k) = kX^{k-1}$ : la matrice est triangulaire supérieure stricte, donc $\chi_\varphi = X^{n+1}$ et $\Sp(\varphi) = \{0\}$.</p>
        <p>3. Sur $C^\infty(\R, \R)$, tout réel $\lambda$ est valeur propre ($x \mapsto e^{\lambda x}$). La différence vient de ce que $e^{\lambda x}$ n'est pas un polynôme si $\lambda \neq 0$.</p>`,
      similaires: [
        {
          title: 'L’endomorphisme P ↦ XP′',
          enonce: R`<p>Soit $\psi : \R_n[X] \to \R_n[X]$, $P \mapsto XP'$. Calculer $\psi(X^k)$ ; en déduire $\Sp(\psi)$ et ses sous-espaces propres.</p>`,
          correction: R`<p>$\psi(X^k) = X\cdot kX^{k-1} = kX^k$ : chaque $X^k$ est vecteur propre pour la valeur propre $k$. La matrice dans la base canonique est $\mathrm{diag}(0, 1, \dots, n)$, donc $\Sp(\psi) = \{0, 1, \dots, n\}$, avec $n+1$ valeurs propres distinctes : chaque sous-espace propre est une droite, $E_k(\psi) = \Vect(X^k)$.</p>`
        },
        {
          title: 'L’endomorphisme P ↦ P − P′',
          enonce: R`<p>Soit $\theta : \R_n[X] \to \R_n[X]$, $P \mapsto P - P'$. Déterminer $\Sp(\theta)$ et $E_\lambda(\theta)$.</p>`,
          correction: R`<p>$\theta(X^k) = X^k - kX^{k-1}$ : la matrice dans la base canonique est triangulaire supérieure avec des $1$ sur la diagonale, donc $\chi_\theta = (X-1)^{n+1}$ et $\Sp(\theta) = \{1\}$. $E_1(\theta) = \{P \mid P' = 0\} = \R_0[X]$, de dimension $1$.</p>`
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
        <p>3. D'après 1. (et par symétrie des rôles), $AB$ et $BA$ ont les mêmes valeurs propres non nulles ; d'après 2., elles ont aussi $0$ en commun ou non simultanément. Donc $\Sp(AB) = \Sp(BA)$. (On peut montrer plus fort : $\chi_{AB} = \chi_{BA}$.)</p>`
    },
    {
      id: 'lignes-constantes', title: 'Une valeur propre évidente', diff: 1, gen: 'testvec',
      enonce: R`<p>Soit $A \in \M_n(\K)$ telle que la somme des coefficients de chaque ligne vaut $s$. Montrer que $s$ est valeur propre de $A$. Application : trouver une valeur propre et un vecteur propre de $\begin{pmatrix} 2 & 1 & 4 \\ 3 & 3 & 1 \\ 0 & 5 & 2\end{pmatrix}$ sans calcul de polynôme caractéristique.</p>`,
      correction: R`<p>Soit $U = (1, \dots, 1)^T \neq 0$. La $i$-ème coordonnée de $AU$ est $\sum_j a_{ij} = s$, donc $AU = sU$ : $s \in \Sp(A)$ et $U$ est vecteur propre.</p>
        <p>Application : chaque ligne a pour somme $7$ ; donc $7$ est valeur propre, de vecteur propre $(1, 1, 1)$.</p>`
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiches méthodes                                                     */
  /* ------------------------------------------------------------------ */
  const methodes = [
    {
      title: 'Trouver les valeurs propres d’une matrice donnée', gen: 'spectre3',
      cas: R`Matrice explicite : on veut $\Sp(A)$`, debut: R`$n = 2$ : écrire $X^2 - \tr(A)X + \det A$. Sinon, dans $\det(XI_n - A)$, <b>faire des opérations sur lignes/colonnes</b> pour factoriser <b>avant</b> de développer.`,
      quand: R`<p>On demande le spectre d'une matrice explicite $A \in \M_n(\K)$ (en général $n \le 4$).</p>`,
      etapes: [
        R`Si $n = 2$ : écrire directement $\chi_A = X^2 - \tr(A)X + \det(A)$.`,
        R`Sinon calculer $\det(XI_n - A)$ en <strong>faisant apparaître des zéros ou un facteur commun avant de développer</strong> : $C_1 \leftarrow C_1 + C_2 + \dots$ si les sommes de lignes sont constantes, $L_i \leftarrow L_i - L_j$ si deux lignes se ressemblent…`,
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
      quand: R`<p>On connaît une valeur propre $\lambda$ et on veut une base de $E_\lambda(A)$.</p>`,
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
      pieges: [
        R`Confondre $E_\lambda(A)$ (sous-espace de $\K^n$) et l'image de $A - \lambda I_n$.`,
        R`Donner un vecteur nul dans une « base ».`
      ]
    },
    {
      title: 'Montrer qu’un scalaire est valeur propre sans calculer χ', gen: 'testvec',
      cas: R`Vérifier qu'un $\lambda$ est valeur propre, ou trouver une valeur propre « évidente »`, debut: R`<b>Chercher un vecteur</b> $X \neq 0$ avec $AX = \lambda X$ (sommes de lignes égales à $s$ ⇒ $X = (1, \dots, 1)$), ou montrer $\rg(A - \lambda I_n) < n$.`,
      quand: R`<p>On veut juste vérifier qu'un $\lambda$ donné est valeur propre, ou on cherche une valeur propre « évidente ».</p>`,
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
      quand: R`<p>L'énoncé donne une relation du type $u^2 - 3u + 2\Id = 0$, $u^p = 0$, $u^3 = u$… sans donner de matrice.</p>`,
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
      quand: R`<p>$u$ agit sur $\K_n[X]$, $\K[X]$ ou un espace de fonctions ($P \mapsto P'$, $P \mapsto XP'$, $f \mapsto f'$…).</p>`,
      etapes: [
        R`Écrire l'équation $u(P) = \lambda P$ et raisonner sur le <strong>degré</strong> ou le <strong>coefficient dominant</strong>.`,
        R`En dimension finie, calculer l'image des vecteurs de la base canonique : si la matrice est triangulaire, les valeurs propres se lisent sur la diagonale.`,
        R`Pour des fonctions, $u(f) = \lambda f$ devient souvent une équation différentielle à résoudre.`
      ],
      exemple: {
        enonce: R`<p>Valeurs propres de $u : P \mapsto (X+1)P'$ sur $\R_2[X]$.</p>`,
        solution: R`<p>$u(1) = 0$, $u(X) = X + 1$, $u(X^2) = 2X^2 + 2X$. Matrice dans $(1, X, X^2)$ : $\begin{pmatrix} 0 & 1 & 0 \\ 0 & 1 & 2 \\ 0 & 0 & 2\end{pmatrix}$, triangulaire : $\Sp(u) = \{0, 1, 2\}$. (Vecteurs propres : $1$, $X+1$, $(X+1)^2$.)</p>`
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
      { titre: 'Trouver les valeurs propres', faire: R`Calculer $\chi_A = \det(XI_n - A)$ et le <b>factoriser</b>, ou résoudre $u(x) = \lambda x$.`,
        questions: [R`Dimension 2 ? → $X^2 - \tr(A)X + \det A$.`, R`Une valeur propre « évidente » ?`] },
      { titre: 'Trouver les sous-espaces propres', faire: R`Pour chaque $\lambda$ : résoudre $(A - \lambda I_n)X = 0$ par <b>échelonnement</b> ; $\dim E_\lambda = n - \rg(A - \lambda I_n)$.` },
      { titre: 'Vérifier et conclure', faire: R`Contrôler : <b>$\sum m_k\lambda_k = \tr A$</b>, $\prod \lambda_k^{m_k} = \det A$, $1 \le \dim E_\lambda \le m(\lambda)$, $AX = \lambda X$ sur un vecteur trouvé. Préciser le corps.` }
    ]
  };
  const reperes = [
    { etape: 1, si: R`Une relation $P(u) = 0$ : $u^2 = u$, $u^p = 0$, $u^3 = u$…`, alors: R`Prendre un vecteur propre $x$ et <b>appliquer la relation à $x$</b> : $P(\lambda)\,x = 0$ donc $P(\lambda) = 0$.`, ex: R`$u^2 = u$ ⇒ $\lambda^2 = \lambda$ ⇒ $\Sp(u) \subset \{0, 1\}$.` },
    { etape: 1, si: R`Un espace de polynômes $\K_n[X]$`, alors: R`Calculer les images de la <b>base canonique</b> $u(X^k)$ et écrire la matrice ; ou comparer les <b>degrés</b> dans $u(P) = \lambda P$.`, ex: R`$P \mapsto XP'$ : $u(X^k) = kX^k$, matrice diagonale, $\Sp = \{0, \dots, n\}$.` },
    { etape: 1, si: R`Un espace de fonctions ($f \mapsto f'$, $f \mapsto xf'$…)`, alors: R`Écrire $u(f) = \lambda f$ : c'est une <b>équation différentielle</b> à résoudre.`, ex: R`$f' = \lambda f$ ⇒ $f(x) = Ce^{\lambda x}$ : tout $\lambda$ est valeur propre.` },
    { etape: 1, si: R`Une matrice réelle et une question sur $\C$`, alors: R`Les valeurs propres non réelles viennent par <b>paires conjuguées</b> $\lambda, \bar\lambda$, avec des vecteurs propres conjugués.`, ex: R`$\begin{pmatrix}0&-1\\1&0\end{pmatrix}$ : $\Sp_\C = \{i, -i\}$, $\Sp_\R = \varnothing$.` },
    { etape: 2, si: R`Des sommes de lignes toutes égales à $s$`, alors: R`$s$ est valeur propre de vecteur $(1, \dots, 1)$ ; dans $\det(XI - A)$, faire <b>$C_1 \leftarrow C_1 + C_2 + \dots + C_n$</b> pour factoriser $X - s$.` },
    { etape: 2, si: R`Deux lignes (ou deux colonnes) proportionnelles`, alors: R`$\rg A < n$, donc <b>$0$ est valeur propre</b>.` },
    { etape: 2, si: R`Une matrice triangulaire (ou triangulaire par blocs)`, alors: R`Les valeurs propres se lisent sur la <b>diagonale</b> (ou sont celles des blocs diagonaux).` },
    { etape: 2, si: R`Beaucoup de coefficients égaux : $A = bI_n + aJ$ ($J$ = que des $1$)`, alors: R`Utiliser $\Sp(J) = \{n, 0\}$ : les valeurs propres de $A$ sont <b>$b + an$</b> (simple) et <b>$b$</b> (multiplicité $n - 1$).`, ex: R`$\begin{pmatrix}3&1&1\\1&3&1\\1&1&3\end{pmatrix} = 2I + J$ : $\Sp = \{5, 2\}$.` },
    { etape: 2, si: R`Un polynôme caractéristique de degré 3 déjà développé`, alors: R`Chercher une <b>racine évidente</b> parmi les diviseurs du terme constant, puis factoriser par $X - \lambda$.` },
    { etape: 2, si: R`Un paramètre $a$ dans la matrice`, alors: R`Factoriser $\chi$ en gardant $a$, puis <b>discuter</b> : racines distinctes, confondues, réelles ou non.` },
    { etape: 3, si: R`$A - \lambda I_n$ de rang $1$ (lignes proportionnelles)`, alors: R`<b>Une seule équation</b> : $\dim E_\lambda = n - 1$.` },
    { etape: 3, si: R`Une valeur propre complexe en dimension 2`, alors: R`Une <b>seule ligne</b> de $A - \lambda I_2$ suffit (l'autre lui est proportionnelle) : vecteur $(-q, p)$ pour la ligne $(p\ q)$.` },
    { etape: 3, si: R`On trouve $E_\lambda = \{0\}$`, alors: R`C'est une <b>erreur</b> : $\lambda$ n'est pas valeur propre ou le calcul est faux. Revérifier $\chi(\lambda) = 0$.` },
    { etape: 4, si: R`Une valeur propre <b>simple</b>`, alors: R`Sans calcul : <b>$\dim E_\lambda = 1$</b>.` },
    { etape: 4, si: R`Un doute sur le résultat`, alors: R`Calculer $AX$ pour un vecteur trouvé (on doit obtenir $\lambda X$) et vérifier <b>$\sum \lambda_i = \tr A$</b>.` }
  ];

  L2.chapter('algebre3', 'vp', {
    intro: R`<p>Dans tout le chapitre, $\K$ désigne $\R$ ou $\C$, $E$ un $\K$-espace vectoriel et $u \in \Lin(E)$. L'objectif est de trouver les directions de $E$ que $u$ se contente de <em>dilater</em> : c'est la première étape de la réduction des endomorphismes, qui sera achevée au chapitre suivant (diagonalisation).</p>`,
    cours, fiche, exercices, methodes, generateurs, plan, reperes
  });
})();
