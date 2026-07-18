-- ================================================================
-- VYETA CREDITS — MASTER SCHEMA  (v2)
-- Run this entire file ONCE in Supabase → SQL Editor → New query
-- Safe to re-run: uses CREATE IF NOT EXISTS / OR REPLACE throughout
-- ================================================================

-- ── 1. PROFILES ──────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null default 'New user',
  email         text not null,
  balance       numeric(14,2) not null default 1000.00 check (balance >= 0),
  role          text not null default 'user' check (role in ('user','admin')),
  is_active     boolean not null default true,
  is_treasury   boolean not null default false,
  created_at    timestamptz not null default now()
);

create unique index if not exists one_treasury_account
  on public.profiles (is_treasury) where is_treasury = true;

alter table public.profiles enable row level security;

drop policy if exists "Profiles viewable by authenticated" on public.profiles;
create policy "Profiles viewable by authenticated"
  on public.profiles for select to authenticated using (true);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- ── 2. AUTO-CREATE PROFILE ON SIGNUP (1 000 CR starting balance) ─
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, balance)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.email,
    1000.00
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 3. TRANSACTIONS ───────────────────────────────────────────────
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  sender_id   uuid not null references public.profiles(id),
  receiver_id uuid not null references public.profiles(id),
  amount      numeric(14,2) not null check (amount > 0),
  fee         numeric(14,2) not null default 0 check (fee >= 0),
  status      text not null default 'completed' check (status in ('completed','failed')),
  created_at  timestamptz not null default now(),
  constraint sender_not_receiver check (sender_id <> receiver_id)
);

alter table public.transactions enable row level security;

drop policy if exists "Users see own transactions" on public.transactions;
create policy "Users see own transactions"
  on public.transactions for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id or public.is_admin());

-- ── 4. APP SETTINGS (exchange rate) ──────────────────────────────
create table if not exists public.app_settings (
  key        text primary key,
  value      numeric(14,6) not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
  values ('zmw_rate', 0.42)
  on conflict (key) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "Authenticated read settings" on public.app_settings;
create policy "Authenticated read settings"
  on public.app_settings for select to authenticated using (true);

grant select on public.app_settings to authenticated;

-- ── 5. SERVICES CATALOG ───────────────────────────────────────────
create table if not exists public.services (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  description      text,
  category         text not null default 'General',
  price            numeric(14,2) not null check (price >= 0),
  billing_interval text not null default 'monthly'
                   check (billing_interval in ('one_time','monthly','yearly')),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

alter table public.services enable row level security;

drop policy if exists "Active services readable" on public.services;
create policy "Active services readable"
  on public.services for select to authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "Admins manage services" on public.services;
create policy "Admins manage services"
  on public.services for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── 6. SUBSCRIPTIONS ─────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id),
  service_id         uuid not null references public.services(id),
  status             text not null default 'active' check (status in ('active','cancelled')),
  started_at         timestamptz not null default now(),
  current_period_end timestamptz,
  created_at         timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "Users see own subscriptions" on public.subscriptions;
create policy "Users see own subscriptions"
  on public.subscriptions for select to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ── 7. SERVICE PAYMENTS ───────────────────────────────────────────
create table if not exists public.service_payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id),
  service_id      uuid not null references public.services(id),
  subscription_id uuid not null references public.subscriptions(id),
  amount          numeric(14,2) not null,
  created_at      timestamptz not null default now()
);

alter table public.service_payments enable row level security;

drop policy if exists "Users see own payments" on public.service_payments;
create policy "Users see own payments"
  on public.service_payments for select to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ── 8. ADMIN ADJUSTMENTS LOG ─────────────────────────────────────
create table if not exists public.admin_adjustments (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid not null references public.profiles(id),
  user_id    uuid not null references public.profiles(id),
  amount     numeric(14,2) not null,
  reason     text,
  created_at timestamptz not null default now()
);

alter table public.admin_adjustments enable row level security;

drop policy if exists "Admins view adjustments" on public.admin_adjustments;
create policy "Admins view adjustments"
  on public.admin_adjustments for select to authenticated
  using (public.is_admin());

-- ── 9. VIEWS ─────────────────────────────────────────────────────
create or replace view public.transactions_view
  with (security_invoker = true) as
  select t.id, t.sender_id, t.receiver_id, t.amount, t.fee, t.status, t.created_at,
    sp.full_name as sender_name, rp.full_name as receiver_name
  from public.transactions t
  join public.profiles sp on sp.id = t.sender_id
  join public.profiles rp on rp.id = t.receiver_id;

grant select on public.transactions_view to authenticated;

