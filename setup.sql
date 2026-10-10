-- Run once in the NEW Supabase project: heba-pharmacy-orders.
-- This migration adds the notes column used by the updated customer and admin pages.
alter table public.orders
  add column if not exists notes text;

-- Keep RLS enabled. Do not add public/anon access policies.
alter table public.orders enable row level security;
alter table public.admin_users enable row level security;

-- Existing policies created during setup should remain in place:
-- Customers can insert orders with user_id = auth.uid()
-- Customers can select their own orders with user_id = auth.uid()
-- Admins can select/update orders via public.is_pharmacy_admin()
-- Only the admin account you inserted should exist in public.admin_users.
