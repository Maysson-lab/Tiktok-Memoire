# 🗺️ Roadmap : RésuméAI (Second Brain)

## 🎯 Vision Long Terme
Le but ultime de ce projet est de transformer une simple "sauvegarde de vidéos" en un **outil de gestion de la connaissance intelligent**. Il ne s'agit plus seulement de stocker des vidéos, mais de pouvoir s'y référer facilement, faire des recherches sémantiques, et lier des outils comme Obsidian ou Notion depuis un graphe interactif.

---

## ✅ Phase 1 : Fondations (MVP) - [Terminé]
- [x] Interface Web moderne (React/Tailwind).
- [x] Upload de fichiers vidéo MP4 en local.
- [x] Parsing basique pour URL TikTok.
- [x] Pipeline Backend Express.
- [x] Traitement multimodal (Vidéo -> Texte) via Google Gemini 2.5 Flash.
- [x] Sauvegarde en Base de Données (Supabase DB).
- [x] Sauvegarde des médias en Bucket (Supabase Storage).

---

## ✅ Phase 2 : Organisation & Recherche - [Terminé]
*L'objectif ici est de rendre la consultation de la base de connaissances plus agréable et de mieux organiser le flux grandissant d'informations.*

- [x] **Système de Catégorisation & Tags** : Génération automatique de 3 à 5 mots-clés ("Productivité", "Développement Web", "Recette").
- [x] **Recherche Full-Text** : Implémenter une barre de recherche en haut de la liste pour retrouver un élément rapidement.
- [x] **Édition Manuelle** : Pouvoir corriger la transcription ou rajouter des notes personnelles.
- [x] **Support des Favoris** : Marquer les meilleures trouvailles avec une étoile ⭐ pour y accéder rapidement.

---

## 🚀 Phase 3 : Intelligence Connectée (Moyen terme) - [En Cours]
*Ici on intègre le RAG (Retrieval-Augmented Generation) et la visualisation structurelle complexe.*

- [x] **Recherche Vectorielle (Vector Search)** : Utilisation de `pgvector` et Embeddings IA.
- [x] **Mode "Chat RAG"** : Interface façon ChatGPT pour interroger sa propre base de connaissances.
- [x] **Extraction Structurée** : Détection des Outils, Livres et Actions mentionnés.
- [x] **Visualisation Graphe (Graph View)** : Affichage topologique animée des tags et des vidéos (façon réseau neuronal interactif).
- [ ] **Agent Auto-Organisation** : Déduplication sémantique si deux vidéos partagent le même sujet.

---

## 🌍 Phase 4 : Écosystème & Accessibilité (Long terme)
*Rendre l'outil omniprésent, mobile et hautement connecté.*

- [ ] **Synchronisation Automatique Notion/Obsidian** : Connecter l'API pour que chaque nouveau résumé soit injecté en direct dans le Workspace de l'utilisateur.
- [ ] **Extension Navigateur (Chrome/Firefox/Safari)** : Un bouton "Sauvegarder dans mon Second Brain" rajouté directement sur l'interface Tiktok.com, X.com ou Instagram.
- [ ] **Transcription Audio Locale** : Utiliser `Whisper` local via WebAssembly pour éviter du transit vers les LLMs si désiré, avant la phase de résumé.
- [ ] **Support Multi-Réseaux** : S'étendre aux Instagram Reels, YouTube Shorts et Tweets vidéos.
- [ ] **Synthèse Vocale des Résumés** : Écouter ses propres résumés ou To-Do list générés pendant un trajet (Text-to-Speech ElevenLabs ou Google Cloud).
- [ ] **Interface Progressive Web App (PWA)** : Pouvoir "Partager vers..." depuis l'application mobile native avec exécution en arrière-plan et notifications Push de succès.
