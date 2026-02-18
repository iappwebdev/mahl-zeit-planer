import { Injectable, inject, signal, effect, DestroyRef } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { HouseholdService } from './household.service';

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private supabase = inject(SupabaseService);
  private householdService = inject(HouseholdService);
  private destroyRef = inject(DestroyRef);

  /** Emits on dishes postgres_changes (INSERT/UPDATE/DELETE) */
  dishChange = signal<{ eventType: string; new: any; old: any } | null>(null);

  /** Emits on meal_assignments postgres_changes (INSERT/UPDATE/DELETE) */
  assignmentChange = signal<{ eventType: string; new: any; old: any } | null>(null);

  /** Emits on activity_log INSERT events */
  activityChange = signal<{ eventType: string; new: any; old: any } | null>(null);

  private channel: RealtimeChannel | null = null;
  private currentHouseholdId: string | null = null;

  constructor() {
    effect(() => {
      const householdId = this.householdService.householdId();

      if (householdId && householdId !== this.currentHouseholdId) {
        this.unsubscribe();
        this.subscribe(householdId);
      } else if (!householdId && this.currentHouseholdId) {
        this.unsubscribe();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.unsubscribe();
    });
  }

  subscribe(householdId: string): void {
    this.currentHouseholdId = householdId;

    this.channel = this.supabase.client
      .channel(`household:${householdId}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'dishes',
          filter: `household_id=eq.${householdId}`
        },
        (payload: any) => {
          this.dishChange.set({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old
          });
        }
      )
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'meal_assignments'
        },
        (payload: any) => {
          this.assignmentChange.set({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old
          });
        }
      )
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
          filter: `household_id=eq.${householdId}`
        },
        (payload: any) => {
          this.activityChange.set({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old
          });
        }
      )
      .subscribe();
  }

  unsubscribe(): void {
    if (this.channel) {
      this.supabase.client.removeChannel(this.channel);
      this.channel = null;
    }
    this.currentHouseholdId = null;
    this.dishChange.set(null);
    this.assignmentChange.set(null);
    this.activityChange.set(null);
  }
}
