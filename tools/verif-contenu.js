/* Outil de vérification (développement uniquement, non chargé par le site).
   Dans la console du navigateur, sur le site lancé en local :
     const s = document.createElement('script'); s.src = 'tools/verif-contenu.js'; document.head.appendChild(s);
   puis : await verifChapitre('probas', 'denombrement', 100)
   Vérifie l'énoncé, la correction et la correction détaillée de chaque exercice, variante et
   exercice généré (graines 1..n) : erreurs KaTeX, « undefined », « NaN », « $ » orphelins. */
(function () {
  'use strict';
  let MAC = null;
  async function macros() {
    if (MAC) return MAC;
    const src = await fetch('js/app.js', { cache: 'reload' }).then(r => r.text());
    MAC = eval('(' + src.match(/const MACROS = (\{[\s\S]*?\n  \});/)[1] + ')');
    return MAC;
  }
  const dh = d => !d ? '' : typeof d === 'string' ? d :
    (d.but || '') + (d.methode || '') + (d.etapes || []).map(s => '<li>' + s + '</li>').join('') + (d.retenir || '');

  window.verifChapitre = async function (sid, cid, seeds) {
    const M = await macros();
    const C = L2.get(sid, cid);
    if (!C) return { sid, cid, erreur: 'chapitre absent' };
    const out = { sid, cid, exercices: 0, generes: 0, errs: [], bad: [], sansDetail: [] };
    const box = document.createElement('div');
    box.style.cssText = 'position:absolute;left:-9999px;width:800px';
    document.body.appendChild(box);
    const test = (label, html) => {
      if (/undefined|NaN|Infinity|\[object/.test(html)) out.bad.push(label + ' : ' + (html.match(/.{40}(undefined|NaN|Infinity|\[object).{20}/) || [''])[0]);
      box.innerHTML = html;
      renderMathInElement(box, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], macros: M, throwOnError: false });
      const ke = box.querySelectorAll('.katex-error');
      if (ke.length) out.errs.push(label + ' : ' + ke[0].title + ' | ' + ke[0].textContent.slice(0, 60));
      if (/\$/.test(box.textContent)) out.bad.push(label + ' : $ orphelin ' + (box.textContent.match(/.{30}\$.{30}/) || [''])[0]);
    };
    const D = C.details || {};
    C.exercices.forEach(e => {
      out.exercices++;
      test(e.id, (e.enonce || '') + (e.indication || '') + (e.correction || ''));
      const d = e.detail || D[e.id];
      if (d) test(e.id + ' (détail)', dh(d)); else out.sansDetail.push(e.id);
      (e.similaires || []).forEach((v, i) => {
        const k = e.id + '#' + (i + 1);
        test(k, (v.enonce || '') + (v.indication || '') + (v.correction || ''));
        const dv = v.detail || D[k];
        if (dv) test(k + ' (détail)', dh(dv)); else out.sansDetail.push(k);
      });
    });
    Object.entries(C.generateurs || {}).forEach(([k, g]) => {
      let missing = false;
      for (let s = 1; s <= (seeds || 50); s++) {
        let it;
        try { it = g.make(ML.rng(s)); } catch (err) { out.errs.push(k + ':' + s + ' : ' + err.message); continue; }
        test(k + ':' + s, (it.enonce || '') + (it.indication || '') + (it.correction || '') + dh(it.detail));
        if (!it.detail) missing = true;
        out.generes++;
      }
      if (missing) out.sansDetail.push('générateur ' + k);
    });
    box.remove();
    out.nErr = out.errs.length; out.errs = out.errs.slice(0, 8);
    out.nBad = out.bad.length; out.bad = out.bad.slice(0, 8);
    return out;
  };
})();
