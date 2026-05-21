# 🌌 Roadmap : Amélioration de la Cartographie Interactive (Graph View)

Ce document détaille les différentes pistes d'évolution pour transformer la vue "Graphe" en un véritable explorateur neuronal de votre base de connaissances.

## 🎯 Vision
Faire en sorte que le graphe ne soit pas une simple visualisation statique, mais un outil d'exploration permettant de découvrir des relations inattendues entre des vidéos, des outils, des livres et des concepts.

---

## 🛠️ Phase 1 : Interactions et UX (Court Terme)

- [ ] **Mise en valeur au survol (Hover Effect)** : Mettre en surbrillance le nœud survolé et ses connexions directes (diminuer l'opacité du reste du graphe).
- [ ] **Tooltips intelligents** : Afficher un aperçu rapide (titre, résumé court, miniatures) lorsqu'on survole le nœud d'une vidéo.
- [ ] **Filtres interactifs** : Ajouter des boutons cliquables dans la légende permettant de masquer/afficher spécifiquement certaines catégories (ex: cacher les tags, ne garder que les Outils et Livres).
- [ ] **Zoom et centrage automatiques** : Double-cliquer sur un nœud (tag ou vidéo) pour recentrer la caméra dessus ou l'isoler.

---

## 🧠 Phase 2 : Richesse Sémantique & Liens (Moyen Terme)

- [ ] **Épaisseur des liens dynamique (Weighting)** : Rendre la connexion plus épaisse si un tag est la thématique principale ou si la vidéo est particulièrement longue/dense sur le sujet.
- [ ] **Regroupement (Clustering) IA** : Rassembler automatiquement les tags redondants ("Productivité" et "Organisation") en clusters (super-nœuds) s'ils partagent une proximité sémantique (via Vector Search).
- [ ] **Liens transversaux** : Lier directement deux vidéos si leur score de similarité vectorielle (embeddings) dépasse 90%.
- [ ] **Personnalisation physique** : Donner à l'utilisateur des sliders pour gérer la "gravité", la "répulsion" (éloigner les branches) ou la distance des liens.

---

## 🚀 Phase 3 : Mode "Investigation" & Vues Complètes (Long Terme)

- [ ] **Sauvegarde de disposition** : Figer les coordonnées X/Y des nœuds une fois positionnés pour pouvoir conserver sa cartographie personnalisée à chaque ouverture.
- [ ] **Intégration Temporelle (Timeline Graph)** : Coupler le graphe à un slider temporel pour voir la base de connaissances "grandir" au fil des mois écoulés.
- [ ] **Graphe 3D** : Option de bascule entre la vue 2D et une vue `react-force-graph-3d` pour une immersion façon Voie Lactée de la donnée.
- [ ] **Export en PNG / SVG** : Pouvoir capturer sa cartographie pour l'utiliser dans un article de blog ou sur Notion/Obsidian.
