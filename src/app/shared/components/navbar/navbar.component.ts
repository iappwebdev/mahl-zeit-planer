import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);

  async logout(): Promise<void> {
    await this.supabaseService.signOut();
    await this.router.navigate(['/anmelden']);
  }
}
