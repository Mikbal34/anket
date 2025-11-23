-- Eğer tabloyu sıfırdan kuracaksanız hepsini çalıştırın.
-- Sadece güncelleme yapacaksanız en alttaki "alter table" komutunu çalıştırın.

create table public.survey_responses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  voter_name text not null, -- Oy veren kişinin ismi
  
  wealth_rank jsonb not null,
  difficulty_rank jsonb not null,
  relationships_rank jsonb not null,
  social_rank jsonb not null,
  housing_rank jsonb not null
);

alter table public.survey_responses enable row level security;

create policy "Herkes anket gönderebilir"
on public.survey_responses
for insert
with check (true);

create policy "Herkes sonuçları görebilir"
on public.survey_responses
for select
using (true);

-- !!! ÖNEMLİ: Eğer tablo zaten varsa, sadece şu komutu çalıştırın:
-- alter table public.survey_responses add column voter_name text;
