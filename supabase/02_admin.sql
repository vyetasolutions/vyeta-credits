-- =========================================================
-- KWACHA CREDITS — Migration 2: Admin panel
-- Run AFTER schema.sql, in Supabase SQL Editor → New query → Run.
-- =========================================================

-- 1. ROLE + ACTIVE FLAG ON PROFILES -----------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'user' check (role in ('user', 'admin')),
  add column if not exists is_active boolean not null default true;

-- 2. AUDIT LOG FOR ADMIN BALANCE CHANGES ------------------------------------
create table if not exists public.admin_adjustments (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id),
  user_id uuid not null references public.profiles(id),
  amount numeric(14,2) not null,            -- positive = credit, negative = debit
  reason text,
  created_at timestamptz not null default now()
);

alter table public.admin_adjustments enable row level security;

create policy "Admins can view the adjustment log"
  on public.admin_adjustments for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- 3. ADMINS CAN SEE EVERYONE'S TRANSACTIONS, NOT JUST THEIR OWN ------------
create policy "Admins can view all transactions"
  on public.transactions for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- 4. ENFORCE ACCOUNT FREEZE INSIDE THE TRANSFER FUNCTION --------------------
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
  v_sender_active boolean;
  v_receiver_active boolean;
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

  select balance, is_active into v_sender_balance, v_sender_active
  from public.profiles
  where id = v_sender_id
  for update;

  if v_sender_balance is null then
    raise exception 'Sender profile not found';
  end if;

  if not v_sender_active then
    raise exception 'This account has been frozen by an administrator';
  end if;

  if v_sender_balance < v_total then
    raise exception 'Insufficient balance for amount plus fee';
  end if;

  select is_active into v_receiver_active from public.profiles where id = p_receiver_id;
  if v_receiver_active is null then
    raise exception 'Receiver not found';
  end if;
  if not v_receiver_active then
    raise exception 'Receiver account is frozen and cannot accept credits';
  end if;

  update public.profiles set balance = balance - v_total where id = v_sender_id;
  update public.profiles set balance = balance + p_amount where id = p_receiver_id;

  insert into public.transactions (sender_id, receiver_id, amount, fee, status)
  values (v_sender_id, p_receiver_id, p_amount, v_fee, 'completed')
  returning * into v_tx;

  return v_tx;
end;
$$;

-- 5. ADMIN: ADJUST ANY USER'S BALANCE (credit or debit) ---------------------
create or replace function public.admin_adjust_balance(p_user_id uuid, p_amount numeric, p_reason text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid := auth.uid();
  v_is_admin boolean;
  v_current_balance numeric;
  v_profile public.profiles;
begin
  select (role = 'admin') into v_is_admin from public.profiles where id = v_admin_id;
  if not coalesce(v_is_admin, false) then
    raise exception 'Only admins can adjust balances';
  end if;

  if p_amount = 0 then
    raise exception 'Adjustment amount cannot be zero';
  end if;

  select balance into v_current_balance from public.profiles where id = p_user_id for update;
  if v_current_balance is null then
    raise exception 'User not found';
  end if;

  if v_current_balance + p_amount < 0 then
    raise exception 'Adjustment would push balance below zero';
  end if;

  update public.profiles set balance = balance + p_amount where id = p_user_id
  returning * into v_profile;

  insert into public.admin_adjustments (admin_id, user_id, amount, reason)
  values (v_admin_id, p_user_id, p_amount, p_reason);

  return v_profile;
end;
$$;

grant execute on function public.admin_adjust_balance(uuid, numeric, text) to authenticated;

-- 6. ADMIN: FREEZE / UNFREEZE AN ACCOUNT ------------------------------------
create or replace function public.admin_set_active(p_user_id uuid, p_active boolean)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid := auth.uid();
  v_is_admin boolean;
  v_profile public.profiles;
begin
  select (role = 'admin') into v_is_admin from public.profiles where id = v_admin_id;
  if not coalesce(v_is_admin, false) then
    raise exception 'Only admins can change account status';
  end if;

  update public.profiles set is_active = p_active where id = p_user_id
  returning * into v_profile;

  if v_profile is null then
    raise exception 'User not found';
  end if;

  return v_profile;
end;
$$;

grant execute on function public.admin_set_active(uuid, boolean) to authenticated;

-- 7. MAKE YOURSELF THE FIRST ADMIN ------------------------------------------
-- Replace the email below with your own account's email, then run just this
-- one line (select it and click "Run selection" instead of the whole file
-- if you've already run everything above once).
-- update public.profiles set role = 'admin' where email = 'you@example.com';
