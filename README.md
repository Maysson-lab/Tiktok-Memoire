# 🧠 RésuméAI : TikTok Second Brain

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC.svg)](https://tailwindcss.com/)
[![Gemini](https://img.shields.io/badge/AI-Gemini_2.5_Flash-orange.svg)](https://deepmind.google/technologies/gemini/)

## 📝 Présentation

**RésuméAI** (anciennement TikTok Second Brain) est un outil personnel conçu pour capturer, analyser et structurer les informations pertinentes trouvées sur TikTok et autres formats courts. 

Chaque jour, nous consommons des dizaines d'idées, d'outils et de tutoriels intéressants sur des vidéos courtes qui finissent par se perdre. Cette application permet de centraliser ces connaissances en téléchargeant directement les vidéos (MP4) ou en fournissant une URL. L'outil extrait le contenu audio, génère une transcription complète, et crée un résumé structuré grâce à l'Intelligence Artificielle.

## ✨ Fonctionnalités Principales

- 📥 **Importation Double** : Possibilité de coller une URL TikTok ou d'uploader directement un fichier vidéo MP4.
- 🤖 **Analyse IA Puissante** : Utilisation du modèle Google Gemini (2.5 Flash Multimodal) pour extraire fidèlement l'audio, le transcrire et en dégager les points clés.
- 💬 **Second Cerveau (RAG Chat)** : Posez des questions en langage naturel à votre propre base de connaissances pour retrouver instantanément un outil ou une idée sauvegardée.
- 🕸️ **Cartographie Interactive (Graph)** : Visualisez les connexions sémantiques entre vos vidéos et les concepts abordés via une représentation en graphe de force.
- 🗄️ **Stockage Résilient** : Hébergement des médias via Supabase Storage.
- 📚 **Recherche Vectorielle** : Recherche sémantique propulsée par `pgvector` et les embeddings IA.

## 🛠️ Stack Technique

- **Frontend** : React 18, Vite, Tailwind CSS, Lucide Icons, Force Graph 2D.
- **Backend / API** : Node.js, Express, middleware Multer.
- **Intelligence Artificielle** : Google GenAI (API Gemini) + Embeddings sémantiques (OpenRouter ou Gemini v1.5).
- **Base de Données & Stockage** : Supabase (PostgreSQL, `pgvector` & Storage).

---

## 🚀 Installation & Configuration

### Prérequis
- Node.js (v18+)
- Une clé API Google Gemini
- Un projet Supabase
- *(Optionnel)* Une clé API OpenRouter pour les modèles d'embedding alternatifs

### 1. Variables d'Environnement
Créez un fichier `.env` à la racine de votre projet en vous basant sur `.env.example` :

```env
GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# OPENROUTER_API_KEY=your_optional_openrouter_key
```

### 2. Configuration Supabase
L'application dépend de Supabase pour le stockage des vidéos et les embeddings vectoriels. Vous devez :
1. Copier le contenu du fichier `supabase_schema.sql`
2. Le coller et l'exécuter dans le **SQL Editor** de votre interface d'administration Supabase.
*(Ce script s'occupera d'activer `pgvector`, créer la table, la fonction RPC dynamique, le bucket de stockage et de configurer l'accès temporaire).*

### 3. Lancer l'application

```bash
# Installation des dépendances
npm install

# Démarrage de l'environnement de développement (Backend + Frontend)
npm run dev
```

L'application sera accessible de manière centralisée (port `3000`).
