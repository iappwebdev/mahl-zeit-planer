import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private supabase = inject(SupabaseService);

  resetForm: FormGroup;
  isLoading = false;
  successMessage = '';
  serverError = '';

  constructor() {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() {
    return this.resetForm.get('email');
  }

  async onSubmit() {
    if (this.resetForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.serverError = '';
    this.successMessage = '';

    const { email } = this.resetForm.value;
    const redirectTo = window.location.origin + '/anmelden';

    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    this.isLoading = false;

    if (error) {
      this.serverError = error.message || 'Anfrage fehlgeschlagen';
      return;
    }

    // Always show success message (security best practice - don't reveal if email exists)
    this.successMessage = 'Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Link zum Zuruecksetzen geschickt.';
    this.resetForm.reset();
  }
}
