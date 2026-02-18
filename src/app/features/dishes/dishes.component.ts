import { Component, signal, computed, inject, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DishService } from './services/dish.service';
import { Dish, DishCategory, CreateDishPayload } from './models/dish.model';
import { LucideAngularModule, Plus, Search, Heart, Edit2, Trash2, X, Save } from 'lucide-angular';

/**
 * Dish management page component
 * Provides CRUD operations, filtering by category, search, and favorites toggle
 */
@Component({
  selector: 'app-dishes',
  imports: [ReactiveFormsModule, MatSnackBarModule, LucideAngularModule],
  templateUrl: './dishes.component.html',
  styleUrl: './dishes.component.css'
})
export class DishesComponent implements OnInit {
  private dishService = inject(DishService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  // Lucide icons
  readonly Plus = Plus;
  readonly Search = Search;
  readonly Heart = Heart;
  readonly Edit2 = Edit2;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly Save = Save;

  // State signals
  private allDishes = signal<Dish[]>([]);
  activeTab = signal<string>('alle');
  searchTerm = signal<string>('');
  isLoading = signal(false);
  error = signal<string | null>(null);
  editingDish = signal<Dish | null>(null);

  // Computed signals
  filteredDishes = computed(() => {
    const tab = this.activeTab();
    const search = this.searchTerm().toLowerCase();
    let dishes = this.allDishes();

    // Apply tab filter
    if (tab === 'favoriten') {
      dishes = dishes.filter(d => d.is_favorite);
    } else if (tab !== 'alle') {
      dishes = dishes.filter(d => d.category === tab);
    }

    // Apply search filter
    if (search) {
      dishes = dishes.filter(d => d.name.toLowerCase().includes(search));
    }

    // Sort: favorites first, then alphabetical
    return dishes.sort((a, b) => {
      if (a.is_favorite !== b.is_favorite) {
        return a.is_favorite ? -1 : 1;
      }
      return a.name.localeCompare(b.name, 'de');
    });
  });

  dishCount = computed(() => this.filteredDishes().length);
  hasNoDishes = computed(() => this.allDishes().length === 0);

  // Tabs definition
  readonly tabs = [
    { id: 'alle', label: 'Alle' },
    { id: 'Fisch', label: 'Fisch' },
    { id: 'Fleisch', label: 'Fleisch' },
    { id: 'Vegetarisch', label: 'Vegetarisch' },
    { id: 'favoriten', label: 'Favoriten' }
  ];

  // Reactive form
  dishForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    category: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadDishes();
  }

  async loadDishes(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const dishes = await this.dishService.getAll();
      this.allDishes.set(dishes);
    } catch (err: any) {
      this.error.set('Fehler beim Laden der Gerichte: ' + (err.message || 'Unbekannter Fehler'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveDish(): Promise<void> {
    if (this.dishForm.invalid) {
      this.dishForm.markAllAsTouched();
      return;
    }

    const formValue = this.dishForm.value as CreateDishPayload;
    const editing = this.editingDish();

    try {
      if (editing) {
        // Update existing dish
        const updated = await this.dishService.update(editing.id, formValue);
        this.allDishes.update(dishes =>
          dishes.map(d => d.id === updated.id ? updated : d)
        );
      } else {
        // Create new dish
        const created = await this.dishService.create(formValue);
        this.allDishes.update(dishes => [...dishes, created]);
      }
      this.dishForm.reset();
      this.editingDish.set(null);
    } catch (err: any) {
      this.snackBar.open(
        'Fehler beim Speichern: ' + (err.message || 'Unbekannter Fehler'),
        'OK',
        { duration: 4000 }
      );
    }
  }

  startEdit(dish: Dish): void {
    this.editingDish.set(dish);
    this.dishForm.patchValue({
      name: dish.name,
      category: dish.category
    });
  }

  cancelEdit(): void {
    this.dishForm.reset();
    this.editingDish.set(null);
  }

  async toggleFavorite(dish: Dish): Promise<void> {
    const newFavoriteStatus = !dish.is_favorite;

    // Optimistic update
    this.allDishes.update(dishes =>
      dishes.map(d => d.id === dish.id ? { ...d, is_favorite: newFavoriteStatus } : d)
    );

    try {
      await this.dishService.toggleFavorite(dish.id, newFavoriteStatus);
    } catch (err: any) {
      // Revert on error
      this.allDishes.update(dishes =>
        dishes.map(d => d.id === dish.id ? { ...d, is_favorite: dish.is_favorite } : d)
      );
      this.snackBar.open(
        'Fehler beim Aktualisieren: ' + (err.message || 'Unbekannter Fehler'),
        'OK',
        { duration: 4000 }
      );
    }
  }

  deleteDish(dish: Dish): void {
    // Optimistic delete
    this.allDishes.update(dishes => dishes.filter(d => d.id !== dish.id));

    const snackBarRef = this.snackBar.open(
      `"${dish.name}" gelöscht`,
      'Rückgängig',
      { duration: 5000 }
    );

    // Handle undo action
    snackBarRef.onAction()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Restore dish
        this.allDishes.update(dishes => [...dishes, dish]);
      });

    // Handle dismiss (confirm delete)
    snackBarRef.afterDismissed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (dismissal) => {
        if (!dismissal.dismissedByAction) {
          // Actually delete from database
          try {
            await this.dishService.delete(dish.id);
          } catch (err: any) {
            // Restore dish on error
            this.allDishes.update(dishes => [...dishes, dish]);
            this.snackBar.open(
              'Fehler beim Löschen: ' + (err.message || 'Unbekannter Fehler'),
              'OK',
              { duration: 4000 }
            );
          }
        }
      });
  }

  setTab(tabId: string): void {
    this.activeTab.set(tabId);
  }

  updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }
}
