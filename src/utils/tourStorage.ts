/** Chaves de persistência local dos tours (por utilizador) */

export function contextualTourKeyOnboarding(userId: string) {
  return `isfia_app_tour_v1_done_${userId}`;
}

export function contextualTourKeyEquipmentList(userId: string) {
  return `isfia_tour_equipment_list_v1_${userId}`;
}

export function contextualTourKeyAddEquipment(userId: string) {
  return `isfia_tour_add_equipment_v1_${userId}`;
}

export function contextualTourKeyAddInspection(userId: string) {
  return `isfia_tour_add_inspection_v1_${userId}`;
}

export function isContextualTourDone(storageKey: string): boolean {
  try {
    return localStorage.getItem(storageKey) === '1';
  } catch {
    return false;
  }
}

export function markContextualTourDone(storageKey: string) {
  try {
    localStorage.setItem(storageKey, '1');
  } catch {
    /* ignore */
  }
}
