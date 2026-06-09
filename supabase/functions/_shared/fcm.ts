/**
 * FCM HTTP v1 (OAuth2 com conta de serviço). Usado pelas Edge Functions de envio.
 */
import { SignJWT, importPKCS8 } from "npm:jose@5.2.0";

export type ServiceAccount = {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
};

export function loadServiceAccountFromEnv(): ServiceAccount | null {
  const raw = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    return null;
  }
}

export async function getFcmAccessToken(sa: ServiceAccount): Promise<string> {
  const privateKey = await importPKCS8(sa.private_key);
  const assertion = await new SignJWT({
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(
      json.error_description || json.error || "Falha ao obter access_token FCM",
    );
  }
  return json.access_token as string;
}

export function stringifyData(
  data: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    out[k] = typeof v === "string" ? v : JSON.stringify(v);
  }
  return out;
}

/**
 * Envia uma mensagem FCM para um token usando FCM_SERVICE_ACCOUNT_JSON.
 */
export async function sendFcmMessage(
  fcmToken: string,
  title: string,
  body: string,
  data: Record<string, string> = {},
  sa?: ServiceAccount | null,
): Promise<Response> {
  const account = sa ?? loadServiceAccountFromEnv();
  if (!account) {
    throw new Error("fcm_not_configured");
  }

  const accessToken = await getFcmAccessToken(account);
  const url =
    `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`;

  return await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        token: fcmToken,
        notification: { title, body },
        data,
        android: { priority: "HIGH" },
      },
    }),
  });
}
