import { Injectable, inject, signal, effect, DestroyRef } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { HouseholdService } from './household.service';

/**
 * Singleton service managing Supabase Realtime channel subscriptions per household.
 * Automatically subscribes when a household is joined and unsubscribes when leaving.
 * Solo users (no household) have no subscriptions and no performance impact.
 */
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

  /** Emits on household_members postgres_changes (INSERT/UPDATE/DELETE) */
  memberChange = signal<{ eventType: string; new: any; old: any } | null>(null);

  /**
   * Emits on activity_log INSERT events. The `new` payload includes
   * `display_name`, `action`, `entity_name` from the trigger-populated row.
   * This is the source for person-named toast messages.
   */
  activityChange = signal<{ eventType: string; new: any; old: any } | null>(null);

  private channel: RealtimeChannel | null = null;
  private currentHouseholdId: string | null = null;

  constructor() {
    // React to household changes: subscribe when household joined, unsubscribe on leave
    effect(() => {
      const householdId = this.householdService.householdId();

      if (householdId && householdId !== this.currentHouseholdId) {
        // New household or changed household — resubscribe
        this.unsubscribe();
        this.subscribe(householdId);
      } else if (!householdId && this.currentHouseholdId) {
        // Left household — unsubscribe
        this.unsubscribe();
      }
    });

    // Clean up on service destroy
    this.destroyRef.onDestroy(() => {
      this.unsubscribe();
    });
  }

  /**
   * Creates a single channel for the household with listeners on all relevant tables.
   */
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
          // No filter: RLS handles security; meal_assignments don't have household_id directly
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
          event: '*',
          schema: 'public',
          table: 'household_members',
          filter: `household_id=eq.${householdId}`
        },
        (payload: any) => {
          this.memberChange.set({
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

  /**
   * Removes the current channel and resets all signals to null.
   */
  unsubscribe(): void {
    if (this.channel) {
      this.supabase.client.removeChannel(this.channel);
      this.channel = null;
    }
    this.currentHouseholdId = null;
    this.dishChange.set(null);
    this.assignmentChange.set(null);
    this.memberChange.set(null);
    this.activityChange.set(null);
  }
}
