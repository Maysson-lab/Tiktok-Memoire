# 🧠 TikTok Second Brain

## 📝 Présentation

**TikTok Second Brain** est un outil personnel conçu pour capturer, analyser et structurer les informations pertinentes trouvées sur TikTok. 

Chaque jour, nous consommons des dizaines d'idées, d'outils et de tutoriels intéressants sur des vidéos courtes qui finissent par se perdre. Cette application permet de centraliser ces connaissances en téléchargeant directement les vidéos (MP4) ou en fournissant une URL. L'outil extrait le contenu audio, génère une transcription complète, et crée un résumé structuré grâce à l'Intelligence Artificielle.

## ✨ Fonctionnalités Principales

- 📥 **Importation Double** : Possibilité de coller une URL TikTok ou d'uploader directement un fichier vidéo MP4.
- 🤖 **Analyse IA Puissante** : Utilisation du modèle Google Gemini (2.5 Flash Multimodal) pour extraire fidèlement l'audio, le transcrire et en dégager les points clés.
- 🗄️ **Stockage Résilient** : Hébergement des vidéos analysées dans un espace Cloud (Supabase Storage).
- 📚 **Base de Connaissances** : Historique complet et consultable de toutes les vidéos sauvegardées avec leurs transcriptions et résumés.

## 🛠️ Stack Technique

- **Frontend** : React 18, Vite, Tailwind CSS, Lucide Icons.
- **Backend** : Node.js, Express, Multer (pour l'upload).
- **Intelligence Artificielle** : Google GenAI (API Gemini).
- **Base de Données & Stockage** : Supabase (PostgreSQL & Storage).

---

## 🚀 Installation & Configuration

### Prérequis
- Node.js (v18+)
- Une clé API Google Gemini
- Un projet Supabase

### 1. Variables d'Environnement
Créez un fichier `.env` à la racine de votre projet en vous basant sur `.env.example` :

```env
GEMINI_API_KEY=your_gemini_api_key_here
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Configuration Supabase
L'application dépend de Supabase pour le stockage. Vous devez créer :
1. **Un bucket de stockage** : Allez dans "Storage" sur Supabase et créez un bucket public nommé `videos`.
2. **La table de données (Phase 3 Intégrée)** : Exécutez ce script SQL dans l'éditeur SQL de Supabase :
   ```sql
   -- Activer l'extension pgvector
   create extension if not exists vector;

   create table public.tiktok_summaries (
     id uuid default gen_random_uuid() primary key,
     tiktok_url text,
     video_id text,
     author text,
     title text,
     transcription text,
     summary text,
     tags jsonb default '[]'::jsonb,
     tools jsonb default '[]'::jsonb,
     books jsonb default '[]'::jsonb,
     actions jsonb default '[]'::jsonb,
     is_favorite boolean default false,
     notes text,
     embedding vector(768),
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Créer la fonction de recherche de similarité pour le Chat "Second Cerveau"
   create or replace function match_videos (
     query_embedding vector(768),
     match_threshold float,
     match_count int
   )
   returns table (
     id uuid,
     title text,
     summary text,
     transcription text,
     similarity float
   )
   language sql stable
   as $$
     select
       tiktok_summaries.id,
       tiktok_summaries.title,
       tiktok_summaries.summary,
       tiktok_summaries.transcription,
       1 - (tiktok_summaries.embedding <=> query_embedding) as similarity
     from tiktok_summaries
     where 1 - (tiktok_summaries.embedding <=> query_embedding) > match_threshold
     order by similarity desc
     limit match_count;
   $$;
   ```
   *(Si vous avez déjà créé la table dans la Phase 1/2, exécutez ceci pour la mettre à jour :)*
   ```sql
   create extension if not exists vector;
   alter table public.tiktok_summaries 
     add column tools jsonb default '[]'::jsonb,
     add column books jsonb default '[]'::jsonb,
     add column actions jsonb default '[]'::jsonb,
     add column embedding vector(768);
   -- N'oubliez pas d'exécuter la fonction `match_videos` au-dessus.
   ```
3. **Policies (RLS) - TRÈS IMPORTANT** : Pour permettre au backend d'écrire dans la base de données, vous **devez désactiver les Règles de Sécurité RLS** (Row Level Security) (ou fournir une SERVICE_ROLE_KEY).
Si vous avez l'erreur *"new row violates row-level security policy"*, vous devez impérativement exécuter ceci :
   ```sql
   -- Désactiver le RLS pour autoriser l'insertion locale
   alter table public.tiktok_summaries disable row level security;
   ```

### 3. Lancer l'application

```bash
# Installation des dépendances
npm install

# Démarrage de l'environnement de développement (Backend + Frontend)
npm run dev
```

L'application sera accessible sur le port `3000`.
