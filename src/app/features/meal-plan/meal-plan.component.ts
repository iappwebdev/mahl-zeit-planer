import {
  Component,
  inject,
  signal,
  computed,
  effect,
  WritableSignal,
  Signal,
  OnInit
} from '@angular/core';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MealPlanService } from './services/meal-plan.service';
import { MealPlanGeneratorService } from './services/meal-plan-generator.service';
import { RealtimeService } from '../../core/services/realtime.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { Dish } from '../dishes/models/dish.model';
import {
  DayOfWeek,
  MealAssignment,
  DAY_LABELS,
  getWeekStart,
  getWeekDates,
  formatDateGerman
} from './models/meal-plan.model';
import { DishPickerComponent } from './components/dish-picker/dish-picker.component';
import { CategoryConfigComponent } from './components/category-config/category-config.component';

/** Shape of each day card rendered in the template */
interface DayCard {
  dayOfWeek: DayOfWeek;
  dayLabel: string;       // e.g. "Montag, 17. Feb."
  date: string;           // ISO date string
  assignment: MealAssignment | null;
  isToday: boolean;
}

/**
 * Weekly calendar component — the primary meal planning interface.
 * Shows Mon-Sun day cards, supports manual dish assignment via bottom sheet,
 * week navigation, a category distribution summary, and one-click plan generation.
 */
@Component({
  selector: 'app-meal-plan',
  imports: [MatBottomSheetModule, MatSnackBarModule, CategoryConfigComponent],
  templateUrl: './meal-plan.component.html',
  styleUrl: './meal-plan.component.css'
})
export class MealPlanComponent implements OnInit {
  private mealPlanService = inject(MealPlanService);
  private generatorService = inject(MealPlanGeneratorService);
  private bottomSheet = inject(MatBottomSheet);
  private snackBar = inject(MatSnackBar);
  private realtime = inject(RealtimeService);
  private supabaseService = inject(SupabaseService);

  /** Current user ID — set in ngOnInit, used to skip own-change toasts */
  private currentUserId: string | null = null;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /** ISO date string for the Monday of the currently viewed week */
  currentWeekStart: WritableSignal<string> = signal(getWeekStart(new Date()));

  /** Map of dayOfWeek -> assignment for the current week */
  assignments: WritableSignal<Map<DayOfWeek, MealAssignment>> = signal(new Map());

  /** ID of the current weekly_plan DB record (null if no plan exists yet) */
  weeklyPlanId: WritableSignal<string | null> = signal(null);

  isLoading: WritableSignal<boolean> = signal(false);

  /** True while the generation algorithm is running */
  isGenerating: WritableSignal<boolean> = signal(false);

  /** Warnings returned by the generation algorithm (e.g. small library) */
  generationWarnings: WritableSignal<string[]> = signal([]);

  /** Whether the category config panel is expanded */
  showCategoryConfig: WritableSignal<boolean> = signal(false);

  // ---------------------------------------------------------------------------
  // Derived / computed
  // ---------------------------------------------------------------------------

  /** 7 ISO date strings Mon-Sun for the currently viewed week */
  weekDates: Signal<string[]> = computed(() => getWeekDates(this.currentWeekStart()));

  /** Today's ISO date string for "isToday" highlighting */
  private todayIso = new Date().toISOString().slice(0, 10);

  /** Array of 7 day card objects for the template */
  dayCards: Signal<DayCard[]> = computed(() => {
    const dates = this.weekDates();
    const map = this.assignments();
    return dates.map((date, i) => {
      const dayOfWeek = i as DayOfWeek;
      const dayName = DAY_LABELS[dayOfWeek];
      const dateShort = formatDateGerman(date);
      return {
        dayOfWeek,
        dayLabel: `${dayName}, ${dateShort}`,
        date,
        assignment: map.get(dayOfWeek) ?? null,
        isToday: date === this.todayIso
      };
    });
  });

  /** Count of each category assigned this week */
  categoryDistribution: Signal<Record<string, number>> = computed(() => {
    const counts: Record<string, number> = {};
    const map = this.assignments();
    map.forEach(assignment => {
      const cat = assignment.dish?.category;
      if (cat) {
        counts[cat] = (counts[cat] ?? 0) + 1;
      }
    });
    return counts;
  });

  /** Number of days with no assignment this week */
  freeDays: Signal<number> = computed(() => 7 - this.assignments().size);

  /** ISO date string for this week's Monday */
  private thisWeekStart = getWeekStart(new Date());

  /** ISO date string for next week's Monday */
  private nextWeekStart = (() => {
    const d = new Date(this.thisWeekStart + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + 7);
    return d.toISOString().slice(0, 10);
  })();

  /** True if the viewed week is past (before current week) — read-only mode */
  isPastWeek: Signal<boolean> = computed(() => this.currentWeekStart() < this.thisWeekStart);

  /** True if the viewed week is current or next (editable) */
  isCurrentOrFutureWeek: Signal<boolean> = computed(() => !this.isPastWeek());

  /** Always allow going back (past weeks are viewable) */
  canGoBack: Signal<boolean> = computed(() => true);

