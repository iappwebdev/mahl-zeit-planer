import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

/**
 * Auth guard that protects routes requiring authentication.
 * Redirects unauthenticated users to /anmelden (login page) with return URL.
 */
export const authGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const { user } = await supabase.getUser();

  if (!user) {
    // Redirect to login with return URL
    router.navigate(['/anmelden'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  return true;
};
