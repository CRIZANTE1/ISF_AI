# Push FCM — Android (Capacitor) + Supabase — ISF IA

Guia de configuração do fluxo end-to-end de notificações push Firebase (`com.isfia.app`).

---

## Visão geral do fluxo

1. **Cliente Android:** `@capacitor/push-notifications` obtém token FCM e registra na Edge Function `push-register` (com JWT do usuário).
2. **Supabase:** tabela `device_push_tokens` (`user_id`, `fcm_token`, `platform`, `updated_at`).
3. **Envio:** Edge Functions usam `FCM_SERVICE_ACCOUNT_JSON` (HTTP v1) para enviar push.

```
App Android → push-register → device_push_tokens
Cron/Webhook → send-fcm / notify-inspection-due / notify-weekly-summary / notify-engagement-streak / enviar-lembrete-inatividade / enviar-atualizacoes-app → FCM → App
```

---

## 1. Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com).
2. Crie ou abra o projeto.
3. **Adicionar app → Android** com pacote `com.isfia.app`.
4. Baixe `google-services.json` e coloque em `android/app/google-services.json`.
5. Ative **Firebase Cloud Messaging API** no Google Cloud (se solicitado).

### Conta de serviço (backend)

1. Firebase → **Configurações do projeto → Contas de serviço**.
2. **Gerar nova chave privada** (JSON).
3. No Supabase → **Project Settings → Edge Functions → Secrets**, crie:

| Secret | Conteúdo |
|--------|----------|
| `FCM_SERVICE_ACCOUNT_JSON` | JSON completo da chave privada |
| `CRON_SECRET` | String aleatória forte (cron jobs) |

**Nunca** commite o JSON da conta de serviço no repositório.

---

## 2. Cliente (app)

### Dependências

```bash
npm install @capacitor/push-notifications@^6
npm run build && npx cap sync android
```

### Variáveis de ambiente

```env
# Push ativo por padrão; use false para desativar
VITE_ENABLE_PUSH=true
```

### Arquivos principais

| Arquivo | Função |
|---------|--------|
| `src/lib/pushFlags.ts` | `isPushEnabled()` |
| `src/lib/pushBackend.ts` | `registerToken()` → `push-register` |
| `src/lib/inAppNotificationStore.ts` | Fila de notificações em primeiro plano + deep links de sugestões |
| `src/hooks/useEngagementSuggestions.ts` | Gatilhos locais de sugestão (meta semanal, inatividade, etc.) |
| `src/capacitor/PushNotificationsEffects.tsx` | Registro, listeners, deep links |
| `src/App.tsx` | Renderiza `<PushNotificationsEffects />` quando push ativo |

### Capacitor

`capacitor.config.ts` inclui:

```ts
plugins: {
  PushNotifications: {
    presentationOptions: ['badge', 'sound', 'alert'],
  },
},
```

### Vite

**Não** externalize `@capacitor/push-notifications` no `vite.config.ts`. O plugin deve ser bundlado; a proteção em runtime usa `Capacitor.isNativePlatform()` e `isPushEnabled()`.

---

## 3. Edge Functions

| Função | verify_jwt | Autenticação |
|--------|------------|--------------|
| `push-register` | `true` | JWT do usuário |
| `send-fcm` | `false` | `Authorization: Bearer <SERVICE_ROLE_KEY>` |
| `notify-inspection-due` | `false` | `Authorization: Bearer <CRON_SECRET>` |
| `notify-weekly-summary` | `false` | `Authorization: Bearer <CRON_SECRET>` |
| `notify-engagement-streak` | `false` | `Authorization: Bearer <CRON_SECRET>` |
| `enviar-lembrete-inatividade` | `false` | `Authorization: Bearer <CRON_SECRET>` |
| `enviar-atualizacoes-app` | `false` | `Authorization: Bearer <SERVICE_ROLE_KEY>` |

### Deploy

```bash
supabase functions deploy push-register
supabase functions deploy send-fcm --no-verify-jwt
supabase functions deploy notify-inspection-due --no-verify-jwt
supabase functions deploy notify-weekly-summary --no-verify-jwt
supabase functions deploy notify-engagement-streak --no-verify-jwt
supabase functions deploy enviar-lembrete-inatividade --no-verify-jwt
supabase functions deploy enviar-atualizacoes-app --no-verify-jwt
```

### Exemplos de chamada

**Registrar token (automático pelo app após login):**

```
POST /functions/v1/push-register
Authorization: Bearer <user_jwt>
{ "fcm_token": "...", "platform": "android" }
```

