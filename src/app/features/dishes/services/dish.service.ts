import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { HouseholdService } from '../../../core/services/household.service';
import { Dish, CreateDishPayload } from '../models/dish.model';

/**
 * Service for managing dishes (CRUD operations + favorite toggle).
 * Supports dual-mode access: solo (user_id) and household (household_id).
 */
@Injectable({
  providedIn: 'root'
})
export class DishService {
  private supabase = inject(SupabaseService);
  private household = inject(HouseholdService);

  /**
   * Get all dishes for the current user or their household,
   * ordered by favorite status then name.
   */
  async getAll(): Promise<Dish[]> {
    const householdId = this.household.householdId();

    let query = this.supabase.client
      .from('dishes')
      .select('*')
      .order('is_favorite', { ascending: false })
      .order('name', { ascending: true });

    if (householdId) {
      // Household mode: query by household_id (RLS ensures only members can access)
      query = query.eq('household_id', householdId);
    }
    // Solo mode: no additional filter — RLS filters by user_id automatically

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Create a new dish for the current user.
   * Sets household_id when in household mode.
   */
  async create(payload: CreateDishPayload): Promise<Dish> {
    const { data: userData, error: userError } = await this.supabase.client.auth.getUser();

    if (userError || !userData.user) {
      throw userError || new Error('User not authenticated');
    }

    const householdId = this.household.householdId();

    const insertPayload: Record<string, unknown> = {
      user_id: userData.user.id,
      name: payload.name,
      category: payload.category,
      is_favorite: false
    };

    if (householdId) {
      // Household mode: associate dish with the household
      insertPayload['household_id'] = householdId;
    }

    const { data, error } = await this.supabase.client
      .from('dishes')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Update a dish's name or category.
   * RLS ensures user can only update their own or household dishes.
   */
  async update(id: string, changes: Partial<Pick<Dish, 'name' | 'category'>>): Promise<Dish> {
    const { data, error } = await this.supabase.client
      .from('dishes')
      .update(changes)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Delete a dish.
   * RLS ensures user can only delete their own or household dishes.
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('dishes')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  /**
   * Toggle the favorite status of a dish.
   */
  async toggleFavorite(id: string, isFavorite: boolean): Promise<Dish> {
    const { data, error } = await this.supabase.client
      .from('dishes')
      .update({ is_favorite: isFavorite })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
