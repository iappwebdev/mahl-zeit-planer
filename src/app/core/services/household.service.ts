import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  Household,
  HouseholdMemberProfile,
  HouseholdInvite,
  ActivityLogEntry
} from '../../features/settings/models/household.model';

@Injectable({
  providedIn: 'root'
})
export class HouseholdService {
  private supabase = inject(SupabaseService);

  /** The current user's household. null = solo mode. */
  currentHousehold = signal<Household | null>(null);

  /** Convenience computed: the household ID, or null when solo. */
  householdId = computed(() => this.currentHousehold()?.id ?? null);

  /**
   * Load the current user's household from their profile's household_id.
   * Single query — no join table needed.
   */
  async loadCurrentHousehold(): Promise<void> {
    const { data: userData, error: userError } = await this.supabase.client.auth.getUser();

    if (userError || !userData.user) {
      this.currentHousehold.set(null);
      return;
    }

    // Read household_id from the user's profile
    const { data: profile, error: profileError } = await this.supabase.client
      .from('profiles')
      .select('household_id')
      .eq('id', userData.user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    if (!profile?.household_id) {
      this.currentHousehold.set(null);
      return;
    }

    // Load the household
    const { data: household, error: householdError } = await this.supabase.client
      .from('households')
      .select('*')
      .eq('id', profile.household_id)
      .single();

    if (householdError) {
      throw householdError;
    }

    this.currentHousehold.set(household as Household);
  }

  /**
   * Create a new household and migrate existing user dishes/plans to it.
   * Updates own profile with household_id + household_role='owner'.
   */
  async createHousehold(name: string): Promise<Household> {
    const { data: userData, error: userError } = await this.supabase.client.auth.getUser();

    if (userError || !userData.user) {
      throw userError || new Error('User not authenticated');
    }

    const userId = userData.user.id;

    // Create the household
    const { data: household, error: createError } = await this.supabase.client
      .from('households')
      .insert({ name, owner_id: userId })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    const createdHousehold = household as Household;

    // Update own profile with household membership
    const { error: profileError } = await this.supabase.client
      .from('profiles')
      .update({ household_id: createdHousehold.id, household_role: 'owner' })
      .eq('id', userId);

    if (profileError) {
      throw profileError;
    }

    // Migrate existing solo dishes to the new household
    const { error: dishMigrateError } = await this.supabase.client
      .from('dishes')
      .update({ household_id: createdHousehold.id })
      .eq('user_id', userId)
      .is('household_id', null);

    if (dishMigrateError) {
      throw dishMigrateError;
    }

    // Migrate existing solo weekly plans to the new household
    const { error: planMigrateError } = await this.supabase.client
      .from('weekly_plans')
      .update({ household_id: createdHousehold.id })
      .eq('user_id', userId)
      .is('household_id', null);

    if (planMigrateError) {
      throw planMigrateError;
    }

    this.currentHousehold.set(createdHousehold);
    return createdHousehold;
  }

  /**
   * Get all members of the current household from profiles table.
   */
  async getMembers(): Promise<HouseholdMemberProfile[]> {
    const householdId = this.householdId();

    if (!householdId) {
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('id, display_name, household_role')
      .eq('household_id', householdId);

    if (error) {
      throw error;
    }

    return (data || []) as HouseholdMemberProfile[];
  }

  /**
   * Remove a member from the current household by clearing their profile fields.
   */
  async removeMember(userId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('profiles')
      .update({ household_id: null, household_role: null })
      .eq('id', userId);

    if (error) {
      throw error;
    }
  }

  /**
   * Leave the current household. Clears own profile fields and resets signal.
   */
  async leaveHousehold(): Promise<void> {
    const { data: userData, error: userError } = await this.supabase.client.auth.getUser();

    if (userError || !userData.user) {
      throw userError || new Error('User not authenticated');
    }

    const { error } = await this.supabase.client
      .from('profiles')
      .update({ household_id: null, household_role: null })
      .eq('id', userData.user.id);

    if (error) {
      throw error;
    }

    this.currentHousehold.set(null);
  }

  /**
   * Delete the current household (CASCADE removes invites/activity).
   * profiles.household_id set to NULL via ON DELETE SET NULL.
   */
  async deleteHousehold(): Promise<void> {
    const householdId = this.householdId();

    if (!householdId) {
      return;
    }

    const { error } = await this.supabase.client
      .from('households')
      .delete()
      .eq('id', householdId);

    if (error) {
      throw error;
    }

    this.currentHousehold.set(null);
  }

  /**
   * Create a shareable invite link for the current household.
   */
  async createInviteLink(): Promise<string> {
    const { data: userData, error: userError } = await this.supabase.client.auth.getUser();

    if (userError || !userData.user) {
      throw userError || new Error('User not authenticated');
    }

    const householdId = this.householdId();

    if (!householdId) {
      throw new Error('No active household');
    }

    const { data, error } = await this.supabase.client
      .from('household_invites')
      .insert({ household_id: householdId, created_by: userData.user.id })
      .select('token')
      .single();

    if (error) {
      throw error;
    }

    return (data as { token: string }).token;
  }

  /**
   * Get all active (non-expired, non-used) invites for the current household.
   */
  async getInvites(): Promise<HouseholdInvite[]> {
    const householdId = this.householdId();

    if (!householdId) {
      return [];
    }

    const now = new Date().toISOString();

    const { data, error } = await this.supabase.client
      .from('household_invites')
      .select('*')
      .eq('household_id', householdId)
      .is('used_at', null)
      .gt('expires_at', now)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []) as HouseholdInvite[];
  }

  /**
   * Accept an invite: validate token, update own profile, mark invite used, migrate data.
   */
  async acceptInvite(token: string): Promise<void> {
    const { data: userData, error: userError } = await this.supabase.client.auth.getUser();

    if (userError || !userData.user) {
      throw userError || new Error('User not authenticated');
    }

    const userId = userData.user.id;
    const now = new Date().toISOString();

    // Look up invite by token
    const { data: invite, error: inviteError } = await this.supabase.client
      .from('household_invites')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', now)
      .maybeSingle();

    if (inviteError) {
      throw inviteError;
    }

    if (!invite) {
      throw new Error('Einladung nicht gefunden oder abgelaufen');
    }

    const typedInvite = invite as HouseholdInvite;

    // Update own profile with household membership
    const { error: profileError } = await this.supabase.client
      .from('profiles')
      .update({ household_id: typedInvite.household_id, household_role: 'member' })
      .eq('id', userId);

    if (profileError) {
      throw profileError;
    }

    // Mark invite as used
    const { error: usedError } = await this.supabase.client
      .from('household_invites')
      .update({ used_at: now })
      .eq('id', typedInvite.id);

    if (usedError) {
      throw usedError;
    }

    // Migrate existing solo dishes to the new household
    const { error: dishMigrateError } = await this.supabase.client
      .from('dishes')
      .update({ household_id: typedInvite.household_id })
      .eq('user_id', userId)
      .is('household_id', null);

    if (dishMigrateError) {
      throw dishMigrateError;
    }

    // Migrate existing solo weekly plans to the new household
    const { error: planMigrateError } = await this.supabase.client
      .from('weekly_plans')
      .update({ household_id: typedInvite.household_id })
      .eq('user_id', userId)
      .is('household_id', null);

    if (planMigrateError) {
      throw planMigrateError;
    }

    // Load and set the joined household
    const { data: household, error: householdError } = await this.supabase.client
      .from('households')
      .select('*')
      .eq('id', typedInvite.household_id)
      .single();

    if (householdError) {
      throw householdError;
    }

    this.currentHousehold.set(household as Household);
  }

  /**
   * Get recent activity for the current household.
   */
  async getActivityLog(limit: number = 20): Promise<ActivityLogEntry[]> {
    const householdId = this.householdId();

    if (!householdId) {
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('activity_log')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data || []) as ActivityLogEntry[];
  }

  /**
   * Returns true if the current user is the owner of their household.
   */
  isOwner(): boolean {
    const household = this.currentHousehold();
    if (!household) {
      return false;
    }
    return true;
  }
}