  /** Only allow navigating up to next week */
  canGoForward: Signal<boolean> = computed(() => this.currentWeekStart() < this.nextWeekStart);

  /** Display string for the week header, e.g. "KW 8 - 16. Feb. - 22. Feb. 2026" */
  weekHeaderLabel: Signal<string> = computed(() => {
    const dates = this.weekDates();
    const firstDate = new Date(dates[0] + 'T00:00:00Z');
    const lastDate = new Date(dates[6] + 'T00:00:00Z');

    // ISO week number
    const kw = this.getISOWeekNumber(firstDate);

    const firstFormatted = firstDate.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC'
    });
    const lastFormatted = lastDate.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    });

    return `KW ${kw} \u2013 ${firstFormatted} \u2013 ${lastFormatted}`;
  });

  /** Summary chips for category distribution display */
  distributionSummary: Signal<Array<{ label: string; colorClass: string }>> = computed(() => {
    const dist = this.categoryDistribution();
    const free = this.freeDays();
    const result: Array<{ label: string; colorClass: string }> = [];

    if ((dist['Fleisch'] ?? 0) > 0) {
      result.push({ label: `${dist['Fleisch']}x Fleisch`, colorClass: 'bg-red-100 text-red-800' });
    }
    if ((dist['Vegetarisch'] ?? 0) > 0) {
      result.push({ label: `${dist['Vegetarisch']}x Vegetarisch`, colorClass: 'bg-green-100 text-green-800' });
    }
    if ((dist['Fisch'] ?? 0) > 0) {
      result.push({ label: `${dist['Fisch']}x Fisch`, colorClass: 'bg-blue-100 text-blue-800' });
    }
    if (free > 0) {
      result.push({ label: `${free}x frei`, colorClass: 'bg-gray-100 text-gray-600' });
    }

    return result;
  });

  /** True when the plan already has at least one dish assigned */
  hasExistingAssignments: Signal<boolean> = computed(() => this.assignments().size > 0);

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  constructor() {
    // Reload week data whenever currentWeekStart changes (after init)
    effect(() => {
      const weekStart = this.currentWeekStart();
      // Effect runs after init — safe to call load
      this.loadWeek(weekStart);
    });

    // Effect: Reload current week whenever a meal assignment change arrives from Realtime
    effect(() => {
      const change = this.realtime.assignmentChange();
      if (change) {
        this.loadWeek(this.currentWeekStart());
      }
    });

    // Effect: Show person-named toast for assignment changes made by other household members
    effect(() => {
      const activity = this.realtime.activityChange();
      if (activity && (activity.new?.entity_type === 'meal_assignment' || activity.new?.entity_type === 'weekly_plan')) {
        if (activity.new.user_id !== this.currentUserId) {
          const displayName = activity.new.display_name || 'Jemand';
          const entityName = activity.new.entity_name || 'Wochenplan';
          const action = activity.new.action;

          let message = '';
          switch (action) {
            case 'assignment_changed': message = `${displayName} hat ${entityName} geaendert`; break;
            case 'plan_generated': message = `${displayName} hat Wochenplan generiert`; break;
            default: message = `${displayName} hat ${entityName} geaendert`; break;
          }
          if (message) {
            this.snackBar.open(message, '', { duration: 3000 });
          }
        }
      }
    });
  }

  ngOnInit(): void {
    // Load current user ID for toast filtering (skip own changes)
    this.supabaseService.client.auth.getUser().then(({ data }) => {
      this.currentUserId = data.user?.id ?? null;
    });
    // Initial load triggered via effect in constructor
  }

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  private async loadWeek(weekStart: string): Promise<void> {
    this.isLoading.set(true);
    this.assignments.set(new Map());
    this.weeklyPlanId.set(null);

    try {
      const assignmentList = await this.mealPlanService.getAssignmentsForWeek(weekStart);
      const map = new Map<DayOfWeek, MealAssignment>();
      for (const a of assignmentList) {
        map.set(a.day_of_week, a);
      }
      this.assignments.set(map);
    } catch (err: any) {
      this.snackBar.open(
        'Fehler beim Laden des Wochenplans: ' + (err.message ?? 'Unbekannter Fehler'),
        'OK',
        { duration: 4000 }
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Week navigation
  // ---------------------------------------------------------------------------

  navigateWeek(direction: -1 | 1): void {
    if (direction === 1 && !this.canGoForward()) return;

    const current = new Date(this.currentWeekStart() + 'T00:00:00Z');
    current.setUTCDate(current.getUTCDate() + direction * 7);
    this.currentWeekStart.set(current.toISOString().slice(0, 10));
  }

  // ---------------------------------------------------------------------------
  // Plan generation
  // ---------------------------------------------------------------------------

  async generatePlan(): Promise<void> {
    // If plan already has assignments, ask for confirmation before overwriting
    if (this.hasExistingAssignments()) {
      const confirmed = window.confirm('Bestehende Eintrage uberschreiben?');
      if (!confirmed) return;
    }

    this.isGenerating.set(true);
    this.generationWarnings.set([]);

    try {
      // Run the generation algorithm
      const result = await this.generatorService.generateWeeklyPlan(this.currentWeekStart());

      // Ensure a weekly plan record exists
      const plan = await this.mealPlanService.getOrCreateWeeklyPlan(this.currentWeekStart());
      const planId = plan.id;
      this.weeklyPlanId.set(planId);

      // Clear existing assignments
      await this.mealPlanService.clearWeekAssignments(planId);

      // Persist all 7 assignments (or however many were generated)
      const days: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];
      const savedAssignments = new Map<DayOfWeek, MealAssignment>();

      for (const day of days) {
        const dish = result.assignments.get(day);
        if (dish) {
          const saved = await this.mealPlanService.assignDish(planId, day, dish.id);
          savedAssignments.set(day, saved);
        }
      }

      // Update UI with persisted assignments
      this.assignments.set(savedAssignments);

      // Show any warnings from the algorithm
      this.generationWarnings.set(result.warnings);

    } catch (err: any) {
      this.snackBar.open(
        'Fehler beim Generieren: ' + (err.message ?? 'Unbekannter Fehler'),
        'OK',
        { duration: 4000 }
      );
    } finally {
      this.isGenerating.set(false);
    }
  }

  /** Toggle visibility of the category config panel */
  toggleCategoryConfig(): void {
    this.showCategoryConfig.update(v => !v);
  }

  /** Dismiss all generation warnings */
  dismissWarnings(): void {
    this.generationWarnings.set([]);
  }

  // ---------------------------------------------------------------------------
  // Dish assignment (manual)
  // ---------------------------------------------------------------------------

  openDishPicker(dayOfWeek: DayOfWeek): void {
    if (this.isPastWeek()) return;

    const currentAssignment = this.assignments().get(dayOfWeek);
    const ref = this.bottomSheet.open(DishPickerComponent, {
      data: { currentDishId: currentAssignment?.dish_id }
    });

    ref.afterDismissed().subscribe((result: Dish | null | undefined) => {
      if (result === undefined) {
        // Dismissed without action
        return;
      }

      if (result === null) {
        // Clear action
        this.removeDish(dayOfWeek);
      } else {
        // Dish selected
        this.assignDish(dayOfWeek, result);
      }
    });
  }

  private async assignDish(dayOfWeek: DayOfWeek, dish: Dish): Promise<void> {
    const previousAssignments = new Map(this.assignments());

    // Optimistic update — create a temporary assignment object
    const optimisticAssignment: MealAssignment = {
      id: 'optimistic-' + Date.now(),
      weekly_plan_id: this.weeklyPlanId() ?? '',
      day_of_week: dayOfWeek,
      dish_id: dish.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      dish
    };
    this.assignments.update(map => {
      const updated = new Map(map);
      updated.set(dayOfWeek, optimisticAssignment);
      return updated;
    });

    try {
      // Ensure a weekly plan exists for this week
      let planId = this.weeklyPlanId();
      if (!planId) {
        const plan = await this.mealPlanService.getOrCreateWeeklyPlan(this.currentWeekStart());
        planId = plan.id;
        this.weeklyPlanId.set(planId);
      }

      // Persist the assignment
      const saved = await this.mealPlanService.assignDish(planId, dayOfWeek, dish.id);

      // Replace optimistic with real data
      this.assignments.update(map => {
        const updated = new Map(map);
        updated.set(dayOfWeek, saved);
        return updated;
      });
    } catch (err: any) {
      // Rollback
      this.assignments.set(previousAssignments);
      this.snackBar.open(
        'Fehler beim Zuweisen: ' + (err.message ?? 'Unbekannter Fehler'),
        'OK',
        { duration: 4000 }
      );
    }
  }

  private async removeDish(dayOfWeek: DayOfWeek): Promise<void> {
    const currentAssignment = this.assignments().get(dayOfWeek);
    if (!currentAssignment) return;

    const previousAssignments = new Map(this.assignments());

    // Optimistic remove
    this.assignments.update(map => {
      const updated = new Map(map);
      updated.delete(dayOfWeek);
      return updated;
    });

    // Skip DB call if this was an optimistic-only assignment (no real ID yet)
    if (currentAssignment.id.startsWith('optimistic-')) return;

    try {
      await this.mealPlanService.removeDish(currentAssignment.id);
    } catch (err: any) {
      // Rollback
      this.assignments.set(previousAssignments);
      this.snackBar.open(
        'Fehler beim Entfernen: ' + (err.message ?? 'Unbekannter Fehler'),
        'OK',
        { duration: 4000 }
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Calculate ISO 8601 week number for a Date object */
  private getISOWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    // Set to nearest Thursday (ISO week starts on Monday)
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /** Returns the category badge CSS classes for a given category string */
  categoryBadgeClass(category: string | undefined): string {
    if (category === 'Fisch') return 'bg-blue-100 text-blue-800';
    if (category === 'Fleisch') return 'bg-red-100 text-red-800';
    if (category === 'Vegetarisch') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-600';
  }
}
