create extension if not exists pgcrypto;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  org_type text not null,
  address text,
  country text not null,
  region text,
  status text not null default 'pending_verification',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists organizations_email_unique on organizations (lower(email));

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  role text not null,
  email text not null,
  name text,
  password_hash text,
  google_sub text,
  auth_provider text not null default 'password',
  status text not null default 'pending_verification',
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists users_email_unique on users (lower(email));
create index if not exists users_org_id_idx on users (org_id);
create index if not exists users_role_status_idx on users (role, status);

create table if not exists verification_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  email text not null,
  purpose text not null,
  code_hash text not null,
  attempts integer not null default 0,
  metadata jsonb,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists verification_codes_lookup_idx
  on verification_codes (lower(email), purpose, consumed_at, expires_at);

create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists password_reset_tokens_hash_unique on password_reset_tokens (token_hash);

create table if not exists auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null,
  user_agent text,
  ip_address text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists auth_sessions_hash_unique on auth_sessions (token_hash);
create index if not exists auth_sessions_user_id_idx on auth_sessions (user_id);

create table if not exists teacher_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  teacher_id uuid not null references users(id) on delete cascade,
  invited_by_user_id uuid references users(id) on delete set null,
  email text not null,
  token_hash text not null,
  status text not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists teacher_invitations_hash_unique on teacher_invitations (token_hash);
create index if not exists teacher_invitations_org_id_idx on teacher_invitations (org_id);
create index if not exists teacher_invitations_teacher_id_idx on teacher_invitations (teacher_id);
