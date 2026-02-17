import { Injectable, inject } from '@angular/core';
import { DishService } from '../../dishes/services/dish.service';
import { MealPlanService } from './meal-plan.service';
import { Dish, DishCategory } from '../../dishes/models/dish.model';
import { DayOfWeek } from '../models/meal-plan.model';

/**
 * Result returned by the generation algorithm.
 */
export interface GenerationResult {
  assignments: Map<DayOfWeek, Dish>;
  warnings: string[];
}

/**
 * Service implementing the greedy randomized meal plan generation algorithm.
 *
 * Algorithm summary:
 * 1. Load all dishes, category preferences, and recent dish IDs (last 2 weeks)
 * 2. Filter out recently used dishes (repeat avoidance)
 * 3. Phase 1: Fill days according to category preferences using favorite-weighted selection
 * 4. Phase 2: Fill remaining days from any category using favorite-weighted selection
 * 5. Phase 3: Fallback — if still empty days remain, allow repeats from full library
 */
@Injectable({
  providedIn: 'root'
})
export class MealPlanGeneratorService {
  private dishService = inject(DishService);
  private mealPlanService = inject(MealPlanService);

  /**
   * Generate a complete weekly meal plan for the given week.
   * @param weekStart ISO date string for the Monday of the week (YYYY-MM-DD)
   * @returns GenerationResult with day->dish assignments and any warnings
   */
  async generateWeeklyPlan(weekStart: string): Promise<GenerationResult> {
    const warnings: string[] = [];
    const assignments = new Map<DayOfWeek, Dish>();

    // -------------------------------------------------------------------------
    // 1. Load inputs
    // -------------------------------------------------------------------------
    const [allDishes, categoryPreferences, recentDishIds] = await Promise.all([
      this.dishService.getAll(),
      this.mealPlanService.getCategoryPreferences(),
      this.mealPlanService.getRecentDishIds(weekStart, 2)
    ]);

    if (allDishes.length === 0) {
      warnings.push('Keine Gerichte vorhanden. Bitte zuerst Gerichte anlegen.');
      return { assignments, warnings };
    }

    // -------------------------------------------------------------------------
    // 2. Filter available dishes (repeat avoidance)
    // -------------------------------------------------------------------------
    let availableDishes = allDishes.filter(d => !recentDishIds.has(d.id));

    // Small library fallback: if filtered pool has fewer than 7 dishes, use full library
    if (availableDishes.length < 7) {
      availableDishes = [...allDishes];
      warnings.push('Nicht genugend Gerichte fur volle Abwechslung');
    }

    // Build category-indexed pools (favorites vs. non-favorites)
    const poolByCategory = this.buildCategoryPools(availableDishes);

    // Track which dishes have been assigned this week (no same dish twice in one week)
    const usedDishIds = new Set<string>();

    // Track which day slots remain open (0-6, Mon-Sun)
    const allDays: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];
    const unassignedDays = new Set<DayOfWeek>(allDays);

    // -------------------------------------------------------------------------
    // 3. Phase 1 — Fill category requirements
    // -------------------------------------------------------------------------
    const categories: DishCategory[] = ['Fleisch', 'Vegetarisch', 'Fisch'];

    for (const category of categories) {
      const requiredCount = categoryPreferences[category] ?? 0;
      if (requiredCount === 0) continue;

      // Get available dishes for this category (not yet used this week)
      const pool = (poolByCategory.get(category) ?? []).filter(d => !usedDishIds.has(d.id));

      if (pool.length === 0) {
        if (requiredCount > 0) {
          warnings.push(`Nicht genugend ${category}-Gerichte verfugbar`);
        }
        continue;
      }

      // How many can we actually assign?
      const actualCount = Math.min(requiredCount, pool.length);
      if (actualCount < requiredCount) {
        warnings.push(`Nicht genugend ${category}-Gerichte verfugbar (${actualCount} von ${requiredCount})`);
      }

      // Select dishes using favorite-weighted random sample
      const selected = this.weightedRandomSample(pool, actualCount);

      // Assign to random unassigned days
      const availableDayArray = this.shuffleArray([...unassignedDays]);
      for (let i = 0; i < selected.length; i++) {
        const day = availableDayArray[i];
        if (day === undefined) break;
        assignments.set(day, selected[i]);
        usedDishIds.add(selected[i].id);
        unassignedDays.delete(day);
      }
    }

    // -------------------------------------------------------------------------
    // 4. Phase 2 — Fill remaining days from any category
    // -------------------------------------------------------------------------
    if (unassignedDays.size > 0) {
      // Pool: all remaining available dishes regardless of category
      const remainingPool = availableDishes.filter(d => !usedDishIds.has(d.id));

      if (remainingPool.length > 0) {
        const selected = this.weightedRandomSample(remainingPool, unassignedDays.size);
        const remainingDayArray = this.shuffleArray([...unassignedDays]);
        for (let i = 0; i < selected.length; i++) {
          const day = remainingDayArray[i];
          if (day === undefined) break;
          assignments.set(day, selected[i]);
          usedDishIds.add(selected[i].id);
          unassignedDays.delete(day);
        }
      }
    }

    // -------------------------------------------------------------------------
    // 5. Phase 3 — Fallback: allow repeats from full dish library
    // -------------------------------------------------------------------------
    if (unassignedDays.size > 0) {
      if (!warnings.includes('Nicht genugend Gerichte fur volle Abwechslung')) {
        warnings.push('Nicht genugend Gerichte fur volle Abwechslung');
      }

      // Use the full dish library, allowing repeats
      const fallbackPool = [...allDishes];
      const remainingDayArray = this.shuffleArray([...unassignedDays]);
      for (const day of remainingDayArray) {
        if (fallbackPool.length === 0) break;
        // Pick any dish (shuffle each time to vary)
        const shuffled = this.shuffleArray([...fallbackPool]);
        assignments.set(day, shuffled[0]);
        unassignedDays.delete(day);
      }
    }

    return { assignments, warnings };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Build a map of DishCategory -> Dish[] from an array of dishes.
   * Favorites appear first within each category (already ordered by DishService.getAll).
   */
  private buildCategoryPools(dishes: Dish[]): Map<DishCategory, Dish[]> {
    const map = new Map<DishCategory, Dish[]>();
    for (const dish of dishes) {
      const list = map.get(dish.category) ?? [];
      list.push(dish);
      map.set(dish.category, list);
    }
    return map;
  }

  /**
   * Select `count` unique dishes from `dishes` using favorite-weighted random sampling.
   * Favorites are added 3x to the weighted pool, non-favorites 1x.
   * Uses Fisher-Yates shuffle to pick from the weighted pool.
   * Returns at most `dishes.length` items (cannot exceed available unique dishes).
   */
  private weightedRandomSample(dishes: Dish[], count: number): Dish[] {
    if (count <= 0 || dishes.length === 0) return [];

    // Build weighted pool
    const weightedPool: Dish[] = [];
    for (const dish of dishes) {
      if (dish.is_favorite) {
        // Favorites 3x more likely
        weightedPool.push(dish, dish, dish);
      } else {
        weightedPool.push(dish);
      }
    }

    this.shuffleArray(weightedPool);

    // Deduplicate by ID while preserving weighted-shuffle order
    const seen = new Set<string>();
    const result: Dish[] = [];
    for (const dish of weightedPool) {
      if (!seen.has(dish.id)) {
        seen.add(dish.id);
        result.push(dish);
        if (result.length >= count) break;
      }
    }

    return result;
  }

  /**
   * Fisher-Yates in-place shuffle. Returns the array for chaining.
   */
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
