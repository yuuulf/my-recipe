-- Sample data for Supabase Local. Applied by `supabase start` (first run) and
-- `supabase db reset`. Never run this against production.
--
-- After signing in with Google locally, open
--   http://localhost:5173/join/00000000-0000-4000-8000-000000000101
-- before creating your own recipe note, to join the sample note.

-- A sample owner who cannot sign in: no password, and email sign-up is disabled
-- in config.toml. The on_auth_user_created trigger creates the profile.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'sample@example.com',
  '{"provider": "email", "providers": ["email"]}',
  '{"display_name": "サンプル"}',
  now(),
  now()
);

insert into public.groups (id, name, invite_token, created_by) values (
  '00000000-0000-4000-8000-000000000100',
  'サンプルのレシピノート',
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000001'
);

insert into public.group_members (group_id, user_id, role) values (
  '00000000-0000-4000-8000-000000000100',
  '00000000-0000-4000-8000-000000000001',
  'owner'
);

insert into public.recipes (
  group_id,
  title,
  description,
  ingredients,
  steps,
  tags,
  cooking_time_minutes,
  servings,
  memo,
  created_by,
  updated_by
) values
(
  '00000000-0000-4000-8000-000000000100',
  '豚の生姜焼き',
  '甘辛いタレでご飯がすすむ、定番の家庭料理。',
  array['豚ロース薄切り 300g', '玉ねぎ 1/2個', '醤油 大さじ2', 'みりん 大さじ2', 'すりおろししょうが 小さじ1'],
  array['玉ねぎを薄切りにし、調味料を混ぜ合わせる。', 'フライパンに油を熱し、豚肉を両面焼く。', '玉ねぎを加えてしんなりするまで炒める。', '合わせた調味料を加え、照りが出るまで煮からめる。'],
  array['肉', '簡単', '夕食'],
  20,
  2,
  '少し砂糖を追加してもおいしい。',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001'
),
(
  '00000000-0000-4000-8000-000000000100',
  'ふわとろ親子丼',
  'だしの香りと卵のやさしい味わい。',
  array['鶏もも肉 200g', '玉ねぎ 1/2個', '卵 2個', 'だし汁 100ml', '醤油 大さじ1'],
  array['鶏肉をひと口大、玉ねぎを薄切りにする。', '小鍋でだし汁と調味料、玉ねぎを煮る。', '鶏肉を加えて火を通し、溶き卵を回し入れる。', '半熟で火を止め、ご飯にのせる。'],
  array['鶏肉', '丼', '15分'],
  15,
  2,
  null,
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001'
),
(
  '00000000-0000-4000-8000-000000000100',
  'トマトとツナのパスタ',
  '忙しい日に作りたい、フライパンひとつのパスタ。',
  array['スパゲッティ 200g', 'カットトマト缶 1缶', 'ツナ缶 1缶', 'にんにく 1片'],
  array['にんにくをオリーブオイルで炒める。', 'トマト缶とツナを加えて煮込む。', '茹でたパスタを加えて和える。'],
  array['麺', '簡単', '平日'],
  25,
  2,
  '仕上げに粉チーズをたっぷり。',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001'
);
