/* Analyse et applications informatiques — Chapitre 3 : Courbes paramétrées */
(function () {
  'use strict';
  const R = String.raw;
  const code = L2.code;
  const { F, dec } = ML;
  const { courbe, fig } = PLOT;
  const approx = x => R`\approx ${dec(x, 4)}`;
  const pn = x => (x < 0 ? '(' + x + ')' : String(x));
  const fact = k => { let f = 1; for (let i = 2; i <= k; i++) f *= i; return f; };
  const coefT = (c, s) => (c === 1 ? s : c === -1 ? '-' + s : c + s);           // c·s en TeX (c entier non nul)
  const plusT = (c, s) => (c > 0 ? ' + ' + coefT(c, s) : ' - ' + coefT(-c, s));    // « + c·s » ou « - |c|·s »
  const shiftT = (v, rest) => (v === 0 ? rest.replace(/^ \+ /, '').replace(/^ - /, '-') : String(v) + rest);
  const mono = k => (k === 1 ? 't' : 't^{' + k + '}');
  const plusC = c => (c > 0 ? ' + ' + c : ' - ' + (-c));                          // « + c » ou « - |c| » (constante)

  /* Courbes de référence pour les figures */
  const C = {
    cercle: { x: t => Math.cos(t), y: t => Math.sin(t), t0: 0, t1: 2 * Math.PI },
    ellipse: { x: t => 3 * Math.cos(t), y: t => 2 * Math.sin(t), t0: 0, t1: 2 * Math.PI },
    cycloide: { x: t => t - Math.sin(t), y: t => 1 - Math.cos(t), t0: 0, t1: 4 * Math.PI },
    lissajous: { x: t => Math.sin(t), y: t => Math.sin(2 * t), t0: 0, t1: 2 * Math.PI },
    astroide: { x: t => Math.pow(Math.cos(t), 3), y: t => Math.pow(Math.sin(t), 3), t0: 0, t1: 2 * Math.PI },
    cubique: { x: t => t * t, y: t => t * t * t - 3 * t, t0: -2.3, t1: 2.3 },
    hyperbole: { x: t => t + 1 / t, y: t => t - 1 / t, t0: 0.2, t1: 5 }
  };

  /* ------------------------------------------------------------------ */
  /* Générateurs                                                         */
  /* ------------------------------------------------------------------ */
  /* Point stationnaire en t = 0 : M(t) = (x0 + a t^m, y0 + b t^n + c t^r), éventuellement x et y échangés */
  const SING = [
    { m: 2, n: 3, r: 0 }, { m: 2, n: 3, r: 4 }, { m: 2, n: 5, r: 0 }, { m: 3, n: 5, r: 0 },
    { m: 3, n: 4, r: 0 }, { m: 2, n: 4, r: 5 }, { m: 1, n: 3, r: 0 }, { m: 1, n: 2, r: 0 }
  ];
  const TYPE = (p, q) => (p % 2 === 1
    ? (q % 2 === 0 ? { nom: 'point ordinaire', desc: 'la courbe reste d’un même côté de la tangente et la traverse « normalement »' }
                   : { nom: 'point d’inflexion', desc: 'la courbe traverse sa tangente' })
    : (q % 2 === 1 ? { nom: 'point de rebroussement de première espèce', desc: 'la courbe fait demi-tour, les deux arcs étant de part et d’autre de la tangente' }
                   : { nom: 'point de rebroussement de seconde espèce', desc: 'la courbe fait demi-tour, les deux arcs étant du même côté de la tangente' }));

  const LONG = [
    r => { const Rr = r.int(1, 3); return { nom: 'une arche de cycloïde', x: t => Rr * (t - Math.sin(t)), y: t => Rr * (1 - Math.cos(t)), t0: 0, t1: 2 * Math.PI,
      param: R`x(t) = ${Rr === 1 ? '' : Rr}(t - \sin t),\ y(t) = ${Rr === 1 ? '' : Rr}(1 - \cos t),\ t \in [0, 2\pi]`,
      d: R`x'(t) = ${Rr === 1 ? '' : Rr}(1 - \cos t),\ y'(t) = ${Rr === 1 ? '' : Rr}\sin t`,
      n2: R`${Rr * Rr === 1 ? '' : Rr * Rr}\big((1 - \cos t)^2 + \sin^2 t\big) = ${Rr * Rr === 1 ? '' : Rr * Rr}(2 - 2\cos t) = ${4 * Rr * Rr}\sin^2\frac t2`,
      n: R`${2 * Rr}\sin\frac t2 \quad (\sin\tfrac t2 \ge 0 \text{ sur } [0, 2\pi])`,
      calc: R`\int_0^{2\pi}${2 * Rr}\sin\frac t2\dd t = \left[-${4 * Rr}\cos\frac t2\right]_0^{2\pi} = ${4 * Rr} + ${4 * Rr}`, L: String(8 * Rr), Lv: 8 * Rr }; },
    r => { const a = r.int(1, 3); return { nom: 'l’astroïde', x: t => a * Math.pow(Math.cos(t), 3), y: t => a * Math.pow(Math.sin(t), 3), t0: 0, t1: 2 * Math.PI,
      param: R`x(t) = ${a === 1 ? '' : a}\cos^3 t,\ y(t) = ${a === 1 ? '' : a}\sin^3 t,\ t \in [0, 2\pi]`,
      d: R`x'(t) = -${3 * a}\cos^2 t\sin t,\ y'(t) = ${3 * a}\sin^2 t\cos t`,
      n2: R`${9 * a * a}\sin^2 t\cos^2 t(\cos^2 t + \sin^2 t) = ${9 * a * a}\sin^2 t\cos^2 t`,
      n: R`${3 * a}|\sin t\cos t|`,
      calc: R`4\int_0^{\pi/2}${3 * a}\sin t\cos t\dd t = 4 \times ${3 * a}\left[\frac{\sin^2 t}{2}\right]_0^{\pi/2} = 4 \times ${F(3 * a, 2).tex()}`, L: String(6 * a), Lv: 6 * a, sym: true }; },
    r => { const b = r.pick([2, 3, 5]), Lf = F(b * b - 1, 2 * b); return { nom: 'la chaînette $y = \\cosh x$ sur $[0, \\ln ' + b + ']$', x: t => t, y: t => Math.cosh(t), t0: 0, t1: Math.log(b),
      param: R`x(t) = t,\ y(t) = \cosh t,\ t \in [0, \ln ${b}]`,
      d: R`x'(t) = 1,\ y'(t) = \sinh t`,
      n2: R`1 + \sinh^2 t = \cosh^2 t`, n: R`\cosh t`,
      calc: R`\int_0^{\ln ${b}}\cosh t\dd t = \sinh(\ln ${b}) = \frac{${b} - \frac1{${b}}}{2}`, L: Lf.tex(), Lv: Lf.val() }; },
    r => { const A = r.pick([3, 8, 15, 24]), s = Math.sqrt(1 + A), Lf = F(2 * (s * s * s - 1), 3); return { nom: R`le graphe de $y = \frac23x^{3/2}$ sur $[0, ${A}]$`, x: t => t, y: t => 2 / 3 * Math.pow(t, 1.5), t0: 0, t1: A,
      param: R`x(t) = t,\ y(t) = \tfrac23t^{3/2},\ t \in [0, ${A}]`,
      d: R`x'(t) = 1,\ y'(t) = \sqrt t`,
      n2: R`1 + t`, n: R`\sqrt{1 + t}`,
      calc: R`\int_0^{${A}}\sqrt{1 + t}\dd t = \left[\frac23(1 + t)^{3/2}\right]_0^{${A}} = \frac23\left(${s}^3 - 1\right)`, L: Lf.tex(), Lv: Lf.val() }; },
    r => { const T2 = r.pick([3, 8, 15]), s = Math.sqrt(1 + T2), Tt = { 3: R`\sqrt3`, 8: R`2\sqrt2`, 15: R`\sqrt{15}` }[T2], Lf = F(2 * (s * s * s - 1), 3);
      return { nom: R`l’arc $t \mapsto (t^2, \frac23t^3)$ pour $t \in [0, ${Tt}]$`, x: t => t * t, y: t => 2 / 3 * t * t * t, t0: 0, t1: Math.sqrt(T2),
        param: R`x(t) = t^2,\ y(t) = \tfrac23t^3,\ t \in [0, ${Tt}]`,
        d: R`x'(t) = 2t,\ y'(t) = 2t^2`,
        n2: R`4t^2 + 4t^4 = 4t^2(1 + t^2)`, n: R`2t\sqrt{1 + t^2} \quad (t \ge 0)`,
        calc: R`\int_0^{${Tt}}2t\sqrt{1 + t^2}\dd t = \left[\frac23(1 + t^2)^{3/2}\right]_0^{${Tt}} = \frac23\left(${s}^3 - 1\right)`, L: Lf.tex(), Lv: Lf.val() }; }
  ];

  const generateurs = {
    tangentes: {
      title: 'Tangentes, symétrie et point double', diff: 2,
      make(r) {
        const c = r.int(1, 2), k = r.pick([1, 1, 2, -1]), al = r.int(-2, 2), be = r.int(-2, 2);
        const X = t => t * t + al, Y = t => k * (t * t * t - 3 * c * c * t) + be;
        const xT = R`t^2${al === 0 ? '' : plusC(al)}`;
        const yT = R`${coefT(k, 't^3')}${plusT(-3 * c * c * k, 't')}${be === 0 ? '' : plusC(be)}`;
        const yp = R`${3 * k === 1 ? '' : 3 * k === -1 ? '-' : 3 * k}(t^2 - ${c * c})`;
        const H1 = [c * c + al, be - 2 * k * c * c * c], H2 = [c * c + al, be + 2 * k * c * c * c], V = [al, be], D = [3 * c * c + al, be];
        const sq = c === 1 ? R`\sqrt3` : R`2\sqrt3`;
        const svg = courbe([{ x: X, y: Y, t0: -2.25 * c, t1: 2.25 * c }], {
          marks: [{ x: H1[0], y: H1[1], label: 'H₁' }, { x: H2[0], y: H2[1], label: 'H₂' }, { x: V[0], y: V[1], label: 'V', dx: -18 }, { x: D[0], y: D[1], label: 'D' }],
          label: 'courbe paramétrée' });
        return {
          enonce: R`<p>On considère la courbe $t \mapsto M(t) = \big(x(t), y(t)\big)$ avec $x(t) = ${xT}$ et $y(t) = ${yT}$, $t \in \R$.</p>
            <ol><li>Comparer $M(-t)$ et $M(t)$ ; en déduire une symétrie de la courbe.</li><li>Déterminer les points où la tangente est horizontale, puis verticale.</li><li>Montrer que la courbe a un point double et donner les tangentes en ce point.</li><li>Tracer l'allure de la courbe.</li></ol>`,
          indication: R`<p>Point double : $M(t_1) = M(t_2)$ avec $t_1 \neq t_2$ ; ici $x(t_1) = x(t_2)$ impose $t_2 = -t_1$.</p>`,
          correction: R`<p>1. $x(-t) = x(t)$ et $y(-t) - ${pn(be)} = -\big(y(t) - ${pn(be)}\big)$ : la courbe est symétrique par rapport à la droite $y = ${be}$. On peut l'étudier pour $t \ge 0$.</p>
            <p>2. $x'(t) = 2t$ et $y'(t) = ${yp}$. Tangente horizontale ($y' = 0$, $x' \neq 0$) pour $t = \pm${c}$ : points $H_1 = (${H1[0]}, ${H1[1]})$ et $H_2 = (${H2[0]}, ${H2[1]})$. Tangente verticale ($x' = 0$, $y' \neq 0$) pour $t = 0$ : point $V = (${V[0]}, ${V[1]})$. Pas de point stationnaire.</p>
            <p>3. $M(t) = M(-t)$ avec $t \neq 0$ $\iff$ $${coefT(k, 't^3')}${plusT(-3 * c * c * k, 't')} = 0 \iff t^2 = ${3 * c * c}$, soit $t = \pm${sq}$ : point double $D = (${D[0]}, ${D[1]})$. Tangentes dirigées par $M'(\pm${sq}) = \left(\pm${2 * c}\sqrt3, ${6 * k * c * c}\right)$.</p>${fig([svg, 'la boucle se referme au point double D'])}`,
          detail: {
            but: R`<p>Étudier symétrie, tangentes particulières et point double d'une courbe polynomiale.</p>`,
            methode: R`<p>Comparer $M(-t)$ à $M(t)$ ; dériver ; tangente horizontale quand $y' = 0 \neq x'$, verticale quand $x' = 0 \neq y'$ ; point double : résoudre $M(t_1) = M(t_2)$, $t_1 \neq t_2$.</p>`,
            etapes: [
              R`<b>Symétrie.</b> $x(-t) = t^2${al === 0 ? '' : plusC(al)} = x(t)$ ; et $y(-t) = ${coefT(-k, 't^3')}${plusT(3 * c * c * k, 't')}${be === 0 ? '' : plusC(be)}$, donc $y(-t) - ${pn(be)} = -(y(t) - ${pn(be)})$. $M(-t)$ est le symétrique de $M(t)$ par rapport à la droite $y = ${be}$.`,
              R`<b>Dérivées.</b> $x'(t) = 2t$, $y'(t) = ${yp}$. Elles ne s'annulent jamais en même temps : tous les points sont réguliers.`,
              R`<b>Tangentes horizontales.</b> $y'(t) = 0 \iff t = \pm${c}$, et alors $x' = \pm${2 * c} \neq 0$. Points $M(${c}) = (${H1[0]}, ${H1[1]})$ et $M(-${c}) = (${H2[0]}, ${H2[1]})$.`,
              R`<b>Tangente verticale.</b> $x'(t) = 0 \iff t = 0$, et $y'(0) = ${-3 * k * c * c} \neq 0$. Point $M(0) = (${V[0]}, ${V[1]})$.`,
              R`<b>Point double.</b> $x(t_1) = x(t_2) \iff t_1^2 = t_2^2$, donc $t_2 = -t_1$ (avec $t_1 \neq 0$). Alors $y(t_1) = y(-t_1) \iff ${coefT(k, 't_1^3')}${plusT(-3 * c * c * k, 't_1')} = 0 \iff t_1^2 = ${3 * c * c}$, soit $t_1 = ${sq}$, $t_2 = -${sq}$. Point $D = M(${sq}) = (${D[0]}, ${D[1]})$.`,
              R`<b>Tangentes en $D$.</b> $M'(t) = \big(2t, ${yp}\big)$ ; en $t = \pm${sq}$ : $\left(\pm${2 * c}\sqrt3,\ ${6 * k * c * c}\right)$. Deux directions différentes : la courbe se croise en $D$.`,
              R`<b>Tracé.</b> Quand $t$ va de $-\infty$ à $+\infty$, on part de l'infini, on passe par $D$, on fait une boucle (passage en $H_2$, $V$, $H_1$), on revient en $D$, puis on repart vers l'infini.`
            ],
            retenir: R`<p>Symétrie d'abord (elle divise le travail par deux), puis tangentes par les zéros de $x'$ et $y'$, puis points doubles.</p>`
          }
        };
      }
    },

    singulier: {
      title: 'Étude locale en un point stationnaire', diff: 2,
      make(r) {
        const S = r.pick(SING), a = r.pick([1, 2, -1]), b = r.pick([1, 2, -1, -2]), cc = S.r ? r.pick([1, -1]) : 0;
        const x0 = r.int(-1, 1), y0 = r.int(-1, 1), swap = r.chance(0.4);
        const fx = t => x0 + a * Math.pow(t, S.m), fy = t => y0 + b * Math.pow(t, S.n) + cc * (S.r ? Math.pow(t, S.r) : 0);
        const uT = shiftT(x0, plusT(a, mono(S.m))), vT = shiftT(y0, plusT(b, mono(S.n)) + (S.r ? plusT(cc, mono(S.r)) : ''));
        const xT = swap ? vT : uT, yT = swap ? uT : vT;
        const X = swap ? fy : fx, Y = swap ? fx : fy;
        const P = swap ? [y0, x0] : [x0, y0];
        const vecs = [];
        for (let kk = 1; kk <= S.n; kk++) {
          const u = kk === S.m ? a * fact(kk) : 0, v = (kk === S.n ? b * fact(kk) : 0) + (kk === S.r ? cc * fact(kk) : 0);
          vecs.push(swap ? [v, u] : [u, v]);
        }
        const p = S.m, q = S.n, T = TYPE(p, q), stat = p > 1;
        const tangente = swap ? 'verticale' : 'horizontale';
        const svg = courbe([{ x: X, y: Y, t0: -1, t1: 1 }], { marks: [{ x: P[0], y: P[1], label: 'M(0)' }], w: 220, hmax: 220, label: 'allure locale' });
        return {
          enonce: R`<p>Soit $M(t) = \big(${xT},\ ${yT}\big)$. Le point $M(0)$ est-il régulier ? Déterminer la tangente en $M(0)$ et la nature de ce point (point ordinaire, d'inflexion, de rebroussement).</p>`,
          indication: R`<p>Chercher le premier entier $p$ tel que $M^{(p)}(0) \neq 0$, puis le premier $q \gt p$ tel que $M^{(q)}(0)$ ne soit pas colinéaire à $M^{(p)}(0)$ ; regarder les parités.</p>`,
          correction: R`<p>$M'(0) = (${vecs[0].join(', ')})$ : le point est ${stat ? '<b>stationnaire</b>' : '<b>régulier</b>'}. On trouve $p = ${p}$ avec $M^{(${p})}(0) = (${vecs[p - 1].join(', ')})$ : la tangente est <b>${tangente}</b>. Puis $q = ${q}$ avec $M^{(${q})}(0) = (${vecs[q - 1].join(', ')})$, non colinéaire.</p>
            <p>$p$ ${p % 2 ? 'impair' : 'pair'}, $q$ ${q % 2 ? 'impair' : 'pair'} : <b>${T.nom}</b> ; ${T.desc}.</p>${fig([svg, 'allure près de M(0)'])}`,
          detail: {
            but: R`<p>Déterminer la tangente et l'allure de la courbe près de $M(0) = (${P[0]}, ${P[1]})$.</p>`,
            methode: R`<p>Formule de Taylor : $M(t) = M(0) + \frac{t^p}{p!}M^{(p)}(0) + \dots + \frac{t^q}{q!}M^{(q)}(0) + o(t^q)$. La tangente est dirigée par $M^{(p)}(0)$ ; dans la base $\big(M^{(p)}(0), M^{(q)}(0)\big)$, les coordonnées de $M(t) - M(0)$ se comportent comme $\frac{t^p}{p!}$ et $\frac{t^q}{q!}$ : leurs signes selon que $t \gt 0$ ou $t \lt 0$ donnent l'allure.</p>`,
            etapes: [
              R`<b>Dérivées en 0.</b> ${vecs.map((v, i) => R`$M^{(${i + 1})}(0) = (${v.join(', ')})$`).join(' ; ')} (seul le monôme de degré $k$ contribue à la dérivée $k$-ième en 0, qui vaut $k!$ fois son coefficient).`,
              R`<b>Régulier ?</b> ${stat ? R`$M'(0) = (0, 0)$ : point <b>stationnaire</b>, il faut aller plus loin.` : R`$M'(0) \neq 0$ : point régulier, $p = 1$.`}`,
              R`<b>Entier $p$.</b> Premier vecteur dérivé non nul : $p = ${p}$, $M^{(${p})}(0) = (${vecs[p - 1].join(', ')})$. La tangente en $M(0)$ est dirigée par ce vecteur : elle est ${tangente}.`,
              R`<b>Entier $q$.</b> Premier vecteur dérivé non colinéaire au précédent : $q = ${q}$, $M^{(${q})}(0) = (${vecs[q - 1].join(', ')})$.`,
              R`<b>Signes.</b> $t^{${p}}$ ${p % 2 ? 'change de signe avec $t$' : 'reste positif'} ; $t^{${q}}$ ${q % 2 ? 'change de signe avec $t$' : 'reste positif'}. ${p % 2 ? 'On avance dans la direction de la tangente' : 'On repart dans le même sens le long de la tangente (demi-tour)'}, et ${q % 2 ? 'on change de côté de la tangente' : 'on reste du même côté de la tangente'}.`,
              R`<b>Conclusion.</b> $(p, q) = (${p}, ${q})$ : <b>${T.nom}</b> ; ${T.desc}.`
            ],
            retenir: R`<p>$p$ impair, $q$ pair : ordinaire ; $p$ impair, $q$ impair : inflexion ; $p$ pair, $q$ impair : rebroussement de 1<sup>re</sup> espèce ; $p$ pair, $q$ pair : rebroussement de 2<sup>de</sup> espèce.</p>`
          }
        };
      }
    },

    longueur: {
      title: 'Longueur d’un arc', diff: 2,
      make(r) {
        const T = r.pick(LONG)(r);
        let Lnum = 0; const N = 2000; let px = T.x(T.t0), py = T.y(T.t0);
        for (let i = 1; i <= N; i++) { const t = T.t0 + (T.t1 - T.t0) * i / N, xx = T.x(t), yy = T.y(t); Lnum += Math.hypot(xx - px, yy - py); px = xx; py = yy; }
        const svg = courbe([{ x: T.x, y: T.y, t0: T.t0, t1: T.t1 }], { label: 'arc' });
        return {
          enonce: R`<p>Calculer la longueur de ${T.nom}, paramétré par $${T.param}$.</p>`,
          indication: R`<p>$L = \int_a^b\sqrt{x'(t)^2 + y'(t)^2}\dd t$ ; simplifier la racine avant d'intégrer.</p>`,
          correction: R`${fig([svg])}<p>$${T.d}$, donc $x'^2 + y'^2 = ${T.n2}$ et $\|M'(t)\| = ${T.n}$.</p>
            <p>$L = ${T.calc} = ${T.L} ${approx(T.Lv)}$.</p>`,
          detail: {
            but: R`<p>Calculer la longueur de ${T.nom}.</p>`,
            methode: R`<p>$L = \int_a^b\|M'(t)\|\dd t$. Le point délicat est de <b>simplifier</b> $x'^2 + y'^2$ en un carré (identités trigonométriques, $\cosh^2 - \sinh^2 = 1$, factorisation) pour enlever la racine.</p>`,
            etapes: [
              R`<b>Dérivées.</b> $${T.d}$.`,
              R`<b>Carré de la norme.</b> $x'(t)^2 + y'(t)^2 = ${T.n2}$.`,
              R`<b>Norme.</b> $\|M'(t)\| = ${T.n}$.`,
              ...(T.sym ? [R`<b>Symétries.</b> La courbe est symétrique par rapport aux deux axes : on calcule le quart $t \in [0, \frac\pi2]$ (où $\sin t\cos t \ge 0$) et on multiplie par 4.`] : []),
              R`<b>Intégrale.</b> $L = ${T.calc} = ${T.L}$.`,
              R`<b>Contrôle numérique.</b> Une ligne polygonale inscrite de $2\,000$ segments mesure environ $${dec(Lnum, 4)}$, pour $L ${approx(T.Lv)}$ (une ligne inscrite est toujours un peu plus courte).`
            ],
            retenir: R`<p>Longueur = intégrale de la vitesse $\|M'(t)\|$ ; penser à $1 - \cos t = 2\sin^2\frac t2$ et à $1 + \sinh^2 = \cosh^2$.</p>`
          }
        };
      }
    },

    bezier: {
      title: 'Courbe de Bézier quadratique', diff: 1,
      make(r) {
        let P0, P1, P2;
        do { P0 = [r.int(0, 2), r.int(0, 3)]; P1 = [r.int(1, 4), r.int(0, 5)]; P2 = [r.int(3, 6), r.int(0, 3)]; }
        while ((P1[0] - P0[0]) * (P2[1] - P0[1]) - (P1[1] - P0[1]) * (P2[0] - P0[0]) === 0);
        const B = (t, i) => (1 - t) * (1 - t) * P0[i] + 2 * t * (1 - t) * P1[i] + t * t * P2[i];
        const A1 = [2 * (P1[0] - P0[0]), 2 * (P1[1] - P0[1])], A2 = [P0[0] - 2 * P1[0] + P2[0], P0[1] - 2 * P1[1] + P2[1]];
        const polyT = (i) => { let s = String(P0[i]); if (A1[i]) s += plusT(A1[i], 't'); if (A2[i]) s += plusT(A2[i], 't^2'); return s.replace(/^0 \+ /, '').replace(/^0 - /, '-'); };
        const mid = [F(P0[0] + 2 * P1[0] + P2[0], 4), F(P0[1] + 2 * P1[1] + P2[1], 4)];
        const d0 = A1, d1 = [2 * (P2[0] - P1[0]), 2 * (P2[1] - P1[1])];
        let hz = null;
        if (A2[1] !== 0) { const th = F(-A1[1], 2 * A2[1]); if (th.val() > 0 && th.val() < 1) hz = th; }
        const svg = courbe([{ x: t => B(t, 0), y: t => B(t, 1), t0: 0, t1: 1 }, { x: t => (t < 0.5 ? P0[0] + 2 * t * (P1[0] - P0[0]) : P1[0] + (2 * t - 1) * (P2[0] - P1[0])), y: t => (t < 0.5 ? P0[1] + 2 * t * (P1[1] - P0[1]) : P1[1] + (2 * t - 1) * (P2[1] - P1[1])), t0: 0, t1: 1, n: 2, cls: 'cv2' }],
          { marks: [{ x: P0[0], y: P0[1], label: 'P₀' }, { x: P1[0], y: P1[1], label: 'P₁' }, { x: P2[0], y: P2[1], label: 'P₂' }], label: 'courbe de Bézier' });
        return {
          enonce: R`<p>La courbe de Bézier de points de contrôle $P_0 = (${P0})$, $P_1 = (${P1})$, $P_2 = (${P2})$ est $B(t) = (1 - t)^2P_0 + 2t(1 - t)P_1 + t^2P_2$, $t \in [0, 1]$.</p>
            <ol><li>Calculer $B(0)$, $B(1)$ et $B\left(\frac12\right)$.</li><li>Calculer $B'(t)$, puis $B'(0)$ et $B'(1)$ : que remarque-t-on ?</li><li>Écrire $x(t)$ et $y(t)$ sous forme développée${hz ? ' et trouver le point où la tangente est horizontale' : ''}.</li></ol>`,
          indication: R`<p>$B'(t) = 2(1 - t)(P_1 - P_0) + 2t(P_2 - P_1)$.</p>`,
          correction: R`${fig([svg, 'en pointillés : le polygone de contrôle'])}<p>1. $B(0) = P_0$, $B(1) = P_2$, $B\left(\frac12\right) = \frac{P_0 + 2P_1 + P_2}{4} = \left(${mid[0].tex()}, ${mid[1].tex()}\right)$.</p>
            <p>2. $B'(0) = 2(P_1 - P_0) = (${d0})$ et $B'(1) = 2(P_2 - P_1) = (${d1})$ : la courbe part de $P_0$ <b>tangente à $[P_0P_1]$</b> et arrive en $P_2$ <b>tangente à $[P_1P_2]$</b> ; elle ne passe pas par $P_1$.</p>
            <p>3. $x(t) = ${polyT(0)}$, $y(t) = ${polyT(1)}$.${hz ? R` Tangente horizontale quand $y'(t) = ${A1[1]}${plusT(2 * A2[1], 't')} = 0$, soit $t = ${hz.tex()}$.` : ''}</p>`,
          detail: {
            but: R`<p>Comprendre le rôle des points de contrôle d'une courbe de Bézier.</p>`,
            methode: R`<p>Évaluer $B$ aux points simples, dériver la formule (règle du produit), puis développer en puissances de $t$.</p>`,
            etapes: [
              R`<b>Extrémités.</b> En $t = 0$ seul $(1-t)^2 = 1$ reste : $B(0) = P_0 = (${P0})$. En $t = 1$ : $B(1) = P_2 = (${P2})$.`,
              R`<b>Milieu du paramètre.</b> En $t = \frac12$ les poids valent $\frac14, \frac12, \frac14$ : $B\left(\frac12\right) = \frac{P_0 + 2P_1 + P_2}{4} = \left(${mid[0].tex()}, ${mid[1].tex()}\right)$.`,
              R`<b>Dérivée.</b> $B'(t) = -2(1 - t)P_0 + 2(1 - 2t)P_1 + 2tP_2 = 2(1 - t)(P_1 - P_0) + 2t(P_2 - P_1)$.`,
              R`<b>Tangentes aux extrémités.</b> $B'(0) = 2(P_1 - P_0) = (${d0})$ et $B'(1) = 2(P_2 - P_1) = (${d1})$ : les segments $[P_0P_1]$ et $[P_1P_2]$ sont tangents à la courbe en ses extrémités. C'est ce qui permet de « dessiner » la courbe en déplaçant $P_1$.`,
              R`<b>Forme développée.</b> $B(t) = P_0 + 2t(P_1 - P_0) + t^2(P_0 - 2P_1 + P_2)$, soit $x(t) = ${polyT(0)}$ et $y(t) = ${polyT(1)}$.`,
              ...(hz ? [R`<b>Tangente horizontale.</b> $y'(t) = ${A1[1]}${plusT(2 * A2[1], 't')}$ s'annule en $t = ${hz.tex()} \in ]0, 1[$ (et $x'$ n'y est pas nul) : point $B(${hz.tex()}) ${approx(B(hz.val(), 0))}$ en abscisse, $${approx(B(hz.val(), 1))}$ en ordonnée.`] : [])
            ],
            retenir: R`<p>Bézier quadratique : passe par $P_0$ et $P_2$, tangente à $P_0P_1$ et à $P_1P_2$, reste dans le triangle $P_0P_1P_2$. C'est la commande « Q » des chemins SVG et le principe des polices TrueType.</p>`
          }
        };
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Cours                                                               */
  /* ------------------------------------------------------------------ */
  const cours = [
    /* ================= 1 ================= */
    { t: 'h', title: 'Courbes paramétrées' },
    { t: 'def', body: R`<p>Soit $I$ un intervalle de $\R$. Une <strong>courbe paramétrée</strong> (ou arc paramétré) de classe $C^k$ est une application</p>
      $$M : I \to \R^2, \qquad t \mapsto M(t) = \big(x(t), y(t)\big),$$
      <p>où $x$ et $y$ sont de classe $C^k$ sur $I$. Son <strong>support</strong> (ou trajectoire) est l'ensemble des points $M(I) = \{M(t),\ t \in I\}$.</p>` },
    { t: 'rem', title: 'interprétation cinématique', body: R`<p>On pense à $t$ comme au temps et à $M(t)$ comme à la position d'un mobile : la courbe décrit un <strong>mouvement</strong>, pas seulement un dessin. Un même support peut être parcouru de plusieurs façons : $t \mapsto (\cos 2t, \sin 2t)$ sur $[0, 2\pi]$ fait deux fois le tour du cercle, deux fois plus vite que $(\cos t, \sin t)$.</p>` },
    { t: 'ex', body: R`<ul><li>Droite passant par $A = (x_A, y_A)$ dirigée par $\vec u = (a, b)$ : $M(t) = (x_A + at,\ y_A + bt)$.</li>
      <li>Cercle de centre $O$ et de rayon $R$ : $M(t) = (R\cos t, R\sin t)$ ; ellipse : $(a\cos t, b\sin t)$, de support $\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1$.</li>
      <li>Graphe d'une fonction $f$ : $M(t) = \big(t, f(t)\big)$ ; toute étude de fonction est un cas particulier.</li>
      <li>Cycloïde : $M(t) = \big(R(t - \sin t),\ R(1 - \cos t)\big)$, trajectoire d'un point d'une roue de rayon $R$ qui roule sans glisser.</li></ul>` },
    { t: 'p', body: fig([courbe([C.ellipse], { label: 'ellipse' }), 'ellipse (3 cos t, 2 sin t)'], [courbe([C.cycloide], { label: 'cycloïde', hmax: 160 }), 'cycloïde, deux arches']) },

    /* ================= 2 ================= */
    { t: 'h', title: 'Réduction du domaine d’étude' },
    { t: 'prop', title: 'périodicité', body: R`<p>Si $x$ et $y$ sont $T$-périodiques, $M(t + T) = M(t)$ : il suffit d'étudier la courbe sur un intervalle de longueur $T$.</p>` },
    { t: 'prop', title: 'symétries', body: R`<p>On compare $M(-t)$ (ou $M(a - t)$) à $M(t)$ :</p>
      <table class="t"><tr><th>si pour tout $t$…</th><th>alors $M(-t)$ est…</th><th>la courbe est symétrique par rapport à</th></tr>
      <tr><td>$x(-t) = x(t)$, $y(-t) = -y(t)$</td><td>le symétrique de $M(t)$ par rapport à $(Ox)$</td><td>l'axe $(Ox)$</td></tr>
      <tr><td>$x(-t) = -x(t)$, $y(-t) = y(t)$</td><td>le symétrique par rapport à $(Oy)$</td><td>l'axe $(Oy)$</td></tr>
      <tr><td>$x(-t) = -x(t)$, $y(-t) = -y(t)$</td><td>le symétrique par rapport à $O$</td><td>le point $O$</td></tr>
      <tr><td>$x(-t) = y(t)$, $y(-t) = x(t)$</td><td>le symétrique par rapport à $y = x$</td><td>la première bissectrice</td></tr></table>
      <p>Dans chaque cas, on étudie la courbe pour $t \ge 0$ et on complète par la symétrie.</p>`,
      proof: R`<p>Par exemple, si $x(-t) = x(t)$ et $y(-t) = -y(t)$, le point $M(-t) = (x(t), -y(t))$ est l'image de $M(t)$ par la symétrie d'axe $(Ox)$ ; le support est donc invariant par cette symétrie. Les autres cas sont identiques.</p>` },
    { t: 'ex', title: 'une courbe de Lissajous', body: R`<p>$M(t) = (\sin t, \sin 2t)$ est $2\pi$-périodique. $M(-t) = (-\sin t, -\sin 2t)$ : symétrie de centre $O$. $M(\pi - t) = (\sin t, -\sin 2t)$ : symétrie d'axe $(Ox)$. On étudie donc $t \in [0, \frac\pi2]$, puis on complète par la symétrie d'axe $(Ox)$ (qui donne $[\frac\pi2, \pi]$) et par celle de centre $O$ (qui donne le reste).</p>` + fig([courbe([C.lissajous], { label: 'Lissajous', hmax: 200 }), '(sin t, sin 2t)']) },

    /* ================= 3 ================= */
    { t: 'h', title: 'Tangente, points réguliers et stationnaires' },
    { t: 'def', body: R`<p>Le <strong>vecteur dérivé</strong> en $t_0$ est $M'(t_0) = \big(x'(t_0), y'(t_0)\big)$ (le vecteur vitesse). Le point $M(t_0)$ est <strong>régulier</strong> si $M'(t_0) \neq \vec 0$, <strong>stationnaire</strong> (ou singulier) sinon.</p>` },
    { t: 'thm', title: 'tangente en un point régulier', body: R`<p>En un point régulier, la courbe admet une <strong>tangente</strong> : la droite passant par $M(t_0)$ dirigée par $M'(t_0)$. Son équation est</p>
      $$\big(X - x(t_0)\big)\,y'(t_0) - \big(Y - y(t_0)\big)\,x'(t_0) = 0.$$`,
      proof: R`<p>La tangente est la position limite des sécantes $\big(M(t_0)M(t)\big)$, dirigées par $\frac{M(t) - M(t_0)}{t - t_0}$. Ce vecteur tend vers $M'(t_0) \neq \vec 0$ : la direction limite est celle de $M'(t_0)$. L'équation exprime que $\big(X - x(t_0), Y - y(t_0)\big)$ est colinéaire à $M'(t_0)$ (déterminant nul).</p>` },
    { t: 'rem', body: R`<p>Tangente <strong>horizontale</strong> : $y'(t_0) = 0$ et $x'(t_0) \neq 0$. Tangente <strong>verticale</strong> : $x'(t_0) = 0$ et $y'(t_0) \neq 0$. On les repère dans le <strong>tableau de variations conjoint</strong> de $x$ et $y$ (une ligne pour $t$, puis $x'$, $x$, $y'$, $y$).</p>` },
    { t: 'ex', body: R`<p>$M(t) = (t^2, t^3 - 3t)$ : $x'(t) = 2t$, $y'(t) = 3(t^2 - 1)$. Tangentes horizontales en $t = \pm1$, aux points $(1, \mp 2)$ ; tangente verticale en $t = 0$, au point $(0, 0)$. Aucun point stationnaire. La courbe est symétrique par rapport à $(Ox)$ et passe deux fois par $(3, 0)$, pour $t = \pm\sqrt3$.</p>` +
      fig([courbe([C.cubique], { marks: [{ x: 1, y: -2, label: 't = 1' }, { x: 1, y: 2, label: 't = −1' }, { x: 0, y: 0, label: 't = 0', dx: -40 }, { x: 3, y: 0, label: 't = ±√3' }], label: 'cubique', hmax: 230 }), '(t², t³ − 3t)']) },
    { t: 'thm', title: 'étude locale', body: R`<p>Supposons $M$ assez dérivable en $t_0$. Soit $p$ le plus petit entier tel que $M^{(p)}(t_0) \neq \vec 0$, et $q \gt p$ le plus petit entier tel que $M^{(q)}(t_0)$ ne soit pas colinéaire à $M^{(p)}(t_0)$. Alors la tangente en $M(t_0)$ est dirigée par $M^{(p)}(t_0)$, et :</p>
      <table class="t"><tr><th></th><th>$q$ pair</th><th>$q$ impair</th></tr>
      <tr><th>$p$ impair</th><td>point ordinaire</td><td>point d'inflexion</td></tr>
      <tr><th>$p$ pair</th><td>rebroussement de 2<sup>de</sup> espèce</td><td>rebroussement de 1<sup>re</sup> espèce</td></tr></table>`,
      proof: R`<p>Formule de Taylor-Young, avec $h = t - t_0$ : $M(t) - M(t_0) = \left(\frac{h^p}{p!} + o(h^p)\right)M^{(p)}(t_0) + \left(\frac{h^q}{q!} + o(h^q)\right)M^{(q)}(t_0)$, car les dérivées d'ordre entre $p$ et $q$ sont colinéaires à $M^{(p)}(t_0)$ (on les regroupe dans le premier terme). Dans la base $\big(M^{(p)}(t_0), M^{(q)}(t_0)\big)$, les coordonnées sont du signe de $h^p$ et de $h^q$. Si $p$ est impair, le point avance le long de la tangente quand $h$ change de signe ; s'il est pair, il revient en arrière (rebroussement). Si $q$ est impair, il change de côté de la tangente ; s'il est pair, il reste du même côté.</p>` },
    { t: 'p', body: fig(
      [courbe([{ x: t => t, y: t => t * t, t0: -1, t1: 1 }], { marks: [{ x: 0, y: 0 }], w: 150, hmax: 150, label: 'ordinaire' }), '(t, t²) : ordinaire'],
      [courbe([{ x: t => t, y: t => t * t * t, t0: -1, t1: 1 }], { marks: [{ x: 0, y: 0 }], w: 150, hmax: 150, label: 'inflexion' }), '(t, t³) : inflexion'],
      [courbe([{ x: t => t * t, y: t => t * t * t, t0: -1, t1: 1 }], { marks: [{ x: 0, y: 0 }], w: 150, hmax: 150, label: 'rebroussement 1' }), '(t², t³) : 1re espèce'],
      [courbe([{ x: t => t * t, y: t => Math.pow(t, 4) + Math.pow(t, 5), t0: -1, t1: 0.75 }], { marks: [{ x: 0, y: 0 }], w: 150, hmax: 150, label: 'rebroussement 2' }), '(t², t⁴ + t⁵) : 2de espèce']) },
    { t: 'ex', title: 'l’astroïde', body: R`<p>$M(t) = (\cos^3 t, \sin^3 t)$ : $M'(t) = 3\sin t\cos t(-\cos t, \sin t)$ s'annule pour $t \in \frac\pi2\Z$. En $t = 0$ : $M''(0) = (-3, 0)$ et $M'''(0) = (0, 6)$, donc $p = 2$, $q = 3$ : rebroussement de première espèce, de tangente horizontale. Par symétrie, les quatre « pointes » sont des rebroussements.</p>` + fig([courbe([C.astroide], { label: 'astroïde', hmax: 180 }), 'astroïde']) },

    /* ================= 4 ================= */
    { t: 'h', title: 'Branches infinies et points doubles' },
    { t: 'def', body: R`<p>La courbe a une <strong>branche infinie</strong> quand $t \to t_0$ (fini ou infini) si $\|M(t)\| \to +\infty$, c'est-à-dire si $|x(t)| \to +\infty$ ou $|y(t)| \to +\infty$.</p>` },
    { t: 'meth', title: 'étude d’une branche infinie', body: R`<ul><li>$x(t) \to \pm\infty$ et $y(t) \to \ell$ : <strong>asymptote horizontale</strong> $y = \ell$.</li>
      <li>$x(t) \to \ell$ et $y(t) \to \pm\infty$ : <strong>asymptote verticale</strong> $x = \ell$.</li>
      <li>$x(t)$ et $y(t)$ tendent vers l'infini : on étudie $\frac{y(t)}{x(t)}$.
        <ul><li>S'il tend vers $a \in \R^*$, on étudie $y(t) - ax(t)$ : s'il tend vers $b$, la droite $y = ax + b$ est <strong>asymptote</strong> (le signe de $y - ax - b$ donne la position) ; s'il tend vers $\pm\infty$, <strong>branche parabolique</strong> de direction $y = ax$.</li>
        <li>S'il tend vers 0 (resp. $\pm\infty$) : branche parabolique de direction $(Ox)$ (resp. $(Oy)$).</li></ul></li></ul>` },
    { t: 'ex', body: R`<p>$M(t) = \left(t + \frac1t, t - \frac1t\right)$, $t \gt 0$. Quand $t \to +\infty$ : $\frac yx = \frac{t^2 - 1}{t^2 + 1} \to 1$ et $y - x = -\frac2t \to 0$ : asymptote $y = x$, courbe en dessous. Quand $t \to 0^+$ : $\frac yx \to -1$ et $y + x = 2t \to 0$ : asymptote $y = -x$. On reconnaît une branche de l'hyperbole $x^2 - y^2 = 4$.</p>` +
      fig([courbe([C.hyperbole], { box: [-0.5, 6, -5, 5], lines: [[-0.5, -0.5, 5, 5], [-0.5, 0.5, 5, -5]], label: 'hyperbole', hmax: 230 }), 'asymptotes y = x et y = −x']) },
    { t: 'def', body: R`<p>Un <strong>point double</strong> est un point atteint pour deux valeurs différentes du paramètre (dans une période) : $M(t_1) = M(t_2)$ avec $t_1 \neq t_2$.</p>` },
    { t: 'meth', title: 'trouver les points doubles', body: R`<p>Résoudre le système $x(t_1) = x(t_2)$, $y(t_1) = y(t_2)$, $t_1 \neq t_2$. Les symétries aident : si $x$ est paire, $x(t_1) = x(t_2)$ suggère $t_2 = -t_1$. En un point double, la courbe a en général deux tangentes, dirigées par $M'(t_1)$ et $M'(t_2)$.</p>` },
    { t: 'meth', title: 'plan d’étude d’une courbe', body: R`<ol><li><b>Domaine</b> de définition, <b>périodicité</b>, <b>symétries</b> : réduire l'intervalle d'étude.</li>
      <li><b>Dérivées</b> $x'$, $y'$ et <b>tableau de variations conjoint</b>.</li>
      <li><b>Points particuliers</b> : tangentes horizontales et verticales, points stationnaires (étude locale).</li>
      <li><b>Branches infinies</b> : asymptotes, branches paraboliques, position.</li>
      <li><b>Points doubles</b>, puis <b>tracé</b> en complétant par les symétries.</li></ol>` },

    /* ================= 5 ================= */
    { t: 'h', title: 'Longueur d’un arc' },
    { t: 'thm', title: 'longueur (admis)', body: R`<p>La longueur de l'arc $M : [a, b] \to \R^2$ de classe $C^1$ est</p>
      $$L = \int_a^b\|M'(t)\|\dd t = \int_a^b\sqrt{x'(t)^2 + y'(t)^2}\dd t.$$
      <p>Elle ne dépend pas du paramétrage (s'il est injectif et parcouru une seule fois).</p>`,
      proof: R`<p>Idée : on approche l'arc par la ligne polygonale de sommets $M(t_k)$, $t_k = a + k\frac{b-a}{n}$. Sa longueur est $\sum\|M(t_{k+1}) - M(t_k)\| \approx \sum\|M'(t_k)\|\frac{b-a}{n}$ (accroissements finis), qui est une <strong>somme de Riemann</strong> de $\|M'\|$ et converge vers l'intégrale (chapitre 2).</p>` },
    { t: 'ex', body: R`<ul><li>Cercle de rayon $R$ : $\|M'(t)\| = \|(-R\sin t, R\cos t)\| = R$, d'où $L = 2\pi R$.</li>
      <li>Graphe de $f$ sur $[a, b]$ : $M(t) = (t, f(t))$ donne $L = \int_a^b\sqrt{1 + f'(t)^2}\dd t$.</li>
      <li>Arche de cycloïde : $\|M'(t)\| = R\sqrt{(1 - \cos t)^2 + \sin^2 t} = R\sqrt{2 - 2\cos t} = 2R\sin\frac t2$, d'où $L = 8R$.</li></ul>` },
    { t: 'def', body: R`<p>L'<strong>abscisse curviligne</strong> d'origine $a$ est $s(t) = \int_a^t\|M'(u)\|\dd u$ : la distance parcourue sur la courbe entre les instants $a$ et $t$. On a $s'(t) = \|M'(t)\|$, la vitesse du mobile.</p>` },

    /* ================= 6 ================= */
    { t: 'h', title: 'Applications informatiques' },
    { t: 'meth', title: 'tracer une courbe paramétrée en Python', body: code(`import numpy as np
import matplotlib.pyplot as plt

t = np.linspace(0, 2 * np.pi, 1000)      # assez de points pour un tracé lisse
x, y = np.sin(t), np.sin(2 * t)           # courbe de Lissajous
plt.plot(x, y)
plt.axis("equal")                         # repère orthonormé : pas de déformation
plt.title("(sin t, sin 2t)")
plt.show()`) + R`<p>Un tracé informatique est toujours une <strong>ligne polygonale</strong> : près des points stationnaires ou des branches infinies, il faut beaucoup de points (ou découper l'intervalle).</p>` },
    { t: 'meth', title: 'approcher une longueur', body: code(`import math

def longueur(x, y, a, b, n):
    """Longueur de la ligne polygonale inscrite à n segments (minore la vraie longueur)."""
    L = 0
    for k in range(n):
        t0, t1 = a + k * (b - a) / n, a + (k + 1) * (b - a) / n
        L += math.hypot(x(t1) - x(t0), y(t1) - y(t0))
    return L

print(longueur(lambda t: t - math.sin(t), lambda t: 1 - math.cos(t), 0, 2 * math.pi, 1000))
# environ 7.99999 : la longueur exacte d'une arche de cycloïde (R = 1) est 8`) },
    { t: 'def', title: 'courbes de Bézier', body: R`<p>Étant donnés des points de contrôle $P_0, P_1, P_2$ (resp. $P_0, \dots, P_3$), la <strong>courbe de Bézier</strong> quadratique (resp. cubique) est, pour $t \in [0, 1]$ :</p>
      $$B(t) = (1-t)^2P_0 + 2t(1-t)P_1 + t^2P_2, \qquad B(t) = (1-t)^3P_0 + 3t(1-t)^2P_1 + 3t^2(1-t)P_2 + t^3P_3.$$` },
    { t: 'prop', body: R`<p>Pour la courbe quadratique : $B(0) = P_0$, $B(1) = P_2$, $B'(0) = 2(P_1 - P_0)$ et $B'(1) = 2(P_2 - P_1)$. La courbe part de $P_0$ tangente à $[P_0P_1]$ et arrive en $P_2$ tangente à $[P_1P_2]$ ; elle reste dans le triangle $P_0P_1P_2$ (les poids sont positifs et de somme 1).</p>`,
      proof: R`<p>Évaluation directe en 0 et 1. En dérivant : $B'(t) = -2(1-t)P_0 + 2(1 - 2t)P_1 + 2tP_2 = 2(1-t)(P_1 - P_0) + 2t(P_2 - P_1)$. Enfin $(1-t)^2 + 2t(1-t) + t^2 = \big((1 - t) + t\big)^2 = 1$ : $B(t)$ est un barycentre à coefficients positifs de $P_0, P_1, P_2$.</p>` },
    { t: 'p', body: fig([courbe([{ x: t => 3 * (1 - t) * (1 - t) * t * 1 + 3 * t * t * (1 - t) * 4 + t * t * t * 5, y: t => 3 * (1 - t) * (1 - t) * t * 3 + 3 * t * t * (1 - t) * 3, t0: 0, t1: 1 },
      { x: t => (t < 1 / 3 ? 3 * t : t < 2 / 3 ? 1 + (3 * t - 1) * 3 : 4 + (3 * t - 2)), y: t => (t < 1 / 3 ? 9 * t : t < 2 / 3 ? 3 : 3 - (3 * t - 2) * 3), t0: 0, t1: 1, n: 3, cls: 'cv2' }],
      { marks: [{ x: 0, y: 0, label: 'P₀' }, { x: 1, y: 3, label: 'P₁' }, { x: 4, y: 3, label: 'P₂' }, { x: 5, y: 0, label: 'P₃' }], label: 'Bézier cubique', hmax: 200 }), 'Bézier cubique et son polygone de contrôle']) },
    { t: 'rem', body: R`<p>Les courbes de Bézier sont partout en informatique graphique : polices de caractères (TrueType en quadratique, PostScript en cubique), chemins SVG (commandes <code>Q</code> et <code>C</code>), outils « plume » des logiciels de dessin. On les calcule efficacement par l'<strong>algorithme de Casteljau</strong> (interpolations linéaires successives) :</p>` + code(`def casteljau(points, t):
    """Point de paramètre t de la courbe de Bézier de points de contrôle donnés."""
    pts = [list(p) for p in points]
    while len(pts) > 1:
        pts = [[(1 - t) * a[i] + t * b[i] for i in range(2)] for a, b in zip(pts, pts[1:])]
    return pts[0]

print(casteljau([(0, 0), (1, 3), (4, 3), (5, 0)], 0.5))   # [2.5, 2.25]`) }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche                                                               */
  /* ------------------------------------------------------------------ */
  const fiche = [
    { part: '1. Définitions, symétries' },
    { k: 'def', t: 'Courbe paramétrée',
      concl: [R`$M(t) = (x(t), y(t))$, $t \in I$ ; support $M(I)$`, R`Graphe de $f$ : $(t, f(t))$`] },
    { k: 'prop', t: 'Réduire l’étude', prio: true,
      concl: [R`$T$-périodique : un intervalle de longueur $T$`, R`$x$ paire, $y$ impaire : symétrie d'axe <u>$(Ox)$</u>`, R`$x$ impaire, $y$ paire : axe <u>$(Oy)$</u>`, R`$x$, $y$ impaires : <u>centre $O$</u>`] },
    { part: '2. Tangentes et points stationnaires' },
    { k: 'thm', t: 'Tangente', prio: true,
      hyp: R`$M(t_0)$ <u>régulier</u> : $M'(t_0) \neq \vec 0$`,
      concl: [R`Tangente dirigée par $M'(t_0)$`, R`$(X - x_0)y'(t_0) - (Y - y_0)x'(t_0) = 0$`, R`Horizontale : $y' = 0 \neq x'$ ; verticale : $x' = 0 \neq y'$`] },
    { k: 'thm', t: 'Étude locale', prio: true,
      hyp: R`$p$ : 1<sup>er</sup> ordre avec $M^{(p)}(t_0) \neq 0$ ; $q$ : 1<sup>er</sup> ordre <u>non colinéaire</u>`,
      concl: [R`Tangente dirigée par $M^{(p)}(t_0)$`, R`$p$ impair : $q$ pair <u>ordinaire</u>, $q$ impair <u>inflexion</u>`, R`$p$ pair : $q$ impair <u>rebroussement 1<sup>re</sup> espèce</u>, $q$ pair 2<sup>de</sup> espèce`] },
    { part: '3. Branches infinies, points doubles' },
    { k: 'meth', t: 'Branches infinies',
      concl: [R`$x \to \infty$, $y \to \ell$ : asymptote $y = \ell$ ; $x \to \ell$, $y \to \infty$ : $x = \ell$`, R`Les deux infinis : $\frac yx \to a$, puis <u>$y - ax \to b$</u> : asymptote $y = ax + b$`, R`$y - ax \to \infty$ : branche parabolique de direction $y = ax$`] },
    { k: 'def', t: 'Point double',
      concl: [R`$M(t_1) = M(t_2)$ avec <u>$t_1 \neq t_2$</u>`],
      b: R`Les symétries suggèrent souvent $t_2 = -t_1$.` },
    { part: '4. Longueur' },
    { k: 'form', t: 'Longueur d’un arc', prio: true,
      concl: [R`$L = \displaystyle\int_a^b\sqrt{x'(t)^2 + y'(t)^2}\dd t$`, R`Graphe : $L = \int_a^b\sqrt{1 + f'^2}$`, R`Cercle $2\pi R$ ; arche de cycloïde $8R$ ; astroïde $6a$`],
      b: R`Astuces : $1 - \cos t = 2\sin^2\frac t2$, $1 + \sinh^2 = \cosh^2$.` },
    { part: '5. Bézier' },
    { k: 'prop', t: 'Bézier quadratique',
      concl: [R`$B(t) = (1-t)^2P_0 + 2t(1-t)P_1 + t^2P_2$`, R`$B(0) = P_0$, $B(1) = P_2$, <u>$B'(0) = 2(P_1 - P_0)$</u>, $B'(1) = 2(P_2 - P_1)$`, R`Ne passe pas par $P_1$ ; reste dans le triangle`] },
    { k: 'warn', t: 'Pièges',
      concl: [R`Point stationnaire : <u>pas de tangente</u> dirigée par $M'$ (il est nul)`, R`Tracé : repère orthonormé (<code>axis("equal")</code>)`, R`Longueur : $\sqrt{u^2} = |u|$, attention au signe`] }
  ];

  /* ------------------------------------------------------------------ */
  /* Exercices                                                           */
  /* ------------------------------------------------------------------ */
  const exercices = [
    {
      id: 'ellipse', title: 'Ellipse : équation, tangentes, longueur', diff: 1,
      enonce: R`<p>Soit $M(t) = (3\cos t, 2\sin t)$, $t \in [0, 2\pi]$.</p><ol><li>Donner une équation cartésienne du support.</li><li>Écrire l'équation de la tangente en $M(t_0)$. Où la tangente est-elle horizontale ? verticale ?</li><li>Exprimer la longueur $L$ de l'ellipse par une intégrale et l'encadrer.</li></ol>`,
      correction: R`<p>1. $\left(\frac x3\right)^2 + \left(\frac y2\right)^2 = \cos^2 t + \sin^2 t = 1$.</p>
        <p>2. $M'(t_0) = (-3\sin t_0, 2\cos t_0) \neq \vec 0$. Tangente : $\frac{x\cos t_0}{3} + \frac{y\sin t_0}{2} = 1$. Horizontale en $(0, \pm2)$ ($t = \frac\pi2, \frac{3\pi}2$), verticale en $(\pm3, 0)$ ($t = 0, \pi$).</p>
        <p>3. $L = \int_0^{2\pi}\sqrt{9\sin^2 t + 4\cos^2 t}\dd t$ ; comme $2 \le \sqrt{\dots} \le 3$, $4\pi \le L \le 6\pi$ (numériquement $L \approx 15{,}87$).</p>`,
      detail: {
        but: R`<p>Retrouver l'équation de l'ellipse, ses tangentes et encadrer sa longueur.</p>`,
        methode: R`<p>Éliminer $t$ grâce à $\cos^2 + \sin^2 = 1$ ; tangente par le déterminant $(X - x_0)y'_0 - (Y - y_0)x'_0 = 0$ ; longueur par $\int\|M'\|$.</p>`,
        etapes: [
          R`<b>Équation cartésienne.</b> $\cos t = \frac x3$ et $\sin t = \frac y2$, donc $\frac{x^2}{9} + \frac{y^2}{4} = 1$.`,
          R`<b>Régularité.</b> $M'(t) = (-3\sin t, 2\cos t)$ ; $\sin t$ et $\cos t$ ne s'annulent pas ensemble, donc tous les points sont réguliers.`,
          R`<b>Tangente.</b> $(X - 3\cos t_0)(2\cos t_0) - (Y - 2\sin t_0)(-3\sin t_0) = 0 \iff 2X\cos t_0 + 3Y\sin t_0 = 6(\cos^2 t_0 + \sin^2 t_0) = 6$, soit $\frac{X\cos t_0}{3} + \frac{Y\sin t_0}{2} = 1$.`,
          R`<b>Horizontale.</b> $y' = 2\cos t = 0$ (et $x' \neq 0$) : $t = \frac\pi2, \frac{3\pi}{2}$, points $(0, 2)$ et $(0, -2)$.`,
          R`<b>Verticale.</b> $x' = -3\sin t = 0$ : $t = 0, \pi$, points $(3, 0)$ et $(-3, 0)$.`,
          R`<b>Longueur.</b> $\|M'(t)\|^2 = 9\sin^2 t + 4\cos^2 t = 4 + 5\sin^2 t \in [4, 9]$, donc $2 \le \|M'(t)\| \le 3$ et $2\pi \times 2 \le L \le 2\pi \times 3$. L'intégrale n'a pas de primitive élémentaire (intégrale elliptique) : on la calcule numériquement, $L \approx 15{,}87$.`
        ],
        retenir: R`<p>Le périmètre d'une ellipse n'a pas de formule simple : c'est un cas typique où le calcul numérique est indispensable.</p>`
      }
    },
    {
      id: 'cubique', title: 'Étude complète d’une cubique', diff: 2, gen: 'tangentes',
      enonce: R`<p>Étudier la courbe $M(t) = (t^2, t^3 - 3t)$ : symétrie, tableau de variations, tangentes horizontales et verticales, point double, branches infinies, tracé.</p>`,
      correction: R`<p>$x$ paire, $y$ impaire : symétrie d'axe $(Ox)$, on étudie $t \ge 0$. $x' = 2t$, $y' = 3(t^2 - 1)$ : tangente verticale en $(0, 0)$ ($t = 0$), horizontale en $(1, -2)$ ($t = 1$) et $(1, 2)$ ($t = -1$). Point double $(3, 0)$ pour $t = \pm\sqrt3$, tangentes dirigées par $(\pm2\sqrt3, 6)$. Quand $t \to \pm\infty$, $\frac yx \sim t \to \pm\infty$ : branches paraboliques de direction $(Oy)$.</p>` + fig([courbe([C.cubique], { marks: [{ x: 3, y: 0, label: 'point double' }], label: 'cubique', hmax: 230 })]),
      detail: {
        but: R`<p>Mener l'étude complète d'une courbe paramétrée.</p>`,
        methode: R`<p>Suivre le plan : symétries, dérivées et variations, points particuliers, branches infinies, points doubles, tracé.</p>`,
        etapes: [
          R`<b>Symétrie.</b> $x(-t) = x(t)$ et $y(-t) = -y(t)$ : $M(-t)$ est le symétrique de $M(t)$ par rapport à $(Ox)$. On étudie $t \in [0, +\infty[$.`,
          R`<b>Variations pour $t \ge 0$.</b> $x' = 2t \ge 0$ : $x$ croît de $0$ à $+\infty$. $y' = 3(t - 1)(t + 1)$ : négatif sur $[0, 1[$, positif après ; $y$ décroît de $0$ à $-2$ (en $t = 1$) puis croît vers $+\infty$.`,
          R`<b>Points particuliers.</b> $t = 0$ : $x' = 0$, $y' = -3$ : tangente verticale en $(0, 0)$. $t = 1$ : $y' = 0$, $x' = 2$ : tangente horizontale en $(1, -2)$ ; par symétrie, $(1, 2)$ pour $t = -1$.`,
          R`<b>Point double.</b> $t_1^2 = t_2^2$ avec $t_1 \neq t_2$ donne $t_2 = -t_1$ ; puis $y(t_1) = y(-t_1) \iff t_1^3 - 3t_1 = 0 \iff t_1 = \pm\sqrt3$ ($t_1 \neq 0$). Point $(3, 0)$, tangentes dirigées par $M'(\pm\sqrt3) = (\pm2\sqrt3, 6)$, donc de pentes $\pm\sqrt3$.`,
          R`<b>Branches infinies.</b> Quand $t \to +\infty$, $x$ et $y$ tendent vers $+\infty$ et $\frac yx = t - \frac3t \to +\infty$ : branche parabolique de direction $(Oy)$ (comme pour $y = x^{3/2}$).`,
          R`<b>Tracé.</b> On trace l'arc pour $t \ge 0$ (de l'origine, vers le bas jusqu'à $(1, -2)$, puis vers $(3, 0)$ et l'infini), puis son symétrique par rapport à $(Ox)$ : on obtient une boucle fermée en $(3, 0)$.`
        ],
        retenir: R`<p>Le plan d'étude évite d'oublier un point remarquable ; les symétries divisent le travail.</p>`
      }
    },
    {
      id: 'lissajous', title: 'Une courbe de Lissajous', diff: 2, gen: 'tangentes',
      enonce: R`<p>Soit $M(t) = (\sin t, \sin 2t)$.</p><ol><li>Réduire l'intervalle d'étude grâce aux symétries.</li><li>Étudier les variations sur $[0, \frac\pi2]$ et préciser les tangentes remarquables.</li><li>Montrer que l'origine est un point double et donner les tangentes en ce point.</li><li>Trouver une équation cartésienne du support.</li></ol>`,
      correction: R`<p>1. $2\pi$-périodique ; $M(-t) = -M(t)$ (centre $O$) ; $M(\pi - t) = (x, -y)$ (axe $(Ox)$) : on étudie $[0, \frac\pi2]$.</p>
        <p>2. $x' = \cos t \ge 0$, $y' = 2\cos 2t$ : tangente horizontale en $\left(\frac{\sqrt2}{2}, 1\right)$ ($t = \frac\pi4$), verticale en $(1, 0)$ ($t = \frac\pi2$).</p>
        <p>3. $M(0) = M(\pi) = (0, 0)$, tangentes dirigées par $(1, 2)$ et $(-1, 2)$ : $y = 2x$ et $y = -2x$.</p>
        <p>4. $y^2 = 4\sin^2 t\cos^2 t = 4x^2(1 - x^2)$.</p>` + fig([courbe([C.lissajous], { marks: [{ x: Math.SQRT1_2, y: 1, label: 't = π/4' }, { x: 1, y: 0, label: 't = π/2', dx: -16, dy: 16 }], label: 'Lissajous', hmax: 200 })]),
      detail: {
        but: R`<p>Étudier une courbe de Lissajous en exploitant ses symétries.</p>`,
        methode: R`<p>Comparer $M(-t)$ et $M(\pi - t)$ à $M(t)$ pour réduire l'intervalle ; puis tableau de variations, points remarquables, point double.</p>`,
        etapes: [
          R`<b>Période.</b> $\sin$ et $\sin 2\cdot$ sont $2\pi$-périodiques : on étudie sur $[-\pi, \pi]$.`,
          R`<b>Symétrie centrale.</b> $M(-t) = (-\sin t, -\sin 2t) = -M(t)$ : symétrie de centre $O$, on se ramène à $[0, \pi]$.`,
          R`<b>Symétrie axiale.</b> $\sin(\pi - t) = \sin t$ et $\sin(2\pi - 2t) = -\sin 2t$ : $M(\pi - t) = (x(t), -y(t))$, symétrie d'axe $(Ox)$, on se ramène à $[0, \frac\pi2]$.`,
          R`<b>Variations sur $[0, \frac\pi2]$.</b> $x' = \cos t \ge 0$ : $x$ croît de 0 à 1. $y' = 2\cos 2t$ : positif sur $[0, \frac\pi4[$, négatif ensuite ; $y$ croît de 0 à 1 puis décroît jusqu'à 0.`,
          R`<b>Tangentes.</b> En $t = \frac\pi4$ : $y' = 0$, $x' = \frac{\sqrt2}{2} \neq 0$, tangente horizontale au point $\left(\frac{\sqrt2}2, 1\right)$. En $t = \frac\pi2$ : $x' = 0$, $y' = -2$, tangente verticale en $(1, 0)$.`,
          R`<b>Point double.</b> $M(0) = (0, 0) = M(\pi)$. $M'(0) = (1, 2)$ et $M'(\pi) = (-1, 2)$ : deux tangentes distinctes, $y = 2x$ et $y = -2x$.`,
          R`<b>Équation cartésienne.</b> $y = 2\sin t\cos t$, donc $y^2 = 4\sin^2 t(1 - \sin^2 t) = 4x^2(1 - x^2)$.`
        ],
        retenir: R`<p>Tester $t \mapsto -t$, $t \mapsto \pi - t$, $t \mapsto \pi + t$ : chaque symétrie trouvée divise l'étude par deux.</p>`
      }
    },
    {
      id: 'hyperbole', title: 'Branches infinies et asymptotes', diff: 2,
      enonce: R`<p>Soit $M(t) = \left(t + \frac1t,\ t - \frac1t\right)$ pour $t \gt 0$.</p><ol><li>Étudier les variations de $x$ et $y$.</li><li>Étudier les branches infinies en $0^+$ et en $+\infty$ (asymptotes et position).</li><li>Montrer que le support est inclus dans l'hyperbole $x^2 - y^2 = 4$.</li></ol>`,
      correction: R`<p>1. $x' = 1 - \frac1{t^2}$ : $x$ décroît sur $]0, 1]$, croît ensuite, minimum $2$ en $t = 1$ (tangente verticale en $(2, 0)$). $y' = 1 + \frac1{t^2} \gt 0$ : $y$ croît de $-\infty$ à $+\infty$.</p>
        <p>2. En $+\infty$ : $\frac yx \to 1$, $y - x = -\frac2t \to 0^-$ : asymptote $y = x$, courbe en dessous. En $0^+$ : $\frac yx \to -1$, $y + x = 2t \to 0^+$ : asymptote $y = -x$, courbe au-dessus.</p>
        <p>3. $x^2 - y^2 = (x - y)(x + y) = \frac2t \times 2t = 4$.</p>` + fig([courbe([C.hyperbole], { box: [-0.5, 6, -5, 5], lines: [[-0.5, -0.5, 5, 5], [-0.5, 0.5, 5, -5]], label: 'hyperbole', hmax: 230 })]),
      detail: {
        but: R`<p>Étudier les deux branches infinies d'une courbe et trouver ses asymptotes.</p>`,
        methode: R`<p>Quand $x$ et $y$ tendent tous deux vers l'infini : limite de $\frac yx$ (direction), puis de $y - ax$ (asymptote ou branche parabolique) ; le signe de $y - ax - b$ donne la position.</p>`,
        etapes: [
          R`<b>Variations.</b> $x'(t) = 1 - \frac1{t^2} = \frac{t^2 - 1}{t^2}$ s'annule en $t = 1$ ; $x$ décroît de $+\infty$ à 2 puis croît vers $+\infty$. $y'(t) = 1 + \frac1{t^2} \gt 0$.`,
          R`<b>Point remarquable.</b> En $t = 1$ : $M(1) = (2, 0)$, $x' = 0$, $y' = 2$ : tangente verticale.`,
          R`<b>Branche en $+\infty$.</b> $x, y \to +\infty$. $\frac yx = \frac{t^2 - 1}{t^2 + 1} \to 1$. Puis $y - x = -\frac2t \to 0$ : asymptote $y = x$. Comme $y - x \lt 0$, la courbe est en dessous.`,
          R`<b>Branche en $0^+$.</b> $x \to +\infty$, $y \to -\infty$. $\frac yx = \frac{t^2 - 1}{t^2 + 1} \to -1$. Puis $y - (-1)x = y + x = 2t \to 0$ : asymptote $y = -x$, courbe au-dessus ($2t \gt 0$).`,
          R`<b>Équation.</b> $x - y = \frac2t$ et $x + y = 2t$, donc $x^2 - y^2 = (x - y)(x + y) = 4$. Comme $x \ge 2 \gt 0$, c'est la branche de droite de l'hyperbole.`
        ],
        retenir: R`<p>Asymptote oblique : $\frac yx \to a$ <b>puis</b> $y - ax \to b$ ; ne pas s'arrêter à la première limite.</p>`
      }
    },
    {
      id: 'singuliers', title: 'Classer des points stationnaires', diff: 2, gen: 'singulier',
      enonce: R`<p>Déterminer la nature du point $M(0)$ pour chacune des courbes : a) $(t^2, t^3)$ ; b) $(t^3, t^5)$ ; c) $(t^2, t^4 + t^5)$.</p>`,
      correction: R`<p>a) $M''(0) = (2, 0)$, $M'''(0) = (0, 6)$ : $p = 2$, $q = 3$, <b>rebroussement de 1<sup>re</sup> espèce</b>. b) $M'''(0) = (6, 0)$, $M^{(5)}(0) = (0, 120)$ : $p = 3$, $q = 5$, <b>inflexion</b>. c) $M''(0) = (2, 0)$, $M^{(4)}(0) = (0, 24)$ : $p = 2$, $q = 4$, <b>rebroussement de 2<sup>de</sup> espèce</b>. Dans les trois cas, la tangente est l'axe $(Ox)$.</p>`,
      detail: {
        but: R`<p>Appliquer le théorème d'étude locale à trois points stationnaires.</p>`,
        methode: R`<p>Calculer les dérivées successives en 0 (pour un monôme $t^k$, seule la dérivée $k$-ième est non nulle en 0, et vaut $k!$) ; trouver $p$ et $q$ ; conclure par les parités.</p>`,
        etapes: [
          R`<b>a) $(t^2, t^3)$.</b> $M'(0) = 0$ : stationnaire. $M''(0) = (2, 0)$ : $p = 2$, tangente $(Ox)$. $M'''(0) = (0, 6)$, non colinéaire : $q = 3$. $p$ pair, $q$ impair : rebroussement de 1<sup>re</sup> espèce (la courbe $y^2 = x^3$ fait une pointe).`,
          R`<b>b) $(t^3, t^5)$.</b> $M'(0) = M''(0) = 0$, $M'''(0) = (6, 0)$ : $p = 3$. $M^{(4)}(0) = 0$, $M^{(5)}(0) = (0, 120)$ : $q = 5$. $p$ et $q$ impairs : point d'inflexion (c'est le graphe de $y = x^{5/3}$, qui traverse sa tangente).`,
          R`<b>c) $(t^2, t^4 + t^5)$.</b> $M''(0) = (2, 0)$ : $p = 2$. $M'''(0) = 0$, $M^{(4)}(0) = (0, 24)$ : $q = 4$. $p$ et $q$ pairs : rebroussement de 2<sup>de</sup> espèce ; les deux arcs ($t \gt 0$, $t \lt 0$) sont du même côté de la tangente et ne se distinguent que grâce au terme $t^5$.`,
          R`<b>Lecture des signes.</b> Dans la base $\big(M^{(p)}(0), M^{(q)}(0)\big)$, $M(t) - M(0) \approx \left(\frac{t^p}{p!}, \frac{t^q}{q!}\right)$ : on regarde comment les signes changent entre $t \gt 0$ et $t \lt 0$.`
        ],
        retenir: R`<p>Le tableau des parités ($p$, $q$) suffit, mais il faut savoir le retrouver avec Taylor.</p>`
      }
    },
    {
      id: 'astroide', title: 'L’astroïde', diff: 2, gen: 'longueur',
      enonce: R`<p>Soit $M(t) = (\cos^3 t, \sin^3 t)$.</p><ol><li>Réduire l'intervalle d'étude.</li><li>Déterminer les points stationnaires et leur nature.</li><li>Calculer la longueur totale de la courbe.</li></ol>`,
      correction: R`<p>1. $2\pi$-périodique ; $M(-t)$ symétrique par rapport à $(Ox)$ ; $M(\pi - t) = (-x, y)$ : par rapport à $(Oy)$. On étudie $[0, \frac\pi2]$.</p>
        <p>2. $M'(t) = 3\sin t\cos t(-\cos t, \sin t)$ s'annule en $t \in \frac\pi2\Z$ : les quatre points $(\pm1, 0)$, $(0, \pm1)$, qui sont des rebroussements de 1<sup>re</sup> espèce.</p>
        <p>3. $\|M'(t)\| = 3|\sin t\cos t|$ et $L = 4\int_0^{\pi/2}3\sin t\cos t\dd t = 6$.</p>` + fig([courbe([C.astroide], { label: 'astroïde', hmax: 180 })]),
      detail: {
        but: R`<p>Étudier l'astroïde : symétries, points stationnaires, longueur.</p>`,
        methode: R`<p>Symétries pour se ramener à un quart ; factoriser $M'(t)$ pour trouver les points stationnaires ; longueur par $\int\|M'\|$ en exploitant les symétries.</p>`,
        etapes: [
          R`<b>Symétries.</b> $M(-t) = (\cos^3 t, -\sin^3 t)$ : axe $(Ox)$. $M(\pi - t) = (-\cos^3 t, \sin^3 t)$ : axe $(Oy)$. Un quart, $t \in [0, \frac\pi2]$, suffit.`,
          R`<b>Vecteur dérivé.</b> $x' = -3\cos^2 t\sin t$, $y' = 3\sin^2 t\cos t$, soit $M'(t) = 3\sin t\cos t\,(-\cos t, \sin t)$.`,
          R`<b>Points stationnaires.</b> $M'(t) = 0 \iff \sin t\cos t = 0 \iff t \in \frac\pi2\Z$ : points $(1, 0)$, $(0, 1)$, $(-1, 0)$, $(0, -1)$.`,
          R`<b>Nature en $t = 0$.</b> Développements : $x = \cos^3 t = 1 - \frac32t^2 + o(t^2)$ et $y = \sin^3 t = t^3 + o(t^3)$. Donc $M''(0) = (-3, 0)$ et $M'''(0) = (0, 6)$ : $p = 2$, $q = 3$, rebroussement de 1<sup>re</sup> espèce, tangente horizontale. Les autres pointes s'en déduisent par symétrie.`,
          R`<b>Norme.</b> Pour $t \in [0, \frac\pi2]$, $\|M'(t)\| = 3\sin t\cos t\sqrt{\cos^2 t + \sin^2 t} = 3\sin t\cos t$.`,
          R`<b>Longueur.</b> $L = 4\int_0^{\pi/2}3\sin t\cos t\dd t = 12\left[\frac{\sin^2 t}{2}\right]_0^{\pi/2} = 6$.`
        ],
        retenir: R`<p>Factoriser $M'(t)$ fait apparaître à la fois les points stationnaires et une norme simple.</p>`
      }
    },
    {
      id: 'cycloide', title: 'La cycloïde', diff: 2, gen: 'longueur',
      enonce: R`<p>Soit $R \gt 0$ et $M(t) = \big(R(t - \sin t), R(1 - \cos t)\big)$.</p><ol><li>Déterminer les points stationnaires et leur nature.</li><li>Où la tangente est-elle horizontale ?</li><li>Calculer la longueur d'une arche ($t \in [0, 2\pi]$).</li></ol>`,
      correction: R`<p>1. $M'(t) = R(1 - \cos t, \sin t)$ s'annule pour $t \in 2\pi\Z$ (points $(2k\pi R, 0)$, où la roue touche le sol). En $t = 0$ : $M''(0) = (0, R)$, $M'''(0) = (R, 0)$ : $p = 2$, $q = 3$, rebroussement de 1<sup>re</sup> espèce, tangente verticale.</p>
        <p>2. $y' = R\sin t = 0$ avec $x' \neq 0$ : $t = \pi + 2k\pi$, au sommet $((2k+1)\pi R, 2R)$.</p><p>3. $\|M'(t)\| = 2R\sin\frac t2$ sur $[0, 2\pi]$ et $L = 8R$.</p>` + fig([courbe([C.cycloide], { label: 'cycloïde', hmax: 160 })]),
      detail: {
        but: R`<p>Étudier la cycloïde : pointes, sommets, longueur d'une arche.</p>`,
        methode: R`<p>Annuler $M'$ pour les points stationnaires, développements limités pour leur nature ; simplifier $\|M'\|$ avec $1 - \cos t = 2\sin^2\frac t2$.</p>`,
        etapes: [
          R`<b>Vecteur dérivé.</b> $M'(t) = \big(R(1 - \cos t), R\sin t\big)$, nul si et seulement si $\cos t = 1$, soit $t \in 2\pi\Z$.`,
          R`<b>Nature en $t = 0$.</b> $x = R(t - \sin t) = R\frac{t^3}{6} + o(t^3)$ et $y = R(1 - \cos t) = R\frac{t^2}{2} + o(t^2)$. Donc $M''(0) = (0, R)$ et $M'''(0) = (R, 0)$ : $p = 2$, $q = 3$, rebroussement de 1<sup>re</sup> espèce à tangente verticale.`,
          R`<b>Tangente horizontale.</b> $y' = R\sin t = 0$ et $x' = R(1 - \cos t) \neq 0$ : $\cos t = -1$, $t = \pi$ (modulo $2\pi$), au point $(\pi R, 2R)$ : le sommet de l'arche.`,
          R`<b>Norme.</b> $\|M'(t)\|^2 = R^2\big((1 - \cos t)^2 + \sin^2 t\big) = R^2(2 - 2\cos t) = 4R^2\sin^2\frac t2$. Sur $[0, 2\pi]$, $\sin\frac t2 \ge 0$, donc $\|M'(t)\| = 2R\sin\frac t2$.`,
          R`<b>Longueur.</b> $L = \int_0^{2\pi}2R\sin\frac t2\dd t = \left[-4R\cos\frac t2\right]_0^{2\pi} = 4R + 4R = 8R$.`
        ],
        retenir: R`<p>Une arche de cycloïde mesure $8R$ : quatre fois le diamètre de la roue.</p>`
      }
    },
    {
      id: 'chainette', title: 'Longueur d’une chaînette', diff: 1, gen: 'longueur',
      enonce: R`<p>Calculer la longueur du graphe de $y = \cosh x$ sur $[-a, a]$. Application : $a = \ln 2$.</p>`,
      correction: R`<p>$L = \int_{-a}^a\sqrt{1 + \sinh^2 x}\dd x = \int_{-a}^a\cosh x\dd x = 2\sinh a$. Pour $a = \ln 2$ : $\sinh(\ln 2) = \frac{2 - 1/2}{2} = \frac34$, donc $L = \frac32$.</p>`,
      detail: {
        but: R`<p>Calculer la longueur d'un graphe de fonction.</p>`,
        methode: R`<p>Graphe de $f$ : $L = \int_a^b\sqrt{1 + f'(x)^2}\dd x$ ; ici $1 + \sinh^2 = \cosh^2$ supprime la racine.</p>`,
        etapes: [
          R`<b>Paramétrage.</b> $M(x) = (x, \cosh x)$, $M'(x) = (1, \sinh x)$.`,
          R`<b>Norme.</b> $\|M'(x)\| = \sqrt{1 + \sinh^2 x} = \sqrt{\cosh^2 x} = \cosh x$ (positif).`,
          R`<b>Intégrale.</b> $L = \int_{-a}^a\cosh x\dd x = [\sinh x]_{-a}^a = 2\sinh a$ ($\sinh$ est impaire).`,
          R`<b>Application.</b> $\sinh(\ln 2) = \frac{e^{\ln 2} - e^{-\ln 2}}{2} = \frac{2 - \frac12}{2} = \frac34$, donc $L = \frac32$.`
        ],
        retenir: R`<p>$\cosh^2 - \sinh^2 = 1$ : c'est ce qui rend la chaînette « intégrable » à la main.</p>`
      }
    },
    {
      id: 'bezier', title: 'Une courbe de Bézier', diff: 1, gen: 'bezier',
      enonce: R`<p>On prend $P_0 = (0, 0)$, $P_1 = (1, 2)$, $P_2 = (2, 0)$ et $B(t) = (1 - t)^2P_0 + 2t(1 - t)P_1 + t^2P_2$.</p><ol><li>Calculer $B(t)$, puis montrer que le support est un arc de parabole dont on donnera l'équation.</li><li>Donner les tangentes en $P_0$ et $P_2$, et le point le plus haut. La courbe passe-t-elle par $P_1$ ?</li></ol>`,
      correction: R`<p>1. $B(t) = (2t, 4t - 4t^2)$ ; avec $x = 2t$ : $y = 2x - x^2$, pour $x \in [0, 2]$.</p><p>2. $B'(0) = (2, 4)$ (direction de $P_0P_1$), $B'(1) = (2, -4)$ (direction de $P_1P_2$). Point le plus haut $B(\frac12) = (1, 1)$ : la courbe ne passe pas par $P_1 = (1, 2)$.</p>`,
      detail: {
        but: R`<p>Calculer explicitement une courbe de Bézier et voir le rôle du point de contrôle $P_1$.</p>`,
        methode: R`<p>Développer la combinaison des points, éliminer $t$, dériver.</p>`,
        etapes: [
          R`<b>Abscisse.</b> $x(t) = 2t(1 - t) \times 1 + t^2 \times 2 = 2t$.`,
          R`<b>Ordonnée.</b> $y(t) = 2t(1 - t) \times 2 = 4t - 4t^2$.`,
          R`<b>Équation.</b> $t = \frac x2$ donne $y = 2x - x^2$ : arc de parabole pour $x \in [0, 2]$.`,
          R`<b>Tangentes.</b> $B'(t) = (2, 4 - 8t)$ : $B'(0) = (2, 4) = 2(P_1 - P_0)$ et $B'(1) = (2, -4) = 2(P_2 - P_1)$.`,
          R`<b>Sommet.</b> $y' = 0$ pour $t = \frac12$ : $B(\frac12) = (1, 1)$, à mi-hauteur de $P_1 = (1, 2)$ ; la courbe ne passe pas par $P_1$, elle est « attirée » par lui.`
        ],
        retenir: R`<p>Les points de contrôle intérieurs guident la courbe sans être sur elle.</p>`
      }
    },
    {
      id: 'python-longueur', title: 'Périmètre d’une ellipse en Python', diff: 2, gen: 'longueur',
      enonce: R`<p>On veut le périmètre de l'ellipse $M(t) = (2\cos t, \sin t)$, $t \in [0, 2\pi]$.</p><ol><li>Calculer à la main la longueur de la ligne polygonale inscrite à 4 segments ($t = 0, \frac\pi2, \pi, \frac{3\pi}2$).</li><li>Avec la fonction <code>longueur</code> du cours, que se passe-t-il quand $n$ augmente ? Pourquoi les valeurs sont-elles toujours trop petites ?</li><li>Écrire le périmètre comme une intégrale et l'approcher par la méthode des trapèzes.</li></ol>`,
      correction: R`<p>1. Les sommets sont $(2, 0)$, $(0, 1)$, $(-2, 0)$, $(0, -1)$ : 4 segments de longueur $\sqrt5$, soit $4\sqrt5 \approx 8{,}944$.</p>
        <p>2. Les valeurs croissent vers $L \approx 9{,}688$ : une corde est plus courte que l'arc qu'elle sous-tend (inégalité triangulaire), donc toute ligne inscrite minore $L$.</p>
        <p>3. $L = \int_0^{2\pi}\sqrt{4\sin^2 t + \cos^2 t}\dd t$ ; par exemple <code>trapezes(lambda t: math.sqrt(4*math.sin(t)**2 + math.cos(t)**2), 0, 2*math.pi, 100)</code> donne $9{,}6884$.</p>`,
      detail: {
        but: R`<p>Approcher numériquement une longueur qui n'a pas d'expression élémentaire.</p>`,
        methode: R`<p>Deux approches : la ligne polygonale inscrite (géométrique), ou une méthode d'intégration numérique appliquée à $\int\|M'\|$ (chapitre 2).</p>`,
        etapes: [
          R`<b>Polygone à 4 côtés.</b> $M(0) = (2, 0)$, $M(\frac\pi2) = (0, 1)$, $M(\pi) = (-2, 0)$, $M(\frac{3\pi}2) = (0, -1)$ ; chaque côté mesure $\sqrt{2^2 + 1^2} = \sqrt5$, total $4\sqrt5 \approx 8{,}944$.`,
          R`<b>Raffinement.</b> En augmentant $n$, on ajoute des sommets : par l'inégalité triangulaire, la longueur augmente et se rapproche de $L$.`,
          R`<b>Toujours trop court.</b> Chaque segment $[M(t_k)M(t_{k+1})]$ est plus court que l'arc correspondant (la ligne droite est le plus court chemin) : la ligne inscrite minore $L$.`,
          R`<b>Intégrale.</b> $M'(t) = (-2\sin t, \cos t)$ et $L = \int_0^{2\pi}\sqrt{4\sin^2 t + \cos^2 t}\dd t$, sans primitive élémentaire.`,
          R`<b>Trapèzes.</b> La fonction intégrée est lisse et périodique : la méthode des trapèzes converge très vite, et $n = 100$ donne déjà $L \approx 9{,}6884$.`
        ],
        retenir: R`<p>Longueur d'un arc : intégrale de $\|M'\|$, à calculer exactement quand la racine se simplifie, numériquement sinon.</p>`
      }
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiches méthodes                                                     */
  /* ------------------------------------------------------------------ */
  const methodes = [
    {
      title: 'Réduire le domaine d’étude', gen: 'tangentes',
      cas: R`Fonctions trigonométriques, parité visible`, debut: R`Chercher une <b>période</b>, puis comparer <b>$M(-t)$</b>, <b>$M(\pi - t)$</b>, <b>$M(\pi + t)$</b> à $M(t)$.`,
      etapes: [
        R`Trouver une période commune $T$ de $x$ et $y$.`,
        R`Calculer $M(-t)$ et reconnaître une symétrie (axe $(Ox)$, axe $(Oy)$, centre $O$, bissectrice).`,
        R`Essayer aussi $t \mapsto \pi - t$ ou $t \mapsto \frac{T}{2} + t$ pour les courbes trigonométriques.`,
        R`Noter l'intervalle d'étude restant et la liste des symétries pour compléter le tracé.`
      ],
      exemple: {
        enonce: R`<p>$M(t) = (\cos t, \sin 2t)$.</p>`,
        solution: R`<p>$2\pi$-périodique. $M(-t) = (\cos t, -\sin 2t)$ : axe $(Ox)$. $M(\pi - t) = (-\cos t, -\sin 2t)$ : centre $O$. On étudie $[0, \frac\pi2]$.</p>`
      }
    },
    {
      title: 'Tangentes et tableau de variations', gen: 'tangentes',
      cas: R`« Étudier la courbe », « tangentes horizontales / verticales »`, debut: R`Calculer <b>$x'$ et $y'$</b>, faire le <b>tableau conjoint</b>, lire les zéros de $y'$ (horizontales) et de $x'$ (verticales).`,
      etapes: [
        R`Calculer $x'(t)$ et $y'(t)$ et étudier leur signe.`,
        R`Tableau : lignes $t$, $x'$, $x$, $y'$, $y$.`,
        R`$y' = 0 \neq x'$ : tangente horizontale ; $x' = 0 \neq y'$ : tangente verticale ; $x' = y' = 0$ : point stationnaire à étudier à part.`,
        R`Placer ces points avant de tracer.`
      ],
      exemple: {
        enonce: R`<p>$M(t) = (t^3 - 3t, t^2)$.</p>`,
        solution: R`<p>$x' = 3(t^2 - 1)$, $y' = 2t$. Tangentes verticales en $t = \pm1$ : points $(\mp2, 1)$ ; horizontale en $t = 0$ : $(0, 0)$.</p>`
      },
      pieges: [R`Conclure « tangente horizontale » quand $x'$ et $y'$ s'annulent tous les deux.`]
    },
    {
      title: 'Étudier un point stationnaire', gen: 'singulier',
      cas: R`$M'(t_0) = \vec 0$`, debut: R`Trouver <b>$p$</b> (premier $M^{(p)} \neq 0$) et <b>$q$</b> (premier non colinéaire), puis les <b>parités</b>.`,
      etapes: [
        R`Calculer les dérivées successives en $t_0$ (ou faire un développement limité de $x$ et $y$).`,
        R`$p$ : premier ordre non nul ; la tangente est dirigée par $M^{(p)}(t_0)$.`,
        R`$q$ : premier ordre dont le vecteur n'est pas colinéaire à $M^{(p)}(t_0)$.`,
        R`Conclure : ($p$ impair, $q$ pair) ordinaire ; (impair, impair) inflexion ; (pair, impair) rebroussement 1<sup>re</sup> espèce ; (pair, pair) 2<sup>de</sup> espèce.`
      ],
      exemple: {
        enonce: R`<p>$M(t) = (t^2 + t^3, t^3)$ en $t = 0$.</p>`,
        solution: R`<p>$M''(0) = (2, 0)$, $M'''(0) = (6, 6)$ non colinéaire : $p = 2$, $q = 3$, rebroussement de 1<sup>re</sup> espèce, tangente horizontale.</p>`
      }
    },
    {
      title: 'Étudier une branche infinie',
      cas: R`$x(t)$ ou $y(t)$ tend vers l'infini`, debut: R`Une seule infinie : asymptote horizontale ou verticale. Les deux : <b>$\frac yx \to a$</b> puis <b>$y - ax \to b$</b>.`,
      etapes: [
        R`Repérer les valeurs de $t$ (bornes, points interdits) où $x$ ou $y$ devient infini.`,
        R`Si une seule coordonnée tend vers l'infini et l'autre vers $\ell$ : asymptote parallèle à un axe.`,
        R`Si les deux : limite de $\frac yx$ ; si elle vaut $a \neq 0$, limite de $y - ax$.`,
        R`Position : signe de $y - ax - b$ au voisinage.`
      ],
      exemple: {
        enonce: R`<p>$M(t) = (t^2, t^2 + t)$ quand $t \to +\infty$.</p>`,
        solution: R`<p>$\frac yx = 1 + \frac1t \to 1$ et $y - x = t \to +\infty$ : branche parabolique de direction $y = x$ (pas d'asymptote).</p>`
      }
    },
    {
      title: 'Trouver un point double', gen: 'tangentes',
      cas: R`La courbe semble se recouper (boucle)`, debut: R`Résoudre <b>$M(t_1) = M(t_2)$, $t_1 \neq t_2$</b>, en s'aidant des symétries ($t_2 = -t_1$, $t_2 = \pi - t_1$…).`,
      etapes: [
        R`Écrire $x(t_1) = x(t_2)$ et en déduire une relation simple entre $t_1$ et $t_2$.`,
        R`Reporter dans $y(t_1) = y(t_2)$ et résoudre.`,
        R`Calculer le point et les deux vecteurs tangents $M'(t_1)$, $M'(t_2)$.`
      ],
      exemple: {
        enonce: R`<p>$M(t) = (\sin t, \sin 2t)$.</p>`,
        solution: R`<p>$M(0) = M(\pi) = (0, 0)$, tangentes dirigées par $(1, 2)$ et $(-1, 2)$.</p>`
      }
    },
    {
      title: 'Calculer une longueur', gen: 'longueur',
      cas: R`« Longueur de l'arc », « périmètre »`, debut: R`<b>$L = \int_a^b\sqrt{x'^2 + y'^2}$</b> : simplifier la racine (identités) avant d'intégrer.`,
      etapes: [
        R`Calculer $x'$, $y'$, puis $x'^2 + y'^2$.`,
        R`Simplifier en un carré : $\cos^2 + \sin^2 = 1$, $1 - \cos t = 2\sin^2\frac t2$, $1 + \sinh^2 = \cosh^2$, factorisation.`,
        R`Prendre la racine avec la valeur absolue, découper selon le signe ou utiliser les symétries.`,
        R`Intégrer ; si aucune simplification n'existe, calculer numériquement.`
      ],
      exemple: {
        enonce: R`<p>Spirale $M(t) = (e^t\cos t, e^t\sin t)$, $t \in [0, 1]$.</p>`,
        solution: R`<p>$x'^2 + y'^2 = e^{2t}\big((\cos t - \sin t)^2 + (\sin t + \cos t)^2\big) = 2e^{2t}$, donc $L = \int_0^1\sqrt2e^t\dd t = \sqrt2(e - 1)$.</p>`
      },
      pieges: [R`Oublier la valeur absolue : $\sqrt{\sin^2 t} = |\sin t|$.`]
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche méthode : plan de travail et cas à reconnaître                */
  /* ------------------------------------------------------------------ */
  const plan = {
    etapes: [
      { titre: 'Domaine et réduction', faire: R`Domaine de définition, <b>période</b>, <b>symétries</b> ($M(-t)$, $M(\pi - t)$…) : intervalle d'étude minimal.`,
        questions: [R`Des fonctions trigonométriques ? Une parité ?`, R`Des valeurs interdites (branches infinies) ?`] },
      { titre: 'Dérivées et variations', faire: R`$x'$, $y'$, leurs signes, <b>tableau de variations conjoint</b>.` },
      { titre: 'Points particuliers', faire: R`Tangentes <b>horizontales</b> ($y' = 0$) et <b>verticales</b> ($x' = 0$) ; points <b>stationnaires</b> ($x' = y' = 0$) étudiés avec $p$ et $q$.` },
      { titre: 'Branches infinies, points doubles', faire: R`Asymptotes ($\frac yx$, puis $y - ax$), branches paraboliques ; <b>points doubles</b> $M(t_1) = M(t_2)$.` },
      { titre: 'Tracé et exploitation', faire: R`Tracer en repère orthonormé, compléter par les symétries ; calculer une <b>longueur</b> $\int\|M'\|$ si demandé.` }
    ]
  };
  const reperes = [
    { etape: 1, si: R`$\cos t$, $\sin t$, $\sin kt$…`, alors: R`Période $2\pi$ (ou moins) ; tester $t \mapsto -t$, $\pi - t$, $\pi + t$.` },
    { etape: 1, si: R`$x$ paire et $y$ impaire`, alors: R`Symétrie d'axe <b>$(Ox)$</b> : étudier $t \ge 0$.` },
    { etape: 1, si: R`$x$ et $y$ impaires`, alors: R`Symétrie de <b>centre $O$</b>.` },
    { etape: 1, si: R`Une fraction en $t$ (dénominateur qui s'annule)`, alors: R`Branches infinies à prévoir aux valeurs interdites et en $\pm\infty$.` },
    { etape: 2, si: R`$x'$ et $y'$ se factorisent avec un facteur commun`, alors: R`Ce facteur donne les <b>points stationnaires</b> ; l'autre facteur donne la direction de la tangente.`, ex: R`Astroïde : $M'(t) = 3\sin t\cos t(-\cos t, \sin t)$.` },
    { etape: 3, si: R`$y'(t_0) = 0$ et $x'(t_0) \neq 0$`, alors: R`Tangente <b>horizontale</b> en $M(t_0)$.` },
    { etape: 3, si: R`$x'(t_0) = 0$ et $y'(t_0) \neq 0$`, alors: R`Tangente <b>verticale</b>.` },
    { etape: 3, si: R`$x'(t_0) = y'(t_0) = 0$`, alors: R`Point <b>stationnaire</b> : dérivées successives (ou DL), $p$, $q$, parités.` },
    { etape: 3, si: R`Un DL du type $x \approx at^2$, $y \approx bt^3$ en $t_0$`, alors: R`$p = 2$, $q = 3$ : <b>rebroussement</b> de 1<sup>re</sup> espèce (pointe).` },
    { etape: 4, si: R`$x \to \pm\infty$ et $y \to \ell$`, alors: R`Asymptote <b>horizontale</b> $y = \ell$.` },
    { etape: 4, si: R`$x$ et $y \to \infty$, $\frac yx \to a \neq 0$`, alors: R`Étudier $y - ax$ : limite finie $b$ → asymptote $y = ax + b$ ; infinie → branche parabolique.` },
    { etape: 4, si: R`$x$ paire (ou $x(t_1) = x(t_2)$ facile)`, alors: R`Point double : poser $t_2 = -t_1$ et résoudre $y(t_1) = y(-t_1)$.` },
    { etape: 5, si: R`$1 - \cos t$ dans $\|M'\|^2$`, alors: R`$1 - \cos t = 2\sin^2\frac t2$ (cycloïde).` },
    { etape: 5, si: R`$1 + \sinh^2 t$ ou $1 + f'^2$ qui est un carré`, alors: R`La racine disparaît : intégrale immédiate.` },
    { etape: 5, si: R`Aucune simplification de $\sqrt{x'^2 + y'^2}$`, alors: R`Calcul <b>numérique</b> : trapèzes ou ligne polygonale (Python).` }
  ];

  L2.chapter('aai', 'courbes', {
    intro: R`<p>Une <strong>courbe paramétrée</strong> décrit le mouvement d'un point $M(t) = (x(t), y(t))$ dans le plan. On apprend à l'étudier méthodiquement : réduction par les symétries, <strong>tangentes</strong>, points <strong>stationnaires</strong> (rebroussements, inflexions), <strong>branches infinies</strong> et points doubles, puis à calculer sa <strong>longueur</strong>. Côté informatique : tracé numérique, approximation des longueurs, et <strong>courbes de Bézier</strong>, utilisées dans les polices et le dessin vectoriel.</p>`,
    cours, fiche, exercices, methodes, generateurs, plan, reperes
  });
})();
