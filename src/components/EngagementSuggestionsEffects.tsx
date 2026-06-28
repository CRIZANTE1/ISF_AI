import { useEngagementSuggestions } from '../hooks/useEngagementSuggestions';

/**
 * Efeito global: avalia gatilhos de notificações de sugestão (engajamento).
 */
export function EngagementSuggestionsEffects() {
  useEngagementSuggestions();
  return null;
}
