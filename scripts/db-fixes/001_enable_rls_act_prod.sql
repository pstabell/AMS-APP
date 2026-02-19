-- ============================================================
-- FIX: Enable Row Level Security on ACT-PROD
-- Project: Agent Commission Tracker - PROD (msvlbovpctnmwbdztqiu)
-- Date: 2026-01-29
-- Issue: 13 tables have RLS disabled, exposing data via anon key
-- Planner Task: SECURITY: Supabase RLS — 41 Tables Exposed
-- ============================================================
-- IMPORTANT: Run this in Supabase SQL Editor for ACT-PROD
-- Test in ACT-Private FIRST before running in PROD
-- ============================================================

BEGIN;

-- ============================================================
-- PART 1: password_reset_tokens (CRITICAL — already has policies, just needs RLS on)
-- ============================================================
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
-- Policies already exist:
--   - Allow anon to create reset tokens (INSERT)
--   - Allow anon to read valid tokens (SELECT where not expired, not used)
--   - Allow anon to mark tokens as used (UPDATE where not expired, not used)

-- ============================================================
-- PART 2: User-scoped tables (all have user_id + user_email columns)
-- Pattern: Match existing app policies using auth.email() = user_email
-- ============================================================

-- --- carriers ---
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own carriers"
  ON public.carriers FOR SELECT
  USING (auth.email() = user_email);

CREATE POLICY "Users can insert own carriers"
  ON public.carriers FOR INSERT
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can update own carriers"
  ON public.carriers FOR UPDATE
  USING (auth.email() = user_email)
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can delete own carriers"
  ON public.carriers FOR DELETE
  USING (auth.email() = user_email);

CREATE POLICY "Service role full access carriers"
  ON public.carriers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- --- commission_rules ---
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own commission_rules"
  ON public.commission_rules FOR SELECT
  USING (auth.email() = user_email);

CREATE POLICY "Users can insert own commission_rules"
  ON public.commission_rules FOR INSERT
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can update own commission_rules"
  ON public.commission_rules FOR UPDATE
  USING (auth.email() = user_email)
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can delete own commission_rules"
  ON public.commission_rules FOR DELETE
  USING (auth.email() = user_email);

CREATE POLICY "Service role full access commission_rules"
  ON public.commission_rules FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- --- mgas ---
ALTER TABLE public.mgas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mgas"
  ON public.mgas FOR SELECT
  USING (auth.email() = user_email);

CREATE POLICY "Users can insert own mgas"
  ON public.mgas FOR INSERT
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can update own mgas"
  ON public.mgas FOR UPDATE
  USING (auth.email() = user_email)
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can delete own mgas"
  ON public.mgas FOR DELETE
  USING (auth.email() = user_email);

CREATE POLICY "Service role full access mgas"
  ON public.mgas FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- --- carrier_mga_relationships ---
ALTER TABLE public.carrier_mga_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own carrier_mga_relationships"
  ON public.carrier_mga_relationships FOR SELECT
  USING (auth.email() = user_email);

CREATE POLICY "Users can insert own carrier_mga_relationships"
  ON public.carrier_mga_relationships FOR INSERT
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can update own carrier_mga_relationships"
  ON public.carrier_mga_relationships FOR UPDATE
  USING (auth.email() = user_email)
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can delete own carrier_mga_relationships"
  ON public.carrier_mga_relationships FOR DELETE
  USING (auth.email() = user_email);

CREATE POLICY "Service role full access carrier_mga_relationships"
  ON public.carrier_mga_relationships FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- --- user_column_mappings ---
ALTER TABLE public.user_column_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own user_column_mappings"
  ON public.user_column_mappings FOR SELECT
  USING (auth.email() = user_email);

CREATE POLICY "Users can insert own user_column_mappings"
  ON public.user_column_mappings FOR INSERT
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can update own user_column_mappings"
  ON public.user_column_mappings FOR UPDATE
  USING (auth.email() = user_email)
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can delete own user_column_mappings"
  ON public.user_column_mappings FOR DELETE
  USING (auth.email() = user_email);

CREATE POLICY "Service role full access user_column_mappings"
  ON public.user_column_mappings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- --- user_default_agent_rates ---
ALTER TABLE public.user_default_agent_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own user_default_agent_rates"
  ON public.user_default_agent_rates FOR SELECT
  USING (auth.email() = user_email);

CREATE POLICY "Users can insert own user_default_agent_rates"
  ON public.user_default_agent_rates FOR INSERT
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can update own user_default_agent_rates"
  ON public.user_default_agent_rates FOR UPDATE
  USING (auth.email() = user_email)
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can delete own user_default_agent_rates"
  ON public.user_default_agent_rates FOR DELETE
  USING (auth.email() = user_email);

CREATE POLICY "Service role full access user_default_agent_rates"
  ON public.user_default_agent_rates FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- --- user_policy_types ---
ALTER TABLE public.user_policy_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own user_policy_types"
  ON public.user_policy_types FOR SELECT
  USING (auth.email() = user_email);

CREATE POLICY "Users can insert own user_policy_types"
  ON public.user_policy_types FOR INSERT
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can update own user_policy_types"
  ON public.user_policy_types FOR UPDATE
  USING (auth.email() = user_email)
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can delete own user_policy_types"
  ON public.user_policy_types FOR DELETE
  USING (auth.email() = user_email);

CREATE POLICY "Service role full access user_policy_types"
  ON public.user_policy_types FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- --- user_preferences ---
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own user_preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.email() = user_email);

CREATE POLICY "Users can insert own user_preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can update own user_preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.email() = user_email)
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can delete own user_preferences"
  ON public.user_preferences FOR DELETE
  USING (auth.email() = user_email);

CREATE POLICY "Service role full access user_preferences"
  ON public.user_preferences FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- --- user_transaction_types ---
ALTER TABLE public.user_transaction_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own user_transaction_types"
  ON public.user_transaction_types FOR SELECT
  USING (auth.email() = user_email);

CREATE POLICY "Users can insert own user_transaction_types"
  ON public.user_transaction_types FOR INSERT
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can update own user_transaction_types"
  ON public.user_transaction_types FOR UPDATE
  USING (auth.email() = user_email)
  WITH CHECK (auth.email() = user_email);

CREATE POLICY "Users can delete own user_transaction_types"
  ON public.user_transaction_types FOR DELETE
  USING (auth.email() = user_email);

CREATE POLICY "Service role full access user_transaction_types"
  ON public.user_transaction_types FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- PART 3: Backup tables — lock down completely (service_role only)
-- These should be deleted eventually, but secure them now
-- ============================================================

ALTER TABLE public.backup_carriers_20250118 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only backup_carriers"
  ON public.backup_carriers_20250118 FOR ALL
  TO service_role
  USING (true);

ALTER TABLE public.backup_commission_rules_20250118 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only backup_commission_rules"
  ON public.backup_commission_rules_20250118 FOR ALL
  TO service_role
  USING (true);

ALTER TABLE public.backup_mgas_20250118 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only backup_mgas"
  ON public.backup_mgas_20250118 FOR ALL
  TO service_role
  USING (true);

COMMIT;

-- ============================================================
-- VERIFICATION: Run after applying to confirm all tables secured
-- ============================================================
-- SELECT tablename, rowsecurity,
--   (SELECT count(*) FROM pg_policies p WHERE p.tablename = t.tablename AND p.schemaname = 'public') as policies
-- FROM pg_tables t WHERE t.schemaname = 'public' ORDER BY t.tablename;
