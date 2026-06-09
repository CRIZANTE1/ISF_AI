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

function isAuthorized(req: Request): boolean {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const auth = req.headers.get("Authorization") || "";
  return serviceKey.length > 0 && auth === `Bearer ${serviceKey}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
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
    const body = await req.json();
    const userId = body.user_id as string | undefined;
    const fcmTokenDirect = body.fcm_token as string | undefined;
    const title = (body.title as string) || "ISF IA";
    const text = (body.body as string) || "";
    const data = stringifyData((body.data as Record<string, unknown>) || {});

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let tokens: string[] = [];
    if (fcmTokenDirect) {
      tokens = [fcmTokenDirect];
    } else if (userId) {
      const { data: rows, error } = await supabase
        .from("device_push_tokens")
        .select("fcm_token")
        .eq("user_id", userId);
      if (error) throw error;
      tokens = (rows || []).map((r: { fcm_token: string }) => r.fcm_token);
    } else {
      return new Response(
        JSON.stringify({ error: "user_id ou fcm_token obrigatório" }),
        {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        },
      );
    }

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, message: "sem tokens" }),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    let sent = 0;
    const errors: string[] = [];

    for (const t of tokens) {
      const res = await sendFcmMessage(t, title, text, data, sa);
      if (res.ok) sent++;
      else {
        const errText = await res.text();
        errors.push(`${t.slice(0, 12)}…: ${res.status} ${errText}`);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, sent, errors: errors.length ? errors : undefined }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[send-fcm]", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
