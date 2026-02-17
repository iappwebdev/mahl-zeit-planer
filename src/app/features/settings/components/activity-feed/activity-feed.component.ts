import { Component, signal, inject, effect, OnInit } from '@angular/core';
import { HouseholdService } from '../../../../core/services/household.service';
import { RealtimeService } from '../../../../core/services/realtime.service';
import { ActivityLogEntry } from '../../models/household.model';

/**
 * Displays recent household activity log entries with user names,
 * action descriptions in German, and relative timestamps.
 * Auto-refreshes via Realtime signals when new changes arrive.
 * Only visible when user belongs to a household (parent controls this).
 */
@Component({
  selector: 'app-activity-feed',
  templateUrl: './activity-feed.component.html'
})
export class ActivityFeedComponent implements OnInit {
  private householdService = inject(HouseholdService);
  private realtime = inject(RealtimeService);

  entries = signal<ActivityLogEntry[]>([]);
  isLoading = signal(true);

  constructor() {
    // Re-fetch activity log whenever a dish or assignment change arrives via Realtime
    effect(() => {
      const dc = this.realtime.dishChange();
      const ac = this.realtime.assignmentChange();
      if (dc || ac) {
        this.loadActivity();
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadActivity();
  }

  async loadActivity(): Promise<void> {
    this.isLoading.set(true);
    try {
      const log = await this.householdService.getActivityLog(30);
      this.entries.set(log);
    } catch {
      // Silently ignore — activity feed is non-critical
      this.entries.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Maps an activity action string and entity name to a German description.
   */
  actionText(entry: ActivityLogEntry): string {
    const name = entry.entity_name || '';
    switch (entry.action) {
      case 'dish_added': return `${name} hinzugefuegt`;
      case 'dish_updated': return `${name} geaendert`;
      case 'dish_deleted': return `${name} entfernt`;
      case 'assignment_changed': return `${name} geaendert`;
      case 'plan_generated': return 'Wochenplan generiert';
      default: return 'etwas geaendert';
    }
  }

  /**
   * Maps an activity action string to an appropriate icon character.
   */
  actionIcon(action: string): string {
    switch (action) {
      case 'dish_added': return '🍽️';
      case 'dish_updated': return '✏️';
      case 'dish_deleted': return '✕';
      case 'assignment_changed': return '📅';
      case 'plan_generated': return '✨';
      default: return '•';
    }
  }

  /**
   * Returns a relative time string in German (e.g. "vor 2 Min.", "vor 1 Std.", "Gestern").
   */
  timeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'gerade eben';
    if (diffMin < 60) return `vor ${diffMin} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
  }

  /**
   * Returns CSS classes for the left-border accent based on action type.
   */
  entryBorderClass(action: string): string {
    if (action === 'dish_added' || action === 'plan_generated') return 'border-l-2 border-green-400';
    if (action === 'dish_deleted') return 'border-l-2 border-red-400';
    return 'border-l-2 border-blue-400';
  }
}
