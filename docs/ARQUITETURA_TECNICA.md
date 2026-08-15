# ISF-IA — Arquitetura Técnica

**Versão do app:** 3.0.4 (build 45)  
**App ID:** `com.isfia.app`  
**Repositório:** https://github.com/CRISTIANCARLOS/ISF-IA

---

## 1. Visão geral

Aplicativo mobile para digitalização de inspeções de equipamentos de emergência (extintores, chuveiros, câmaras de abrigo, SCBA, alarmes etc.). Substitui checklists em papel por registro digital com foto, geolocalização, histórico e geração de relatórios PDF.

---

## 2. Stack tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Linguagem principal | TypeScript | 5.2 |
| Framework UI | React | 18.2 |
| Build | Vite | 7.2 |
| Wrapper mobile | Capacitor | 6.0 |
| Plataforma alvo | Android | API 22–36 |
| Backend / banco | Supabase (PostgreSQL) | Cloud (PaaS) |
| Autenticação | Supabase Auth (JWT) | — |
| Storage de arquivos | Supabase Storage | — |
| Funções serverless | Supabase Edge Functions (Deno) | — |
| Push notifications | Firebase Cloud Messaging (FCM) | — |
| Monitoramento de erros | Sentry | — |

---

## 3. Banco de dados

- **Tipo:** PostgreSQL gerenciado (Supabase Cloud)
- **Hospedagem:** infraestrutura Supabase (AWS, região sa-east-1 por padrão)
- **Acesso:** via PostgREST (REST) e SDK `@supabase/supabase-js`
- **Segurança:** Row Level Security (RLS) habilitado nas tabelas de negócio; autenticação por JWT emitido pelo Supabase Auth
- **Migrations:** versionadas em `supabase/migrations/`

---

## 4. Hospedagem e infraestrutura

| Componente | Onde roda |
|---|---|
| Banco de dados | Supabase Cloud (PostgreSQL gerenciado) |
| API REST / Auth | Supabase Cloud |
| Edge Functions (cron, e-mail, notificações) | Supabase Edge Runtime (Deno) |
| Storage de fotos | Supabase Storage (S3-compatible) |
| App distribuído | Google Play Store |
| Código-fonte | GitHub (`CRISTIANCARLOS/ISF-IA`) |

Não há servidor próprio. Toda a infra de backend é PaaS/serverless.

---

## 5. Capacidades offline

O app opera sem conexão (modo offline-first):

- Banco local via IndexedDB (Dexie.js)
- Fila de operações pendentes sincronizada automaticamente ao reconectar
- Compressão de imagens no dispositivo antes do upload

---

## 6. Notificações e automações

Edge Functions agendadas via `pg_cron` para:

- Lembretes de inspeção vencida
- Relatório diário / mensal por e-mail (SMTP via Supabase)
- Push via FCM (Firebase)
- Limpeza de usuários inativos

---

## 7. Requisitos de dispositivo (Android)

| Item | Valor |
|---|---|
| Android mínimo | 5.1 (API 22) |
| Android alvo | 15 (API 36) |
| Arquitetura | arm64-v8a, x86_64 |
| Permissões necessárias | Câmera, Localização, Notificações, Armazenamento |

---

## 8. Dependências de terceiros com impacto de segurança

| Serviço | Uso | Dado transmitido |
|---|---|---|
| Supabase | Backend completo | Dados de inspeção, usuários, fotos |
| Firebase (FCM) | Push notifications | Token de dispositivo |
| Sentry | Monitoramento de erros | Stack traces (sem PII) |
| Google Play Billing | Gestão de licenças | Dados de compra |

---

## 9. Distribuição iOS

O app **não está disponível para iOS**. Para publicar na App Store seriam necessários:

- Conta Apple Developer (USD 99/ano)
- Mac com Xcode para geração do IPA
- Processo de review da Apple (7–14 dias)

A base de código Capacitor suporta iOS — a estrutura `ios/` já existe no repositório.

---

## 10. Responsável técnico

**Cristian Carlos** — desenvolvimento, sustentação, backlog e distribuição.  
Sem envolvimento do time de TI da Vibra na operação contínua.
