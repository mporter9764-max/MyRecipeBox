-- Run this SQL in your Supabase project under SQL Editor

-- 1. User-added recipes
create table user_recipes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default now(),
  title text not null,
  category text,
  servings int,
  prep_time text,
  cook_time text,
  description text,
  ingredients jsonb,
  steps jsonb,
  notes text,
  tags jsonb
);

-- 2. Meal plan (one row per day)
create table meal_plan (
  id uuid default gen_random_uuid() primary key,
  day text not null,
  recipe jsonb not null
);

-- 3. Pantry (single row, entire pantry as JSON)
create table pantry (
  id int primary key default 1,
  data jsonb not null
);

-- Enable public access (no auth for personal use)
alter table user_recipes enable row level security;
alter table meal_plan enable row level security;
alter table pantry enable row level security;

create policy "Allow all" on user_recipes for all using (true) with check (true);
create policy "Allow all" on meal_plan for all using (true) with check (true);
create policy "Allow all" on pantry for all using (true) with check (true);
