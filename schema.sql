-- ÖNCEKİ TABLOYU SİL (Yedek almadıysan veriler gider!)
drop table if exists public.survey_responses;

create table public.survey_responses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  voter_name text not null,
  
  -- BÖLÜM 1: GENEL ANKET
  wealth_rank jsonb not null,       -- Maddiyat
  difficulty_rank jsonb not null,   -- Zorluk
  relationships_rank jsonb not null,-- İlişki
  social_rank jsonb not null,       -- Sosyallik
  housing_rank jsonb not null,      -- Barınma

  -- BÖLÜM 2: O.Ç. TESTİ (YENİ)
  gaddar_rank jsonb not null,       -- En Gaddar
  frequency_rank jsonb not null,    -- En Sık Yapan
  quality_rank jsonb not null       -- En Kaliteli Yapan
);

-- Güvenlik Politikaları
alter table public.survey_responses enable row level security;

create policy "Herkes anket gönderebilir"
on public.survey_responses
for insert
with check (true);

create policy "Herkes sonuçları görebilir"
on public.survey_responses
for select
using (true);
