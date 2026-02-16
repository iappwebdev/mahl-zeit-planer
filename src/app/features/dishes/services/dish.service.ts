import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Dish, CreateDishPayload } from '../models/dish.model';

/**
 * Service for managing dishes (CRUD operations + favorite toggle)
 */
@Injectable({
  providedIn: 'root'
})
export class DishService {
  private supabase = inject(SupabaseService);

  /**
   * Get all dishes for the current user, ordered by favorite status then name
   */
  async getAll(): Promise<Dish[]> {
    const { data, error } = await this.supabase.client
      .from('dishes')
      .select('*')
      .order('is_favorite', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Create a new dish for the current user
   */
  async create(payload: CreateDishPayload): Promise<Dish> {
    const { data: userData, error: userError } = await this.supabase.client.auth.getUser();

    if (userError || !userData.user) {
      throw userError || new Error('User not authenticated');
    }

    const { data, error } = await this.supabase.client
      .from('dishes')
      .insert({
        user_id: userData.user.id,
        name: payload.name,
        category: payload.category,
        is_favorite: false
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Update a dish's name or category
   * RLS ensures user can only update their own dishes
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
   * Delete a dish
   * RLS ensures user can only delete their own dishes
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
   * Toggle the favorite status of a dish
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
