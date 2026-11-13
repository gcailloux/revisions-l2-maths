/* Petite bibliothèque mathématique pour les générateurs d'exercices :
   aléatoire reproductible, fractions exactes, mise en forme LaTeX,
   matrices (échelonnement, noyau, inverse), dénombrement (BigInt). */
window.ML = (function () {
  'use strict';

  /* ---------------- Aléatoire reproductible (mulberry32) ---------------- */
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    function next() {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    const r = {
      next,
      int(a, b) { return a + Math.floor(next() * (b - a + 1)); },
      pick(arr) { return arr[Math.floor(next() * arr.length)]; },
      nz(a, b) { let x; do { x = r.int(a, b); } while (x === 0); return x; },
      shuffle(arr) {
        const c = arr.slice();
        for (let i = c.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          const t = c[i]; c[i] = c[j]; c[j] = t;
        }
        return c;
      },
      sample(arr, k) { return r.shuffle(arr).slice(0, k); },
      chance(p) { return next() < p; },
      sign() { return next() < 0.5 ? -1 : 1; }
    };
    return r;
  }
  function newSeed() { return 1 + Math.floor(Math.random() * 2147483646); }

  /* ---------------- Arithmétique ---------------- */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; }
  function lcm(a, b) { return a && b ? Math.abs(a * b) / gcd(a, b) : 0; }
  function sqrtSimplify(n) { // n = k^2 * m, m sans facteur carré
    let k = 1, m = n;
    for (let i = Math.floor(Math.sqrt(n)); i >= 2; i--) {
      if (n % (i * i) === 0) { k = i; m = n / (i * i); break; }
    }
    return { k, m };
  }

  /* ---------------- Fractions ---------------- */
  class Frac {
    constructor(n, d) {
      if (d === undefined) d = 1;
      if (d === 0) throw new Error('Division par zéro');
      if (d < 0) { n = -n; d = -d; }
      const g = gcd(n, d) || 1;
      this.n = n / g; this.d = d / g;
      if (this.n === 0) this.d = 1;
    }
    static of(x) { return x instanceof Frac ? x : new Frac(x, 1); }
    add(o) { o = Frac.of(o); return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
    sub(o) { o = Frac.of(o); return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
    mul(o) { o = Frac.of(o); return new Frac(this.n * o.n, this.d * o.d); }
    div(o) { o = Frac.of(o); return new Frac(this.n * o.d, this.d * o.n); }
    neg() { return new Frac(-this.n, this.d); }
    abs() { return new Frac(Math.abs(this.n), this.d); }
    pow(k) { let r = new Frac(1); for (let i = 0; i < k; i++) r = r.mul(this); return r; }
    isZero() { return this.n === 0; }
    isInt() { return this.d === 1; }
    isOne() { return this.n === 1 && this.d === 1; }
    sign() { return Math.sign(this.n); }
    eq(o) { o = Frac.of(o); return this.n === o.n && this.d === o.d; }
    cmp(o) { o = Frac.of(o); return this.n * o.d - o.n * this.d; }
    val() { return this.n / this.d; }
    tex() {
      if (this.d === 1) return String(this.n);
      return (this.n < 0 ? '-' : '') + '\\frac{' + Math.abs(this.n) + '}{' + this.d + '}';
    }
    /* version « en ligne » : 3/4 (pour exposants, indices) */
    texSlash() { return this.d === 1 ? String(this.n) : this.n + '/' + this.d; }
  }
  const F = (n, d) => (n instanceof Frac ? n : new Frac(n, d === undefined ? 1 : d));

  /* ---------------- Mise en forme ---------------- */
  function dec(x, d) { // nombre décimal à la française dans du LaTeX
    let s = Number(x).toFixed(d === undefined ? 4 : d);
    if (/^-0(\.0+)?$/.test(s)) s = s.slice(1);
    return s.replace('.', '{,}');
  }
  function decTxt(x, d) { // idem, hors LaTeX
    let s = Number(x).toFixed(d === undefined ? 4 : d);
    if (/^-0(\.0+)?$/.test(s)) s = s.slice(1);
    return s.replace('.', ',');
  }
  function tex(x) {
    if (x instanceof Frac) return x.tex();
    if (typeof x === 'bigint') return big(x);
    if (typeof x === 'number') return Number.isInteger(x) ? String(x) : dec(x, 4);
    return String(x);
  }
  /* Polynôme : c[i] = coefficient de v^i. */
  function poly(c, v) {
    v = v || 'X';
    let s = '';
    for (let i = c.length - 1; i >= 0; i--) {
      const a = F(c[i]);
      if (a.isZero()) continue;
      const neg = a.n < 0, A = a.abs();
      const mon = i === 0 ? '' : (i === 1 ? v : v + '^{' + i + '}');
      const term = (i > 0 && A.isOne()) ? mon : A.tex() + mon;
      if (s === '') s = (neg ? '-' : '') + term;
      else s += (neg ? ' - ' : ' + ') + term;
    }
    return s || '0';
  }
  /* Combinaison linéaire a1 x + a2 y + ... */
  function lin(coefs, vars) {
    let s = '';
    coefs.forEach((c, i) => {
      const a = F(c);
      if (a.isZero()) return;
      const neg = a.n < 0, A = a.abs();
      const term = A.isOne() ? vars[i] : A.tex() + vars[i];
      if (s === '') s = (neg ? '-' : '') + term;
      else s += (neg ? ' - ' : ' + ') + term;
    });
    return s || '0';
  }
  function xMinus(a, v) {
    v = v || 'X'; a = F(a);
    if (a.isZero()) return v;
    return a.n > 0 ? v + ' - ' + a.tex() : v + ' + ' + a.abs().tex();
  }
  /* Forme factorisée à partir de [[racine, multiplicité], ...] */
  function factored(roots, v) {
    v = v || 'X';
    const single = roots.length === 1;
    return roots.map(([a, m]) => {
      const f = xMinus(a, v);
      const needPar = !(F(a).isZero()) && !(single && m === 1);
      const base = needPar ? '(' + f + ')' : f;
      return m > 1 ? base + '^{' + m + '}' : base;
    }).join('');
  }
  /* Coefficients (croissants) du polynôme unitaire de racines données */
  function polyFromRoots(roots) {
    let c = [F(1)];
    roots.forEach(r => {
      const nc = new Array(c.length + 1).fill(null).map(() => F(0));
      c.forEach((a, i) => {
        nc[i + 1] = nc[i + 1].add(a);
        nc[i] = nc[i].sub(a.mul(r));
      });
      c = nc;
    });
    return c;
  }
  /* « A - λI » joliment écrit */
  function minusLambda(name, l, idTex) {
    l = F(l);
    if (l.isZero()) return name;
    const L = l.abs().isOne() ? '' : l.abs().tex();
    return name + (l.n > 0 ? ' - ' : ' + ') + L + idTex;
  }

  /* ---------------- Matrices ---------------- */
  function mat(M, env) {
    env = env || 'pmatrix';
    return '\\begin{' + env + '}' + M.map(r => r.map(tex).join(' & ')).join(' \\\\ ') + '\\end{' + env + '}';
  }
  function vec(v) { return mat(v.map(x => [x])); }
  function tuple(v) { return '(' + v.map(tex).join(',\\,') + ')'; }
  function ident(n) { return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))); }
  function matMul(A, B) {
    return A.map(row => B[0].map((_, j) => row.reduce((s, a, k) => s + a * B[k][j], 0)));
  }
  function matVec(A, v) { return A.map(row => row.reduce((s, a, k) => s + a * v[k], 0)); }
  function subLambda(A, l) { return A.map((r, i) => r.map((x, j) => (i === j ? x - l : x))); }
  function det(M) {
    const n = M.length;
    if (n === 1) return M[0][0];
    if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
    let s = 0;
    for (let j = 0; j < n; j++) {
      if (M[0][j] === 0) continue;
      const minor = M.slice(1).map(r => r.filter((_, k) => k !== j));
      s += (j % 2 ? -1 : 1) * M[0][j] * det(minor);
    }
    return s;
  }
  function trace(M) { return M.reduce((s, r, i) => s + r[i], 0); }
  /* Forme échelonnée réduite (fractions exactes) */
  function rref(M) {
    const A = M.map(r => r.map(x => F(x)));
    const rows = A.length, cols = A[0].length;
    const piv = [];
    let lead = 0;
    for (let r = 0; r < rows; r++) {
      if (lead >= cols) break;
      let i = r;
      while (A[i][lead].isZero()) {
        i++;
        if (i === rows) { i = r; lead++; if (lead === cols) return { R: A, piv }; }
      }
      const tmp = A[i]; A[i] = A[r]; A[r] = tmp;
      const lv = A[r][lead];
      A[r] = A[r].map(x => x.div(lv));
      for (let j = 0; j < rows; j++) {
        if (j === r) continue;
        const f = A[j][lead];
        if (!f.isZero()) A[j] = A[j].map((x, k) => x.sub(f.mul(A[r][k])));
      }
      piv.push(lead);
      lead++;
    }
    return { R: A, piv };
  }
  function primitive(v) { // vecteur rationnel -> vecteur entier primitif, 1re coord non nulle > 0
    const L = v.reduce((l, x) => lcm(l, F(x).d), 1);
    let w = v.map(x => F(x).mul(L).val());
    const g = w.reduce((g, x) => gcd(g, x), 0) || 1;
    w = w.map(x => x / g);
    const first = w.find(x => x !== 0);
    if (first < 0) w = w.map(x => -x);
    return w.map(x => (x === 0 ? 0 : x));
  }
  /* Base du noyau (vecteurs entiers primitifs) */
  function kernel(M) {
    const { R, piv } = rref(M);
    const cols = M[0].length;
    const free = [];
    for (let j = 0; j < cols; j++) if (!piv.includes(j)) free.push(j);
    return free.map(f => {
      const v = new Array(cols).fill(null).map(() => F(0));
      v[f] = F(1);
      piv.forEach((p, i) => { v[p] = R[i][f].neg(); });
      return primitive(v);
    });
  }
  function rank(M) { return rref(M).piv.length; }
  /* Inverse (fractions) par Gauss-Jordan */
  function inv(M) {
    const n = M.length;
    const aug = M.map((r, i) => r.concat(ident(n)[i]));
    const { R, piv } = rref(aug);
    if (piv.length < n || piv[n - 1] !== n - 1) throw new Error('Matrice non inversible');
    return R.map(r => r.slice(n));
  }
  /* Matrice entière de déterminant 1 (produit d'opérations élémentaires) */
  function unimod(r, n, steps) {
    const M = ident(n);
    for (let s = 0; s < steps; s++) {
      const i = r.int(0, n - 1);
      let j; do { j = r.int(0, n - 1); } while (j === i);
      const c = r.nz(-2, 2);
      for (let k = 0; k < n; k++) M[i][k] += c * M[j][k];
    }
    return M;
  }
  function isProportional(u, v) { // u = λ v ?
    let lam = null;
    for (let i = 0; i < u.length; i++) {
      if (v[i] === 0) { if (u[i] !== 0) return null; continue; }
      const q = F(u[i], v[i]);
      if (lam === null) lam = q; else if (!lam.eq(q)) return null;
    }
    return lam === null ? F(0) : lam;
  }

  /* ---------------- Dénombrement (BigInt) ---------------- */
  function fact(n) { let r = 1n; for (let i = 2n; i <= BigInt(n); i++) r *= i; return r; }
  function binom(n, k) {
    if (k < 0 || k > n) return 0n;
    k = Math.min(k, n - k);
    let r = 1n;
    for (let i = 1; i <= k; i++) r = (r * BigInt(n - k + i)) / BigInt(i);
    return r;
  }
  function arr(n, k) { if (k > n) return 0n; let r = 1n; for (let i = 0; i < k; i++) r *= BigInt(n - i); return r; }
  function bpow(n, k) { return BigInt(n) ** BigInt(k); }
  function big(b) { // groupement des chiffres par 3 (LaTeX)
    let s = b.toString(), neg = '';
    if (s[0] === '-') { neg = '-'; s = s.slice(1); }
    if (s.length <= 4) return neg + s;
    const parts = [];
    while (s.length > 3) { parts.unshift(s.slice(-3)); s = s.slice(0, -3); }
    parts.unshift(s);
    return neg + parts.join('\\,');
  }

  return {
    rng, newSeed, gcd, lcm, sqrtSimplify, Frac, F, dec, decTxt, tex, poly, lin, xMinus,
    factored, polyFromRoots, minusLambda, mat, vec, tuple, ident, matMul, matVec, subLambda,
    det, trace, rref, kernel, rank, inv, unimod, isProportional, primitive,
    fact, binom, arr, bpow, big
  };
})();
