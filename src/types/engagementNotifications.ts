export type SuggestionType =
  | 'inspection_upcoming'
  | 'weekly_goal'
  | 'inactivity_nudge'
  | 'sync_success_positive'
  | 'empty_state_tip'
  | 'weekly_summary'
  | 'streak'
  | 'inactivity_push';

export type SuggestionPriority = 'high' | 'medium' | 'low';

export interface SuggestionPayload {
  type: SuggestionType;
  category: 'suggestion';
  route: string;
  equipmentId?: string;
  equipmentType?: string;
  days?: number;
  done?: number;
  target?: number;
  streakDays?: number;
}

export interface UpcomingInspectionItem {
  equipmentId: string;
  equipmentType: string;
  daysLeft: number;
  date: string;
}

export interface PendingSuggestion {
  type: SuggestionType;
  priority: SuggestionPriority;
  payload: SuggestionPayload;
  cooldownKey?: string;
}
