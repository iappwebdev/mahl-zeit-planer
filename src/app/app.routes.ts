import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { DishesComponent } from './features/dishes/dishes.component';
import { MealPlanComponent } from './features/meal-plan/meal-plan.component';

export const routes: Routes = [
  // Auth routes (guest guard - redirect logged-in users away)
  {
    path: 'anmelden',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'registrieren',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'email-bestaetigen',
    loadComponent: () => import('./features/auth/confirm-email/confirm-email.component').then(m => m.ConfirmEmailComponent)
  },
  {
    path: 'passwort-vergessen',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    canActivate: [guestGuard]
  },
  // Protected routes (auth guard - require login)
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'gerichte', component: DishesComponent },
      { path: 'wochenplan', component: MealPlanComponent },
      { path: '', redirectTo: 'gerichte', pathMatch: 'full' }
    ]
  },
  // Fallback
  { path: '**', redirectTo: 'anmelden' }
];
