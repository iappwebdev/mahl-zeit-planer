import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { LucideAngularModule, Mail, Lock, LogIn } from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private supabase = inject(SupabaseService);

  // Lucide icons
  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly LogIn = LogIn;

  loginForm: FormGroup;
  isLoading = false;
  serverError = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.serverError = '';

    const { email, password } = this.loginForm.value;
    const { user, error } = await this.supabase.signIn(email, password);

    this.isLoading = false;

    if (error) {
      this.serverError = 'E-Mail oder Passwort falsch';
      return;
    }

    if (user) {
      // Navigate to return URL or default to /gerichte
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/gerichte';
      this.router.navigateByUrl(returnUrl);
    }
  }
}
