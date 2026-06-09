import { supabase } from '../lib/supabase';
import type { Profile } from '../contexts/AuthContext';
import { logger } from './logger';
import {
  contextualTourKeyAddEquipment,
  contextualTourKeyAddInspection,
  contextualTourKeyEquipmentList,
  contextualTourKeyOnboarding,
  isContextualTourDone,
  markContextualTourDone,
} from './tourStorage';

export type TourFlagKey =
  | 'onboarding_v1'
  | 'equipment_list_v1'
  | 'add_equipment_v1'
  | 'add_inspection_v1';

export function tourFlagStorageKey(flag: TourFlagKey, userId: string): string {
  switch (flag) {
    case 'onboarding_v1':
      return contextualTourKeyOnboarding(userId);
    case 'equipment_list_v1':
      return contextualTourKeyEquipmentList(userId);
    case 'add_equipment_v1':
      return contextualTourKeyAddEquipment(userId);
    case 'add_inspection_v1':
      return contextualTourKeyAddInspection(userId);
  }
}

export function isTourFlagCompleted(
  flag: TourFlagKey,
  profile: Profile | null,
  userId: string,
): boolean {
  if (profile?.app_tours?.[flag] === true) return true;
  return isContextualTourDone(tourFlagStorageKey(flag, userId));
}

export async function markTourFlagCompleted(
  flag: TourFlagKey,
  userId: string,
  options?: {
    currentAppTours?: Record<string, boolean> | null;
    refreshProfile?: () => Promise<void>;
  },
): Promise<void> {
  markContextualTourDone(tourFlagStorageKey(flag, userId));

  const merged: Record<string, boolean> = {
    ...(options?.currentAppTours ?? {}),
    [flag]: true,
  };

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ app_tours: merged })
      .eq('id', userId);

    if (error) {
      logger.warn('Failed to persist tour flag to Supabase', 'tour', { flag, error });
      return;
    }

    if (options?.refreshProfile) {
      await options.refreshProfile();
    }
  } catch (err) {
    logger.warn('Failed to persist tour flag', 'tour', err);
  }
}
