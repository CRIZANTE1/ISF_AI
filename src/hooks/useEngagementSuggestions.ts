import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import { useTranslation } from './useTranslation';
import { notificationService } from '../services/notificationService';
import { canSendSuggestion, recordSuggestionSent } from '../lib/suggestionCooldown';
import {
  countInspectionsThisWeek,
  getLastInspectionDate,
  getUpcomingInspections,
  getTotalEquipmentCount,
  hasCriticalAlertsInCache,
  daysSinceAccountCreated,
  isWeekendPushDay,
} from '../utils/inspectionStats';
import {
  notifyInspectionUpcoming,
  notifyWeeklyGoalProgress,
  notifyInactivityNudge,
  notifyEmptyStateTip,
} from '../utils/suggestionNotificationUtils';
import type { PendingSuggestion } from '../types/engagementNotifications';
import { logger } from '../utils/logger';

function daysSince(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Avalia gatilhos de sugestão locais e dispara no máximo uma notificação por execução.
 */
export function useEngagementSuggestions(): void {
  const { user, profile } = useAuth();
  const { cache } = useEquipmentCache();
  const { t } = useTranslation();
  const runningRef = useRef(false);
  const lastCacheFetchRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    if (!cache.lastFetch) return;
    if (runningRef.current) return;
    if (lastCacheFetchRef.current === cache.lastFetch) return;

    lastCacheFetchRef.current = cache.lastFetch;

    const evaluate = async () => {
      runningRef.current = true;
      try {
        const permission = await notificationService.checkPermission();
        if (!permission.granted) return;

        if (hasCriticalAlertsInCache(cache)) return;

        const candidates: PendingSuggestion[] = [];
        const weeklyGoal = profile?.weekly_inspection_goal ?? 3;

        const upcoming = getUpcomingInspections(cache, 3, 7);
        if (upcoming.length > 0) {
          const first = upcoming[0];
          candidates.push({
            type: 'inspection_upcoming',
            priority: 'high',
            cooldownKey: `${first.equipmentType}-${first.equipmentId}`,
            payload: {
              type: 'inspection_upcoming',
              category: 'suggestion',
              route: `/equipment/${first.equipmentType}/${first.equipmentId}`,
              equipmentId: first.equipmentId,
              equipmentType: first.equipmentType,
              days: first.daysLeft,
            },
          });
        }

        if (isWeekendPushDay()) {
          const done = await countInspectionsThisWeek(user.id);
          if (done < weeklyGoal) {
            candidates.push({
              type: 'weekly_goal',
              priority: 'medium',
              payload: {
                type: 'weekly_goal',
                category: 'suggestion',
                route: '/inspections',
                done,
                target: weeklyGoal,
              },
            });
          }
        }

        const lastInspection = await getLastInspectionDate(user.id);
        if (lastInspection) {
          const days = daysSince(lastInspection);
          if (days >= 5 && days <= 7) {
            candidates.push({
              type: 'inactivity_nudge',
              priority: 'medium',
              payload: {
                type: 'inactivity_nudge',
                category: 'suggestion',
                route: '/map',
                days,
              },
            });
          }
        }

        const totalEquipment = getTotalEquipmentCount(cache);
        const accountAgeDays = daysSinceAccountCreated(user.created_at);
        if (totalEquipment < 3 && accountAgeDays >= 3) {
          candidates.push({
            type: 'empty_state_tip',
            priority: 'low',
            payload: {
              type: 'empty_state_tip',
              category: 'suggestion',
              route: '/equipment/add',
            },
          });
        }

        const priorityOrder = { high: 0, medium: 1, low: 2 };
        candidates.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        for (const candidate of candidates) {
          if (!canSendSuggestion(candidate.type, candidate.cooldownKey)) continue;

          switch (candidate.type) {
            case 'inspection_upcoming': {
              const item = upcoming[0];
              const label = t(`equipment.${item.equipmentType}`, {
                defaultValue: item.equipmentType,
              });
              await notifyInspectionUpcoming(
                item.equipmentId,
                item.equipmentType,
                label,
                item.daysLeft,
              );
              break;
            }
            case 'weekly_goal':
              await notifyWeeklyGoalProgress(
                candidate.payload.done ?? 0,
                candidate.payload.target ?? weeklyGoal,
              );
              break;
            case 'inactivity_nudge':
              await notifyInactivityNudge(candidate.payload.days ?? 0);
              break;
            case 'empty_state_tip':
              await notifyEmptyStateTip();
              break;
            default:
              break;
          }

          recordSuggestionSent(candidate.type, candidate.cooldownKey);
          break;
        }
      } catch (error) {
        logger.error('Erro ao avaliar sugestões de engajamento', 'suggestions', error);
      } finally {
        runningRef.current = false;
      }
    };

    void evaluate();
  }, [user?.id, user?.created_at, profile?.weekly_inspection_goal, cache, cache.lastFetch, t]);
}
