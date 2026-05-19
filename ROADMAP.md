# 🗺️ Roadmap : TikTok Second Brain

## 🎯 Vision Long Terme
Le but ultime de ce projet est de transformer une simple "sauvegarde de vidéos" en un **outil de gestion de la connaissance intelligent**. Il ne s'agit plus seulement de stocker des vidéos, mais de pouvoir s'y référer facilement, faire des recherches de concepts, et lier des outils (Obsidian, Notion).

---

## ✅ Phase 1 : Fondations (MVP) - [Actuel]
- [x] Interface Web moderne (React/Tailwind).
- [x] Upload de fichiers vidéo MP4 en local.
- [x] Parsing basique pour URL TikTok.
- [x] Pipeline Backend Express.
- [x] Traitement multimodal (Vidéo -> Texte) via Google Gemini 2.5 Flash.
- [x] Sauvegarde en Base de Données (Supabase DB).
- [x] Sauvegarde des médias en Bucket (Supabase Storage).

---

## 🏗️ Phase 2 : Organisation & Recherche (Court terme)
*L'objectif ici est de rendre la consultation de la base de connaissances plus agréable et de mieux organiser le flux grandissant d'informations.*

- **Système de Catégorisation & Tags** : Demander à Gemini de générer automatiquement 3 à 5 mots-clés ("Productivité", "Développement Web", "Recette") à l'enregistrement et pouvoir filtrer par ces tags.
- **Recherche Full-Text** : Implémenter une barre de recherche en haut de la liste pour retrouver un TikTok par un mot clé de son résumé ou de sa transcription.
- **Édition Manuelle** : Pouvoir corriger la transcription ou rajouter des notes personnelles directement sur la fiche d'une vidéo sauvegardée.
- **Support des Favoris** : Marquer les meilleures trouvailles avec une étoile ⭐ pour y accéder rapidement.

---

## 🚀 Phase 3 : Mode "Vrai Second Brain" (Moyen terme)
*Ici on intègre le RAG (Retrieval-Augmented Generation) pour discuter littéralement avec ses propres données TikTok.*

- **Recherche Vectorielle (Vector Search)** : Utiliser `pgvector` dans Supabase pour encoder les résumés sous forme d'embeddings. 
- **Mode "Chat UI"** : Interface façon ChatGPT où l'on pourrait demander : *"Quels étaient les 3 outils d'IA pour générer de la musique dont j'ai sauvegardé les vidéos la semaine dernière ?"*.
- **Extraction Structurée Automatique** : Lors de l'analyse IA, forcer la détection d'entités spécifiques :
  - Outils mentionnés (avec génération des liens potentiels)
  - Livres recommandés
  - Actions (To-Do list extraite de la vidéo)
- **Exports Intégrés** : Bouton d'export en 1 clic vers Notion, Obsidian (Markdown format) ou Roam Research.

---

## 🌍 Phase 4 : Écosystème & Accessibilité (Long terme)
*Rendre l'outil omniprésent et sans friction lors de la consultation.*

- **Extension Navigateur (Chrome/Firefox)** : Un bouton "Sauvegarder dans mon Second Brain" rajouté directement sur l'interface Tiktok.com/Instagram.
- **Support Multiformat** : S'étendre aux Instagram Reels et YouTube Shorts.
- **PWA (Progressive Web App)** : Transformer l'interface Web en application mobile pour qu'on puisse "Partager vers..." depuis l'application mobile native de TikTok, et que la transaction se lance en arrière-plan.
