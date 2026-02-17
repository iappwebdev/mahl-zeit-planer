import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  /**
   * Get the Supabase client for direct access to database queries.
   * Use (SELECT auth.uid()) pattern in RLS policies for optimal performance.
   */
  get client(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Sign up a new user with email and password.
   */
  async signUp(email: string, password: string): Promise<{ user: User | null; error: any }> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });
    return { user: data.user, error };
  }

  /**
   * Sign in an existing user with email and password.
   */
  async signIn(email: string, password: string): Promise<{ user: User | null; error: any }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data.user, error };
  }

  /**
   * Sign out the current user.
   */
  async signOut(): Promise<{ error: any }> {
    const { error } = await this.supabase.auth.signOut();
    return { error };
  }

  /**
   * Get the current authenticated user.
   */
  async getUser(): Promise<{ user: User | null; error: any }> {
    const { data, error } = await this.supabase.auth.getUser();
    return { user: data.user, error };
  }

  /**
   * Get the current session.
   */
  async getSession(): Promise<{ session: Session | null; error: any }> {
    const { data, error } = await this.supabase.auth.getSession();
    return { session: data.session, error };
  }

  /**
   * Listen for auth state changes.
   */
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }
}