create or replace view public.subscriptions_view
  with (security_invoker = true) as
  select s.id, s.user_id, s.service_id, s.status, s.started_at, s.current_period_end,
    sv.name as service_name, sv.category, sv.price, sv.billing_interval,
    p.full_name as user_name, p.email as user_email
  from public.subscriptions s
  join public.services sv on sv.id = s.service_id
  join public.profiles p on p.id = s.user_id;

grant select on public.subscriptions_view to authenticated;

-- ── 10. HELPER FUNCTIONS ──────────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.calculate_fee(p_amount numeric)
returns numeric language plpgsql immutable as $$
declare v_rate numeric;
begin
  if p_amount <= 50 then v_rate := 0;
  elsif p_amount <= 250 then v_rate := 0.005;
  elsif p_amount <= 1000 then v_rate := 0.012;
  else v_rate := 0.02;
  end if;
  return round(p_amount * v_rate, 2);
end;
$$;

-- ── 11. SEND CREDITS (atomic transfer) ───────────────────────────
create or replace function public.send_credits(p_receiver_id uuid, p_amount numeric)
returns public.transactions language plpgsql security definer set search_path = public as $$
declare
  v_sender_id      uuid := auth.uid();
  v_fee            numeric;
  v_total          numeric;
  v_sender_balance numeric;
  v_sender_active  boolean;
  v_receiver_active boolean;
  v_tx             public.transactions;
begin
  if v_sender_id is null then raise exception 'Not authenticated'; end if;
  if coalesce(p_amount,0) <= 0 then raise exception 'Amount must be greater than zero'; end if;
  if p_receiver_id = v_sender_id then raise exception 'Cannot send credits to yourself'; end if;

  v_fee   := public.calculate_fee(p_amount);
  v_total := p_amount + v_fee;

  select balance, is_active into v_sender_balance, v_sender_active
    from public.profiles where id = v_sender_id for update;

  if v_sender_balance is null then raise exception 'Sender profile not found'; end if;
  if not v_sender_active then raise exception 'Your account has been frozen'; end if;
  if v_sender_balance < v_total then raise exception 'Insufficient balance for amount plus fee'; end if;

  select is_active into v_receiver_active from public.profiles where id = p_receiver_id;
  if v_receiver_active is null then raise exception 'Receiver not found'; end if;
  if not v_receiver_active then raise exception 'Receiver account is frozen'; end if;

  update public.profiles set balance = balance - v_total where id = v_sender_id;
  update public.profiles set balance = balance + p_amount where id = p_receiver_id;

  insert into public.transactions (sender_id, receiver_id, amount, fee, status)
    values (v_sender_id, p_receiver_id, p_amount, v_fee, 'completed')
    returning * into v_tx;

  return v_tx;
end;
$$;

grant execute on function public.send_credits(uuid, numeric) to authenticated;

-- ── 12. PURCHASE SERVICE (credits → treasury) ────────────────────
create or replace function public.purchase_service(p_service_id uuid)
returns public.subscriptions language plpgsql security definer set search_path = public as $$
declare
  v_user_id     uuid := auth.uid();
  v_treasury_id uuid;
  v_service     public.services;
  v_existing    public.subscriptions;
  v_balance     numeric;
  v_active      boolean;
  v_period_end  timestamptz;
  v_sub         public.subscriptions;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;

  select id into v_treasury_id from public.profiles where is_treasury = true limit 1;
  if v_treasury_id is null then raise exception 'No treasury account configured — contact an admin'; end if;

  select * into v_service from public.services where id = p_service_id and is_active = true;
  if v_service is null then raise exception 'Service not available'; end if;

  select * into v_existing from public.subscriptions
    where user_id = v_user_id and service_id = p_service_id
    order by created_at desc limit 1;

  if v_existing.id is not null and v_existing.status = 'active' then
    if v_existing.current_period_end is null then raise exception 'Already subscribed to this service'; end if;
    if v_existing.current_period_end > now() then raise exception 'Renewal not due yet'; end if;
  end if;

  select balance, is_active into v_balance, v_active from public.profiles
    where id = v_user_id for update;

  if not coalesce(v_active, false) then raise exception 'Your account has been frozen'; end if;
  if v_balance < v_service.price then raise exception 'Insufficient balance for this service'; end if;

  if v_treasury_id <> v_user_id then
    perform 1 from public.profiles where id = v_treasury_id for update;
  end if;

  update public.profiles set balance = balance - v_service.price where id = v_user_id;
  update public.profiles set balance = balance + v_service.price where id = v_treasury_id;

  v_period_end := case v_service.billing_interval
    when 'monthly' then now() + interval '30 days'
    when 'yearly'  then now() + interval '365 days'
    else null end;

  if v_existing.id is not null then
    update public.subscriptions
      set status = 'active', started_at = now(), current_period_end = v_period_end
      where id = v_existing.id returning * into v_sub;
  else
    insert into public.subscriptions (user_id, service_id, status, current_period_end)
      values (v_user_id, p_service_id, 'active', v_period_end) returning * into v_sub;
  end if;

  insert into public.service_payments (user_id, service_id, subscription_id, amount)
    values (v_user_id, p_service_id, v_sub.id, v_service.price);

  return v_sub;
