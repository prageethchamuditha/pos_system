-- =====================================================================
-- PRINT X POS SYSTEM - SUPABASE SQL SCHEMA
-- Execute this script in the Supabase SQL Editor to initialize all tables
-- =====================================================================

-- Enable UUID generation extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Staff and Owner accounts mapping)
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    username text not null,
    full_name text,
    role text not null default 'staff', -- 'owner', 'manager', 'staff'
    passcode text not null default '1234', -- fast numeric session PIN
    updated_at timestamp with time zone default now()
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;
create policy "Allow all actions on profiles for authenticated users" on public.profiles
    for all to authenticated using (true) with check (true);

-- 2. CUSTOMERS TABLE (Teacher/Student directory)
create table if not exists public.customers (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    phone text not null,
    email text,
    address text,
    outstanding_balance numeric not null default 0,
    portal_passcode text not null default '1234',
    portal_duration_limit text not null default '2m', -- '1m', '2m', '6m', 'all'
    created_at timestamp with time zone default now()
);

-- Enable RLS for Customers
alter table public.customers enable row level security;
create policy "Allow all actions on customers for authenticated users" on public.customers
    for all to authenticated using (true) with check (true);
create policy "Allow read on customers for public anonymous access (portal login)" on public.customers
    for select to anon using (true);
create policy "Allow update on customers for portal password changes" on public.customers
    for update to anon using (true) with check (true);

-- 3. ORDERS TABLE (Sales invoices)
create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    order_number text not null unique,
    customer_id uuid references public.customers(id) on delete set null,
    items jsonb not null, -- Array of products: name, qty, price, discount_type, discount_value, total
    total_amount numeric not null,
    paid_amount numeric not null,
    balance_amount numeric not null,
    payment_method text not null default 'cash', -- 'cash', 'bank_transfer', 'pending'
    status text not null default 'pending', -- 'paid', 'partially_paid', 'pending', 'voided'
    created_by text, -- Username who created the bill
    created_at timestamp with time zone default now()
);

-- Enable RLS for Orders
alter table public.orders enable row level security;
create policy "Allow all actions on orders for authenticated users" on public.orders
    for all to authenticated using (true) with check (true);
create policy "Allow read on orders for public anonymous access (portal views)" on public.orders
    for select to anon using (true);

-- 4. QUOTATIONS TABLE (Draft estimates)
create table if not exists public.quotations (
    id uuid primary key default gen_random_uuid(),
    quotation_number text not null unique,
    customer_id uuid references public.customers(id) on delete set null,
    items jsonb not null,
    total_amount numeric not null,
    converted_to_order boolean not null default false,
    created_by text,
    created_at timestamp with time zone default now()
);

-- Enable RLS for Quotations
alter table public.quotations enable row level security;
create policy "Allow all actions on quotations for authenticated users" on public.quotations
    for all to authenticated using (true) with check (true);
create policy "Allow read on quotations for public anonymous access (portal views)" on public.quotations
    for select to anon using (true);

-- 5. DAY END REPORTS TABLE (Daily shifts)
create table if not exists public.day_end_reports (
    id uuid primary key default gen_random_uuid(),
    date date not null unique,
    copy_count integer not null,
    expense_amount numeric not null default 0,
    expense_reason text,
    expense_staff text,
    total_sales numeric not null default 0,
    total_cash_payments numeric not null default 0,
    total_outstanding numeric not null default 0,
    net_drawer_cash numeric not null default 0,
    created_by text,
    created_at timestamp with time zone default now()
);

-- Enable RLS for Day End Reports
alter table public.day_end_reports enable row level security;
create policy "Allow all actions on day_end_reports for authenticated users" on public.day_end_reports
    for all to authenticated using (true) with check (true);

-- 6. WEEK END REPORTS TABLE (Sunday audits)
create table if not exists public.weekend_reports (
    id uuid primary key default gen_random_uuid(),
    date date not null unique,
    entered_monthly_total numeric not null,
    calculated_weekly_revenue numeric not null,
    created_by text,
    created_at timestamp with time zone default now()
);

-- Enable RLS for Week End Reports
alter table public.weekend_reports enable row level security;
create policy "Allow all actions on weekend_reports for authenticated users" on public.weekend_reports
    for all to authenticated using (true) with check (true);
