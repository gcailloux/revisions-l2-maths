/* Registre global : matières, chapitres rédigés, générateurs. */
window.L2 = (function () {
  'use strict';
  const subjects = [];
  const byId = {};
  const content = {};

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return {
    subjects, byId, content, esc,

    /* Déclare une matière et la liste (ordonnée) de ses chapitres. */
    subject(def) {
      def.chapters.forEach((c, i) => { c.num = i + 1; c.subject = def.id; });
      subjects.push(def);
      byId[def.id] = def;
    },

    /* Enregistre le contenu d'un chapitre :
       { intro, cours:[blocs], fiche:[items], exercices:[...], methodes:[...], generateurs:{id:{title,diff,make(rng)}} } */
    chapter(sid, cid, def) {
      def.sid = sid; def.cid = cid;
      def.cours = def.cours || [];
      def.fiche = def.fiche || [];
      def.exercices = def.exercices || [];
      def.methodes = def.methodes || [];
      def.generateurs = def.generateurs || {};
      content[sid + '/' + cid] = def;
    },

    get(sid, cid) { return content[sid + '/' + cid] || null; },

    /* Bloc de code Python (échappé, coloré au rendu). */
    code(src) {
      return '<pre class="code"><code>' + esc(src.replace(/^\n+|\s+$/g, '')) + '</code></pre>';
    }
  };
})();
