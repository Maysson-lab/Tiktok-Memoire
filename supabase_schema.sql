-- ==============================================================================
-- SCRIPT DE CONFIGURATION SUPABASE COMPLET (Phases 1, 2 et 3)
-- Copiez et collez entièrement ce script dans l'Éditeur SQL de Supabase.
-- ==============================================================================

-- 1. Activer l'extension pgvector pour la recherche sémantique (Chat IA)
create extension if not exists vector;

-- 2. Créer la table principale regroupant toutes les fonctionnalités
create table if not exists public.tiktok_summaries (
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

-- 3. Désactiver le Row Level Security (RLS) pour éviter les erreurs "violation de RLS"
alter table public.tiktok_summaries disable row level security;

-- (Optionnel) Si vous voulez le purger plus tard et activer un accès public (non recommandé en prod, mais pour du dev rapide)
-- create policy "Allow public insert" on public.tiktok_summaries for insert with check (true);
-- create policy "Allow public select" on public.tiktok_summaries for select using (true);
-- create policy "Allow public update" on public.tiktok_summaries for update using (true);

-- 4. Créer la fonction de recherche de similarité pour le Chat "Second Cerveau"
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

-- IMPORTANT :
-- Après avoir exécuté ce script, n'oubliez pas d'aller dans "Project Settings" -> "API"
-- de Supabase pour vérifier que votre URL et votre `anon key` sont correctes dans l'application.
