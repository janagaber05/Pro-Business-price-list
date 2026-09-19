-- Run this in Supabase → SQL Editor → New query → Run
-- Then put your Project URL + anon key into config.js and set enabled: true

create table if not exists products (
  id text primary key,
  name text not null,
  category text not null check (category in ('fruits', 'candy', 'vegetables')),
  price1kg numeric,
  price10kg numeric,
  price30kg numeric,
  quantity numeric not null default 0,
  notes text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  product_id text not null references products(id) on delete cascade,
  product_name text not null,
  type text not null check (type in ('in', 'out')),
  quantity numeric not null check (quantity > 0),
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table products enable row level security;
alter table orders enable row level security;

drop policy if exists "public read products" on products;
drop policy if exists "public write products" on products;
drop policy if exists "public read orders" on orders;
drop policy if exists "public write orders" on orders;

create policy "public read products" on products for select using (true);
create policy "public write products" on products for all using (true) with check (true);
create policy "public read orders" on orders for select using (true);
create policy "public write orders" on orders for all using (true) with check (true);
