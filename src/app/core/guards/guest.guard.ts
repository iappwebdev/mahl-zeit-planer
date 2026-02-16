import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

/**
 * Guest guard that prevents authenticated users from accessing auth pages.
 * Redirects authenticated users to /gerichte (main landing page).
 */
export const guestGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const { user } = await supabase.getUser();

  if (user) {
    // Redirect authenticated users to main app
    router.navigate(['/gerichte']);
    return false;
  }

  return true;
};
