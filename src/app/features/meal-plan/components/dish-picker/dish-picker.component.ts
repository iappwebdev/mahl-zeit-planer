import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { DishService } from '../../../dishes/services/dish.service';
import { Dish } from '../../../dishes/models/dish.model';

/**
 * Bottom sheet component for picking a dish to assign to a meal plan day.
 * Supports category filtering and returns the selected dish (or null for clear).
 */
@Component({
  selector: 'app-dish-picker',
  imports: [],
  templateUrl: './dish-picker.component.html'
})
export class DishPickerComponent implements OnInit {
  private dishService = inject(DishService);
  private bottomSheetRef = inject(MatBottomSheetRef<DishPickerComponent>);

  /** Optional data passed when opening the bottom sheet */
  readonly data: { currentDishId?: string } = inject(MAT_BOTTOM_SHEET_DATA, { optional: true }) ?? {};

  // State signals
  allDishes = signal<Dish[]>([]);
  activeFilter = signal<string>('alle');
  isLoading = signal(false);

  /** Filter categories definition */
  readonly filterOptions = [
    { id: 'alle', label: 'Alle' },
    { id: 'Fisch', label: 'Fisch' },
    { id: 'Fleisch', label: 'Fleisch' },
    { id: 'Vegetarisch', label: 'Vegetarisch' },
    { id: 'favoriten', label: 'Favoriten' }
  ];

  /** Filtered dishes based on active category filter */
  filteredDishes = computed(() => {
    const filter = this.activeFilter();
    const dishes = this.allDishes();

    if (filter === 'alle') {
      return dishes;
    } else if (filter === 'favoriten') {
      return dishes.filter(d => d.is_favorite);
    } else {
      return dishes.filter(d => d.category === filter);
    }
  });

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    try {
      const dishes = await this.dishService.getAll();
      this.allDishes.set(dishes);
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Set the active category filter */
  setFilter(filterId: string): void {
    this.activeFilter.set(filterId);
  }

  /** Select a dish and close the bottom sheet, returning the selected dish */
  selectDish(dish: Dish): void {
    this.bottomSheetRef.dismiss(dish);
  }

  /** Close the bottom sheet returning null — signals "clear/remove dish" */
  clear(): void {
    this.bottomSheetRef.dismiss(null);
  }

  /** Close the bottom sheet without returning anything */
  close(): void {
    this.bottomSheetRef.dismiss(undefined);
  }
}
