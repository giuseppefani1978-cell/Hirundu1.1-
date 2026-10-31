-- Hirundu Beta invitation backend — REVIEWED STAGING BLUEPRINT ONLY.
-- RUN ONLY on a NEW, DEDICATED Supabase project after security review.
-- NEVER apply to the existing Aracne Trip Planner production project.
-- This script does not create administrator credentials; see docs/HIRUNDU-BETA-BACKEND-SETUP.md.

begin;

create schema if not exists hirundu_private;
revoke all on schema hirundu_private from public, anon, authenticated;

create table if not exists hirundu_private.invites (
  id uuid primary key default gen_random_uuid(),
  code_hash bytea unique not null,
  code_suffix text not null check (length(code_suffix)=6),
  label text not null check (length(label) between 1 and 80),
  is_admin boolean not null default false,
  issued_by uuid references hirundu_private.invites(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  activated_at timestamptz,
  revoked_at timestamptz
);

create table if not exists hirundu_private.sessions (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null unique references hirundu_private.invites(id),
  token_hash bytea not null unique,
  nickname text not null check (length(nickname) between 1 and 60),
  created_at timestamptz not null default now()
);

create table if not exists hirundu_private.feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references hirundu_private.sessions(id),
  category text not null check(category in ('bug','idea','other')),
  level text,
  message text not null check(length(message) between 1 and 2000),
  device text,
  status text not null default 'new' check(status in ('new','progress','resolved')),
  created_at timestamptz not null default now()
);
create index if not exists hirundu_feedback_recent_idx on hirundu_private.feedback (created_at desc);
create index if not exists hirundu_feedback_session_idx on hirundu_private.feedback (session_id, created_at desc);

alter table hirundu_private.invites enable row level security;
alter table hirundu_private.sessions enable row level security;
alter table hirundu_private.feedback enable row level security;
revoke all on all tables in schema hirundu_private from public, anon, authenticated;
revoke all on all sequences in schema hirundu_private from public, anon, authenticated;