**Enviar push a um usuário:**

```bash
curl -X POST "$SUPABASE_URL/functions/v1/send-fcm" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<uuid>","title":"ISF IA","body":"Mensagem","data":{"route":"/inspections"}}'
```

**Cron de inspeções pendentes:**

```bash
curl -X POST "$SUPABASE_URL/functions/v1/notify-inspection-due" \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Notificar atualização do app (todos os tokens):**

```bash
curl -X POST "$SUPABASE_URL/functions/v1/enviar-atualizacoes-app" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"version":"1.9.3"}'
```

**Cron — resumo semanal de inspeções (segunda 8h UTC):**

```bash
curl -X POST "$SUPABASE_URL/functions/v1/notify-weekly-summary" \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Cron — sequência de inspeções (diário 9h UTC):**

```bash
curl -X POST "$SUPABASE_URL/functions/v1/notify-engagement-streak" \
  -H "Authorization: Bearer $CRON_SECRET"
```

**Cron — lembrete de inatividade (segunda 11h UTC, email + FCM):**

```bash
curl -X POST "$SUPABASE_URL/functions/v1/enviar-lembrete-inatividade" \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Payload `data` — sugestões de engajamento

| `data.type` | `data.route` padrão | Descrição |
|-------------|---------------------|-----------|
| `inspection_upcoming` | `/equipment/{tipo}/{id}` | Inspeção em 3–7 dias (local) |
| `weekly_goal` | `/inspections` | Progresso da meta semanal (local) |
| `inactivity_nudge` | `/map` | Sem inspeção há 5–7 dias (local) |
| `sync_success_positive` | `/` | Sync concluída (local) |
| `empty_state_tip` | `/equipment/add` | Poucos equipamentos (local) |
| `weekly_summary` | `/inspections` | Resumo da semana anterior (cron) |
| `streak` | `/history` | Marco de dias consecutivos (cron) |
| `inactivity_push` | `/map` | Sem login há 7+ dias (cron) |

Todos incluem `category: suggestion` quando aplicável.

### Meta semanal configurável

- Coluna `profiles.weekly_inspection_goal` (padrão 3, intervalo 1–20).
- Ajustável em **Configurações** no app.
- Usada por `weekly_goal` (cliente) e `notify-weekly-summary` (servidor).

### Cron jobs (SQL)

Migration `supabase/migrations/20260628_engagement_cron.sql` agenda:

| Job | Horário UTC | Função SQL |
|-----|-------------|------------|
| `notify-weekly-summary` | Segunda 8h | `public.notify_weekly_summary()` |
| `notify-engagement-streak` | Diário 9h | `public.notify_engagement_streak()` |
| `enviar-lembrete-inatividade` | Segunda 11h | `public.enviar_lembrete_inatividade()` |

Secrets no Vault: `supabase_url`, `cron_secret`.

---

## 4. Android

- `minSdkVersion` ≥ **23** (exigido por `firebase-messaging`).
- Permissão `POST_NOTIFICATIONS` no `AndroidManifest.xml`.
- Dependências Firebase em `android/app/build.gradle` (se `google-services.json` existir).

---

## 5. Troubleshooting

| Erro | Causa provável |
|------|----------------|
| Tela preta / `Failed to resolve module specifier "@capacitor/push-notifications"` | Plugin externalizado no Vite — corrigir `vite.config.ts` |
| `AUTHENTICATION_FAILED` (Logcat) | `google-services.json` inválido ou SHA-1 não registrado no Firebase |
| `skipped: fcm_not_configured` | Secret `FCM_SERVICE_ACCOUNT_JSON` ausente no Supabase |
| Token não aparece em `device_push_tokens` | Usuário não logado ou permissão de notificação negada |

### SHA-1 (opcional)

Em muitos casos o FCM funciona sem configurar SHA-1. Se `AUTHENTICATION_FAILED` persistir:

```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

Adicione o SHA-1 em Firebase Console → app Android → Impressões digitais.

---

## 6. Checklist

- [ ] `google-services.json` em `android/app/`
- [ ] `npm install @capacitor/push-notifications@^6`
- [ ] `npm run build && npx cap sync android`
- [ ] Secret `FCM_SERVICE_ACCOUNT_JSON` no Supabase
- [ ] Secret `CRON_SECRET` (para cron de inspeções)
- [ ] Tabela `device_push_tokens` no banco
- [ ] Edge Functions deployadas
- [ ] Login no app + permissão de notificação concedida
- [ ] Token visível em `device_push_tokens`
