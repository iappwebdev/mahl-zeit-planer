/**
 * Meal plan models and related types
 */

import { Dish, DishCategory } from '../../dishes/models/dish.model';

/**
 * Day of week type: 0=Monday, 6=Sunday
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * German labels for each day of the week
 */
export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: 'Montag',
  1: 'Dienstag',
  2: 'Mittwoch',
  3: 'Donnerstag',
  4: 'Freitag',
  5: 'Samstag',
  6: 'Sonntag'
};

/**
 * Weekly plan entity — one plan per user per calendar week
 * week_start is always the Monday of the week in ISO format (YYYY-MM-DD)
 */
export interface WeeklyPlan {
  id: string;
  user_id: string;
  week_start: string; // ISO date 'YYYY-MM-DD' (always a Monday)
  created_at: string;
  updated_at: string;
}

/**
 * A single dish assignment for a specific day within a weekly plan
 */
export interface MealAssignment {
  id: string;
  weekly_plan_id: string;
  day_of_week: DayOfWeek;
  dish_id: string;
  created_at: string;
  updated_at: string;
  dish?: Dish; // Joined from dishes table
}

/**
 * User's category preference for how many meals per week of each category
 */
export interface CategoryPreference {
  id: string;
  user_id: string;
  category: DishCategory;
  count: number;
  created_at: string;
  updated_at: string;
}

/**
 * A weekly plan together with all its meal assignments indexed by day
 */
export interface WeeklyPlanWithAssignments {
  plan: WeeklyPlan;
  assignments: Map<DayOfWeek, MealAssignment>;
}

/**
 * Default category preferences when user has no saved config.
 * Total 5, leaving 2 days for "any" category.
 */
export const DEFAULT_CATEGORY_PREFERENCES: Record<DishCategory, number> = {
  Fleisch: 2,
  Vegetarisch: 2,
  Fisch: 1
};

/**
 * Calculate the Monday (week start) of the week containing the given date.
 * Returns an ISO date string 'YYYY-MM-DD'.
 */
export function getWeekStart(date: Date): string {
  const d = new Date(date);
  // getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
  // We want Monday as first day, so adjust Sunday (0) to be 7
  const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay();
  // Subtract days to get to Monday
  d.setDate(d.getDate() - (dayOfWeek - 1));
  return d.toISOString().slice(0, 10);
}

/**
 * Return an array of 7 ISO date strings (Monday through Sunday) for the
 * week starting on weekStart.
 */
export function getWeekDates(weekStart: string): string[] {
  const dates: string[] = [];
  const start = new Date(weekStart + 'T00:00:00Z');
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

/**
 * Format an ISO date string to a short German format, e.g. "17. Feb."
 */
export function formatDateGerman(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  return date.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  });
}
