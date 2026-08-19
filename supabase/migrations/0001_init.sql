-- ============================================================================
-- 家族関係の地図 — 初期スキーマ
--
-- 家族に関する記録は非常にプライベートなデータとして扱う。
-- すべてのテーブルで Row Level Security を有効にし、
-- 「owner_id = auth.uid()」の行だけを本人が読み書きできるようにする。
--
-- 反映方法:
--   supabase db push
--   （または Supabase Studio の SQL Editor にこの内容を貼り付けて実行）
-- ============================================================================

create extension if not exists "pgcrypto";

-- 更新時刻を自動で更新する
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- families --
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'わたしの家族' check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --------------------------------------------------------- family_members --
create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  relation text not null default '家族' check (char_length(relation) <= 20),
  avatar text not null default '🙂' check (char_length(avatar) <= 8),
  -- 状態は「良好 / 少し気になる / 注意 / 考え中」。診断ではなく本人の目印。
  mood text not null default 'thinking' check (mood in ('good', 'slight', 'careful', 'thinking')),
  notes text check (char_length(notes) <= 2000),
  -- 主観として書かれたプロフィール（印象・想像・大切にしていそうなこと など）
  profile jsonb not null default '{}'::jsonb,
  is_self boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------- relationships --
create table if not exists public.relationships (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  member_a_id uuid not null references public.family_members (id) on delete cascade,
  member_b_id uuid not null references public.family_members (id) on delete cascade,
  status text not null default 'unknown'
    check (status in ('good', 'normal', 'distant', 'tense', 'complex', 'unknown')),
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relationships_distinct_members check (member_a_id <> member_b_id)
);

-- ------------------------------------------------------------------ events --
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text check (char_length(description) <= 4000),
  event_date date not null default current_date,
  importance smallint not null default 3 check (importance between 1 and 5),
  emotion text check (emotion in (
    'joy', 'sadness', 'anger', 'anxiety', 'lonely',
    'relief', 'gratitude', 'tired', 'hope', 'confused'
  )),
  impact text check (char_length(impact) <= 2000),
  member_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ issues --
create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text check (char_length(description) <= 4000),
  -- 頻度と影響は並べ替えのためだけに使う。人の採点には使わない。
  frequency smallint not null default 3 check (frequency between 1 and 5),
  impact smallint not null default 3 check (impact between 1 and 5),
  trouble text check (char_length(trouble) <= 4000),
  desired_state text check (char_length(desired_state) <= 4000),
  next_action text check (char_length(next_action) <= 2000),
  member_ids uuid[] not null default '{}',
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- emotions --
create table if not exists public.emotions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  member_id uuid references public.family_members (id) on delete set null,
  emotion text not null check (emotion in (
    'joy', 'sadness', 'anger', 'anxiety', 'lonely',
    'relief', 'gratitude', 'tired', 'hope', 'confused'
  )),
  intensity smallint not null default 3 check (intensity between 1 and 5),
  context text check (char_length(context) <= 4000),
  desired_response text check (char_length(desired_response) <= 2000),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------- actions --
create table if not exists public.actions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  target_member_id uuid references public.family_members (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  due_date date,
  status text not null default 'todo' check (status in ('todo', 'today', 'done', 'hold')),
  after_feeling text check (char_length(after_feeling) <= 2000),
  reflection text check (char_length(reflection) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------- reviews --
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  went_well text check (char_length(went_well) <= 4000),
  still_on_mind text check (char_length(still_on_mind) <= 4000),
  noticed_change text check (char_length(noticed_change) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ 索引 ---
create index if not exists families_owner_idx on public.families (owner_id);
create index if not exists family_members_family_idx on public.family_members (family_id);
create index if not exists relationships_family_idx on public.relationships (family_id);
create index if not exists events_family_date_idx on public.events (family_id, event_date desc);
create index if not exists issues_family_idx on public.issues (family_id);
create index if not exists emotions_family_logged_idx on public.emotions (family_id, logged_at desc);
create index if not exists actions_family_idx on public.actions (family_id);
create index if not exists reviews_family_idx on public.reviews (family_id);

-- 「自分」は家族ごとに1人まで
create unique index if not exists family_members_single_self_idx
  on public.family_members (family_id)
  where is_self;

-- 同じ2人の関係を重複させない（順序を問わない）
create unique index if not exists relationships_unique_pair_idx
  on public.relationships (
    family_id,
    least(member_a_id, member_b_id),
    greatest(member_a_id, member_b_id)
  );

-- ------------------------------------------------------------- トリガー ----
do $$
declare
  t text;
begin
  foreach t in array array[
    'families', 'family_members', 'relationships',
    'events', 'issues', 'actions', 'reviews'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t
    );
  end loop;
end;
$$;

-- ============================================================================
-- Row Level Security
--   本人（owner_id = auth.uid()）以外は、読むことも書くこともできない。
--   子テーブルは、その家族が本人のものであることも合わせて確認する。
-- ============================================================================

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.relationships enable row level security;
alter table public.events enable row level security;
alter table public.issues enable row level security;
alter table public.emotions enable row level security;
alter table public.actions enable row level security;
alter table public.reviews enable row level security;

-- families
drop policy if exists "families are private" on public.families;
create policy "families are private"
  on public.families
  for all
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- 子テーブル共通のポリシーをまとめて作る
do $$
declare
  t text;
begin
  foreach t in array array[
    'family_members', 'relationships', 'events',
    'issues', 'emotions', 'actions', 'reviews'
  ]
  loop
    execute format('drop policy if exists "%s are private" on public.%I', t, t);
    execute format($p$
      create policy "%s are private"
        on public.%I
        for all
        to authenticated
        using (
          owner_id = (select auth.uid())
          and exists (
            select 1 from public.families f
            where f.id = %I.family_id and f.owner_id = (select auth.uid())
          )
        )
        with check (
          owner_id = (select auth.uid())
          and exists (
            select 1 from public.families f
            where f.id = %I.family_id and f.owner_id = (select auth.uid())
          )
        )
    $p$, t, t, t, t);
  end loop;
end;
$$;

-- 匿名ロールには一切の権限を与えない
revoke all on all tables in schema public from anon;
