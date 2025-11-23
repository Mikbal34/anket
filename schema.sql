-- TABLOYU SIFIRLA (Veriler gider!)
drop table if exists public.survey_responses;

create table public.survey_responses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  voter_name text not null,
  
  -- BÖLÜM 1: GENEL ANKET (Boş bırakılabilir)
  wealth_rank jsonb,
  difficulty_rank jsonb,
  relationships_rank jsonb,
  social_rank jsonb,
  housing_rank jsonb,

  -- BÖLÜM 2: O.Ç. TESTİ (Boş bırakılabilir)
  gaddar_rank jsonb,
  frequency_rank jsonb,
  quality_rank jsonb
);

-- Güvenlik
alter table public.survey_responses enable row level security;

create policy "Herkes anket gönderebilir"
on public.survey_responses
for insert
with check (true);

create policy "Herkes sonuçları görebilir"
on public.survey_responses
for select
using (true);
