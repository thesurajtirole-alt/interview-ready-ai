-- Run in Supabase SQL editor
alter table pricing_plans
  add column if not exists razorpay_plan_id text,
  add column if not exists razorpay_plan_amount integer;

alter table user_subscriptions
  add column if not exists razorpay_subscription_id text,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists updated_at timestamptz default now();
