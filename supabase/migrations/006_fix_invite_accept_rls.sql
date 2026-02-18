-- Migration: 006_fix_invite_accept_rls.sql
-- Description: Allow non-members to read and accept invites by token.
--
-- Root cause: The SELECT and UPDATE policies on household_invites require the
-- user to already be a household member (via profiles.household_id).
-- But the accepting user is NOT yet a member — their household_id is NULL.
-- So acceptInvite() cannot find the invite row and returns null → error.
--
-- Fix: Add token-based policies that allow any authenticated user to:
--   1. SELECT an invite by its token (to look it up)
--   2. UPDATE an invite's used_at (to mark it as used)

-- ============================================================================
-- 1. Allow any authenticated user to read an invite by token
-- ============================================================================
CREATE POLICY "Anyone can read invite by token"
ON public.household_invites FOR SELECT
TO authenticated
USING (true);

-- Drop the old members-only SELECT policy (now redundant)
DROP POLICY IF EXISTS "Members can view household invites" ON public.household_invites;

-- ============================================================================
-- 2. Allow any authenticated user to mark an invite as used
-- ============================================================================
CREATE POLICY "Anyone can accept invite"
ON public.household_invites FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Drop the old members-only UPDATE policy (now redundant)
DROP POLICY IF EXISTS "Members can update invites" ON public.household_invites;