end;
$$;

grant execute on function public.purchase_service(uuid) to authenticated;

-- ── 13. CANCEL SUBSCRIPTION ──────────────────────────────────────
create or replace function public.cancel_subscription(p_subscription_id uuid)
returns public.subscriptions language plpgsql security definer set search_path = public as $$
declare v_sub public.subscriptions;
begin
  update public.subscriptions set status = 'cancelled'
    where id = p_subscription_id and user_id = auth.uid()
    returning * into v_sub;
  if v_sub is null then raise exception 'Subscription not found'; end if;
  return v_sub;
end;
$$;

grant execute on function public.cancel_subscription(uuid) to authenticated;

-- ── 14. ADMIN FUNCTIONS ───────────────────────────────────────────
create or replace function public.admin_adjust_balance(p_user_id uuid, p_amount numeric, p_reason text)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare v_profile public.profiles;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if p_amount = 0 then raise exception 'Amount cannot be zero'; end if;
  if (select balance from public.profiles where id = p_user_id) + p_amount < 0
    then raise exception 'Would push balance below zero'; end if;

  update public.profiles set balance = balance + p_amount where id = p_user_id returning * into v_profile;
  if v_profile is null then raise exception 'User not found'; end if;

  insert into public.admin_adjustments (admin_id, user_id, amount, reason)
    values (auth.uid(), p_user_id, p_amount, p_reason);

  return v_profile;
end;
$$;

grant execute on function public.admin_adjust_balance(uuid, numeric, text) to authenticated;

create or replace function public.admin_set_active(p_user_id uuid, p_active boolean)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare v_profile public.profiles;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  update public.profiles set is_active = p_active where id = p_user_id returning * into v_profile;
  if v_profile is null then raise exception 'User not found'; end if;
  return v_profile;
end;
$$;

grant execute on function public.admin_set_active(uuid, boolean) to authenticated;

create or replace function public.admin_set_rate(p_rate numeric)
returns public.app_settings language plpgsql security definer set search_path = public as $$
declare v_row public.app_settings;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if p_rate <= 0 then raise exception 'Rate must be greater than zero'; end if;
  update public.app_settings set value = p_rate, updated_at = now()
    where key = 'zmw_rate' returning * into v_row;
  return v_row;
end;
$$;

grant execute on function public.admin_set_rate(numeric) to authenticated;

create or replace function public.admin_set_treasury(p_user_id uuid)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare v_row public.profiles;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  update public.profiles set is_treasury = false where is_treasury = true;
  update public.profiles set is_treasury = true where id = p_user_id returning * into v_row;
  if v_row is null then raise exception 'User not found'; end if;
  return v_row;
end;
$$;

grant execute on function public.admin_set_treasury(uuid) to authenticated;

create or replace function public.admin_treasury_summary()
returns table (total_revenue numeric, treasury_user_id uuid, treasury_name text, treasury_balance numeric)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  return query
    select coalesce((select sum(amount) from public.service_payments),0),
      p.id, p.full_name, p.balance
    from public.profiles p where p.is_treasury = true limit 1;
end;
$$;

grant execute on function public.admin_treasury_summary() to authenticated;

-- ── 15. REALTIME ──────────────────────────────────────────────────
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.app_settings;
alter publication supabase_realtime add table public.subscriptions;

-- ── 16. SEED EXAMPLE SERVICES (edit freely via Admin panel) ───────
insert into public.services (name, description, category, price, billing_interval)
  values
    ('SwifTrade Pro', 'Priority matching and unlimited buyer requests.', 'SwifTrade', 150.00, 'monthly'),
    ('IT Retainer — Basic', 'Monthly on-call IT support retainer.', 'IT Retainer', 400.00, 'monthly'),
    ('IT Retainer — Premium', '24/7 priority IT support with SLA.', 'IT Retainer', 750.00, 'monthly'),
    ('Mobility Pass', 'Discounted internal transport credits.', 'Mobility', 80.00, 'monthly')
  on conflict do nothing;

-- ── 17. MAKE YOURSELF ADMIN ───────────────────────────────────────
-- After signing up, run this with YOUR email, then re-login:
-- UPDATE public.profiles SET role = 'admin', is_treasury = true WHERE email = 'you@example.com';
