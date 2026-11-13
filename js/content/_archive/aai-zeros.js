/* Analyse et applications informatiques — Chapitre 2 : Résolution numérique de f(x) = 0 */
(function () {
  'use strict';
  const R = String.raw;
  const code = L2.code;
  const { dec, F } = ML;

  /* ------------------------------------------------------------------ */
  /* Générateurs                                                         */
  /* ------------------------------------------------------------------ */
  const NONCARRES = [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24, 26, 27, 28, 29, 30];
  const tableRow = cells => '<tr>' + cells.map(c => '<td>' + c + '</td>').join('') + '</tr>';

  const generateurs = {
    dichoN: {
      title: 'Nombre d’itérations de la dichotomie', diff: 1,
      make(r) {
        const a = r.int(-3, 3), L = r.pick([1, 1, 2, 3, 4, 5, 8, 10]), b = a + L;
        const k = r.int(2, 9);
        const ratio = L * Math.pow(10, k); // (b-a)/eps
        let n = 0; while (Math.pow(2, n) < ratio) n++;
        return {
          enonce: R`<p>On applique la méthode de dichotomie à une fonction continue $f$ sur $[${a}, ${b}]$ avec $f(${a})f(${b}) < 0$. Combien d'itérations faut-il au minimum pour obtenir un intervalle de longueur $\le 10^{-${k}}$ contenant une racine ?</p>`,
          indication: R`<p>Après $n$ itérations, la longueur de l'intervalle est $\dfrac{b - a}{2^n}$.</p>`,
          correction: R`<p>Après $n$ itérations, l'intervalle a pour longueur $\dfrac{${L}}{2^n}$. On veut $\dfrac{${L}}{2^n} \le 10^{-${k}}$, c'est-à-dire $2^n \ge ${L === 1 ? '' : L + R`\cdot`}10^{${k}}$, soit</p>
            $$n \ge \log_2\big(${L === 1 ? '' : L + R`\cdot`}10^{${k}}\big) = ${L === 1 ? '' : R`\log_2 ${L} + `}${k}\log_2 10 \approx ${dec(Math.log2(ratio), 2)}.$$
            <p>Il faut donc <strong>$n = ${n}$ itérations</strong> (vérification : $2^{${n - 1}} \approx ${dec(Math.pow(2, n - 1), 0)} < ${dec(ratio, 0)} \le 2^{${n}} \approx ${dec(Math.pow(2, n), 0)}$).</p>
            <p>Retenir : chaque itération apporte un bit, et environ $3{,}3$ itérations par chiffre décimal.</p>`
        };
      }
    },

    dichoPas: {
      title: 'Dichotomie à la main', diff: 2,
      make(r) {
        const type = r.pick(['carre', 'cube', 'poly']);
        let f, ftex, a, b, label;
        if (type === 'carre') {
          const c = r.pick(NONCARRES); a = Math.floor(Math.sqrt(c)); b = a + 1;
          f = x => x * x - c; ftex = R`x^2 - ${c}`; label = R`\sqrt{${c}}`;
        } else if (type === 'cube') {
          const c = r.pick([2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 20, 25, 30]); a = Math.floor(Math.cbrt(c) + 1e-9); b = a + 1;
          f = x => x * x * x - c; ftex = R`x^3 - ${c}`; label = R`\sqrt[3]{${c}}`;
        } else {
          let p, q;
          do {
            p = r.int(1, 4); q = r.int(1, 9);
            f = x => x * x * x + p * x - q;
            a = 0; while (f(a + 1) < 0) a++; b = a + 1;
          } while (f(b) === 0);
          ftex = R`x^3 + ${p === 1 ? '' : p}x - ${q}`; label = R`\alpha`;
        }
        const steps = 4;
        let lo = a, hi = b, rows = '';
        for (let i = 0; i < steps; i++) {
          const m = (lo + hi) / 2, fm = f(m);
          rows += tableRow([String(i + 1), dec(lo, 4), dec(hi, 4), dec(m, 4), dec(fm, 4), fm * f(lo) <= 0 ? R`$[a, c]$` : R`$[c, b]$`].map(x => x.startsWith('$') || x.startsWith('[') ? x : '$' + x + '$'));
          if (f(lo) * fm <= 0) hi = m; else lo = m;
        }
        return {
          enonce: R`<p>Soit $f(x) = ${ftex}$.</p><ol><li>Montrer que $f$ a une unique racine $${label}$ dans $[${a}, ${b}]$.</li><li>Effectuer ${steps} itérations de la dichotomie à partir de $[${a}, ${b}]$ et donner un encadrement de $${label}$.</li></ol>`,
          indication: R`<p>À chaque étape : $c = \frac{a+b}2$ ; si $f(a)f(c) \le 0$ on garde $[a, c]$, sinon $[c, b]$.</p>`,
          correction: R`<p>1. $f$ est continue et strictement croissante sur $[${a}, ${b}]$ (${type === 'poly' ? R`$f'(x) = 3x^2 + ${type === 'poly' ? ftex.match(/\+ (\d*)x/)[1] || 1 : ''} > 0$` : (type === 'carre' ? R`$f'(x) = 2x > 0$ sur $]0, +\infty[$` : R`$f'(x) = 3x^2 \ge 0$, nulle seulement en $0$`)}), avec $f(${a}) = ${dec(f(a), 0)} < 0$ et $f(${b}) = ${dec(f(b), 0)} > 0$. Par le théorème des valeurs intermédiaires (et la stricte monotonie), $f$ s'annule une unique fois sur $[${a}, ${b}]$.</p>
            <p>2. Tableau des itérations ($c$ = milieu) :</p>
            <table class="t"><tr><th>$n$</th><th>$a$</th><th>$b$</th><th>$c$</th><th>$f(c)$</th><th>on garde</th></tr>${rows}</table>
            <p>Conclusion : $${dec(lo, 4)} \le ${label} \le ${dec(hi, 4)}$ (intervalle de longueur $1/2^{${steps}} = ${dec(1 / Math.pow(2, steps), 4)}$). ${type !== 'poly' ? R`Valeur exacte : $${label} \approx ${dec(type === 'carre' ? Math.sqrt(-f(0)) : Math.cbrt(-f(0)), 6)}$.` : ''}</p>`
        };
      }
    },

    newton: {
      title: 'Itérations de Newton', diff: 2,
      make(r) {
        const cube = r.chance(0.35);
        const c = cube ? r.pick([2, 3, 5, 7, 10, 20]) : r.pick(NONCARRES);
        const root = cube ? Math.cbrt(c) : Math.sqrt(c);
        const x0 = Math.ceil(root);
        const g = cube ? x => (2 * x + c / (x * x)) / 3 : x => (x + c / x) / 2;
        const xs = [x0];
        for (let i = 0; i < 4; i++) xs.push(g(xs[i]));
        const ok = x => { const e = Math.abs(x - root); return e === 0 ? 15 : Math.max(0, Math.floor(-Math.log10(e / Math.max(1, root)))); };
        const ftex = cube ? R`x^3 - ${c}` : R`x^2 - ${c}`;
        const iter = cube ? R`x_{n+1} = x_n - \frac{x_n^3 - ${c}}{3x_n^2} = \frac{1}{3}\left(2x_n + \frac{${c}}{x_n^2}\right)` : R`x_{n+1} = x_n - \frac{x_n^2 - ${c}}{2x_n} = \frac12\left(x_n + \frac{${c}}{x_n}\right)`;
        let rows = '';
        xs.forEach((x, i) => { rows += tableRow(['$' + i + '$', '$' + dec(x, 12) + '$', '$' + dec(Math.abs(x - root), 12) + '$']); });
        return {
          enonce: R`<p>On cherche $${cube ? R`\sqrt[3]{${c}}` : R`\sqrt{${c}}`}$ en appliquant la méthode de Newton à $f(x) = ${ftex}$.</p><ol><li>Écrire la relation de récurrence de la méthode.</li><li>Calculer $x_1, \dots, x_4$ à partir de $x_0 = ${x0}$. Commenter la vitesse de convergence.</li></ol>`,
          indication: R`<p>$x_{n+1} = x_n - \dfrac{f(x_n)}{f'(x_n)}$.</p>`,
          correction: R`<p>1. $f'(x) = ${cube ? '3x^2' : '2x'}$, donc $\displaystyle ${iter}$.</p>
            <p>2. Valeur cherchée : $${dec(root, 12)}\ldots$</p>
            <table class="t"><tr><th>$n$</th><th>$x_n$</th><th>$|x_n - \alpha|$</th></tr>${rows}</table>
            <p>Le nombre de décimales exactes passe environ de ${ok(xs[1])} à ${ok(xs[2])} puis ${ok(xs[3])} : il <strong>double à chaque itération</strong> (au moins tant qu'on ne bute pas sur la précision des flottants, environ 16 chiffres). C'est la convergence quadratique : $|x_{n+1} - \alpha| \le C|x_n - \alpha|^2$.</p>
            <p>De plus $f$ est convexe et croissante sur $]0, +\infty[$ et $f(x_0) > 0$ : la suite est décroissante, minorée par $\alpha$ (théorème de convergence monotone de Newton).</p>`
        };
      }
    },

    pointFixe: {
      title: 'Convergence d’un point fixe', diff: 2,
      make(r) {
        const c = r.pick([2, 3, 5, 6, 7, 10]);
        const lam = r.pick([F(1), F(1, 2), F(1, 3), F(1, 4), F(1, 5), F(1, 6), F(1, 8), F(1, 10)]);
        const alpha = Math.sqrt(c);
        const gp = 1 - 2 * lam.val() * alpha;
        const conv = Math.abs(gp) < 1;
        const g = x => x - lam.val() * (x * x - c);
        const x0 = Math.round(alpha);
        const xs = [x0];
        for (let i = 0; i < 5; i++) { const nx = g(xs[i]); xs.push(nx); if (!isFinite(nx) || Math.abs(nx) > 1e6) break; }
        const lt = lam.isOne() ? '' : lam.tex();
        let rows = '';
        xs.forEach((x, i) => { rows += tableRow(['$' + i + '$', '$' + (Math.abs(x) > 1e5 ? dec(x, 0) : dec(x, 8)) + '$']); });
        return {
          enonce: R`<p>Pour approcher $\alpha = \sqrt{${c}}$, on considère la suite $x_{n+1} = g(x_n)$ avec $g(x) = x - ${lt}(x^2 - ${c})$.</p><ol><li>Vérifier que $\alpha$ est un point fixe de $g$.</li><li>Calculer $g'(\alpha)$. Le point fixe est-il attractif ou répulsif ?</li><li>Calculer quelques itérés à partir de $x_0 = ${x0}$.</li></ol>`,
          indication: R`<p>Si $|g'(\alpha)| < 1$, la suite converge vers $\alpha$ pour $x_0$ assez proche ; si $|g'(\alpha)| > 1$, elle ne peut pas converger vers $\alpha$ (sauf si elle l'atteint exactement).</p>`,
          correction: R`<p>1. $g(\alpha) = \alpha - ${lt}(\alpha^2 - ${c}) = \alpha$ car $\alpha^2 = ${c}$.</p>
            <p>2. $g'(x) = 1 - ${lam.isOne() ? '2' : lam.mul(2).tex()}x$, donc $g'(\alpha) = 1 - ${lam.isOne() ? '2' : lam.mul(2).tex()}\sqrt{${c}} \approx ${dec(gp, 4)}$.</p>
            <p>${conv ? R`$|g'(\alpha)| < 1$ : le point fixe est <strong>attractif</strong>. La convergence est linéaire, de taux environ $${dec(Math.abs(gp), 3)}$ : l'erreur est multipliée par ce facteur à chaque étape${Math.abs(gp) < 0.1 ? ' (très rapide ici)' : ''}.` : R`$|g'(\alpha)| > 1$ : le point fixe est <strong>répulsif</strong> ; la suite ne converge pas vers $\alpha$ (l'erreur est amplifiée).`}</p>
            <p>3. Itérés :</p><table class="t"><tr><th>$n$</th><th>$x_n$</th></tr>${rows}</table>
            <p>Remarque : le meilleur choix est $\lambda = \frac{1}{2\sqrt{${c}}}$ (qui annule $g'(\alpha)$) ; en remplaçant $\sqrt{${c}}$ par $x_n$, on retrouve exactement la méthode de Newton.</p>`
        };
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Cours                                                               */
  /* ------------------------------------------------------------------ */
  const cours = [
    { t: 'h', title: 'Position du problème' },
    { t: 'p', body: R`<p>On cherche à approcher les solutions de $f(x) = 0$ lorsqu'aucune formule explicite n'existe (par exemple $x^5 - x - 1 = 0$ ou $\cos x = x$). Une méthode itérative construit une suite $(x_n)$ qui converge vers une racine $\alpha$ ; on l'arrête quand la précision souhaitée est atteinte.</p>` },
    { t: 'thm', title: 'séparation des racines', body: R`<p>Si $f$ est continue et <strong>strictement monotone</strong> sur $[a, b]$ avec $f(a)f(b) < 0$, alors $f$ admet une <strong>unique</strong> racine dans $]a, b[$.</p>`,
      proof: R`<p>Existence : théorème des valeurs intermédiaires ($0$ est compris strictement entre $f(a)$ et $f(b)$). Unicité : une fonction strictement monotone est injective.</p>` },
    { t: 'def', title: 'ordre de convergence', body: R`<p>Soit $(x_n)$ convergeant vers $\alpha$, avec $e_n = |x_n - \alpha|$. La convergence est</p>
      <ul><li><strong>linéaire</strong> (de taux $k \in\, ]0, 1[$) si $e_{n+1} \le k\,e_n$ à partir d'un certain rang ;</li>
      <li><strong>d'ordre $p > 1$</strong> si $e_{n+1} \le C\,e_n^p$ ; pour $p = 2$, on parle de convergence <strong>quadratique</strong>.</li></ul>
      <p>En convergence linéaire, on gagne un nombre fixe de chiffres par itération ; en convergence quadratique, le nombre de chiffres exacts double environ à chaque itération.</p>` },

    { t: 'h', title: 'Méthode de dichotomie' },
    { t: 'algo', title: 'dichotomie', body: R`<p>On suppose $f$ continue sur $[a, b]$ avec $f(a)f(b) \le 0$. On pose $a_0 = a$, $b_0 = b$ et, pour $n \ge 0$, $c_n = \frac{a_n + b_n}{2}$ :</p>
      <ul><li>si $f(a_n)f(c_n) \le 0$ : $a_{n+1} = a_n$, $b_{n+1} = c_n$ ;</li><li>sinon : $a_{n+1} = c_n$, $b_{n+1} = b_n$.</li></ul>` + code(`def dichotomie(f, a, b, eps):
    """f continue sur [a, b] avec f(a) * f(b) <= 0.
    Renvoie une approximation d'une racine à eps près."""
    while b - a > 2 * eps:
        c = (a + b) / 2
        if f(a) * f(c) <= 0:
            b = c
        else:
            a = c
    return (a + b) / 2`) },
    { t: 'thm', title: 'convergence de la dichotomie', body: R`<p>Les suites $(a_n)$ et $(b_n)$ sont adjacentes et convergent vers une racine $\alpha$ de $f$, avec</p>
      $$b_n - a_n = \frac{b - a}{2^n}, \qquad |c_n - \alpha| \le \frac{b - a}{2^{n+1}}.$$
      <p>Pour garantir $|c_n - \alpha| \le \varepsilon$, il suffit que $n \ge \log_2\frac{b - a}{\varepsilon} - 1$.</p>`,
      proof: R`<p>Par construction $a_n \le a_{n+1} \le b_{n+1} \le b_n$ et $b_{n+1} - a_{n+1} = \frac{b_n - a_n}{2}$, d'où $b_n - a_n = \frac{b-a}{2^n} \to 0$ : les suites sont adjacentes, de limite commune $\alpha$. On montre par récurrence que $f(a_n)f(b_n) \le 0$ (c'est l'invariant de l'algorithme : si $f(a_n)f(c_n) > 0$, alors $f(c_n)$ a le signe de $f(a_n)$, donc $f(c_n)f(b_n) \le 0$). Par continuité, $f(\alpha)^2 = \lim f(a_n)f(b_n) \le 0$, donc $f(\alpha) = 0$. Enfin $\alpha \in [a_n, b_n]$ et $c_n$ est le milieu, d'où $|c_n - \alpha| \le \frac{b_n - a_n}{2}$.</p>` },
    { t: 'rem', body: R`<p>La dichotomie converge <strong>toujours</strong> (dès que $f$ est continue et change de signe) mais lentement : convergence linéaire de taux $\frac12$, soit un bit par itération ($\approx 3{,}3$ itérations par chiffre décimal). Elle sert souvent à obtenir un bon point de départ pour une méthode plus rapide.</p>` },

    { t: 'h', title: 'Méthode du point fixe' },
    { t: 'p', body: R`<p>On réécrit $f(x) = 0$ sous la forme équivalente $g(x) = x$ (par exemple $g(x) = x - \lambda f(x)$ avec $\lambda \neq 0$), puis on itère $x_{n+1} = g(x_n)$. Si $(x_n)$ converge vers $\ell$ et $g$ est continue, alors $g(\ell) = \ell$.</p>` },
    { t: 'def', body: R`<p>$g : I \to \R$ est <strong>$k$-lipschitzienne</strong> si $|g(x) - g(y)| \le k|x - y|$ pour tous $x, y \in I$. Elle est <strong>contractante</strong> si elle est $k$-lipschitzienne avec $k < 1$.</p>` },
    { t: 'lem', body: R`<p>Si $g$ est de classe $C^1$ sur un intervalle $I$ et $|g'(x)| \le k$ pour tout $x \in I$, alors $g$ est $k$-lipschitzienne sur $I$.</p>`,
      proof: R`<p>Inégalité des accroissements finis : $|g(x) - g(y)| \le \sup_I|g'|\cdot|x - y|$.</p>` },
    { t: 'thm', title: 'du point fixe', body: R`<p>Soit $I = [a, b]$ et $g : I \to I$ (c'est-à-dire $g(I) \subset I$) contractante de rapport $k < 1$. Alors :</p>
      <ol><li>$g$ admet un unique point fixe $\alpha \in I$ ;</li>
      <li>pour tout $x_0 \in I$, la suite $x_{n+1} = g(x_n)$ converge vers $\alpha$, et $|x_n - \alpha| \le k^n|x_0 - \alpha| \le k^n(b - a)$ ;</li>
      <li>(estimation a posteriori) $|x_n - \alpha| \le \dfrac{k}{1 - k}|x_n - x_{n-1}|$.</li></ol>`,
      proof: R`<p><strong>Existence.</strong> $h(x) = g(x) - x$ est continue, $h(a) = g(a) - a \ge 0$ et $h(b) = g(b) - b \le 0$ car $g(a), g(b) \in [a, b]$. Le TVI fournit $\alpha$ avec $h(\alpha) = 0$.</p>
      <p><strong>Unicité.</strong> Si $g(\alpha) = \alpha$ et $g(\beta) = \beta$ : $|\alpha - \beta| = |g(\alpha) - g(\beta)| \le k|\alpha - \beta|$, donc $(1 - k)|\alpha - \beta| \le 0$ et $\alpha = \beta$.</p>
      <p><strong>Convergence.</strong> $(x_n)$ est bien définie car $g(I) \subset I$, et $|x_{n+1} - \alpha| = |g(x_n) - g(\alpha)| \le k|x_n - \alpha|$, d'où par récurrence $|x_n - \alpha| \le k^n|x_0 - \alpha| \to 0$.</p>
      <p><strong>A posteriori.</strong> $|x_{n-1} - \alpha| \le |x_{n-1} - x_n| + |x_n - \alpha| \le |x_{n-1} - x_n| + k|x_{n-1} - \alpha|$, donc $|x_{n-1} - \alpha| \le \frac{|x_n - x_{n-1}|}{1-k}$ ; et $|x_n - \alpha| \le k|x_{n-1} - \alpha|$.</p>` },
    { t: 'cor', title: 'critère local', body: R`<p>Soit $g$ de classe $C^1$ au voisinage d'un point fixe $\alpha$.</p>
      <ul><li>Si $|g'(\alpha)| < 1$, $\alpha$ est <strong>attractif</strong> : il existe $h > 0$ tel que pour tout $x_0 \in [\alpha - h, \alpha + h]$, $x_n \to \alpha$.</li>
      <li>Si $|g'(\alpha)| > 1$, $\alpha$ est <strong>répulsif</strong> : aucune suite ne converge vers $\alpha$, sauf si elle est stationnaire en $\alpha$.</li></ul>`,
      proof: R`<p>Si $|g'(\alpha)| < 1$, soit $k \in\, ]|g'(\alpha)|, 1[$. Par continuité de $g'$, il existe $h > 0$ tel que $|g'| \le k$ sur $J = [\alpha - h, \alpha + h]$. Pour $x \in J$ : $|g(x) - \alpha| = |g(x) - g(\alpha)| \le k|x - \alpha| \le h$, donc $g(J) \subset J$, et on applique le théorème.</p>
      <p>Si $|g'(\alpha)| > 1$ et $x_n \to \alpha$ avec $x_n \neq \alpha$ : par le théorème des accroissements finis, $\frac{|x_{n+1} - \alpha|}{|x_n - \alpha|} = |g'(\xi_n)| \to |g'(\alpha)| > 1$, donc $|x_n - \alpha|$ finit par croître strictement, ce qui contredit $x_n \to \alpha$.</p>` },
    { t: 'ex', body: R`<p>$\cos x = x$ sur $[0, 1]$ : $g = \cos$ envoie $[0, 1]$ dans $[\cos 1, 1] \subset [0, 1]$, et $|g'(x)| = |\sin x| \le \sin 1 \approx 0{,}84 < 1$. Le théorème s'applique : la suite $x_{n+1} = \cos x_n$ converge vers l'unique solution $\alpha \approx 0{,}739085$, mais lentement (taux $|\sin\alpha| \approx 0{,}67$).</p>` },
    { t: 'rem', body: R`<p>Si $g'(\alpha) = 0$ et $g$ est $C^2$, la convergence est au moins quadratique : $|x_{n+1} - \alpha| = \frac{|g''(\xi)|}{2}|x_n - \alpha|^2$ (Taylor–Lagrange). C'est le principe de la méthode de Newton.</p>` },

    { t: 'h', title: 'Méthode de Newton' },
    { t: 'algo', title: 'Newton', body: R`<p>On suppose $f$ dérivable et $f'$ ne s'annulant pas. On remplace $f$ par sa <strong>tangente</strong> en $x_n$ et on prend pour $x_{n+1}$ le point où cette tangente coupe l'axe :</p>
      $$x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}.$$` + code(`def newton(f, fp, x0, eps, nmax=50):
    """fp est la dérivée de f. On s'arrête quand deux itérés sont proches."""
    x = x0
    for _ in range(nmax):
        x_new = x - f(x) / fp(x)
        if abs(x_new - x) < eps:
            return x_new
        x = x_new
    raise ValueError("pas de convergence")`) },
    { t: 'thm', title: 'convergence locale quadratique', body: R`<p>Soit $f$ de classe $C^2$ et $\alpha$ une racine <strong>simple</strong> ($f(\alpha) = 0$, $f'(\alpha) \neq 0$). Sur un intervalle $J = [\alpha - h, \alpha + h]$ où $|f'| \ge m > 0$ et $|f''| \le M$, on a pour $x_n \in J$ :</p>
      $$|x_{n+1} - \alpha| \le \frac{M}{2m}|x_n - \alpha|^2.$$
      <p>Par conséquent, si $x_0 \in J$ et $\frac{M}{2m}|x_0 - \alpha| < 1$, la suite converge vers $\alpha$ et la convergence est quadratique.</p>`,
      proof: R`<p>Formule de Taylor–Lagrange en $x_n$ : il existe $\xi$ entre $x_n$ et $\alpha$ tel que</p>
      $$0 = f(\alpha) = f(x_n) + f'(x_n)(\alpha - x_n) + \frac{f''(\xi)}{2}(\alpha - x_n)^2.$$
      <p>On divise par $f'(x_n)$ et on utilise $\frac{f(x_n)}{f'(x_n)} = x_n - x_{n+1}$ : $0 = x_n - x_{n+1} + \alpha - x_n + \frac{f''(\xi)}{2f'(x_n)}(\alpha - x_n)^2$, soit</p>
      $$x_{n+1} - \alpha = \frac{f''(\xi)}{2f'(x_n)}(x_n - \alpha)^2, \quad\text{d'où}\quad |x_{n+1} - \alpha| \le \frac{M}{2m}|x_n - \alpha|^2.$$
      <p>Posons $C = \frac{M}{2m}$ et $e_n = |x_n - \alpha|$. Si $Ce_0 < 1$, alors $Ce_{n+1} \le (Ce_n)^2$, donc $Ce_n \le (Ce_0)^{2^n} \to 0$ ; en particulier $e_{n+1} \le (Ce_n)e_n \le e_n$, ce qui garantit que $x_n$ reste dans $J$.</p>` },
    { t: 'thm', title: 'convergence monotone', body: R`<p>Soit $f$ de classe $C^2$ sur $[a, b]$ avec $f(a) < 0 < f(b)$, $f' > 0$ et $f'' > 0$ (croissante et convexe). Pour tout $x_0 \in [a, b]$ tel que $f(x_0) > 0$, la suite de Newton est <strong>décroissante</strong> et converge vers l'unique racine $\alpha$.</p>`,
      proof: R`<p>Montrons par récurrence que $x_n \ge \alpha$ (vrai pour $n = 0$ car $f(x_0) > 0$ et $f$ croissante). Si $x_n \ge \alpha$ : $f(x_n) \ge 0$ et $f'(x_n) > 0$ donc $x_{n+1} \le x_n$. Par convexité, le graphe est au-dessus de ses tangentes : $f(x_{n+1}) \ge f(x_n) + f'(x_n)(x_{n+1} - x_n) = 0$, donc $x_{n+1} \ge \alpha$. La suite est décroissante et minorée par $\alpha$ : elle converge vers $\ell \ge \alpha$, et en passant à la limite dans la récurrence ($f, f'$ continues, $f'(\ell) \neq 0$), $f(\ell) = 0$, donc $\ell = \alpha$.</p>` },
    { t: 'ex', title: 'méthode de Héron', body: R`<p>Pour $f(x) = x^2 - 2$ : $x_{n+1} = \frac12\left(x_n + \frac{2}{x_n}\right)$. Avec $x_0 = 2$ : $x_1 = 1{,}5$ ; $x_2 = 1{,}41\underline{6}666\ldots$ ; $x_3 = 1{,}414215686\ldots$ ; $x_4 = 1{,}41421356237469\ldots$, alors que $\sqrt2 = 1{,}41421356237310\ldots$ Les chiffres exacts : 1, 3, 6, 12 : ils doublent à chaque étape.</p>` },
    { t: 'warn', body: R`<p>Newton peut <strong>diverger</strong> si $x_0$ est mal choisi (tangente presque horizontale), et la convergence n'est que <strong>linéaire</strong> pour une racine multiple ($f'(\alpha) = 0$). Il faut aussi connaître $f'$ ; à défaut, la <strong>méthode de la sécante</strong> remplace $f'(x_n)$ par $\frac{f(x_n) - f(x_{n-1})}{x_n - x_{n-1}}$ (ordre $\frac{1 + \sqrt5}{2} \approx 1{,}618$).</p>` },

    { t: 'h', title: 'Comparaison et critères d’arrêt' },
    { t: 'meth', body: R`<table class="t"><tr><th>Méthode</th><th>Hypothèses</th><th>Convergence</th><th>Coût par itération</th></tr>
      <tr><td>Dichotomie</td><td>$f$ continue, changement de signe</td><td>toujours, linéaire ($\frac12$)</td><td>1 évaluation de $f$</td></tr>
      <tr><td>Point fixe</td><td>$g$ contractante, $g(I) \subset I$</td><td>linéaire ($|g'(\alpha)|$)</td><td>1 évaluation de $g$</td></tr>
      <tr><td>Newton</td><td>$f \in C^2$, racine simple, $x_0$ proche</td><td>locale, quadratique</td><td>$f$ et $f'$</td></tr></table>
      <p>Critères d'arrêt usuels : $|x_{n+1} - x_n| < \varepsilon$ (avec l'estimation a posteriori pour le point fixe), $|f(x_n)| < \varepsilon$, ou un nombre maximal d'itérations (toujours prévoir ce garde-fou).</p>` }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche                                                               */
  /* ------------------------------------------------------------------ */
  const fiche = [
    { k: 'thm', t: 'Existence et unicité', b: R`<p>$f$ continue strictement monotone sur $[a, b]$, $f(a)f(b) < 0$ $\Rightarrow$ racine unique.</p>` },
    { k: 'def', t: 'Ordre', b: R`<p>Linéaire : $e_{n+1} \le ke_n$ ($k < 1$). Quadratique : $e_{n+1} \le Ce_n^2$.</p>` },
    { k: 'form', t: 'Dichotomie', b: R`<p>$b_n - a_n = \frac{b - a}{2^n}$ ; $|c_n - \alpha| \le \frac{b - a}{2^{n+1}}$ ; $n \ge \log_2\frac{b - a}{\varepsilon}$ itérations pour un intervalle de longueur $\le \varepsilon$.</p>` },
    { k: 'thm', t: 'Point fixe', b: R`<p>$g(I) \subset I$, $|g'| \le k < 1$ sur $I$ $\Rightarrow$ point fixe unique, $|x_n - \alpha| \le k^n|x_0 - \alpha|$, $|x_n - \alpha| \le \frac{k}{1-k}|x_n - x_{n-1}|$.</p>` },
    { k: 'cor', t: 'Critère local', b: R`<p>$|g'(\alpha)| < 1$ attractif ; $|g'(\alpha)| > 1$ répulsif ; $g'(\alpha) = 0$ : convergence quadratique.</p>` },
    { k: 'form', t: 'Newton', b: R`$$x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}, \qquad |x_{n+1} - \alpha| \le \frac{M}{2m}|x_n - \alpha|^2$$` },
    { k: 'thm', t: 'Newton monotone', b: R`<p>$f' > 0$, $f'' > 0$, $f(x_0) > 0$ : $(x_n)$ décroît vers $\alpha$.</p>` },
    { k: 'form', t: 'Héron', b: R`<p>$\sqrt c$ : $x_{n+1} = \frac12\left(x_n + \frac c{x_n}\right)$.</p>` },
    { k: 'warn', t: 'Pièges', b: R`<p>Oublier $g(I) \subset I$. Newton : racine multiple (lent), $x_0$ éloigné (divergence), $f'(x_n) = 0$. Toujours un nombre max d'itérations.</p>` }
  ];

  /* ------------------------------------------------------------------ */
  /* Exercices                                                           */
  /* ------------------------------------------------------------------ */
  const exercices = [
    {
      id: 'dicho', title: 'Dichotomie sur un polynôme', diff: 1, gen: 'dichoPas',
      enonce: R`<p>Soit $f(x) = x^3 + x - 1$.</p><ol><li>Montrer que $f$ a une unique racine réelle $\alpha$, et que $\alpha \in [0, 1]$.</li><li>Faire 3 itérations de dichotomie sur $[0, 1]$.</li><li>Combien d'itérations faudrait-il pour connaître $\alpha$ à $10^{-6}$ près ?</li></ol>`,
      correction: R`<p>1. $f'(x) = 3x^2 + 1 > 0$ : $f$ est strictement croissante sur $\R$. $f(0) = -1 < 0$ et $f(1) = 1 > 0$ : unique racine, dans $]0, 1[$.</p>
        <p>2. $c_1 = 0{,}5$ : $f(0{,}5) = -0{,}375 < 0$, on garde $[0{,}5 ; 1]$. $c_2 = 0{,}75$ : $f(0{,}75) = 0{,}171875 > 0$, on garde $[0{,}5 ; 0{,}75]$. $c_3 = 0{,}625$ : $f(0{,}625) \approx -0{,}131 < 0$, on garde $[0{,}625 ; 0{,}75]$. Donc $0{,}625 \le \alpha \le 0{,}75$ (en fait $\alpha \approx 0{,}6823$).</p>
        <p>3. En prenant le milieu, $|c_n - \alpha| \le \frac{1}{2^{n+1}} \le 10^{-6}$ dès que $2^{n+1} \ge 10^6$, soit $n + 1 \ge 20$ ($2^{20} \approx 1{,}05\cdot10^6$) : $n = 19$ itérations.</p>`
    },
    {
      id: 'cos', title: 'Point fixe de cos', diff: 2, gen: 'pointFixe',
      enonce: R`<p>On étudie l'équation $\cos x = x$.</p><ol><li>Montrer que $\cos([0, 1]) \subset [0, 1]$ et que $\cos$ est contractante sur $[0, 1]$.</li><li>En déduire que l'équation a une unique solution $\alpha$ dans $[0, 1]$ et que $x_{n+1} = \cos x_n$ converge vers $\alpha$ pour tout $x_0 \in [0, 1]$.</li><li>Combien d'itérations garantissent une erreur $\le 10^{-6}$ à partir de $x_0 = 1$ ?</li></ol>`,
      correction: R`<p>1. $\cos$ est décroissante sur $[0, 1]$ : $\cos([0, 1]) = [\cos 1, 1] \approx [0{,}54 ; 1] \subset [0, 1]$. Sur $[0, 1]$, $|\cos'(x)| = \sin x \le \sin 1 = k \approx 0{,}8415 < 1$.</p>
        <p>2. Théorème du point fixe sur $I = [0, 1]$.</p>
        <p>3. $|x_n - \alpha| \le k^n|x_0 - \alpha| \le k^n$. On veut $k^n \le 10^{-6}$ : $n \ge \frac{6\ln 10}{-\ln k} \approx \frac{13{,}82}{0{,}1726} \approx 80{,}1$, donc $n = 81$ suffit. (En pratique le taux réel est $\sin\alpha \approx 0{,}67$, et une trentaine d'itérations suffisent ; l'estimation a posteriori permet de s'arrêter plus tôt.)</p>`
    },
    {
      id: 'heron', title: 'Racine carrée par Newton', diff: 1, gen: 'newton',
      enonce: R`<p>Soit $a > 0$. On applique Newton à $f(x) = x^2 - a$ à partir de $x_0 > \sqrt a$.</p><ol><li>Écrire la récurrence.</li><li>Montrer que $x_{n+1} - \sqrt a = \dfrac{(x_n - \sqrt a)^2}{2x_n}$. En déduire que $(x_n)$ décroît vers $\sqrt a$ et que la convergence est quadratique.</li></ol>`,
      correction: R`<p>1. $x_{n+1} = x_n - \frac{x_n^2 - a}{2x_n} = \frac12\left(x_n + \frac{a}{x_n}\right)$.</p>
        <p>2. $x_{n+1} - \sqrt a = \frac{x_n^2 + a - 2\sqrt a\,x_n}{2x_n} = \frac{(x_n - \sqrt a)^2}{2x_n}$. Par récurrence, si $x_n > 0$ alors $x_{n+1} \ge \sqrt a > 0$. Ensuite $x_{n+1} - x_n = \frac{a - x_n^2}{2x_n} \le 0$ dès que $x_n \ge \sqrt a$ : la suite décroît et est minorée par $\sqrt a$, donc converge vers $\ell > 0$ qui vérifie $\ell = \frac12(\ell + a/\ell)$, soit $\ell = \sqrt a$. Enfin $x_n \ge \sqrt a$ donne $|x_{n+1} - \sqrt a| \le \frac{1}{2\sqrt a}|x_n - \sqrt a|^2$ : convergence quadratique.</p>`
    },
    {
      id: 'inverse', title: 'Calculer 1/a sans division', diff: 2,
      enonce: R`<p>Soit $a > 0$. On applique la méthode de Newton à $f(x) = \frac1x - a$.</p><ol><li>Montrer que la récurrence s'écrit $x_{n+1} = x_n(2 - ax_n)$ (aucune division !).</li><li>On pose $e_n = 1 - ax_n$. Montrer que $e_{n+1} = e_n^2$.</li><li>En déduire que la suite converge vers $\frac1a$ si et seulement si $0 < x_0 < \frac2a$.</li></ol>`,
      correction: R`<p>1. $f'(x) = -\frac1{x^2}$, donc $x_{n+1} = x_n - \frac{1/x_n - a}{-1/x_n^2} = x_n + x_n^2\left(\frac1{x_n} - a\right) = 2x_n - ax_n^2 = x_n(2 - ax_n)$.</p>
        <p>2. $1 - ax_{n+1} = 1 - 2ax_n + a^2x_n^2 = (1 - ax_n)^2$.</p>
        <p>3. $e_n = e_0^{2^n}$ tend vers $0$ si et seulement si $|e_0| < 1$, c'est-à-dire $|1 - ax_0| < 1 \iff 0 < x_0 < \frac2a$. Alors $x_n = \frac{1 - e_n}{a} \to \frac1a$, avec convergence quadratique. (Cette méthode est utilisée dans certains processeurs pour calculer des inverses.)</p>`
    },
    {
      id: 'multiple', title: 'Newton et racine double', diff: 2,
      enonce: R`<p>On applique Newton à $f(x) = (x - 1)^2$ à partir de $x_0 = 2$.</p><ol><li>Calculer $x_{n+1} - 1$ en fonction de $x_n - 1$.</li><li>Quelle est la vitesse de convergence ? Pourquoi le théorème de convergence quadratique ne s'applique-t-il pas ?</li></ol>`,
      correction: R`<p>1. $x_{n+1} = x_n - \frac{(x_n - 1)^2}{2(x_n - 1)} = x_n - \frac{x_n - 1}{2}$, donc $x_{n+1} - 1 = \frac{x_n - 1}{2}$.</p>
        <p>2. $x_n - 1 = 2^{-n}$ : convergence seulement <strong>linéaire</strong> de taux $\frac12$ (pas mieux que la dichotomie). Le théorème suppose une racine simple ($f'(\alpha) \neq 0$), or ici $f'(1) = 0$.</p>`
    },
    {
      id: 'python', title: 'Programmer la dichotomie', diff: 1,
      enonce: R`<p>Écrire une fonction Python <code>dichotomie(f, a, b, eps)</code> qui renvoie une approximation à $\varepsilon$ près d'une racine de $f$ sur $[a, b]$ (on suppose $f(a)f(b) \le 0$), et qui renvoie aussi le nombre d'itérations effectuées. Comment éviter d'évaluer $f(a)$ à chaque tour ?</p>`,
      correction: code(`def dichotomie(f, a, b, eps):
    fa = f(a)
    n = 0
    while b - a > 2 * eps:
        c = (a + b) / 2
        fc = f(c)
        if fa * fc <= 0:
            b = c
        else:
            a, fa = c, fc     # on mémorise f au nouveau bord gauche
        n += 1
    return (a + b) / 2, n

import math
print(dichotomie(lambda x: x**3 + x - 1, 0, 1, 1e-6))`) + R`<p>On stocke $f(a)$ dans une variable et on ne la met à jour que lorsque $a$ change : une seule évaluation de $f$ par itération. La boucle s'arrête quand l'intervalle est de longueur $\le 2\varepsilon$, de sorte que le milieu est à distance $\le \varepsilon$ de la racine.</p>`
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiches méthodes                                                     */
  /* ------------------------------------------------------------------ */
  const methodes = [
    {
      title: 'Localiser et séparer une racine', gen: 'dichoPas',
      quand: R`<p>Avant toute méthode numérique : on doit savoir <em>où</em> chercher et s'assurer qu'il n'y a qu'une racine dans l'intervalle.</p>`,
      etapes: [
        R`Étudier les variations de $f$ (signe de $f'$) et dresser le tableau de variations.`,
        R`Repérer les intervalles où $f$ est strictement monotone et change de signe.`,
        R`Conclure par le TVI + stricte monotonie : une racine unique par intervalle.`
      ],
      exemple: {
        enonce: R`<p>Combien de racines réelles pour $f(x) = x^3 - 3x + 1$ ? Les localiser.</p>`,
        solution: R`<p>$f'(x) = 3(x^2 - 1)$ : $f$ croît sur $]-\infty, -1]$, décroît sur $[-1, 1]$, croît sur $[1, +\infty[$. $f(-1) = 3 > 0$, $f(1) = -1 < 0$. Comme $f(-2) = -1 < 0$, $f(0) = 1$ et $f(2) = 3$ : trois racines, dans $]-2, -1[$, $]0, 1[$ et $]1, 2[$.</p>`
      }
    },
    {
      title: 'Nombre d’itérations de dichotomie', gen: 'dichoN',
      quand: R`<p>On demande combien d'itérations garantissent une précision $\varepsilon$.</p>`,
      etapes: [
        R`Écrire la longueur après $n$ itérations : $\frac{b - a}{2^n}$ (ou l'erreur sur le milieu : $\frac{b - a}{2^{n+1}}$, selon ce qu'on demande).`,
        R`Résoudre l'inégalité $\frac{b - a}{2^n} \le \varepsilon$ : $n \ge \log_2\frac{b - a}{\varepsilon} = \frac{\ln((b - a)/\varepsilon)}{\ln 2}$.`,
        R`Prendre le plus petit entier convenable (partie entière supérieure).`
      ],
      exemple: {
        enonce: R`<p>Sur $[1, 2]$, combien d'itérations pour un intervalle de longueur $\le 10^{-10}$ ?</p>`,
        solution: R`<p>$2^n \ge 10^{10}$ $\iff$ $n \ge 10\log_2 10 \approx 33{,}2$ : $n = 34$.</p>`
      },
      pieges: [R`Confondre longueur de l'intervalle et erreur sur le milieu (facteur 2).`]
    },
    {
      title: 'Étudier une méthode de point fixe', gen: 'pointFixe',
      quand: R`<p>On donne $g$ (ou on doit la construire) et on demande si $x_{n+1} = g(x_n)$ converge.</p>`,
      etapes: [
        R`Vérifier que $\alpha$ est point fixe : $g(\alpha) = \alpha \iff f(\alpha) = 0$.`,
        R`Trouver un intervalle $I$ <strong>stable</strong> : $g(I) \subset I$ (variations de $g$).`,
        R`Majorer $|g'|$ sur $I$ par $k < 1$ : $g$ est contractante.`,
        R`Appliquer le théorème : convergence, majoration $k^n|x_0 - \alpha|$, nombre d'itérations.`,
        R`Sans intervalle stable explicite : critère local $|g'(\alpha)| < 1$ (attractif) ou $> 1$ (répulsif).`
      ],
      exemple: {
        enonce: R`<p>Pour résoudre $x^3 + x - 1 = 0$, comparer $g_1(x) = 1 - x^3$ et $g_2(x) = \frac{1}{1 + x^2}$ (avec $\alpha \approx 0{,}68$).</p>`,
        solution: R`<p>$g_1'(\alpha) = -3\alpha^2 \approx -1{,}40$ : $|g_1'(\alpha)| > 1$, <strong>répulsif</strong>. $g_2'(x) = \frac{-2x}{(1 + x^2)^2}$, $|g_2'(\alpha)| \approx \frac{1{,}36}{2{,}14} \approx 0{,}64 < 1$ : <strong>attractif</strong>. (Et $g_2(x) = x \iff x + x^3 = 1$.)</p>`
      },
      pieges: [R`Oublier de vérifier $g(I) \subset I$ : la suite pourrait sortir de l'intervalle où $|g'| < 1$.`]
    },
    {
      title: 'Appliquer la méthode de Newton', gen: 'newton',
      quand: R`<p>$f$ est dérivable avec $f'$ connue, et on veut une convergence rapide.</p>`,
      etapes: [
        R`Calculer $f'$ et écrire $x_{n+1} = x_n - f(x_n)/f'(x_n)$ ; simplifier l'expression.`,
        R`Choisir $x_0$ proche de la racine (par exemple après quelques itérations de dichotomie) ou dans la zone de convergence monotone ($f(x_0)f''(x_0) > 0$).`,
        R`Calculer les itérés ; s'arrêter quand $|x_{n+1} - x_n| < \varepsilon$.`,
        R`Justifier la convergence : théorème monotone (convexité) ou local (racine simple).`
      ],
      exemple: {
        enonce: R`<p>Newton pour $f(x) = x^3 + x - 1$ à partir de $x_0 = 1$.</p>`,
        solution: R`<p>$x_{n+1} = x_n - \frac{x_n^3 + x_n - 1}{3x_n^2 + 1} = \frac{2x_n^3 + 1}{3x_n^2 + 1}$. $x_1 = 0{,}75$, $x_2 \approx 0{,}686047$, $x_3 \approx 0{,}682340$, $x_4 \approx 0{,}6823278$. Sur $[0, 1]$, $f' > 0$ et $f'' = 6x \ge 0$, $f(1) > 0$ : convergence décroissante.</p>`
      },
      pieges: [R`Démarrer près d'un point où $f'$ s'annule (tangente horizontale).`, R`Attendre une convergence quadratique pour une racine multiple.`]
    }
  ];

  L2.chapter('aai', 'zeros', {
    intro: R`<p>On étudie trois méthodes classiques pour approcher les zéros d'une fonction réelle : la dichotomie (robuste mais lente), le point fixe (cadre général) et Newton (très rapide mais locale). Chaque méthode est analysée (convergence, vitesse) puis programmée en Python.</p>`,
    cours, fiche, exercices, methodes, generateurs
  });
})();
