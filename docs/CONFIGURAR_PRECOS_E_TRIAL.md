# Configuração de Preços e Sistema de Trial

Este documento explica como configurar os preços dos produtos no Google Play Console e como o sistema de trial funciona com a integração do Google Play Billing.

## 📋 Índice

1. [Configurar Preços no Google Play Console](#configurar-preços-no-google-play-console)
2. [Sistema de Trial](#sistema-de-trial)
3. [Como Funciona a Integração](#como-funciona-a-integração)
4. [Configuração de Períodos de Teste](#configuração-de-períodos-de-teste)
5. [Fluxo Completo](#fluxo-completo)

---

## 💰 Configurar Preços no Google Play Console

### Passo 1: Acessar Produtos e Assinaturas

1. Acesse o [Google Play Console](https://play.google.com/console)
2. Selecione seu app **ISF IA**
3. No menu lateral, vá em **Monetização > Produtos e assinaturas**
4. Clique em **Criar produto**

### Passo 2: Criar Assinatura Mensal

1. **ID do produto**: `premium_monthly`
2. **Nome do produto**: "ISF IA Premium - Mensal"
3. **Descrição**: "Assinatura mensal do ISF IA Premium com acesso a todas as funcionalidades"
4. **Tipo**: Assinatura
5. **Período de faturamento**: Mensal
6. **Preço**: Configure o preço em R$ (Reais Brasileiros)
   - Exemplo: R$ 24,90
   - O Google Play converte automaticamente para outras moedas

### Passo 3: Criar Assinatura Anual

1. **ID do produto**: `premium_yearly`
2. **Nome do produto**: "ISF IA Premium - Anual"
3. **Descrição**: "Assinatura anual do ISF IA Premium com desconto"
4. **Tipo**: Assinatura
5. **Período de faturamento**: Anual
6. **Preço**: Configure o preço em R$ (Reais Brasileiros)
   - Exemplo: R$ 262,80 (equivalente a 12 meses com 12% de desconto)
   - Cálculo: R$ 24,90 × 12 × 0,88 = R$ 262,80

### Passo 4: Configurar Período de Teste Gratuito (Opcional)

Para cada assinatura, você pode configurar:

1. **Período de teste gratuito**: 
   - Opção: 7, 14 ou 30 dias
   - Recomendado: **14 dias** (para corresponder ao trial atual do app)
   - Durante este período, o usuário não é cobrado

2. **Período de carência**:
   - Opção: 3, 7 ou 14 dias
   - Recomendado: **3 dias**
   - Se o pagamento falhar, o usuário ainda tem acesso durante a carência

3. **Preço introdutório** (opcional):
   - Ofereça um desconto no primeiro período
   - Exemplo: Primeiro mês por R$ 9,90

### Passo 5: Ativar os Produtos

1. Após criar os produtos, certifique-se de que estão **Ativos**
2. Os produtos devem estar publicados para aparecer no app
3. Aguarde alguns minutos para a propagação (pode levar até 1 hora)

---

## 🎁 Sistema de Trial

### Como Funciona Atualmente

O sistema de trial do app funciona em **duas camadas**:

#### 1. Trial do App (Sistema Interno)

- **Duração**: 14 dias a partir da criação da conta
- **Armazenado em**: `profiles.trial_ends_at` no Supabase
- **Plano inicial**: Todos os novos usuários começam com `plan = 'trial'`
- **Funcionalidades limitadas**:
  - Até 10 equipamentos
  - Acesso limitado a funcionalidades
  - Suporte por email

#### 2. Trial do Google Play (Período de Teste Gratuito)

- **Duração**: Configurável no Google Play Console (recomendado: 14 dias)
- **Funcionalidade**: Durante o trial, o usuário não é cobrado
- **Após o trial**: A assinatura é cobrada automaticamente

### ⚠️ Importante: Trial Ainda Funciona!

**SIM, o trial ainda funciona!** A integração do Google Play Billing **não substitui** o sistema de trial interno. Eles funcionam juntos:

1. **Usuário novo cria conta**:
   - Recebe `plan = 'trial'` automaticamente
   - `trial_ends_at` é definido para 14 dias no futuro
   - Pode usar o app normalmente no modo trial

2. **Durante o trial**:
   - Usuário pode fazer upgrade para Premium a qualquer momento
   - Se fizer upgrade, o plano muda para `premium`
   - Se não fizer upgrade, continua no trial até expirar

3. **Após expirar o trial**:
   - O app pode limitar funcionalidades (implementação futura)
   - Usuário pode fazer upgrade para continuar usando

4. **Se fizer upgrade durante o trial**:
   - O Google Play oferece período de teste gratuito (se configurado)
   - Após o período de teste, a assinatura é cobrada
   - O plano no app muda para `premium` imediatamente

### Configuração Recomendada

Para manter a experiência consistente:

1. **Configure 14 dias de teste gratuito** no Google Play Console
   - Isso corresponde ao trial interno de 14 dias
   - O usuário terá uma experiência contínua

2. **Mantenha o sistema de trial interno**:
   - Permite que usuários testem antes de decidir comprar
   - Funciona mesmo sem Google Play Billing (para web, etc)

---

## 🔄 Como Funciona a Integração

### Fluxo de Compra

```
1. Usuário clica em "Fazer Upgrade"
   ↓
2. App verifica se está no Android
   ↓
3. Inicializa Google Play Billing
   ↓
4. Busca produtos do Google Play Console
   ↓
5. Mostra preços reais do Google Play
   ↓
6. Usuário confirma compra
   ↓
7. Google Play processa pagamento
   ↓
8. App recebe confirmação
   ↓
9. Compra é registrada no Supabase (tabela purchases)
   ↓
10. Plano do usuário é atualizado (trial → premium)
   ↓
11. Usuário tem acesso premium imediatamente
```

### Sincronização Automática

O app sincroniza automaticamente:

- **Ao iniciar**: Verifica compras existentes e sincroniza
- **Após compra**: Registra imediatamente no banco de dados
- **Atualizações**: Se uma compra for cancelada/renovada, é atualizada automaticamente

---

## ⚙️ Configuração de Períodos de Teste

### No Google Play Console

1. Acesse o produto de assinatura
2. Vá em **Configurações de assinatura**
3. Configure:

   **Período de teste gratuito**:
   - 7 dias: Trial curto, menos risco de abuso
   - 14 dias: Recomendado, corresponde ao trial interno
   - 30 dias: Trial longo, mais atrativo mas maior risco

   **Período de carência**:
   - 3 dias: Recomendado, tempo suficiente para resolver problemas de pagamento
   - 7 dias: Mais generoso
   - 14 dias: Muito generoso, pode aumentar inadimplência

### No Código do App

O trial interno é gerenciado em:

- **Criação de perfil**: `supabase/migrations/20251103000000_add_role_and_plan.sql`
- **Verificação de trial**: `src/components/TrialStatusBar.tsx`
- **Atualização de plano**: `src/utils/adminOperations.ts`

**Não é necessário alterar o código** para o trial funcionar com o billing.

---

## 📊 Fluxo Completo

### Cenário 1: Usuário Novo (Sem Upgrade)

```
1. Usuário cria conta
   → plan = 'trial'
   → trial_ends_at = hoje + 14 dias

2. Usuário usa o app por 14 dias
   → Funcionalidades limitadas
   → Pode ver planos mas não compra

3. Trial expira
   → plan continua 'trial' (pode ser limitado no futuro)
   → Usuário pode fazer upgrade a qualquer momento
```

### Cenário 2: Usuário Faz Upgrade Durante Trial

```
1. Usuário cria conta
   → plan = 'trial'
   → trial_ends_at = hoje + 14 dias

2. Usuário clica em "Fazer Upgrade" (dia 5 do trial)
   → Google Play Billing inicia
   → Usuário confirma compra
   → Google Play oferece 14 dias de teste gratuito

3. Compra é processada
   → plan = 'premium' (atualizado imediatamente)
   → Compra registrada no Supabase
   → Usuário tem acesso premium

4. Após 14 dias de teste gratuito do Google Play
   → Primeira cobrança é feita
   → Assinatura continua ativa
```

### Cenário 3: Usuário Faz Upgrade Após Trial Expirar

```
1. Usuário cria conta
   → plan = 'trial'
   → trial_ends_at = hoje + 14 dias

2. Trial expira (14 dias depois)
   → plan continua 'trial'
   → Funcionalidades podem ser limitadas

3. Usuário decide fazer upgrade
   → Google Play Billing inicia
   → Usuário confirma compra
   → Google Play oferece 14 dias de teste gratuito

4. Compra é processada
   → plan = 'premium'
   → Compra registrada
   → Acesso premium restaurado
```

---

## 🎯 Resumo

### ✅ O que você precisa fazer:

1. **Configurar produtos no Google Play Console**:
   - `premium_monthly` - R$ 24,90/mês
   - `premium_yearly` - R$ 262,80/ano
   - Período de teste: 14 dias (recomendado)

2. **O trial interno continua funcionando**:
   - Não precisa alterar código
   - Usuários novos recebem 14 dias de trial
   - Podem fazer upgrade a qualquer momento

3. **Sistema funciona em conjunto**:
   - Trial interno: 14 dias gratuitos do app
   - Trial Google Play: 14 dias gratuitos da assinatura
   - Total: Usuário pode testar por até 28 dias sem pagar

### 📝 Notas Importantes

- **Preços são configurados no Google Play Console**, não no código
- **O app busca os preços automaticamente** do Google Play
- **Trial interno e Google Play trial funcionam juntos**
- **Compras são registradas automaticamente** no Supabase
- **Plano é atualizado automaticamente** após compra

---

## 🔍 Verificação

Para verificar se está tudo configurado corretamente:

1. **No Google Play Console**:
   - ✅ Produtos `premium_monthly` e `premium_yearly` criados
   - ✅ Produtos estão ativos
   - ✅ Preços configurados
   - ✅ Período de teste configurado (14 dias)

2. **No App**:
   - ✅ Hook `useBilling` inicializa automaticamente
   - ✅ Produtos são carregados do Google Play
   - ✅ Preços são exibidos corretamente
   - ✅ Compras são registradas no Supabase

3. **No Supabase**:
   - ✅ Tabela `purchases` existe
   - ✅ Compras são registradas automaticamente
   - ✅ Plano do usuário é atualizado após compra

---

## 🆘 Troubleshooting

### Preços não aparecem no app

- Verifique se os produtos estão **ativos** no Google Play Console
- Aguarde alguns minutos (pode levar até 1 hora para propagar)
- Verifique se os IDs dos produtos correspondem (`premium_monthly`, `premium_yearly`)

### Trial não funciona

- O trial interno **não depende** do Google Play Billing
- Verifique se `trial_ends_at` está sendo definido na criação do perfil
- Verifique a migration `20251103000000_add_role_and_plan.sql`

### Compra não atualiza o plano

- Verifique se a compra foi registrada na tabela `purchases`
- Verifique os logs do console para erros
- Certifique-se de que o usuário está autenticado

---

## 📚 Referências

- [Google Play Console - Assinaturas](https://support.google.com/googleplay/android-developer/answer/140504)
- [Google Play Billing - Períodos de Teste](https://developer.android.com/google/play/billing/subscriptions#free-trial)
- [Documentação do Billing Service](../src/services/billingService.ts)

