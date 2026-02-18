import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { LucideAngularModule, ChefHat, Calendar, LogOut, Menu, X } from 'lucide-angular';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);

  // Lucide icons
  readonly ChefHat = ChefHat;
  readonly Calendar = Calendar;
  readonly LogOut = LogOut;
  readonly Menu = Menu;
  readonly X = X;

  async logout(): Promise<void> {
    await this.supabaseService.signOut();
    await this.router.navigate(['/anmelden']);
  }
}
