/* Analyse et applications informatiques — Chapitre 1 : Suites de fonctions (convergence simple, convergence uniforme) */
(function () {
  'use strict';
  const R = String.raw;
  const code = L2.code;
  const { F, dec } = ML;

  /* ------------------------------------------------------------------ */
  /* Générateurs                                                         */
  /* ------------------------------------------------------------------ */
  // n^p joliment écrit (p fraction)
  function npow(p) {
    p = F(p);
    if (p.isZero()) return '';
    if (p.isOne()) return 'n';
    if (p.eq(F(1, 2))) return R`\sqrt{n}`;
    if (p.d === 1) return 'n^{' + p.n + '}';
    return 'n^{' + p.texSlash() + '}';
  }
  function npowLim(p) { // limite de n^p quand n -> infini
    const s = F(p).sign();
    return s < 0 ? '0' : (s === 0 ? '1' : R`+\infty`);
  }

  const generateurs = {
    cvu: {
      title: 'Convergence simple puis uniforme', diff: 2,
      make(r) {
        const tpl = r.pick(['puissance', 'bosse', 'rationnelle', 'cloche', 'sinus']);
        if (tpl === 'puissance') {
          const I = r.pick(['[0,a]', '[0,1[', '[0,1]']);
          const a = r.pick([F(1, 2), F(2, 3), F(3, 4), F(9, 10)]);
          const Itex = I === '[0,a]' ? R`[0, ${a.tex()}]` : I;
          let cor = R`<p><strong>Limite simple.</strong> Pour $0 \le x < 1$, $x^n \to 0$ ; pour $x = 1$, $1^n = 1$.</p>`;
          if (I === '[0,a]') {
            cor += R`<p>Sur $${Itex}$ la limite simple est $f = 0$.</p><p><strong>Convergence uniforme.</strong> $x \mapsto x^n$ est croissante sur $${Itex}$, donc $\|f_n - f\|_\infty = \sup_{x \in ${Itex}} x^n = \left(${a.tex()}\right)^n \to 0$ car $${a.tex()} < 1$ : <mark>convergence uniforme</mark>.</p>`;
          } else if (I === '[0,1[') {
            cor += R`<p>Sur $[0,1[$ la limite simple est $f = 0$.</p><p><strong>Convergence uniforme ?</strong> $\|f_n\|_\infty = \sup_{[0,1[} x^n = 1$ (la borne $1$ est approchée quand $x \to 1$). Ou bien, avec $x_n = 1 - \frac1n$ : $f_n(x_n) = \left(1 - \frac1n\right)^n \to e^{-1} \neq 0$. <mark>Pas de convergence uniforme</mark> sur $[0,1[$ (mais il y en a sur tout $[0, a]$, $a < 1$).</p>`;
          } else {
            cor += R`<p>Sur $[0,1]$ la limite simple est $f(x) = 0$ si $x < 1$ et $f(1) = 1$.</p><p><strong>Convergence uniforme ?</strong> Les $f_n$ sont continues mais $f$ ne l'est pas en $1$. Une limite uniforme de fonctions continues étant continue, <mark>la convergence n'est pas uniforme</mark> sur $[0,1]$.</p>`;
          }
          return {
            enonce: R`<p>On pose $f_n(x) = x^n$ pour $x \in ${Itex}$. Étudier la convergence simple, puis la convergence uniforme de $(f_n)$ sur $${Itex}$.</p>`,
            indication: R`<p>Fixer $x$ pour la limite simple ; pour l'uniforme, calculer $\sup |f_n - f|$ grâce à la monotonie de $x \mapsto x^n$.</p>`,
            correction: cor
          };
        }
        if (tpl === 'bosse' || tpl === 'rationnelle') {
          const isB = tpl === 'bosse';
          // pour la fraction rationnelle, p = 2 donnerait une limite simple non nulle : exclu
          const p = isB ? r.pick([F(0), F(1, 2), F(1), F(2)]) : r.pick([F(0), F(1, 2), F(1)]);
          const fx = isB ? R`${npow(p)}\,x\,e^{-nx}` : R`\dfrac{${npow(p) || '1'}\,x}{1 + n^2x^2}`;
          const supP = p.sub(1); // exposant de n dans le sup
          const supNeg = supP.sign() < 0;
          const cst = isB ? 'e' : '2';
          const valueTex = supNeg ? R`\dfrac{1}{${cst}\,${npow(supP.neg())}}` : R`\dfrac{${npow(supP) || '1'}}{${cst}}`;
          const supVal = R`f_n\!\left(\tfrac1n\right) = ${valueTex}`;
          const cvu = supNeg;
          const deriv = isB ? R`$f_n'(x) = ${npow(p) || ''}\,e^{-nx}(1 - nx)$` : R`$f_n'(x) = ${npow(p) || ''}\,\dfrac{1 - n^2x^2}{(1 + n^2x^2)^2}$`;
          let cor = R`<p><strong>Limite simple.</strong> $f_n(0) = 0$. Pour $x > 0$ fixé, ${isB ? R`$${npow(p) || '1'}\,e^{-nx} \to 0$ (croissances comparées : l'exponentielle l'emporte)` : R`$f_n(x) \sim \dfrac{${npow(p) || '1'}}{n^2 x} \to 0$`}. Donc <b>$f = 0$</b> sur $[0, +\infty[$.</p>
            <p><strong>Calcul du sup.</strong> ${deriv} s'annule en $x = \frac1n$ : $f_n$ croît sur $[0, \frac1n]$ puis décroît. Ainsi</p>
            $$\|f_n - f\|_\infty = ${supVal}.$$`;
          if (cvu) cor += R`<p>Cette quantité tend vers $0$ : <mark>convergence uniforme</mark> sur $[0, +\infty[$.</p>`;
          else cor += R`<p>Cette quantité tend vers $${npowLim(supP) === '1' ? (isB ? R`\frac1e` : R`\frac12`) : R`+\infty`} \neq 0$ : <mark>pas de convergence uniforme</mark> sur $[0, +\infty[$.</p>
            <p><strong>Sur $[a, +\infty[$ ($a > 0$).</strong> Dès que $\frac1n \le a$, $f_n$ est décroissante sur $[a, +\infty[$, donc $\sup_{[a,+\infty[} |f_n| = f_n(a) \to 0$ : la convergence est uniforme sur $[a, +\infty[$. Le « pic » se déplace vers $0$ : c'est lui qui empêche l'uniformité.</p>`;
          return {
            enonce: R`<p>Pour $n \ge 1$ et $x \ge 0$, on pose $f_n(x) = ${fx}$. Étudier la convergence simple et la convergence uniforme de $(f_n)$ sur $[0, +\infty[$${cvu ? '' : R`, puis sur $[a, +\infty[$ avec $a > 0$`}.</p>`,
            indication: R`<p>Étudier les variations de $f_n$ : le maximum est atteint en $x = \frac1n$.</p>`,
            correction: cor
          };
        }
        if (tpl === 'cloche') {
          const k = r.pick([1, 2]);
          const nk = k === 1 ? 'n' : 'n^2';
          const xm = k === 1 ? R`\frac{1}{\sqrt n}` : R`\frac1n`;
          const sup = k === 1 ? R`\dfrac{1}{2\sqrt n}` : R`\dfrac{1}{2n}`;
          return {
            enonce: R`<p>On pose $f_n(x) = \dfrac{x}{1 + ${nk}x^2}$ pour $x \in \R$. Montrer que $(f_n)$ converge uniformément sur $\R$.</p>`,
            indication: R`<p>$f_n$ est impaire : étudier ses variations sur $[0, +\infty[$.</p>`,
            correction: R`<p><strong>Limite simple :</strong> $f_n(0) = 0$ et pour $x \neq 0$, $f_n(x) \sim \dfrac{1}{${nk}x} \to 0$. Donc $f = 0$.</p>
              <p><strong>Sup :</strong> $f_n$ est impaire ; sur $[0, +\infty[$, $f_n'(x) = \dfrac{1 - ${nk}x^2}{(1 + ${nk}x^2)^2}$ s'annule en $x = ${xm}$. Donc $\|f_n\|_\infty = f_n\!\left(${xm}\right) = ${sup} \to 0$ : <mark>convergence uniforme sur $\R$</mark>.</p>
              <p><em>Variante sans dérivée :</em> $1 + ${nk}x^2 \ge 2\sqrt{${nk}}\,|x|$ (inégalité $a^2 + b^2 \ge 2ab$), d'où $|f_n(x)| \le ${sup}$.</p>`
          };
        }
        const a = r.pick([F(1, 2), F(1), F(2)]);
        return {
          enonce: R`<p>On pose $f_n(x) = \dfrac{\sin(nx)}{${npow(a)}}$ pour $x \in \R$. Étudier la convergence uniforme de $(f_n)$ sur $\R$. La suite $(f_n')$ converge-t-elle ?</p>`,
          correction: R`<p>$|f_n(x)| \le \dfrac{1}{${npow(a)}}$ pour tout $x$, et cette borne ne dépend pas de $x$ et tend vers $0$ : <mark>convergence uniforme vers $0$</mark> sur $\R$ (méthode de la majoration).</p>
            <p>$f_n'(x) = ${a.isOne() ? '' : R`\dfrac{n}{${npow(a)}}\,`}\cos(nx)$. En $x = 0$ : $f_n'(0) = ${a.isOne() ? '1' : (a.cmp(1) < 0 ? R`\sqrt n \to +\infty` : R`\frac1n \to 0`)}$. ${a.cmp(1) <= 0 ? R`La suite $(f_n')$ ne converge pas vers $0 = f'$ (et pas même simplement) : <b>la convergence uniforme de $(f_n)$ ne dit rien sur les dérivées</b>.` : R`Ici $\|f_n'\|_\infty = \frac1n \to 0$ : $(f_n')$ converge uniformément vers $0 = f'$, ce qui est cohérent avec le théorème de dérivation.`}</p>`
        };
      }
    },

    interversion: {
      title: 'Limite et intégrale', diff: 2,
      make(r) {
        const p = r.pick([F(0), F(1, 2), F(1), F(3, 2), F(2)]);
        const np = npow(p);
        const expI = p.sub(1);
        const limI = expI.sign() < 0 ? '0' : (expI.isZero() ? R`\frac12` : R`+\infty`);
        const expS = p.sub(F(1, 2));
        const cvu = expS.sign() < 0;
        const supExpr = expS.isZero() ? R`\dfrac{1}{\sqrt{2e}}` : (expS.sign() < 0 ? R`\dfrac{1}{\sqrt{2e}\,${npow(expS.neg())}}` : R`\dfrac{${npow(expS)}}{\sqrt{2e}}`);
        return {
          enonce: R`<p>Pour $x \in [0, 1]$, on pose $f_n(x) = ${np}\,x\,e^{-nx^2}$.</p><ol><li>Déterminer la limite simple $f$ de $(f_n)$ sur $[0,1]$.</li><li>Calculer $I_n = \int_0^1 f_n(x)\dd x$ et sa limite. Comparer avec $\int_0^1 f$.</li><li>La convergence est-elle uniforme sur $[0, 1]$ ?</li></ol>`,
          indication: R`<p>Une primitive de $x e^{-nx^2}$ est $-\dfrac{1}{2n}e^{-nx^2}$. Pour le sup, $f_n'$ s'annule en $x = \frac{1}{\sqrt{2n}}$.</p>`,
          correction: R`<p>1. $f_n(0) = 0$ ; pour $x \in\, ]0, 1]$, $${np || '1'}\,e^{-nx^2} \to 0$ (croissances comparées). Donc $f = 0$ et $\int_0^1 f = 0$.</p>
            <p>2. $I_n = ${np}\left[-\dfrac{e^{-nx^2}}{2n}\right]_0^1 = \dfrac{${np || '1'}}{2n}\left(1 - e^{-n}\right) \longrightarrow ${limI}$.</p>
            <p>${limI === '0' ? R`Ici $\lim I_n = 0 = \int_0^1 f$ : l'interversion est correcte.` : R`<mark>$\lim I_n = ${limI} \neq 0 = \int_0^1 \lim f_n$</mark> : on ne peut pas intervertir limite et intégrale.`}</p>
            <p>3. $f_n'(x) = ${np}\,e^{-nx^2}(1 - 2nx^2)$ s'annule en $x_n = \frac{1}{\sqrt{2n}} \in [0,1]$, donc $\|f_n\|_\infty = f_n(x_n) = ${supExpr}$, qui ${cvu ? R`tend vers $0$ : <b>convergence uniforme</b> (cohérent avec 2 et le théorème d'intégration).` : R`ne tend pas vers $0$ : <b>pas de convergence uniforme</b>.`}</p>
            ${!cvu && limI === '0' ? R`<p><em>À retenir :</em> ici l'interversion est vraie <b>sans</b> convergence uniforme. La convergence uniforme est une condition <b>suffisante</b>, pas nécessaire.</p>` : ''}`
        };
      }
    },

    limite: {
      title: 'Déterminer une limite simple', diff: 1,
      make(r) {
        const T = r.pick([
          {
            f: R`\left(1 + \dfrac{x}{n}\right)^n`, I: R`\R`,
            cor: R`<p>Pour $x$ fixé et $n > |x|$ : $\ln f_n(x) = n\ln\left(1 + \frac xn\right) = n\left(\frac xn + o\left(\frac1n\right)\right) \to x$. Donc <b>$f(x) = e^x$</b>.</p><p>$f$ est continue : la continuité ne permet pas de conclure sur l'uniformité. (On montre que la convergence est uniforme sur tout segment $[-A, A]$, mais pas sur $\R$ : avec $x_n = n$, $f_n(x_n) = 2^n$ et $e^n - 2^n \to +\infty$.)</p>`
          },
          {
            f: R`\dfrac{nx}{1 + nx}`, I: R`[0, +\infty[`,
            cor: R`<p>$f_n(0) = 0$ ; pour $x > 0$, $f_n(x) = \dfrac{1}{1 + \frac{1}{nx}} \to 1$. Donc <b>$f(0) = 0$ et $f(x) = 1$ pour $x > 0$</b>.</p><p>$f$ est <mark>discontinue en $0$</mark> alors que les $f_n$ sont continues : <b>pas de convergence uniforme</b> sur $[0, +\infty[$. Sur $[a, +\infty[$ ($a > 0$) : $|f_n(x) - 1| = \frac{1}{1 + nx} \le \frac{1}{1 + na} \to 0$, convergence uniforme.</p>`
          },
          {
            f: R`\sqrt{x^2 + \tfrac1n}`, I: R`\R`,
            cor: R`<p>Par continuité de la racine, $f_n(x) \to \sqrt{x^2}$, soit <b>$f(x) = |x|$</b>.</p><p>De plus $0 \le f_n(x) - |x| = \dfrac{1/n}{\sqrt{x^2 + 1/n} + |x|} \le \dfrac{1/n}{\sqrt{1/n}} = \dfrac{1}{\sqrt n}$ : <mark>convergence uniforme</mark> sur $\R$. Pourtant les $f_n$ sont $C^\infty$ et la limite n'est pas dérivable en $0$.</p>`
          },
          {
            f: R`\dfrac{x^n}{1 + x^n}`, I: R`[0, +\infty[`,
            cor: R`<p>Si $0 \le x < 1$ : $x^n \to 0$, $f_n(x) \to 0$. Si $x = 1$ : $f_n(1) = \frac12$. Si $x > 1$ : $f_n(x) = \dfrac{1}{x^{-n} + 1} \to 1$.</p><p><b>$f = 0$ sur $[0,1[$, $f(1) = \frac12$, $f = 1$ sur $]1, +\infty[$</b> : $f$ est <mark>discontinue en $1$</mark>, donc pas de convergence uniforme sur $[0, +\infty[$.</p>`
          },
          {
            f: R`n\left(x^{1/n} - 1\right)`, I: R`]0, +\infty[`,
            cor: R`<p>$x^{1/n} = e^{\frac{\ln x}{n}} = 1 + \frac{\ln x}{n} + o\left(\frac1n\right)$, donc <b>$f_n(x) \to \ln x$</b>.</p><p>$\ln$ est continue : on ne peut rien conclure par la continuité. (La convergence est uniforme sur tout segment $[a, b] \subset\, ]0, +\infty[$.)</p>`
          }
        ]);
        return {
          enonce: R`<p>Déterminer la limite simple de la suite de fonctions $f_n(x) = ${T.f}$ sur $${T.I}$. La limite est-elle continue ? Que peut-on en déduire ?</p>`,
          indication: R`<p>Fixer $x$ et étudier la suite numérique $(f_n(x))_n$ ; distinguer des cas selon $x$ si besoin.</p>`,
          correction: T.cor
        };
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Cours                                                               */
  /* ------------------------------------------------------------------ */
  const cours = [
    { t: 'h', title: 'Convergence simple' },
    { t: 'def', title: 'convergence simple', body: R`<p>Soit $I$ un intervalle de $\R$ et $(f_n)$ une suite de fonctions de $I$ dans $\R$. On dit que $(f_n)$ <strong>converge simplement</strong> sur $I$ vers $f : I \to \R$ si</p>
      $$\forall x \in I, \quad f_n(x) \xrightarrow[n\to\infty]{} f(x).$$
      <p>Avec les quantificateurs : $\forall x \in I,\ \forall \eps > 0,\ \exists N \in \N,\ \forall n \ge N,\ |f_n(x) - f(x)| \le \eps$.</p>` },
    { t: 'rem', body: R`<p>Ici $N$ dépend de $\eps$ <strong>et de $x$</strong>. Étudier la convergence simple, c'est étudier une suite <em>numérique</em> $(f_n(x))_n$ pour chaque $x$ fixé.</p>` },
    { t: 'ex', title: 'la limite simple peut être discontinue', body: R`<p>$f_n(x) = x^n$ sur $[0, 1]$ : $f_n(x) \to 0$ si $0 \le x < 1$ et $f_n(1) = 1$. La limite simple</p>
      $$f(x) = \begin{cases} 0 & \text{si } 0 \le x < 1 \\ 1 & \text{si } x = 1\end{cases}$$
      <p>est discontinue en $1$, alors que chaque $f_n$ est continue (et même $C^\infty$).</p>` },
    { t: 'ex', title: 'les intégrales ne passent pas à la limite', body: R`<p>$g_n(x) = 2nx\,e^{-nx^2}$ sur $[0,1]$ : pour $x > 0$, $g_n(x) \to 0$ (croissances comparées), et $g_n(0) = 0$. Pourtant</p>
      $$\int_0^1 g_n(x)\dd x = \Big[-e^{-nx^2}\Big]_0^1 = 1 - e^{-n} \longrightarrow 1 \neq 0 = \int_0^1 \lim g_n.$$` },
    { t: 'rem', body: R`<p>La convergence simple est trop faible pour transmettre la continuité ou permuter limite et intégrale. Il faut une notion qui contrôle l'écart $|f_n(x) - f(x)|$ <strong>uniformément en $x$</strong>.</p>` },

    { t: 'h', title: 'Convergence uniforme' },
    { t: 'def', title: 'norme infinie', body: R`<p>Pour $g : I \to \R$ bornée, on note $\displaystyle\|g\|_\infty = \sup_{x \in I}|g(x)|$.</p>` },
    { t: 'def', title: 'convergence uniforme', body: R`<p>$(f_n)$ <strong>converge uniformément</strong> sur $I$ vers $f$ si $f_n - f$ est bornée à partir d'un certain rang et</p>
      $$\|f_n - f\|_\infty = \sup_{x \in I}|f_n(x) - f(x)| \xrightarrow[n\to\infty]{} 0.$$
      <p>Avec les quantificateurs : $\forall \eps > 0,\ \exists N \in \N,\ \forall n \ge N,\ \forall x \in I,\ |f_n(x) - f(x)| \le \eps$.</p>` },
    { t: 'rem', title: 'interprétation', body: R`<p>Le même $N$ convient <strong>pour tous les $x$</strong> : le « $\forall x$ » est passé après le « $\exists N$ ». Graphiquement, à partir du rang $N$, tout le graphe de $f_n$ est dans le « tube » de largeur $\eps$ autour du graphe de $f$.</p>` },
    { t: 'prop', body: R`<p>Si $(f_n)$ converge uniformément vers $f$ sur $I$, alors elle converge simplement vers $f$ sur $I$.</p>`,
      proof: R`<p>Pour tout $x \in I$ : $|f_n(x) - f(x)| \le \|f_n - f\|_\infty \to 0$.</p>` },
    { t: 'warn', body: R`<p>La réciproque est fausse : $x^n$ converge simplement vers $0$ sur $[0, 1[$ mais $\sup_{[0,1[} x^n = 1$ pour tout $n$. <strong>Pour étudier la convergence uniforme, on commence toujours par trouver la limite simple $f$</strong> : c'est la seule limite uniforme possible.</p>` },
    { t: 'prop', title: 'majoration uniforme', body: R`<p>S'il existe une suite numérique $(\alpha_n)$ telle que $\alpha_n \to 0$ et</p>
      $$\forall n \ge n_0,\ \forall x \in I, \quad |f_n(x) - f(x)| \le \alpha_n,$$
      <p>alors $(f_n)$ converge uniformément vers $f$ sur $I$.</p>`,
      proof: R`<p>Pour $n \ge n_0$, $\alpha_n$ majore $|f_n - f|$ sur $I$, donc $\|f_n - f\|_\infty \le \alpha_n \to 0$.</p>` },
    { t: 'prop', title: 'critère séquentiel de non-convergence uniforme', body: R`<p>S'il existe une suite $(x_n)$ d'éléments de $I$ telle que $f_n(x_n) - f(x_n) \not\to 0$, alors $(f_n)$ ne converge pas uniformément vers $f$ sur $I$.</p>`,
      proof: R`<p>On a $|f_n(x_n) - f(x_n)| \le \|f_n - f\|_\infty$. Si la convergence était uniforme, le membre de droite tendrait vers $0$, donc aussi le membre de gauche : contradiction.</p>` },
    { t: 'ex', body: R`<ul>
      <li>Sur $[0, a]$ avec $0 < a < 1$ : $\sup_{[0,a]} x^n = a^n \to 0$, donc $x^n \to 0$ <strong>uniformément</strong>.</li>
      <li>Sur $[0, 1[$ : avec $x_n = 1 - \frac1n$, $x_n^n = \left(1 - \frac1n\right)^n \to e^{-1} \neq 0$ : <strong>pas</strong> de convergence uniforme.</li></ul>` },
    { t: 'ex', title: 'une bosse qui se déplace', body: R`<p>$f_n(x) = nx\,e^{-nx}$ sur $[0, +\infty[$ converge simplement vers $0$. On a $f_n'(x) = n e^{-nx}(1 - nx)$ : maximum en $x = \frac1n$, et $\|f_n\|_\infty = f_n\left(\frac1n\right) = \frac1e$. Pas de convergence uniforme sur $[0, +\infty[$.</p>
      <p>En revanche, sur $[a, +\infty[$ avec $a > 0$ : dès que $\frac1n \le a$, $f_n$ est décroissante sur $[a, +\infty[$ et $\sup_{[a,+\infty[} f_n = f_n(a) = na\,e^{-na} \to 0$. Convergence uniforme sur $[a, +\infty[$.</p>` },
    { t: 'thm', title: 'critère de Cauchy uniforme', body: R`<p>$(f_n)$ converge uniformément sur $I$ si et seulement si</p>
      $$\forall \eps > 0,\ \exists N,\ \forall p, q \ge N,\ \forall x \in I,\quad |f_p(x) - f_q(x)| \le \eps.$$`,
      proof: R`<p>$\Rightarrow$ : $|f_p(x) - f_q(x)| \le |f_p(x) - f(x)| + |f(x) - f_q(x)| \le 2\eps$ pour $p, q \ge N$.</p>
      <p>$\Leftarrow$ : pour $x$ fixé, $(f_n(x))$ est de Cauchy dans $\R$, donc converge vers un réel $f(x)$. Dans $|f_p(x) - f_q(x)| \le \eps$, on fait $q \to \infty$ : $|f_p(x) - f(x)| \le \eps$ pour tout $p \ge N$ et tout $x \in I$, ce qui est la convergence uniforme.</p>` },
    { t: 'prop', title: 'opérations', body: R`<p>Si $f_n \to f$ et $g_n \to g$ uniformément sur $I$, alors $\lambda f_n + \mu g_n \to \lambda f + \mu g$ uniformément. <strong>Attention</strong>, pour le produit il faut des hypothèses supplémentaires (fonctions bornées) : voir les exercices.</p>`,
      proof: R`<p>$\|(\lambda f_n + \mu g_n) - (\lambda f + \mu g)\|_\infty \le |\lambda|\,\|f_n - f\|_\infty + |\mu|\,\|g_n - g\|_\infty \to 0$.</p>` },

    { t: 'h', title: 'Convergence uniforme et continuité' },
    { t: 'thm', body: R`<p>Si chaque $f_n$ est continue sur $I$ et si $(f_n)$ converge <strong>uniformément</strong> vers $f$ sur $I$, alors $f$ est continue sur $I$.</p>`,
      proof: R`<p>Soit $a \in I$ et $\eps > 0$. On choisit $N$ tel que $\|f_N - f\|_\infty \le \eps$. Comme $f_N$ est continue en $a$, il existe $\delta > 0$ tel que $|x - a| \le \delta \Rightarrow |f_N(x) - f_N(a)| \le \eps$. Alors, pour $|x - a| \le \delta$ :</p>
      $$|f(x) - f(a)| \le \underbrace{|f(x) - f_N(x)|}_{\le \eps} + \underbrace{|f_N(x) - f_N(a)|}_{\le \eps} + \underbrace{|f_N(a) - f(a)|}_{\le \eps} \le 3\eps.$$
      <p>C'est l'argument « des $\eps/3$ ».</p>` },
    { t: 'cor', title: 'pour montrer qu’il n’y a pas convergence uniforme', body: R`<p>Si les $f_n$ sont continues et si la limite simple $f$ est <strong>discontinue</strong>, alors la convergence n'est <strong>pas uniforme</strong>.</p>` },
    { t: 'rem', body: R`<p>La continuité est une propriété locale : il suffit d'avoir la convergence uniforme <strong>sur tout segment</strong> $[a, b] \subset I$ pour conclure que $f$ est continue sur $I$. Exemple : $nx e^{-nx}$ ne converge pas uniformément sur $[0, +\infty[$, mais si la limite n'était pas évidente, la convergence uniforme sur chaque $[a, +\infty[$ suffirait à prouver la continuité de $f$ sur $]0, +\infty[$.</p>` },

    { t: 'h', title: 'Intégration et dérivation' },
    { t: 'thm', title: 'intégration sur un segment', body: R`<p>Si les $f_n$ sont continues sur le <strong>segment</strong> $[a, b]$ et convergent uniformément vers $f$ sur $[a, b]$, alors</p>
      $$\int_a^b f_n(x)\dd x \xrightarrow[n\to\infty]{} \int_a^b f(x)\dd x.$$`,
      proof: R`<p>$f$ est continue (théorème précédent), donc intégrable, et</p>
      $$\left|\int_a^b f_n - \int_a^b f\right| \le \int_a^b |f_n - f| \le (b - a)\,\|f_n - f\|_\infty \to 0.$$` },
    { t: 'cor', title: 'primitives', body: R`<p>Sous les mêmes hypothèses, avec $x_0 \in [a, b]$, les fonctions $F_n(x) = \int_{x_0}^x f_n$ convergent uniformément sur $[a, b]$ vers $F(x) = \int_{x_0}^x f$.</p>`,
      proof: R`<p>$|F_n(x) - F(x)| \le |x - x_0|\,\|f_n - f\|_\infty \le (b - a)\,\|f_n - f\|_\infty$, majoration indépendante de $x$.</p>` },
    { t: 'warn', body: R`<p>Sans convergence uniforme, la conclusion peut être fausse : c'est l'exemple $g_n(x) = 2nx\,e^{-nx^2}$ ci-dessus, pour lequel $\|g_n\|_\infty = \sqrt{2n}\,e^{-1/2} \to +\infty$.</p>` },
    { t: 'thm', title: 'dérivation', body: R`<p>Soit $(f_n)$ une suite de fonctions de classe $C^1$ sur un segment $[a, b]$. On suppose :</p>
      <ul><li>il existe $x_0 \in [a, b]$ tel que $(f_n(x_0))$ converge ;</li><li>$(f_n')$ converge <strong>uniformément</strong> sur $[a, b]$ vers une fonction $g$.</li></ul>
      <p>Alors $(f_n)$ converge uniformément sur $[a, b]$ vers une fonction $f$ de classe $C^1$, et $f' = g$, c'est-à-dire $\left(\lim f_n\right)' = \lim f_n'$.</p>`,
      proof: R`<p>Notons $\ell = \lim f_n(x_0)$. $g$ est continue (limite uniforme de fonctions continues) ; posons $f(x) = \ell + \int_{x_0}^x g$, qui est $C^1$ de dérivée $g$. Comme $f_n(x) = f_n(x_0) + \int_{x_0}^x f_n'$ :</p>
      $$|f_n(x) - f(x)| \le |f_n(x_0) - \ell| + (b - a)\,\|f_n' - g\|_\infty,$$
      <p>majoration indépendante de $x$ qui tend vers $0$ : $(f_n)$ converge uniformément vers $f$.</p>` },
    { t: 'ex', title: 'la convergence uniforme ne transmet pas la dérivabilité', body: R`<p>$f_n(x) = \sqrt{x^2 + \frac1n}$ est $C^\infty$ sur $\R$ et</p>
      $$0 \le f_n(x) - |x| = \frac{1/n}{\sqrt{x^2 + 1/n} + |x|} \le \frac{1}{\sqrt n},$$
      <p>donc $f_n \to |x|$ uniformément sur $\R$, qui n'est pas dérivable en $0$. Ici $f_n'(x) = \frac{x}{\sqrt{x^2 + 1/n}}$ converge simplement vers la fonction signe, discontinue : $(f_n')$ ne converge pas uniformément, et le théorème ne s'applique pas.</p>` },

    { t: 'h', title: 'Approximation et applications informatiques' },
    { t: 'thm', title: 'de Weierstrass (admis)', body: R`<p>Toute fonction continue sur un segment $[a, b]$ est limite <strong>uniforme</strong> sur $[a, b]$ d'une suite de fonctions polynomiales.</p>` },
    { t: 'rem', body: R`<p>C'est ce qui justifie que les ordinateurs calculent $\exp$, $\sin$, $\ln$… à l'aide de polynômes (et de fractions rationnelles) : la qualité d'une approximation se mesure en <strong>norme infinie</strong>, c'est-à-dire par l'erreur maximale commise sur tout l'intervalle.</p>` },
    { t: 'meth', title: 'estimer numériquement une norme infinie', body: R`<p>On évalue $|f_n - f|$ sur une grille fine de points. Cela donne un <strong>minorant</strong> du sup (on peut rater le maximum entre deux points) : c'est un outil de <em>conjecture</em>, pas une preuve.</p>` + code(`import math

def norme_sup(g, a, b, N=10000):
    """Approximation de sup |g| sur [a, b] avec une grille de N+1 points.
    Attention : c'est un minorant du vrai sup."""
    return max(abs(g(a + k * (b - a) / N)) for k in range(N + 1))

for n in [1, 10, 100, 1000]:
    f_n = lambda x: n * x * math.exp(-n * x)      # limite simple : 0
    print(n, norme_sup(f_n, 0, 10))
# affiche environ 0.3679 (= 1/e) à chaque fois : pas de convergence uniforme`) },
    { t: 'meth', title: 'visualiser une suite de fonctions', body: code(`import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(0, 1, 500)
for n in [1, 2, 5, 10, 50]:
    plt.plot(x, x**n, label=f"n = {n}")
plt.legend(); plt.title("f_n(x) = x^n sur [0, 1]"); plt.show()`) + R`<p>On voit les graphes « coller » à $0$ sur $[0, a]$ mais rester attachés au point $(1, 1)$ : l'écart maximal ne diminue pas près de $1$.</p>` }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche                                                               */
  /* ------------------------------------------------------------------ */
  const fiche = [
    { k: 'def', t: 'Convergence simple', prio: true,
      key: R`<p>$\forall x \in I$, $\ f_n(x) \to f(x)$</p>`,
      b: R`<p>On <b>fixe $x$</b> et on étudie une suite de nombres. $N$ dépend de $x$.</p>` },
    { k: 'def', t: 'Convergence uniforme', prio: true,
      key: R`$$\|f_n - f\|_\infty = \sup_{x\in I}|f_n(x) - f(x)| \to 0$$`,
      b: R`<p><mark>Un même $N$ pour tous les $x$.</mark> CVU ⇒ CVS (même limite) ; <b>réciproque fausse</b>.</p>` },
    { k: 'thm', t: 'Continuité', prio: true,
      key: R`<p>$f_n$ continues + <b>CVU</b> ⇒ $f$ continue</p>`,
      b: R`<p>Contraposée : <mark>$f_n$ continues, $f$ discontinue ⇒ pas de CVU</mark>.</p>` },
    { k: 'thm', t: 'Intégration sur un segment', prio: true,
      key: R`$$\text{CVU sur } [a,b] \Rightarrow \int_a^b f_n \to \int_a^b f$$`,
      b: R`<p>Car $\left|\int f_n - \int f\right| \le (b-a)\|f_n - f\|_\infty$.</p>` },
    { k: 'meth', t: 'Prouver la CVU',
      key: R`<p>Majorer $|f_n(x) - f(x)| \le \alpha_n$ <b>indépendant de $x$</b>, $\alpha_n \to 0$</p>`,
      b: R`<p>Ou calculer le sup par une <b>étude de variations</b> de $f_n - f$.</p>` },
    { k: 'meth', t: 'Réfuter la CVU',
      key: R`<p>Trouver $x_n \in I$ avec $f_n(x_n) - f(x_n) \not\to 0$</p>`,
      b: R`<p>Souvent $x_n$ = point où $f_n$ est maximale (la « bosse »), ou $x_n \to$ bord de $I$.</p>` },
    { k: 'thm', t: 'Dérivation',
      key: R`<p>$f_n$ $C^1$, $(f_n(x_0))$ CV, <mark>$f_n'$ CVU</mark> ⇒ $(\lim f_n)' = \lim f_n'$</p>`,
      b: R`<p>La CVU de $(f_n)$ seule <b>ne suffit pas</b> : $\sqrt{x^2 + 1/n} \to |x|$.</p>` },
    { k: 'thm', t: 'Critère de Cauchy uniforme',
      key: R`<p>$\forall \eps\ \exists N\ \forall p,q \ge N\ \forall x : |f_p(x) - f_q(x)| \le \eps$</p>` },
    { k: 'form', t: 'Exemples de référence',
      key: R`<p>$x^n$ : CVU sur $[0,a]$ ($a<1$), <b>pas</b> sur $[0,1[$</p>`,
      b: R`<p>$nxe^{-nx}$ : sup $= \frac1e$, pas de CVU sur $\R_+$, CVU sur $[a, +\infty[$.</p>` },
    { k: 'thm', t: 'Weierstrass',
      key: R`<p>$f$ continue sur $[a,b]$ = limite <b>uniforme</b> de polynômes</p>` },
    { k: 'warn', t: 'Pièges',
      key: R`<ul><li>Chercher la CVU <b>avant</b> la limite simple.</li><li>Un sup calculé numériquement est un <b>minorant</b>.</li><li>« Uniforme sur tout segment » ≠ « uniforme sur $I$ ».</li></ul>` }
  ];

  /* ------------------------------------------------------------------ */
  /* Exercices                                                           */
  /* ------------------------------------------------------------------ */
  const exercices = [
    {
      id: 'puissances', title: 'La suite xⁿ', diff: 1, gen: 'cvu',
      enonce: R`<p>Soit $f_n(x) = x^n$. Étudier la convergence simple et uniforme de $(f_n)$ sur $[0, 1]$, sur $[0, 1[$, puis sur $\left[0, \frac12\right]$.</p>`,
      correction: R`<p><b>Limite simple</b> : $f(x) = 0$ si $0 \le x < 1$, $f(1) = 1$.</p>
        <ul><li>Sur $[0,1]$ : $f$ discontinue en $1$, les $f_n$ continues ⇒ <b>pas de CVU</b>.</li>
        <li>Sur $[0,1[$ : $f = 0$ continue, mais $\sup_{[0,1[}x^n = 1$ ⇒ <b>pas de CVU</b>.</li>
        <li>Sur $[0, \frac12]$ : $\sup x^n = \frac{1}{2^n} \to 0$ ⇒ <b>CVU</b>.</li></ul>`
    },
    {
      id: 'bosse', title: 'Une bosse qui glisse', diff: 2, gen: 'cvu',
      enonce: R`<p>On pose $f_n(x) = \dfrac{nx}{1 + n^2x^2}$ sur $[0, +\infty[$.</p><ol><li>Déterminer la limite simple.</li><li>Calculer $\|f_n\|_\infty$. Y a-t-il convergence uniforme sur $[0, +\infty[$ ?</li><li>Montrer la convergence uniforme sur $[a, +\infty[$ pour $a > 0$.</li></ol>`,
      correction: R`<p>1. $f_n(0) = 0$ et, pour $x > 0$, $f_n(x) \sim \frac{1}{nx} \to 0$ : $f = 0$.</p>
        <p>2. $f_n'(x) = \dfrac{n(1 - n^2x^2)}{(1 + n^2x^2)^2}$ s'annule en $x = \frac1n$ : $\|f_n\|_\infty = f_n\!\left(\frac1n\right) = \frac12$, qui ne tend pas vers $0$. <b>Pas de CVU</b> sur $[0, +\infty[$.</p>
        <p>3. Pour $n \ge \frac1a$, $f_n$ est décroissante sur $[a, +\infty[$ donc $\sup_{[a, +\infty[}f_n = f_n(a) = \dfrac{na}{1 + n^2a^2} \le \dfrac{1}{na} \to 0$ : <b>CVU</b> sur $[a, +\infty[$.</p>`
    },
    {
      id: 'interversion', title: 'Limite d’intégrales', diff: 2, gen: 'interversion',
      enonce: R`<p>Soit $f_n(x) = nx(1 - x^2)^n$ sur $[0, 1]$.</p><ol><li>Montrer que $(f_n)$ converge simplement vers $0$.</li><li>Calculer $\int_0^1 f_n$ et sa limite. Conclure.</li></ol>`,
      indication: R`<p>Une primitive de $x(1-x^2)^n$ est $-\dfrac{(1 - x^2)^{n+1}}{2(n+1)}$.</p>`,
      correction: R`<p>1. $f_n(0) = 0$ ; pour $x \in\, ]0, 1]$, $0 \le 1 - x^2 < 1$ et $n q^n \to 0$ pour $0 \le q < 1$ : $f_n(x) \to 0$.</p>
        <p>2. $\int_0^1 f_n = n\left[-\dfrac{(1-x^2)^{n+1}}{2(n+1)}\right]_0^1 = \dfrac{n}{2(n+1)} \to \dfrac12$.</p>
        <p>Comme $\frac12 \neq 0 = \int_0^1 \lim f_n$, <b>la convergence n'est pas uniforme</b> sur $[0,1]$ (sinon le théorème d'intégration donnerait $0$).</p>`
    },
    {
      id: 'racine', title: 'Limite uniforme non dérivable', diff: 2, gen: 'limite',
      enonce: R`<p>Soit $f_n(x) = \sqrt{x^2 + \frac1n}$ sur $\R$.</p><ol><li>Montrer que $(f_n)$ converge uniformément vers $x \mapsto |x|$ sur $\R$.</li><li>Que peut-on dire de la dérivabilité de la limite ? Pourquoi le théorème de dérivation ne s'applique-t-il pas ?</li></ol>`,
      correction: R`<p>1. Avec la quantité conjuguée : $0 \le f_n(x) - |x| = \dfrac{1/n}{\sqrt{x^2 + 1/n} + |x|} \le \dfrac{1/n}{\sqrt{1/n}} = \dfrac{1}{\sqrt n}$, majoration indépendante de $x$ : <b>CVU</b>.</p>
        <p>2. $|x|$ n'est pas dérivable en $0$, alors que chaque $f_n$ est $C^\infty$. Le théorème exige la CVU des <b>dérivées</b> : or $f_n'(x) = \dfrac{x}{\sqrt{x^2 + 1/n}}$ converge simplement vers la fonction signe (avec $0$ en $0$), discontinue, donc pas uniformément.</p>`,
      similaires: [
        {
          title: 'Dérivées qui ne convergent pas',
          enonce: R`<p>Soit $f_n(x) = \dfrac{\sin(nx)}{n}$. Montrer que $(f_n)$ converge uniformément vers $0$ sur $\R$, mais que $(f_n')$ ne converge pas simplement.</p>`,
          correction: R`<p>$|f_n(x)| \le \frac1n$ : CVU vers $0$. $f_n'(x) = \cos(nx)$ : en $x = \pi$, $f_n'(\pi) = (-1)^n$ ne converge pas.</p>`
        }
      ]
    },
    {
      id: 'sinus', title: 'Uniforme sur tout segment seulement', diff: 2, gen: 'limite',
      enonce: R`<p>Soit $f_n(x) = n\sin\left(\dfrac xn\right)$ sur $\R$.</p><ol><li>Déterminer la limite simple $f$.</li><li>À l'aide de $|\sin t - t| \le \dfrac{|t|^3}{6}$, montrer la convergence uniforme sur $[-A, A]$ pour tout $A > 0$.</li><li>Y a-t-il convergence uniforme sur $\R$ ?</li></ol>`,
      correction: R`<p>1. $\sin\frac xn \sim \frac xn$, donc $f_n(x) \to x$ : $f(x) = x$.</p>
        <p>2. $|f_n(x) - x| = n\left|\sin\frac xn - \frac xn\right| \le n\cdot\dfrac{|x|^3}{6n^3} \le \dfrac{A^3}{6n^2}$ sur $[-A, A]$ : <b>CVU</b>.</p>
        <p>3. Avec $x_n = \frac{n\pi}{2}$ : $f_n(x_n) - x_n = n - \frac{n\pi}{2} \to -\infty$. <b>Pas de CVU</b> sur $\R$.</p>`
    },
    {
      id: 'bornee', title: 'Limite uniforme de fonctions bornées', diff: 1,
      enonce: R`<p>Montrer que si chaque $f_n$ est bornée sur $I$ et si $(f_n)$ converge uniformément vers $f$ sur $I$, alors $f$ est bornée. Est-ce vrai avec la convergence simple ?</p>`,
      correction: R`<p>Soit $N$ tel que $\|f_N - f\|_\infty \le 1$. Pour tout $x$ : $|f(x)| \le |f(x) - f_N(x)| + |f_N(x)| \le 1 + \|f_N\|_\infty$ : $f$ est bornée.</p>
        <p>Faux pour la convergence simple : $f_n(x) = \min(n, \frac1x)$ sur $]0, 1]$ est bornée par $n$, mais converge simplement vers $\frac1x$, non bornée.</p>`,
      similaires: [
        {
          title: 'Le produit de deux suites uniformément convergentes',
          enonce: R`<p>Sur $\R$, on pose $f_n(x) = x + \frac1n$ et $g_n(x) = x$. Montrer que $(f_n)$ et $(g_n)$ convergent uniformément, mais pas $(f_ng_n)$.</p>`,
          correction: R`<p>$\|f_n - x\|_\infty = \frac1n \to 0$ et $g_n = x$. Mais $f_n(x)g_n(x) - x^2 = \frac xn$ et, avec $x_n = n$, cet écart vaut $1 \not\to 0$ : pas de CVU du produit (les limites ne sont pas bornées).</p>`
        },
        {
          title: 'Limite uniforme de fonctions lipschitziennes',
          enonce: R`<p>On suppose que chaque $f_n$ est $k$-lipschitzienne sur $I$ ($k$ fixé). Montrer que si $(f_n)$ converge simplement vers $f$, alors $f$ est $k$-lipschitzienne.</p>`,
          correction: R`<p>Pour $x, y \in I$ : $|f_n(x) - f_n(y)| \le k|x - y|$. On passe à la limite $n \to \infty$ (convergence simple suffit) : $|f(x) - f(y)| \le k|x - y|$.</p>`
        }
      ]
    },
    {
      id: 'python', title: 'Conjecturer avec Python, puis démontrer', diff: 2,
      enonce: R`<p>Soit $f_n(x) = x^n(1 - x)$ sur $[0, 1]$.</p><ol><li>Écrire une fonction Python <code>norme_sup(g, a, b, N)</code> qui estime $\sup_{[a,b]}|g|$ sur une grille, et l'appliquer à $f_n$ pour $n = 1, 10, 100, 1000$. Conjecture ?</li><li>Démontrer la conjecture.</li></ol>`,
      correction: code(`def norme_sup(g, a, b, N=10000):
    return max(abs(g(a + k * (b - a) / N)) for k in range(N + 1))

for n in [1, 10, 100, 1000]:
    print(n, norme_sup(lambda x: x**n * (1 - x), 0, 1))
# 0.25, 0.0350, 0.00366, 0.000368 : semble tendre vers 0 comme 1/(e n)`) +
        R`<p>Conjecture : convergence uniforme vers $0$ (la limite simple est $0$ : $x^n \to 0$ pour $x < 1$, et $f_n(1) = 0$).</p>
        <p>Preuve : $f_n'(x) = x^{n-1}(n - (n+1)x)$ s'annule en $x_n = \frac{n}{n+1}$, où $f_n$ est maximale :</p>
        $$\|f_n\|_\infty = \left(\frac{n}{n+1}\right)^n\frac{1}{n+1} \le \frac{1}{n+1} \to 0.$$
        <p>(Plus précisément $\|f_n\|_\infty \sim \frac{1}{en}$, ce qui correspond aux valeurs numériques.)</p>`
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiches méthodes                                                     */
  /* ------------------------------------------------------------------ */
  const methodes = [
    {
      title: 'Trouver la limite simple', gen: 'limite',
      cas: R`On donne $(f_n)$ et on demande « étudier la convergence »`, debut: R`<b>Fixer $x \in I$</b> et étudier la suite de nombres $(f_n(x))_n$ ; séparer les cas ($x = 0$, $x < 1$, $x = 1$…).`,
      quand: R`<p>Toujours en premier : la limite simple est la seule limite uniforme possible.</p>`,
      etapes: [
        R`<b>Fixer $x$</b> ; repérer les valeurs de $x$ qui se comportent différemment (bords, $0$, $1$…).`,
        R`Calculer $\lim_n f_n(x)$ avec les outils sur les suites : <b>croissances comparées</b>, équivalents, $q^n \to 0$ si $|q| < 1$.`,
        R`Écrire la fonction limite $f$, avec ses différents cas.`,
        R`Regarder si $f$ est <b>continue</b> : si les $f_n$ le sont et pas $f$, il n'y a pas de CVU.`
      ],
      exemple: {
        enonce: R`<p>Limite simple de $f_n(x) = \dfrac{1}{1 + x^{2n}}$ sur $\R$.</p>`,
        solution: R`<p>$|x| < 1$ : $x^{2n} \to 0$, $f_n(x) \to 1$. $|x| = 1$ : $f_n(x) = \frac12$. $|x| > 1$ : $x^{2n} \to +\infty$, $f_n(x) \to 0$. La limite est discontinue en $\pm 1$ : pas de CVU sur $\R$.</p>`
      },
      pieges: [R`Oublier les cas particuliers ($x = 0$, $x = 1$) qui changent la limite.`]
    },
    {
      title: 'Démontrer la convergence uniforme', gen: 'cvu',
      cas: R`Montrer que $f_n \to f$ <b>uniformément</b> sur $I$`, debut: R`Poser $g_n = f_n - f$ et <b>majorer $|g_n(x)|$ par un $\alpha_n$ indépendant de $x$</b> ; sinon calculer $\sup|g_n|$ par une étude de variations.`,
      etapes: [
        R`Déterminer la limite simple $f$.`,
        R`Essayer une <b>majoration directe</b> : $|f_n(x) - f(x)| \le \alpha_n$ avec $\alpha_n \to 0$ (inégalités usuelles, $|\sin| \le 1$, quantité conjuguée…).`,
        R`Sinon, <b>étudier les variations</b> de $g_n = f_n - f$ ($g_n'$, tableau) pour calculer $\|g_n\|_\infty$ exactement.`,
        R`Conclure : $\|f_n - f\|_\infty \to 0$.`
      ],
      exemple: {
        enonce: R`<p>CVU de $f_n(x) = \dfrac{x}{1 + nx^2}$ sur $\R$.</p>`,
        solution: R`<p>$f = 0$. Par $1 + nx^2 \ge 2\sqrt n|x|$ : $|f_n(x)| \le \dfrac{1}{2\sqrt n}$ pour tout $x$. Donc $\|f_n\|_\infty \le \frac{1}{2\sqrt n} \to 0$ : CVU.</p>`
      },
      pieges: [R`Majorer par une quantité qui dépend encore de $x$ (ex. $\frac{1}{nx}$) : ce n'est pas une majoration uniforme.`]
    },
    {
      title: 'Montrer qu’il n’y a pas convergence uniforme', gen: 'cvu',
      cas: R`On soupçonne l'absence de CVU (bosse qui se déplace, limite discontinue)`, debut: R`<b>Trouver $x_n \in I$</b> (souvent l'abscisse du maximum de $f_n$) tel que $f_n(x_n) - f(x_n) \not\to 0$.`,
      etapes: [
        R`Si les $f_n$ sont continues et $f$ <b>discontinue</b> : c'est fini, pas de CVU.`,
        R`Sinon, chercher la « bosse » : point où $|f_n - f|$ est maximal (souvent $\frac1n$, $\frac{1}{\sqrt n}$, $1 - \frac1n$).`,
        R`Calculer $f_n(x_n) - f(x_n)$ et montrer qu'il ne tend pas vers $0$.`,
        R`Bonus : chercher sur quels sous-intervalles la convergence redevient uniforme (on évite la bosse).`
      ],
      exemple: {
        enonce: R`<p>$f_n(x) = n^2x\,e^{-nx}$ sur $[0, +\infty[$.</p>`,
        solution: R`<p>$f = 0$. Avec $x_n = \frac1n$ : $f_n(x_n) = \frac ne \to +\infty$. Pas de CVU.</p>`
      }
    },
    {
      title: 'Intervertir limite et intégrale', gen: 'interversion',
      cas: R`Calculer $\lim_n \int_a^b f_n$`, debut: R`Vérifier les hypothèses : <b>segment</b> $[a,b]$ + <b>CVU</b> ⇒ la limite vaut $\int_a^b f$. Sinon, calculer $\int f_n$ directement.`,
      etapes: [
        R`Déterminer la limite simple $f$.`,
        R`Si la CVU sur $[a, b]$ est facile : conclure $\lim\int f_n = \int f$.`,
        R`Sinon calculer $\int_a^b f_n$ explicitement (primitive) et passer à la limite.`,
        R`Si on trouve $\lim\int f_n \neq \int f$ : on a <b>prouvé</b> qu'il n'y a pas de CVU.`
      ],
      exemple: {
        enonce: R`<p>$\lim\int_0^1 \dfrac{x^n}{1 + x}\dd x$ ?</p>`,
        solution: R`<p>Pas de CVU sur $[0,1]$ (limite discontinue en $1$), mais on majore directement : $0 \le \int_0^1\frac{x^n}{1+x} \le \int_0^1 x^n = \frac{1}{n+1} \to 0$.</p>`
      },
      pieges: [R`Appliquer le théorème sur un intervalle non borné, ou sans vérifier la CVU.`]
    },
    {
      title: 'Montrer que la limite est dérivable',
      cas: R`Montrer que $f = \lim f_n$ est $C^1$ et calculer $f'$`, debut: R`Étudier la <b>convergence uniforme des dérivées $f_n'$</b> sur tout segment (et la convergence de $f_n$ en un point).`,
      etapes: [
        R`Calculer $f_n'$ et sa limite simple $g$.`,
        R`Montrer que $f_n' \to g$ <b>uniformément</b> sur tout segment $[a, b] \subset I$.`,
        R`Vérifier que $(f_n(x_0))$ converge en un point.`,
        R`Conclure : $f$ est $C^1$ sur $I$ et $f' = g$ (dérivabilité locale).`
      ],
      exemple: {
        enonce: R`<p>$f_n(x) = \dfrac{\sin(nx)}{n^3}$ : la limite est-elle $C^1$ ?</p>`,
        solution: R`<p>$f_n'(x) = \dfrac{\cos(nx)}{n^2}$, $\|f_n'\|_\infty = \frac{1}{n^2} \to 0$ : CVU des dérivées vers $0$, et $f_n(0) = 0$. Donc $f = 0$ est $C^1$ et $f' = 0$ (ce qu'on savait, mais le schéma de preuve est général).</p>`
      }
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche méthode, partie 1 : plan de travail ; partie 2 : cas à reconnaître */
  /* ------------------------------------------------------------------ */
  const plan = {
    etapes: [
      { titre: 'Trouver la limite simple', faire: R`<b>Fixer $x$</b> et calculer $\lim_n f_n(x)$, en distinguant les cas ($x = 0$, $x < 1$, $x = 1$…).`,
        questions: [R`Sur quel intervalle $I$ ? Borné ? Fermé ?`] },
      { titre: 'Regarder la limite', faire: R`Est-elle <b>continue</b> ? Si les $f_n$ le sont et pas $f$ : <b>pas de CVU</b>, c'est fini.` },
      { titre: 'Étudier l’écart', faire: R`Poser $g_n = f_n - f$ et chercher $\|g_n\|_\infty$ : <b>majoration uniforme</b> ou <b>étude de variations</b>.` },
      { titre: 'Conclure sur la CVU', faire: R`$\|g_n\|_\infty \to 0$ : CVU. Sinon, exhiber $x_n$ avec $g_n(x_n) \not\to 0$. Chercher les <b>sous-intervalles</b> où la CVU revient.` },
      { titre: 'Exploiter', faire: R`Continuité de la limite, $\lim\int_a^b f_n = \int_a^b f$ (<b>segment + CVU</b>), dérivation (<b>CVU des $f_n'$</b>).` }
    ]
  };
  const reperes = [
    { etape: 1, si: R`Une puissance $n$ : $a(x)^n$, $\left(1 + \frac xn\right)^n$`, alors: R`Écrire <b>$\exp\big(n\ln(\ldots)\big)$</b> ; si $|a(x)| < 1$, $a(x)^n \to 0$.`, ex: R`$\left(1 + \frac xn\right)^n = e^{n\ln(1 + x/n)} \to e^x$.` },
    { etape: 1, si: R`$x^n$ avec $x \ge 0$`, alors: R`Trois cas : <b>$x < 1$, $x = 1$, $x > 1$</b>.` },
    { etape: 1, si: R`Un produit $n^p \times e^{-nx}$`, alors: R`<b>Croissances comparées</b> : l'exponentielle l'emporte pour $x > 0$ ; traiter $x = 0$ à part.` },
    { etape: 3, si: R`Un $\sin(nx)$ ou $\cos(nx)$`, alors: R`<b>Majorer</b> par $1$ : on obtient un $\alpha_n$ indépendant de $x$.`, ex: R`$\left|\frac{\sin(nx)}{\sqrt n}\right| \le \frac{1}{\sqrt n}$ : CVU vers $0$.` },
    { etape: 3, si: R`Une fraction du type $\frac{x}{1 + nx^2}$`, alors: R`Inégalité <b>$a^2 + b^2 \ge 2ab$</b> : $1 + nx^2 \ge 2\sqrt n\,|x|$.` },
    { etape: 3, si: R`Une différence de racines $\sqrt{\cdots} - \sqrt{\cdots}$`, alors: R`<b>Quantité conjuguée</b> pour faire apparaître une majoration.` },
    { etape: 3, si: R`$\sin\frac xn$, $\ln\left(1 + \frac xn\right)$ comparés à leur équivalent`, alors: R`Inégalités de <b>Taylor</b> : $|\sin t - t| \le \frac{|t|^3}{6}$, $|\ln(1+t) - t| \le \frac{t^2}{2}$ ($t \ge 0$).` },
    { etape: 3, si: R`Aucune majoration évidente`, alors: R`<b>Étudier les variations</b> de $g_n$ (dérivée, tableau) pour trouver le maximum exact.` },
    { etape: 4, si: R`Un maximum en $x_n = \frac1n$, $\frac{1}{\sqrt n}$, $1 - \frac1n$ (une « bosse » qui se déplace)`, alors: R`Évaluer $g_n(x_n)$ : s'il ne tend pas vers $0$, <b>pas de CVU</b> ; la CVU revient sur des intervalles qui <b>évitent la bosse</b>.` },
    { etape: 4, si: R`Un intervalle non borné et une limite comme $x$ ou $e^x$`, alors: R`Tester $x_n = n$ (ou $n\pi$…) : l'écart explose souvent, <b>CVU seulement sur les segments</b>.` },
    { etape: 5, si: R`Calculer $\lim\int_a^b f_n$ sans CVU`, alors: R`<b>Majorer directement</b> $\left|\int f_n\right|$, ou calculer $\int f_n$ explicitement.` },
    { etape: 5, si: R`Montrer que la limite est $C^1$`, alors: R`Étudier la <b>CVU des dérivées $f_n'$</b>, pas celle des $f_n$.` }
  ];

  L2.chapter('aai', 'suites-fonctions', {
    intro: R`<p>Une suite de fonctions $(f_n)$ peut converger « point par point » (convergence <strong>simple</strong>) ou « globalement » (convergence <strong>uniforme</strong>). Seule la seconde transmet la continuité à la limite et permet de permuter limite et intégrale. Ces notions sont à la base de l'approximation des fonctions par ordinateur.</p>`,
    cours, fiche, exercices, methodes, generateurs, plan, reperes
  });
})();
