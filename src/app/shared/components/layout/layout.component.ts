import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NavbarComponent } from '../navbar/navbar.component';
import { HouseholdService } from '../../../core/services/household.service';
import { RealtimeService } from '../../../core/services/realtime.service';

@Component({
  selector: 'app-layout',
  imports: [NavbarComponent, RouterOutlet],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit {
  private readonly householdService = inject(HouseholdService);
  private readonly snackBar = inject(MatSnackBar);
  // Injecting RealtimeService ensures it is instantiated when the authenticated layout loads.
  // The service's internal effect() on householdId handles subscribe/unsubscribe automatically.
  private readonly realtime = inject(RealtimeService);

  async ngOnInit(): Promise<void> {
    const inviteToken = sessionStorage.getItem('invite_token');
    if (inviteToken) {
      sessionStorage.removeItem('invite_token');
      try {
        await this.householdService.acceptInvite(inviteToken);
        this.snackBar.open('Du bist dem Haushalt beigetreten!', '', { duration: 4000 });
      } catch {
        this.snackBar.open('Einladung konnte nicht angenommen werden.', '', { duration: 4000 });
      }
    }
  }
}
