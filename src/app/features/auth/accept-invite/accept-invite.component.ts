import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HouseholdService } from '../../../core/services/household.service';
import { SupabaseService } from '../../../core/services/supabase.service';

type PageState = 'loading' | 'success' | 'error' | 'unauthenticated' | 'no-token';

@Component({
  selector: 'app-accept-invite',
  imports: [RouterLink],
  templateUrl: './accept-invite.component.html'
})
export class AcceptInviteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly householdService = inject(HouseholdService);
  private readonly supabaseService = inject(SupabaseService);

  protected readonly state = signal<PageState>('loading');
  protected readonly errorMessage = signal<string>('');
  protected readonly householdName = signal<string>('');

  async ngOnInit(): Promise<void> {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.state.set('no-token');
      return;
    }

    const { session } = await this.supabaseService.getSession();

    if (!session) {
      // Store token so it can be processed after authentication
      sessionStorage.setItem('invite_token', token);
      this.state.set('unauthenticated');
      return;
    }

    // User is authenticated — accept the invite
    try {
      await this.householdService.acceptInvite(token);
      const household = this.householdService.currentHousehold();
      this.householdName.set(household?.name ?? '');
      this.state.set('success');
    } catch (err: any) {
      let message = 'Die Einladung konnte nicht angenommen werden.';
      if (err?.message?.includes('abgelaufen') || err?.message?.includes('expired')) {
        message = 'Diese Einladung ist abgelaufen oder wurde bereits verwendet.';
      } else if (err?.message?.includes('already')) {
        message = 'Du bist bereits Mitglied dieses Haushalts.';
      } else if (err?.message) {
        message = err.message;
      }
      this.errorMessage.set(message);
      this.state.set('error');
    }
  }
}
