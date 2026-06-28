/**
 * Cron diário: notifica marcos de sequência de inspeções (9h UTC).
 * Authorization: Bearer CRON_SECRET
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  loadServiceAccountFromEnv,
  sendFcmMessage,
  stringifyData,
} from "../_shared/fcm.ts";
import {
  computeConsecutiveStreak,
  getFcmTokensForUser,
  getInspectionDatesByUser,
  logPushNotification,
  wasNotificationSentRecently,
} from "../_shared/inspectionTables.ts";

const STREAK_MILESTONES = [3, 7, 14, 30];

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

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id");

    if (error) throw error;

    let notifications = 0;
    let usersNotified = 0;

    for (const profile of profiles || []) {
      const userId = profile.id as string;

      const alreadySent = await wasNotificationSentRecently(
        supabase,
        userId,
        "push_streak",
        7,
      );
      if (alreadySent) continue;

      const dates = await getInspectionDatesByUser(supabase, userId, 35);
      const streak = computeConsecutiveStreak(dates);

      if (!STREAK_MILESTONES.includes(streak)) continue;

      const tokens = await getFcmTokensForUser(supabase, userId);
      if (tokens.length === 0) continue;

      const title = "ISF IA — Sequência ativa!";
      const body = streak === 1
        ? "1 dia consecutivo com inspeções. Parabéns!"
        : `${streak} dias consecutivos com inspeções. Parabéns!`;

      const data = stringifyData({
        type: "streak",
        category: "suggestion",
        route: "/history",
        streak_days: String(streak),
      });

      let sentForUser = false;
      for (const token of tokens) {
        const res = await sendFcmMessage(token, title, body, data, sa);
        if (res.ok) {
          notifications++;
          sentForUser = true;
        } else {
          console.error("[notify-engagement-streak] FCM error:", await res.text());
        }
      }

      if (sentForUser) {
        usersNotified++;
        await logPushNotification(supabase, userId, "push_streak");
      }
    }

    return new Response(
      JSON.stringify({ ok: true, users: usersNotified, notifications }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[notify-engagement-streak]", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
