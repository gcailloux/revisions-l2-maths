/* Analyse 3 — Chapitre 2 : Séries numériques */
(function () {
  'use strict';
  const R = String.raw;
  const { F, poly } = ML;

  /* ------------------------------------------------------------------ */
  /* Générateurs                                                         */
  /* ------------------------------------------------------------------ */
  function posPoly(r, deg) { // coefficients > 0 (pas de racine positive)
    const c = [];
    for (let i = 0; i <= deg; i++) c.push(i === deg ? r.int(1, 4) : r.int(0, 5));
    if (deg > 0 && c[0] === 0) c[0] = r.int(1, 3);
    return c;
  }
  const generateurs = {
    rationnelle: {
      title: 'Nature par équivalent (fraction rationnelle)', diff: 1,
      make(r) {
        const form = r.pick(['rat', 'rat', 'sqrt']);
        if (form === 'rat') {
          const p = r.int(0, 2), q = p + r.int(0, 3);
          const P = posPoly(r, p), Q = posPoly(r, q);
          const a = P[p], b = Q[q], al = q - p;
          const mono = (c, k) => (k === 0 ? String(c) : (c === 1 ? '' : c) + 'n' + (k > 1 ? '^{' + k + '}' : ''));
          const ab = F(a, b);
          const eq = al === 0 ? ab.tex() : (ab.isOne() ? '' : ab.tex() + R`\cdot`) + R`\dfrac{1}{${mono(1, al)}}`;
          let concl;
          if (al === 0) concl = R`<p>Ainsi $u_n \to ${F(a, b).tex()} \neq 0$ : la série <strong>diverge grossièrement</strong>.</p>`;
          else if (al === 1) concl = R`<p>La série de Riemann $\sum \frac1n$ diverge ($\alpha = 1$). Les termes étant positifs, par le théorème des équivalents, $\sum u_n$ <strong>diverge</strong>.</p>`;
          else concl = R`<p>La série de Riemann $\sum \frac{1}{n^{${al}}}$ converge ($\alpha = ${al} > 1$). Les termes étant positifs, par le théorème des équivalents, $\sum u_n$ <strong>converge</strong>.</p>`;
          return {
            enonce: R`<p>Déterminer la nature de la série de terme général $\displaystyle u_n = \frac{${poly(P, 'n')}}{${poly(Q, 'n')}}$, $n \ge 1$.</p>`,
            indication: R`<p>Les termes sont positifs : cherchez un équivalent simple de $u_n$ (quotient des termes de plus haut degré).</p>`,
            correction: R`<p>Pour $n \ge 1$, $u_n > 0$. Un polynôme est équivalent en $+\infty$ à son terme de plus haut degré :</p>
              $$u_n \underset{n\to\infty}{\sim} \frac{${mono(a, p)}}{${mono(b, q)}} = ${eq}.$$${concl}`
          };
        }
        // forme avec racine carrée : (sqrt(n) + c) / (a n^k + d)
        const k = r.int(1, 3), c = r.int(1, 5), aa = r.int(1, 3), d = r.int(1, 6);
        const al = F(2 * k - 1, 2);
        const conv = al.val() > 1;
        return {
          enonce: R`<p>Déterminer la nature de la série de terme général $\displaystyle u_n = \frac{\sqrt{n} + ${c}}{${aa === 1 ? '' : aa}n${k > 1 ? '^{' + k + '}' : ''} + ${d}}$.</p>`,
          indication: R`<p>Écrire $u_n \sim \dfrac{C}{n^\alpha}$ et comparer $\alpha$ à $1$.</p>`,
          correction: R`<p>$u_n > 0$ et $u_n \sim \dfrac{\sqrt n}{${aa === 1 ? '' : aa}n${k > 1 ? '^{' + k + '}' : ''}} = \dfrac{1}{${aa === 1 ? '' : aa}\,n^{${al.texSlash()}}}$.</p>
            <p>Série de Riemann d'exposant $\alpha = ${al.texSlash()}$ : ${conv ? R`$\alpha > 1$, elle converge` : R`$\alpha \le 1$, elle diverge`}. Par équivalence de séries à termes positifs, $\sum u_n$ <strong>${conv ? 'converge' : 'diverge'}</strong>.</p>`
        };
      }
    },

    alembert: {
      title: 'Règle de d’Alembert', diff: 2,
      make(r) {
        const form = r.pick(['expfact', 'geompoly', 'factexp', 'central']);
        if (form === 'expfact') {
          const a = r.int(2, 9);
          return {
            enonce: R`<p>Nature de la série $\displaystyle\sum_{n\ge0} \frac{${a}^n}{n!}$ ?</p>`,
            correction: R`<p>$u_n > 0$ et $\dfrac{u_{n+1}}{u_n} = \dfrac{${a}^{n+1}}{(n+1)!}\cdot\dfrac{n!}{${a}^n} = \dfrac{${a}}{n+1} \longrightarrow 0 < 1$. D'après la règle de d'Alembert, la série <strong>converge</strong> (sa somme vaut $e^{${a}}$, cf. séries entières).</p>`
          };
        }
        if (form === 'geompoly') {
          const k = r.int(1, 4);
          let p, q;
          do { q = r.int(2, 7); p = r.int(1, 9); } while (p === q);
          const l = F(p, q);
          const conv = l.val() < 1;
          return {
            enonce: R`<p>Nature de la série $\displaystyle\sum_{n\ge1} n^{${k}}\left(${l.tex()}\right)^n$ ?</p>`,
            correction: R`<p>$u_n > 0$ et $\dfrac{u_{n+1}}{u_n} = \left(\dfrac{n+1}{n}\right)^{${k}}\cdot ${l.tex()} \longrightarrow ${l.tex()}$.</p>
              <p>${conv ? R`Comme $${l.tex()} < 1$, la série <strong>converge</strong> par la règle de d'Alembert.` : R`Comme $${l.tex()} > 1$, la série <strong>diverge</strong> (grossièrement : $u_n \to +\infty$).`}</p>`
          };
        }
        if (form === 'factexp') {
          const a = r.int(2, 10);
          return {
            enonce: R`<p>Nature de la série $\displaystyle\sum_{n\ge0} \frac{n!}{${a}^n}$ ?</p>`,
            correction: R`<p>$\dfrac{u_{n+1}}{u_n} = \dfrac{n+1}{${a}} \longrightarrow +\infty > 1$ : la série <strong>diverge</strong> (grossièrement, car $(u_n)$ est croissante à partir d'un certain rang et ne tend pas vers $0$).</p>`
          };
        }
        const a = r.pick([1, 2, 3, 5, 6, 7]);
        const l = F(a, 4), conv = a < 4;
        return {
          enonce: R`<p>Nature de la série $\displaystyle\sum_{n\ge0} \frac{(n!)^2}{(2n)!}\,${a === 1 ? '' : a + '^n'}$ ?</p>`.replace(R`\,$`, '$'),
          indication: R`<p>$(2n+2)! = (2n+2)(2n+1)\,(2n)!$.</p>`,
          correction: R`<p>$\dfrac{u_{n+1}}{u_n} = \dfrac{(n+1)^2}{(2n+2)(2n+1)}${a === 1 ? '' : R`\cdot ${a}`} = \dfrac{${a === 1 ? '' : a}(n+1)}{2(2n+1)} \longrightarrow ${l.tex()}$.</p>
            <p>${conv ? R`$${l.tex()} < 1$ : la série <strong>converge</strong> (d'Alembert).` : R`$${l.tex()} > 1$ : la série <strong>diverge</strong> (d'Alembert).`}</p>`
        };
      }
    },

    geometrique: {
      title: 'Somme d’une série géométrique', diff: 1,
      make(r) {
        let p, q;
        do { q = r.int(2, 9); p = r.nz(-q + 1, q - 1); } while (F(p, q).d === 1);
        const x = F(p, q), n0 = r.int(0, 3), c = r.pick([1, 1, 2, 3, 5]);
        const numV = x.pow(n0).mul(c), den = F(1).sub(x);
        const S = numV.div(den);
        const ctex = c === 1 ? '' : c;
        const parts = [];
        if (c !== 1) parts.push(c);
        if (n0 > 0) parts.push(n0 === 1 ? 'q' : 'q^{' + n0 + '}');
        const numSym = parts.join(R`\,`) || '1';
        return {
          enonce: R`<p>Justifier la convergence et calculer $\displaystyle\sum_{n=${n0}}^{+\infty} ${ctex}\left(${x.tex()}\right)^n$.</p>`,
          indication: R`<p>Factoriser par le premier terme : $\sum_{n\ge n_0} q^n = \dfrac{q^{n_0}}{1-q}$ si $|q| < 1$.</p>`,
          correction: R`<p>C'est une série géométrique de raison $q = ${x.tex()}$, avec $|q| < 1$ : elle converge, et</p>
            $$\sum_{n=${n0}}^{+\infty} ${ctex}q^n = \frac{${numSym}}{1 - q} = \dfrac{${numV.tex()}}{${den.tex()}} = ${S.tex()}.$$`
        };
      }
    },

    telescopique: {
      title: 'Somme télescopique', diff: 2,
      make(r) {
        const a = r.int(0, 2), b = a + r.int(1, 3), c = r.pick([1, 1, 2, 3]);
        const dlt = b - a;
        let S = F(0);
        for (let k = a + 1; k <= b; k++) S = S.add(F(1, k));
        S = S.mul(F(c, dlt));
        const den = (s) => (s === 0 ? 'n' : 'n+' + s);
        const coef = F(c, dlt);
        const terms = [];
        for (let k = a + 1; k <= b; k++) terms.push(R`\frac{1}{${k}}`);
        return {
          enonce: R`<p>Montrer que la série $\displaystyle\sum_{n\ge1} \frac{${c}}{(${den(a)})(${den(b)})}$ converge et calculer sa somme.</p>`,
          indication: R`<p>Décomposer en éléments simples : $\dfrac{1}{(n+a)(n+b)} = \dfrac{1}{b-a}\left(\dfrac{1}{n+a} - \dfrac{1}{n+b}\right)$.</p>`,
          correction: R`<p>Décomposition : $\dfrac{${c}}{(${den(a)})(${den(b)})} = ${coef.isOne() ? '' : coef.tex()}\left(\dfrac{1}{${den(a)}} - \dfrac{1}{${den(b)}}\right)$.</p>
            <p>Somme partielle : $S_N = ${coef.isOne() ? '' : coef.tex()}\left(\displaystyle\sum_{n=1}^{N}\frac{1}{${den(a)}} - \sum_{n=1}^{N}\frac{1}{${den(b)}}\right) = ${coef.isOne() ? '' : coef.tex()}\left(\sum_{k=${a + 1}}^{${a}+N}\frac1k - \sum_{k=${b + 1}}^{${b}+N}\frac1k\right)$.</p>
            <p>Après simplification, il reste $S_N = ${coef.isOne() ? '' : coef.tex()}\left(\displaystyle\sum_{k=${a + 1}}^{${b}}\frac1k - \sum_{k=${a + 1}+N}^{${b}+N}\frac1k\right)$. La seconde somme comporte ${dlt} terme(s), chacun tendant vers $0$, donc elle tend vers $0$.</p>
            $$\sum_{n=1}^{+\infty} \frac{${c}}{(${den(a)})(${den(b)})} = ${coef.isOne() ? '' : coef.tex()}\left(${terms.join(' + ')}\right) = ${S.tex()}.$$`.replace(/\{0\+N\}/g, '{N}')
        };
      }
    },

    alternee: {
      title: 'Série alternée et reste', diff: 2,
      make(r) {
        const al = r.pick([F(1, 3), F(1, 2), F(2, 3), F(1), F(3, 2), F(2)]);
        const N = r.pick([9, 99, 999]);
        const absConv = al.val() > 1;
        const pw = al.isOne() ? 'n' : R`n^{${al.texSlash()}}`;
        const pwN = al.isOne() ? String(N + 1) : R`${N + 1}^{${al.texSlash()}}`;
        const bound = Math.pow(N + 1, -al.val());
        return {
          enonce: R`<p>Soit $u_n = \dfrac{(-1)^n}{${pw}}$ pour $n \ge 1$.</p><ol><li>La série $\sum u_n$ est-elle absolument convergente ? convergente ?</li><li>Majorer $|R_{${N}}|$, où $R_N = \sum_{n > N} u_n$, et donner le signe de $R_{${N}}$.</li></ol>`,
          correction: R`<p>1. $|u_n| = \dfrac{1}{${pw}}$ : série de Riemann d'exposant $${al.texSlash()}$, ${absConv ? R`<strong>convergente</strong> car $${al.texSlash()} > 1$ : $\sum u_n$ est absolument convergente, donc convergente.` : R`<strong>divergente</strong> car $${al.texSlash()} \le 1$ : pas de convergence absolue.`}</p>
            ${absConv ? '' : R`<p>Mais $u_n = (-1)^n a_n$ avec $a_n = \dfrac1{${pw}}$ positive, décroissante et de limite nulle : par le critère spécial des séries alternées, $\sum u_n$ <strong>converge</strong>. Elle est donc <em>semi-convergente</em>.</p>`}
            <p>2. Dans les deux cas le critère des séries alternées s'applique : $|R_{${N}}| \le a_{${N + 1}} = \dfrac{1}{${pwN}} \approx ${ML.dec(bound, bound < 0.001 ? 6 : 4)}$, et $R_{${N}}$ a le signe de son premier terme $u_{${N + 1}}$, c'est-à-dire <strong>${(N + 1) % 2 === 0 ? 'positif' : 'négatif'}</strong>.</p>`
        };
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Cours                                                               */
  /* ------------------------------------------------------------------ */
  const cours = [
    { t: 'h', title: 'Généralités' },
    { t: 'def', title: 'série, sommes partielles', body: R`
      <p>Soit $(u_n)_{n \ge 0}$ une suite réelle ou complexe. La <strong>série de terme général $u_n$</strong>, notée $\sum u_n$, est la suite $(S_n)$ des <strong>sommes partielles</strong> $\displaystyle S_n = \sum_{k=0}^{n} u_k$.</p>
      <p>On dit que $\sum u_n$ <strong>converge</strong> si $(S_n)$ converge ; sa limite est alors appelée la <strong>somme</strong> de la série et notée $\displaystyle\sum_{n=0}^{+\infty} u_n$. Sinon, la série <strong>diverge</strong>. Déterminer si une série converge ou diverge, c'est étudier sa <strong>nature</strong>.</p>` },
    { t: 'def', title: 'reste', body: R`<p>Si $\sum u_n$ converge, son <strong>reste d'ordre $n$</strong> est $\displaystyle R_n = \sum_{k=n+1}^{+\infty} u_k = S - S_n$. On a $R_n \to 0$.</p>` },
    { t: 'warn', body: R`<p>Ne pas confondre $\sum u_n$ (l'objet : la suite des sommes partielles) et $\sum_{n=0}^{+\infty}u_n$ (un nombre, qui n'a de sens <em>qu'après</em> avoir montré la convergence).</p>` },
    { t: 'prop', title: 'opérations', body: R`
      <ul>
        <li>Si $\sum u_n$ et $\sum v_n$ convergent, $\sum(\lambda u_n + \mu v_n)$ converge et sa somme vaut $\lambda\sum u_n + \mu\sum v_n$.</li>
        <li>Si $\sum u_n$ converge et $\sum v_n$ diverge, alors $\sum(u_n + v_n)$ diverge.</li>
        <li>Modifier un nombre fini de termes ne change pas la nature d'une série (mais change sa somme).</li>
      </ul>`,
      proof: R`<p>Le premier point est la linéarité de la limite appliquée aux sommes partielles. Pour le deuxième, si $\sum(u_n + v_n)$ convergeait, $\sum v_n = \sum\big((u_n + v_n) - u_n\big)$ convergerait par le premier point. Pour le troisième : si $u_n = v_n$ pour $n \ge N$, les sommes partielles diffèrent d'une constante à partir du rang $N$.</p>` },
    { t: 'prop', title: 'condition nécessaire de convergence', body: R`<p>Si $\sum u_n$ converge, alors $u_n \xrightarrow[n\to\infty]{} 0$.</p>
      <p>Une série dont le terme général ne tend pas vers $0$ est dite <strong>grossièrement divergente</strong>.</p>`,
      proof: R`<p>$u_n = S_n - S_{n-1} \to S - S = 0$.</p>` },
    { t: 'ex', title: 'la série harmonique', body: R`<p>$\sum_{n \ge 1}\frac1n$ <strong>diverge</strong>, bien que $\frac1n \to 0$ : la réciproque de la proposition est fausse.</p>`,
      sol: R`<p>$S_{2n} - S_n = \sum_{k=n+1}^{2n}\frac1k \ge n\cdot\frac{1}{2n} = \frac12$. Si $(S_n)$ convergeait vers $S$, on aurait $S_{2n} - S_n \to S - S = 0$, contradiction.</p>` },
    { t: 'thm', title: 'séries géométriques', body: R`<p>Pour $q \in \C$, la série $\sum q^n$ converge si et seulement si $|q| < 1$, et alors</p>
      $$\sum_{n=0}^{+\infty} q^n = \frac{1}{1 - q}, \qquad \sum_{n=n_0}^{+\infty} q^n = \frac{q^{n_0}}{1-q}.$$`,
      proof: R`<p>Si $|q| \ge 1$, $|q^n| \ge 1$ ne tend pas vers $0$ : divergence grossière. Si $|q| < 1$, $q \neq 1$ et $S_n = \dfrac{1 - q^{n+1}}{1 - q} \to \dfrac{1}{1-q}$ car $q^{n+1} \to 0$. La seconde formule s'obtient en factorisant par $q^{n_0}$.</p>` },
    { t: 'prop', title: 'lien suite-série (télescopage)', body: R`<p>La suite $(a_n)$ converge si et seulement si la série $\sum(a_{n+1} - a_n)$ converge, et dans ce cas $\displaystyle\sum_{n=0}^{+\infty}(a_{n+1} - a_n) = \lim a_n - a_0$.</p>`,
      proof: R`<p>$\sum_{k=0}^{n}(a_{k+1} - a_k) = a_{n+1} - a_0$ (les termes se simplifient deux à deux).</p>` },
    { t: 'ex', body: R`<ul>
      <li>$\dfrac{1}{n(n+1)} = \dfrac1n - \dfrac{1}{n+1}$, donc $\displaystyle\sum_{n=1}^{+\infty}\frac{1}{n(n+1)} = 1 - \lim\frac{1}{n+1} = 1$.</li>
      <li>$\ln\left(1 + \frac1n\right) = \ln(n+1) - \ln n$ et $\ln n \to +\infty$ : $\sum\ln\left(1 + \frac1n\right)$ <strong>diverge</strong>.</li></ul>` },

    { t: 'h', title: 'Séries à termes positifs' },
    { t: 'prop', body: R`<p>Si $u_n \ge 0$ pour tout $n$, la suite $(S_n)$ est croissante. Donc $\sum u_n$ converge si et seulement si $(S_n)$ est <strong>majorée</strong>. Sinon $S_n \to +\infty$.</p>`,
      proof: R`<p>$S_{n+1} - S_n = u_{n+1} \ge 0$. Une suite croissante converge si et seulement si elle est majorée (théorème de la limite monotone), et tend vers $+\infty$ sinon.</p>` },
    { t: 'thm', title: 'comparaison', body: R`<p>Soient $(u_n)$, $(v_n)$ avec $0 \le u_n \le v_n$ à partir d'un certain rang.</p>
      <ul><li>Si $\sum v_n$ converge, alors $\sum u_n$ converge.</li><li>Si $\sum u_n$ diverge, alors $\sum v_n$ diverge.</li></ul>`,
      proof: R`<p>Quitte à modifier un nombre fini de termes, on suppose $0 \le u_n \le v_n$ pour tout $n$. Alors $\sum_{k=0}^n u_k \le \sum_{k=0}^n v_k \le \sum_{k=0}^{+\infty} v_k$ : les sommes partielles de $\sum u_n$ sont majorées, donc la série converge. Le second point est la contraposée du premier.</p>` },
    { t: 'thm', title: 'domination et équivalents', body: R`<p>Soit $(v_n)$ une suite <strong>positive</strong>.</p>
      <ol>
        <li>Si $u_n = O(v_n)$ (ou $u_n = o(v_n)$) et $\sum v_n$ converge, alors $\sum u_n$ converge (absolument).</li>
        <li>Si $u_n \sim v_n$, alors $\sum u_n$ et $\sum v_n$ sont <strong>de même nature</strong>.</li>
      </ol>`,
      proof: R`<p>1. Il existe $M$ et $N$ tels que $|u_n| \le Mv_n$ pour $n \ge N$ ; on applique le théorème de comparaison à $|u_n|$ et $Mv_n$, puis on utilise que la convergence absolue entraîne la convergence (section 3).</p>
      <p>2. $u_n/v_n \to 1$ donc, pour $n$ assez grand, $\frac12 v_n \le u_n \le \frac32 v_n$ (en particulier $u_n \ge 0$). Si $\sum v_n$ converge, $\sum u_n$ converge par comparaison avec $\frac32 v_n$ ; si $\sum v_n$ diverge, $\sum u_n$ diverge par comparaison avec $\frac12 v_n$.</p>` },
    { t: 'warn', body: R`<p>Le théorème des équivalents exige un signe constant (à partir d'un certain rang). Il est <strong>faux</strong> pour des séries de signe quelconque : voir la section 3.</p>` },
    { t: 'thm', title: 'comparaison série–intégrale', body: R`<p>Soit $f : [n_0, +\infty[ \to \R_+$ continue et <strong>décroissante</strong>. Pour $n \ge n_0 + 1$ :</p>
      $$\int_n^{n+1} f(t)\dd t \le f(n) \le \int_{n-1}^{n} f(t)\dd t.$$
      <p>En conséquence, $\sum f(n)$ converge si et seulement si la suite $\left(\int_{n_0}^{n} f(t)\dd t\right)_n$ est majorée (i.e. converge).</p>`,
      proof: R`<p>Pour $t \in [n, n+1]$, $f(t) \le f(n)$ ; on intègre sur $[n, n+1]$. Pour $t \in [n-1, n]$, $f(t) \ge f(n)$ ; on intègre sur $[n-1, n]$. En sommant la seconde inégalité de $n_0 + 1$ à $N$ : $\sum_{n=n_0+1}^{N} f(n) \le \int_{n_0}^{N} f$, donc si les intégrales sont majorées, les sommes partielles aussi. En sommant la première de $n_0$ à $N$ : $\int_{n_0}^{N+1} f \le \sum_{n=n_0}^{N} f(n)$, donc si la série converge, les intégrales sont majorées (et croissantes car $f \ge 0$).</p>` },
    { t: 'thm', title: 'séries de Riemann', body: R`<p>Pour $\alpha \in \R$ : $\quad\displaystyle\sum_{n \ge 1}\frac{1}{n^\alpha}$ converge $\iff \alpha > 1$.</p>`,
      proof: R`<p>Si $\alpha \le 0$, $\frac1{n^\alpha} \ge 1$ : divergence grossière. Si $\alpha > 0$, $f(t) = t^{-\alpha}$ est continue, positive, décroissante sur $[1, +\infty[$, et</p>
      $$\int_1^n \frac{\dd t}{t^\alpha} = \begin{cases} \dfrac{n^{1-\alpha} - 1}{1 - \alpha} & \text{si } \alpha \neq 1, \\[2mm] \ln n & \text{si } \alpha = 1.\end{cases}$$
      <p>Cette suite est majorée si et seulement si $\alpha > 1$ (alors elle tend vers $\frac{1}{\alpha - 1}$). On conclut par la comparaison série–intégrale.</p>` },
    { t: 'rem', body: R`<p>L'encadrement donne aussi des équivalents : par exemple $H_n = \sum_{k=1}^n\frac1k \sim \ln n$, car $\ln(n+1) \le H_n \le 1 + \ln n$.</p>` },
    { t: 'cor', title: 'règle $n^\alpha u_n$', body: R`<p>Soit $u_n \ge 0$.</p>
      <ul><li>S'il existe $\alpha > 1$ tel que $n^\alpha u_n \to 0$ (ou est bornée), alors $\sum u_n$ converge.</li>
      <li>Si $n u_n \to \ell \in\, ]0, +\infty]$, alors $\sum u_n$ diverge.</li></ul>`,
      proof: R`<p>Premier cas : $u_n = O(1/n^\alpha)$ avec $\alpha > 1$. Second cas : à partir d'un certain rang $u_n \ge \frac{c}{n}$ avec $c > 0$, et $\sum\frac cn$ diverge.</p>` },
    { t: 'ex', body: R`<p>$\sum e^{-\sqrt n}$ converge car $n^2 e^{-\sqrt n} \to 0$ (croissances comparées). $\sum\frac{\ln n}{n}$ diverge car $n\cdot\frac{\ln n}{n} = \ln n \to +\infty$.</p>` },
    { t: 'thm', title: "règle de d'Alembert", body: R`<p>Soit $u_n > 0$ tel que $\dfrac{u_{n+1}}{u_n} \to \ell \in [0, +\infty]$.</p>
      <ul><li>Si $\ell < 1$, $\sum u_n$ converge.</li><li>Si $\ell > 1$, $\sum u_n$ diverge grossièrement.</li><li>Si $\ell = 1$, on ne peut pas conclure.</li></ul>`,
      proof: R`<p>Si $\ell < 1$, soit $q \in\, ]\ell, 1[$. À partir d'un rang $N$, $u_{n+1} \le q\,u_n$, donc par récurrence $u_n \le u_N q^{n-N}$ pour $n \ge N$ : on compare à la série géométrique convergente $\sum q^n$.</p>
      <p>Si $\ell > 1$, à partir d'un rang $N$, $u_{n+1} \ge u_n$ : la suite $(u_n)$ est croissante et strictement positive, elle ne tend pas vers $0$.</p>
      <p>Si $\ell = 1$ : $\sum\frac1n$ diverge et $\sum\frac1{n^2}$ converge, et les deux ont $\ell = 1$.</p>` },
    { t: 'ex', body: R`<p>$u_n = \dfrac{n!}{n^n}$ : $\dfrac{u_{n+1}}{u_n} = \dfrac{(n+1)\,n^n}{(n+1)^{n+1}} = \left(\dfrac{n}{n+1}\right)^n = \left(1 + \dfrac1n\right)^{-n} \to e^{-1} < 1$ : la série converge.</p>` },

    { t: 'h', title: 'Séries à termes quelconques' },
    { t: 'def', body: R`<p>La série $\sum u_n$ est dite <strong>absolument convergente</strong> si $\sum|u_n|$ converge.</p>` },
    { t: 'thm', body: R`<p>Toute série absolument convergente est convergente, et $\displaystyle\left|\sum_{n=0}^{+\infty}u_n\right| \le \sum_{n=0}^{+\infty}|u_n|$.</p>`,
      proof: R`<p>Cas réel : posons $u_n^+ = \max(u_n, 0)$ et $u_n^- = \max(-u_n, 0)$. On a $0 \le u_n^\pm \le |u_n|$, donc $\sum u_n^+$ et $\sum u_n^-$ convergent par comparaison ; et $u_n = u_n^+ - u_n^-$, donc $\sum u_n$ converge. Cas complexe : $|\mathrm{Re}\,u_n| \le |u_n|$ et $|\mathrm{Im}\,u_n| \le |u_n|$, on applique le cas réel aux parties réelle et imaginaire. L'inégalité s'obtient en passant à la limite dans $|S_n| \le \sum_{k=0}^n|u_k|$.</p>` },
    { t: 'def', body: R`<p>Une série convergente mais non absolument convergente est dite <strong>semi-convergente</strong>.</p>` },
    { t: 'thm', title: 'critère spécial des séries alternées', body: R`<p>Soit $u_n = (-1)^n a_n$ avec $(a_n)$ <strong>positive, décroissante, de limite nulle</strong>. Alors $\sum u_n$ converge, et pour tout $n$, le reste $R_n = \sum_{k > n} u_k$ vérifie</p>
      $$|R_n| \le a_{n+1} \quad\text{et}\quad R_n \text{ a le signe de } u_{n+1}.$$`,
      proof: R`<p>On a $S_{2n+2} - S_{2n} = a_{2n+2} - a_{2n+1} \le 0$ et $S_{2n+3} - S_{2n+1} = a_{2n+2} - a_{2n+3} \ge 0$ : $(S_{2n})$ décroît, $(S_{2n+1})$ croît, et $S_{2n+1} - S_{2n} = -a_{2n+1} \to 0$. Ces suites sont adjacentes, donc convergent vers une même limite $S$ : $(S_n)$ converge vers $S$, avec $S_{2n+1} \le S \le S_{2n}$ pour tout $n$.</p>
      <p>Ainsi $R_{2n} = S - S_{2n} \in [S_{2n+1} - S_{2n}, 0] = [-a_{2n+1}, 0]$ : $R_{2n}$ est du signe de $u_{2n+1} = -a_{2n+1}$ et $|R_{2n}| \le a_{2n+1}$. Le cas impair est analogue avec $S_{2n+1} \le S \le S_{2n+2}$.</p>` },
    { t: 'ex', title: 'série harmonique alternée', body: R`<p>$\sum_{n\ge1}\frac{(-1)^{n+1}}{n}$ converge par le critère spécial, mais pas absolument : elle est semi-convergente. (Sa somme vaut $\ln 2$.) De plus $|R_n| \le \frac{1}{n+1}$.</p>` },
    { t: 'warn', title: 'les équivalents ne suffisent plus', body: R`<p>Soit $u_n = \dfrac{(-1)^n}{\sqrt n} + \dfrac1n$. Alors $u_n \sim \dfrac{(-1)^n}{\sqrt n}$ et $\sum\frac{(-1)^n}{\sqrt n}$ converge (critère spécial). Pourtant $\sum u_n$ <strong>diverge</strong> : c'est la somme d'une série convergente et de la série harmonique divergente.</p>` },
    { t: 'meth', title: 'développement asymptotique', body: R`<p>Pour une série de signe non constant qui n'est ni absolument convergente ni directement alternée, on écrit un <strong>développement asymptotique</strong> $u_n = v_n + w_n$ avec $\sum v_n$ convergente (souvent alternée) et $w_n$ de signe constant, que l'on traite par équivalent.</p>` }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche                                                               */
  /* ------------------------------------------------------------------ */
  const fiche = [
    { k: 'thm', t: 'Séries de Riemann', prio: true,
      key: R`$$\sum \frac{1}{n^\alpha} \text{ converge} \iff \alpha > 1$$`,
      b: R`<p>La <b>référence</b> pour comparer : on cherche presque toujours $u_n \sim \frac{C}{n^\alpha}$.</p>` },
    { k: 'prop', t: 'Condition nécessaire', prio: true,
      key: R`<p>$\sum u_n$ converge $\Rightarrow$ <mark>$u_n \to 0$</mark></p>`,
      b: R`<p>Si $u_n \not\to 0$ : <b>divergence grossière</b>. Réciproque <b>fausse</b> : $\sum \frac1n$ diverge.</p>` },
    { k: 'form', t: 'Série géométrique', prio: true,
      key: R`$$\sum_{n \ge 0} q^n = \frac{1}{1-q} \quad (|q| < 1)$$`,
      b: R`<p>$\sum_{n\ge n_0} q^n = \dfrac{q^{n_0}}{1-q}$ = $\dfrac{\text{premier terme}}{1 - q}$. Diverge si $|q| \ge 1$.</p>` },
    { k: 'thm', t: 'Équivalents (termes positifs)', prio: true,
      key: R`<p>$u_n \sim v_n$ et <mark>$v_n \ge 0$</mark> ⇒ <b>même nature</b></p>`,
      b: R`<p>Aussi : <b>comparaison</b> $0 \le u_n \le v_n$ et <b>domination</b> $u_n = O(v_n)$.</p>` },
    { k: 'thm', t: "Règle de d'Alembert",
      key: R`<p>$\dfrac{u_{n+1}}{u_n} \to \ell$ : $\ell < 1$ CV, $\ell > 1$ DV, <mark>$\ell = 1$ : on ne sait pas</mark></p>`,
      b: R`<p>À utiliser avec des <b>factorielles</b> ou des <b>puissances $a^n$</b>. Inutile pour les fractions rationnelles.</p>` },
    { k: 'thm', t: 'Séries alternées',
      key: R`<p>$a_n \ge 0$, <b>décroissante</b>, $\to 0$ ⇒ $\sum (-1)^n a_n$ CV et <mark>$|R_n| \le a_{n+1}$</mark></p>`,
      b: R`<p>$R_n$ a le signe de son premier terme $u_{n+1}$.</p>` },
    { k: 'thm', t: 'Absolue convergence',
      key: R`<p>$\sum |u_n|$ CV ⇒ $\sum u_n$ CV</p>`,
      b: R`<p>Et $\left|\sum u_n\right| \le \sum |u_n|$. CV sans CV absolue : <b>semi-convergence</b>.</p>` },
    { k: 'form', t: 'Télescopage',
      key: R`<p>$\sum (a_{n+1} - a_n)$ CV $\iff (a_n)$ CV</p>`,
      b: R`<p>Somme $= \lim a_n - a_0$. Toujours calculer la somme <b>partielle</b> $S_N$.</p>` },
    { k: 'thm', t: 'Comparaison série–intégrale',
      key: R`<p>$f \ge 0$ <b>décroissante</b> : $\displaystyle\int_n^{n+1}\! f \le f(n) \le \int_{n-1}^{n}\! f$</p>`,
      b: R`<p>$\sum f(n)$ et $\int f$ de même nature. Donne aussi des équivalents : $H_n \sim \ln n$.</p>` },
    { k: 'cor', t: 'Règle $n^\alpha u_n$',
      key: R`<p>$n^\alpha u_n \to 0$ avec $\alpha > 1$ ⇒ CV</p>`,
      b: R`<p>$n u_n \to \ell > 0$ ⇒ DV. Utile avec $\ln$ ou $e^{-\sqrt n}$.</p>` },
    { k: 'form', t: 'Équivalents usuels en 0',
      key: R`<p>$\ln(1+x) \sim x$, $\ e^x - 1 \sim x$, $\ \sin x \sim x$</p>`,
      b: R`<p>$1 - \cos x \sim \frac{x^2}{2}$, $\ (1+x)^a - 1 \sim ax$.</p>` },
    { k: 'warn', t: 'Pièges',
      key: R`<ul><li>Équivalents <b>interdits</b> si le signe n'est pas constant.</li><li>D'Alembert avec $\ell = 1$ : <b>aucune</b> conclusion.</li><li>Ne pas séparer $\sum(a_n - a_{n+1})$ en deux séries divergentes.</li></ul>` }
  ];

  /* ------------------------------------------------------------------ */
  /* Exercices                                                           */
  /* ------------------------------------------------------------------ */
  const exercices = [
    {
      id: 'equivalents', title: 'Nature par équivalents', diff: 1, gen: 'rationnelle',
      enonce: R`<p>Déterminer la nature des séries de termes généraux :</p>
        <p>$\text{a) } u_n = \ln\left(1 + \dfrac{1}{n^2}\right) \qquad \text{b) } v_n = 1 - \cos\dfrac1n \qquad \text{c) } w_n = \sin\dfrac1n \qquad \text{d) } x_n = \dfrac{n^2 + 1}{n^4 - n + 3}$</p>`,
      indication: R`<p>Tous ces termes sont positifs (à partir d'un certain rang) : utiliser les équivalents usuels en $0$.</p>`,
      correction: R`<ul>
        <li>a) $\frac1{n^2} \to 0$ donc $u_n \sim \frac{1}{n^2}$ ($\ln(1+x) \sim x$) : Riemann $\alpha = 2 > 1$, <strong>converge</strong>.</li>
        <li>b) $v_n \sim \frac{1}{2n^2}$ : <strong>converge</strong>.</li>
        <li>c) $w_n > 0$ pour $n \ge 1$ et $w_n \sim \frac1n$ : <strong>diverge</strong>.</li>
        <li>d) $x_n > 0$ et $x_n \sim \frac{n^2}{n^4} = \frac1{n^2}$ : <strong>converge</strong>.</li></ul>`
    },
    {
      id: 'dalembert', title: "Règle de d'Alembert", diff: 2, gen: 'alembert',
      enonce: R`<p>Déterminer la nature de $\displaystyle\sum_{n\ge1}\frac{n^3}{3^n}$ et de $\displaystyle\sum_{n\ge1}\frac{2^n\,n!}{n^n}$.</p>`,
      correction: R`<p>1. $\dfrac{u_{n+1}}{u_n} = \left(\dfrac{n+1}{n}\right)^3\cdot\dfrac13 \to \dfrac13 < 1$ : <strong>converge</strong>.</p>
        <p>2. $\dfrac{u_{n+1}}{u_n} = \dfrac{2(n+1)\,n^n}{(n+1)^{n+1}} = 2\left(\dfrac{n}{n+1}\right)^n = 2\left(1 + \dfrac1n\right)^{-n} \to \dfrac2e < 1$ : <strong>converge</strong>. (Avec $3^n$ au lieu de $2^n$, on aurait $\frac3e > 1$ : divergence.)</p>`
    },
    {
      id: 'somme-geom', title: 'Calculs de sommes géométriques', diff: 1, gen: 'geometrique',
      enonce: R`<p>Calculer $\displaystyle\sum_{n=0}^{+\infty}\frac{2^n + (-1)^n}{3^n}$ et $\displaystyle\sum_{n=2}^{+\infty}\frac{1}{4^n}$.</p>`,
      correction: R`<p>1. Les séries $\sum(2/3)^n$ et $\sum(-1/3)^n$ convergent ($|q| < 1$), donc par linéarité :
        $\displaystyle\sum_{n=0}^{+\infty}\frac{2^n + (-1)^n}{3^n} = \frac{1}{1 - 2/3} + \frac{1}{1 + 1/3} = 3 + \frac34 = \frac{15}{4}.$</p>
        <p>2. $\displaystyle\sum_{n=2}^{+\infty}\left(\frac14\right)^n = \frac{(1/4)^2}{1 - 1/4} = \frac{1/16}{3/4} = \frac1{12}$.</p>`
    },
    {
      id: 'telescope', title: 'Somme télescopique', diff: 2, gen: 'telescopique',
      enonce: R`<p>Montrer que $\displaystyle\sum_{n\ge1}\frac{1}{n(n+1)(n+2)}$ converge et calculer sa somme.</p>`,
      indication: R`<p>Écrire $\dfrac{1}{n(n+1)(n+2)} = \dfrac12\left(\dfrac{1}{n(n+1)} - \dfrac{1}{(n+1)(n+2)}\right)$.</p>`,
      correction: R`<p>On vérifie : $\dfrac{1}{n(n+1)} - \dfrac{1}{(n+1)(n+2)} = \dfrac{(n+2) - n}{n(n+1)(n+2)} = \dfrac{2}{n(n+1)(n+2)}$.</p>
        <p>Avec $a_n = \dfrac{1}{n(n+1)}$, on a $u_n = \frac12(a_n - a_{n+1})$, donc $S_N = \frac12(a_1 - a_{N+1}) \to \frac12 a_1 = \frac12\cdot\frac12 = \frac14$.</p>
        $$\sum_{n=1}^{+\infty}\frac{1}{n(n+1)(n+2)} = \frac14.$$`
    },
    {
      id: 'bertrand', title: 'Séries de Bertrand (cas particuliers)', diff: 2,
      enonce: R`<p>À l'aide d'une comparaison série–intégrale, étudier la nature de $\displaystyle\sum_{n\ge2}\frac{1}{n\ln n}$ et $\displaystyle\sum_{n\ge2}\frac{1}{n(\ln n)^2}$.</p>`,
      correction: R`<p>$f(t) = \frac{1}{t\ln t}$ est continue, positive et décroissante sur $[2, +\infty[$ (produit de deux fonctions positives croissantes au dénominateur). $\int_2^n\frac{\dd t}{t\ln t} = \big[\ln(\ln t)\big]_2^n = \ln\ln n - \ln\ln 2 \to +\infty$ : la première série <strong>diverge</strong>.</p>
        <p>$g(t) = \frac{1}{t(\ln t)^2}$ est aussi continue, positive, décroissante, et $\int_2^n\frac{\dd t}{t(\ln t)^2} = \left[-\frac{1}{\ln t}\right]_2^n = \frac{1}{\ln 2} - \frac1{\ln n} \le \frac1{\ln 2}$ : la seconde série <strong>converge</strong>.</p>`,
      similaires: [
        {
          title: 'Encadrement de la série harmonique',
          enonce: R`<p>Soit $H_n = \sum_{k=1}^n\frac1k$. Montrer que $\ln(n+1) \le H_n \le 1 + \ln n$, et en déduire $H_n \sim \ln n$.</p>`,
          correction: R`<p>$t \mapsto 1/t$ est décroissante : $\int_k^{k+1}\frac{\dd t}{t} \le \frac1k \le \int_{k-1}^k\frac{\dd t}{t}$. On somme la première inégalité pour $k = 1..n$ : $\ln(n+1) \le H_n$. On somme la seconde pour $k = 2..n$ et on ajoute $1$ : $H_n \le 1 + \ln n$. Comme $\ln(n+1) \sim \ln n$ et $1 + \ln n \sim \ln n$, le théorème des gendarmes appliqué à $H_n/\ln n$ donne $H_n \sim \ln n$.</p>`
        },
        {
          title: 'Reste de la série de Riemann α = 2',
          enonce: R`<p>Montrer que $R_n = \sum_{k > n}\frac{1}{k^2}$ vérifie $\frac{1}{n+1} \le R_n \le \frac1n$, et en déduire un équivalent de $R_n$.</p>`,
          correction: R`<p>Par décroissance de $t \mapsto 1/t^2$ : $\int_k^{k+1}\frac{\dd t}{t^2} \le \frac1{k^2} \le \int_{k-1}^{k}\frac{\dd t}{t^2}$. En sommant pour $k \ge n+1$ (intégrales convergentes) : $\int_{n+1}^{+\infty}\frac{\dd t}{t^2} = \frac{1}{n+1} \le R_n \le \int_n^{+\infty}\frac{\dd t}{t^2} = \frac1n$. Donc $R_n \sim \frac1n$.</p>`
        }
      ]
    },
    {
      id: 'alternee', title: 'Une série alternée', diff: 2, gen: 'alternee',
      enonce: R`<p>Étudier la convergence et la convergence absolue de $\displaystyle\sum_{n\ge1}\frac{(-1)^n}{\sqrt n}$. Montrer que $\sum u_n$ peut converger sans que $\sum u_n^2$ converge.</p>`,
      correction: R`<p>$\frac{1}{\sqrt n}$ est positive, décroissante, de limite nulle : par le critère spécial, la série <strong>converge</strong>. Mais $\left|\frac{(-1)^n}{\sqrt n}\right| = \frac{1}{n^{1/2}}$ : Riemann $\alpha = \frac12 \le 1$, donc pas de convergence absolue (semi-convergence).</p>
        <p>Avec $u_n = \frac{(-1)^n}{\sqrt n}$ : $\sum u_n$ converge mais $u_n^2 = \frac1n$ et $\sum u_n^2$ diverge.</p>`
    },
    {
      id: 'piege', title: 'Le piège des équivalents', diff: 3,
      enonce: R`<p>Soit $u_n = \dfrac{(-1)^n}{\sqrt n + (-1)^n}$ pour $n \ge 2$.</p>
        <ol><li>Montrer que $u_n \sim \dfrac{(-1)^n}{\sqrt n}$.</li><li>Écrire un développement $u_n = \dfrac{(-1)^n}{\sqrt n} - \dfrac1n + O\left(\dfrac{1}{n^{3/2}}\right)$.</li><li>En déduire la nature de $\sum u_n$. Conclusion ?</li></ol>`,
      indication: R`<p>Factoriser par $\sqrt n$ : $u_n = \dfrac{(-1)^n}{\sqrt n}\cdot\dfrac{1}{1 + \frac{(-1)^n}{\sqrt n}}$, et utiliser $\frac1{1+x} = 1 - x + O(x^2)$.</p>`,
      correction: R`<p>1. $u_n = \dfrac{(-1)^n}{\sqrt n}\cdot\dfrac{1}{1 + (-1)^n/\sqrt n}$ et le second facteur tend vers $1$.</p>
        <p>2. Avec $x = \frac{(-1)^n}{\sqrt n} \to 0$ : $u_n = x(1 - x + O(x^2)) = \frac{(-1)^n}{\sqrt n} - \frac{1}{n} + O\left(\frac{1}{n^{3/2}}\right)$, car $x^2 = \frac1n$.</p>
        <p>3. $\sum\frac{(-1)^n}{\sqrt n}$ converge (critère spécial), $\sum O(n^{-3/2})$ converge absolument (domination par Riemann $\frac32 > 1$), et $\sum\frac1n$ diverge. Donc $\sum u_n$ <strong>diverge</strong>, alors que $u_n \sim \frac{(-1)^n}{\sqrt n}$, terme général d'une série convergente : le théorème des équivalents ne s'applique pas sans hypothèse de signe.</p>`
    },
    {
      id: 'calcul-somme', title: 'Calcul de $\\sum n/2^n$', diff: 2,
      enonce: R`<p>Montrer que $\sum_{n\ge0}\frac{n}{2^n}$ converge, puis calculer sa somme en étudiant $S_N - \frac12 S_N$, où $S_N = \sum_{n=0}^N\frac{n}{2^n}$.</p>`,
      correction: R`<p>Convergence : $\frac{u_{n+1}}{u_n} = \frac{n+1}{2n} \to \frac12 < 1$ (d'Alembert).</p>
        <p>$S_N - \frac12 S_N = \sum_{n=0}^{N}\frac{n}{2^n} - \sum_{n=0}^{N}\frac{n}{2^{n+1}} = \sum_{n=1}^{N}\frac{n}{2^n} - \sum_{n=1}^{N+1}\frac{n-1}{2^{n}} = \sum_{n=1}^{N}\frac{1}{2^n} - \frac{N}{2^{N+1}}$.</p>
        <p>Quand $N \to \infty$ : $\frac12 S = \sum_{n\ge1}\frac1{2^n} - 0 = 1$, donc $\displaystyle\sum_{n=0}^{+\infty}\frac{n}{2^n} = 2$.</p>`
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiches méthodes                                                     */
  /* ------------------------------------------------------------------ */
  const methodes = [
    {
      title: 'Nature d’une série à termes positifs', gen: 'rationnelle',
      cas: R`$u_n \ge 0$ : convergence ou divergence ?`, debut: R`Vérifier $u_n \to 0$, puis chercher un <b>équivalent</b> $u_n \sim \dfrac{C}{n^\alpha}$ et comparer à Riemann.`,
      quand: R`<p>$u_n \ge 0$ à partir d'un certain rang.</p>`,
      etapes: [
        R`Vérifier que $u_n \to 0$ (sinon : divergence grossière, c'est fini).`,
        R`Chercher un <strong>équivalent simple</strong> $u_n \sim \frac{C}{n^\alpha}$ (fractions rationnelles, équivalents usuels en $0$) et conclure avec Riemann.`,
        R`Si pas d'équivalent en puissance de $n$ (présence de $e^{-\sqrt n}$, $\ln$…) : règle $n^\alpha u_n$, avec $\alpha$ un peu plus grand que $1$ (par exemple $\alpha = 2$).`,
        R`Si $u_n$ contient des <strong>factorielles ou des puissances $a^n$</strong> : règle de d'Alembert.`,
        R`Si $u_n = f(n)$ avec $f$ décroissante facile à intégrer (présence de $\ln$) : comparaison série–intégrale.`
      ],
      exemple: {
        enonce: R`<p>Nature de $\sum u_n$ avec $u_n = \dfrac{\ln n}{n^{3/2}}$.</p>`,
        solution: R`<p>$u_n \ge 0$. Pas d'équivalent de la forme $C/n^\alpha$ à cause du $\ln n$. On prend $\alpha = \frac54 \in\, ]1, \frac32[$ : $n^{5/4}u_n = \dfrac{\ln n}{n^{1/4}} \to 0$ (croissances comparées). Donc $u_n = o\left(\frac{1}{n^{5/4}}\right)$ et $\sum u_n$ <strong>converge</strong>.</p>`
      },
      pieges: [R`Appliquer d'Alembert à une fraction rationnelle : on trouve toujours $\ell = 1$, donc aucune conclusion.`, R`Choisir $\alpha = \frac32$ exactement dans l'exemple : $n^{3/2}u_n = \ln n \to +\infty$, on ne peut rien dire.`]
    },
    {
      title: 'Nature d’une série de signe quelconque', gen: 'alternee',
      cas: R`Le signe varie : $(-1)^n$, $\cos n$…`, debut: R`Tester d'abord la <b>convergence absolue</b> : étudier $\sum |u_n|$.`,
      quand: R`<p>Le signe de $u_n$ varie (présence de $(-1)^n$, $\cos n$, …).</p>`,
      etapes: [
        R`Tester d'abord la <strong>convergence absolue</strong> : étudier $\sum|u_n|$ avec les outils des séries positives.`,
        R`Si $u_n = (-1)^n a_n$ avec $a_n \ge 0$ <strong>décroissante</strong> de limite nulle : critère spécial des séries alternées.`,
        R`Sinon (décroissance fausse ou difficile) : <strong>développement asymptotique</strong> $u_n = \text{(terme alterné)} + \text{(terme de signe constant)} + \text{(terme absolument convergent)}$.`
      ],
      exemple: {
        enonce: R`<p>Nature de $\sum\frac{\cos n}{n^2}$ et de $\sum\frac{(-1)^n}{\ln n}$.</p>`,
        solution: R`<p>$\left|\frac{\cos n}{n^2}\right| \le \frac{1}{n^2}$ : convergence absolue, donc convergence.</p>
          <p>$a_n = \frac{1}{\ln n}$ est positive, décroissante, tend vers $0$ : critère spécial, la série converge. Elle n'est pas absolument convergente car $\frac{1}{\ln n} \ge \frac1n$.</p>`
      },
      pieges: [R`Utiliser un équivalent $u_n \sim v_n$ quand $v_n$ change de signe.`, R`Oublier de vérifier la décroissance de $(a_n)$ dans le critère spécial.`]
    },
    {
      title: 'Calculer la somme d’une série', gen: 'telescopique',
      cas: R`On demande la <b>valeur</b> de $\sum u_n$`, debut: R`Reconnaître une <b>géométrique</b> ; sinon <b>décomposer</b> $u_n$ pour télescoper et calculer $S_N$.`,
      quand: R`<p>On demande une valeur exacte de $\sum_{n=n_0}^{+\infty}u_n$.</p>`,
      etapes: [
        R`Justifier d'abord la convergence.`,
        R`Reconnaître une <strong>série géométrique</strong> (ou une combinaison linéaire de séries géométriques).`,
        R`Sinon, chercher un <strong>télescopage</strong> : décomposer $u_n$ en éléments simples pour l'écrire $a_n - a_{n+1}$ (ou $a_n - a_{n+k}$).`,
        R`Calculer la somme partielle $S_N$ <em>exactement</em>, puis faire $N \to \infty$.`
      ],
      exemple: {
        enonce: R`<p>Calculer $\sum_{n\ge1}\frac{1}{n(n+2)}$.</p>`,
        solution: R`<p>$\frac{1}{n(n+2)} = \frac12\left(\frac1n - \frac1{n+2}\right)$. $S_N = \frac12\left(1 + \frac12 - \frac{1}{N+1} - \frac{1}{N+2}\right) \to \frac12\cdot\frac32 = \frac34$.</p>`
      },
      pieges: [R`Séparer $\sum(a_n - a_{n+2})$ en $\sum a_n - \sum a_{n+2}$ : ces deux séries divergent ! Toujours travailler sur les sommes <em>finies</em>.`]
    },
    {
      title: 'Utiliser une comparaison série–intégrale', gen: 'alternee',
      cas: R`$u_n = f(n)$ avec $f$ monotone (souvent un $\ln$), ou équivalent d'une somme`, debut: R`<b>Encadrer</b> $f(k)$ entre $\int_k^{k+1} f$ et $\int_{k-1}^{k} f$ (faire un dessin), puis <b>sommer</b>.`,
      quand: R`<p>$u_n = f(n)$ avec $f$ positive, décroissante, ayant une primitive explicite ($\frac{1}{t\ln t}$, $\frac{1}{t^\alpha}$…) ; ou on veut un <strong>équivalent</strong> d'une somme partielle ou d'un reste.</p>`,
      etapes: [
        R`Vérifier : $f$ continue, positive, décroissante sur $[n_0, +\infty[$.`,
        R`Écrire l'encadrement $\int_k^{k+1}f \le f(k) \le \int_{k-1}^kf$ (faire un dessin !).`,
        R`Sommer sur le bon intervalle d'indices (Chasles).`,
        R`Conclure sur la nature, ou en déduire un équivalent par encadrement.`
      ],
      exemple: {
        enonce: R`<p>Donner un équivalent de $S_n = \sum_{k=1}^n\sqrt k$.</p>`,
        solution: R`<p>Ici $f(t) = \sqrt t$ est <em>croissante</em> : les inégalités s'inversent, $\int_{k-1}^k\sqrt t\dd t \le \sqrt k \le \int_k^{k+1}\sqrt t\dd t$. En sommant : $\frac23 n^{3/2} \le S_n \le \frac23\big((n+1)^{3/2} - 1\big)$, donc $S_n \sim \frac23 n^{3/2}$.</p>`
      }
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche méthode, partie 1 : plan de travail ; partie 2 : cas à reconnaître */
  /* ------------------------------------------------------------------ */
  const plan = {
    etapes: [
      { titre: 'Lire le terme général', faire: R`Repérer le <b>signe</b> de $u_n$ (positif à partir d'un rang ? alterné ? quelconque ?) et ses ingrédients : puissances, factorielles, $\ln$, $\sin$, $(-1)^n$.`,
        questions: [R`$u_n \ge 0$ à partir d'un certain rang ?`, R`Me demande-t-on la nature, ou la valeur de la somme ?`] },
      { titre: 'Faire le test grossier', faire: R`Vérifier que <b>$u_n \to 0$</b>. Sinon : divergence grossière, c'est terminé.` },
      { titre: 'Choisir l’outil', faire: R`Termes positifs : <b>équivalent</b>, domination, d'Alembert ou série–intégrale. Signe quelconque : <b>convergence absolue</b> d'abord, sinon séries alternées ou développement asymptotique.` },
      { titre: 'Simplifier le terme', faire: R`Obtenir une forme exploitable : <b>équivalent</b> $\frac{C}{n^\alpha}$, majoration par une série connue, quotient $\frac{u_{n+1}}{u_n}$…` },
      { titre: 'Conclure (et calculer si demandé)', faire: R`Comparer à une <b>série de référence</b> (Riemann, géométrique) en citant le théorème. Pour une somme : géométrique ou <b>télescopage</b> sur la somme partielle $S_N$.` }
    ]
  };
  const reperes = [
    { etape: 1, si: R`Un $(-1)^n$`, alors: R`Signe alterné : tester la <b>convergence absolue</b>, puis le <b>critère des séries alternées</b>.` },
    { etape: 1, si: R`Un $\cos n$ ou $\sin n$ (argument $n$, pas $\frac1n$)`, alors: R`Le signe varie sans régularité : <b>majorer la valeur absolue</b> ($|\sin n| \le 1$) et dominer.`, ex: R`$\left|\frac{\sin n}{n^2}\right| \le \frac{1}{n^2}$ : convergence absolue.` },
    { etape: 2, si: R`Une puissance dont la base <b>et</b> l'exposant dépendent de $n$ : $a_n^{\,n}$`, alors: R`Écrire <b>$a_n^{\,n} = \exp(n\ln a_n)$</b> et faire un développement limité du $\ln$.`, ex: R`$\left(1 + \frac1n\right)^n = e^{n\ln(1 + 1/n)} \to e \neq 0$ : divergence grossière.` },
    { etape: 2, si: R`Une différence de racines ($\infty - \infty$)`, alors: R`<b>Quantité conjuguée</b>.`, ex: R`$\sqrt{n+1} - \sqrt n = \frac{1}{\sqrt{n+1} + \sqrt n} \sim \frac{1}{2\sqrt n}$ : diverge.` },
    { etape: 3, si: R`Des <b>factorielles</b> ou des puissances $a^n$`, alors: R`<b>Règle de d'Alembert</b> : simplifier $\frac{u_{n+1}}{u_n}$ ($\frac{(n+1)!}{n!} = n + 1$).` },
    { etape: 3, si: R`Une fraction rationnelle en $n$ (éventuellement avec des racines)`, alors: R`<b>Équivalent</b> : quotient des termes de plus haut degré, puis Riemann. Jamais d'Alembert (on trouve $\ell = 1$).` },
    { etape: 3, si: R`$\frac{1}{n(\ln n)^\beta}$ ou un $\ln n$ au dénominateur`, alors: R`<b>Comparaison série–intégrale</b> : primitives $\ln(\ln t)$ ou $\frac{(\ln t)^{1-\beta}}{1-\beta}$.` },
    { etape: 3, si: R`Un $\ln n$ ou un $e^{-\sqrt n}$ qui empêche un équivalent en $\frac{C}{n^\alpha}$`, alors: R`<b>Règle $n^\alpha u_n$</b> avec $\alpha$ un peu plus grand que $1$ (par exemple $\alpha = 2$).`, ex: R`$n^2e^{-\sqrt n} \to 0$ : $\sum e^{-\sqrt n}$ converge.` },
    { etape: 4, si: R`$\sin$, $\ln(1+\cdot)$, $e^{\cdot} - 1$, $1 - \cos$ appliqués à une quantité qui <b>tend vers $0$</b>`, alors: R`<b>Équivalent usuel</b> : $\sin x \sim x$, $\ln(1+x) \sim x$, $e^x - 1 \sim x$, $1 - \cos x \sim \frac{x^2}{2}$.` },
    { etape: 4, si: R`Un $\sin$ ou un $\cos$ d'une quantité qui <b>ne tend pas</b> vers $0$`, alors: R`<b>Inégalité</b> $|\sin| \le 1$, $|\cos| \le 1$, puis <b>domination</b>.` },
    { etape: 4, si: R`Une somme de termes de tailles différentes`, alors: R`Mettre en facteur le <b>terme dominant</b> : $n^2 + 3n = n^2\left(1 + \frac3n\right)$.` },
    { etape: 4, si: R`$\frac{(-1)^n}{n^\alpha + \cdots}$, sans décroissance évidente`, alors: R`<b>Développement asymptotique</b> à l'ordre 2 : $u_n = \frac{(-1)^n}{n^\alpha} + v_n$ avec $v_n$ de signe constant, à traiter par équivalent.` },
    { etape: 5, si: R`Une fraction rationnelle à sommer`, alors: R`<b>Décomposition en éléments simples</b>, puis télescopage sur $S_N$ (jamais sur les séries infinies séparées).` },
    { etape: 5, si: R`Des puissances $q^n$ à sommer`, alors: R`<b>Géométrique</b> : $\frac{\text{premier terme}}{1 - q}$ ; avec $nq^n$, calculer $S_N - qS_N$.` }
  ];

  L2.chapter('analyse3', 'series', {
    intro: R`<p>Une série, c'est une « somme infinie » $u_0 + u_1 + u_2 + \cdots$, définie comme limite des sommes partielles. Ce chapitre donne les outils pour décider si une série converge (sa <em>nature</em>) et, parfois, calculer sa somme. Les comparaisons asymptotiques ($\sim$, $O$, $o$) du chapitre 1 sont constamment utilisées.</p>`,
    cours, fiche, exercices, methodes, generateurs, plan, reperes
  });
})();
