import { supabase } from '../lib/supabase';
import type { EquipmentCache } from '../types/equipment';
import type { UpcomingInspectionItem } from '../types/engagementNotifications';
import { logger } from './logger';

export interface InspectionTableConfig {
  table: string;
  dateColumn: string;
}

export const INSPECTION_TABLE_CONFIGS: InspectionTableConfig[] = [
  { table: 'inspecoes_extintores', dateColumn: 'data_servico' },
  { table: 'inspecoes_scba', dateColumn: 'data_inspecao' },
  { table: 'inspecoes_multigas', dateColumn: 'data_teste' },
  { table: 'inspecoes_camaras_espuma', dateColumn: 'data_inspecao' },
  { table: 'inspecoes_canhoes_monitores', dateColumn: 'data_inspecao' },
  { table: 'inspecoes_chuveiros_lava_olhos', dateColumn: 'data_inspecao' },
  { table: 'inspecoes_alarmes', dateColumn: 'data_inspecao' },
  { table: 'inspecoes_abrigos', dateColumn: 'data_inspecao' },
  { table: 'inspecoes_mangueiras', dateColumn: 'data_inspecao' },
  { table: 'custom_equipment_inspections', dateColumn: 'data_inspecao' },
  { table: 'water_reservoir_inspections', dateColumn: 'inspected_at' },
];

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBetween(from: Date, to: Date): number {
  const a = new Date(from);
  const b = new Date(to);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

type EquipmentRecord = Record<string, unknown>;

function pushUpcomingIfInWindow(
  items: UpcomingInspectionItem[],
  equipmentId: string,
  equipmentType: string,
  dateStr: string | null | undefined,
  daysMin: number,
  daysMax: number,
): void {
  if (!dateStr || dateStr === 'undefined') return;

  const inspectionDate = new Date(dateStr);
  if (Number.isNaN(inspectionDate.getTime())) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  inspectionDate.setHours(0, 0, 0, 0);

  const daysLeft = daysBetween(today, inspectionDate);
  if (daysLeft < daysMin || daysLeft > daysMax) return;

  items.push({
    equipmentId,
    equipmentType,
    daysLeft,
    date: dateStr,
  });
}

export async function countInspectionsThisWeek(userId: string): Promise<number> {
  const weekStart = startOfWeekMonday(new Date());
  const weekStartIso = toDateOnlyString(weekStart);
  const todayIso = toDateOnlyString(new Date());

  const counts = await Promise.all(
    INSPECTION_TABLE_CONFIGS.map(async (config) => {
      try {
        const { count, error } = await supabase
          .from(config.table as 'inspecoes_extintores')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte(config.dateColumn, weekStartIso)
          .lte(config.dateColumn, todayIso);

        if (error) {
          logger.warn(`inspectionStats: erro ao contar ${config.table}`, 'suggestions', error);
          return 0;
        }
        return count ?? 0;
      } catch {
        return 0;
      }
    }),
  );

  return counts.reduce((sum, n) => sum + n, 0);
}

export async function getLastInspectionDate(userId: string): Promise<Date | null> {
  const dates: Date[] = [];

  await Promise.all(
    INSPECTION_TABLE_CONFIGS.map(async (config) => {
      try {
        const { data, error } = await supabase
          .from(config.table as 'inspecoes_extintores')
          .select(config.dateColumn)
          .eq('user_id', userId)
          .order(config.dateColumn, { ascending: false })
          .limit(1);

        if (error || !data?.[0]) return;

        const raw = (data[0] as Record<string, string>)[config.dateColumn];
        if (!raw) return;

        const parsed = new Date(raw);
        if (!Number.isNaN(parsed.getTime())) {
          dates.push(parsed);
        }
      } catch {
        /* ignore */
      }
    }),
  );

  if (dates.length === 0) return null;
  return dates.reduce((latest, d) => (d > latest ? d : latest));
}

export function getUpcomingInspections(
  cache: EquipmentCache,
  daysMin = 3,
  daysMax = 7,
): UpcomingInspectionItem[] {
  const items: UpcomingInspectionItem[] = [];

  cache.extinguishers.forEach((eq) => {
    const id = eq.numero_identificacao;
    [
      eq.data_proxima_inspecao,
      eq.data_proxima_manutencao_2_nivel,
      eq.data_proxima_manutencao_3_nivel,
    ].forEach((date) => pushUpcomingIfInWindow(items, id, 'extintor', date, daysMin, daysMax));
  });

  const simpleTypes: Array<{
    list: EquipmentRecord[];
    type: string;
    idField: string;
    dateFields: string[];
  }> = [
    { list: cache.hoses as EquipmentRecord[], type: 'mangueira', idField: 'id_mangueira', dateFields: ['data_proximo_teste', 'data_proxima_inspecao'] },
    { list: cache.scbas as EquipmentRecord[], type: 'scba', idField: 'numero_serie_equipamento', dateFields: ['data_proxima_inspecao'] },
    { list: cache.multigasDetectors as EquipmentRecord[], type: 'multigas', idField: 'id_equipamento', dateFields: ['data_proximo_teste', 'data_proxima_inspecao'] },
    { list: cache.foamChambers as EquipmentRecord[], type: 'camara_espuma', idField: 'id_camara', dateFields: ['data_proxima_inspecao'] },
    { list: cache.cannonMonitors as EquipmentRecord[], type: 'canhao_monitor', idField: 'id_equipamento', dateFields: ['data_proxima_inspecao'] },
    { list: cache.eyewashStations as EquipmentRecord[], type: 'chuveiro_lavaolhos', idField: 'id_equipamento', dateFields: ['data_proxima_inspecao'] },
    { list: cache.alarmSystems as EquipmentRecord[], type: 'alarme', idField: 'id_sistema', dateFields: ['data_proxima_inspecao'] },
    { list: cache.shelters as EquipmentRecord[], type: 'abrigo', idField: 'id_abrigo', dateFields: ['data_proxima_inspecao'] },
  ];

  simpleTypes.forEach(({ list, type, idField, dateFields }) => {
    list.forEach((eq) => {
      const id = String(eq[idField] ?? '');
      if (!id) return;
      dateFields.forEach((field) => {
        pushUpcomingIfInWindow(items, id, type, eq[field] as string | undefined, daysMin, daysMax);
      });
    });
  });

  items.sort((a, b) => a.daysLeft - b.daysLeft);
  return items;
}

export function getTotalEquipmentCount(cache: EquipmentCache): number {
  return (
    cache.extinguishers.length +
    cache.hoses.length +
    cache.scbas.length +
    cache.multigasDetectors.length +
    cache.foamChambers.length +
    cache.cannonMonitors.length +
    cache.eyewashStations.length +
    cache.alarmSystems.length +
    cache.shelters.length +
    cache.waterReservoirs.length
  );
}

export function hasCriticalAlertsInCache(cache: EquipmentCache): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isOverdue = (dateStr: string | null | undefined): boolean => {
    if (!dateStr || dateStr === 'undefined') return false;
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  for (const eq of cache.extinguishers) {
    if (
      isOverdue(eq.data_proxima_inspecao) ||
      isOverdue(eq.data_proxima_manutencao_2_nivel) ||
      isOverdue(eq.data_proxima_manutencao_3_nivel)
    ) {
      return true;
    }
    const status = (eq.status_geral || eq.aprovado_inspecao || '').toLowerCase();
    if (status === 'pendente' || status === 'reprovado' || status === 'não' || status === 'nao') {
      return true;
    }
  }

  const checkList = (list: EquipmentRecord[], dateFields: string[], statusFields: string[]) => {
    for (const eq of list) {
      for (const field of dateFields) {
        if (isOverdue(eq[field] as string)) return true;
      }
      for (const field of statusFields) {
        const s = String(eq[field] ?? '').toLowerCase();
        if (s === 'pendente' || s === 'nao_conforme' || s === 'reprovado') return true;
      }
    }
    return false;
  };

  if (checkList(cache.hoses as EquipmentRecord[], ['data_proximo_teste'], ['resultado'])) return true;
  if (checkList(cache.scbas as EquipmentRecord[], ['data_proxima_inspecao'], ['status'])) return true;
  if (checkList(cache.multigasDetectors as EquipmentRecord[], ['data_proximo_teste'], ['status'])) return true;
  if (checkList(cache.foamChambers as EquipmentRecord[], ['data_proxima_inspecao'], ['status'])) return true;
  if (checkList(cache.cannonMonitors as EquipmentRecord[], ['data_proxima_inspecao'], ['status'])) return true;
  if (checkList(cache.eyewashStations as EquipmentRecord[], ['data_proxima_inspecao'], ['status_geral'])) return true;
  if (checkList(cache.alarmSystems as EquipmentRecord[], ['data_proxima_inspecao'], ['status'])) return true;
  if (checkList(cache.shelters as EquipmentRecord[], ['data_proxima_inspecao'], ['status'])) return true;

  return false;
}

export function daysSinceAccountCreated(createdAt: string | undefined): number {
  if (!createdAt) return 0;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 0;
  return daysBetween(created, new Date());
}

export function isWeekendPushDay(): boolean {
  const day = new Date().getDay();
  return day >= 4;
}
