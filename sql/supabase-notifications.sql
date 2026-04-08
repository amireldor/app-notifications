create table if not exists notifications (
  id text primary key,
  user_id text not null,
  type text not null,
  title text not null,
  body text null,
  dedupe_key text null,
  actor_user_id text null,
  related_entity_type text null,
  related_entity_id text null,
  data jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  read_at timestamptz null,
  created_at timestamptz not null
);

create unique index if not exists notifications_user_dedupe_key_idx
  on notifications (user_id, dedupe_key)
  where dedupe_key is not null;

create index if not exists notifications_user_created_at_id_idx
  on notifications (user_id, created_at desc, id desc);

create index if not exists notifications_user_is_read_idx
  on notifications (user_id, is_read);
