import { Component } from '@angular/core';
import { HouseholdPanelComponent } from './components/household-panel/household-panel.component';

@Component({
  selector: 'app-settings',
  imports: [HouseholdPanelComponent],
  templateUrl: './settings.component.html'
})
export class SettingsComponent {}
