import { Component, inject, computed } from '@angular/core';
import { HouseholdPanelComponent } from './components/household-panel/household-panel.component';
import { ActivityFeedComponent } from './components/activity-feed/activity-feed.component';
import { HouseholdService } from '../../core/services/household.service';

@Component({
  selector: 'app-settings',
  imports: [HouseholdPanelComponent, ActivityFeedComponent],
  templateUrl: './settings.component.html'
})
export class SettingsComponent {
  private householdService = inject(HouseholdService);

  /** True when the user belongs to a household — controls activity feed visibility */
  hasHousehold = computed(() => this.householdService.currentHousehold() !== null);
}
