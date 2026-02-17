import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { DishCategory } from '../../dishes/models/dish.model';
import {
  WeeklyPlan,
  MealAssignment,
  CategoryPreference,
  DayOfWeek,
  DEFAULT_CATEGORY_PREFERENCES,
  getWeekStart
} from '../models/meal-plan.model';

/**
 * Service for managing weekly meal plans, dish assignments, and category preferences.
 * Follows the established DishService pattern: inject SupabaseService, throw on error.
 */
@Injectable({
  providedIn: 'root'
})
export class MealPlanService {
  private supabase = inject(SupabaseService);

  /**
   * Get the existing weekly plan for a given week_start, or create one if it doesn't exist.
   * week_start must be a Monday in ISO format (YYYY-MM-DD).
   */
  async getOrCreateWeeklyPlan(weekStart: string): Promise<WeeklyPlan> {
    const { data: userData, error: userError } = await this.supabase.client.auth.getUser();

    if (userError || !userData.user) {
      throw userError || new Error('User not authenticated');
    }

    const userId = userData.user.id;

    // Try to find existing plan
    const { data: existing, error: findError } = await this.supabase.client
      .from('weekly_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (existing) {
      return existing as WeeklyPlan;
    }

    // Create new plan
    const { data: created, error: createError } = await this.supabase.client
      .from('weekly_plans')
      .insert({ user_id: userId, week_start: weekStart })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return created as WeeklyPlan;
  }

  /**
   * Load all meal assignments for a given week with dish data joined.
   * Returns empty array if no plan exists for the week.
   */
  async getAssignmentsForWeek(weekStart: string): Promise<MealAssignment[]> {
    const { data: userData, error: userError } = await this.supabase.client.auth.getUser();

    if (userError || !userData.user) {
      throw userError || new Error('User not authenticated');
    }

    const userId = userData.user.id;

    // Find the plan for this week
    const { data: plan, error: planError } = await this.supabase.client
      .from('weekly_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .maybeSingle();

    if (planError) {
      throw planError;
    }

    if (!plan) {
      return [];
    }

    // Load assignments with joined dish data
    const { data, error } = await this.supabase.client
      .from('meal_assignments')
      .select('*, dish:dishes(*)')
      .eq('weekly_plan_id', plan.id)
      .order('day_of_week', { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []) as MealAssignment[];
  }

  /**
   * Upsert a dish assignment for a specific day in a weekly plan.
   * Uses onConflict to handle the unique (weekly_plan_id, day_of_week) constraint.
   */
  async assignDish(weeklyPlanId: string, dayOfWeek: DayOfWeek, dishId: string): Promise<MealAssignment> {
    const { data, error } = await this.supabase.client
      .from('meal_assignments')
      .upsert(
        {
          weekly_plan_id: weeklyPlanId,
          day_of_week: dayOfWeek,
          dish_id: dishId
        },
        { onConflict: 'weekly_plan_id,day_of_week' }
      )
      .select('*, dish:dishes(*)')
      .single();

    if (error) {
      throw error;
    }

    return data as MealAssignment;
  }

  /**
   * Remove a meal assignment by ID.
   */
  async removeDish(assignmentId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('meal_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      throw error;
    }
  }

  /**
   * Get the set of dish IDs used in the last N weeks (excluding current week).
   * Used to avoid repeating recent meals during plan generation.
   */
  async getRecentDishIds(currentWeekStart: string, weeksBack: number): Promise<Set<string>> {
    const { data: userData, error: userError } = await this.supabase.client.auth.getUser();

    if (userError || !userData.user) {
      throw userError || new Error('User not authenticated');
    }

    const userId = userData.user.id;

    // Calculate the start of the lookback window
    const startDate = new Date(currentWeekStart + 'T00:00:00Z');
    startDate.setUTCDate(startDate.getUTCDate() - weeksBack * 7);
    const lookbackStart = startDate.toISOString().slice(0, 10);

    // Query meal_assignments joined through weekly_plans to filter by user and date range
    const { data, error } = await this.supabase.client
      .from('meal_assignments')
      .select('dish_id, weekly_plans!inner(user_id, week_start)')
      .eq('weekly_plans.user_id', userId)
      .gte('weekly_plans.week_start', lookbackStart)
      .lt('weekly_plans.week_start', currentWeekStart);

    if (error) {
      throw error;
    }

    const dishIds = new Set<string>();
    for (const row of data || []) {
      dishIds.add(row.dish_id);
    }

    return dishIds;
  }

  /**
   * Load the user's category preferences.
   * Returns DEFAULT_CATEGORY_PREFERENCES if no preferences have been saved.
   */
  async getCategoryPreferences(): Promise<Record<DishCategory, number>> {
    const { data, error } = await this.supabase.client
      .from('category_preferences')
      .select('*');

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return { ...DEFAULT_CATEGORY_PREFERENCES };
    }

    const prefs: Record<DishCategory, number> = {
      Fleisch: 0,
      Vegetarisch: 0,
      Fisch: 0
    };

    for (const row of data as CategoryPreference[]) {
      prefs[row.category] = row.count;
    }

    return prefs;
  }

  /**
   * Upsert all three category preference rows for the current user.
   */
  async saveCategoryPreferences(prefs: Record<DishCategory, number>): Promise<void> {
    const { data: userData, error: userError } = await this.supabase.client.auth.getUser();

    if (userError || !userData.user) {
      throw userError || new Error('User not authenticated');
    }

    const userId = userData.user.id;

    const categories: DishCategory[] = ['Fleisch', 'Vegetarisch', 'Fisch'];
    const rows = categories.map(category => ({
      user_id: userId,
      category,
      count: prefs[category]
    }));

    const { error } = await this.supabase.client
      .from('category_preferences')
      .upsert(rows, { onConflict: 'user_id,category' });

    if (error) {
      throw error;
    }
  }

  /**
   * Delete all meal assignments for a given weekly plan.
   * Used before regenerating a plan to start fresh.
   */
  async clearWeekAssignments(weeklyPlanId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('meal_assignments')
      .delete()
      .eq('weekly_plan_id', weeklyPlanId);

    if (error) {
      throw error;
    }
  }
}
