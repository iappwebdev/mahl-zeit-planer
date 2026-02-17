import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HouseholdService } from '../../../../core/services/household.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { HouseholdMember, HouseholdInvite } from '../../models/household.model';

@Component({
  selector: 'app-household-panel',
  imports: [FormsModule],
  templateUrl: './household-panel.component.html'
})
export class HouseholdPanelComponent implements OnInit {
  protected readonly householdService = inject(HouseholdService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly supabaseService = inject(SupabaseService);

  protected readonly household = computed(() => this.householdService.currentHousehold());
  protected readonly members = signal<HouseholdMember[]>([]);
  protected readonly invites = signal<HouseholdInvite[]>([]);
  protected readonly isLoading = signal(true);
  protected newHouseholdName = '';
  protected inviteEmail = '';
  protected readonly inviteLink = signal<string | null>(null);
  protected readonly isSendingInvite = signal(false);
  protected currentUserId = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const { data } = await this.supabaseService.client.auth.getUser();
    if (data.user) {
      this.currentUserId.set(data.user.id);
    }

    await this.householdService.loadCurrentHousehold();

    if (this.household()) {
      await this.loadMembersAndInvites();
    }

    this.isLoading.set(false);
  }

  private async loadMembersAndInvites(): Promise<void> {
    const [members, invites] = await Promise.all([
      this.householdService.getMembers(),
      this.householdService.getInvites()
    ]);
    this.members.set(members);
    this.invites.set(invites);
  }

  async createHousehold(): Promise<void> {
    if (!this.newHouseholdName.trim()) {
      return;
    }
    try {
      await this.householdService.createHousehold(this.newHouseholdName.trim());
      this.newHouseholdName = '';
      this.snackBar.open('Haushalt erstellt!', '', { duration: 3000 });
      await this.loadMembersAndInvites();
    } catch (err: any) {
      this.snackBar.open('Fehler beim Erstellen: ' + (err.message ?? err), '', { duration: 4000 });
    }
  }

  async createInviteLink(): Promise<void> {
    try {
      const token = await this.householdService.createInviteLink();
      const url = `${window.location.origin}/einladen?token=${token}`;
      this.inviteLink.set(url);
      await navigator.clipboard.writeText(url);
      this.snackBar.open('Einladungslink kopiert!', '', { duration: 3000 });
      await this.loadMembersAndInvites();
    } catch (err: any) {
      this.snackBar.open('Fehler beim Erstellen des Links: ' + (err.message ?? err), '', { duration: 4000 });
    }
  }

  async sendEmailInvite(): Promise<void> {
    if (!this.inviteEmail.trim()) {
      return;
    }
    this.isSendingInvite.set(true);
    try {
      const token = await this.householdService.createInviteLink();
      const householdId = this.householdService.householdId();

      const response = await fetch(
        `${this.supabaseService.supabaseUrl}/functions/v1/invite-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await this.supabaseService.client.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ email: this.inviteEmail.trim(), household_id: householdId, token })
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Unbekannter Fehler');
      }

      const email = this.inviteEmail.trim();
      this.inviteEmail = '';
      this.snackBar.open(`Einladung gesendet an ${email}`, '', { duration: 4000 });
      await this.loadMembersAndInvites();
    } catch (err: any) {
      this.snackBar.open('Fehler beim Senden: ' + (err.message ?? err), '', { duration: 4000 });
    } finally {
      this.isSendingInvite.set(false);
    }
  }

  async removeMember(memberId: string): Promise<void> {
    if (!window.confirm('Mitglied entfernen?')) {
      return;
    }
    try {
      await this.householdService.removeMember(memberId);
      this.members.update(list => list.filter(m => m.id !== memberId));
      this.snackBar.open('Mitglied entfernt', '', { duration: 3000 });
    } catch (err: any) {
      this.snackBar.open('Fehler: ' + (err.message ?? err), '', { duration: 4000 });
    }
  }

  async leaveHousehold(): Promise<void> {
    if (!window.confirm('Haushalt wirklich verlassen?')) {
      return;
    }
    try {
      await this.householdService.leaveHousehold();
      this.members.set([]);
      this.invites.set([]);
      this.snackBar.open('Du hast den Haushalt verlassen', '', { duration: 4000 });
    } catch (err: any) {
      this.snackBar.open('Fehler: ' + (err.message ?? err), '', { duration: 4000 });
    }
  }

  async deleteHousehold(): Promise<void> {
    if (!window.confirm('Haushalt wirklich loeschen? Alle Mitglieder verlieren den Zugang. Diese Aktion kann nicht rueckgaengig gemacht werden.')) {
      return;
    }
    try {
      await this.householdService.deleteHousehold();
      this.members.set([]);
      this.invites.set([]);
      this.snackBar.open('Haushalt geloescht', '', { duration: 4000 });
    } catch (err: any) {
      this.snackBar.open('Fehler: ' + (err.message ?? err), '', { duration: 4000 });
    }
  }

  isCurrentUserOwner(): boolean {
    const hh = this.household();
    const uid = this.currentUserId();
    if (!hh || !uid) {
      return false;
    }
    return hh.owner_id === uid;
  }

  formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
