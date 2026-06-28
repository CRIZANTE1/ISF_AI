/**
 * Cron semanal: lembrete de inatividade (email + FCM).
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
  getFcmTokensForUser,
  logPushNotification,
  wasNotificationSentRecently,
} from "../_shared/inspectionTables.ts";

const SMTP_HOST = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "465");
const SMTP_USER = Deno.env.get("SMTP_USER") || "";
const SMTP_PASS = Deno.env.get("SMTP_PASS") || "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "";

const INACTIVITY_DAYS = 7;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function daysInactive(lastSignIn: string | null, createdAt: string): number {
  const hoje = new Date();
  const reference = lastSignIn ? new Date(lastSignIn) : new Date(createdAt);
  return Math.floor((hoje.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24));
}

async function sendSimpleEmail(
  to: string,
  subject: string,
  html: string,
): Promise<boolean> {
  if (!SMTP_USER || !SMTP_PASS || !EMAIL_FROM) return false;

  let conn: Deno.Conn | Deno.TlsConn | null = null;
  try {
    const boundary = `----=_Part_${Date.now()}`;
    const emailBody = [
      `From: ${EMAIL_FROM}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      html,
    ].join("\r\n");

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    conn = SMTP_PORT === 465
      ? await Deno.connectTls({ hostname: SMTP_HOST, port: SMTP_PORT })
      : await Deno.connect({ hostname: SMTP_HOST, port: SMTP_PORT });

    const readResponse = async (): Promise<string> => {
      if (!conn) return "";
      const buffer = new Uint8Array(4096);
      const n = await conn.read(buffer);
      return n === null ? "" : decoder.decode(buffer.subarray(0, n));
    };

    const sendCommand = async (command: string): Promise<string> => {
      if (!conn) return "";
      await conn.write(encoder.encode(command + "\r\n"));
      return await readResponse();
    };

    await readResponse();
    await sendCommand(`EHLO ${SMTP_HOST}`);
    await sendCommand("AUTH LOGIN");
    await sendCommand(btoa(SMTP_USER));
    const authPass = await sendCommand(btoa(SMTP_PASS));
    if (!authPass.includes("235")) return false;
    await sendCommand(`MAIL FROM:<${EMAIL_FROM}>`);
    await sendCommand(`RCPT TO:<${to}>`);
    await sendCommand("DATA");
    await conn.write(encoder.encode(emailBody + "\r\n.\r\n"));
    await readResponse();
    await sendCommand("QUIT");
    return true;
  } catch (e) {
    console.error("[enviar-lembrete-inatividade] SMTP error:", e);
    return false;
  } finally {
    try {
      conn?.close();
    } catch {
      /* ignore */
    }
  }
}

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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name");

    if (error) throw error;

    let emailsSent = 0;
    let pushSent = 0;

    for (const profile of profiles || []) {
      const userId = profile.id as string;

      const { data: authUser, error: authError } = await supabase.auth.admin
        .getUserById(userId);
      if (authError || !authUser?.user) continue;

      const dias = daysInactive(
        authUser.user.last_sign_in_at ?? null,
        authUser.user.created_at,
      );
      if (dias < INACTIVITY_DAYS) continue;

      const userName = (profile.full_name as string) ||
        authUser.user.email?.split("@")[0] ||
        "usuário";
      const email = authUser.user.email;

      const emailRecent = await wasNotificationSentRecently(
        supabase,
        userId,
        "lembrete_inatividade",
        14,
      );
      const pushRecent = await wasNotificationSentRecently(
        supabase,
        userId,
        "push_inactivity",
        14,
      );

      if (!emailRecent && email) {
        const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#1a1a1a;color:#fff;padding:24px;"><h1>👋 Estamos com saudade!</h1><p>Olá ${userName}, faz ${dias} dias que você não acessa o ISF IA.</p><p>Volte ao app para manter suas inspeções em dia.</p></body></html>`;
        const sent = await sendSimpleEmail(
          email,
          "👋 Estamos com saudade! Volte ao ISF IA",
          html,
        );
        if (sent) {
          emailsSent++;
          await supabase.from("email_logs").insert({
            user_id: userId,
            email_type: "lembrete_inatividade",
            email_address: email,
            status: "sent",
            sent_at: new Date().toISOString(),
          });
        }
      }

      if (!pushRecent && sa) {
        const tokens = await getFcmTokensForUser(supabase, userId);
        if (tokens.length > 0) {
          const title = "ISF IA — Sentimos sua falta";
          const body = `Faz ${dias} dias sem acessar o ISF IA. Volte e mantenha tudo em dia!`;
          const data = stringifyData({
            type: "inactivity_push",
            category: "suggestion",
            route: "/map",
            days: String(dias),
          });

          let sentPush = false;
          for (const token of tokens) {
            const res = await sendFcmMessage(token, title, body, data, sa);
            if (res.ok) {
              pushSent++;
              sentPush = true;
            }
          }
          if (sentPush) {
            await logPushNotification(supabase, userId, "push_inactivity");
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, emailsSent, pushSent }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[enviar-lembrete-inatividade]", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
