export type HouseholdRole = 'owner' | 'member';

export interface Household {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMemberProfile {
  id: string;
  display_name: string | null;
  household_role: HouseholdRole;
}

export interface HouseholdInvite {
  id: string;
  household_id: string;
  token: string;
  invited_email: string | null;
  created_by: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  household_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_name: string | null;
  created_at: string;
  display_name?: string;
}
