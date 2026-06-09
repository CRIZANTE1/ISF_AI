/**
 * Cron / chamada agendada: lembretes de inspeção próxima ou validade vencendo.
 * Authorization: Bearer CRON_SECRET
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  loadServiceAccountFromEnv,
  sendFcmMessage,
  stringifyData,
} from "../_shared/fcm.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const cronSecret = Deno.env.get("CRON_SECRET") || "";
  const auth = req.headers.get("Authorization") || "";
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const sa = loadServiceAccountFromEnv();
  if (!sa) {
    return new Response(
      JSON.stringify({ skipped: true, reason: "fcm_not_configured" }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const horizonInspect = new Date();
    horizonInspect.setDate(horizonInspect.getDate() + 7);
    const horizonValidity = new Date();
    horizonValidity.setDate(horizonValidity.getDate() + 30);

    const hi = horizonInspect.toISOString();
    const hv = horizonValidity.toISOString();

    const { data: equipment, error } = await supabase
      .from("equipment")
      .select("user_id, equipment_id, proxima_inspecao, data_validade")
      .not("user_id", "is", null)
      .or(`proxima_inspecao.lte.${hi},data_validade.lte.${hv}`);

    if (error) throw error;

    const byUser = new Map<string, number>();
    for (const row of equipment || []) {
      const uid = row.user_id as string;
      byUser.set(uid, (byUser.get(uid) || 0) + 1);
    }

    let notifications = 0;

    for (const [userId, count] of byUser) {
      const { data: tokens } = await supabase
        .from("device_push_tokens")
        .select("fcm_token")
        .eq("user_id", userId);

      const list = (tokens || []).map((r: { fcm_token: string }) => r.fcm_token);
      const title = "ISF IA — Inspeções pendentes";
      const body = count === 1
        ? "Você tem 1 equipamento com inspeção ou validade próximas."
        : `Você tem ${count} equipamentos com inspeção ou validade próximas.`;
      const data = stringifyData({
        type: "inspection_due",
        count: String(count),
        route: "/inspections",
      });

      for (const t of list) {
        const res = await sendFcmMessage(t, title, body, data, sa);
        if (res.ok) notifications++;
        else console.error("[notify-inspection-due] FCM error:", await res.text());
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        users: byUser.size,
        equipment_rows: equipment?.length ?? 0,
        notifications,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[notify-inspection-due]", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
