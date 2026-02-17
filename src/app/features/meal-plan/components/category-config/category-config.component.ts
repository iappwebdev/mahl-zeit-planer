import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MealPlanService } from '../../services/meal-plan.service';
import { DishService } from '../../../dishes/services/dish.service';
import { DishCategory } from '../../../dishes/models/dish.model';
import { DEFAULT_CATEGORY_PREFERENCES } from '../../models/meal-plan.model';

/**
 * Inline collapsible component for configuring how many meals per week
 * should come from each dish category.
 *
 * Shows available dish counts as hints next to each input.
 * Auto-saves on each change.
 */
@Component({
  selector: 'app-category-config',
  imports: [FormsModule],
  templateUrl: './category-config.component.html'
})
export class CategoryConfigComponent implements OnInit {
  private mealPlanService = inject(MealPlanService);
  private dishService = inject(DishService);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /** Category preference counts, keyed by category name */
  preferences = signal<Record<DishCategory, number>>({ ...DEFAULT_CATEGORY_PREFERENCES });

  /** Number of available dishes per category in the user's library */
  availableCounts = signal<Record<DishCategory, number>>({
    Fleisch: 0,
    Vegetarisch: 0,
    Fisch: 0
  });

  /** True while saving preferences to Supabase */
  isSaving = signal(false);

  // ---------------------------------------------------------------------------
  // Derived / computed
  // ---------------------------------------------------------------------------

  /** Total number of days assigned to specific categories */
  totalConfigured = computed(() => {
    const p = this.preferences();
    return (p['Fleisch'] ?? 0) + (p['Vegetarisch'] ?? 0) + (p['Fisch'] ?? 0);
  });

  /** How many days will be filled from any category (7 - totalConfigured) */
  remainingDays = computed(() => Math.max(0, 7 - this.totalConfigured()));

  /** True if the category counts sum to more than 7 */
  isTotalExceeded = computed(() => this.totalConfigured() > 7);

  /** Ordered list of categories for template iteration */
  readonly categories: DishCategory[] = ['Fleisch', 'Vegetarisch', 'Fisch'];

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadPreferences(),
      this.loadAvailableCounts()
    ]);
  }

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  private async loadPreferences(): Promise<void> {
    try {
      const prefs = await this.mealPlanService.getCategoryPreferences();
      this.preferences.set(prefs);
    } catch {
      // Keep defaults on error
    }
  }

  private async loadAvailableCounts(): Promise<void> {
    try {
      const dishes = await this.dishService.getAll();
      const counts: Record<DishCategory, number> = { Fleisch: 0, Vegetarisch: 0, Fisch: 0 };
      for (const dish of dishes) {
        counts[dish.category] = (counts[dish.category] ?? 0) + 1;
      }
      this.availableCounts.set(counts);
    } catch {
      // Keep zeros on error
    }
  }

  // ---------------------------------------------------------------------------
  // Category config methods
  // ---------------------------------------------------------------------------

  /**
   * Update the count for a category and auto-save.
   * Value is clamped to [0, 7].
   */
  async updateCount(category: DishCategory, value: number): Promise<void> {
    const clamped = Math.max(0, Math.min(7, Math.round(value)));
    this.preferences.update(p => ({ ...p, [category]: clamped }));
    await this.savePreferences();
  }

  async savePreferences(): Promise<void> {
    if (this.isSaving()) return;
    this.isSaving.set(true);
    try {
      await this.mealPlanService.saveCategoryPreferences(this.preferences());
    } catch {
      // Silent failure — user can retry by changing the value again
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Return the badge CSS classes for a category (matching Gerichte page colors).
   */
  categoryBadgeClass(category: DishCategory): string {
    if (category === 'Fisch') return 'bg-blue-100 text-blue-800';
    if (category === 'Fleisch') return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800'; // Vegetarisch
  }
}
