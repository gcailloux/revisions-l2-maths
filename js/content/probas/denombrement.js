/* Probabilités et statistiques 1 — Chapitre 1 : Dénombrement */
(function () {
  'use strict';
  const R = String.raw;
  const { binom, arr, fact, bpow, big } = ML;
  const C = (n, k) => R`\binom{${n}}{${k}}`;

  /* ------------------------------------------------------------------ */
  /* Générateurs                                                         */
  /* ------------------------------------------------------------------ */
  const MOTS = ['ANANAS', 'BANANE', 'CERISE', 'POMMES', 'MATHEMATIQUES', 'PROBABILITE', 'STATISTIQUE', 'ALGEBRE',
    'NORMANDIE', 'ABRICOT', 'COCCINELLE', 'PAPILLON', 'SERIES', 'ESPERANCE', 'VARIANCE', 'ELLIPSE', 'TOMATE',
    'PARALLELE', 'INTEGRALE', 'MATRICE', 'DENOMBREMENT', 'CARACTERE'];
  function counts(w) { const m = {}; for (const c of w) m[c] = (m[c] || 0) + 1; return m; }
  function multinomial(cnt) {
    const n = Object.values(cnt).reduce((s, x) => s + x, 0);
    let r = fact(n);
    Object.values(cnt).forEach(k => { r /= fact(k); });
    return r;
  }
  function multiTex(cnt) {
    const n = Object.values(cnt).reduce((s, x) => s + x, 0);
    const den = Object.entries(cnt).filter(([, k]) => k > 1).sort().map(([l, k]) => k + '!');
    return den.length ? R`\dfrac{${n}!}{${den.join(R`\,`)}}` : n + '!';
  }
  function repTex(cnt) {
    return Object.entries(cnt).sort().map(([l, k]) => R`\text{${l}}\,(${k})`).join(',\\ ');
  }

  const generateurs = {
    anagrammes: {
      title: 'Anagrammes d’un mot', diff: 1,
      make(r) {
        const w = r.pick(MOTS);
        const cnt = counts(w);
        const total = multinomial(cnt);
        const letters = Object.keys(cnt);
        const L = r.pick(letters);
        const cnt2 = Object.assign({}, cnt); cnt2[L]--; if (!cnt2[L]) delete cnt2[L];
        const startL = multinomial(cnt2);
        return {
          enonce: R`<p>Combien d'anagrammes (mots de ${w.length} lettres, ayant un sens ou non) peut-on former avec les lettres du mot <strong>${w}</strong> ? Combien commencent par la lettre <strong>${L}</strong> ?</p>`,
          indication: R`<p>On place les lettres une par une dans ${w.length} cases : il faut ensuite diviser par les permutations des lettres identiques entre elles.</p>`,
          correction: R`<p>Le mot a $${w.length}$ lettres, avec les répétitions : $${repTex(cnt)}$.</p>
            <p>Une anagramme est déterminée par le choix des positions de chaque lettre. Si toutes les lettres étaient distinctes, il y aurait $${w.length}!$ anagrammes ; chaque mot est compté autant de fois qu'il y a de façons de permuter les lettres identiques entre elles. D'où</p>
            $$N = ${multiTex(cnt)} = ${big(total)}.$$
            <p>Commençant par ${L} : on fixe ${L} en tête et on permute les $${w.length - 1}$ lettres restantes : $${multiTex(cnt2)} = ${big(startL)}$.</p>`
        };
      }
    },

    urne: {
      title: 'Tirages dans une urne', diff: 2,
      make(r) {
        const rr = r.int(3, 8), bb = r.int(3, 8), n = rr + bb;
        const k = r.int(2, 4);
        let j; do { j = r.int(1, k - 1); } while (j > rr || k - j > bb);
        const mode = r.pick(['simul', 'remise', 'sans']);
        const modeTxt = { simul: 'simultanément', remise: 'successivement <strong>avec remise</strong>', sans: 'successivement <strong>sans remise</strong>' }[mode];
        let cor;
        if (mode === 'simul') {
          const tot = binom(n, k), ex = binom(rr, j) * binom(bb, k - j), al = tot - binom(bb, k);
          cor = R`<p>Un tirage simultané est une <strong>partie</strong> à $${k}$ éléments de l'ensemble des $${n}$ boules (l'ordre ne compte pas).</p>
            <ol><li>Nombre de tirages : $${C(n, k)} = ${big(tot)}$.</li>
            <li>Exactement $${j}$ rouges : on choisit $${j}$ rouges parmi $${rr}$ <em>et</em> $${k - j}$ blanches parmi $${bb}$ : $${C(rr, j)}\times${C(bb, k - j)} = ${big(ex)}$.</li>
            <li>Au moins une rouge : on passe au complémentaire (aucune rouge = que des blanches) : $${C(n, k)} - ${C(bb, k)} = ${big(al)}$.</li></ol>`;
        } else if (mode === 'remise') {
          const tot = bpow(n, k), ex = binom(k, j) * bpow(rr, j) * bpow(bb, k - j), al = tot - bpow(bb, k);
          cor = R`<p>Un résultat est une <strong>$${k}$-liste</strong> (ordonnée, avec répétitions possibles) de boules.</p>
            <ol><li>Nombre de tirages : $${n}^{${k}} = ${big(tot)}$.</li>
            <li>Exactement $${j}$ rouges : on choisit les positions des rouges parmi les $${k}$ tirages ($${C(k, j)}$ façons), puis une boule rouge pour chacune ($${rr}^{${j}}$) et une blanche pour les autres ($${bb}^{${k - j}}$) : $${C(k, j)}\,${rr}^{${j}}\,${bb}^{${k - j}} = ${big(ex)}$.</li>
            <li>Au moins une rouge : $${n}^{${k}} - ${bb}^{${k}} = ${big(al)}$.</li></ol>`;
        } else {
          const tot = arr(n, k), ex = binom(k, j) * arr(rr, j) * arr(bb, k - j), al = tot - arr(bb, k);
          cor = R`<p>Un résultat est une <strong>$${k}$-liste sans répétition</strong> (arrangement) de boules.</p>
            <ol><li>Nombre de tirages : $A_{${n}}^{${k}} = ${Array.from({ length: k }, (_, i) => n - i).join(R`\times`)} = ${big(tot)}$.</li>
            <li>Exactement $${j}$ rouges : positions des rouges ($${C(k, j)}$), rouges ordonnées ($A_{${rr}}^{${j}}$), blanches ordonnées ($A_{${bb}}^{${k - j}}$) : $${C(k, j)}\,A_{${rr}}^{${j}}\,A_{${bb}}^{${k - j}} = ${big(ex)}$.</li>
            <li>Au moins une rouge : $A_{${n}}^{${k}} - A_{${bb}}^{${k}} = ${big(al)}$.</li></ol>`;
        }
        return {
          enonce: R`<p>Une urne contient $${rr}$ boules rouges et $${bb}$ boules blanches, toutes discernables. On tire $${k}$ boules ${modeTxt}.</p>
            <ol><li>Combien y a-t-il de tirages possibles ?</li><li>Combien contiennent exactement $${j}$ boule${j > 1 ? 's' : ''} rouge${j > 1 ? 's' : ''} ?</li><li>Combien contiennent au moins une boule rouge ?</li></ol>`,
          indication: R`<p>Identifier d'abord le modèle : l'ordre compte-t-il ? les répétitions sont-elles possibles ?</p>`,
          correction: cor
        };
      }
    },

    mots: {
      title: 'Mots, codes et répétitions', diff: 1,
      make(r) {
        const ctx = r.pick([
          { n: 26, txt: 'lettres de l’alphabet (26 lettres)', obj: 'mots' },
          { n: 10, txt: 'chiffres de 0 à 9', obj: 'codes' },
          { n: r.int(5, 8), txt: null, obj: 'mots' }
        ]);
        const n = ctx.n, p = r.int(3, Math.min(6, n - 1));
        const txt = ctx.txt || R`lettres d'un alphabet à $${n}$ symboles`;
        const tot = bpow(n, p), sr = arr(n, p);
        return {
          enonce: R`<p>On forme des ${ctx.obj} de longueur $${p}$ à l'aide des ${txt}.</p><ol><li>Combien y en a-t-il ?</li><li>Combien sont formés de ${p} symboles tous distincts ?</li><li>Combien comportent au moins une répétition ?</li></ol>`,
          correction: R`<ol><li>Un ${ctx.obj.slice(0, -1)} est une $${p}$-liste d'éléments d'un ensemble à $${n}$ éléments : $${n}^{${p}} = ${big(tot)}$.</li>
            <li>Symboles distincts : arrangement, $A_{${n}}^{${p}} = \dfrac{${n}!}{${n - p}!} = ${Array.from({ length: p }, (_, i) => n - i).join(R`\times`)} = ${big(sr)}$.</li>
            <li>« Au moins une répétition » est le contraire de « tous distincts » : $${big(tot)} - ${big(sr)} = ${big(tot - sr)}$.</li></ol>`
        };
      }
    },

    equation: {
      title: 'Solutions entières d’une équation', diff: 2,
      make(r) {
        const k = r.int(3, 5), n = r.int(k + 2, 15);
        const a = binom(n + k - 1, k - 1), b = binom(n - 1, k - 1);
        const vars = Array.from({ length: k }, (_, i) => 'x_' + (i + 1)).join(' + ');
        return {
          enonce: R`<p>Combien l'équation $${vars} = ${n}$ admet-elle de solutions $(x_1, \dots, x_${k})$ :</p><ol><li>en entiers naturels ($x_i \ge 0$) ?</li><li>en entiers strictement positifs ($x_i \ge 1$) ?</li></ol>`,
          indication: R`<p>Méthode « étoiles et barres » : une solution correspond à une suite de $${n}$ étoiles et $${k - 1}$ barres.</p>`,
          correction: R`<p>1. On représente une solution par $${n}$ étoiles séparées en $${k}$ paquets par $${k - 1}$ barres ($x_i$ = nombre d'étoiles du $i$-ème paquet). Une solution correspond donc au choix des positions des $${k - 1}$ barres parmi $${n + k - 1}$ places :</p>
            $$${C(n + k - 1, k - 1)} = ${big(a)}.$$
            <p>2. On pose $y_i = x_i - 1 \ge 0$ : $y_1 + \dots + y_${k} = ${n - k}$, d'où, par la question 1, $${C(n - k + k - 1, k - 1)} = ${big(b)}$ solutions. (Autre vision : placer $${k - 1}$ barres dans les $${n - 1}$ espaces entre les étoiles.)</p>`
        };
      }
    },

    comite: {
      title: 'Former un comité', diff: 2,
      make(r) {
        const h = r.int(5, 12), f = r.int(4, 10), n = h + f, k = r.int(3, 5);
        let j; do { j = r.int(1, k - 1); } while (j > f || k - j > h);
        const tot = binom(n, k), ex = binom(f, j) * binom(h, k - j), mix = tot - binom(h, k) - binom(f, k), pres = BigInt(n) * binom(n - 1, k - 1);
        return {
          enonce: R`<p>Un groupe de travail réunit $${h}$ étudiants de L2 et $${f}$ étudiants de L3. On forme un comité de $${k}$ personnes.</p>
            <ol><li>Combien de comités possibles ?</li><li>Combien comportent exactement $${j}$ étudiant${j > 1 ? 's' : ''} de L3 ?</li><li>Combien comportent au moins un étudiant de chaque année ?</li><li>Combien de comités avec un président désigné parmi les membres ?</li></ol>`,
          correction: R`<ol><li>Parties à $${k}$ éléments parmi $${n}$ : $${C(n, k)} = ${big(tot)}$.</li>
            <li>$${C(f, j)}\times${C(h, k - j)} = ${big(ex)}$.</li>
            <li>Complémentaire : on retire les comités « tout L2 » et « tout L3 » : $${C(n, k)} - ${C(h, k)} - ${C(f, k)} = ${big(mix)}$.</li>
            <li>On choisit le président ($${n}$ façons) puis les $${k - 1}$ autres membres parmi les $${n - 1}$ restants : $${n}\times${C(n - 1, k - 1)} = ${big(pres)}$. On retrouve la formule $k${C('n', 'k')} = n${C('n-1', 'k-1')}$ : $${k}\times${big(tot)} = ${big(pres)}$.</li></ol>`
        };
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* Cours                                                               */
  /* ------------------------------------------------------------------ */
  const cours = [
    { t: 'h', title: 'Ensembles finis et cardinal' },
    { t: 'def', body: R`<p>Un ensemble $E$ est <strong>fini</strong> s'il est vide ou en bijection avec $\{1, \dots, n\}$ pour un certain $n \in \N^*$. Cet entier $n$ (unique) est le <strong>cardinal</strong> de $E$, noté $\Card(E)$, $|E|$ ou $\#E$. On pose $\Card(\varnothing) = 0$.</p>` },
    { t: 'prop', title: 'règles de base', body: R`<p>Soient $A, B$ des parties finies d'un ensemble $E$ fini.</p>
      <ol>
        <li><strong>Principe additif</strong> : si $A \cap B = \varnothing$, $\Card(A \cup B) = \Card A + \Card B$.</li>
        <li>$\Card(\overline{A}) = \Card E - \Card A$ (complémentaire dans $E$).</li>
        <li>$\Card(A \cup B) = \Card A + \Card B - \Card(A \cap B)$.</li>
        <li><strong>Principe multiplicatif</strong> : $\Card(A \times B) = \Card A \times \Card B$.</li>
      </ol>`,
      proof: R`<p>1. On juxtapose une bijection $A \to \{1..a\}$ et une bijection $B \to \{a+1..a+b\}$. 2. $E = A \sqcup \overline A$. 3. $A \cup B = A \sqcup (B \setminus A)$ et $B = (B\setminus A) \sqcup (A \cap B)$. 4. $A \times B = \bigsqcup_{a \in A}\{a\} \times B$ : réunion disjointe de $\Card A$ ensembles de cardinal $\Card B$.</p>` },
    { t: 'thm', title: 'formule du crible de Poincaré', body: R`<p>Pour des parties finies $A_1, \dots, A_n$ :</p>
      $$\Card\Big(\bigcup_{i=1}^n A_i\Big) = \sum_{k=1}^n (-1)^{k+1}\sum_{1 \le i_1 < \dots < i_k \le n}\Card(A_{i_1} \cap \dots \cap A_{i_k}).$$
      <p>Pour trois ensembles : $|A \cup B \cup C| = |A| + |B| + |C| - |A \cap B| - |A \cap C| - |B \cap C| + |A \cap B \cap C|$.</p>`,
      proof: R`<p>Soit $x$ appartenant à exactement $m \ge 1$ des $A_i$. Dans le membre de droite, $x$ est compté $\sum_{k=1}^m(-1)^{k+1}\binom mk$ fois (nombre de façons de choisir $k$ ensembles parmi les $m$ qui le contiennent). Or $\sum_{k=0}^m(-1)^k\binom mk = (1 - 1)^m = 0$, donc $\sum_{k=1}^m(-1)^{k+1}\binom mk = 1$ : chaque élément de la réunion est compté exactement une fois.</p>` },
    { t: 'prop', title: 'applications', body: R`<p>Si $E$ et $F$ sont finis de même cardinal et $f : E \to F$, alors $f$ injective $\iff$ $f$ surjective $\iff$ $f$ bijective.</p>`,
      proof: R`<p>$f$ injective $\Rightarrow$ $\Card f(E) = \Card E = \Card F$, donc $f(E) = F$. $f$ surjective $\Rightarrow$ si $f$ n'était pas injective, $\Card f(E) < \Card E = \Card F$, contradiction.</p>` },

    { t: 'h', title: 'Listes et arrangements' },
    { t: 'def', body: R`<p>Soit $E$ un ensemble à $n$ éléments et $p \in \N$. Une <strong>$p$-liste</strong> d'éléments de $E$ est un élément $(x_1, \dots, x_p)$ de $E^p$ : l'ordre compte et les répétitions sont permises.</p>` },
    { t: 'prop', body: R`<ol><li>Il y a $n^p$ $p$-listes d'éléments de $E$.</li><li>Si $\Card E = p$ et $\Card F = n$, il y a $n^p$ applications de $E$ dans $F$.</li><li>$E$ possède $2^n$ parties : $\Card\mathcal{P}(E) = 2^n$.</li></ol>`,
      proof: R`<p>1. Principe multiplicatif : $\Card(E^p) = (\Card E)^p$. 2. Une application $f : \{e_1, \dots, e_p\} \to F$ est déterminée par la liste $(f(e_1), \dots, f(e_p)) \in F^p$. 3. L'application $A \mapsto \mathbb{1}_A$ est une bijection de $\mathcal P(E)$ sur l'ensemble des applications $E \to \{0, 1\}$, qui a $2^n$ éléments.</p>` },
    { t: 'def', body: R`<p>Un <strong>arrangement</strong> de $p$ éléments de $E$ est une $p$-liste d'éléments <strong>deux à deux distincts</strong>. Une <strong>permutation</strong> de $E$ est un arrangement de ses $n$ éléments, c'est-à-dire une bijection de $E$ dans $E$.</p>` },
    { t: 'thm', body: R`<p>Pour $0 \le p \le n$, le nombre d'arrangements de $p$ éléments parmi $n$ est</p>
      $$A_n^p = n(n-1)\cdots(n-p+1) = \frac{n!}{(n-p)!}.$$
      <p>C'est aussi le nombre d'<strong>injections</strong> d'un ensemble à $p$ éléments dans un ensemble à $n$ éléments. Il y a $n!$ permutations d'un ensemble à $n$ éléments. Si $p > n$, il n'y a aucun arrangement.</p>`,
      proof: R`<p>On choisit $x_1$ ($n$ choix), puis $x_2 \neq x_1$ ($n - 1$ choix), …, puis $x_p$ distinct des $p - 1$ précédents ($n - p + 1$ choix). Le principe multiplicatif (généralisé : le nombre de choix à chaque étape ne dépend pas des choix précédents) donne le produit.</p>` },

    { t: 'h', title: 'Combinaisons et coefficients binomiaux' },
    { t: 'def', body: R`<p>Une <strong>combinaison</strong> de $p$ éléments de $E$ est une <strong>partie</strong> de $E$ à $p$ éléments (l'ordre ne compte pas, pas de répétition). On note $\binom np$ (« $p$ parmi $n$ ») leur nombre.</p>` },
    { t: 'thm', body: R`$$\binom np = \frac{A_n^p}{p!} = \frac{n!}{p!\,(n-p)!} \quad (0 \le p \le n), \qquad \binom np = 0 \text{ si } p > n.$$`,
      proof: R`<p>On compte les arrangements de deux façons : choisir un arrangement de $p$ éléments revient à choisir une partie à $p$ éléments ($\binom np$ façons) puis à ordonner ses éléments ($p!$ façons). Donc $A_n^p = \binom np\, p!$.</p>` },
    { t: 'prop', body: R`<ol>
        <li><strong>Symétrie</strong> : $\binom np = \binom n{n-p}$.</li>
        <li><strong>Formule de Pascal</strong> : $\binom np = \binom{n-1}{p-1} + \binom{n-1}{p}$ pour $1 \le p \le n-1$.</li>
        <li><strong>Formule du pion</strong> : $p\binom np = n\binom{n-1}{p-1}$.</li></ol>`,
      proof: R`<p>1. $A \mapsto \overline A$ est une bijection entre parties à $p$ éléments et parties à $n - p$ éléments.</p>
      <p>2. Fixons $a \in E$. Les parties à $p$ éléments se répartissent en celles qui contiennent $a$ ($\binom{n-1}{p-1}$ : on complète $\{a\}$ par $p-1$ éléments parmi les $n-1$ autres) et celles qui ne le contiennent pas ($\binom{n-1}{p}$).</p>
      <p>3. On compte les couples (comité à $p$ membres, président dans le comité) : $\binom np \times p$ ; ou président d'abord ($n$ choix) puis les $p-1$ autres membres : $n\binom{n-1}{p-1}$.</p>` },
    { t: 'thm', title: 'binôme de Newton', body: R`<p>Pour $a, b$ dans un anneau commutatif (par exemple $\R$ ou $\C$) et $n \in \N$ :</p>
      $$(a + b)^n = \sum_{k=0}^n\binom nk a^k b^{n-k}.$$`,
      proof: R`<p>En développant $(a+b)(a+b)\cdots(a+b)$ ($n$ facteurs), on obtient une somme de $2^n$ produits, chacun obtenu en choisissant $a$ ou $b$ dans chaque facteur. Le produit $a^kb^{n-k}$ apparaît autant de fois qu'il y a de façons de choisir les $k$ facteurs où l'on prend $a$, soit $\binom nk$.</p>` },
    { t: 'cor', body: R`$$\sum_{k=0}^n\binom nk = 2^n, \qquad \sum_{k=0}^n(-1)^k\binom nk = 0 \ (n \ge 1).$$`,
      proof: R`<p>Binôme avec $a = b = 1$, puis $a = -1$, $b = 1$. La première égalité se lit aussi : $\mathcal P(E)$ est la réunion disjointe des ensembles de parties à $k$ éléments, $k = 0..n$.</p>` },
    { t: 'prop', title: 'formule de Vandermonde', body: R`$$\sum_{k=0}^{n}\binom ak\binom b{n-k} = \binom{a+b}{n}.$$`,
      proof: R`<p>Dans un ensemble formé de $a$ filles et $b$ garçons, choisir $n$ personnes revient à choisir, pour un certain $k$, $k$ filles et $n - k$ garçons ; on somme sur $k$.</p>` },
    { t: 'ex', body: R`<p>Mains de 5 cartes dans un jeu de 52 cartes : $\binom{52}{5} = 2\,598\,960$. Nombre de <em>full</em> (trois cartes d'une hauteur, deux d'une autre) : on choisit la hauteur du brelan ($13$), ses 3 couleurs ($\binom43$), la hauteur de la paire ($12$), ses 2 couleurs ($\binom42$) : $13 \times 4 \times 12 \times 6 = 3\,744$.</p>` },

    { t: 'h', title: 'Permutations avec répétition, combinaisons avec répétition' },
    { t: 'thm', title: 'coefficients multinomiaux', body: R`<p>Le nombre de façons de ranger $n$ objets dont $n_1$ sont identiques de type 1, …, $n_r$ identiques de type $r$ ($n_1 + \dots + n_r = n$) est</p>
      $$\binom{n}{n_1, \dots, n_r} = \frac{n!}{n_1!\,n_2!\cdots n_r!}.$$`,
      proof: R`<p>On choisit les $n_1$ positions des objets de type 1 ($\binom n{n_1}$), puis les $n_2$ positions de type 2 parmi les $n - n_1$ restantes, etc. Le produit $\binom n{n_1}\binom{n - n_1}{n_2}\cdots$ se simplifie en $\frac{n!}{n_1!\cdots n_r!}$.</p>` },
    { t: 'ex', body: R`<p>Anagrammes de MISSISSIPPI (M : 1, I : 4, S : 4, P : 2) : $\dfrac{11!}{1!\,4!\,4!\,2!} = 34\,650$.</p>` },
    { t: 'thm', title: 'étoiles et barres', body: R`<p>Le nombre de solutions $(x_1, \dots, x_k) \in \N^k$ de $x_1 + \dots + x_k = n$ est $\displaystyle\binom{n + k - 1}{k - 1}$. C'est aussi le nombre de façons de choisir $n$ objets parmi $k$ types, avec répétition et sans ordre (<strong>combinaisons avec répétition</strong>).</p>`,
      proof: R`<p>Une solution s'encode de façon unique par un mot de $n$ étoiles et $k - 1$ barres : $x_1$ étoiles, une barre, $x_2$ étoiles, …, une barre, $x_k$ étoiles. Un tel mot est déterminé par les positions des $k - 1$ barres parmi les $n + k - 1$ symboles.</p>` },

    { t: 'h', title: 'Choisir le bon modèle' },
    { t: 'meth', title: 'tableau récapitulatif', body: R`<p>On tire $p$ objets parmi $n$ :</p>
      <table class="t"><tr><th></th><th>avec répétition</th><th>sans répétition</th></tr>
      <tr><th>ordre important</th><td>$p$-listes : $n^p$<br><small>tirages successifs avec remise</small></td><td>arrangements : $A_n^p$<br><small>tirages successifs sans remise</small></td></tr>
      <tr><th>ordre sans importance</th><td>$\binom{n+p-1}{p}$<br><small>combinaisons avec répétition</small></td><td>combinaisons : $\binom np$<br><small>tirage simultané</small></td></tr></table>` },
    { t: 'rem', body: R`<p>Pour compter « au moins un », on passe presque toujours au <strong>complémentaire</strong> (« aucun »). Et pour éviter de compter deux fois le même objet, on vérifie que la description choisie est une <strong>bijection</strong> : chaque objet correspond à exactement une suite de choix.</p>` }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche                                                               */
  /* ------------------------------------------------------------------ */
  const fiche = [
    { k: 'meth', t: 'Quel modèle ? (p objets parmi n)', prio: true,
      key: R`<table class="t"><tr><th></th><th>répétition</th><th>sans répétition</th></tr><tr><th>ordre</th><td>$n^p$</td><td>$A_n^p = \frac{n!}{(n-p)!}$</td></tr><tr><th>sans ordre</th><td>$\binom{n+p-1}{p}$</td><td>$\binom np$</td></tr></table>`,
      b: R`<p>Successifs avec remise : $n^p$. Successifs sans remise : $A_n^p$. <b>Simultanés</b> : $\binom np$.</p>` },
    { k: 'form', t: 'Combinaisons', prio: true,
      key: R`$$\binom np = \frac{n!}{p!\,(n-p)!}$$`,
      b: R`<p>Nombre de <b>parties</b> à $p$ éléments. $\binom np = \binom n{n-p}$.</p>` },
    { k: 'meth', t: '« Au moins un »', prio: true,
      key: R`<p>Passer au <mark>complémentaire</mark> : total − « aucun »</p>`,
      b: R`<p>Jamais « j'en choisis un, puis le reste » : on compte plusieurs fois.</p>` },
    { k: 'thm', t: 'Binôme de Newton', prio: true,
      key: R`$$(a+b)^n = \sum_{k=0}^n \binom nk a^k b^{n-k}$$`,
      b: R`<p>$\sum_k \binom nk = 2^n$, $\ \sum_k (-1)^k\binom nk = 0$.</p>` },
    { k: 'prop', t: 'Règles de base',
      key: R`<p>$|A \cup B| = |A| + |B| - |A \cap B|$</p>`,
      b: R`<p>$|\overline A| = |E| - |A|$, $\ |A \times B| = |A|\,|B|$.</p>` },
    { k: 'form', t: 'Listes et applications',
      key: R`<p>$n^p$ listes ; $\ |F|^{|E|}$ applications ; $\ 2^n$ parties</p>` },
    { k: 'form', t: 'Arrangements',
      key: R`<p>$A_n^p = n(n-1)\cdots(n-p+1)$</p>`,
      b: R`<p>= nombre d'<b>injections</b>. $n!$ <b>permutations</b>.</p>` },
    { k: 'prop', t: 'Pascal et formule du pion',
      key: R`<p>$\binom np = \binom{n-1}{p-1} + \binom{n-1}p$, $\quad p\binom np = n\binom{n-1}{p-1}$</p>` },
    { k: 'form', t: 'Anagrammes',
      key: R`<p>$\dfrac{n!}{n_1!\,n_2!\cdots n_r!}$</p>`,
      b: R`<p>On divise par les permutations des lettres <b>identiques</b>.</p>` },
    { k: 'form', t: 'Étoiles et barres',
      key: R`<p>$x_1 + \dots + x_k = n$, $x_i \ge 0$ : $\binom{n+k-1}{k-1}$</p>`,
      b: R`<p>Avec $x_i \ge 1$ : $\binom{n-1}{k-1}$.</p>` },
    { k: 'thm', t: 'Crible (3 ensembles)',
      key: R`<p>$|A\cup B\cup C| = \sum|A| - \sum|A\cap B| + |A\cap B\cap C|$</p>`,
      b: R`<p>Signes <b>alternés</b>. Vandermonde : $\sum_k\binom ak\binom b{n-k} = \binom{a+b}n$.</p>` },
    { k: 'warn', t: 'Pièges',
      key: R`<ul><li>Introduire un <b>ordre</b> artificiel (deux paires : $\binom{13}2$, pas $13 \times 12$).</li><li>Oublier de <b>diviser</b> par les symétries.</li></ul>` }
  ];

  /* ------------------------------------------------------------------ */
  /* Exercices                                                           */
  /* ------------------------------------------------------------------ */
  const exercices = [
    {
      id: 'anagrammes', title: 'Anagrammes', diff: 1, gen: 'anagrammes',
      enonce: R`<p>Combien d'anagrammes du mot <strong>ANAGRAMME</strong> ? Combien dans lesquelles les trois A sont consécutifs ?</p>`,
      correction: R`<p>ANAGRAMME : 9 lettres, A (3), M (2), N, G, R, E (1). Nombre d'anagrammes : $\dfrac{9!}{3!\,2!} = \dfrac{362\,880}{12} = 30\,240$.</p>
        <p>Trois A consécutifs : on colle « AAA » en un seul bloc ; on permute alors 7 objets (le bloc, M, M, N, G, R, E) dont deux M identiques : $\dfrac{7!}{2!} = 2\,520$.</p>`
    },
    {
      id: 'urne', title: 'Tirages dans une urne', diff: 2, gen: 'urne',
      enonce: R`<p>Une urne contient 5 boules rouges et 4 boules noires. On tire simultanément 3 boules. Combien de tirages contiennent : a) exactement 2 rouges ? b) au moins une rouge ? c) des boules des deux couleurs ?</p>`,
      correction: R`<p>Total : $\binom93 = 84$.</p><ul>
        <li>a) $\binom52\binom41 = 10 \times 4 = 40$.</li>
        <li>b) Complémentaire de « 3 noires » : $84 - \binom43 = 84 - 4 = 80$.</li>
        <li>c) On retire « 3 rouges » et « 3 noires » : $84 - \binom53 - \binom43 = 84 - 10 - 4 = 70$.</li></ul>`
    },
    {
      id: 'poker', title: 'Mains de poker', diff: 2,
      enonce: R`<p>On tire 5 cartes d'un jeu de 52 (13 hauteurs, 4 couleurs). Dénombrer : a) les mains contenant exactement une paire ; b) exactement deux paires ; c) une couleur (5 cartes de la même couleur).</p>`,
      indication: R`<p>Choisir d'abord les <em>hauteurs</em> (en distinguant leurs rôles), puis les <em>couleurs</em> des cartes.</p>`,
      correction: R`<ul>
        <li>a) Hauteur de la paire : $13$ ; ses couleurs : $\binom42 = 6$ ; les 3 autres hauteurs, distinctes entre elles et de la paire : $\binom{12}{3} = 220$ ; une couleur pour chacune : $4^3$. Total : $13 \times 6 \times 220 \times 64 = 1\,098\,240$.</li>
        <li>b) Les deux hauteurs des paires (rôles symétriques, <strong>non ordonnées</strong>) : $\binom{13}{2} = 78$ ; leurs couleurs : $\binom42^2 = 36$ ; la 5<sup>e</sup> carte : $11 \times 4 = 44$. Total : $78 \times 36 \times 44 = 123\,552$.</li>
        <li>c) Couleur : $4$ ; 5 hauteurs parmi 13 : $\binom{13}5 = 1\,287$. Total : $5\,148$ (quintes flush incluses).</li></ul>
        <p>Piège en b) : écrire $13 \times 12$ pour les hauteurs compte chaque main deux fois.</p>`,
      similaires: [
        {
          title: 'Brelans et carrés',
          enonce: R`<p>Toujours avec 5 cartes parmi 52, dénombrer les mains contenant un carré (4 cartes de même hauteur), puis celles contenant exactement un brelan (3 cartes de même hauteur, les 2 autres de hauteurs différentes entre elles et du brelan).</p>`,
          correction: R`<p>Carré : hauteur ($13$), la 5<sup>e</sup> carte ($48$) : $624$.</p><p>Brelan : hauteur ($13$), couleurs ($\binom43 = 4$), deux autres hauteurs distinctes ($\binom{12}2 = 66$), leurs couleurs ($4^2$) : $13 \times 4 \times 66 \times 16 = 54\,912$.</p>`
        }
      ]
    },
    {
      id: 'identites', title: 'Identités combinatoires', diff: 2,
      enonce: R`<p>Montrer de deux façons (calcul, puis dénombrement) que $\displaystyle\sum_{k=0}^n k\binom nk = n\,2^{n-1}$.</p>`,
      correction: R`<p><strong>Par le calcul</strong> : $k\binom nk = n\binom{n-1}{k-1}$ (formule du pion), donc $\sum_{k=1}^n k\binom nk = n\sum_{k=1}^n\binom{n-1}{k-1} = n\sum_{j=0}^{n-1}\binom{n-1}j = n2^{n-1}$. (Ou dériver $(1+x)^n = \sum\binom nk x^k$ et prendre $x = 1$.)</p>
        <p><strong>Par dénombrement</strong> : on compte les couples (comité $A \subset E$, président $x \in A$) avec $|E| = n$. En choisissant d'abord le comité de taille $k$ puis son président : $\sum_k k\binom nk$. En choisissant d'abord le président ($n$ choix) puis le reste du comité, partie quelconque des $n - 1$ autres ($2^{n-1}$) : $n2^{n-1}$.</p>`,
      similaires: [
        {
          title: 'Somme des carrés des binomiaux',
          enonce: R`<p>Montrer que $\sum_{k=0}^n\binom nk^2 = \binom{2n}{n}$.</p>`,
          correction: R`<p>Par symétrie $\binom nk^2 = \binom nk\binom n{n-k}$, et par Vandermonde avec $a = b = n$ : $\sum_k\binom nk\binom n{n-k} = \binom{2n}n$.</p>`
        },
        {
          title: 'Somme sur une diagonale',
          enonce: R`<p>Montrer que $\sum_{k=p}^n\binom kp = \binom{n+1}{p+1}$ (formule « de la crosse de hockey »).</p>`,
          correction: R`<p>Récurrence sur $n$ avec Pascal : $\binom{n+1}{p+1} + \binom{n+1}{p} = \binom{n+2}{p+1}$. Ou par dénombrement : les parties à $p+1$ éléments de $\{1, \dots, n+1\}$ dont le plus grand élément est $k + 1$ sont au nombre de $\binom kp$ ; on somme sur $k$ de $p$ à $n$.</p>`
        }
      ]
    },
    {
      id: 'crible', title: 'Formule du crible', diff: 2,
      enonce: R`<p>Combien d'entiers de $\{1, \dots, 1000\}$ ne sont divisibles ni par 2, ni par 3, ni par 5 ?</p>`,
      indication: R`<p>Le nombre de multiples de $d$ dans $\{1, \dots, N\}$ est $\lfloor N/d\rfloor$, et « divisible par 2 et par 3 » équivaut à « divisible par 6 ».</p>`,
      correction: R`<p>Soient $A_2, A_3, A_5$ les ensembles de multiples. $|A_2| = 500$, $|A_3| = 333$, $|A_5| = 200$, $|A_2 \cap A_3| = |A_6| = 166$, $|A_{10}| = 100$, $|A_{15}| = 66$, $|A_{30}| = 33$.</p>
        $$|A_2 \cup A_3 \cup A_5| = 1033 - 332 + 33 = 734.$$
        <p>Réponse : $1000 - 734 = 266$.</p>`,
      similaires: [
        {
          title: 'Dérangements',
          diff: 3,
          enonce: R`<p>Un <em>dérangement</em> de $\{1, \dots, n\}$ est une permutation sans point fixe. À l'aide du crible appliqué aux ensembles $A_i = \{\sigma : \sigma(i) = i\}$, montrer que le nombre de dérangements est $D_n = \sum_{k=0}^n(-1)^k\frac{n!}{k!}$, puis calculer $D_4$.</p>`,
          correction: R`<p>$|A_{i_1} \cap \dots \cap A_{i_k}| = (n - k)!$ (les $k$ points sont fixés, on permute les autres). Par le crible, $|\bigcup A_i| = \sum_{k=1}^n(-1)^{k+1}\binom nk(n-k)! = \sum_{k=1}^n(-1)^{k+1}\frac{n!}{k!}$. Donc $D_n = n! - |\bigcup A_i| = \sum_{k=0}^n(-1)^k\frac{n!}{k!}$.</p>
            <p>$D_4 = 24 - 24 + 12 - 4 + 1 = 9$.</p>`
        }
      ]
    },
    {
      id: 'chemins', title: 'Chemins dans un quadrillage', diff: 1,
      enonce: R`<p>Combien de chemins vont de $(0,0)$ à $(5,3)$ en faisant des pas unitaires vers la droite ou vers le haut ? Combien passent par le point $(2,1)$ ?</p>`,
      correction: R`<p>Un chemin est un mot de 8 pas dont 5 « droite » et 3 « haut » : il est déterminé par les positions des 3 pas « haut » : $\binom83 = 56$.</p>
        <p>Par $(2,1)$ : chemins de $(0,0)$ à $(2,1)$ ($\binom31 = 3$), puis de $(2,1)$ à $(5,3)$ (3 droite, 2 haut : $\binom52 = 10$). Total : $30$.</p>`
    },
    {
      id: 'surjections', title: 'Surjections', diff: 3,
      enonce: R`<p>Combien y a-t-il de surjections de $\{1, \dots, n+1\}$ sur $\{1, \dots, n\}$ ?</p>`,
      indication: R`<p>Exactement un élément de l'ensemble d'arrivée a deux antécédents.</p>`,
      correction: R`<p>Une telle surjection a exactement un élément $y$ de l'arrivée possédant deux antécédents, les autres en ayant un seul. On choisit la paire d'antécédents $\{a, b\}$ ($\binom{n+1}2$ façons) ; on obtient alors $n$ « blocs » ($\{a, b\}$ et les $n - 1$ singletons) à envoyer bijectivement sur les $n$ éléments de l'arrivée : $n!$ façons. Total : $\binom{n+1}{2}\,n! = \dfrac{n(n+1)!}{2}$.</p>`
    },
    {
      id: 'etoiles', title: 'Répartitions', diff: 2, gen: 'equation',
      enonce: R`<p>De combien de façons peut-on répartir 10 bonbons identiques entre 4 enfants ? Et si chaque enfant doit en recevoir au moins un ?</p>`,
      correction: R`<p>Solutions de $x_1 + x_2 + x_3 + x_4 = 10$ dans $\N$ : $\binom{13}{3} = 286$. Avec $x_i \ge 1$ : $\binom93 = 84$.</p>`
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiches méthodes                                                     */
  /* ------------------------------------------------------------------ */
  const methodes = [
    {
      title: 'Identifier le bon modèle de tirage', gen: 'urne',
      cas: R`« Combien de… » : des objets choisis parmi d'autres`, debut: R`Décrire <b>un</b> résultat, puis se demander : <b>l'ordre compte-t-il ?</b> <b>Répétitions possibles ?</b>`,
      quand: R`<p>Toute question « combien de… » portant sur des choix d'objets.</p>`,
      etapes: [
        R`Décrire précisément <strong>un résultat</strong> (un objet compté) : une liste ? une partie ? une application ?`,
        R`Se demander : l'<strong>ordre</strong> compte-t-il ? Les <strong>répétitions</strong> sont-elles possibles ?`,
        R`Appliquer la formule du tableau : $n^p$, $A_n^p$, $\binom np$, $\binom{n+p-1}p$.`,
        R`Vérifier sur un petit cas (énumération à la main).`
      ],
      exemple: {
        enonce: R`<p>Un code de cadenas a 4 chiffres. Combien de codes ? Combien avec 4 chiffres distincts ? Combien avec des chiffres strictement croissants ?</p>`,
        solution: R`<p>Ordre et répétitions : $10^4$. Ordre sans répétition : $A_{10}^4 = 5\,040$. Strictement croissants : un tel code est déterminé par l'<em>ensemble</em> de ses chiffres (on les range dans l'ordre) : $\binom{10}4 = 210$.</p>`
      },
      pieges: [R`Les « chiffres croissants » transforment une liste en partie : penser bijection plutôt que formule.`]
    },
    {
      title: 'Dénombrer « au moins un »', gen: 'comite',
      cas: R`« Au moins un », « pas tous », « au moins deux couleurs »`, debut: R`Passer au <b>complémentaire</b> : compter « aucun », puis soustraire au total.`,
      quand: R`<p>La question contient « au moins un », « au moins deux couleurs », « pas tous »…</p>`,
      etapes: [
        R`Écrire l'événement contraire (« aucun », « tous de la même couleur »…).`,
        R`Compter le contraire, qui est en général un modèle simple.`,
        R`Soustraire au total.`
      ],
      exemple: {
        enonce: R`<p>Combien de mains de 5 cartes (parmi 52) contiennent au moins un as ?</p>`,
        solution: R`<p>Contraire : aucun as, soit 5 cartes parmi les 48 autres. Réponse : $\binom{52}5 - \binom{48}5 = 2\,598\,960 - 1\,712\,304 = 886\,656$.</p>`
      },
      pieges: [R`Le calcul « je choisis un as ($4$), puis 4 cartes quelconques ($\binom{51}4$) » compte plusieurs fois les mains à plusieurs as : $4\binom{51}{4} = 999\,600 \neq 886\,656$.`]
    },
    {
      title: 'Compter par étapes sans doublon', gen: 'anagrammes',
      cas: R`Objet construit par choix successifs (hauteurs puis couleurs…)`, debut: R`Écrire une procédure qui fabrique <b>chaque objet une seule fois</b>, puis multiplier les nombres de choix.`,
      quand: R`<p>L'objet se construit par choix successifs (hauteurs puis couleurs, positions puis lettres…).</p>`,
      etapes: [
        R`Décrire une procédure de construction <strong>qui produit chaque objet exactement une fois</strong>.`,
        R`Multiplier les nombres de choix à chaque étape (ils ne doivent pas dépendre des choix précédents).`,
        R`Si la procédure produit chaque objet exactement $k$ fois (rôles symétriques), diviser par $k$.`
      ],
      exemple: {
        enonce: R`<p>De combien de façons peut-on répartir 6 personnes en 3 binômes (non numérotés) ?</p>`,
        solution: R`<p>Si les binômes étaient numérotés : $\binom62\binom42\binom22 = 15 \times 6 \times 1 = 90$. Chaque répartition est obtenue $3! = 6$ fois (ordre des binômes). Réponse : $90/6 = 15$.</p>`
      }
    },
    {
      title: 'Démontrer une identité combinatoire',
      cas: R`Égalité entre sommes de $\binom nk$`, debut: R`<b>Binôme de Newton</b> ou formule du pion ; sinon <b>double comptage</b> d'un même ensemble.`,
      quand: R`<p>On demande de prouver une égalité entre sommes de coefficients binomiaux.</p>`,
      etapes: [
        R`<strong>Voie algébrique</strong> : formule du pion, Pascal, binôme de Newton (éventuellement dérivé), changement d'indice.`,
        R`<strong>Double comptage</strong> : trouver un ensemble que chaque membre dénombre de façon différente (comités, chemins, parties).`,
        R`<strong>Récurrence</strong> avec la formule de Pascal.`
      ],
      exemple: {
        enonce: R`<p>Montrer $\sum_{k=0}^n\binom nk 2^k = 3^n$.</p>`,
        solution: R`<p>Binôme : $(1 + 2)^n = \sum\binom nk 2^k1^{n-k}$. Dénombrement : les applications $\{1..n\} \to \{a, b, c\}$ sont $3^n$ ; en classant selon le nombre $k$ d'éléments envoyés dans $\{a, b\}$ (choix de ces éléments : $\binom nk$, puis $a$ ou $b$ pour chacun : $2^k$) on trouve la somme.</p>`
      }
    },
    {
      title: 'Utiliser la formule du crible',
      cas: R`« Divisible par 2 <i>ou</i> 3 <i>ou</i> 5 », « aucun point fixe »`, debut: R`Nommer les ensembles $A_i$ et <b>compter leurs intersections</b>.`,
      quand: R`<p>On compte des éléments vérifiant <em>au moins une</em> de plusieurs propriétés (ou <em>aucune</em>), et les intersections sont faciles à compter.</p>`,
      etapes: [
        R`Nommer les ensembles $A_1, \dots, A_n$ (« l'élément vérifie la propriété $i$ »).`,
        R`Calculer les cardinaux des intersections (souvent ils ne dépendent que du nombre d'ensembles intersectés).`,
        R`Appliquer la formule avec les signes alternés ; pour « aucune propriété », prendre le complémentaire.`
      ],
      exemple: {
        enonce: R`<p>Combien d'entiers de 1 à 100 sont divisibles par 2 ou par 7 ?</p>`,
        solution: R`<p>$|A_2| + |A_7| - |A_{14}| = 50 + 14 - 7 = 57$.</p>`
      }
    }
  ];

  /* ------------------------------------------------------------------ */
  /* Fiche méthode, partie 1 : plan de travail ; partie 2 : cas à reconnaître */
  /* ------------------------------------------------------------------ */
  const plan = {
    etapes: [
      { titre: 'Décrire un résultat', faire: R`Écrire <b>un</b> objet compté sur un exemple concret : une main, un mot, un tirage, un comité.`,
        questions: [R`L'<b>ordre</b> compte-t-il ?`, R`Les <b>répétitions</b> sont-elles possibles ?`] },
      { titre: 'Choisir le modèle', faire: R`Liste $n^p$, arrangement $A_n^p$, partie $\binom np$, anagramme $\frac{n!}{n_1!\cdots}$, étoiles et barres $\binom{n+k-1}{k-1}$.` },
      { titre: 'Construire par étapes', faire: R`Décrire une procédure qui fabrique <b>chaque objet exactement une fois</b>, puis <b>multiplier</b> les nombres de choix.` },
      { titre: 'Simplifier le comptage', faire: R`<b>Complémentaire</b>, cas disjoints (additionner), symétries (diviser), <b>crible</b>.` },
      { titre: 'Vérifier', faire: R`Tester sur un <b>petit cas</b> énumérable à la main ; le résultat doit être un entier, inférieur au nombre total de cas.` }
    ]
  };
  const reperes = [
    { etape: 1, si: R`« Simultanément », « une poignée », « un comité », « une main »`, alors: R`L'ordre ne compte pas : <b>parties</b>, $\binom np$.` },
    { etape: 1, si: R`« Successivement », « un mot », « un code », « un classement »`, alors: R`L'ordre compte : <b>listes</b> ($n^p$, avec remise) ou <b>arrangements</b> ($A_n^p$, sans remise).` },
    { etape: 2, si: R`Des objets <b>identiques</b> à ranger (lettres répétées)`, alors: R`<b>Coefficient multinomial</b> $\frac{n!}{n_1!\cdots n_r!}$.`, ex: R`ANANAS : $\frac{6!}{3!\,2!} = 60$.` },
    { etape: 2, si: R`Des objets identiques à répartir dans des boîtes`, alors: R`<b>Étoiles et barres</b> : $\binom{n+k-1}{k-1}$ ($x_i \ge 0$), $\binom{n-1}{k-1}$ ($x_i \ge 1$).` },
    { etape: 2, si: R`« Strictement croissant », « rangés dans l'ordre »`, alors: R`Un tel objet est déterminé par un <b>ensemble</b> : $\binom np$.` },
    { etape: 3, si: R`Des éléments qui doivent être <b>côte à côte</b>`, alors: R`Les <b>coller en un bloc</b>, permuter les blocs, puis permuter à l'intérieur du bloc.`, ex: R`Mots de ABCDE avec A et B voisins : $4! \times 2 = 48$.` },
    { etape: 3, si: R`Des éléments qui ne doivent <b>pas</b> être côte à côte`, alors: R`Placer d'abord les autres, puis insérer dans les <b>espaces</b> entre eux ; ou passer au complémentaire.` },
    { etape: 3, si: R`Plusieurs groupes de même taille <b>non numérotés</b> (binômes, équipes)`, alors: R`Compter comme s'ils étaient numérotés, puis <b>diviser par $k!$</b> (ordres possibles des $k$ groupes).` },
    { etape: 3, si: R`Des <b>rôles distincts</b> (président, trésorier…)`, alors: R`Attribuer d'abord les rôles (l'ordre compte), puis choisir le reste (parties).` },
    { etape: 4, si: R`« Au moins un », « au moins deux couleurs »`, alors: R`<b>Complémentaire</b> : total − « aucun » (ou − « une seule couleur »).` },
    { etape: 4, si: R`Un « ou » entre conditions qui se chevauchent`, alors: R`<b>Crible</b> : $|A \cup B| = |A| + |B| - |A \cap B|$.` },
    { etape: 4, si: R`« Exactement $k$ »`, alors: R`Choisir <b>lesquels</b> ($\binom nk$), puis compter le reste avec la contrainte « pas les autres ».` },
    { etape: 4, si: R`Une somme $\sum_k \binom nk \cdots$ à calculer`, alors: R`<b>Binôme de Newton</b> avec des valeurs bien choisies de $a$ et $b$, ou dériver $(1+x)^n$.` },
    { etape: 5, si: R`Un résultat non entier, ou plus grand que le nombre total de cas`, alors: R`Erreur : vérifier qu'on n'a pas <b>compté plusieurs fois</b> le même objet ou divisé à tort.` }
  ];

  L2.chapter('probas', 'denombrement', {
    intro: R`<p>En probabilités sur un univers fini muni de l'équiprobabilité, $\Proba(A) = \dfrac{\Card A}{\Card\Omega}$ : calculer une probabilité, c'est d'abord <strong>compter</strong>. Ce chapitre fournit les outils de dénombrement ; ils seront utilisés dès le chapitre suivant (espaces probabilisés).</p>`,
    cours, fiche, exercices, methodes, generateurs, plan, reperes
  });
})();
