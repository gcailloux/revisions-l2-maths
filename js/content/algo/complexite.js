/* Algorithmique — Chapitre 1 : Bases et complexité */
(function () {
  'use strict';
  const R = String.raw;
  const code = L2.code;

  /* ------------------------------------------------------------------ */
  /* Générateurs                                                         */
  /* ------------------------------------------------------------------ */
  // Modèles de boucles : code Python, simulation exacte, explication, ordre de grandeur
  const BOUCLES = [
    {
      code: k => `c = 0
for i in range(n):
    for j in range(n):
        c = c + 1`,
      count: n => n * n,
      expl: () => R`La boucle interne fait $n$ tours pour chacune des $n$ valeurs de $i$ : $c = n \times n = n^2$.`,
      theta: R`\Theta(n^2)`
    },
    {
      code: k => `c = 0
for i in range(n):
    for j in range(i):
        c = c + 1`,
      count: n => n * (n - 1) / 2,
      expl: () => R`Pour $i$ fixé, la boucle interne fait $i$ tours : $c = \sum_{i=0}^{n-1} i = \dfrac{n(n-1)}{2}$.`,
      theta: R`\Theta(n^2)`
    },
    {
      code: k => `c = 0
for i in range(n):
    for j in range(i, n):
        c = c + 1`,
      count: n => n * (n + 1) / 2,
      expl: () => R`Pour $i$ fixé, $j$ prend $n - i$ valeurs : $c = \sum_{i=0}^{n-1}(n - i) = \sum_{m=1}^{n} m = \dfrac{n(n+1)}{2}$.`,
      theta: R`\Theta(n^2)`
    },
    {
      code: k => `c = 0
for i in range(0, n, ${k}):
    c = c + 1`,
      count: (n, k) => Math.ceil(n / k),
      expl: k => R`$i$ prend les valeurs $0, ${k}, ${2 * k}, \dots$ strictement inférieures à $n$ : il y en a $\lceil n/${k}\rceil$.`,
      theta: R`\Theta(n)`
    },
    {
      code: k => `c = 0
i = 1
while i < n:
    i = i * ${k}
    c = c + 1`,
      count: (n, k) => { let i = 1, c = 0; while (i < n) { i *= k; c++; } return c; },
      expl: k => R`Après $c$ tours, $i = ${k}^c$. La boucle s'arrête au premier $c$ tel que $${k}^c \ge n$, c'est-à-dire $c = \lceil \log_{${k}} n\rceil$.`,
      theta: R`\Theta(\log n)`
    },
    {
      code: k => `c = 0
i = n
while i > 0:
    i = i // ${k}
    c = c + 1`,
      count: (n, k) => { let i = n, c = 0; while (i > 0) { i = Math.floor(i / k); c++; } return c; },
      expl: k => R`Chaque tour divise $i$ par $${k}$ (division entière). Le nombre de tours est le nombre de chiffres de $n$ en base $${k}$ : $c = \lfloor\log_{${k}} n\rfloor + 1$.`,
      theta: R`\Theta(\log n)`
    },
    {
      code: k => `c = 0
for i in range(n):
    j = 1
    while j < n:
        j = 2 * j
        c = c + 1`,
      count: n => { let w = 0, j = 1; while (j < n) { j *= 2; w++; } return n * w; },
      expl: () => R`La boucle interne fait $\lceil\log_2 n\rceil$ tours (indépendamment de $i$), répétés $n$ fois : $c = n\lceil\log_2 n\rceil$.`,
      theta: R`\Theta(n\log n)`
    },
    {
      code: k => `c = 0
for i in range(n):
    for j in range(i):
        for k in range(j):
            c = c + 1`,
      count: n => n * (n - 1) * (n - 2) / 6,
      expl: () => R`On compte les triplets $0 \le k < j < i \le n-1$, c'est-à-dire les parties à 3 éléments de $\{0, \dots, n-1\}$ : $c = \binom n3 = \dfrac{n(n-1)(n-2)}{6}$.`,
      theta: R`\Theta(n^3)`
    },
    {
      code: k => `c = 0
i = 0
while i * i < n:
    i = i + 1
    c = c + 1`,
      count: n => { let i = 0, c = 0; while (i * i < n) { i++; c++; } return c; },
      expl: () => R`La boucle tourne tant que $i^2 < n$ : $c$ est le plus petit entier tel que $c^2 \ge n$, soit $c = \lceil\sqrt n\rceil$.`,
      theta: R`\Theta(\sqrt n)`
    },
    {
      code: k => `c = 0
for i in range(1, n + 1):
    for j in range(0, n, i):
        c = c + 1`,
      count: n => { let c = 0; for (let i = 1; i <= n; i++) c += Math.ceil(n / i); return c; },
      expl: () => R`Pour $i$ fixé, la boucle interne fait $\lceil n/i\rceil$ tours : $c = \sum_{i=1}^n\lceil n/i\rceil$, et $n H_n \le c \le n H_n + n$ avec $H_n = \sum_{i=1}^n \frac1i \sim \ln n$ (série harmonique).`,
      theta: R`\Theta(n\log n)`,
      diff: 3
    }
  ];

  const CROISSANCES = [
    { rank: 1, forms: [R`\log n`, R`\ln(n^3)`, R`\log_{10} n`], note: { 1: R`$\ln(n^3) = 3\ln n$`, 2: R`$\log_{10} n = \ln n/\ln 10$` } },
    { rank: 2, forms: [R`(\log n)^2`] },
    { rank: 3, forms: [R`\sqrt n`, R`n^{1/3}`] },
    { rank: 5, forms: [R`n`, R`\dfrac{n}{100}`] },
    { rank: 6, forms: [R`n\log n`, R`\log(n^n)`, R`\log(n!)`], note: { 1: R`$\log(n^n) = n\log n$`, 2: R`$\log(n!) = \Theta(n\log n)$` } },
    { rank: 7, forms: [R`n\sqrt n`] },
    { rank: 8, forms: [R`n^2`, R`(3n+1)^2`], note: { 1: R`$(3n+1)^2 \sim 9n^2$` } },
    { rank: 9, forms: [R`n^3`] },
    { rank: 10, forms: [R`2^n`, R`2^{n+3}`, R`4^{n/2}`], note: { 1: R`$2^{n+3} = 8\cdot 2^n$`, 2: R`$4^{n/2} = 2^n$` } },
    { rank: 11, forms: [R`3^n`] },
    { rank: 12, forms: [R`n!`] },
    { rank: 13, forms: [R`n^n`] }
  ];

  const TRACES = [
    {
      name: 'nb_chiffres', make(r) {
        const b = r.pick([2, 10, 10, 3]);
        const n = b === 10 ? r.int(1000, 999999) : r.int(20, 300);
        let c = 0, m = n; while (m > 0) { m = Math.floor(m / b); c++; }
        return {
          src: `def f(n):
    c = 0
    while n > 0:
        n = n // ${b}
        c = c + 1
    return c`,
          n, res: c,
          expl: R`À chaque tour, on supprime le dernier chiffre de l'écriture de $n$ en base $${b}$ : $f(n)$ est le <strong>nombre de chiffres</strong> de $n$ en base $${b}$, ici $f(${n}) = ${c}$${b === 2 ? R` (car $2^{${c - 1}} \le ${n} < 2^{${c}}$)` : ''}. Nombre de tours : $\lfloor\log_{${b}} n\rfloor + 1$, donc complexité $\Theta(\log n)$.`
        };
      }
    },
    {
      name: 'somme_chiffres', make(r) {
        const n = r.int(1000, 9999999);
        const s = String(n).split('').reduce((a, d) => a + Number(d), 0);
        return {
          src: `def f(n):
    s = 0
    while n > 0:
        s = s + n % 10
        n = n // 10
    return s`,
          n, res: s,
          expl: R`<code>n % 10</code> est le dernier chiffre de $n$ et <code>n // 10</code> le supprime : $f(n)$ est la <strong>somme des chiffres</strong> de $n$ en base 10, ici $${String(n).split('').join(' + ')} = ${s}$. Le nombre de tours est le nombre de chiffres : $\Theta(\log n)$.`
        };
      }
    },
    {
      name: 'v2', make(r) {
        const a = r.int(1, 9), odd = 2 * r.int(1, 60) + 1, n = Math.pow(2, a) * odd;
        return {
          src: `def f(n):
    c = 0
    while n % 2 == 0:
        n = n // 2
        c = c + 1
    return c`,
          n, res: a,
          expl: R`$f(n)$ est l'<strong>exposant de 2</strong> dans la décomposition de $n$ ($n \ge 1$) : ici $${n} = 2^{${a}} \times ${odd}$, donc $f(${n}) = ${a}$. Attention : pour $n = 0$ la boucle ne termine pas. Dans le pire cas ($n$ puissance de 2), $\Theta(\log n)$ tours.`
        };
      }
    },
    {
      name: 'miroir', make(r) {
        let n; do { n = r.int(1000, 999999); } while (n % 10 === 0);
        const m = Number(String(n).split('').reverse().join(''));
        return {
          src: `def f(n):
    m = 0
    while n > 0:
        m = 10 * m + n % 10
        n = n // 10
    return m`,
          n, res: m,
          expl: R`On retire le dernier chiffre de $n$ et on l'ajoute à droite de $m$ : $f(n)$ est le <strong>nombre miroir</strong> de $n$, ici $${m}$. Complexité : $\Theta(\log n)$ (nombre de chiffres).`
        };
      }
    }
  ];

  const generateurs = {
    boucles: {
      title: 'Compter les tours de boucles', diff: 2,
      make(r) {
        const tpl = r.pick(BOUCLES);
        const k = r.pick([2, 3]);
        const N = r.pick([10, 12, 16, 20, 25, 30, 50, 100]);
        const c = tpl.count(N, k);
        return {
          enonce: R`<p>On considère le fragment de code suivant, où <code>n</code> est un entier positif.</p>${code(tpl.code(k))}
            <ol><li>Que vaut <code>c</code> à la fin pour <code>n = ${N}</code> ?</li><li>Donner, en fonction de $n$, l'ordre de grandeur du nombre d'opérations effectuées (notation $\Theta$).</li></ol>`,
          indication: R`<p>Comptez le nombre de tours de la boucle la plus interne en fonction des indices des boucles externes, puis sommez.</p>`,
          correction: R`<p>${tpl.expl(k)}</p><p>1. Pour $n = ${N}$ : <code>c = ${c}</code>.</p><p>2. Chaque tour coûte $O(1)$ ; le coût total est proportionnel à la valeur finale de <code>c</code> : $${tpl.theta}$.</p>`
        };
      }
    },
    trace: {
      title: 'Que calcule cette fonction ?', diff: 1,
      make(r) {
        const t = r.pick(TRACES).make(r);
        return {
          enonce: R`<p>On considère la fonction suivante.</p>${code(t.src)}<ol><li>Calculer <code>f(${t.n})</code>.</li><li>Que calcule <code>f</code> en général ? Quelle est sa complexité en fonction de $n$ ?</li></ol>`,
          indication: R`<p>Faites tourner la boucle à la main sur un petit exemple en notant les valeurs des variables à chaque tour.</p>`,
          correction: R`<p>1. <code>f(${t.n}) = ${t.res}</code>.</p><p>2. ${t.expl}</p>`
        };
      }
    },
    croissance: {
      title: 'Classer des fonctions par croissance', diff: 2,
      make(r) {
        const chosen = r.sample(CROISSANCES, 5).map(g => {
          const i = r.int(0, g.forms.length - 1);
          return { rank: g.rank, tex: g.forms[i], note: g.note && g.note[i] };
        });
        const shown = r.shuffle(chosen);
        const sorted = chosen.slice().sort((a, b) => a.rank - b.rank);
        const notes = sorted.filter(x => x.note).map(x => x.note);
        return {
          enonce: R`<p>Classer les fonctions suivantes de $n$ de sorte que chacune soit un $o$ de la suivante :</p>
            <p style="text-align:center">$${shown.map(x => x.tex).join(R`, \qquad `)}$</p>`,
          indication: R`<p>Hiérarchie : $\log n \ll n^a \ll b^n \ll n! \ll n^n$ (pour $a > 0$, $b > 1$). Simplifier d'abord les expressions déguisées.</p>`,
          correction: R`<p>${notes.length ? 'Simplifications : ' + notes.join(' ; ') + '.' : ''}</p>
            $$${sorted.map(x => x.tex).join(R` \ll `)}$$
            <p>(Ici $f \ll g$ signifie $f = o(g)$.) Justification : croissances comparées, $\frac{(\log n)^a}{n^b} \to 0$, $\frac{n^a}{b^n} \to 0$ ($b > 1$), $\frac{b^n}{n!} \to 0$, $\frac{n!}{n^n} \to 0$.</p>`
        };
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Cours                                                               */
  /* ------------------------------------------------------------------ */
  const cours = [
    { t: 'h', title: 'Algorithmes et programmes' },
    { t: 'def', body: R`<p>Un <strong>algorithme</strong> est une suite finie d'instructions non ambiguës permettant de résoudre un problème : à partir de données d'<strong>entrée</strong>, il produit une <strong>sortie</strong> en un nombre fini d'étapes. Un <strong>programme</strong> est la traduction d'un algorithme dans un langage (ici Python).</p>` },
    { t: 'p', body: R`<p>Les briques de base sont l'<strong>affectation</strong>, la <strong>conditionnelle</strong>, les <strong>boucles</strong> (<code>for</code> pour un nombre de tours connu, <code>while</code> sinon) et les <strong>fonctions</strong>.</p>` + code(`def maximum(t):
    """Renvoie le plus grand élément de la liste non vide t."""
    m = t[0]
    for x in t[1:]:
        if x > m:
            m = x
    return m`) },
    { t: 'rem', body: R`<p>On attend d'un algorithme trois choses : qu'il <strong>termine</strong>, qu'il soit <strong>correct</strong> (il renvoie le bon résultat), et qu'il soit <strong>efficace</strong>. Ce chapitre traite de l'efficacité ; la terminaison et la correction font l'objet du chapitre 3.</p>` },

    { t: 'h', title: 'Coût d’un algorithme' },
    { t: 'def', title: 'modèle de coût', body: R`<p>On compte le nombre d'<strong>opérations élémentaires</strong> effectuées : affectations, comparaisons, opérations arithmétiques sur des entiers de taille bornée, accès à un élément de liste. Chacune est supposée coûter un temps constant.</p>` },
    { t: 'def', title: 'complexité', body: R`<p>Pour une entrée de <strong>taille</strong> $n$ (longueur d'une liste, nombre de chiffres d'un entier…), on note $T(n)$ le nombre d'opérations élémentaires. On distingue :</p>
      <ul><li>la complexité <strong>dans le pire cas</strong> : $T_{\max}(n) = \max\{T(x) : x \text{ de taille } n\}$ ;</li>
      <li>la complexité <strong>dans le meilleur cas</strong> : $T_{\min}(n)$ ;</li>
      <li>la complexité <strong>en moyenne</strong> : moyenne de $T(x)$ selon une loi de probabilité sur les entrées de taille $n$.</li></ul>
      <p>Sauf mention contraire, « complexité » signifie complexité temporelle dans le pire cas.</p>` },
    { t: 'ex', title: 'recherche séquentielle', body: code(`def appartient(x, t):
    for y in t:
        if y == x:
            return True
    return False`) + R`<p>Pour une liste de longueur $n$ : pire cas ($x$ absent) $n$ comparaisons ; meilleur cas ($x$ en tête) $1$ comparaison ; si $x$ est présent à une position uniformément aléatoire, $\frac{1 + 2 + \dots + n}{n} = \frac{n+1}{2}$ comparaisons en moyenne.</p>` },
    { t: 'rem', body: R`<p>La complexité <strong>spatiale</strong> mesure la mémoire utilisée en plus des données. <code>maximum</code> ci-dessus utilise $O(1)$ mémoire supplémentaire… sauf que <code>t[1:]</code> crée une copie de taille $n - 1$ ! Écrire <code>for i in range(1, len(t))</code> évite cette copie.</p>` },

    { t: 'h', title: 'Notations de Landau' },
    { t: 'def', body: R`<p>Soient $f, g : \N \to \R_+$. On note</p>
      <ul><li>$f = O(g)$ s'il existe $C > 0$ et $n_0$ tels que $f(n) \le C\,g(n)$ pour tout $n \ge n_0$ ;</li>
      <li>$f = \Omega(g)$ s'il existe $c > 0$ et $n_0$ tels que $f(n) \ge c\,g(n)$ pour tout $n \ge n_0$ ;</li>
      <li>$f = \Theta(g)$ si $f = O(g)$ et $f = \Omega(g)$ : $c\,g(n) \le f(n) \le C\,g(n)$ à partir d'un certain rang.</li></ul>` },
    { t: 'prop', body: R`<ol>
        <li>Si $f(n)/g(n) \to \ell \in\, ]0, +\infty[$, alors $f = \Theta(g)$. Si $f(n)/g(n) \to 0$, alors $f = O(g)$ mais $f \neq \Omega(g)$.</li>
        <li>$O$ est transitive : $f = O(g)$ et $g = O(h)$ $\Rightarrow$ $f = O(h)$.</li>
        <li>Si $f_1 = O(g_1)$ et $f_2 = O(g_2)$, alors $f_1 + f_2 = O(\max(g_1, g_2))$ et $f_1f_2 = O(g_1g_2)$.</li>
        <li>Un polynôme $a_dn^d + \dots + a_0$ avec $a_d > 0$ est un $\Theta(n^d)$.</li></ol>`,
      proof: R`<p>1. Si $f/g \to \ell > 0$, pour $n$ grand $\frac\ell2 \le f/g \le 2\ell$. 2. $f \le Cg \le CC'h$ à partir d'un rang. 3. $f_1 + f_2 \le C_1g_1 + C_2g_2 \le (C_1 + C_2)\max(g_1, g_2)$ ; $f_1f_2 \le C_1C_2g_1g_2$. 4. Le quotient par $n^d$ tend vers $a_d > 0$ ; on applique 1.</p>` },
    { t: 'prop', title: 'hiérarchie usuelle', body: R`<p>Pour $a > 0$, $b > 1$ et $c > 0$ :</p>
      $$1 \ll \log n \ll (\log n)^c \ll n^a \ll b^n \ll n! \ll n^n,$$
      <p>où $f \ll g$ signifie $f = o(g)$. La base du logarithme n'importe pas : $\log_b n = \frac{\ln n}{\ln b} = \Theta(\ln n)$.</p>`,
      proof: R`<p>Ce sont les croissances comparées de l'analyse. Pour $b^n \ll n!$ : $\frac{b^n}{n!} = \prod_{k=1}^n\frac bk \le C\left(\frac12\right)^{n - 2b}$ dès que $k \ge 2b$ rend les facteurs $\le \frac12$. Pour $n! \ll n^n$ : $\frac{n!}{n^n} = \prod_{k=1}^{n}\frac kn \le \frac1n$.</p>` },
    { t: 'thm', title: 'sommes de puissances', body: R`<p>Pour $k \in \N$ : $\displaystyle\sum_{i=1}^n i^k = \Theta(n^{k+1})$.</p>`,
      proof: R`<p>Majoration : chaque terme est $\le n^k$, donc la somme est $\le n^{k+1}$. Minoration : on garde les termes $i \ge n/2$, au nombre d'au moins $n/2$, chacun $\ge (n/2)^k$ : la somme est $\ge \frac{n^{k+1}}{2^{k+1}}$.</p>` },
    { t: 'meth', title: 'ordres de grandeur', body: R`<p>Avec $10^9$ opérations par seconde et $n = 10^6$ : $\log_2 n \approx 20$ (instantané), $n\log_2 n \approx 2\cdot 10^7$ (0,02 s), $n^2 = 10^{12}$ (environ 17 minutes), $2^n$ : impensable. D'où l'importance de l'ordre de grandeur plutôt que des constantes.</p>` },

    { t: 'h', title: 'Calculer une complexité' },
    { t: 'prop', title: 'règles de calcul', body: R`<ul>
        <li><strong>Séquence</strong> d'instructions : on additionne les coûts.</li>
        <li><strong>Conditionnelle</strong> : coût du test plus le maximum des coûts des branches (pire cas).</li>
        <li><strong>Boucle</strong> : somme, sur tous les tours, du coût du corps de boucle. Si le corps coûte $O(1)$, c'est le nombre de tours.</li>
        <li><strong>Appel de fonction</strong> : coût de la fonction appelée (attention aux fonctions « cachées » : <code>x in t</code>, <code>t.copy()</code>, <code>t[a:b]</code>, <code>sum(t)</code> coûtent $\Theta(n)$).</li></ul>` },
    { t: 'ex', title: 'boucles imbriquées dépendantes', body: code(`for i in range(n):
    for j in range(i + 1, n):
        if t[i] == t[j]:
            return True
return False`) + R`<p>Pour $i$ fixé : $n - 1 - i$ comparaisons. Dans le pire cas (pas de doublon) : $\sum_{i=0}^{n-1}(n - 1 - i) = \frac{n(n-1)}{2} = \Theta(n^2)$.</p>` },
    { t: 'ex', title: 'boucle à pas multiplicatif', body: code(`def nb_bits(n):
    c = 0
    while n > 0:
        n = n // 2
        c = c + 1
    return c`) + R`<p>Après $k$ tours, $n$ a été divisé par $2^k$ (à la partie entière près). La boucle s'arrête quand $n = 0$, après $\lfloor\log_2 n\rfloor + 1$ tours : $\Theta(\log n)$. Ici la taille de l'entrée est le nombre de bits $\approx\log_2 n$ : la complexité est <em>linéaire en la taille</em>.</p>` },
    { t: 'ex', title: 'produit matriciel naïf', body: code(`def produit(A, B, n):
    C = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            for k in range(n):
                C[i][j] = C[i][j] + A[i][k] * B[k][j]
    return C`) + R`<p>Trois boucles imbriquées de $n$ tours : $n^3$ multiplications, complexité $\Theta(n^3)$.</p>` },
    { t: 'warn', body: R`<p>La taille de l'entrée doit être précisée. Pour un entier $n$, la « taille » naturelle est son nombre de chiffres $\approx\log n$ ; un algorithme en $\Theta(n)$ tours est alors <em>exponentiel</em> en la taille.</p>` }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche                                                               */
  /* ------------------------------------------------------------------ */
  const fiche = [
    { k: 'def', t: 'Notations de Landau', prio: true,
      key: R`<p>$f = \Theta(g) \iff c\,g(n) \le f(n) \le C\,g(n)$ à partir d'un rang</p>`,
      b: R`<p>$O$ : seulement la majoration. $\Omega$ : seulement la minoration. Critère : <mark>$f/g \to \ell \in\,]0, \infty[$ ⇒ $\Theta$</mark>.</p>` },
    { k: 'form', t: 'Hiérarchie des croissances', prio: true,
      key: R`$$\log n \ll n^a \ll b^n \ll n! \ll n^n$$`,
      b: R`<p>($a > 0$, $b > 1$). La <b>base du log</b> ne compte pas : $\log_b n = \Theta(\ln n)$.</p>` },
    { k: 'meth', t: 'Compter les tours de boucles', prio: true,
      key: R`<p>Imbriquées : <mark>somme</mark> $\sum_i(\text{tours internes})$</p>`,
      b: R`<p>Indépendantes : produit. Pas multiplicatif $i \leftarrow 2i$ : <b>$\Theta(\log n)$</b> tours.</p>` },
    { k: 'form', t: 'Sommes à connaître', prio: true,
      key: R`<p>$\sum_{i=1}^n i = \frac{n(n+1)}{2}$, $\quad\sum_{i=1}^n i^k = \Theta(n^{k+1})$</p>`,
      b: R`<p>$\sum_{i=0}^{k} 2^i = 2^{k+1} - 1$, $\ \sum_{i=1}^n \frac1i \sim \ln n$.</p>` },
    { k: 'def', t: 'Complexité',
      key: R`<p>Nombre d'opérations en fonction de la <b>taille $n$</b> de l'entrée</p>`,
      b: R`<p>Par défaut : dans le <b>pire cas</b>. Aussi : meilleur cas, en moyenne.</p>` },
    { k: 'form', t: 'Classes courantes',
      key: R`<p>$\Theta(\log n)$ divisions répétées ; $\Theta(n)$ parcours ; $\Theta(n^2)$ toutes les paires</p>`,
      b: R`<p>$\Theta(n\log n)$ bons tris ; $\Theta(n^3)$ produit matriciel naïf ; $\Theta(2^n)$ toutes les parties.</p>` },
    { k: 'prop', t: 'Règles de calcul',
      key: R`<p>Séquence : <b>+</b> ; boucle : <b>somme</b> ; si/sinon : <b>max</b></p>` },
    { k: 'meth', t: 'Ordres de grandeur ($10^9$ op/s, $n = 10^6$)',
      key: R`<p>$n\log n$ : 0,02 s ; $\ n^2$ : 17 min ; $\ 2^n$ : impossible</p>` },
    { k: 'warn', t: 'Coûts cachés en Python',
      key: R`<p><code>x in liste</code>, <code>t[a:b]</code>, <code>sum</code>, <code>max</code>, <code>copy</code> : <mark>$\Theta(n)$</mark></p>`,
      b: R`<p><code>t = t + [x]</code> : $\Theta(n)$ ; préférer <code>t.append(x)</code> : $O(1)$.</p>` }
  ];

  /* ------------------------------------------------------------------ */
  /* Exercices                                                           */
  /* ------------------------------------------------------------------ */
  const exercices = [
    {
      id: 'landau', title: 'Manipuler Θ', diff: 1,
      enonce: R`<p>Montrer que $f(n) = 3n^2 + 5n + 2 = \Theta(n^2)$ en exhibant des constantes, puis que $n^2 \neq O(n\log n)$.</p>`,
      correction: R`<p>Pour $n \ge 1$ : $3n^2 \le f(n) \le 3n^2 + 5n^2 + 2n^2 = 10n^2$. Donc $c = 3$, $C = 10$, $n_0 = 1$ conviennent.</p>
        <p>Si $n^2 \le Cn\log n$ pour $n \ge n_0$, alors $\frac{n}{\log n} \le C$, ce qui est faux car $\frac{n}{\log n} \to +\infty$.</p>`,
      similaires: [
        {
          title: 'Factorielle et exponentielle',
          enonce: R`<p>Montrer que $2^n = O(n!)$ mais que $n! \neq O(2^n)$.</p>`,
          correction: R`<p>On écrit $\dfrac{n!}{2^n} = \prod_{k=1}^n\dfrac k2 = \dfrac12\cdot1\cdot\dfrac32\cdot\prod_{k=4}^n\dfrac k2$, et chaque facteur $\frac k2$ avec $k \ge 4$ vaut au moins $2$.</p>
            <p>Donc pour $n \ge 3$, $\frac{n!}{2^n} \ge \frac34$, soit $2^n \le \frac43\,n!$ : $2^n = O(n!)$.</p>
            <p>Pour $n \ge 4$, en ne gardant que le dernier facteur : $\frac{n!}{2^n} \ge \frac34\cdot\frac n2 \to +\infty$. Le quotient n'est pas borné, donc $n! \neq O(2^n)$.</p>`
        }
      ]
    },
    {
      id: 'logfact', title: 'log(n!) = Θ(n log n)', diff: 2,
      enonce: R`<p>Montrer que $\log(n!) = \Theta(n\log n)$.</p>`,
      indication: R`<p>Majorer $n!$ par $n^n$. Pour la minoration, ne garder que les facteurs $\ge n/2$.</p>`,
      correction: R`<p>$n! \le n^n$ donc $\log(n!) \le n\log n$.</p>
        <p>$n! \ge \prod_{k = \lceil n/2\rceil}^{n} k \ge \left(\frac n2\right)^{n/2}$, donc $\log(n!) \ge \frac n2\log\frac n2 = \frac n2(\log n - \log 2)$. Pour $n \ge 4$, $\log 2 \le \frac12\log n$, d'où $\log(n!) \ge \frac n4\log n$.</p>
        <p>Conclusion : $\frac14 n\log n \le \log(n!) \le n\log n$ pour $n \ge 4$.</p>`
    },
    {
      id: 'boucles', title: 'Compter les tours', diff: 2, gen: 'boucles',
      enonce: R`<p>Donner, en fonction de $n$, la valeur finale de <code>c</code> et la complexité :</p>` + code(`c = 0
for i in range(n):
    for j in range(i, n):
        for k in range(j, n):
            c = c + 1`),
      indication: R`<p>On compte les triplets $(i, j, k)$ avec $0 \le i \le j \le k \le n - 1$.</p>`,
      correction: R`<p>On compte les triplets $i \le j \le k$ dans $\{0, \dots, n-1\}$ : ce sont les combinaisons <em>avec répétition</em> de 3 éléments parmi $n$, au nombre de $\binom{n+2}{3} = \frac{n(n+1)(n+2)}{6}$.</p>
        <p>Vérification par le calcul : pour $i, j$ fixés, $n - j$ tours ; $\sum_{j=i}^{n-1}(n - j) = \frac{(n-i)(n-i+1)}{2}$ ; puis $\sum_{m=1}^{n}\frac{m(m+1)}{2} = \frac{n(n+1)(n+2)}{6}$.</p>
        <p>Complexité : $\Theta(n^3)$.</p>`
    },
    {
      id: 'doublons', title: 'Détecter un doublon', diff: 1,
      enonce: R`<p>Écrire une fonction <code>a_doublon(t)</code> qui renvoie <code>True</code> si la liste <code>t</code> contient deux éléments égaux (à des positions différentes). Donner sa complexité dans le pire et le meilleur cas.</p>`,
      correction: code(`def a_doublon(t):
    n = len(t)
    for i in range(n):
        for j in range(i + 1, n):
            if t[i] == t[j]:
                return True
    return False`) + R`<p>Pire cas (aucun doublon) : $\frac{n(n-1)}2$ comparaisons, $\Theta(n^2)$. Meilleur cas ($t[0] = t[1]$) : une comparaison, $\Theta(1)$.</p>
        <p>On fera mieux plus tard : en triant d'abord la liste ($\Theta(n\log n)$, chapitre 4), les doublons deviennent voisins ; avec un ensemble/dictionnaire (chapitre 5), on obtient $O(n)$ en moyenne.</p>`
    },
    {
      id: 'horner', title: 'Évaluer un polynôme', diff: 2,
      enonce: R`<p>Un polynôme $P = a_0 + a_1X + \dots + a_nX^n$ est représenté par la liste <code>a = [a0, a1, ..., an]</code>.</p>
        <ol><li>Écrire une évaluation naïve où $x^i$ est recalculé à chaque terme par $i$ multiplications. Combien de multiplications ?</li><li>Améliorer en conservant la puissance courante.</li><li>Écrire l'algorithme de Horner : $P(x) = a_0 + x(a_1 + x(a_2 + \dots + x\,a_n))$. Combien de multiplications ?</li></ol>`,
      correction: code(`def eval_naive(a, x):
    s = 0
    for i in range(len(a)):
        p = 1
        for _ in range(i):
            p = p * x
        s = s + a[i] * p
    return s

def eval_puissance(a, x):
    s, p = 0, 1
    for c in a:
        s = s + c * p
        p = p * x
    return s

def horner(a, x):
    s = 0
    for c in reversed(a):
        s = s * x + c
    return s`) + R`<p>1. $\sum_{i=0}^{n}(i + 1) = \frac{(n+1)(n+2)}{2}$ multiplications : $\Theta(n^2)$.</p>
        <p>2. Deux multiplications par terme : $2(n+1)$, $\Theta(n)$.</p>
        <p>3. Horner : $n + 1$ multiplications et $n + 1$ additions, $\Theta(n)$ avec la meilleure constante.</p>`
    },
    {
      id: 'comparaison', title: 'Comparer deux algorithmes', diff: 1, gen: 'croissance',
      enonce: R`<p>L'algorithme A effectue $100\,n\log_2 n$ opérations, l'algorithme B en effectue $n^2$. Lequel est le plus rapide pour $n = 100$ ? pour $n = 10^4$ ? À partir de quelle taille environ A devient-il préférable ?</p>`,
      correction: R`<p>$n = 100$ : A fait $100 \times 100 \times \log_2 100 \approx 66\,400$ opérations, B en fait $10^4$ : <strong>B</strong> est plus rapide.</p>
        <p>$n = 10^4$ : A fait $\approx 100 \times 10^4 \times 13{,}3 \approx 1{,}3\cdot10^7$, B fait $10^8$ : <strong>A</strong> est plus rapide.</p>
        <p>A est préférable quand $n^2 > 100n\log_2 n$, i.e. $\frac{n}{\log_2 n} > 100$, soit à partir de $n \approx 1000$ (le calcul précis donne $n \ge 997$). Asymptotiquement, $\Theta(n\log n)$ gagne toujours contre $\Theta(n^2)$, mais les constantes comptent pour les petites tailles.</p>`
    },
    {
      id: 'minmax', title: 'Minimum et maximum simultanés', diff: 3,
      enonce: R`<p>Un algorithme naïf calcule le minimum puis le maximum d'une liste de $n$ éléments en $2(n - 1)$ comparaisons. Proposer un algorithme qui utilise environ $\frac{3n}{2}$ comparaisons.</p>`,
      indication: R`<p>Traiter les éléments par paires : comparer d'abord les deux éléments de la paire entre eux.</p>`,
      correction: code(`def min_max(t):
    n = len(t)
    if n % 2 == 1:
        mn = mx = t[0]
        debut = 1
    else:
        mn, mx = min(t[0], t[1]), max(t[0], t[1])   # 1 comparaison
        debut = 2
    for i in range(debut, n, 2):
        a, b = t[i], t[i + 1]
        if a > b:                 # 1 comparaison
            a, b = b, a
        if a < mn:                # 1 comparaison
            mn = a
        if b > mx:                # 1 comparaison
            mx = b
    return mn, mx`) + R`<p>Chaque paire coûte 3 comparaisons au lieu de 4 : le plus petit de la paire n'est comparé qu'au minimum, le plus grand qu'au maximum. Total : environ $\frac{3n}{2}$ comparaisons (exactement $\lceil\frac{3n}{2}\rceil - 2$).</p>`
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiches méthodes                                                     */
  /* ------------------------------------------------------------------ */
  const methodes = [
    {
      title: 'Complexité de boucles imbriquées', gen: 'boucles',
      cas: R`Des boucles <code>for</code> imbriquées`, debut: R`Écrire le nombre total de tours comme une <b>somme</b> $\sum_i (\text{tours de la boucle interne})$.`,
      quand: R`<p>Le code contient des boucles <code>for</code> imbriquées, éventuellement dépendantes les unes des autres.</p>`,
      etapes: [
        R`Identifier le coût du corps de la boucle la plus interne (souvent $O(1)$).`,
        R`Écrire le nombre total d'exécutions comme une <strong>somme multiple</strong> sur les indices, en respectant les bornes exactes.`,
        R`Calculer de l'intérieur vers l'extérieur ($\sum 1$, $\sum i$, $\sum i^2$…), ou majorer/minorer pour obtenir un $\Theta$.`,
        R`Vérifier sur une petite valeur de $n$ (tableau à la main ou programme).`
      ],
      exemple: {
        enonce: R`<p>Complexité de : <code>for i in range(n): for j in range(i*i): ...</code> (corps en $O(1)$).</p>`,
        solution: R`<p>$\sum_{i=0}^{n-1}i^2 = \frac{(n-1)n(2n-1)}{6} = \Theta(n^3)$.</p>`
      },
      pieges: [R`Multiplier les tailles des boucles quand elles sont dépendantes : $n \times n$ pour <code>range(i)</code> donne le bon ordre $\Theta(n^2)$ mais une valeur exacte fausse.`, R`Oublier les coûts cachés (<code>in</code>, tranches) dans le corps de boucle.`]
    },
    {
      title: 'Nombre de tours d’une boucle while', gen: 'trace',
      cas: R`Une boucle <code>while</code> où la variable est multipliée ou divisée`, debut: R`Exprimer la variable <b>après $k$ tours</b> ($2^k$, $n/2^k$) et <b>résoudre la condition d'arrêt</b> en $k$.`,
      quand: R`<p>Une boucle <code>while</code> dont la variable évolue de façon non linéaire (multiplication, division, racine).</p>`,
      etapes: [
        R`Exprimer la valeur de la variable après $k$ tours : $i_k = 2^k$, $n_k = \lfloor n/2^k\rfloor$, etc.`,
        R`Écrire la condition d'arrêt en fonction de $k$ et la résoudre : $2^k \ge n \iff k \ge \log_2 n$.`,
        R`Conclure : le nombre de tours est le plus petit $k$ vérifiant la condition.`
      ],
      exemple: {
        enonce: R`<p>Nombre de tours de <code>i = n; while i > 1: i = i // 3</code>.</p>`,
        solution: R`<p>Après $k$ tours, $i = \lfloor n/3^k\rfloor$. On s'arrête dès que $\lfloor n/3^k\rfloor \le 1$, i.e. $3^k > n/2$ environ : $k \approx \log_3 n$, donc $\Theta(\log n)$.</p>`
      }
    },
    {
      title: 'Prouver une relation O, Ω, Θ', gen: 'croissance',
      cas: R`Justifier $f = O(g)$, $\Theta(g)$, ou le contraire`, debut: R`Étudier la <b>limite de $f/g$</b> ; sinon exhiber $c$, $C$ et $n_0$.`,
      quand: R`<p>On demande de justifier rigoureusement $f = O(g)$, $f = \Theta(g)$, ou leur négation.</p>`,
      etapes: [
        R`Méthode directe : exhiber des constantes $c, C$ et un rang $n_0$ (majorer chaque terme par le terme dominant).`,
        R`Méthode de la limite : si $f/g$ a une limite $\ell \in\, ]0, \infty[$, alors $\Theta$ ; si $\ell = 0$, $o$.`,
        R`Pour montrer $f \neq O(g)$ : montrer que $f/g \to +\infty$ (ou n'est pas bornée).`,
        R`Pour les logarithmes et exponentielles : passer au logarithme, ou utiliser les croissances comparées.`
      ],
      exemple: {
        enonce: R`<p>Montrer que $n^{100} = O(1{,}01^n)$.</p>`,
        solution: R`<p>$\frac{n^{100}}{1{,}01^n} = \exp\big(100\ln n - n\ln 1{,}01\big) \to 0$ car $\ln n = o(n)$. Donc $n^{100} = o(1{,}01^n)$, a fortiori $O$. (Mais en pratique, la constante cachée est énorme !)</p>`
      }
    },
    {
      title: 'Choisir entre deux algorithmes',
      cas: R`Deux algorithmes pour le même problème`, debut: R`Comparer les <b>ordres de grandeur</b> ($\Theta$), puis les constantes pour les petites tailles.`,
      quand: R`<p>Deux solutions au même problème, de complexités différentes.</p>`,
      etapes: [
        R`Comparer d'abord les <strong>ordres de grandeur</strong> : pour $n$ grand, le $\Theta$ le plus petit l'emporte.`,
        R`Pour des tailles modérées, comparer les coûts exacts (constantes) et chercher le seuil.`,
        R`Tenir compte du pire cas vs du cas moyen selon l'usage, et de la mémoire.`
      ],
      exemple: {
        enonce: R`<p>Faut-il trier une liste ($\Theta(n\log n)$) pour ensuite faire $k$ recherches dichotomiques ($\Theta(\log n)$ chacune), plutôt que $k$ recherches séquentielles ?</p>`,
        solution: R`<p>Coût avec tri : $\Theta(n\log n + k\log n)$. Sans tri : $\Theta(kn)$. Le tri devient rentable dès que $k$ dépasse l'ordre de $\log n$.</p>`
      }
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche méthode, partie 1 : plan de travail ; partie 2 : cas à reconnaître */
  /* ------------------------------------------------------------------ */
  const plan = {
    etapes: [
      { titre: 'Fixer la taille et l’opération comptée', faire: R`Préciser $n$ (longueur de la liste, valeur ou nombre de chiffres d'un entier…) et l'<b>opération élémentaire</b> que l'on compte.`,
        questions: [R`Pire cas, meilleur cas, ou en moyenne ?`] },
      { titre: 'Repérer boucles et appels', faire: R`Pour chaque boucle : <b>nombre de tours</b> en fonction de $n$ et des indices extérieurs ; coût du corps, y compris les <b>coûts cachés</b>.` },
      { titre: 'Écrire le coût', faire: R`Une <b>somme</b> pour des boucles imbriquées ; une <b>condition d'arrêt</b> à résoudre pour un <code>while</code>.` },
      { titre: 'Calculer ou encadrer', faire: R`Sommes usuelles, encadrement, hiérarchie des croissances : obtenir un <b>$\Theta$</b>.` },
      { titre: 'Conclure et vérifier', faire: R`Énoncer la complexité (pire/meilleur cas) ; <b>tester</b> sur de petites valeurs de $n$, à la main ou en Python.` }
    ]
  };
  const reperes = [
    { etape: 1, si: R`L'entrée est un <b>entier</b> $n$ (pas une liste)`, alors: R`Préciser si la taille est <b>$n$</b> ou son <b>nombre de chiffres</b> $\approx \log n$.` },
    { etape: 1, si: R`Un <code>return</code> à l'intérieur d'une boucle`, alors: R`Distinguer <b>meilleur cas</b> (sortie immédiate) et <b>pire cas</b> (la boucle va au bout).` },
    { etape: 2, si: R`<code>in</code>, <code>t[a:b]</code>, <code>sum</code>, <code>max</code>, <code>t + [x]</code> dans une boucle`, alors: R`Coût caché <b>$\Theta(n)$</b> par tour : le multiplier par le nombre de tours.` },
    { etape: 2, si: R`<code>for j in range(i)</code> ou <code>range(i, n)</code>`, alors: R`Le nombre de tours <b>dépend de $i$</b> : écrire $\sum_i(\ldots)$, pas $n \times n$.` },
    { etape: 2, si: R`<code>i = i * 2</code> ou <code>n = n // 2</code>`, alors: R`Nombre de tours <b>logarithmique</b> : après $k$ tours, $i = 2^k$.` },
    { etape: 2, si: R`<code>while i * i &lt;= n</code>`, alors: R`Nombre de tours de l'ordre de <b>$\sqrt n$</b>.` },
    { etape: 3, si: R`Trois boucles imbriquées avec $i &lt; j &lt; k$`, alors: R`On compte des <b>parties à 3 éléments</b> : $\binom n3$.` },
    { etape: 4, si: R`$\sum_{i=1}^n i^k$`, alors: R`<b>$\Theta(n^{k+1})$</b> (majorer par $n^{k+1}$, minorer avec la moitié des termes).` },
    { etape: 4, si: R`$\sum_{i=1}^n \frac ni$ (boucle interne à pas $i$)`, alors: R`Série harmonique : <b>$\Theta(n\ln n)$</b>.` },
    { etape: 4, si: R`$\log(n!)$ ou un produit`, alors: R`Passer au <b>logarithme</b> : $\log(n!) = \sum\log k = \Theta(n\log n)$.` },
    { etape: 4, si: R`Comparer deux fonctions compliquées`, alors: R`Étudier la <b>limite de $f/g$</b>, ou de $\ln f - \ln g$ pour des exponentielles.` },
    { etape: 5, si: R`Un doute sur un comptage`, alors: R`<b>Simuler</b> : ajouter un compteur <code>c += 1</code> et l'afficher pour $n = 10, 100, 1000$.` }
  ];

  L2.chapter('algo', 'complexite', {
    intro: R`<p>Ce chapitre fixe le vocabulaire (algorithme, coût, complexité) et les outils de comparaison ($O$, $\Omega$, $\Theta$) utilisés dans tout le cours. Les exemples sont écrits en Python.</p>`,
    cours, fiche, exercices, methodes, generateurs, plan, reperes
  });
})();
