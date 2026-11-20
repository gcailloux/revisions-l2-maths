/* Analyse et applications informatiques — Chapitre 2 : Intégration, sommes de Riemann et continuité uniforme */
(function () {
  'use strict';
  const R = String.raw;
  const code = L2.code;
  const { F, dec } = ML;
  const { riemann: figR, courbe, fig } = PLOT;
  const approx = x => R`\approx ${dec(x, 4)}`;

  /* ------------------------------------------------------------------ */
  /* Générateurs                                                         */
  /* ------------------------------------------------------------------ */
  /* Limites de sommes de Riemann : S_n = (1/n) Σ_{k=1}^n f(k/n) → ∫_0^1 f */
  const SOMMES = [
    r => { const a = r.pick([1, 2, 3, 4]);
      return { S: R`\sum_{k=1}^{n}\frac{1}{n + ${a === 1 ? '' : a}k}`, f: x => 1 / (1 + a * x), ftex: R`\frac{1}{1 + ${a === 1 ? '' : a}x}`,
        reecr: R`\frac{1}{n + ${a === 1 ? '' : a}k} = \frac1n \cdot \frac{1}{1 + ${a === 1 ? '' : a}\frac kn}`,
        prim: R`\int_0^1\frac{\dd x}{1 + ${a === 1 ? '' : a}x} = \left[${a === 1 ? '' : R`\tfrac1{${a}}`}\ln(1 + ${a === 1 ? '' : a}x)\right]_0^1`,
        lim: a === 1 ? R`\ln 2` : R`\frac{\ln ${1 + a}}{${a}}`, val: Math.log(1 + a) / a }; },
    r => { const a = r.pick([1, 2, 3]);
      return { S: R`\sum_{k=1}^{n}\frac{n}{n^2 + ${a === 1 ? '' : a * a}k^2}`, f: x => 1 / (1 + a * a * x * x), ftex: R`\frac{1}{1 + ${a === 1 ? '' : a * a}x^2}`,
        reecr: R`\frac{n}{n^2 + ${a === 1 ? '' : a * a}k^2} = \frac1n \cdot \frac{1}{1 + ${a === 1 ? '' : a * a}\left(\frac kn\right)^2}`,
        prim: R`\int_0^1\frac{\dd x}{1 + ${a === 1 ? '' : a * a}x^2} = \left[${a === 1 ? '' : R`\tfrac1{${a}}`}\arctan(${a === 1 ? '' : a}x)\right]_0^1`,
        lim: a === 1 ? R`\frac\pi4` : R`\frac{\arctan ${a}}{${a}}`, val: Math.atan(a) / a }; },
    r => { const p = r.int(1, 5);
      return { S: R`\sum_{k=1}^{n}\frac{k^{${p}}}{n^{${p + 1}}}`, f: x => Math.pow(x, p), ftex: R`x^{${p}}`,
        reecr: R`\frac{k^{${p}}}{n^{${p + 1}}} = \frac1n\left(\frac kn\right)^{${p}}`,
        prim: R`\int_0^1 x^{${p}}\dd x = \left[\frac{x^{${p + 1}}}{${p + 1}}\right]_0^1`,
        lim: R`\frac{1}{${p + 1}}`, val: 1 / (p + 1) }; },
    r => { const a = r.pick([1, 2, 3]);
      return { S: R`\sum_{k=1}^{n}\frac{k}{n^2 + ${a === 1 ? '' : a * a}k^2}`, f: x => x / (1 + a * a * x * x), ftex: R`\frac{x}{1 + ${a === 1 ? '' : a * a}x^2}`,
        reecr: R`\frac{k}{n^2 + ${a === 1 ? '' : a * a}k^2} = \frac1n \cdot \frac{k/n}{1 + ${a === 1 ? '' : a * a}\left(\frac kn\right)^2}`,
        prim: R`\int_0^1\frac{x\dd x}{1 + ${a === 1 ? '' : a * a}x^2} = \left[\frac{1}{${2 * a * a}}\ln(1 + ${a === 1 ? '' : a * a}x^2)\right]_0^1`,
        lim: R`\frac{\ln ${1 + a * a}}{${2 * a * a}}`, val: Math.log(1 + a * a) / (2 * a * a) }; },
    r => { const a = r.pick([1, 3, 8]), s = Math.sqrt(1 + a);
      return { S: R`\sum_{k=1}^{n}\frac{1}{\sqrt{n^2 + ${a === 1 ? '' : a}nk}}`, f: x => 1 / Math.sqrt(1 + a * x), ftex: R`\frac{1}{\sqrt{1 + ${a === 1 ? '' : a}x}}`,
        reecr: R`\frac{1}{\sqrt{n^2 + ${a === 1 ? '' : a}nk}} = \frac{1}{n\sqrt{1 + ${a === 1 ? '' : a}\frac kn}}`,
        prim: R`\int_0^1\frac{\dd x}{\sqrt{1 + ${a === 1 ? '' : a}x}} = \left[\frac{2}{${a}}\sqrt{1 + ${a === 1 ? '' : a}x}\right]_0^1`,
        lim: a === 1 ? R`2(\sqrt2 - 1)` : F(2 * (s - 1), a).tex(), val: 2 * (s - 1) / a }; },
    r => { const a = r.pick([1, 2]);
      return { S: R`\frac1n\sum_{k=1}^{n}e^{${a === 1 ? '' : a}k/n}`, f: x => Math.exp(a * x), ftex: R`e^{${a === 1 ? '' : a}x}`,
        reecr: R`\frac1n e^{${a === 1 ? '' : a}k/n} = \frac1n\,f\!\left(\frac kn\right)`,
        prim: R`\int_0^1 e^{${a === 1 ? '' : a}x}\dd x = \left[${a === 1 ? '' : R`\tfrac12`}e^{${a === 1 ? '' : a}x}\right]_0^1`,
        lim: a === 1 ? R`e - 1` : R`\frac{e^2 - 1}{2}`, val: (Math.exp(a) - 1) / a }; },
    () => ({ S: R`\frac1n\sum_{k=1}^{n}\sin\frac{k\pi}{n}`, f: x => Math.sin(Math.PI * x), ftex: R`\sin(\pi x)`,
      reecr: R`\frac1n\sin\frac{k\pi}{n} = \frac1n\,f\!\left(\frac kn\right)`,
      prim: R`\int_0^1\sin(\pi x)\dd x = \left[-\frac{\cos(\pi x)}{\pi}\right]_0^1`,
      lim: R`\frac2\pi`, val: 2 / Math.PI })
  ];

  /* Continuité uniforme : un exemple « oui » et un exemple « non » */
  const UC = [
    r => { const p = r.pick([2, 3]), A = r.int(1, 3), k = p * Math.pow(A, p - 1);
      return { f: R`x^{${p}}`, I: R`[0, ${A}]`, J: R`[0, +\infty[`,
        oui: [R`<b>Dérivée bornée.</b> $f'(x) = ${p}x^{${p - 1}}$ et, sur $[0, ${A}]$, $|f'(x)| \le ${p} \times ${A}^{${p - 1}} = ${k}$.`,
          R`<b>Lipschitz.</b> Par l'inégalité des accroissements finis, $|f(x) - f(y)| \le ${k}|x - y|$ : $f$ est ${k}-lipschitzienne sur $[0, ${A}]$.`,
          R`<b>Uniforme continuité.</b> Pour $\eps \gt 0$, $\delta = \frac{\eps}{${k}}$ convient. (Autre argument : $f$ est continue sur un segment, théorème de Heine.)`],
        non: [R`<b>Suites.</b> $x_n = n + \frac1n$ et $y_n = n$ : $x_n - y_n = \frac1n \to 0$.`,
          p === 2 ? R`<b>Écart des images.</b> $f(x_n) - f(y_n) = \left(n + \frac1n\right)^2 - n^2 = 2 + \frac{1}{n^2} \ge 2$.`
                  : R`<b>Écart des images.</b> $f(x_n) - f(y_n) = \left(n + \frac1n\right)^3 - n^3 = 3n + \frac3n + \frac1{n^3} \ge 3n$.`,
          R`<b>Conclusion.</b> L'écart des images ne tend pas vers 0 alors que $x_n - y_n \to 0$ : $f$ n'est pas uniformément continue sur $[0, +\infty[$. La pente de $x^{${p}}$ devient arbitrairement grande.`] }; },
    r => { const a = r.pick([F(1, 2), F(1), F(2)]);
      return { f: R`\frac1x`, I: R`[${a.tex()}, +\infty[`, J: R`]0, 1]`,
        oui: [R`<b>Dérivée bornée.</b> $f'(x) = -\frac{1}{x^2}$ et, pour $x \ge ${a.tex()}$, $|f'(x)| \le \frac{1}{(${a.tex()})^2} = ${F(1).div(a.mul(a)).tex()}$.`,
          R`<b>Lipschitz.</b> Inégalité des accroissements finis : $f$ est $${F(1).div(a.mul(a)).tex()}$-lipschitzienne sur $[${a.tex()}, +\infty[$, donc uniformément continue.`,
          R`<b>Remarque.</b> L'intervalle n'est pas un segment : Heine ne s'applique pas, c'est la dérivée bornée qui conclut.`],
        non: [R`<b>Suites.</b> $x_n = \frac1n$ et $y_n = \frac{1}{2n}$ : $x_n - y_n = \frac1{2n} \to 0$.`,
          R`<b>Écart des images.</b> $f(y_n) - f(x_n) = 2n - n = n \to +\infty$.`,
          R`<b>Conclusion.</b> $f$ n'est pas uniformément continue sur $]0, 1]$ : près de 0, la pente explose.`] }; },
    () => ({ f: R`\sqrt x`, I: R`[0, +\infty[`, J: null,
      oui: [R`<b>Inégalité clé.</b> Pour $x \ge y \ge 0$ : $\sqrt x \le \sqrt y + \sqrt{x - y}$ (élever au carré : $x \le y + 2\sqrt{y(x-y)} + x - y$). Donc $|\sqrt x - \sqrt y| \le \sqrt{|x - y|}$.`,
        R`<b>Uniforme continuité.</b> Pour $\eps \gt 0$, $\delta = \eps^2$ : $|x - y| \le \delta \Rightarrow |\sqrt x - \sqrt y| \le \eps$, pour tous $x, y \ge 0$.`,
        R`<b>Pas lipschitzienne.</b> $\frac{|\sqrt x - \sqrt 0|}{x - 0} = \frac{1}{\sqrt x} \to +\infty$ quand $x \to 0^+$ : aucune constante $k$ ne convient.`],
      non: null }),
    () => ({ f: R`\ln x`, I: R`[1, +\infty[`, J: R`]0, 1]`,
      oui: [R`<b>Dérivée bornée.</b> $f'(x) = \frac1x \le 1$ sur $[1, +\infty[$.`,
        R`<b>Lipschitz.</b> Inégalité des accroissements finis : $|\ln x - \ln y| \le |x - y|$ : 1-lipschitzienne, donc uniformément continue.`],
      non: [R`<b>Suites.</b> $x_n = e^{-n}$ et $y_n = e^{-n-1}$ : $x_n - y_n = e^{-n}(1 - e^{-1}) \to 0$.`,
        R`<b>Écart des images.</b> $\ln x_n - \ln y_n = -n + n + 1 = 1$.`,
        R`<b>Conclusion.</b> L'écart ne tend pas vers 0 : $\ln$ n'est pas uniformément continue sur $]0, 1]$.`] }),
    r => { const A = r.int(1, 4);
      return { f: R`\sin(x^2)`, I: R`[-${A}, ${A}]`, J: R`\R`,
        oui: [R`<b>Heine.</b> $f$ est continue sur le <b>segment</b> $[-${A}, ${A}]$ : elle y est uniformément continue.`,
          R`<b>Constante explicite.</b> $|f'(x)| = |2x\cos(x^2)| \le ${2 * A}$ : $f$ est même ${2 * A}-lipschitzienne sur ce segment.`],
        non: [R`<b>Suites.</b> $x_n = \sqrt{2n\pi + \frac\pi2}$ et $y_n = \sqrt{2n\pi}$ : $x_n - y_n = \frac{\pi/2}{x_n + y_n} \to 0$ (quantité conjuguée).`,
          R`<b>Écart des images.</b> $f(x_n) - f(y_n) = \sin\left(2n\pi + \frac\pi2\right) - \sin(2n\pi) = 1$.`,
          R`<b>Conclusion.</b> Pas uniformément continue sur $\R$ : les oscillations sont de plus en plus serrées.`] }; },
    r => { const A = r.int(0, 2);
      return { f: R`e^x`, I: R`]-\infty, ${A}]`, J: R`\R`,
        oui: [R`<b>Dérivée bornée.</b> $f'(x) = e^x \le e^{${A}}$ sur $]-\infty, ${A}]$.`,
          R`<b>Lipschitz.</b> $f$ est $e^{${A}}$-lipschitzienne sur cet intervalle, donc uniformément continue.`],
        non: [R`<b>Suites.</b> $x_n = n + \frac1n$ et $y_n = n$ : $x_n - y_n \to 0$.`,
          R`<b>Écart des images.</b> $e^{x_n} - e^{y_n} = e^n\left(e^{1/n} - 1\right) \ge e^n \cdot \frac1n \to +\infty$ (car $e^u - 1 \ge u$).`,
          R`<b>Conclusion.</b> Pas uniformément continue sur $\R$.`] }; }
  ];

  /* Erreur de la méthode des rectangles */
  const ERR = [
    { f: x => Math.exp(x), tex: R`e^x`, a: 0, b: 1, M: 'e', Mv: Math.E, d: R`f'(x) = e^x \le e`, I: R`e - 1`, Iv: Math.E - 1, at: '0', bt: '1' },
    { f: x => Math.sin(x), tex: R`\sin x`, a: 0, b: Math.PI, M: '1', Mv: 1, d: R`|f'(x)| = |\cos x| \le 1`, I: '2', Iv: 2, at: '0', bt: R`\pi` },
    { f: x => 1 / (1 + x), tex: R`\frac{1}{1 + x}`, a: 0, b: 1, M: '1', Mv: 1, d: R`|f'(x)| = \frac{1}{(1+x)^2} \le 1`, I: R`\ln 2`, Iv: Math.LN2, at: '0', bt: '1' },
    { f: x => x * x, tex: R`x^2`, a: 0, b: 2, M: '4', Mv: 4, d: R`|f'(x)| = 2x \le 4`, I: R`\frac83`, Iv: 8 / 3, at: '0', bt: '2' },
    { f: x => Math.log(x), tex: R`\ln x`, a: 1, b: 2, M: '1', Mv: 1, d: R`|f'(x)| = \frac1x \le 1`, I: R`2\ln 2 - 1`, Iv: 2 * Math.LN2 - 1, at: '1', bt: '2' },
    { f: x => Math.sqrt(x), tex: R`\sqrt x`, a: 1, b: 4, M: R`\frac12`, Mv: 0.5, d: R`|f'(x)| = \frac{1}{2\sqrt x} \le \frac12`, I: R`\frac{14}{3}`, Iv: 14 / 3, at: '1', bt: '4' }
  ];
  const rectG = (f, a, b, n) => { let s = 0; const h = (b - a) / n; for (let k = 0; k < n; k++) s += f(a + k * h); return s * h; };

  const generateurs = {
    sommes: {
      title: 'Limite d’une somme de Riemann', diff: 1,
      make(r) {
        const T = r.pick(SOMMES)(r);
        let s100 = 0; for (let k = 1; k <= 100; k++) s100 += T.f(k / 100); s100 /= 100;
        return {
          enonce: R`<p>Déterminer la limite, quand $n \to +\infty$, de $\displaystyle S_n = ${T.S}$.</p>`,
          indication: R`<p>Mettre $\frac1n$ en facteur et faire apparaître une expression de la forme $f\left(\frac kn\right)$.</p>`,
          correction: R`<p>On écrit $${T.reecr}$, donc $S_n = \dfrac1n\displaystyle\sum_{k=1}^n f\left(\frac kn\right)$ avec $f(x) = ${T.ftex}$, continue sur $[0, 1]$. C'est une somme de Riemann (rectangles à droite, pas $\frac1n$) :</p>
            $$S_n \xrightarrow[n\to\infty]{} \int_0^1 ${T.ftex}\dd x = ${T.lim} ${approx(T.val)}.$$
            <p>Contrôle numérique : $S_{100} ${approx(s100)}$.</p>`,
          detail: {
            but: R`<p>Calculer $\lim S_n$ en reconnaissant une somme de Riemann.</p>`,
            methode: R`<p>Si $f$ est continue sur $[0, 1]$, $\frac1n\sum_{k=1}^n f\left(\frac kn\right) \to \int_0^1 f$. Il faut donc <b>mettre $\frac1n$ en facteur</b> et faire apparaître $\frac kn$ partout.</p>`,
            etapes: [
              R`<b>Terme général.</b> On divise numérateur et dénominateur par la bonne puissance de $n$ : $${T.reecr}$.`,
              R`<b>Fonction.</b> $S_n = \frac1n\sum_{k=1}^n f\left(\frac kn\right)$ avec $f(x) = ${T.ftex}$.`,
              R`<b>Hypothèse.</b> $f$ est continue sur le segment $[0, 1]$ : le théorème des sommes de Riemann s'applique (subdivision régulière de pas $\frac1n$, valeurs aux extrémités droites).`,
              R`<b>Intégrale.</b> $${T.prim} = ${T.lim}$.`,
              R`<b>Contrôle numérique.</b> $S_{100} ${approx(s100)}$ et la limite vaut $${approx(T.val)}$ : l'écart est de l'ordre de $\frac1n$, comme prévu.`
            ],
            retenir: R`<p>« $\sum_{k=1}^n$ d'une expression homogène en $k$ et $n$ » : penser somme de Riemann, $\frac1n\sum f\left(\frac kn\right) \to \int_0^1 f$.</p>`
          }
        };
      }
    },

    uc: {
      title: 'Continuité uniforme : oui ou non ?', diff: 2,
      make(r) {
        const T = r.pick(UC)(r);
        const q = T.J ? R`<ol><li>Montrer que $f$ est uniformément continue sur $${T.I}$.</li><li>L'est-elle sur $${T.J}$ ?</li></ol>` : R`<ol><li>Montrer que $f$ est uniformément continue sur $${T.I}$.</li><li>Est-elle lipschitzienne sur $${T.I}$ ?</li></ol>`;
        return {
          enonce: R`<p>On considère $f(x) = ${T.f}$.</p>${q}`,
          indication: R`<p>Pour « oui » : dérivée bornée (lipschitzienne) ou théorème de Heine sur un segment. Pour « non » : trouver $x_n - y_n \to 0$ avec $f(x_n) - f(y_n) \not\to 0$.</p>`,
          correction: R`<p><b>1.</b> ${T.oui.map(s => s.replace(/<b>[^<]*<\/b>\s*/, '')).join(' ')}</p>` + (T.non ? R`<p><b>2.</b> ${T.non.map(s => s.replace(/<b>[^<]*<\/b>\s*/, '')).join(' ')}</p>` : ''),
          detail: {
            but: R`<p>Décider si $f(x) = ${T.f}$ est uniformément continue, et le justifier.</p>`,
            methode: R`<p><b>Pour prouver</b> : $f$ lipschitzienne (souvent via $|f'| \le k$ et l'inégalité des accroissements finis), ou continue sur un <b>segment</b> (Heine), ou une inégalité directe. <b>Pour réfuter</b> : deux suites avec $x_n - y_n \to 0$ et $f(x_n) - f(y_n) \not\to 0$.</p>`,
            etapes: [...T.oui, ...(T.non || [])],
            retenir: R`<p>Uniformément continue = un même $\delta$ pour tous les points. Ça casse quand la pente devient infinie (bord ouvert, $\pm\infty$) ou quand $f$ oscille de plus en plus vite.</p>`
          }
        };
      }
    },

    erreur: {
      title: 'Erreur de la méthode des rectangles', diff: 2,
      make(r) {
        const T = r.pick(ERR), eps = r.pick([1e-2, 1e-3, 1e-4]), L = T.b - T.a;
        const borne = T.Mv * L * L / 2, nmin = Math.ceil(borne / eps - 1e-9);
        const R4 = rectG(T.f, T.a, T.b, 4), e4 = Math.abs(R4 - T.Iv);
        const Ltex = T.at === '0' ? T.bt : R`${T.bt} - ${T.at}`;
        const epsTex = R`10^{${Math.round(Math.log10(eps))}}`;
        return {
          enonce: R`<p>On approche $I = \displaystyle\int_{${T.at}}^{${T.bt}} ${T.tex}\dd x$ par la méthode des rectangles à gauche avec $n$ sous-intervalles : $R_n = h\sum_{k=0}^{n-1}f(a + kh)$, $h = \frac{b-a}{n}$.</p>
            <ol><li>Calculer $R_4$ et l'erreur commise (on donne $I = ${T.I}$).</li><li>Rappeler la majoration $|R_n - I| \le \dfrac{M_1(b-a)^2}{2n}$ et donner une valeur de $n$ garantissant une erreur au plus $${epsTex}$.</li></ol>`,
          indication: R`<p>$M_1$ est un majorant de $|f'|$ sur $[a, b]$.</p>`,
          correction: R`${fig([figR(T.f, T.a, T.b, 4, 'g'), 'rectangles à gauche, n = 4'])}
            <p>1. $h = \frac{${Ltex}}{4}$ et $R_4 = h\big(f(x_0) + f(x_1) + f(x_2) + f(x_3)\big) ${approx(R4)}$, pour $I ${approx(T.Iv)}$ : erreur $|R_4 - I| ${approx(e4)}$.</p>
            <p>2. Ici $${T.d}$ : $M_1 = ${T.M}$. On veut $\dfrac{M_1(b-a)^2}{2n} \le ${epsTex}$, soit $n \ge \dfrac{M_1(b-a)^2}{2 \times ${epsTex}} ${approx(borne / eps)}$ : <b>$n = ${nmin}$</b> convient.</p>`,
          detail: {
            but: R`<p>Mesurer l'erreur de la méthode des rectangles et choisir $n$ pour atteindre une précision donnée.</p>`,
            methode: R`<p>Sur chaque sous-intervalle, $|f(t) - f(x_k)| \le M_1(t - x_k)$ ; en intégrant, l'erreur par rectangle est au plus $M_1\frac{h^2}{2}$, et il y a $n$ rectangles : $|R_n - I| \le \frac{M_1(b-a)^2}{2n}$.</p>`,
            etapes: [
              R`<b>Pas.</b> $h = \frac{b - a}{4} = \frac{${Ltex}}{4}$, points $x_k = ${T.at === '0' ? '' : T.at + ' + '}kh$ pour $k = 0, 1, 2, 3$.`,
              R`<b>Somme.</b> $R_4 = h\sum_{k=0}^{3}f(x_k) ${approx(R4)}$.`,
              R`<b>Erreur réelle.</b> $I = ${T.I} ${approx(T.Iv)}$, donc $|R_4 - I| ${approx(e4)}$ ; la borne théorique pour $n = 4$ vaut $\frac{M_1(b-a)^2}{8} ${approx(borne / 4)}$, qui est bien au-dessus.`,
              R`<b>Constante $M_1$.</b> $${T.d}$ sur $[${T.at}, ${T.bt}]$ : $M_1 = ${T.M}$.`,
              R`<b>Inéquation.</b> $\frac{M_1(b - a)^2}{2n} \le ${epsTex} \iff n \ge \frac{M_1(b-a)^2}{2 \times ${epsTex}} ${approx(borne / eps)}$.`,
              R`<b>Choix de $n$.</b> Le plus petit entier convenable est $n = ${nmin}$ (la borne est une garantie : un $n$ plus petit peut suffire en pratique).`
            ],
            retenir: R`<p>Rectangles : erreur en $O\left(\frac1n\right)$ ; point milieu et trapèzes : en $O\left(\frac{1}{n^2}\right)$ pour une fonction $C^2$.</p>`
          }
        };
      }
    },

    explicite: {
      title: 'Calculer une intégrale avec une somme de Riemann', diff: 2,
      make(r) {
        const p = r.int(1, 3), a = r.int(1, 3);
        const ap = Math.pow(a, p + 1);
        const sk = { 1: R`\frac{n(n+1)}{2}`, 2: R`\frac{n(n+1)(2n+1)}{6}`, 3: R`\frac{n^2(n+1)^2}{4}` }[p];
        const Rn = { 1: R`\frac{${ap}(n+1)}{2n}`, 2: R`\frac{${ap}(n+1)(2n+1)}{6n^2}`, 3: R`\frac{${ap}(n+1)^2}{4n^2}` }[p];
        const lim = F(ap, p + 1);
        return {
          enonce: R`<p>Sans utiliser de primitive, calculer $\displaystyle\int_0^{${a}} x^{${p}}\dd x$ comme limite des sommes de Riemann $R_n = \frac{${a}}{n}\sum_{k=1}^{n}\left(\frac{${a}k}{n}\right)^{${p}}$. On rappelle que $\sum_{k=1}^n k^{${p}} = ${sk}$.</p>`,
          correction: R`<p>$R_n = \dfrac{${a}^{${p + 1}}}{n^{${p + 1}}}\displaystyle\sum_{k=1}^n k^{${p}} = \dfrac{${ap}}{n^{${p + 1}}} \cdot ${sk} = ${Rn} \longrightarrow ${lim.tex()}$.</p><p>Donc $\displaystyle\int_0^{${a}} x^{${p}}\dd x = ${lim.tex()}$, ce que confirme la primitive $\frac{x^{${p + 1}}}{${p + 1}}$.</p>`,
          detail: {
            but: R`<p>Retrouver $\int_0^{${a}}x^{${p}}\dd x$ à partir de la définition par sommes de Riemann.</p>`,
            methode: R`<p>Subdivision régulière de $[0, ${a}]$ en $n$ morceaux de longueur $h = \frac{${a}}{n}$, valeurs à droite $x_k = kh$ ; on calcule la somme exactement avec la formule de $\sum k^{${p}}$, puis on passe à la limite.</p>`,
            etapes: [
              R`<b>Somme de Riemann.</b> $R_n = h\sum_{k=1}^n f(x_k) = \frac{${a}}{n}\sum_{k=1}^n\left(\frac{${a}k}{n}\right)^{${p}}$.`,
              R`<b>Sortir les constantes.</b> $R_n = \frac{${a}}{n} \cdot \frac{${a}^{${p}}}{n^{${p}}}\sum_{k=1}^n k^{${p}} = \frac{${ap}}{n^{${p + 1}}}\sum_{k=1}^n k^{${p}}$.`,
              R`<b>Formule de somme.</b> $\sum_{k=1}^n k^{${p}} = ${sk}$, d'où $R_n = ${Rn}$.`,
              R`<b>Limite.</b> Le numérateur et le dénominateur sont de degré $${p + 1}$ en $n$ : quotient des coefficients dominants, $R_n \to ${lim.tex()}$.`,
              R`<b>Justification.</b> $x \mapsto x^{${p}}$ est continue sur le segment $[0, ${a}]$, donc intégrable, et ses sommes de Riemann convergent vers l'intégrale : $\int_0^{${a}}x^{${p}}\dd x = ${lim.tex()}$.`
            ],
            retenir: R`<p>C'est ainsi qu'Archimède calculait l'aire sous la parabole : somme exacte, puis passage à la limite.</p>`
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
    { t: 'h', title: 'Continuité uniforme' },
    { t: 'def', title: 'continuité uniforme', body: R`<p>Soit $I$ un intervalle et $f : I \to \R$. On dit que $f$ est <strong>uniformément continue</strong> sur $I$ si</p>
      $$\forall \eps \gt 0,\ \exists \delta \gt 0,\ \forall x, y \in I,\quad |x - y| \le \delta \Rightarrow |f(x) - f(y)| \le \eps.$$` },
    { t: 'rem', title: 'comparaison avec la continuité', body: R`<p>$f$ est continue sur $I$ si $\forall x \in I,\ \forall \eps \gt 0,\ \exists \delta \gt 0,\ \forall y \in I,\ |x - y| \le \delta \Rightarrow |f(x) - f(y)| \le \eps$ : ici $\delta$ dépend de $\eps$ <strong>et de $x$</strong>. Dans la continuité uniforme, le « $\forall x$ » passe après le « $\exists \delta$ » : <strong>un même $\delta$ convient en tout point</strong>. C'est la même différence qu'entre convergence simple et convergence uniforme.</p>` },
    { t: 'prop', body: R`<p>Une fonction uniformément continue sur $I$ est continue sur $I$.</p>`,
      proof: R`<p>Il suffit de fixer $x$ dans la définition : le $\delta$ obtenu convient pour la continuité en $x$.</p>` },
    { t: 'def', title: 'fonction lipschitzienne', body: R`<p>$f$ est <strong>$k$-lipschitzienne</strong> sur $I$ ($k \ge 0$) si $|f(x) - f(y)| \le k|x - y|$ pour tous $x, y \in I$.</p>` },
    { t: 'prop', body: R`<ol><li>Une fonction lipschitzienne est uniformément continue.</li><li>Si $f$ est dérivable sur $I$ et $|f'| \le k$ sur $I$, alors $f$ est $k$-lipschitzienne (inégalité des accroissements finis).</li></ol>`,
      proof: R`<p>1. Si $k \gt 0$, pour $\eps \gt 0$ on prend $\delta = \frac\eps k$ : $|x - y| \le \delta \Rightarrow |f(x) - f(y)| \le k\delta = \eps$ (si $k = 0$, $f$ est constante).</p>
      <p>2. Pour $x \lt y$, le théorème des accroissements finis donne $c \in ]x, y[$ avec $f(x) - f(y) = f'(c)(x - y)$, donc $|f(x) - f(y)| \le k|x - y|$.</p>` },
    { t: 'ex', body: R`<p>$\sin$ et $\cos$ sont 1-lipschitziennes sur $\R$ ; $x \mapsto |x|$ aussi ; $x \mapsto x^2$ est $2A$-lipschitzienne sur $[-A, A]$ ; $\ln$ est 1-lipschitzienne sur $[1, +\infty[$. Toutes ces fonctions sont uniformément continues sur ces intervalles.</p>` },
    { t: 'ex', title: 'uniformément continue mais pas lipschitzienne', body: R`<p>$\sqrt{\cdot}$ sur $[0, +\infty[$ : pour $x \ge y \ge 0$, $\sqrt x \le \sqrt y + \sqrt{x - y}$ (on élève au carré), donc $|\sqrt x - \sqrt y| \le \sqrt{|x - y|}$ et $\delta = \eps^2$ convient. Mais $\frac{\sqrt x - \sqrt 0}{x - 0} = \frac{1}{\sqrt x} \to +\infty$ en $0^+$ : aucune constante de Lipschitz.</p>` },
    { t: 'prop', title: 'critère séquentiel', body: R`<p>S'il existe deux suites $(x_n)$, $(y_n)$ de $I$ telles que $x_n - y_n \to 0$ et $f(x_n) - f(y_n) \not\to 0$, alors $f$ n'est <strong>pas</strong> uniformément continue sur $I$.</p>`,
      proof: R`<p>Si $f$ l'était : pour $\eps \gt 0$, soit $\delta$ associé ; à partir d'un rang, $|x_n - y_n| \le \delta$, donc $|f(x_n) - f(y_n)| \le \eps$. Ainsi $f(x_n) - f(y_n) \to 0$ : contradiction.</p>` },
    { t: 'ex', body: R`<ul><li>$x^2$ sur $\R$ : $x_n = n + \frac1n$, $y_n = n$ donnent $x_n^2 - y_n^2 = 2 + \frac1{n^2} \not\to 0$.</li>
      <li>$\frac1x$ sur $]0, 1]$ : $x_n = \frac1n$, $y_n = \frac1{2n}$ donnent un écart d'images $n \to +\infty$.</li>
      <li>$\sin\frac1x$ sur $]0, 1]$ : $x_n = \frac{1}{2n\pi + \pi/2}$, $y_n = \frac{1}{2n\pi}$ donnent $\sin\frac1{x_n} - \sin\frac1{y_n} = 1$.</li></ul>` },
    { t: 'thm', title: 'théorème de Heine', body: R`<p>Toute fonction <strong>continue sur un segment</strong> $[a, b]$ est uniformément continue sur $[a, b]$.</p>`,
      proof: R`<p>Par l'absurde : il existe $\eps \gt 0$ tel que pour tout $\delta \gt 0$, on trouve $x, y$ avec $|x - y| \le \delta$ et $|f(x) - f(y)| \gt \eps$. Avec $\delta = \frac1n$, on obtient $x_n, y_n \in [a, b]$ tels que $|x_n - y_n| \le \frac1n$ et $|f(x_n) - f(y_n)| \gt \eps$.</p>
      <p>$(x_n)$ est bornée : par le théorème de Bolzano-Weierstrass, une sous-suite $(x_{\varphi(n)})$ converge vers un réel $c$, qui est dans $[a, b]$ car le segment est fermé. Alors $y_{\varphi(n)} = x_{\varphi(n)} + (y_{\varphi(n)} - x_{\varphi(n)}) \to c$ aussi. Par continuité de $f$ en $c$, $f(x_{\varphi(n)}) - f(y_{\varphi(n)}) \to f(c) - f(c) = 0$, ce qui contredit $|f(x_{\varphi(n)}) - f(y_{\varphi(n)})| \gt \eps$.</p>` },
    { t: 'warn', body: R`<p>Les deux hypothèses comptent : sur $]0, 1]$ (intervalle non fermé), $\frac1x$ est continue sans être uniformément continue ; sur $[0, +\infty[$ (non borné), $x^2$ non plus.</p>` },

    /* ================= 2 ================= */
    { t: 'h', title: 'Intégrale de Riemann' },
    { t: 'def', title: 'subdivision, fonction en escalier', body: R`<p>Une <strong>subdivision</strong> de $[a, b]$ est une suite $\sigma = (x_0, \dots, x_n)$ avec $a = x_0 \lt x_1 \lt \dots \lt x_n = b$ ; son <strong>pas</strong> est $\max_k(x_{k+1} - x_k)$. Une fonction $\varphi$ est <strong>en escalier</strong> sur $[a, b]$ s'il existe une subdivision telle que $\varphi$ soit constante, égale à $c_k$, sur chaque intervalle ouvert $]x_k, x_{k+1}[$. Son intégrale est</p>
      $$\int_a^b\varphi = \sum_{k=0}^{n-1}(x_{k+1} - x_k)\,c_k$$
      <p>(somme d'aires de rectangles, comptées négativement sous l'axe ; on admet qu'elle ne dépend pas de la subdivision choisie).</p>` },
    { t: 'def', title: 'fonction intégrable au sens de Riemann', body: R`<p>Une fonction bornée $f : [a, b] \to \R$ est <strong>intégrable</strong> si pour tout $\eps \gt 0$, il existe des fonctions en escalier $\varphi \le f \le \psi$ telles que $\int_a^b(\psi - \varphi) \le \eps$. On pose alors</p>
      $$\int_a^b f = \sup_{\varphi \le f}\int_a^b\varphi = \inf_{\psi \ge f}\int_a^b\psi.$$
      <p>On encadre l'aire sous la courbe par des aires de rectangles, de plus en plus finement.</p>` },
    { t: 'thm', body: R`<p>Toute fonction <strong>continue</strong> sur $[a, b]$ est intégrable.</p>`,
      proof: R`<p>Soit $\eps \gt 0$. Par Heine, il existe $\delta$ tel que $|x - y| \le \delta \Rightarrow |f(x) - f(y)| \le \eps$. Prenons une subdivision de pas $\le \delta$ et, sur chaque $[x_k, x_{k+1}]$, $\varphi = \min f$ et $\psi = \max f$ (atteints, $f$ étant continue sur un segment). Ces deux valeurs sont prises en deux points distants d'au plus $\delta$, donc $0 \le \psi - \varphi \le \eps$, et $\int_a^b(\psi - \varphi) \le \eps(b - a)$, aussi petit qu'on veut.</p>` },
    { t: 'prop', body: R`<p>Toute fonction <strong>monotone</strong> sur $[a, b]$ est intégrable. Plus généralement, les fonctions continues par morceaux sont intégrables.</p>`,
      proof: R`<p>Pour $f$ croissante et la subdivision régulière de pas $h = \frac{b-a}{n}$ : sur $[x_k, x_{k+1}]$, $\varphi = f(x_k) \le f \le f(x_{k+1}) = \psi$. Alors $\int(\psi - \varphi) = h\sum_k\big(f(x_{k+1}) - f(x_k)\big) = h\big(f(b) - f(a)\big) \to 0$ (somme télescopique). Le cas continu par morceaux s'obtient en recollant les morceaux (admis).</p>` },
    { t: 'ex', title: 'une fonction non intégrable', body: R`<p>La fonction de Dirichlet, $f = 1$ sur $\Q \cap [0, 1]$ et $0$ ailleurs, n'est pas intégrable : tout intervalle non trivial contient des rationnels et des irrationnels, donc toute $\varphi \le f$ en escalier vérifie $\int\varphi \le 0$ et toute $\psi \ge f$ vérifie $\int\psi \ge 1$.</p>` },
    { t: 'prop', title: 'rappels', body: R`<p>Pour $f, g$ intégrables sur $[a, b]$ :</p>
      <ul><li>linéarité : $\int(\lambda f + \mu g) = \lambda\int f + \mu\int g$ ;</li><li>positivité et croissance : $f \le g \Rightarrow \int f \le \int g$ ;</li><li>relation de Chasles ;</li><li>$\left|\int_a^b f\right| \le \int_a^b|f| \le (b - a)\sup_{[a,b]}|f|$.</li></ul>
      <p>Théorème fondamental : si $f$ est continue, $F(x) = \int_a^x f$ est $C^1$ et $F' = f$ ; d'où $\int_a^b f = G(b) - G(a)$ pour toute primitive $G$.</p>` },

    /* ================= 3 ================= */
    { t: 'h', title: 'Sommes de Riemann' },
    { t: 'def', body: R`<p>Soit $\sigma = (x_0, \dots, x_n)$ une subdivision de $[a, b]$ et des points $\xi_k \in [x_k, x_{k+1}]$. La <strong>somme de Riemann</strong> associée est</p>
      $$S(f, \sigma, \xi) = \sum_{k=0}^{n-1}(x_{k+1} - x_k)\,f(\xi_k).$$
      <p>Cas usuel : subdivision <strong>régulière</strong>, $x_k = a + k\frac{b-a}{n}$, et $\xi_k = x_k$ (rectangles à gauche) ou $\xi_k = x_{k+1}$ (à droite) :</p>
      $$R_n(f) = \frac{b - a}{n}\sum_{k=0}^{n-1}f\left(a + k\frac{b - a}{n}\right), \qquad R'_n(f) = \frac{b - a}{n}\sum_{k=1}^{n}f\left(a + k\frac{b - a}{n}\right).$$` },
    { t: 'thm', title: 'convergence des sommes de Riemann', body: R`<p>Si $f$ est <strong>continue</strong> sur $[a, b]$, alors $S(f, \sigma, \xi) \to \int_a^b f$ quand le pas de $\sigma$ tend vers 0. En particulier</p>
      $$\frac{b - a}{n}\sum_{k=0}^{n-1}f\left(a + k\frac{b-a}{n}\right) \xrightarrow[n\to\infty]{} \int_a^b f, \qquad \frac1n\sum_{k=1}^n f\left(\frac kn\right) \xrightarrow[n\to\infty]{} \int_0^1 f.$$`,
      proof: R`<p>Soit $\eps \gt 0$ et $\delta$ donné par Heine. Si le pas est $\le \delta$, alors pour $t \in [x_k, x_{k+1}]$, $|f(t) - f(\xi_k)| \le \eps$, donc</p>
      $$\left|\int_a^b f - S\right| = \left|\sum_k\int_{x_k}^{x_{k+1}}\big(f(t) - f(\xi_k)\big)\dd t\right| \le \sum_k(x_{k+1} - x_k)\,\eps = (b - a)\,\eps.$$` },
    { t: 'meth', title: 'calculer la limite d’une somme', body: R`<ol><li>Mettre $\frac1n$ en facteur (diviser numérateur et dénominateur par la bonne puissance de $n$).</li><li>Faire apparaître $\frac kn$ partout : le terme devient $\frac1n f\left(\frac kn\right)$.</li><li>Vérifier que $f$ est continue sur $[0, 1]$.</li><li>Conclure : la limite est $\int_0^1 f$, que l'on calcule avec une primitive.</li></ol>` },
    { t: 'ex', body: R`<p>$\displaystyle\sum_{k=1}^n\frac{1}{n + k} = \frac1n\sum_{k=1}^n\frac{1}{1 + \frac kn} \longrightarrow \int_0^1\frac{\dd x}{1 + x} = \ln 2$ et $\displaystyle\sum_{k=1}^n\frac{n}{n^2 + k^2} = \frac1n\sum_{k=1}^n\frac{1}{1 + (k/n)^2} \longrightarrow \int_0^1\frac{\dd x}{1 + x^2} = \frac\pi4$.</p>` },
    { t: 'prop', title: 'vitesse de convergence', body: R`<p>Si $f$ est dérivable sur $[a, b]$ avec $|f'| \le M_1$, alors</p>
      $$\left|R_n(f) - \int_a^b f\right| \le \frac{M_1(b - a)^2}{2n}.$$`,
      proof: R`<p>Avec $h = \frac{b-a}{n}$ : pour $t \in [x_k, x_{k+1}]$, $|f(t) - f(x_k)| \le M_1(t - x_k)$ (accroissements finis). Donc $\left|\int_{x_k}^{x_{k+1}}\big(f(t) - f(x_k)\big)\dd t\right| \le M_1\int_{x_k}^{x_{k+1}}(t - x_k)\dd t = M_1\frac{h^2}{2}$. En sommant les $n$ intervalles : $n \cdot M_1\frac{h^2}{2} = \frac{M_1(b-a)^2}{2n}$.</p>` },

    /* ================= 4 ================= */
    { t: 'h', title: 'Méthodes numériques d’intégration' },
    { t: 'def', body: R`<p>Avec $h = \frac{b - a}{n}$ et $x_k = a + kh$ :</p>
      <ul><li><strong>rectangles à gauche</strong> : $R_n = h\sum_{k=0}^{n-1}f(x_k)$ ;</li>
      <li><strong>point milieu</strong> : $M_n = h\sum_{k=0}^{n-1}f\left(\frac{x_k + x_{k+1}}{2}\right)$ ;</li>
      <li><strong>trapèzes</strong> : $T_n = h\sum_{k=0}^{n-1}\frac{f(x_k) + f(x_{k+1})}{2} = h\left(\frac{f(a) + f(b)}{2} + \sum_{k=1}^{n-1}f(x_k)\right)$.</li></ul>
      <p>Ce sont des sommes de Riemann (les trapèzes sont la moyenne des rectangles à gauche et à droite) : elles convergent vers $\int_a^b f$ si $f$ est continue.</p>` },
    { t: 'p', body: fig([figR(x => 1 / (1 + x * x), 0, 1.5, 5, 'g'), 'rectangles à gauche'], [figR(x => 1 / (1 + x * x), 0, 1.5, 5, 'm'), 'point milieu'], [figR(x => 1 / (1 + x * x), 0, 1.5, 5, 't'), 'trapèzes']) },
    { t: 'thm', title: 'erreurs (admis pour milieu et trapèzes)', body: R`<p>Si $f$ est $C^1$ avec $|f'| \le M_1$, ou $C^2$ avec $|f''| \le M_2$ :</p>
      $$|R_n - I| \le \frac{M_1(b-a)^2}{2n}, \qquad |M_n - I| \le \frac{M_2(b-a)^3}{24n^2}, \qquad |T_n - I| \le \frac{M_2(b-a)^3}{12n^2}.$$
      <p>Les rectangles sont d'<strong>ordre 1</strong> (doubler $n$ divise l'erreur par 2) ; le point milieu et les trapèzes d'<strong>ordre 2</strong> (doubler $n$ la divise par 4).</p>` },
    { t: 'rem', body: R`<p>Ces majorations servent à choisir $n$ <strong>a priori</strong> pour garantir une précision. En pratique, on peut aussi comparer deux calculs successifs ($n$ et $2n$) pour estimer l'erreur.</p>` },
    { t: 'meth', title: 'programmer les méthodes en Python', body: code(`import math

def rectangles(f, a, b, n):
    h = (b - a) / n
    return h * sum(f(a + k * h) for k in range(n))

def milieu(f, a, b, n):
    h = (b - a) / n
    return h * sum(f(a + (k + 0.5) * h) for k in range(n))

def trapezes(f, a, b, n):
    h = (b - a) / n
    return h * ((f(a) + f(b)) / 2 + sum(f(a + k * h) for k in range(1, n)))

f = lambda x: 4 / (1 + x**2)          # son intégrale sur [0, 1] vaut pi
for n in [10, 20, 40, 80]:
    print(n, rectangles(f, 0, 1, n) - math.pi,
             milieu(f, 0, 1, n) - math.pi,
             trapezes(f, 0, 1, n) - math.pi)
# erreurs ~ 1/n pour les rectangles, ~ 1/(12 n^2) et -1/(6 n^2) pour milieu et trapèzes`) }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche                                                               */
  /* ------------------------------------------------------------------ */
  const fiche = [
    { part: '1. Continuité uniforme' },
    { k: 'def', t: 'Uniforme continuité', prio: true,
      concl: [R`$\forall \eps\ \exists \delta\ \forall x, y \in I$, $|x - y| \le \delta \Rightarrow |f(x) - f(y)| \le \eps$`, R`<u>Un même $\delta$</u> pour tous les points`] },
    { k: 'prop', t: 'Prouver l’uniforme continuité',
      concl: [R`$k$-lipschitzienne ⇒ UC ($\delta = \eps/k$)`, R`<u>$|f'| \le k$</u> ⇒ $k$-lipschitzienne (accroissements finis)`, R`$\sqrt{\cdot}$ : UC sur $\R_+$ ($|\sqrt x - \sqrt y| \le \sqrt{|x - y|}$), pas lipschitzienne`] },
    { k: 'thm', t: 'Heine', prio: true,
      hyp: R`$f$ continue sur un <u>segment</u> $[a, b]$`,
      concl: [R`$f$ uniformément continue sur $[a, b]$`],
      b: R`Faux sur $]0, 1]$ ($\frac1x$) ou sur $\R$ ($x^2$).` },
    { k: 'prop', t: 'Réfuter l’uniforme continuité',
      hyp: R`$x_n - y_n \to 0$ et <u>$f(x_n) - f(y_n) \not\to 0$</u>`,
      concl: [R`$f$ n'est pas UC`] },
    { part: '2. Intégrale de Riemann' },
    { k: 'def', t: 'Fonction intégrable',
      concl: [R`$\forall \eps$, $\exists \varphi \le f \le \psi$ en escalier, $\int(\psi - \varphi) \le \eps$`, R`$\int f = \sup\int\varphi = \inf\int\psi$`] },
    { k: 'thm', t: 'Fonctions intégrables',
      concl: [R`<u>continues</u>, monotones, continues par morceaux sur $[a, b]$`],
      b: R`Contre-exemple : indicatrice de $\Q$ (Dirichlet).` },
    { k: 'prop', t: 'Majorations',
      concl: [R`$\left|\int_a^b f\right| \le \int_a^b|f| \le (b - a)\sup|f|$`] },
    { part: '3. Sommes de Riemann' },
    { k: 'thm', t: 'Convergence', prio: true,
      hyp: R`$f$ <u>continue</u> sur $[a, b]$`,
      concl: [R`$\frac{b-a}{n}\sum_{k=0}^{n-1}f\left(a + k\frac{b-a}{n}\right) \to \int_a^b f$`, R`$\frac1n\sum_{k=1}^n f\left(\frac kn\right) \to \int_0^1 f$`] },
    { k: 'meth', t: 'Limite d’une somme',
      concl: [R`Mettre <u>$\frac1n$ en facteur</u>, faire apparaître $\frac kn$`, R`Reconnaître $f$, vérifier sa continuité, calculer $\int_0^1 f$`] },
    { k: 'form', t: 'Classiques',
      concl: [R`$\sum_{k=1}^n\frac{1}{n+k} \to \ln 2$`, R`$\sum_{k=1}^n\frac{n}{n^2+k^2} \to \frac\pi4$`, R`$\frac{1}{n^{p+1}}\sum_{k=1}^n k^p \to \frac{1}{p+1}$`] },
    { part: '4. Méthodes numériques' },
    { k: 'form', t: 'Erreurs', prio: true,
      concl: [R`Rectangles : $\le \frac{M_1(b-a)^2}{2n}$ (<u>ordre 1</u>)`, R`Point milieu : $\le \frac{M_2(b-a)^3}{24n^2}$ (<u>ordre 2</u>)`, R`Trapèzes : $\le \frac{M_2(b-a)^3}{12n^2}$ (ordre 2)`],
      b: R`$M_1 = \sup|f'|$, $M_2 = \sup|f''|$.` },
    { k: 'warn', t: 'Pièges',
      concl: [R`Heine exige un segment <u>fermé et borné</u>`, R`Somme de Riemann : vérifier la <u>continuité</u> sur tout $[0, 1]$`, R`Indices : $k = 0..n-1$ (gauche) ou $1..n$ (droite), même limite`] }
  ];

  /* ------------------------------------------------------------------ */
  /* Exercices                                                           */
  /* ------------------------------------------------------------------ */
  const exercices = [
    {
      id: 'uc-carre', title: 'Le carré : uniformément continu ou non ?', diff: 1, gen: 'uc',
      enonce: R`<p>Soit $f(x) = x^2$.</p><ol><li>Montrer que $f$ est uniformément continue sur $[0, A]$ pour tout $A \gt 0$, en donnant un $\delta$ explicite.</li><li>Montrer que $f$ n'est pas uniformément continue sur $[0, +\infty[$.</li></ol>`,
      correction: R`<p>1. $|x^2 - y^2| = |x + y|\,|x - y| \le 2A|x - y|$ sur $[0, A]$ : $f$ est $2A$-lipschitzienne, et $\delta = \frac{\eps}{2A}$ convient.</p>
        <p>2. $x_n = n + \frac1n$, $y_n = n$ : $x_n - y_n \to 0$ mais $x_n^2 - y_n^2 = 2 + \frac1{n^2} \ge 2$. Pas d'uniforme continuité.</p>`,
      detail: {
        but: R`<p>Montrer l'uniforme continuité de $x^2$ sur un segment, et son échec sur $[0, +\infty[$.</p>`,
        methode: R`<p>Sur un segment : majorer $|f(x) - f(y)|$ par $k|x - y|$. Sur $[0, +\infty[$ : critère séquentiel avec deux suites de plus en plus proches.</p>`,
        etapes: [
          R`<b>Factoriser.</b> $x^2 - y^2 = (x + y)(x - y)$.`,
          R`<b>Majorer sur $[0, A]$.</b> $0 \le x + y \le 2A$, donc $|x^2 - y^2| \le 2A|x - y|$.`,
          R`<b>Choisir $\delta$.</b> Pour $\eps \gt 0$, $\delta = \frac{\eps}{2A}$ : si $|x - y| \le \delta$, alors $|x^2 - y^2| \le 2A\delta = \eps$. Ce $\delta$ ne dépend que de $\eps$ (et de $A$), pas de $x$ : c'est l'uniforme continuité.`,
          R`<b>Pourquoi ça casse sur $[0, +\infty[$.</b> Le facteur $x + y$ n'est plus borné : plus on va loin, plus la pente est forte.`,
          R`<b>Suites.</b> $x_n = n + \frac1n$, $y_n = n$ : $x_n - y_n = \frac1n \to 0$ mais $x_n^2 - y_n^2 = 2 + \frac1{n^2} \ge 2$ ne tend pas vers 0.`
        ],
        retenir: R`<p>Sur un segment, toute fonction continue est uniformément continue (Heine) ; sur un intervalle non borné, il faut regarder la croissance de la pente.</p>`
      }
    },
    {
      id: 'racine', title: 'La racine carrée', diff: 2, gen: 'uc',
      enonce: R`<p>1. Montrer que pour $x \ge y \ge 0$, $\sqrt x - \sqrt y \le \sqrt{x - y}$. En déduire que $\sqrt{\cdot}$ est uniformément continue sur $[0, +\infty[$.</p><p>2. Est-elle lipschitzienne sur $[0, +\infty[$ ? sur $[1, +\infty[$ ?</p>`,
      correction: R`<p>1. $(\sqrt y + \sqrt{x - y})^2 = x + 2\sqrt{y(x - y)} \ge x$, d'où $\sqrt x \le \sqrt y + \sqrt{x - y}$. Ainsi $|\sqrt x - \sqrt y| \le \sqrt{|x - y|}$ et $\delta = \eps^2$ convient.</p>
        <p>2. Sur $[0, +\infty[$ : $\frac{\sqrt x}{x} = \frac1{\sqrt x} \to +\infty$ en $0^+$, pas lipschitzienne. Sur $[1, +\infty[$ : $\left|\frac{1}{2\sqrt x}\right| \le \frac12$, elle est $\frac12$-lipschitzienne.</p>`,
      detail: {
        but: R`<p>Exemple de fonction uniformément continue mais pas lipschitzienne.</p>`,
        methode: R`<p>Une inégalité directe $|f(x) - f(y)| \le \omega(|x - y|)$ avec $\omega(u) \to 0$ quand $u \to 0$ suffit pour l'uniforme continuité.</p>`,
        etapes: [
          R`<b>Inégalité.</b> Pour $x \ge y \ge 0$ : $(\sqrt y + \sqrt{x-y})^2 = y + 2\sqrt{y(x-y)} + x - y \ge x$ ; les deux membres étant positifs, $\sqrt y + \sqrt{x - y} \ge \sqrt x$.`,
          R`<b>Conséquence.</b> $|\sqrt x - \sqrt y| \le \sqrt{|x - y|}$ pour tous $x, y \ge 0$ (échanger les rôles si $y \gt x$).`,
          R`<b>$\delta$.</b> Pour $\eps \gt 0$, $\delta = \eps^2$ : $|x - y| \le \eps^2 \Rightarrow |\sqrt x - \sqrt y| \le \eps$.`,
          R`<b>Pas lipschitzienne sur $[0, +\infty[$.</b> Avec $y = 0$ : $\frac{|\sqrt x - 0|}{|x - 0|} = \frac{1}{\sqrt x}$, non borné quand $x \to 0^+$. Aucune constante $k$ ne vérifie $\sqrt x \le kx$ pour tout $x \gt 0$.`,
          R`<b>Lipschitzienne sur $[1, +\infty[$.</b> La dérivée $\frac{1}{2\sqrt x}$ y est majorée par $\frac12$ : accroissements finis.`
        ],
        retenir: R`<p>Lipschitzienne ⇒ uniformément continue ⇒ continue ; aucune réciproque n'est vraie.</p>`
      }
    },
    {
      id: 'heine', title: 'Heine en action', diff: 2, gen: 'uc',
      enonce: R`<p>Soit $f(x) = x\sin\frac1x$ pour $x \in ]0, 1]$ et $f(0) = 0$.</p><ol><li>Montrer que $f$ est uniformément continue sur $[0, 1]$.</li><li>Montrer que $g(x) = \sin\frac1x$ n'est pas uniformément continue sur $]0, 1]$.</li></ol>`,
      correction: R`<p>1. $f$ est continue sur $]0, 1]$, et en 0 : $|f(x)| \le |x| \to 0 = f(0)$. Continue sur le segment $[0, 1]$, elle y est uniformément continue (Heine).</p>
        <p>2. $x_n = \frac{1}{2n\pi + \pi/2}$ et $y_n = \frac{1}{2n\pi}$ : $x_n - y_n \to 0$, mais $g(x_n) - g(y_n) = 1 - 0 = 1$.</p>`,
      detail: {
        but: R`<p>Utiliser le théorème de Heine, puis le critère séquentiel.</p>`,
        methode: R`<p>Pour appliquer Heine, il faut une fonction <b>continue sur un segment</b> : on vérifie la continuité au bord problématique (0).</p>`,
        etapes: [
          R`<b>Continuité sur $]0, 1]$.</b> $x \mapsto \frac1x$ est continue, $\sin$ aussi, et le produit par $x$ aussi.`,
          R`<b>Continuité en 0.</b> $|f(x) - f(0)| = |x|\left|\sin\frac1x\right| \le |x| \to 0$ (gendarmes).`,
          R`<b>Heine.</b> $f$ est continue sur le segment $[0, 1]$ : elle y est uniformément continue, sans calcul de $\delta$.`,
          R`<b>Pour $g$ : points choisis.</b> $\sin\frac1{x_n} = \sin\left(2n\pi + \frac\pi2\right) = 1$ et $\sin\frac1{y_n} = \sin(2n\pi) = 0$.`,
          R`<b>Distance.</b> $x_n$ et $y_n$ tendent vers 0, donc $x_n - y_n \to 0$, alors que $g(x_n) - g(y_n) = 1$ : pas d'uniforme continuité.`,
          R`<b>Interprétation.</b> Près de 0, $g$ oscille entre $-1$ et $1$ de plus en plus vite ; $f$ oscille aussi, mais avec une amplitude $|x|$ qui s'écrase.`
        ],
        retenir: R`<p>Heine : continue sur un segment fermé borné ⇒ uniformément continue. Il suffit souvent de prouver la continuité aux bords.</p>`
      }
    },
    {
      id: 'bornee', title: 'Uniformément continue sur ]0, 1] ⇒ bornée', diff: 3, gen: 'uc',
      enonce: R`<p>Soit $f$ uniformément continue sur $]0, 1]$. Montrer que $f$ est bornée. En déduire que $\frac1x$ et $\ln$ ne sont pas uniformément continues sur $]0, 1]$.</p>`,
      indication: R`<p>Prendre $\eps = 1$, et relier $x$ à $1$ par $N$ petits pas de longueur au plus $\delta$.</p>`,
      correction: R`<p>Soit $\delta$ associé à $\eps = 1$ et $N$ entier avec $\frac1N \le \delta$. Pour $x \in ]0, 1]$, les points $x_j = x + j\frac{1 - x}{N}$ ($0 \le j \le N$) vont de $x$ à $1$ avec des pas $\le \frac1N \le \delta$, donc $|f(x_{j+1}) - f(x_j)| \le 1$ et $|f(x) - f(1)| \le N$. Ainsi $|f(x)| \le |f(1)| + N$ : $f$ est bornée. Comme $\frac1x$ et $\ln$ ne sont pas bornées sur $]0, 1]$, elles ne sont pas uniformément continues.</p>`,
      detail: {
        but: R`<p>Montrer qu'une fonction uniformément continue sur $]0, 1]$ est bornée.</p>`,
        methode: R`<p>Fixer $\eps = 1$ dans la définition, puis « marcher » de $x$ vers 1 par petits pas : l'écart total est au plus le nombre de pas.</p>`,
        etapes: [
          R`<b>Un $\delta$ pour $\eps = 1$.</b> Il existe $\delta \gt 0$ tel que $|u - v| \le \delta \Rightarrow |f(u) - f(v)| \le 1$, pour tous $u, v \in ]0, 1]$.`,
          R`<b>Nombre de pas.</b> On choisit un entier $N \ge \frac1\delta$ ; il ne dépend pas de $x$.`,
          R`<b>Chemin de $x$ à 1.</b> $x_j = x + j\frac{1 - x}{N}$ pour $j = 0, \dots, N$ : $x_0 = x$, $x_N = 1$, et deux points consécutifs sont à distance $\frac{1 - x}{N} \le \frac1N \le \delta$.`,
          R`<b>Inégalité triangulaire.</b> $|f(x) - f(1)| \le \sum_{j=0}^{N-1}|f(x_{j+1}) - f(x_j)| \le N$.`,
          R`<b>Conclusion.</b> $|f(x)| \le |f(1)| + N$ pour tout $x \in ]0, 1]$ : $f$ est bornée.`,
          R`<b>Application.</b> $\frac1x \to +\infty$ et $\ln x \to -\infty$ en $0^+$ : non bornées, donc non uniformément continues sur $]0, 1]$ (contraposée).`
        ],
        retenir: R`<p>Sur un intervalle borné, uniformément continue ⇒ bornée (et même prolongeable par continuité aux bords).</p>`
      }
    },
    {
      id: 'limites-sommes', title: 'Limites de sommes', diff: 1, gen: 'sommes',
      enonce: R`<p>Déterminer les limites de $\displaystyle\sum_{k=1}^n\frac{1}{n + k}$, $\displaystyle\sum_{k=1}^n\frac{n}{n^2 + k^2}$ et $\displaystyle\sum_{k=1}^n\frac{k}{n^2 + k^2}$.</p>`,
      correction: R`<p>On met $\frac1n$ en facteur : $\frac1n\sum f\left(\frac kn\right)$ avec $f(x) = \frac{1}{1 + x}$, $\frac{1}{1 + x^2}$, $\frac{x}{1 + x^2}$, continues sur $[0, 1]$. Limites : $\int_0^1\frac{\dd x}{1+x} = \ln 2$, $\int_0^1\frac{\dd x}{1+x^2} = \frac\pi4$, $\int_0^1\frac{x\dd x}{1+x^2} = \frac{\ln 2}{2}$.</p>`,
      detail: {
        but: R`<p>Reconnaître trois sommes de Riemann.</p>`,
        methode: R`<p>Faire apparaître $\frac1n f\left(\frac kn\right)$ en divisant numérateur et dénominateur par une puissance de $n$.</p>`,
        etapes: [
          R`<b>Première somme.</b> $\frac{1}{n + k} = \frac1n \cdot \frac{1}{1 + \frac kn}$ : $f(x) = \frac{1}{1 + x}$, et $\int_0^1\frac{\dd x}{1 + x} = [\ln(1 + x)]_0^1 = \ln 2 \approx 0{,}693$.`,
          R`<b>Deuxième somme.</b> On divise par $n^2$ : $\frac{n}{n^2 + k^2} = \frac1n \cdot \frac{1}{1 + (k/n)^2}$, $f(x) = \frac{1}{1 + x^2}$, et $\int_0^1 f = [\arctan x]_0^1 = \frac\pi4$.`,
          R`<b>Troisième somme.</b> $\frac{k}{n^2 + k^2} = \frac1n \cdot \frac{k/n}{1 + (k/n)^2}$, $f(x) = \frac{x}{1 + x^2}$, et $\int_0^1 f = \left[\frac12\ln(1 + x^2)\right]_0^1 = \frac{\ln 2}{2}$.`,
          R`<b>Hypothèse.</b> Les trois fonctions sont continues sur $[0, 1]$ : le théorème des sommes de Riemann s'applique.`
        ],
        retenir: R`<p>Repérer le degré : diviser numérateur et dénominateur pour qu'il ne reste que $\frac1n$ et des $\frac kn$.</p>`
      }
    },
    {
      id: 'puissances', title: 'Sommes de puissances', diff: 2, gen: 'explicite',
      enonce: R`<p>1. Déterminer la limite de $\dfrac{1}{n^3}\displaystyle\sum_{k=1}^n k^2$ de deux façons : avec la formule $\sum_{k=1}^n k^2 = \frac{n(n+1)(2n+1)}{6}$, puis avec une somme de Riemann.</p><p>2. En déduire un équivalent de $\sum_{k=1}^n k^p$ pour $p \in \N$.</p>`,
      correction: R`<p>1. $\frac{n(n+1)(2n+1)}{6n^3} \to \frac{2}{6} = \frac13$ ; et $\frac1n\sum\left(\frac kn\right)^2 \to \int_0^1 x^2\dd x = \frac13$.</p><p>2. $\frac{1}{n^{p+1}}\sum k^p \to \int_0^1 x^p\dd x = \frac{1}{p+1}$, donc $\sum_{k=1}^n k^p \sim \frac{n^{p+1}}{p+1}$.</p>`,
      detail: {
        but: R`<p>Comparer un calcul exact et un calcul par somme de Riemann, puis généraliser.</p>`,
        methode: R`<p>Le théorème des sommes de Riemann donne la limite même quand on ne connaît pas de formule close pour la somme.</p>`,
        etapes: [
          R`<b>Avec la formule.</b> $\frac{1}{n^3} \cdot \frac{n(n+1)(2n+1)}{6} = \frac{(n+1)(2n+1)}{6n^2}$ ; termes dominants $\frac{2n^2}{6n^2} = \frac13$.`,
          R`<b>Avec Riemann.</b> $\frac{k^2}{n^3} = \frac1n\left(\frac kn\right)^2$ ; $f(x) = x^2$ est continue sur $[0, 1]$, donc la limite est $\int_0^1x^2\dd x = \frac13$.`,
          R`<b>Généralisation.</b> $\frac{k^p}{n^{p+1}} = \frac1n\left(\frac kn\right)^p$, d'où $\frac1{n^{p+1}}\sum_{k=1}^n k^p \to \int_0^1x^p\dd x = \frac1{p+1}$.`,
          R`<b>Équivalent.</b> Dire que $\frac{\sum k^p}{n^{p+1}/(p+1)} \to 1$, c'est exactement $\sum_{k=1}^n k^p \sim \frac{n^{p+1}}{p+1}$.`
        ],
        retenir: R`<p>$\sum_{k=1}^n k^p \sim \frac{n^{p+1}}{p+1}$ : l'analogue discret de $\int_0^n x^p\dd x$.</p>`
      }
    },
    {
      id: 'produit', title: 'Limite d’un produit', diff: 2, gen: 'sommes',
      enonce: R`<p>Déterminer la limite de $u_n = \left(\displaystyle\prod_{k=1}^n\left(1 + \frac kn\right)\right)^{1/n}$.</p>`,
      indication: R`<p>Passer au logarithme.</p>`,
      correction: R`<p>$\ln u_n = \frac1n\sum_{k=1}^n\ln\left(1 + \frac kn\right) \to \int_0^1\ln(1 + x)\dd x = \big[(1+x)\ln(1+x) - (1+x)\big]_0^1 = 2\ln 2 - 1$. Par continuité de l'exponentielle, $u_n \to e^{2\ln 2 - 1} = \frac4e \approx 1{,}47$.</p>`,
      detail: {
        but: R`<p>Calculer la limite d'une racine $n$-ième d'un produit.</p>`,
        methode: R`<p>Le logarithme transforme le produit en somme, et la racine $n$-ième en facteur $\frac1n$ : on obtient une somme de Riemann.</p>`,
        etapes: [
          R`<b>Logarithme.</b> Les facteurs sont $\gt 0$ : $\ln u_n = \frac1n\ln\prod_{k=1}^n\left(1 + \frac kn\right) = \frac1n\sum_{k=1}^n\ln\left(1 + \frac kn\right)$.`,
          R`<b>Somme de Riemann.</b> $f(x) = \ln(1 + x)$ est continue sur $[0, 1]$, donc $\ln u_n \to \int_0^1\ln(1 + x)\dd x$.`,
          R`<b>Primitive.</b> Par parties (ou en dérivant) : $\big((1+x)\ln(1+x) - (1+x)\big)' = \ln(1 + x) + 1 - 1 = \ln(1 + x)$.`,
          R`<b>Valeur.</b> $\big[(1+x)\ln(1+x) - (1+x)\big]_0^1 = (2\ln 2 - 2) - (0 - 1) = 2\ln 2 - 1$.`,
          R`<b>Retour à $u_n$.</b> $u_n = e^{\ln u_n}$ et l'exponentielle est continue : $u_n \to e^{2\ln 2 - 1} = \frac{e^{2\ln 2}}{e} = \frac4e$.`
        ],
        retenir: R`<p>Produit ou racine $n$-ième : passer au $\ln$ pour retrouver une somme.</p>`
      }
    },
    {
      id: 'exp-geom', title: 'Une somme géométrique', diff: 2, gen: 'explicite',
      enonce: R`<p>Calculer explicitement $S_n = \dfrac1n\displaystyle\sum_{k=0}^{n-1}e^{k/n}$, puis sa limite. Retrouver ainsi $\int_0^1 e^x\dd x$.</p>`,
      correction: R`<p>Somme géométrique de raison $q = e^{1/n} \neq 1$ : $S_n = \frac1n \cdot \frac{q^n - 1}{q - 1} = \frac{e - 1}{n\left(e^{1/n} - 1\right)}$. Comme $e^u - 1 \sim u$, $n(e^{1/n} - 1) \to 1$ et $S_n \to e - 1 = \int_0^1 e^x\dd x$.</p>`,
      detail: {
        but: R`<p>Calculer une somme de Riemann exactement, puis passer à la limite.</p>`,
        methode: R`<p>Reconnaître une somme géométrique, puis utiliser l'équivalent $e^u - 1 \sim u$ en 0.</p>`,
        etapes: [
          R`<b>Somme géométrique.</b> $e^{k/n} = q^k$ avec $q = e^{1/n} \neq 1$ : $\sum_{k=0}^{n-1}q^k = \frac{q^n - 1}{q - 1} = \frac{e - 1}{e^{1/n} - 1}$.`,
          R`<b>Expression de $S_n$.</b> $S_n = \frac{e - 1}{n\left(e^{1/n} - 1\right)}$.`,
          R`<b>Limite.</b> Avec $u = \frac1n \to 0$ : $\frac{e^u - 1}{u} \to 1$, donc $n(e^{1/n} - 1) \to 1$ et $S_n \to e - 1$.`,
          R`<b>Lien avec l'intégrale.</b> $S_n$ est la somme des rectangles à gauche pour $e^x$ sur $[0, 1]$ : on retrouve $\int_0^1e^x\dd x = e - 1$, ce que donne aussi la primitive.`
        ],
        retenir: R`<p>$n\left(e^{a/n} - 1\right) \to a$ : à connaître pour les sommes géométriques de Riemann.</p>`
      }
    },
    {
      id: 'erreur-rectangles', title: 'Erreur de la méthode des rectangles', diff: 2, gen: 'erreur',
      enonce: R`<p>Soit $f$ de classe $C^1$ sur $[a, b]$, $M_1 = \sup|f'|$ et $R_n = h\sum_{k=0}^{n-1}f(a + kh)$, $h = \frac{b-a}{n}$.</p><ol><li>Montrer que $|R_n - \int_a^b f| \le \frac{M_1(b-a)^2}{2n}$.</li><li>Pour $f(x) = e^x$ sur $[0, 1]$, quelle valeur de $n$ garantit une erreur au plus $10^{-3}$ ?</li><li>Ici, $R_n$ est-il une valeur approchée par défaut ou par excès ?</li></ol>`,
      correction: R`<p>1. Sur $[x_k, x_{k+1}]$, $|f(t) - f(x_k)| \le M_1(t - x_k)$, donc l'erreur sur ce morceau est au plus $M_1\frac{h^2}{2}$ ; il y a $n$ morceaux : $\frac{M_1nh^2}{2} = \frac{M_1(b-a)^2}{2n}$.</p>
        <p>2. $M_1 = e$, $b - a = 1$ : $\frac{e}{2n} \le 10^{-3} \iff n \ge 500e \approx 1359{,}1$, donc $n = 1360$.</p><p>3. $e^x$ est croissante : chaque rectangle à gauche est sous la courbe, $R_n \le I$ (valeur par défaut).</p>`,
      detail: {
        but: R`<p>Établir la majoration de l'erreur des rectangles et l'utiliser pour choisir $n$.</p>`,
        methode: R`<p>Découper l'erreur sur chaque sous-intervalle, majorer avec les accroissements finis, sommer.</p>`,
        etapes: [
          R`<b>Erreur sur un morceau.</b> $\int_{x_k}^{x_{k+1}}f(t)\dd t - hf(x_k) = \int_{x_k}^{x_{k+1}}\big(f(t) - f(x_k)\big)\dd t$.`,
          R`<b>Accroissements finis.</b> $|f(t) - f(x_k)| \le M_1|t - x_k| = M_1(t - x_k)$ pour $t \in [x_k, x_{k+1}]$.`,
          R`<b>Intégrer.</b> L'erreur sur le morceau est au plus $M_1\int_{x_k}^{x_{k+1}}(t - x_k)\dd t = M_1\frac{h^2}{2}$.`,
          R`<b>Sommer.</b> $n$ morceaux : $|R_n - I| \le nM_1\frac{h^2}{2} = M_1\frac{n}{2}\cdot\frac{(b-a)^2}{n^2} = \frac{M_1(b-a)^2}{2n}$.`,
          R`<b>Application.</b> $f' = e^x \le e$ sur $[0, 1]$ : $\frac{e}{2n} \le 10^{-3} \iff n \ge \frac{e}{2 \times 10^{-3}} = 500e \approx 1359{,}1$. On prend $n = 1360$.`,
          R`<b>Signe de l'erreur.</b> $f$ croissante : sur $[x_k, x_{k+1}]$, $f(x_k) \le f(t)$, donc chaque rectangle à gauche est sous la courbe et $R_n \le I$.`
        ],
        retenir: R`<p>Rectangles : erreur $\le \frac{M_1(b-a)^2}{2n}$ ; par défaut si $f$ croît (à gauche), par excès si elle décroît.</p>`
      }
    },
    {
      id: 'python-methodes', title: 'Comparer les méthodes en Python', diff: 2, gen: 'erreur',
      enonce: R`<p>Avec les fonctions Python du cours (rectangles, point milieu, trapèzes), on approche $\int_0^1\frac{4}{1 + x^2}\dd x = \pi$.</p><ol><li>Quelles erreurs obtient-on pour $n = 10, 20, 40$ ? Comment évoluent-elles quand $n$ double ?</li><li>Combien de sous-intervalles faut-il environ pour une erreur de $10^{-8}$ avec les trapèzes ? avec les rectangles ?</li></ol>`,
      correction: R`<p>1. Erreurs approchées : rectangles $0{,}098$ ; $0{,}050$ ; $0{,}025$ (divisées par 2) ; point milieu $8{,}3 \cdot 10^{-4}$ ; $2{,}1 \cdot 10^{-4}$ ; $5{,}2 \cdot 10^{-5}$ et trapèzes $-1{,}7 \cdot 10^{-3}$ ; $-4{,}2 \cdot 10^{-4}$ ; $-1{,}0 \cdot 10^{-4}$ (divisées par 4). Ordres 1, 2, 2.</p>
        <p>2. Trapèzes : erreur $\approx \frac{1}{6n^2} \le 10^{-8}$ pour $n \ge 4\,100$ environ. Rectangles : erreur $\approx \frac1n$, il faudrait $n \approx 10^8$.</p>`,
      detail: {
        but: R`<p>Observer numériquement l'ordre des méthodes et en tirer le coût d'une précision donnée.</p>`,
        methode: R`<p>Si l'erreur se comporte comme $\frac{C}{n^p}$, doubler $n$ la divise par $2^p$ : on lit $p$ sur le tableau.</p>`,
        etapes: [
          R`<b>Rectangles.</b> $R_n - T_n = \frac h2\big(f(0) - f(1)\big) = \frac{1}{n}$ ici ($f(0) = 4$, $f(1) = 2$), d'où $R_n - \pi \approx \frac1n$ : environ $0{,}098$, $0{,}050$, $0{,}025$. Divisée par 2 quand $n$ double : <b>ordre 1</b>.`,
          R`<b>Trapèzes.</b> Erreur $\approx \frac{h^2}{12}\big(f'(1) - f'(0)\big) = \frac{-2}{12n^2} = -\frac{1}{6n^2}$ : $-1{,}7 \cdot 10^{-3}$, $-4{,}2 \cdot 10^{-4}$, $-1{,}0 \cdot 10^{-4}$. Divisée par 4 : <b>ordre 2</b>.`,
          R`<b>Point milieu.</b> Erreur $\approx -\frac{h^2}{24}\big(f'(1) - f'(0)\big) = \frac{1}{12n^2}$, deux fois plus petite que les trapèzes et de signe opposé : <b>ordre 2</b>.`,
          R`<b>Trapèzes, $10^{-8}$.</b> $\frac{1}{6n^2} \le 10^{-8} \iff n^2 \ge \frac{10^8}{6} \iff n \ge 4\,083$ environ.`,
          R`<b>Rectangles, $10^{-8}$.</b> $\frac1n \le 10^{-8} \iff n \ge 10^8$ : cent millions d'évaluations, contre quelques milliers.`
        ],
        retenir: R`<p>Gagner un ordre de convergence change radicalement le coût d'une haute précision.</p>`
      }
    },
    {
      id: 'dirichlet', title: 'Une fonction non intégrable', diff: 2,
      enonce: R`<p>Soit $f$ définie sur $[0, 1]$ par $f(x) = 1$ si $x \in \Q$ et $f(x) = 0$ sinon. Montrer que $f$ n'est pas intégrable au sens de Riemann. Que valent ses sommes de Riemann à points rationnels ? à points irrationnels ?</p>`,
      correction: R`<p>Si $\varphi \le f$ est en escalier, sur chaque intervalle ouvert de sa subdivision il y a des irrationnels, où $f = 0$ : la valeur de $\varphi$ y est $\le 0$, donc $\int\varphi \le 0$. De même toute $\psi \ge f$ vaut $\ge 1$ sur chaque intervalle (il y a des rationnels), donc $\int\psi \ge 1$. Ainsi $\int(\psi - \varphi) \ge 1$ : pas intégrable. Les sommes de Riemann valent 1 avec des $\xi_k$ rationnels et 0 avec des $\xi_k$ irrationnels, quel que soit le pas.</p>`,
      detail: {
        but: R`<p>Montrer qu'une fonction bornée peut ne pas être intégrable.</p>`,
        methode: R`<p>Montrer qu'on ne peut pas encadrer $f$ par deux fonctions en escalier d'intégrales proches.</p>`,
        etapes: [
          R`<b>Densité.</b> Tout intervalle ouvert non vide contient des rationnels et des irrationnels.`,
          R`<b>Minorantes.</b> Soit $\varphi \le f$ en escalier, constante égale à $c_k$ sur $]x_k, x_{k+1}[$. En un irrationnel de cet intervalle, $c_k \le f = 0$. Donc $\int\varphi = \sum(x_{k+1} - x_k)c_k \le 0$.`,
          R`<b>Majorantes.</b> Soit $\psi \ge f$ en escalier, de valeur $d_k$ sur $]x_k, x_{k+1}[$. En un rationnel, $d_k \ge 1$. Donc $\int\psi \ge 1$.`,
          R`<b>Conclusion.</b> $\int(\psi - \varphi) \ge 1$ pour tout encadrement : la définition (avec $\eps \lt 1$) n'est jamais satisfaite.`,
          R`<b>Sommes de Riemann.</b> Avec des $\xi_k$ rationnels, $S = \sum(x_{k+1} - x_k) \times 1 = 1$ ; avec des $\xi_k$ irrationnels, $S = 0$. Deux limites différentes : cohérent avec la non-intégrabilité.`
        ],
        retenir: R`<p>Continue (ou monotone, ou continue par morceaux) ⇒ intégrable ; une fonction « partout discontinue » peut ne pas l'être.</p>`
      }
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiches méthodes                                                     */
  /* ------------------------------------------------------------------ */
  const methodes = [
    {
      title: 'Montrer qu’une fonction est uniformément continue', gen: 'uc',
      cas: R`« Montrer que $f$ est uniformément continue sur $I$ »`, debut: R`Segment ? → <b>Heine</b>. Sinon : <b>$|f'| \le k$</b> (lipschitzienne) ou une <b>majoration</b> $|f(x) - f(y)| \le \omega(|x - y|)$.`,
      quand: R`<p>Dès qu'on a besoin d'un $\delta$ valable partout (intégrabilité, sommes de Riemann, convergence uniforme).</p>`,
      etapes: [
        R`Si $I$ est un <b>segment</b> et $f$ continue : conclure par Heine.`,
        R`Sinon, si $f$ est dérivable : majorer $|f'|$ sur $I$ ; si $|f'| \le k$, $f$ est $k$-lipschitzienne.`,
        R`Sinon, chercher une inégalité directe (factorisation, quantité conjuguée, $|\sqrt x - \sqrt y| \le \sqrt{|x-y|}$).`,
        R`Donner le $\delta$ si l'énoncé le demande : $\delta = \frac\eps k$, $\delta = \eps^2$…`
      ],
      exemple: {
        enonce: R`<p>$f(x) = \frac{x}{1 + x^2}$ est-elle uniformément continue sur $\R$ ?</p>`,
        solution: R`<p>$f'(x) = \frac{1 - x^2}{(1+x^2)^2}$ et $|f'(x)| \le \frac{1 + x^2}{(1 + x^2)^2} \le 1$ : $f$ est 1-lipschitzienne, donc uniformément continue sur $\R$.</p>`
      },
      pieges: [R`Appliquer Heine sur un intervalle ouvert ou non borné.`]
    },
    {
      title: 'Montrer qu’une fonction n’est pas uniformément continue', gen: 'uc',
      cas: R`Pente qui explose (bord ouvert, $\pm\infty$) ou oscillations de plus en plus rapides`, debut: R`Trouver <b>$x_n - y_n \to 0$</b> avec <b>$f(x_n) - f(y_n) \not\to 0$</b>.`,
      etapes: [
        R`Repérer où ça « casse » : près d'un bord ouvert ($\frac1x$, $\ln$ en 0) ou à l'infini ($x^2$, $e^x$).`,
        R`Choisir des points de plus en plus proches dans cette zone : $n$ et $n + \frac1n$, $\frac1n$ et $\frac1{2n}$, $e^{-n}$ et $e^{-n-1}$…`,
        R`Pour des oscillations, prendre des points où $f$ vaut $1$ et $0$ (maxima et zéros).`,
        R`Calculer $f(x_n) - f(y_n)$ et constater qu'il ne tend pas vers 0.`
      ],
      exemple: {
        enonce: R`<p>$f(x) = \cos(x^2)$ sur $\R$.</p>`,
        solution: R`<p>$x_n = \sqrt{2n\pi + \pi}$, $y_n = \sqrt{2n\pi}$ : $x_n - y_n = \frac{\pi}{x_n + y_n} \to 0$ et $f(x_n) - f(y_n) = -1 - 1 = -2$.</p>`
      }
    },
    {
      title: 'Calculer la limite d’une somme', gen: 'sommes',
      cas: R`$\sum_{k=1}^n$ d'une expression où $k$ et $n$ apparaissent « au même degré »`, debut: R`<b>Mettre $\frac1n$ en facteur</b>, faire apparaître $f\left(\frac kn\right)$, puis $\int_0^1 f$.`,
      etapes: [
        R`Identifier la puissance de $n$ à mettre en facteur (diviser numérateur et dénominateur).`,
        R`Écrire le terme sous la forme $\frac1n f\left(\frac kn\right)$ et nommer $f$.`,
        R`Vérifier que $f$ est continue sur $[0, 1]$ (bornes comprises).`,
        R`Calculer $\int_0^1 f$ avec une primitive ; contrôler avec une valeur numérique.`
      ],
      exemple: {
        enonce: R`<p>$\lim\sum_{k=1}^n\frac{n}{(n + k)^2}$ ?</p>`,
        solution: R`<p>$\frac{n}{(n+k)^2} = \frac1n \cdot \frac{1}{(1 + k/n)^2}$ : limite $\int_0^1\frac{\dd x}{(1+x)^2} = \left[-\frac{1}{1+x}\right]_0^1 = \frac12$.</p>`
      },
      pieges: [R`Une somme jusqu'à $2n$ donne une intégrale sur $[0, 2]$.`, R`$f$ doit être continue sur tout $[0, 1]$.`]
    },
    {
      title: 'Limite d’un produit ou d’une racine n-ième', gen: 'sommes',
      cas: R`$\prod_{k=1}^n(\dots)$, $\left(\prod\dots\right)^{1/n}$, $\frac{\sqrt[n]{n!}}{n}$`, debut: R`<b>Passer au logarithme</b> : le produit devient une somme, la racine $n$-ième un facteur $\frac1n$.`,
      etapes: [
        R`Vérifier que les facteurs sont strictement positifs.`,
        R`Écrire $\ln u_n = \frac1n\sum\ln(\dots)$ et reconnaître une somme de Riemann.`,
        R`Calculer l'intégrale (souvent une intégration par parties pour $\ln$).`,
        R`Revenir à $u_n$ par l'exponentielle (continue).`
      ],
      exemple: {
        enonce: R`<p>$\lim\frac{\sqrt[n]{n!}}{n}$ ?</p>`,
        solution: R`<p>$\ln\frac{\sqrt[n]{n!}}{n} = \frac1n\sum_{k=1}^n\ln\frac kn \to \int_0^1\ln x\dd x = -1$ (intégrale convergente : le théorème s'étend ici car $\ln$ est monotone). Limite $\frac1e$.</p>`
      }
    },
    {
      title: 'Choisir n dans une méthode numérique', gen: 'erreur',
      cas: R`« Avec quelle précision ? », « combien de points pour une erreur $\le \eps$ ? »`, debut: R`Majorer <b>$|f'|$</b> (rectangles) ou <b>$|f''|$</b> (milieu, trapèzes), puis résoudre l'inéquation en $n$.`,
      etapes: [
        R`Calculer $M_1 = \sup|f'|$ ou $M_2 = \sup|f''|$ sur $[a, b]$.`,
        R`Écrire la borne : $\frac{M_1(b-a)^2}{2n}$, $\frac{M_2(b-a)^3}{24n^2}$ ou $\frac{M_2(b-a)^3}{12n^2}$.`,
        R`Résoudre « borne $\le \eps$ » et prendre le premier entier qui convient.`,
        R`Contrôler numériquement (doubler $n$ divise l'erreur par 2 ou 4).`
      ],
      exemple: {
        enonce: R`<p>Trapèzes pour $\int_0^1 e^{-x^2}\dd x$ à $10^{-4}$ près ?</p>`,
        solution: R`<p>$f''(x) = (4x^2 - 2)e^{-x^2}$, $|f''| \le 2$ sur $[0, 1]$ : $\frac{2}{12n^2} \le 10^{-4} \iff n \ge 41$.</p>`
      }
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche méthode : plan de travail et cas à reconnaître                */
  /* ------------------------------------------------------------------ */
  const plan = {
    etapes: [
      { titre: 'Identifier la question', faire: R`Continuité uniforme ? Limite d'une somme ou d'un produit ? Approximation numérique d'une intégrale ?`,
        questions: [R`L'intervalle est-il un <b>segment</b> (fermé et borné) ?`, R`La somme est-elle de la forme $\frac1n\sum f\left(\frac kn\right)$ ?`] },
      { titre: 'Choisir l’outil', faire: R`<b>Heine</b>, <b>lipschitzienne</b> ($|f'| \le k$), <b>critère séquentiel</b> ; <b>somme de Riemann</b> ; <b>bornes d'erreur</b> des méthodes numériques.` },
      { titre: 'Mettre en forme', faire: R`Majorer $|f(x) - f(y)|$ ; mettre $\frac1n$ en facteur et faire apparaître $\frac kn$ ; passer au $\ln$ pour un produit ; calculer $M_1$ ou $M_2$.` },
      { titre: 'Calculer', faire: R`Le $\delta$, l'intégrale (primitive), ou la valeur de $n$ (inéquation).` },
      { titre: 'Vérifier', faire: R`Continuité de $f$ sur le segment fermé ; valeur numérique (par exemple $S_{100}$) ; cohérence du signe de l'erreur.` }
    ]
  };
  const reperes = [
    { etape: 1, si: R`$f$ continue sur un segment $[a, b]$`, alors: R`<b>Heine</b> : uniformément continue, sans calcul.` },
    { etape: 1, si: R`Intervalle ouvert ($]0, 1]$) ou non borné ($\R$, $[0, +\infty[$)`, alors: R`L'uniforme continuité peut échouer : regarder la <b>pente</b> au bord ou à l'infini.` },
    { etape: 1, si: R`$\sum_{k=1}^n$ avec $k$ et $n$ au même degré`, alors: R`<b>Somme de Riemann</b>.`, ex: R`$\sum\frac{1}{n+k}$, $\sum\frac{n}{n^2+k^2}$.` },
    { etape: 2, si: R`$f$ dérivable avec $|f'| \le k$ sur $I$`, alors: R`$f$ est $k$-<b>lipschitzienne</b>, donc uniformément continue ($\delta = \frac\eps k$).` },
    { etape: 2, si: R`Une racine carrée près de 0`, alors: R`$|\sqrt x - \sqrt y| \le \sqrt{|x - y|}$ : uniformément continue, pas lipschitzienne.` },
    { etape: 2, si: R`Pente qui explose ($\frac1x$, $\ln$ en $0^+$ ; $x^2$, $e^x$ en $+\infty$)`, alors: R`<b>Suites</b> $x_n - y_n \to 0$ avec $f(x_n) - f(y_n) \not\to 0$.` },
    { etape: 2, si: R`Oscillations de plus en plus rapides ($\sin\frac1x$, $\sin x^2$)`, alors: R`Prendre des suites de <b>maxima</b> et de <b>zéros</b> de plus en plus proches.` },
    { etape: 3, si: R`$\frac{1}{n + ak}$, $\frac{n}{n^2 + k^2}$, $\frac{k^p}{n^{p+1}}$`, alors: R`Diviser par $n$ (ou $n^2$…) pour faire apparaître $\frac1n f\left(\frac kn\right)$.` },
    { etape: 3, si: R`Un produit $\prod$ ou une racine $n$-ième`, alors: R`<b>Logarithme</b> : $\ln u_n = \frac1n\sum\ln(\dots)$.` },
    { etape: 3, si: R`Somme de $k = 0$ à $n - 1$, ou jusqu'à $2n$`, alors: R`Même limite pour $0..n-1$ et $1..n$ ; jusqu'à $2n$ : $\frac1n\sum_{k=1}^{2n}f\left(\frac kn\right) \to \int_0^2 f$.` },
    { etape: 4, si: R`$\frac1n\sum e^{ak/n}$ ou $\frac1n\sum q^k$`, alors: R`Calcul exact par la <b>somme géométrique</b>, puis $n(e^{a/n} - 1) \to a$.` },
    { etape: 4, si: R`Une précision $\eps$ imposée`, alors: R`Résoudre $\frac{M_1(b-a)^2}{2n} \le \eps$ (rectangles) ou $\frac{M_2(b-a)^3}{12n^2} \le \eps$ (trapèzes).` },
    { etape: 5, si: R`Doubler $n$ divise l'erreur par 2 / par 4`, alors: R`Méthode d'<b>ordre 1</b> / d'<b>ordre 2</b>.` },
    { etape: 5, si: R`$f$ non continue (ou non bornée) en un point de $[0, 1]$`, alors: R`Le théorème ne s'applique pas tel quel : se méfier ($\frac1x$ en 0).` }
  ];

  L2.chapter('aai', 'riemann', {
    intro: R`<p>Ce chapitre fonde l'<strong>intégrale de Riemann</strong> : on approche l'aire sous une courbe par des rectangles. La notion clé est la <strong>continuité uniforme</strong> (théorème de Heine), qui garantit que les <strong>sommes de Riemann</strong> convergent vers l'intégrale. On en tire deux applications : calculer des limites de sommes, et les <strong>méthodes numériques</strong> d'intégration (rectangles, point milieu, trapèzes) avec le contrôle de leur erreur.</p>`,
    cours, fiche, exercices, methodes, generateurs, plan, reperes
  });
})();