-- Public, narrow RPC gateway; never expose private tables to Data API.
-- All authorization is enforced server-side, and sessions are device-token bound.
create or replace function hirundu_private.beta_impl(
  p_action text,
  p_data jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $hirundu$
declare
  token text := coalesce((nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-hirundu-beta'), '');
  actor record;
  has_session boolean := false;
  invite_row hirundu_private.invites%rowtype;
  target uuid;
  code text;
  nickname text;
  label_text text;
  expiry_days integer;
  feedback_id uuid;
  status_text text;
  created_count integer;
begin
  if token !~ '^[a-f0-9]{64}$' then
    return jsonb_build_object('error','beta_required');
  end if;

  select s.id as session_id, i.id as invite_id, i.is_admin, s.nickname
  into actor
  from hirundu_private.sessions s
  join hirundu_private.invites i on i.id=s.invite_id
  where s.token_hash=sha256(convert_to(token,'UTF8'))
    and i.revoked_at is null;
  has_session := found;

  if p_action='activate' then
    code := upper(regexp_replace(coalesce(p_data->>'code',''), '[^A-Fa-f0-9]', '', 'g'));
    nickname := btrim(coalesce(p_data->>'nickname',''));
    if code !~ '^[A-F0-9]{32}$' or length(nickname) not between 1 and 60 then
      return jsonb_build_object('error','invalid_code');
    end if;
    if has_session then
      return jsonb_build_object('ok',true,'admin',actor.is_admin,'nickname',actor.nickname);
    end if;
    select * into invite_row from hirundu_private.invites
    where code_hash=sha256(convert_to(code,'UTF8'))
    for update;
    if not found then return jsonb_build_object('error','invalid_code'); end if;
    if invite_row.revoked_at is not null then return jsonb_build_object('error','revoked_code'); end if;
    if invite_row.activated_at is not null then return jsonb_build_object('error','used_code'); end if;
    if invite_row.expires_at < now() then return jsonb_build_object('error','expired_code'); end if;
    insert into hirundu_private.sessions(invite_id,token_hash,nickname)
    values(invite_row.id,sha256(convert_to(token,'UTF8')),nickname);
    update hirundu_private.invites set activated_at=now() where id=invite_row.id;
    return jsonb_build_object('ok',true,'admin',invite_row.is_admin,'nickname',nickname);
  end if;

  if not has_session then
    return jsonb_build_object('error','beta_required');
  end if;
  if p_action='session' then
    return jsonb_build_object('ok',true,'admin',actor.is_admin,'nickname',actor.nickname);
  end if;

  if p_action='feedback' then
    if coalesce(p_data->>'category','') not in ('bug','idea','other')
      or length(btrim(coalesce(p_data->>'message',''))) not between 1 and 2000
      or length(coalesce(p_data->>'device','')) > 200
      or length(coalesce(p_data->>'level','')) > 30 then
      return jsonb_build_object('error','invalid');
    end if;
    -- Serialize writes from this session to enforce feedback quota atomically.
    perform 1 from hirundu_private.sessions where id=actor.session_id for update;
    select count(*) into created_count from hirundu_private.feedback
      where session_id=actor.session_id and created_at>now()-interval '1 hour';
    if created_count>=15 then return jsonb_build_object('error','quota'); end if;
    insert into hirundu_private.feedback(session_id,category,level,message,device)
    values(actor.session_id,p_data->>'category',left(coalesce(p_data->>'level',''),30),
       btrim(p_data->>'message'),left(coalesce(p_data->>'device',''),200));
    return jsonb_build_object('ok',true);
  end if;

  if not actor.is_admin then return jsonb_build_object('error','denied'); end if;

  if p_action='admin_create_invite' then
    label_text:=btrim(coalesce(p_data->>'label',''));
    expiry_days:=coalesce((p_data->>'days')::integer,14);
    if length(label_text) not between 1 and 80 or expiry_days not between 1 and 30 then
      return jsonb_build_object('error','invalid');
    end if;
    code:=upper(replace(gen_random_uuid()::text,'-',''));
    insert into hirundu_private.invites(code_hash,code_suffix,label,issued_by,expires_at)
    values(sha256(convert_to(code,'UTF8')),right(code,6),label_text,
      actor.invite_id,now()+make_interval(days=>expiry_days))
    returning id into target;
    return jsonb_build_object('ok',true,'code',code,'id',target);
  end if;

  if p_action='dashboard' then
    return jsonb_build_object(
      'ok',true,
      'testers',coalesce((select jsonb_agg(x order by x.created_at desc)
        from (select i.id,i.code_suffix as suffix,i.label,s.nickname,
          i.created_at,i.expires_at,i.activated_at,i.revoked_at
          from hirundu_private.invites i
          left join hirundu_private.sessions s on s.invite_id=i.id
          where not i.is_admin
          order by i.created_at desc limit 500) x),'[]'::jsonb),
      'feedback',coalesce((select jsonb_agg(y order by y.created_at desc)
        from (select f.id,f.category,f.level,f.message,f.device,f.status,f.created_at,s.nickname
          from hirundu_private.feedback f
          join hirundu_private.sessions s on s.id=f.session_id
          order by f.created_at desc limit 500) y),'[]'::jsonb)
    );
  end if;

  if p_action='admin_revoke_invite' then
    target:=(p_data->>'id')::uuid;
    update hirundu_private.invites
      set revoked_at=coalesce(revoked_at,now())
      where id=target and not is_admin;
    if not found then return jsonb_build_object('error','not_found'); end if;
    return jsonb_build_object('ok',true);
  end if;

  if p_action='admin_feedback_status' then
    feedback_id:=(p_data->>'id')::uuid;
    status_text:=coalesce(p_data->>'status','');
    if status_text not in ('new','progress','resolved') then
      return jsonb_build_object('error','invalid');
    end if;
    update hirundu_private.feedback set status=status_text where id=feedback_id;
    if not found then return jsonb_build_object('error','not_found'); end if;
    return jsonb_build_object('ok',true);
  end if;

  return jsonb_build_object('error','invalid_action');
exception
  when invalid_text_representation or invalid_datetime_format or numeric_value_out_of_range then
    return jsonb_build_object('error','invalid');
  when unique_violation then
    return jsonb_build_object('error','used_code');
end
$hirundu$;

-- Limit the elevated implementation to a PRIVATE schema (not exposed in Data API).
revoke all on function hirundu_private.beta_impl(text,jsonb) from public,anon,authenticated;
grant usage on schema hirundu_private to anon,authenticated;
grant execute on function hirundu_private.beta_impl(text,jsonb) to anon,authenticated;

-- Public endpoint is strictly invoker; all privileged database work happens
-- in the private implementation and is controlled by checked bearer tokens.
create or replace function public.hirundu_beta(
  p_action text,
  p_data jsonb default '{}'::jsonb
) returns jsonb
language sql
security invoker
set search_path = ''
as $gateway$
  select hirundu_private.beta_impl(p_action,p_data);
$gateway$;
revoke all on function public.hirundu_beta(text,jsonb) from public,anon,authenticated;
grant execute on function public.hirundu_beta(text,jsonb) to anon,authenticated;

commit;
