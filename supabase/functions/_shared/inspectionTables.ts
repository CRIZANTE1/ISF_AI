import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface InspectionTableConfig {
  table: string;
  dateColumn: string;
  idColumn: string;
}

export const INSPECTION_TABLE_CONFIGS: InspectionTableConfig[] = [
  { table: "inspecoes_extintores", dateColumn: "data_servico", idColumn: "numero_identificacao" },
  { table: "inspecoes_scba", dateColumn: "data_inspecao", idColumn: "numero_serie_equipamento" },
  { table: "inspecoes_multigas", dateColumn: "data_teste", idColumn: "id_equipamento" },
  { table: "inspecoes_camaras_espuma", dateColumn: "data_inspecao", idColumn: "id_camara" },
  { table: "inspecoes_canhoes_monitores", dateColumn: "data_inspecao", idColumn: "id_equipamento" },
  { table: "inspecoes_chuveiros_lava_olhos", dateColumn: "data_inspecao", idColumn: "id_equipamento" },
  { table: "inspecoes_alarmes", dateColumn: "data_inspecao", idColumn: "id_sistema" },
  { table: "inspecoes_abrigos", dateColumn: "data_inspecao", idColumn: "id_abrigo" },
  { table: "inspecoes_mangueiras", dateColumn: "data_inspecao", idColumn: "id_mangueira" },
  { table: "custom_equipment_inspections", dateColumn: "data_inspecao", idColumn: "id_equipamento" },
  { table: "water_reservoir_inspections", dateColumn: "inspected_at", idColumn: "reservoir_id" },
];

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export async function countInspectionsInRange(
  supabase: SupabaseClient,
  userId: string,
  start: Date,
  end: Date,
): Promise<number> {
  const startIso = toDateOnly(start);
  const endIso = toDateOnly(end);
  let total = 0;

  for (const config of INSPECTION_TABLE_CONFIGS) {
    try {
      const { count, error } = await supabase
        .from(config.table)
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte(config.dateColumn, startIso)
        .lte(config.dateColumn, endIso);

      if (!error && count) total += count;
    } catch {
      /* ignore per-table errors */
    }
  }

  return total;
}

export async function getInspectionDatesByUser(
  supabase: SupabaseClient,
  userId: string,
  lastNDays: number,
): Promise<string[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - lastNDays);
  const sinceIso = toDateOnly(since);
  const dateSet = new Set<string>();

  for (const config of INSPECTION_TABLE_CONFIGS) {
    try {
      const { data, error } = await supabase
        .from(config.table)
        .select(config.dateColumn)
        .eq("user_id", userId)
        .gte(config.dateColumn, sinceIso);

      if (error || !data) continue;

      for (const row of data) {
        const raw = (row as Record<string, string>)[config.dateColumn];
        if (raw) dateSet.add(raw.slice(0, 10));
      }
    } catch {
      /* ignore */
    }
  }

  return Array.from(dateSet).sort();
}

export function computeConsecutiveStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const unique = Array.from(new Set(dates)).sort();
  const today = toDateOnly(new Date());
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayIso = toDateOnly(yesterday);

  const dateSet = new Set(unique);
  if (!dateSet.has(today) && !dateSet.has(yesterdayIso)) {
    return 0;
  }

  let streak = 0;
  const cursor = dateSet.has(today) ? new Date() : yesterday;

  while (true) {
    const key = toDateOnly(cursor);
    if (!dateSet.has(key)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

export function getPreviousWeekRange(): { start: Date; end: Date } {
  const thisWeekStart = startOfWeekMonday(new Date());
  const prevWeekEnd = new Date(thisWeekStart);
  prevWeekEnd.setUTCDate(prevWeekEnd.getUTCDate() - 1);
  const prevWeekStart = new Date(prevWeekEnd);
  prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 6);
  return { start: prevWeekStart, end: prevWeekEnd };
}

export async function wasNotificationSentRecently(
  supabase: SupabaseClient,
  userId: string,
  emailType: string,
  withinDays: number,
): Promise<boolean> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - withinDays);

  const { data, error } = await supabase
    .from("email_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("email_type", emailType)
    .eq("status", "sent")
    .gte("sent_at", since.toISOString())
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export async function logPushNotification(
  supabase: SupabaseClient,
  userId: string,
  emailType: string,
): Promise<void> {
  try {
    await supabase.from("email_logs").insert({
      user_id: userId,
      email_type: emailType,
      status: "sent",
      sent_at: new Date().toISOString(),
    });
  } catch {
    /* non-blocking */
  }
}

export async function getFcmTokensForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("device_push_tokens")
    .select("fcm_token")
    .eq("user_id", userId);

  return (data || []).map((r: { fcm_token: string }) => r.fcm_token);
}
