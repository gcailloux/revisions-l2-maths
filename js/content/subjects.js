/* Matières et plans de chapitres (L2 Mathématiques, semestre 3).
   Les chapitres sans fichier de contenu apparaissent « en cours de rédaction ». */

L2.subject({
  id: 'algebre3', name: 'Algèbre 3', color: '#f2a100', ink: '#9a5a00', on: '#2b1a00',
  desc: 'Réduction des endomorphismes : déterminants, éléments propres, diagonalisation, trigonalisation.',
  chapters: [
    { id: 'rappels', title: 'Rappels : espaces vectoriels, applications linéaires, matrices' },
    { id: 'determinants', title: 'Déterminants' },
    { id: 'vp', title: 'Valeurs propres et vecteurs propres' },
    { id: 'diagonalisation', title: 'Diagonalisation' },
    { id: 'polynomes-endo', title: "Polynômes d'endomorphismes" },
    { id: 'trigonalisation', title: 'Trigonalisation et applications' }
  ]
});

L2.subject({
  id: 'analyse3', name: 'Analyse 3', color: '#1c6fd1', ink: '#1659a8', on: '#ffffff',
  desc: 'Séries numériques, intégrales généralisées, séries de fonctions, séries entières.',
  chapters: [
    { id: 'asymptotique', title: 'Comparaison asymptotique' },
    { id: 'series', title: 'Séries numériques' },
    { id: 'integrales-gen', title: 'Intégrales généralisées' },
    { id: 'series-fonctions', title: 'Séries de fonctions' },
    { id: 'series-entieres', title: 'Séries entières' }
  ]
});

L2.subject({
  id: 'probas', name: 'Probabilités et statistiques 1', color: '#2b8a3e', ink: '#237032', on: '#ffffff',
  desc: 'Dénombrement, espaces probabilisés, variables aléatoires discrètes, statistique descriptive.',
  chapters: [
    { id: 'denombrement', title: 'Dénombrement' },
    { id: 'espaces-proba', title: 'Espaces probabilisés' },
    { id: 'conditionnement', title: 'Conditionnement et indépendance' },
    { id: 'va-discretes', title: 'Variables aléatoires discrètes, lois usuelles' },
    { id: 'esperance', title: 'Espérance, variance, couples' },
    { id: 'lgn', title: 'Inégalités et loi faible des grands nombres' },
    { id: 'stat-desc', title: 'Statistique descriptive' }
  ]
});

L2.subject({
  id: 'algo', name: 'Algorithmique', color: '#e8590c', ink: '#c2440a', on: '#ffffff',
  desc: 'Algorithmique en Python : listes et tris élémentaires, arbres, tris élaborés.',
  chapters: [
    { id: 'listes', title: 'Listes', sections: [
      'Opérations : recherche, insertion, suppression',
      'Listes triées : tri par insertion, par sélection, à bulles ; recherche dichotomique',
      'Efficacité d’un algorithme : pire des cas, cas moyen'] },
    { id: 'arbres', title: 'Arbres', sections: [
      'Terminologie : nœud, fils, père, racine, hauteur',
      'Encodage des arbres (implémentations)',
      'Parcours d’arbres : préfixe, postfixe, récursifs et itératifs',
      'Arbres binaires de recherche : implémentation, parcours infixe, recherche, insertion, suppression'] },
    { id: 'tris', title: 'Tris élaborés', sections: [
      'Tri par tas : insertion, suppression, tri',
      'Tri rapide : algorithmes récursif et itératif',
      'Complexité des tris : tris élémentaires, tri par tas'] }
  ]
});

L2.subject({
  id: 'aai', name: 'Analyse et applications informatiques', color: '#15aabf', ink: '#0b7285', on: '#ffffff',
  desc: 'Suites de fonctions, intégration (sommes de Riemann, continuité uniforme), courbes paramétrées.',
  chapters: [
    { id: 'suites-fonctions', title: 'Suites de fonctions : convergence simple, convergence uniforme' },
    { id: 'riemann', title: 'Intégration, sommes de Riemann et continuité uniforme' },
    { id: 'courbes', title: 'Courbes paramétrées' }
  ]
});
