/**
 * Notifica todos os usuários com token FCM sobre nova versão do app.
 * Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY (verify_jwt: false)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  loadServiceAccountFromEnv,
  sendFcmMessage,
  stringifyData,
} from "../_shared/fcm.ts";

const APP_VERSION = "3.0.5";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    let body: { version?: string; message?: string } = {};
    if (req.method === "POST" && req.body) {
      try {
        body = await req.json();
      } catch {
        /* usa defaults */
      }
    }

    const version = body.version || APP_VERSION;
    const customMessage = body.message?.trim();
    const title = `ISF IA v${version}`;
    const text = customMessage ||
      "Nova versão disponível! Atualize o app para aproveitar as melhorias.";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: rows, error } = await supabase
      .from("device_push_tokens")
      .select("fcm_token, user_id");

    if (error) throw error;

    const tokens = (rows || []).map((r: { fcm_token: string }) => r.fcm_token);
    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({
          ok: true,
          version,
          sent: 0,
          message: "Nenhum token FCM registrado",
        }),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const data = stringifyData({
      type: "app_update",
      version,
      route: "/profile/settings",
    });

    let sent = 0;
    const errors: string[] = [];

    for (const token of tokens) {
      const res = await sendFcmMessage(token, title, text, data, sa);
      if (res.ok) sent++;
      else {
        const errText = await res.text();
        errors.push(`${token.slice(0, 12)}…: ${res.status} ${errText}`);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        version,
        total_tokens: tokens.length,
        sent,
        errors: errors.length ? errors : undefined,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[enviar-atualizacoes-app]", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
