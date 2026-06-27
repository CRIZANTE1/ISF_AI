# Avaliação de Melhorias — ISF IA
**Data:** 27 de junho de 2026  
**Versão avaliada:** 1.9.3  
**Stack:** React 18 + TypeScript + Capacitor 6 + Supabase  

---

## Índice

- [🔴 Crítico — Segurança](#-crítico--segurança)
- [🟠 Alto — Arquitetura e Dívida Técnica](#-alto--arquitetura-e-dívida-técnica)
- [🟡 Médio — Performance e Bundle](#-médio--performance-e-bundle)
- [🟡 Médio — Bugs e Riscos Potenciais](#-médio--bugs-e-riscos-potenciais)
- [🟡 Médio — Experiência do Usuário (UX)](#-médio--experiência-do-usuário-ux)
- [🟡 Médio — Acessibilidade (a11y)](#-médio--acessibilidade-a11y)
- [🟢 Baixo — Melhorias Incrementais](#-baixo--melhorias-incrementais)
- [⚪ Funcionalidades Ausentes / Gaps](#-funcionalidades-ausentes--gaps)
- [✅ Pontos Fortes](#-pontos-fortes)

---

## 🔴 Crítico — Segurança

### 1. Segredo de licença exposto no bundle do cliente
**Arquivo:** `src/services/licenseService.ts`  
**Risco:** Qualquer pessoa que descompile o APK consegue extrair `VITE_LICENSE_SECRET` (ou o valor padrão `ISF_IA_2025_SECRET` hardcoded) e gerar tokens de licença válidos indefinidamente.

**Impacto:** Comprometimento total do modelo de negócio de licenciamento.

**Solução recomendada:**
- Mover toda a lógica de geração e validação de licenças para uma Edge Function Supabase.
- O cliente envia apenas a chave de ativação; o servidor verifica e devolve o status.
- Remover o fallback hardcoded `ISF_IA_2025_SECRET` imediatamente.

---

### 2. Dev bypass com escopo de produção
**Arquivo:** `src/components/ProtectedRoute.tsx`, `AuthContext.tsx`  
**Risco:** O flag `profile.dev === true` e a variável `VITE_DEV_EMAILS` permitem bypass completo de autenticação e licença. Se uma conta com `dev: true` for comprometida, ou se `VITE_DEV_EMAILS` vazar em um build de produção, o app fica completamente aberto.

**Solução recomendada:**
- Garantir que `VITE_DEV_EMAILS` seja definida apenas em builds de desenvolvimento (mode `development` do Vite).
- Adicionar verificação `import.meta.env.DEV` antes de qualquer lógica de bypass.
- Auditar a tabela `profiles` no Supabase: quantidade de usuários com `dev = true`.

---

### 3. Chaves Vite embutidas no bundle JS
**Arquivos:** Qualquer `import.meta.env.VITE_*`  
**Risco:** Todas as variáveis `VITE_*` são compiladas em texto claro no JavaScript final. Isso é esperado para `VITE_SUPABASE_ANON_KEY`, mas as RLS policies do Supabase precisam ser impecáveis para que a anon key não confira acesso indevido.

**Solução recomendada:**
- Executar `supabase inspect db` + revisar todas as policies de RLS, especialmente nas tabelas `profiles`, `licenses` e `custom_equipment_types`.
- Consultar `docs/SECURITY_DB_AUDIT.md` e validar se está atualizado.

---

## 🟠 Alto — Arquitetura e Dívida Técnica

### 4. Padrão de switch gigante repetido por tipo de equipamento
**Arquivos:** `AddInspectionPage.tsx`, `EquipmentDetailPage.tsx`, `AddEquipmentPage.tsx`, `EditEquipmentPage.tsx`, `EquipmentListPage.tsx`  
**Problema:** Cada nova tela precisa de um `switch/if` com ~10 casos (extintores, mangueiras, SCBA, multigás, etc.), resultando em blocos repetidos em 5+ arquivos. Adicionar um novo tipo de equipamento exige alterar todos os arquivos manualmente.

**Solução recomendada:** Implementar o `equipmentRegistry.ts` já documentado em `docs/ARCHITECTURE_ISSUES.md`. Um registro central mapearia cada tipo para: form component, checklist component, operations module, ID field, etc.

---

### 5. Arquivos monolíticos — alta complexidade ciclomática
| Arquivo | Linhas |
|---------|--------|
| `src/pages/AddInspectionPage.tsx` | ~2304 |
| `src/utils/pdfReportGenerator.ts` | ~2070 |
| `src/pages/EquipmentDetailPage.tsx` | ~1509 |
| `src/pages/QrGeneratorPage.tsx` | ~1092 |
| `src/pages/AddEquipmentPage.tsx` | ~969 |
| `src/pages/LicenseManagement.tsx` | ~947 |
| `src/pages/AdminUsersPage.tsx` | ~870 |

**Problema:** Arquivos com 1000+ linhas são praticamente impossíveis de testar unitariamente, geram conflitos de merge frequentes e dificultam revisão de código.

**Solução recomendada:**
- `AddInspectionPage`: extrair hooks por tipo (`useExtinguisherInspection`, `useHoseInspection`…) e sub-componentes de seção.
- `pdfReportGenerator`: separar em módulos por tipo de relatório (`extinguisherPdf.ts`, `hosePdf.ts`, etc.).
- `EquipmentDetailPage`: usar renderização condicional de componente ao invés de switch inline.

---

### 6. Tipagem fraca — uso extensivo de `any`
**Problema:** `EquipmentCacheContext` usa `any[]` para todos os tipos de equipamento. Dezenas de arquivos em `utils/` retornam `any`. Isso anula os benefícios do TypeScript e esconde bugs em tempo de compilação.

**Solução recomendada:**
- Definir tipos específicos por equipamento (`Extinguisher`, `Hose`, `Scba`, etc.) derivados de `src/types/supabase.ts`.
- Tipar `EquipmentCacheContext` com generics ou união discriminada.
- Ativar `strict: true` + `noImplicitAny: true` no `tsconfig.app.json` e corrigir os erros emergentes.

---

### 7. Mapeamento manual de constraints UNIQUE no sync offline
**Arquivo:** `src/utils/offlineSync.ts`  
**Problema:** Constraints UNIQUE do banco estão hardcoded no código de sync. Se o schema Supabase mudar, o sync pode começar a gerar duplicatas ou falhar silenciosamente.

**Solução recomendada:**
- Adicionar testes de integração para o fluxo offline/sync.
- Considerar usar Supabase `upsert` com `onConflict` explícito ao invés de detecção manual.
- Documentar cada constraint mapeada e adicionar ao processo de migration review.

---

### 8. Duplicação de biblioteca de mapas
**Problema:** O projeto importa **Leaflet** (`EquipmentMap.tsx`) e **MapLibre GL** (`components/ui/map.tsx`) simultaneamente. Ambas são pesadas (~300KB + ~500KB gzipadas) e cumprem papel similar.

**Solução recomendada:** Escolher uma biblioteca e migrar os usos restantes. MapLibre GL é mais moderno e suporta estilo vetorial; Leaflet tem ecossistema de plugins maior. Consolidar reduz o bundle em ~300–400KB.

---

### 9. Zero testes automatizados
**Problema:** `vitest` e `@playwright/test` estão configurados no `package.json`, mas não existe nenhum arquivo `*.test.ts` ou `*.spec.ts` no repositório.

**Impacto:** Refatorações e novos tipos de equipamento entram sem rede de segurança.

**Solução recomendada — prioridade de testes:**
1. `src/utils/equipmentStatus.ts` — lógica de datas crítica para alertas
2. `src/utils/qrInspectionUtils.ts` — parse de QR com formato proprietário
3. `src/utils/offlineSync.ts` — retry, deduplicação, mapeamento de constraints
4. `src/services/licenseService.ts` — após migração para servidor
5. `src/utils/actionPlanUtils.ts` — priorização por keywords

---

## 🟡 Médio — Performance e Bundle

### 10. Bundle JavaScript muito pesado para Android de entrada
**Problema:** Three.js, Framer Motion, Leaflet, MapLibre GL, jsPDF e html5-qrcode são carregados de forma que pode impactar o tempo de startup em dispositivos Android intermediários/básicos.

**Análise estimada do bundle:**
| Biblioteca | Peso aproximado (gzip) |
|------------|----------------------|
| Three.js | ~160 KB |
| Framer Motion | ~45 KB |
| Leaflet | ~40 KB |
| MapLibre GL | ~200 KB |
| jsPDF | ~80 KB |
| html5-qrcode | ~90 KB |

**Solução recomendada:**
- Three.js e shaders: lazy load apenas nas telas `Auth.tsx` e `Inspections.tsx`.
- jsPDF: carregar dinamicamente na geração de PDF (já parcialmente feito, verificar).
- html5-qrcode: lazy load apenas em `QrInspectionPage.tsx`.

---

### 11. 10 queries paralelas a cada refresh do cache de equipamentos
**Arquivo:** `src/contexts/EquipmentCacheContext.tsx`  
**Problema:** `refreshCache()` dispara 10 queries simultâneas ao Supabase (uma por tipo), sem paginação ou invalidação seletiva. Em redes móveis lentas, isso pode causar lentidão perceptível no app inteiro.

**Solução recomendada:**
- Adotar React Query (`@tanstack/react-query`) para cache com `stale-while-revalidate`.
- Invalidar apenas os tipos modificados, não tudo.
- Considerar `Promise.allSettled` ao invés de `Promise.all` para evitar falha total se um tipo falhar.

---

### 12. Logs verbosos em produção
**Arquivo:** `src/hooks/useGeolocation.ts` e outros  
**Problema:** Logs de debug (`console.log`) são gerados em produção, causando overhead desnecessário e potencialmente expondo dados sensíveis em ferramentas de debug do dispositivo.

**Solução recomendada:**
- Configurar o `src/utils/logger.ts` para silenciar logs abaixo de `warn` em `import.meta.env.PROD`.
- Adicionar regra ESLint `no-console` com exceção para o logger próprio.

---

### 13. EquipmentDetailPage com queries sequenciais
**Arquivo:** `src/pages/EquipmentDetailPage.tsx`  
**Problema:** O switch de tipo executa queries de forma sequencial no mount, adicionando latência em cascata.

**Solução recomendada:** Paralelizar com `Promise.all` onde não houver dependência entre os dados; adicionar `Suspense` + skeletons por seção.

---

## 🟡 Médio — Bugs e Riscos Potenciais

### 14. Verificação de licença não reage a mudanças em runtime
**Arquivo:** `src/components/ProtectedRoute.tsx`  
**Problema:** `hasCheckedRef` faz com que a licença seja verificada apenas uma vez por mount. Se o plano do usuário mudar (ex: trial expirar enquanto o app está aberto), o acesso não é revogado até a próxima navegação.

**Solução recomendada:** Adicionar listener no `AuthContext` que revalida a licença periodicamente (ex: a cada 30 min via `setInterval`) ou ao receber evento `app:resume` do Capacitor.

---

### 15. Billing mostra preço "a combinar" em vez do preço real
**Arquivo:** `src/hooks/useBilling.ts`, `src/pages/PlanPaymentPage.tsx`  
**Problema:** `getProductPrice()` sempre retorna `"a combinar"` sem consultar os preços reais retornados pelo Google Play Billing. O usuário não sabe o valor antes de comprar.

**Solução recomendada:** Usar `details.price` do objeto `ProductDetails` retornado pelo `BillingPlugin.getProducts()`.

---

### 16. Machine ID baseado em localStorage pode ser resetado
**Arquivo:** `src/services/licenseService.ts`  
**Problema:** O identificador de dispositivo é derivado de localStorage/fingerprint, que pode ser limpo pelo usuário (limpeza de dados do app), tornando a licença inutilizável ou permitindo re-ativação em outro dispositivo.

**Solução recomendada:**
- Usar `@capacitor/device` + `Device.getId()` para obter um ID persistente vinculado ao hardware.
- Após migração para server-side, o machine ID é irrelevante: o vínculo é feito por conta de usuário.

---

### 17. `CapacitorApp.removeAllListeners()` remove listeners de outros módulos
**Arquivo:** `src/App.tsx`  
**Problema:** `App.removeAllListeners()` chamado no cleanup do `useEffect` remove todos os listeners registrados globalmente, não apenas os do componente. Isso pode interferir com listeners de push notifications e geolocation.

**Solução recomendada:** Usar `CapacitorApp.addListener()` e armazenar a referência retornada para chamar `handle.remove()` individualmente no cleanup.

---

### 18. Fotos do Google Drive podem quebrar
**Arquivo:** `src/utils/photoUrlUtils.ts`, `src/components/ProgressiveImage.tsx`  
**Problema:** URLs de thumbnail do Google Drive (`/thumbnail?sz=w800`) falham se o arquivo não for público ou se o token de acesso expirar. O usuário vê imagem quebrada sem feedback.

**Solução recomendada:**
- Migrar fotos para Supabase Storage (já usado para evidências).
- Adicionar fallback visual adequado no `ProgressiveImage` com mensagem de erro.

---

### 19. `TimelineExample` — código morto não roteado
**Arquivo:** `src/pages/TimelineExample.tsx`  
**Problema:** A página existe mas não está registrada nas rotas de `App.tsx`.

**Solução recomendada:** Remover o arquivo ou adicioná-lo às rotas de desenvolvimento.

---

### 20. Erros silenciosos em `Inspections.tsx`
**Arquivo:** `src/pages/Inspections.tsx`  
**Problema:** Falha ao carregar tipos customizados é engolida silenciosamente, deixando o usuário sem feedback do problema.

**Solução recomendada:** Adicionar tratamento de erro com toast/feedback visual.

---

## 🟡 Médio — Experiência do Usuário (UX)

### 21. Formulário de inspeção sem wizard/stepper
**Arquivo:** `src/pages/AddInspectionPage.tsx`  
**Problema:** O formulário de inspeção tem scroll infinito com todas as seções visíveis simultaneamente (identificação, checklist, fotos, geolocalização, CO₂, plano de ação). Em inspeções longas, isso causa fadiga cognitiva para o inspetor em campo.

**Solução recomendada:** Implementar wizard em etapas com barra de progresso, salvamento parcial automático e navegação entre etapas.

---

### 22. Toasts podem ficar sob o notch/status bar no iOS
**Arquivo:** `src/contexts/ToastContext.tsx`  
**Problema:** Toasts posicionados no canto superior direito (`top-4 right-4`) não levam em conta a safe-area do iPhone (Dynamic Island, notch).

**Solução recomendada:** Usar variável CSS `env(safe-area-inset-top)` no posicionamento dos toasts.

---

### 23. Tema escuro forçado em várias páginas
**Problema:** Múltiplos componentes definem `backgroundColor: '#000000'` inline, ignorando o sistema de temas. O tema claro existe mas está subutilizado em páginas como `Auth.tsx`, `Dashboard.tsx` e UI decorativa.

**Solução recomendada:** Remover backgrounds inline; usar tokens de cor do Tailwind (`bg-background`, `bg-card`) que já respondem ao tema.

---

### 24. Página de pagamento sem preços visíveis
**Arquivo:** `src/pages/PlanPaymentPage.tsx`  
**Problema:** Planos mostram "a combinar" sem valor definido. UX confusa para decisão de compra.

**Solução recomendada:** Exibir preços reais do Play Store ou valores fixos enquanto os reais não são carregados (ver item 15).

---

## 🟡 Médio — Acessibilidade (a11y)

### 25. Contraste insuficiente em textos secundários
**Problema:** Textos com `text-gray-400` (`#9CA3AF`) em fundos escuros (`#000000` ou `#111827`) têm razão de contraste ~3.8:1, abaixo do mínimo WCAG AA (4.5:1 para texto normal).

**Solução recomendada:** Usar `text-gray-300` ou superior em fundos escuros; configurar tokens semânticos de cor no Tailwind.

---

### 26. Navegação por teclado limitada nos componentes 3D
**Arquivo:** `src/components/ui/radial-orbital-timeline.tsx`  
**Problema:** O seletor orbital de categorias (`Inspections.tsx`) não é navegável por teclado. Usuários com deficiência motora ou que usam teclado externo não conseguem acessar as categorias.

**Solução recomendada:** Adicionar `tabIndex`, handlers `onKeyDown` (Enter/Space/setas) e `role="button"` ou `role="option"` nos itens orbitais.

---

### 27. Áreas de toque pequenas em botões de ícone
**Problema:** Alguns botões com apenas ícone (ex: botões de ação em cards de equipamento) têm área de toque abaixo de 44×44px (mínimo recomendado por Apple e Android).

**Solução recomendada:** Adicionar `min-h-[44px] min-w-[44px]` e `p-2` aos botões de ícone, ou usar `touch-target` classes do Tailwind.

---

### 28. Formulários sem `aria-describedby` em erros de validação
**Problema:** Erros de validação do React Hook Form são exibidos visualmente mas não são associados aos campos via `aria-describedby`, o que impede leitores de tela de anunciá-los corretamente.

**Solução recomendada:** Passar `id` aos containers de erro e referenciar via `aria-describedby` nos inputs correspondentes.

---

## 🟢 Baixo — Melhorias Incrementais

### 29. Duplicata de `cn.ts`
**Arquivos:** `src/utils/cn.ts` e `src/lib/utils.ts`  
**Problema:** Função `cn()` (merge de classes Tailwind) duplicada em dois lugares.

**Solução recomendada:** Remover `src/utils/cn.ts` e importar de `src/lib/utils.ts` em todos os arquivos.

---

### 30. `HashRouter` dificulta deep links
**Arquivo:** `src/main.tsx`  
**Problema:** Necessário para Capacitor, mas URLs com `#` são menos amigáveis e complica o sistema de deep links atual.

**Solução recomendada:** Manter HashRouter (necessário para Capacitor) mas documentar o padrão de deep links e garantir que todos os casos de reset de senha e QR scan estejam cobertos por testes E2E.

---

### 31. `useBilling` com preços hardcoded
**Arquivo:** `src/hooks/useBilling.ts`  
**Problema:** IDs de produto `premium_monthly` e `premium_yearly` estão hardcoded. Se mudarem no Play Console, precisam ser atualizados no código.

**Solução recomendada:** Mover IDs de produto para variáveis de ambiente ou arquivo de configuração.

---

### 32. iOS Billing não implementado
**Problema:** O app tem suporte a billing apenas no Android. Usuários iOS não têm como assinar pelo app.

**Solução recomendada:** Implementar `@capacitor-community/in-app-purchases` ou `cordova-plugin-purchase` com suporte a StoreKit 2 para iOS.

---

### 33. Monitoramento de erros em produção ausente
**Problema:** `ErrorBoundary.tsx` captura erros React mas não os reporta para nenhum serviço externo. Bugs em produção são invisíveis.

**Solução recomendada:** Integrar Sentry (`@sentry/react` + `@sentry/capacitor`). A dependência foi referenciada em `vite.config.ts` mas não instalada.

---

### 34. Logs de `logger.ts` não têm nível de verbosidade configurável em produção
**Arquivo:** `src/utils/logger.ts`  
**Problema:** Logger categorizado existe mas não tem configuração de nível mínimo por categoria para builds de produção.

**Solução recomendada:** Adicionar `LOG_LEVEL` por categoria via env var ou config, silenciando `debug` e `info` em produção.

---

## ⚪ Funcionalidades Ausentes / Gaps

| Funcionalidade | Impacto | Esforço |
|----------------|---------|---------|
| Testes automatizados (unitários + E2E) | 🔴 Alto | Alto |
| iOS In-App Purchase (StoreKit) | 🟠 Alto | Médio |
| Busca global cross-equipamento | 🟡 Médio | Médio |
| Wizard de inspeção em etapas | 🟡 Médio | Alto |
| Monitoramento de erros (Sentry) | 🟡 Médio | Baixo |
| Relatório PDF para todos os tipos (não só extintores) | 🟡 Médio | Alto |
| Notificações iOS (APNs) | 🟡 Médio | Médio |
| Exportação de dados em XLSX | 🟢 Baixo | Baixo |
| Filtros avançados no histórico de inspeções | 🟢 Baixo | Baixo |
| Onboarding tutorial para admin | 🟢 Baixo | Médio |

---

## ✅ Pontos Fortes

O app tem uma base sólida com várias práticas bem implementadas:

- **Validação Zod** no sync offline garante integridade dos dados
- **DOMPurify** em `InstructionsPanel` previne XSS
- **Lazy loading** de rotas com `React.lazy` + `Suspense`
- **Skeletons consistentes** em 12+ variantes para loading states
- **Haptics integrados** aos toasts — boa experiência tátil mobile
- **Documentação extensa** em `docs/` (50+ arquivos)
- **Fail-closed** na verificação de licença — sem licença válida, acesso negado
- **i18n bem estruturado** com pt-BR e en-US
- **IndexedDB offline** com retry exponencial e deduplicação
- **PKCE auth flow** no cliente Supabase
- **Image compression** antes do upload para Storage
- **ErrorBoundary** com UI de fallback
- **Logger categorizado** por módulo

---

## Roadmap Sugerido de Prioridades

```
Semana 1-2  (crítico/segurança)
  ├── Mover validação de licença para Edge Function
  ├── Remover segredo hardcoded do bundle
  └── Auditar dev bypass em builds de produção

Semana 3-4  (estabilidade)
  ├── Corrigir bug de preço no Billing
  ├── Corrigir CapacitorApp.removeAllListeners
  ├── Adicionar primeiros testes unitários (equipmentStatus, qrInspectionUtils)
  └── Integrar Sentry

Mês 2  (performance e UX)
  ├── Lazy load Three.js e shaders
  ├── Consolidar Leaflet → MapLibre (ou vice-versa)
  ├── Safe-area nos toasts
  └── Corrigir contrastes a11y

Mês 3-4  (arquitetura)
  ├── Implementar equipmentRegistry.ts
  ├── Quebrar AddInspectionPage em módulos
  ├── Tipar EquipmentCacheContext
  └── Migrar para React Query

Mês 5+  (novas funcionalidades)
  ├── iOS Billing (StoreKit)
  ├── Wizard de inspeção
  ├── Busca global
  └── Relatórios PDF para todos os tipos
```

---

*Documento gerado em 27/06/2026 com base em análise estática completa do código-fonte.*
