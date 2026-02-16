/**
 * Dish model and related types
 */

/**
 * Available dish categories matching database CHECK constraint
 */
export type DishCategory = 'Fisch' | 'Fleisch' | 'Vegetarisch';

/**
 * Dish entity representing a meal that can be included in weekly meal plans
 */
export interface Dish {
  id: string;
  user_id: string;
  name: string;
  category: DishCategory;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Payload for creating a new dish (user only provides name and category)
 */
export type CreateDishPayload = Pick<Dish, 'name' | 'category'>;
