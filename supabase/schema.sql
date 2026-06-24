-- =========================================================
-- KWACHA CREDITS — Supabase schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query → Run
-- =========================================================

-- 1. PROFILES TABLE (one row per user, holds balance) ----------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'New user',
  email text not null,
  balance numeric(14,2) not null default 1000.00 check (balance >= 0),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own display name only"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No client-side INSERT policy on purpose: profile rows are created only
-- by the trigger below, never directly by the app.

-- 2. AUTO-CREATE PROFILE ON SIGNUP (starting balance = 1000) ---------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, balance)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
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

-- 3. TRANSACTIONS TABLE (the ledger) ----------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id),
  receiver_id uuid not null references public.profiles(id),
  amount numeric(14,2) not null check (amount > 0),
  fee numeric(14,2) not null default 0 check (fee >= 0),
  status text not null default 'completed' check (status in ('completed', 'failed')),
  created_at timestamptz not null default now(),
  constraint sender_not_receiver check (sender_id <> receiver_id)
);

alter table public.transactions enable row level security;

create policy "Users see only their own transactions"
  on public.transactions for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- No client-side INSERT/UPDATE policy: rows are only ever written by the
-- send_credits() function below, which runs with elevated rights.

-- 4. READABLE VIEW (joins names in for the UI) ------------------------------
create or replace view public.transactions_view
with (security_invoker = true) as
select
  t.id,
  t.sender_id,
  t.receiver_id,
  t.amount,
  t.fee,
  t.status,
  t.created_at,
  sp.full_name as sender_name,
  rp.full_name as receiver_name
from public.transactions t
join public.profiles sp on sp.id = t.sender_id
join public.profiles rp on rp.id = t.receiver_id;

grant select on public.transactions_view to authenticated;

-- 5. FEE CALCULATION (mirrors src/lib/format.js calculateFee) --------------
create or replace function public.calculate_fee(p_amount numeric)
returns numeric
language plpgsql
immutable
as $$
declare
  v_rate numeric;
begin
  if p_amount <= 50 then v_rate := 0;
  elsif p_amount <= 250 then v_rate := 0.005;
  elsif p_amount <= 1000 then v_rate := 0.012;
  else v_rate := 0.02;
  end if;
  return round(p_amount * v_rate, 2);
end;
$$;

-- 6. ATOMIC TRANSFER FUNCTION (the only way credits move) ------------------
-- SECURITY DEFINER lets this function update both balances safely while
-- normal RLS still blocks any other direct write to profiles/transactions.
create or replace function public.send_credits(p_receiver_id uuid, p_amount numeric)
returns public.transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_id uuid := auth.uid();
  v_fee numeric;
  v_total numeric;
  v_sender_balance numeric;
  v_tx public.transactions;
begin
  if v_sender_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if p_receiver_id = v_sender_id then
    raise exception 'Cannot send credits to yourself';
  end if;

  v_fee := public.calculate_fee(p_amount);
  v_total := p_amount + v_fee;

  -- Lock sender row to prevent race conditions on concurrent sends
  select balance into v_sender_balance
  from public.profiles
  where id = v_sender_id
  for update;

  if v_sender_balance is null then
    raise exception 'Sender profile not found';
  end if;

  if v_sender_balance < v_total then
    raise exception 'Insufficient balance for amount plus fee';
  end if;

  -- Make sure receiver exists
  perform 1 from public.profiles where id = p_receiver_id;
  if not found then
    raise exception 'Receiver not found';
  end if;

  update public.profiles set balance = balance - v_total where id = v_sender_id;
  update public.profiles set balance = balance + p_amount where id = p_receiver_id;

  insert into public.transactions (sender_id, receiver_id, amount, fee, status)
  values (v_sender_id, p_receiver_id, p_amount, v_fee, 'completed')
  returning * into v_tx;

  return v_tx;
end;
$$;

grant execute on function public.send_credits(uuid, numeric) to authenticated;

-- 7. REALTIME (so balance + activity update live in the UI) ---------------
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.transactions;
