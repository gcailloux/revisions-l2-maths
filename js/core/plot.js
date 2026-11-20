/* Petits tracés SVG sans bibliothèque (hors ligne) :
   - PLOT.courbe : courbes paramétrées ou graphes, repère orthonormé, points marqués, tangentes ;
   - PLOT.riemann : graphe d'une fonction et rectangles / trapèzes d'une somme de Riemann ;
   - PLOT.fig : mise en page d'une ou plusieurs figures avec légende.
   Les couleurs viennent du CSS (classes svg.plot …), donc suivent le thème et la matière. */
window.PLOT = (function () {
  'use strict';
  const r1 = v => Math.round(v * 10) / 10;

  function frame(box, opt) {
    const [x0, x1, y0, y1] = box;
    const W = opt.w || 300, Hmax = opt.hmax || 300, pad = 16;
    const dx = (x1 - x0) || 1, dy = (y1 - y0) || 1;
    let sx = (W - 2 * pad) / dx, sy = sx;
    if (opt.free) sy = Math.min((Hmax - 2 * pad) / dy, sx * 3);
    else if (dy * sy > Hmax - 2 * pad) { sx = sy = (Hmax - 2 * pad) / dy; }
    return {
      X: x => pad + (x - x0) * sx, Y: y => pad + (y1 - y) * sy,
      W: dx * sx + 2 * pad, H: dy * sy + 2 * pad, x0, x1, y0, y1
    };
  }
  function autoBox(pts, extra) {
    let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity;
    pts.concat(extra || []).forEach(p => { if (!p) return; a = Math.min(a, p[0]); b = Math.max(b, p[0]); c = Math.min(c, p[1]); d = Math.max(d, p[1]); });
    if (!isFinite(a)) return [-1, 1, -1, 1];
    if (b - a < 1e-9) { a -= 1; b += 1; }
    if (d - c < 1e-9) { c -= 1; d += 1; }
    const mx = (b - a) * 0.08, my = (d - c) * 0.08;
    return [a - mx, b + mx, c - my, d + my];
  }
  function axes(F) {
    let s = '';
    if (F.x0 <= 0 && F.x1 >= 0) s += `<line class="ax" x1="${r1(F.X(0))}" y1="${r1(F.Y(F.y0))}" x2="${r1(F.X(0))}" y2="${r1(F.Y(F.y1))}"/>`;
    if (F.y0 <= 0 && F.y1 >= 0) s += `<line class="ax" x1="${r1(F.X(F.x0))}" y1="${r1(F.Y(0))}" x2="${r1(F.X(F.x1))}" y2="${r1(F.Y(0))}"/>`;
    return s;
  }
  function pathD(F, pts, box) {
    let d = '', pen = false;
    pts.forEach(p => {
      if (!p || p[0] < box[0] || p[0] > box[1] || p[1] < box[2] || p[1] > box[3]) { pen = false; return; }
      d += (pen ? 'L' : 'M') + r1(F.X(p[0])) + ' ' + r1(F.Y(p[1])) + ' ';
      pen = true;
    });
    return d;
  }
  function sample(c) {
    const N = c.n || 400, a = [];
    for (let i = 0; i <= N; i++) {
      const t = c.t0 + (c.t1 - c.t0) * i / N, x = c.x(t), y = c.y(t);
      a.push(isFinite(x) && isFinite(y) ? [x, y] : null);
    }
    return a;
  }
  function marksSvg(F, marks) {
    return (marks || []).map(m => `<circle cx="${r1(F.X(m.x))}" cy="${r1(F.Y(m.y))}" r="3.5"/>` +
      (m.label ? `<text x="${r1(F.X(m.x) + (m.dx === undefined ? 6 : m.dx))}" y="${r1(F.Y(m.y) + (m.dy === undefined ? -6 : m.dy))}">${m.label}</text>` : '')).join('');
  }

  /* curves : [{ x(t), y(t), t0, t1, n, cls }]
     opt : { box: [xmin, xmax, ymin, ymax], marks: [{ x, y, label }], lines: [[x1, y1, x2, y2]], w, hmax, free, label } */
  function courbe(curves, opt) {
    opt = opt || {};
    const polys = curves.map(sample);
    const box = opt.box || autoBox([].concat(...polys), (opt.marks || []).map(m => [m.x, m.y]));
    const F = frame(box, opt);
    let s = axes(F);
    (opt.lines || []).forEach(l => { s += `<line class="tg" x1="${r1(F.X(l[0]))}" y1="${r1(F.Y(l[1]))}" x2="${r1(F.X(l[2]))}" y2="${r1(F.Y(l[3]))}"/>`; });
    polys.forEach((p, i) => { s += `<path class="${curves[i].cls || 'cv'}" d="${pathD(F, p, box)}"/>`; });
    s += marksSvg(F, opt.marks);
    return `<svg class="plot" viewBox="0 0 ${r1(F.W)} ${r1(F.H)}" width="${r1(F.W)}" role="img" aria-label="${opt.label || 'courbe'}">${s}</svg>`;
  }

  /* Somme de Riemann : mode 'g' (gauche), 'd' (droite), 'm' (milieu), 't' (trapèzes) */
  function riemann(f, a, b, n, mode, opt) {
    opt = Object.assign({ free: true, hmax: 220, w: 300 }, opt || {});
    const pts = sample({ x: t => t, y: f, t0: a, t1: b, n: 300 });
    let ymin = 0, ymax = 0;
    pts.forEach(p => { if (p) { ymin = Math.min(ymin, p[1]); ymax = Math.max(ymax, p[1]); } });
    const my = (ymax - ymin) * 0.1 || 1, mx = (b - a) * 0.05;
    const box = [a - mx, b + mx, ymin - (ymin < 0 ? my : 0) - my * 0.2, ymax + my];
    const F = frame(box, opt);
    const h = (b - a) / n;
    let s = '';
    for (let k = 0; k < n; k++) {
      const u = a + k * h, v = u + h;
      if (mode === 't') {
        s += `<polygon class="rect" points="${r1(F.X(u))},${r1(F.Y(0))} ${r1(F.X(u))},${r1(F.Y(f(u)))} ${r1(F.X(v))},${r1(F.Y(f(v)))} ${r1(F.X(v))},${r1(F.Y(0))}"/>`;
      } else {
        const val = f(mode === 'd' ? v : mode === 'm' ? (u + v) / 2 : u);
        const top = Math.max(val, 0), bot = Math.min(val, 0);
        s += `<rect class="rect" x="${r1(F.X(u))}" y="${r1(F.Y(top))}" width="${r1(F.X(v) - F.X(u))}" height="${r1(F.Y(bot) - F.Y(top))}"/>`;
      }
    }
    s = axes(F) + s + `<path class="cv" d="${pathD(F, pts, box)}"/>`;
    return `<svg class="plot" viewBox="0 0 ${r1(F.W)} ${r1(F.H)}" width="${r1(F.W)}" role="img" aria-label="${opt.label || 'somme de Riemann'}">${s}</svg>`;
  }

  const fig = (...items) => '<div class="plot-fig">' + items.map(([svg, cap]) => '<figure>' + svg + (cap ? '<figcaption>' + cap + '</figcaption>' : '') + '</figure>').join('') + '</div>';

  return { courbe, riemann, fig };
})();
