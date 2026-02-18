import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { LucideAngularModule, User, Mail, Lock, UserPlus } from 'lucide-angular';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private supabase = inject(SupabaseService);

  // Lucide icons
  readonly User = User;
  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly UserPlus = UserPlus;

  registerForm: FormGroup;
  isLoading = false;
  serverError = '';

  constructor() {
    this.registerForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  get displayName() {
    return this.registerForm.get('displayName');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.serverError = '';

    const { displayName, email, password } = this.registerForm.value;

    // Sign up with metadata
    const { error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    });

    this.isLoading = false;

    if (error) {
      this.serverError = error.message || 'Registrierung fehlgeschlagen';
      return;
    }

    // Navigate to email confirmation page
    this.router.navigate(['/email-bestaetigen']);
  }
}
