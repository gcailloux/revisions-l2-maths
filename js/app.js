/* Application : routage, rendu des sections, progression (localStorage). */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = L2.esc;
  const main = $('#main');
  const side = $('#sidebar');

  const SECTIONS = [
    { id: 'cours', label: 'Cours', desc: 'Définitions, théorèmes, démonstrations, remarques et exemples.' },
    { id: 'fiches', label: 'Fiches', desc: "L'essentiel du chapitre sur une page, à relire avant un partiel." },
    { id: 'exercices', label: 'Exercices', desc: 'Exercices corrigés, et des exercices « du même genre » à volonté.' },
    { id: 'methodes', label: 'Fiches méthodes', desc: 'Les cas typiques et la façon de les résoudre, pas à pas.' }
  ];
  const SECTION_IDS = SECTIONS.map(s => s.id);

  /* ======================= État persistant ======================= */
  const KEY = 'l2maths-v1';
  function freshState() { return { status: {}, extra: {}, read: {}, theme: null }; }
  let state = (function () {
    try { return Object.assign(freshState(), JSON.parse(localStorage.getItem(KEY)) || {}); }
    catch (e) { return freshState(); }
  })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* stockage indisponible */ } }

  /* ======================= Thème ======================= */
  function applyTheme() {
    if (state.theme) document.documentElement.setAttribute('data-theme', state.theme);
    else document.documentElement.removeAttribute('data-theme');
  }
  applyTheme();
  $('#theme-toggle').addEventListener('click', () => {
    const dark = state.theme ? state.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    state.theme = dark ? 'light' : 'dark';
    applyTheme(); save();
  });
  $('#menu-toggle').addEventListener('click', () => document.body.classList.toggle('nav-open'));

  /* ======================= Rendu mathématique + code ======================= */
  const MACROS = {
    '\\K': '\\mathbb{K}', '\\R': '\\mathbb{R}', '\\C': '\\mathbb{C}', '\\N': '\\mathbb{N}',
    '\\Z': '\\mathbb{Z}', '\\Q': '\\mathbb{Q}', '\\Id': '\\mathrm{Id}', '\\Sp': '\\operatorname{Sp}',
    '\\tr': '\\operatorname{tr}', '\\rg': '\\operatorname{rg}', '\\Vect': '\\operatorname{Vect}',
    '\\Card': '\\operatorname{Card}', '\\Ker': '\\operatorname{Ker}', '\\Imm': '\\operatorname{Im}',
    '\\Proba': '\\mathbb{P}', '\\Esp': '\\mathbb{E}', '\\Var': '\\operatorname{Var}',
    '\\M': '\\mathcal{M}', '\\Lin': '\\mathcal{L}', '\\eps': '\\varepsilon', '\\dd': '\\,\\mathrm{d}'
  };
  const PY_KW = new Set(('def return if elif else while for in and or not None True False import from as pass ' +
    'break continue lambda class is with assert yield global').split(' '));
  const PY_BUILTIN = new Set('print range len abs int float str list dict set tuple min max sum sorted append pop'.split(' '));
  function highlightPy(src) {
    const re = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d+(?:\.\d+)?(?:e-?\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)/g;
    let out = '', last = 0, m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(last, m.index));
      if (m[1]) out += '<span class="tk-com">' + esc(m[1]) + '</span>';
      else if (m[2]) out += '<span class="tk-str">' + esc(m[2]) + '</span>';
      else if (m[3]) out += '<span class="tk-num">' + m[3] + '</span>';
      else {
        const w = m[4];
        if (PY_KW.has(w)) out += '<span class="tk-kw">' + w + '</span>';
        else if (PY_BUILTIN.has(w)) out += '<span class="tk-bi">' + w + '</span>';
        else if (src[re.lastIndex] === '(') out += '<span class="tk-fn">' + w + '</span>';
        else out += w;
      }
      last = re.lastIndex;
    }
    return out + esc(src.slice(last));
  }
  function typeset(el) {
    $$('pre.code code', el).forEach(c => {
      if (!c.dataset.hl) { c.innerHTML = highlightPy(c.textContent); c.dataset.hl = '1'; }
    });
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(el, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\[', right: '\\]', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false }
          ],
          throwOnError: false,
          macros: MACROS
        });
      } catch (e) { console.error(e); }
    }
  }

  /* ======================= Outils ======================= */
  function diffStars(d) {
    d = d || 1;
    return '<span class="diff" title="Difficulté ' + d + '/3">' + '●'.repeat(d) + '<span class="off">' + '●'.repeat(3 - d) + '</span></span>';
  }
  function getStatus(key) { const s = state.status[key]; return s ? s.v : null; }
  function reviewCount() { return Object.values(state.status).filter(s => s.v === 'review').length; }
  function chapterLink(sid, sec, cid) { return '#/s/' + sid + '/' + sec + (cid ? '/' + cid : ''); }
  function availableChapters(s) { return s.chapters.filter(c => L2.get(s.id, c.id)); }
  /* Couleurs de matière : --sc (couleur), --sc-ink-l (texte sur fond clair), --sc-on (texte sur fond --sc) */
  function scStyle(s) { return '--sc:' + s.color + ';--sc-ink-l:' + (s.ink || s.color) + ';--sc-on:' + (s.on || '#fff'); }
  function setRootSc(s) {
    const st = document.documentElement.style;
    if (s) {
      st.setProperty('--sc', s.color); st.setProperty('--sc-ink-l', s.ink || s.color); st.setProperty('--sc-on', s.on || '#fff');
    } else ['--sc', '--sc-ink-l', '--sc-on'].forEach(p => st.removeProperty(p));
  }

  function subjectProgress(s) {
    let total = 0, ok = 0;
    availableChapters(s).forEach(c => {
      L2.get(s.id, c.id).exercices.forEach(e => {
        total++;
        if (getStatus(s.id + '/' + c.id + '/' + e.id) === 'ok') ok++;
      });
    });
    return { total, ok };
  }

  /* ======================= Exercices : construction ======================= */
  function bankExo(sid, cid, e, idx) {
    const key = sid + '/' + cid + '/' + e.id;
    return {
      key, sid, cid, label: 'Exercice ' + (idx + 1), title: e.title, diff: e.diff || 1,
      enonce: e.enonce, indication: e.indication, correction: e.correction,
      gid: e.gen || null, sims: e.similaires || null, exid: e.id, listKey: key
    };
  }
  /* Exercice issu d'un générateur (gid + graine) ou de la banque de variantes (b = indice). */
  function extraExo(sid, cid, item, listKey, label) {
    const C = L2.get(sid, cid);
    if (!C) return null;
    if (item.g) {
      const g = C.generateurs[item.g];
      if (!g) return null;
      let out;
      try { out = g.make(ML.rng(item.s)); }
      catch (err) { console.error(err); out = { enonce: '<p>Erreur lors de la génération.</p>', correction: esc(String(err)) }; }
      return {
        key: listKey + '|' + item.g + '|' + item.s, sid, cid, label, title: out.title || g.title,
        diff: g.diff || 1, enonce: out.enonce, indication: out.indication, correction: out.correction,
        gid: item.g, listKey, generated: true, item
      };
    }
    // variante rédigée (banque)
    const exid = listKey.split('/')[2];
    const e = C.exercices.find(x => x.id === exid);
    const v = e && e.similaires && e.similaires[item.b];
    if (!v) return null;
    return {
      key: listKey + '|b|' + item.b, sid, cid, label, title: v.title || e.title, diff: v.diff || e.diff || 1,
      enonce: v.enonce, indication: v.indication, correction: v.correction,
      sims: e.similaires, exid, listKey, generated: true, item
    };
  }
  function nextExtraItem(ex) {
    if (ex.gid) return { g: ex.gid, s: ML.newSeed() };
    if (ex.sims) {
      const used = new Set((state.extra[ex.listKey] || []).filter(i => i.b !== undefined).map(i => i.b));
      for (let i = 0; i < ex.sims.length; i++) if (!used.has(i)) return { b: i };
    }
    return null;
  }
  function canMore(ex) {
    if (ex.gid) return true;
    if (ex.sims) return nextExtraItem(ex) !== null;
    return false;
  }

  /* Carte d'exercice (DOM). opts.container : conteneur des variantes ;
     opts.onAdded : rappel après ajout. */
  function exoCard(ex, opts) {
    opts = opts || {};
    const el = document.createElement('article');
    el.className = 'exo' + (ex.generated ? ' exo-gen' : '');
    el.dataset.key = ex.key;
    const hasMoreKind = !!(ex.gid || ex.sims);
    el.innerHTML =
      '<div class="exo-head">' +
        '<div class="exo-titles"><span class="exo-label">' + esc(ex.label) + (ex.generated ? ' <span class="tag">' + (ex.gid ? 'généré' : 'variante') + '</span>' : '') + '</span>' +
        '<h3>' + ex.title + '</h3></div>' +
        '<div class="exo-meta">' + diffStars(ex.diff) + '<span class="badge"></span></div>' +
      '</div>' +
      '<div class="exo-body">' + ex.enonce + '</div>' +
      '<div class="exo-ind" hidden><div class="box-title">Indication</div>' + (ex.indication || '') + '</div>' +
      '<div class="exo-cor" hidden><div class="box-title">Correction</div>' + (ex.correction || '<p>Pas de correction rédigée.</p>') + '</div>' +
      '<div class="exo-actions">' +
        (ex.indication ? '<button class="btn ghost" data-a="ind">Indication</button>' : '') +
        '<button class="btn" data-a="cor">Voir la correction</button>' +
        '<span class="grow"></span>' +
        '<button class="btn st st-review" data-a="review" title="Je dois retravailler cet exercice">À retravailler</button>' +
        '<button class="btn st st-ok" data-a="ok" title="Je maîtrise">Maîtrisé</button>' +
        (ex.generated ? '<button class="btn ghost danger" data-a="del" title="Retirer cet exercice">Retirer</button>' : '') +
      '</div>' +
      (hasMoreKind ? '<div class="exo-more"><span class="more-hint">Compris, mais pas encore maîtrisé ?</span>' +
        '<button class="btn accent" data-a="more">+ Un exercice de ce genre</button></div>' : '') +
      (opts.container ? '' : '<div class="exo-extras"></div>');

    const extras = opts.container || $('.exo-extras', el);
    const badge = $('.badge', el);

    function refreshStatus() {
      const st = getStatus(ex.key);
      badge.className = 'badge' + (st ? ' b-' + st : '');
      badge.textContent = st === 'ok' ? 'Maîtrisé' : st === 'review' ? 'À retravailler' : '';
      $$('.st', el).forEach(b => b.classList.toggle('on', b.dataset.a === st));
    }
    function refreshMore() {
      const b = $('[data-a="more"]', el);
      if (!b) return;
      const ok = canMore(ex);
      b.disabled = !ok;
      b.textContent = ok ? '+ Un exercice de ce genre' : 'Plus de variante rédigée pour ce type';
    }
    refreshStatus(); refreshMore();

    el.addEventListener('click', ev => {
      const btn = ev.target.closest('button[data-a]');
      if (!btn || !el.contains(btn) || btn.closest('.exo') !== el) return;
      const a = btn.dataset.a;
      if (a === 'ind') {
        const box = $('.exo-ind', el); box.hidden = !box.hidden;
      } else if (a === 'cor') {
        const box = $('.exo-cor', el); box.hidden = !box.hidden;
        btn.textContent = box.hidden ? 'Voir la correction' : 'Masquer la correction';
        el.classList.toggle('cor-open', !box.hidden);
      } else if (a === 'review' || a === 'ok') {
        if (getStatus(ex.key) === a) delete state.status[ex.key];
        else state.status[ex.key] = { v: a, sid: ex.sid, cid: ex.cid, lk: ex.listKey, item: ex.item || null, exid: ex.exid || null, t: stripTags(ex.title) };
        save(); refreshStatus(); renderSidebar();
        if (statusHook) statusHook();
      } else if (a === 'more') {
        const item = nextExtraItem(ex);
        if (!item) return;
        const list = state.extra[ex.listKey] = state.extra[ex.listKey] || [];
        list.push(item); save();
        const nex = extraExo(ex.sid, ex.cid, item, ex.listKey, 'Variante ' + list.length);
        if (!nex) return;
        const card = exoCard(nex, { container: extras });
        extras.appendChild(card);
        typeset(card);
        card.classList.add('flash');
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        refreshMore();
        if (opts.onAdded) opts.onAdded();
      } else if (a === 'del') {
        const list = state.extra[ex.listKey] || [];
        const i = list.findIndex(it => (it.g ? it.g === ex.item.g && it.s === ex.item.s : it.b === ex.item.b));
        if (i >= 0) list.splice(i, 1);
        delete state.status[ex.key];
        save(); el.remove(); renderSidebar();
      }
    });

    // variantes déjà enregistrées (seulement pour une carte « racine »)
    if (!opts.container) {
      (state.extra[ex.listKey] || []).forEach((item, i) => {
        const nex = extraExo(ex.sid, ex.cid, item, ex.listKey, 'Variante ' + (i + 1));
        if (nex) extras.appendChild(exoCard(nex, { container: extras }));
      });
    }
    return el;
  }
  let statusHook = null; // rappel de la page courante quand un statut change
  function stripTags(s) { const d = document.createElement('div'); d.innerHTML = s; return d.textContent; }

  /* ======================= Barre latérale ======================= */
  let current = [];
  function renderSidebar() {
    const p = current;
    const sid = p[0] === 's' ? p[1] : null;
    const sec = (p[0] === 's' && SECTION_IDS.includes(p[2])) ? p[2] : 'cours';
    const cid = p[3];
    const rc = reviewCount();
    let html =
      '<a class="nav-link ' + (p.length === 0 ? 'active' : '') + '" href="#/">Accueil</a>' +
      '<a class="nav-link ' + (p[0] === 'revisions' ? 'active' : '') + '" href="#/revisions">À retravailler' +
      (rc ? ' <span class="count">' + rc + '</span>' : '') + '</a>' +
      '<div class="nav-title">Matières</div>';
    L2.subjects.forEach(s => {
      const active = s.id === sid;
      html += '<a class="nav-subject ' + (active ? 'active' : '') + '" href="#/s/' + s.id + '" style="' + scStyle(s) + '"><span class="dot"></span>' + esc(s.name) + '</a>';
      if (active) {
        html += '<div class="nav-chapters">' + s.chapters.map(c => {
          const ok = !!L2.get(s.id, c.id);
          return '<a class="nav-chap ' + (c.id === cid ? 'active ' : '') + (ok ? '' : 'pending') + '" href="' + chapterLink(s.id, sec, c.id) + '">' +
            '<span class="num">' + c.num + '</span><span>' + esc(c.title) + '</span></a>';
        }).join('') + '</div>';
      }
    });
    side.innerHTML = html;
  }

  /* ======================= Pages ======================= */
  function renderHome() {
    setRootSc(null);
    const rc = reviewCount();
    main.innerHTML =
      '<section class="hero"><h1>Réviser la L2 de mathématiques</h1>' +
      '<p>Cours détaillés, fiches de synthèse, exercices corrigés générables à volonté et fiches méthodes, ' +
      'organisés par matière et par chapitre — chaque chapitre reste dans sa matière.</p>' +
      '<div class="hero-sections">' + SECTIONS.map(s => '<div><strong>' + s.label + '</strong><span>' + s.desc + '</span></div>').join('') + '</div></section>' +
      (rc ? '<a class="review-banner" href="#/revisions"><strong>' + rc + '</strong> exercice' + (rc > 1 ? 's' : '') + ' marqué' + (rc > 1 ? 's' : '') + ' « à retravailler » →</a>' : '') +
      '<div class="subject-grid">' + L2.subjects.map(s => {
        const av = availableChapters(s).length;
        const pr = subjectProgress(s);
        const pct = pr.total ? Math.round(100 * pr.ok / pr.total) : 0;
        return '<article class="subject-card" style="' + scStyle(s) + '">' +
          '<a class="sc-main" href="#/s/' + s.id + '"><h2>' + esc(s.name) + '</h2><p>' + esc(s.desc) + '</p></a>' +
          '<div class="sc-stats"><span>' + av + '/' + s.chapters.length + ' chapitres rédigés</span><span>' + pr.ok + '/' + pr.total + ' exercices maîtrisés</span></div>' +
          '<div class="bar"><span style="width:' + pct + '%"></span></div>' +
          '<div class="sc-links">' + SECTIONS.map(x => '<a href="' + chapterLink(s.id, x.id) + '">' + x.label + '</a>').join('') + '</div>' +
          '</article>';
      }).join('') + '</div>' +
      '<section class="save-box"><h2>Ma progression</h2>' +
      '<p>Statuts des exercices, exercices générés et chapitres lus sont enregistrés <b>uniquement sur cet appareil</b>, sans connexion ni compte. ' +
      'Pour ne rien perdre (changement d\'appareil, nettoyage du navigateur), fais de temps en temps une sauvegarde dans un fichier.</p>' +
      '<div class="save-actions"><button class="btn" id="export-progress">Sauvegarder dans un fichier</button>' +
      '<label class="btn ghost" for="import-file">Restaurer depuis un fichier</label><input type="file" id="import-file" accept=".json,application/json" hidden>' +
      '<button class="btn ghost danger" id="reset-progress">Tout réinitialiser</button></div>' +
      '<p class="save-msg" id="save-msg"></p></section>';
    $('#export-progress').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify({ app: 'revisions-l2', date: new Date().toISOString(), state }, null, 1)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'progression-L2-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      $('#save-msg').textContent = 'Fichier de sauvegarde créé.';
    });
    $('#import-file').addEventListener('change', ev => {
      const f = ev.target.files[0];
      if (!f) return;
      f.text().then(txt => {
        const data = JSON.parse(txt);
        if (!data || data.app !== 'revisions-l2' || !data.state) throw new Error('format');
        if (!confirm('Remplacer la progression actuelle par celle du fichier (' + (data.date || '').slice(0, 10) + ') ?')) return;
        const theme = state.theme;
        state = Object.assign(freshState(), data.state); state.theme = theme;
        save(); route();
      }).catch(() => { $('#save-msg').textContent = 'Ce fichier n\'est pas une sauvegarde valide.'; });
    });
    $('#reset-progress').addEventListener('click', () => {
      if (confirm('Effacer toute la progression enregistrée (statuts, exercices générés, chapitres lus) ?')) {
        const theme = state.theme; state = freshState(); state.theme = theme; save(); route();
      }
    });
  }

  function subjectHeader(s, sec, ch) {
    const crumbs = '<a href="#/">Accueil</a><span>›</span><a href="#/s/' + s.id + '">' + esc(s.name) + '</a>' +
      (ch ? '<span>›</span><span>Chapitre ' + ch.num + '</span>' : '');
    const tabs = SECTIONS.map(x => '<a class="tab ' + (x.id === sec ? 'active' : '') + '" href="' + chapterLink(s.id, x.id, ch && ch.id) + '">' + x.label + '</a>').join('');
    return '<div class="subject-head"><div class="crumbs">' + crumbs + '</div>' +
      '<h1>' + (ch ? '<span class="chnum">Chapitre ' + ch.num + '</span>' + esc(ch.title) : esc(s.name)) + '</h1>' +
      (ch ? '' : '<p class="subtitle">' + esc(s.desc) + '</p>') +
      '<nav class="tabs">' + tabs + '</nav></div><div id="view"></div>';
  }

  function renderSubject(sid, sec, cid) {
    const s = L2.byId[sid];
    setRootSc(s);
    const ch = cid ? s.chapters.find(c => c.id === cid) : null;
    main.innerHTML = subjectHeader(s, sec, ch);
    const view = $('#view');
    if (cid && !ch) { view.innerHTML = '<p>Chapitre introuvable.</p>'; return; }
    if (!sec) { renderOverview(view, s); return; }
    if (!ch) { renderPicker(view, s, sec); return; }
    const C = L2.get(sid, cid);
    if (!C) {
      view.innerHTML = '<div class="pending-box"><h2>Chapitre en cours de rédaction</h2>' +
        '<p>Le contenu de « ' + esc(ch.title) + ' » n\'est pas encore écrit. Les chapitres déjà disponibles :</p><ul>' +
        availableChapters(s).map(c => '<li><a href="' + chapterLink(sid, sec, c.id) + '">Chapitre ' + c.num + ' — ' + esc(c.title) + '</a></li>').join('') +
        '</ul></div>';
      return;
    }
    ({ cours: renderCours, fiches: renderFiche, exercices: renderExercices, methodes: renderMethodes })[sec](view, s, ch, C);
    view.appendChild(chapterNav(s, sec, ch));
  }

  function renderOverview(view, s) {
    view.innerHTML = '<div class="chapter-list">' + s.chapters.map(c => {
      const C = L2.get(s.id, c.id);
      const read = state.read[s.id + '/' + c.id];
      return '<div class="chapter-row ' + (C ? '' : 'pending') + '">' +
        '<div class="cr-title"><span class="num">' + c.num + '</span><div><strong>' + esc(c.title) + '</strong>' +
        (C ? (read ? ' <span class="tag ok">lu</span>' : '') : ' <span class="tag">en cours de rédaction</span>') + '</div></div>' +
        (C ? '<div class="cr-links">' + SECTIONS.map(x => '<a href="' + chapterLink(s.id, x.id, c.id) + '">' + x.label +
          (x.id === 'exercices' ? ' <small>(' + C.exercices.length + ')</small>' : '') + '</a>').join('') + '</div>' : '') +
        '</div>';
    }).join('') + '</div>';
  }

  function renderPicker(view, s, sec) {
    const secDef = SECTIONS.find(x => x.id === sec);
    view.innerHTML = '<p class="lead">' + secDef.desc + ' Choisis un chapitre :</p><div class="chapter-list">' +
      s.chapters.map(c => {
        const C = L2.get(s.id, c.id);
        return '<a class="chapter-row link ' + (C ? '' : 'pending') + '" href="' + chapterLink(s.id, sec, c.id) + '">' +
          '<div class="cr-title"><span class="num">' + c.num + '</span><strong>' + esc(c.title) + '</strong>' +
          (C ? '' : ' <span class="tag">en cours de rédaction</span>') + '</div></a>';
      }).join('') + '</div>';
  }

  function chapterNav(s, sec, ch) {
    const i = s.chapters.indexOf(ch);
    const prev = s.chapters[i - 1], next = s.chapters[i + 1];
    const nav = document.createElement('nav');
    nav.className = 'chapter-nav';
    nav.innerHTML =
      (prev ? '<a href="' + chapterLink(s.id, sec, prev.id) + '">← Ch. ' + prev.num + ' — ' + esc(prev.title) + '</a>' : '<span></span>') +
      (next ? '<a class="next" href="' + chapterLink(s.id, sec, next.id) + '">Ch. ' + next.num + ' — ' + esc(next.title) + ' →</a>' : '<span></span>');
    return nav;
  }

  /* ----------------------- Cours ----------------------- */
  const LABELS = {
    def: 'Définition', thm: 'Théorème', prop: 'Proposition', lem: 'Lemme', cor: 'Corollaire',
    rem: 'Remarque', ex: 'Exemple', nota: 'Notation', meth: 'Méthode', warn: 'Attention', algo: 'Algorithme'
  };
  const NUMBERED = new Set(['def', 'thm', 'prop', 'lem', 'cor', 'algo']);

  function renderCours(view, s, ch, C) {
    let n = 0, nex = 0, sec = 0;
    const toc = [];
    let html = C.intro ? '<div class="intro">' + C.intro + '</div>' : '';
    C.cours.forEach((b, i) => {
      if (b.t === 'h') {
        sec++;
        const id = 'sec-' + i;
        toc.push({ id, title: sec + '. ' + b.title });
        html += '<h2 class="cours-h" id="' + id + '">' + sec + '. ' + b.title + '</h2>';
        return;
      }
      if (b.t === 'p') { html += '<div class="para">' + b.body + '</div>'; return; }
      let label = LABELS[b.t] || b.t;
      if (NUMBERED.has(b.t)) { n++; label += ' ' + ch.num + '.' + n; }
      if (b.t === 'ex') { nex++; label += ' ' + nex; }
      html += '<section class="blk blk-' + b.t + '">' +
        '<div class="blk-head"><span class="blk-label">' + label + '</span>' + (b.title ? '<span class="blk-title">' + b.title + '</span>' : '') + '</div>' +
        '<div class="blk-body">' + b.body + '</div>' +
        (b.proof ? '<details class="proof"><summary>Démonstration</summary><div class="proof-body">' + b.proof + '<span class="qed">□</span></div></details>' : '') +
        (b.sol ? '<details class="proof"><summary>Solution</summary><div class="proof-body">' + b.sol + '</div></details>' : '') +
        '</section>';
    });
    const key = s.id + '/' + ch.id;
    view.innerHTML =
      '<div class="cours-layout"><article class="cours">' +
        '<div class="cours-tools"><button class="btn ghost" id="open-proofs">Déplier toutes les démonstrations</button></div>' +
        '<details class="toc-mobile"><summary>Plan du chapitre</summary>' +
          toc.map(t => '<button data-target="' + t.id + '">' + t.title + '</button>').join('') + '</details>' +
        html +
        '<div class="cours-end"><button class="btn ' + (state.read[key] ? 'on' : '') + '" id="mark-read">' + (state.read[key] ? '✓ Chapitre lu' : 'Marquer le chapitre comme lu') + '</button>' +
        '<a class="btn ghost" href="' + chapterLink(s.id, 'fiches', ch.id) + '">Voir la fiche</a>' +
        '<a class="btn ghost" href="' + chapterLink(s.id, 'exercices', ch.id) + '">Faire les exercices</a></div>' +
      '</article>' +
      '<aside class="toc"><div class="toc-title">Plan du chapitre</div>' +
        toc.map(t => '<button data-target="' + t.id + '">' + t.title + '</button>').join('') +
      '</aside></div>';
    typeset(view);
    $$('.toc button, .toc-mobile button', view).forEach(b => b.addEventListener('click', () => {
      const d = b.closest('details'); if (d) d.open = false;
      document.getElementById(b.dataset.target).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
    let opened = false;
    $('#open-proofs', view).addEventListener('click', ev => {
      opened = !opened;
      $$('details.proof', view).forEach(d => { d.open = opened; });
      ev.target.textContent = opened ? 'Replier les démonstrations' : 'Déplier toutes les démonstrations';
    });
    $('#mark-read', view).addEventListener('click', ev => {
      if (state.read[key]) delete state.read[key]; else state.read[key] = true;
      save();
      ev.target.classList.toggle('on', !!state.read[key]);
      ev.target.textContent = state.read[key] ? '✓ Chapitre lu' : 'Marquer le chapitre comme lu';
    });
  }

  /* ----------------------- Fiche ----------------------- */
  /* Fiche de cours au format « cahier » (modèle fourni) : titres rouges soulignés, texte bleu,
     hypothèses puis conclusions à puces rouges. Item : { k, t, hyp, concl: [..], b, prio }.
     Dans le contenu : <u> = souligné rouge (condition ou résultat clé), <mark> = surligné. */
  const FICHE_LABELS = { def: 'Définition', thm: 'Théorème', prop: 'Propriété', lemme: 'Lemme', form: 'Formule', meth: 'Méthode', warn: 'Attention', cor: 'Corollaire' };
  function ficheItem(it) {
    const concl = it.concl || (it.key ? [it.key] : []);
    return '<section class="fc fk-' + it.k + (it.prio ? ' prio' : '') + '">' +
      '<h3 class="fc-t">' + (it.prio ? '<span class="fc-star" title="À savoir par cœur">★</span>' : '') +
        '<span class="fc-title">' + it.t + '</span><span class="fc-k">' + (FICHE_LABELS[it.k] || '') + '</span></h3>' +
      (it.hyp ? '<div class="fc-hyp">' + it.hyp + '</div>' : '') +
      (concl.length ? '<ul class="fc-concl">' + concl.map(c => '<li>' + c + '</li>').join('') + '</ul>' : '') +
      (it.b ? '<div class="fc-note">' + it.b + '</div>' : '') +
      '</section>';
  }
  function renderFiche(view, s, ch, C) {
    view.innerHTML =
      '<div class="fiche-tools"><span class="lead"><u>Souligné rouge</u> = condition ou résultat clé · <span class="fc-star">★</span> = à savoir par cœur</span>' +
      '<button class="btn ghost" id="print">Imprimer</button></div>' +
      '<article class="fiche-page">' +
        '<header class="fc-head"><span class="fc-chap">Chap ' + ch.num + '</span>' +
        '<h2>' + esc(ch.title) + '</h2><span class="fc-mat">' + esc(s.name) + '</span></header>' +
        C.fiche.map(ficheItem).join('') +
      '</article>';
    typeset(view);
    $('#print', view).addEventListener('click', () => window.print());
  }

  /* ----------------------- Exercices ----------------------- */
  function renderExercices(view, s, ch, C) {
    const gens = Object.entries(C.generateurs);
    const genKey = 'gen:' + s.id + '/' + ch.id;
    const keys = C.exercices.map(e => s.id + '/' + ch.id + '/' + e.id);
    const nOk = keys.filter(k => getStatus(k) === 'ok').length, nRev = keys.filter(k => getStatus(k) === 'review').length;
    view.innerHTML =
      '<div class="ex-progress"><div class="bar"><span style="width:' + Math.round(100 * nOk / Math.max(1, keys.length)) + '%"></span></div>' +
      '<span><b>' + nOk + '</b>/' + keys.length + ' maîtrisés · <b>' + nRev + '</b> à retravailler · enregistré sur cet appareil</span></div>' +
      '<div class="ex-toolbar"><div class="filters">' +
        ['tous', 'a-faire', 'review', 'ok'].map((f, i) => '<button class="chip ' + (i === 0 ? 'on' : '') + '" data-f="' + f + '">' +
          { tous: 'Tous', 'a-faire': 'Non commencés', review: 'À retravailler', ok: 'Maîtrisés' }[f] + '</button>').join('') +
      '</div></div>' +
      '<div id="exo-list"></div>' +
      (gens.length ? '<section class="training"><h2>Entraînement libre</h2>' +
        '<p class="lead">Génère un nouvel exercice corrigé sur un type précis (les nombres changent à chaque fois).</p>' +
        '<div class="gen-buttons">' + gens.map(([id, g]) => '<button class="btn gen" data-g="' + id + '">' + g.title + ' ' + diffStars(g.diff) + '</button>').join('') + '</div>' +
        '<div id="gen-list"></div></section>' : '');
    const list = $('#exo-list', view);
    C.exercices.forEach((e, i) => list.appendChild(exoCard(bankExo(s.id, ch.id, e, i))));
    statusHook = () => {
      const ok = keys.filter(k => getStatus(k) === 'ok').length, rev = keys.filter(k => getStatus(k) === 'review').length;
      const box = $('.ex-progress', view);
      if (!box) return;
      $('.bar span', box).style.width = Math.round(100 * ok / Math.max(1, keys.length)) + '%';
      $('span:last-child', box).innerHTML = '<b>' + ok + '</b>/' + keys.length + ' maîtrisés · <b>' + rev + '</b> à retravailler · enregistré sur cet appareil';
    };

    const genList = $('#gen-list', view);
    if (genList) {
      (state.extra[genKey] || []).forEach((item, i) => {
        const ex = extraExo(s.id, ch.id, item, genKey, 'Entraînement ' + (i + 1));
        if (ex) genList.appendChild(exoCard(ex, { container: genList }));
      });
      $$('.gen-buttons button', view).forEach(b => b.addEventListener('click', () => {
        const item = { g: b.dataset.g, s: ML.newSeed() };
        const arr = state.extra[genKey] = state.extra[genKey] || [];
        arr.push(item); save();
        const ex = extraExo(s.id, ch.id, item, genKey, 'Entraînement ' + arr.length);
        const card = exoCard(ex, { container: genList });
        genList.appendChild(card);
        typeset(card);
        card.classList.add('flash');
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));
    }
    typeset(view);

    $$('.chip', view).forEach(c => c.addEventListener('click', () => {
      $$('.chip', view).forEach(x => x.classList.toggle('on', x === c));
      const f = c.dataset.f;
      $$('#exo-list > .exo', view).forEach(card => {
        const st = getStatus(card.dataset.key);
        const show = f === 'tous' || (f === 'a-faire' && !st) || f === st;
        card.hidden = !show;
      });
    }));
  }

  /* ----------------------- Fiches méthodes ----------------------- */
  /* Fiches méthodes en deux parties :
     1. un plan de travail général (C.plan) + les exercices types (C.methodes) ;
     2. les cas à reconnaître (C.reperes), rangés par étape du plan, pour ne pas rester bloqué. */
  function renderMethodes(view, s, ch, C) {
    const plan = C.plan, reperes = C.reperes || [];
    const memo = '<section class="memo"><h3 class="memo-h">Les exercices types : <span>je reconnais…</span> → <span>je commence par…</span></h3>' +
      '<div class="memo-list">' + C.methodes.map((m, i) =>
        '<button class="memo-row" data-target="m-' + i + '"><span class="memo-num">' + (i + 1) + '</span>' +
        '<span class="memo-cas">' + (m.cas || m.title) + '</span><span class="memo-arrow" aria-hidden="true">→</span>' +
        '<span class="memo-debut">' + (m.debut || m.etapes[0]) + '</span></button>').join('') +
      '</div></section>';
    if (!plan) { view.innerHTML = memo; }
    else {
      const countFor = k => reperes.filter(r => r.etape === k).length;
      view.innerHTML =
        '<nav class="parts-nav">' +
          '<button data-target="part-1"><span class="pn">1</span>Plan de travail</button>' +
          '<button data-target="part-2"><span class="pn">2</span>Cas à reconnaître</button></nav>' +
        '<section class="part" id="part-1">' +
          '<header class="part-h"><span class="part-num">1</span><div><h2>Plan de travail</h2>' +
          '<p>Le plan d\'analyse et de travail, <b>valable pour tous les exercices</b> du chapitre. À suivre dans l\'ordre.</p></div></header>' +
          (plan.intro ? '<div class="plan-intro">' + plan.intro + '</div>' : '') +
          '<ol class="plan">' + plan.etapes.map((e, k) => {
            const n = countFor(k + 1);
            return '<li class="plan-step"><div class="ps-num">' + (k + 1) + '</div><div class="ps-body">' +
              '<div class="ps-title">' + e.titre + '</div><div class="ps-do">' + e.faire + '</div>' +
              (e.questions ? '<div class="ps-q"><span class="m-label">Je me demande</span><ul>' + e.questions.map(q => '<li>' + q + '</li>').join('') + '</ul></div>' : '') +
              (n ? '<button class="ps-stuck" data-target="rep-' + (k + 1) + '">Bloqué à cette étape ? <b>' + n + ' cas à reconnaître</b> →</button>' : '') +
              '</div></li>';
          }).join('') + '</ol>' +
          '<h3 class="sub-h">Méthodes détaillées par type d\'exercice</h3>' + memo +
          '<div id="meth-cards"></div>' +
        '</section>' +
        '<section class="part" id="part-2">' +
          '<header class="part-h"><span class="part-num">2</span><div><h2>Cas à reconnaître</h2>' +
          '<p>Pour ne pas rester bloqué à une étape du plan : <b>si je vois…</b> → <b>j\'essaie…</b></p></div></header>' +
          plan.etapes.map((e, k) => {
            const items = reperes.filter(r => r.etape === k + 1);
            if (!items.length) return '';
            return '<div class="rep-group" id="rep-' + (k + 1) + '"><h3><span class="step-chip">Étape ' + (k + 1) + '</span>' + e.titre + '</h3>' +
              '<div class="rep-list">' + items.map(r =>
                '<div class="rep"><div class="rep-si"><span class="rep-tag">Si je vois</span><div>' + r.si + '</div></div>' +
                '<div class="rep-alors"><span class="rep-tag">J\'essaie</span><div>' + r.alors + '</div></div>' +
                (r.ex ? '<details class="rep-ex"><summary>Exemple</summary><div>' + r.ex + '</div></details>' : '') + '</div>').join('') +
              '</div></div>';
          }).join('') +
        '</section>';
    }
    const cardsHost = $('#meth-cards', view) || view;
    C.methodes.forEach((m, i) => {
      const card = document.createElement('section');
      card.className = 'methode';
      card.id = 'm-' + i;
      card.innerHTML =
        '<h2><span class="mnum">' + (i + 1) + '</span>' + m.title + '</h2>' +
        (m.cas ? '<div class="m-trigger"><div class="m-cas"><span class="m-tag">Cas</span><div>' + m.cas + '</div></div>' +
          '<div class="m-arrow" aria-hidden="true">→</div>' +
          '<div class="m-debut"><span class="m-tag">Je commence par</span><div>' + m.debut + '</div></div></div>'
          : (m.quand ? '<div class="m-when"><span class="m-label">Quand l\'utiliser</span>' + m.quand + '</div>' : '')) +
        '<div class="m-steps"><span class="m-label">Le processus complet</span><ol class="steps">' +
          m.etapes.map((e, k) => '<li' + (k === 0 ? ' class="first"' : '') + '>' + e + '</li>').join('') + '</ol></div>' +
        (m.exemple ? '<div class="m-example"><span class="m-label">Exemple type</span>' + m.exemple.enonce +
          '<details class="proof"><summary>Résolution rédigée</summary><div class="proof-body">' + m.exemple.solution + '</div></details></div>' : '') +
        (m.pieges ? '<div class="m-traps"><span class="m-label">Pièges classiques</span><ul>' + m.pieges.map(p => '<li>' + p + '</li>').join('') + '</ul></div>' : '') +
        (m.gen ? '<div class="m-practice"><button class="btn accent" data-g="' + m.gen + '">S\'entraîner sur ce cas</button></div><div class="m-list"></div>' : '');
      cardsHost.appendChild(card);
      if (m.gen) {
        const lk = 'meth:' + s.id + '/' + ch.id + '/' + i;
        const ml = $('.m-list', card);
        (state.extra[lk] || []).forEach((item, k) => {
          const ex = extraExo(s.id, ch.id, item, lk, 'Entraînement ' + (k + 1));
          if (ex) ml.appendChild(exoCard(ex, { container: ml }));
        });
        $('.m-practice button', card).addEventListener('click', () => {
          const item = { g: m.gen, s: ML.newSeed() };
          const arr = state.extra[lk] = state.extra[lk] || [];
          arr.push(item); save();
          const c2 = exoCard(extraExo(s.id, ch.id, item, lk, 'Entraînement ' + arr.length), { container: ml });
          ml.appendChild(c2); typeset(c2); c2.classList.add('flash');
          c2.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    });
    typeset(view);
    $$('.memo-row, .parts-nav button, .ps-stuck', view).forEach(b => b.addEventListener('click', () => {
      const t = document.getElementById(b.dataset.target);
      t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      t.classList.remove('flash'); void t.offsetWidth; t.classList.add('flash');
    }));
  }

  /* ----------------------- À retravailler ----------------------- */
  function renderReview() {
    setRootSc(null);
    main.innerHTML = '<div class="subject-head"><div class="crumbs"><a href="#/">Accueil</a><span>›</span><span>À retravailler</span></div>' +
      '<h1>À retravailler</h1><p class="subtitle">Tous les exercices que tu as marqués « à retravailler », regroupés par matière et chapitre.</p></div><div id="view"></div>';
    const view = $('#view');
    const entries = Object.entries(state.status).filter(([, v]) => v.v === 'review');
    if (!entries.length) {
      view.innerHTML = '<div class="pending-box"><p>Rien pour l\'instant. Dans les exercices, le bouton « À retravailler » ajoute un exercice ici.</p></div>';
      return;
    }
    L2.subjects.forEach(s => {
      s.chapters.forEach(c => {
        const mine = entries.filter(([, v]) => v.sid === s.id && v.cid === c.id);
        if (!mine.length) return;
        const C = L2.get(s.id, c.id);
        if (!C) return;
        const h = document.createElement('h2');
        h.className = 'review-h';
        h.setAttribute('style', scStyle(s));
        h.innerHTML = '<span class="dot"></span>' + esc(s.name) + ' — Ch. ' + c.num + ' : ' + esc(c.title);
        view.appendChild(h);
        mine.forEach(([key, v]) => {
          let ex = null;
          if (v.item) ex = extraExo(s.id, c.id, v.item, v.lk, 'Variante');
          else {
            const i = C.exercices.findIndex(e => s.id + '/' + c.id + '/' + e.id === key);
            if (i >= 0) ex = bankExo(s.id, c.id, C.exercices[i], i);
          }
          if (ex) {
            const holder = document.createElement('div');
            const card = exoCard(ex, ex.generated ? { container: holder } : {});
            view.appendChild(card); view.appendChild(holder);
          }
        });
      });
    });
    typeset(view);
  }

  /* ======================= Routeur ======================= */
  function route() {
    const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    current = p;
    statusHook = null;
    document.body.classList.remove('nav-open');
    if (p[0] === 's' && L2.byId[p[1]]) {
      const sec = SECTION_IDS.includes(p[2]) ? p[2] : null;
      renderSubject(p[1], sec, sec ? p[3] : null);
    } else if (p[0] === 'revisions') {
      renderReview();
    } else {
      current = [];
      renderHome();
    }
    renderSidebar();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  route();

  /* ======================= Hors ligne ======================= */
  // Service worker : met tout le site en cache (nécessite http(s), donc pas en file://).
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('Service worker :', err));
  }
  // Demande au navigateur de ne pas effacer les données enregistrées (progression).
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then(p => { if (!p) navigator.storage.persist(); }).catch(() => {});
  }
})();
