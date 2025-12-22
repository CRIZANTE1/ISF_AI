# Documentação: Lógica de Licenças

## Visão Geral

O sistema de licenças do ISFIA Android controla o acesso ao aplicativo através de três tipos de licenças: **Experimental** (trial), **Premium** e **Lifetime** (vitalícia). Cada dispositivo possui um Machine ID único que identifica a licença.

## Arquitetura

### Componentes Principais

1. **LicenseService** (`src/services/licenseService.ts`)
   - Serviço centralizado para gerenciamento de licenças
   - Singleton exportado como `licenseService`

2. **ProtectedRoute** (`src/components/ProtectedRoute.tsx`)
   - Componente que protege rotas verificando licença antes de permitir acesso

3. **Tipos** (`src/types/license.ts`)
   - Interfaces TypeScript para `License` e `LicenseStatus`
   - Interface `License` inclui `user_id` e objeto `user` com informações do usuário relacionado

## Machine ID

O Machine ID é um identificador único gerado para cada dispositivo. A geração segue esta ordem de prioridade:

### 1. Cache em Memória
- Se já foi obtido anteriormente, retorna do cache

### 2. Capacitor (Android Nativo)
- Tenta obter via plugin nativo do Capacitor
- Fallback para `localStorage` se disponível

### 3. Browser Fingerprinting (Web)
- Combina características do navegador:
  - User Agent
  - Idioma
  - Resolução de tela
  - Timezone
  - Canvas fingerprint
  - Hardware concurrency
  - Device memory
  - Platform
  - Hostname
- Gera hash SHA-256 e usa os primeiros 16 caracteres

### 4. Fallback Final
- Timestamp + random string (16 caracteres)

O Machine ID é persistido no `localStorage` para manter consistência entre sessões.

## Tipos de Licença

### 1. Experimental (Trial)
- **Duração**: 14 dias a partir da data de instalação
- **Token de Ativação**: Não possui
- **Uso**: Período de avaliação gratuito
- **Validação**: Baseada na data de instalação (`install_date`)

```typescript
// Status quando em trial
{
  valid: true,
  daysRemaining: diasRestantes,
  expired: false,
  isActivated: false,
  isLifetime: false,
  licenseType: 'experimental',
  isTrial: true,
  trialDaysRemaining: diasRestantes
}
```

### 2. Premium
- **Duração**: 365 dias a partir da última ativação
- **Token de Ativação**: Possui token único gerado
- **Uso**: Licença paga anual
- **Validação**: Baseada na data da última ativação (`last_activation_date`)

```typescript
// Status quando premium ativa
{
  valid: true,
  daysRemaining: diasRestantes,
  expired: false,
  isActivated: true,
  isLifetime: false,
  licenseType: 'premium',
  isTrial: false
}
```

### 3. Lifetime (Vitalícia)
- **Duração**: Infinita
- **Token de Ativação**: Opcional
- **Uso**: Licença vitalícia
- **Validação**: Sempre válida

```typescript
// Status quando lifetime
{
  valid: true,
  daysRemaining: Infinity,
  expired: false,
  isActivated: true,
  isLifetime: true,
  licenseType: 'lifetime',
  isTrial: false
}
```

## Associação de Usuários às Licenças

### Associação Automática

O sistema associa automaticamente usuários às licenças quando fazem login:

```typescript
async associateUserToLicense(userId: string, machineId?: string)
```

**Fluxo de Associação:**
1. Quando um usuário faz login, o `ProtectedRoute` chama automaticamente `associateUserToLicense()`
2. A função verifica se a licença existe para o `machine_id` atual
3. **Se a licença não existe**: Cria nova licença experimental com `user_id` já associado
4. **Se a licença existe sem `user_id`**: Associa o usuário atual (licenças antigas)
5. **Se a licença já tem o mesmo `user_id`**: Não faz nada (otimização)
6. **Se a licença tem `user_id` diferente**: **NÃO sobrescreve** (proteção contra conflitos)

**Proteção contra Conflitos:**
- Evita que um usuário "roube" a licença de outro
- Loga aviso quando há tentativa de associação inválida
- Mantém a integridade das associações existentes

### Visualização do Usuário Relacionado

Na página de gerenciamento de licenças (`LicenseManagement.tsx`), o sistema:
- Busca automaticamente informações do usuário quando `user_id` está presente
- Exibe nome, email e ID do usuário relacionado à licença
- Separa visualmente "Usuário do Sistema" de "Informações do Cliente"

## Fluxo de Verificação de Licença

### 1. Obtenção ou Criação de Licença

```typescript
async getOrCreateLicense(machineId?: string): Promise<License | null>
```

**Fluxo:**
1. Busca licença existente no Supabase pelo `machine_id`
2. Se não existe, cria nova licença experimental:
   - `install_date`: Data atual
   - `activation_token`: null
   - `license_type`: 'experimental'
   - `is_lifetime`: false
   - `is_active`: true
   - `user_id`: null (será associado automaticamente no login)

### 2. Verificação de Status

```typescript
async checkLicenseStatus(machineId?: string): Promise<LicenseStatus>
```

**Ordem de Verificação:**

1. **Licença não encontrada**
   - Retorna status inválido

2. **Licença revogada** (`revoked_at` não é null)
   - Retorna status inválido com `isRevoked: true`

3. **Licença Lifetime**
   - Retorna sempre válida com `daysRemaining: Infinity`

4. **Licença Premium**
   - Calcula dias desde `last_activation_date`
   - Se >= 365 dias: expirada
   - Se < 365 dias: válida com dias restantes

5. **Licença Experimental**
   - Calcula dias desde `install_date`
   - Se < 14 dias: trial válido
   - Se >= 14 dias: expirado

## Proteção de Rotas

O componente `ProtectedRoute` verifica a licença antes de permitir acesso:

### Bypass para Desenvolvedores

Usuários com `profile.dev === true` têm acesso completo sem verificação de licença.

### Associação Automática no Login

Antes de verificar o status da licença, o sistema:
1. Associa automaticamente o usuário logado à licença do dispositivo atual
2. Chama `associateUserToLicense(user.id)` para garantir que a licença está vinculada ao usuário

### Lógica de Acesso

```typescript
// 1. Sem usuário → redireciona para login
if (!user) return <Navigate to="/auth" />;

// 2. Desenvolvedor → acesso total
if (profile?.dev === true) return children;

// 3. Associar usuário à licença (automático)
if (user.id) {
  await licenseService.associateUserToLicense(user.id);
}

// 4. Verificar status da licença
const status = await licenseService.checkLicenseStatus();

// 5. Sem status de licença → permite acesso (fail-open)
if (!licenseStatus) return children;

// 6. Licença inválida e não trial → redireciona para ativação
if (!licenseStatus.valid && !licenseStatus.isTrial && licenseStatus.expired) {
  return <Navigate to="/activate-license" />;
}

// 7. Licença válida ou trial → permite acesso
return children;
```

### Fail-Open Strategy

Em caso de erro na verificação, o sistema adota estratégia **fail-open**:
- Permite acesso temporário
- Define status como trial de 14 dias
- Evita bloquear o app por problemas de rede/configuração

## Geração de Token de Ativação

### Algoritmo

```typescript
async generateToken(machineId: string, installDate: string)
```

**Processo:**
1. Calcula data de expiração: `installDate + 1 ano`
2. Cria string de dados: `machineId-installDate-expirationDate-SECRET`
3. Gera hash SHA-256
4. Formata token: primeiros 32 caracteres em grupos de 4 separados por hífen
   - Exemplo: `A1B2-C3D4-E5F6-G7H8-I9J0-K1L2-M3N4-O5P6`

**Atualização no Banco:**
- Define `license_type` como 'premium'
- Atualiza `activation_token`
- Atualiza `last_activation_date` para data atual

## Operações Administrativas

### Listar Todas as Licenças
```typescript
async getAllLicenses(): Promise<License[]>
```

### Atualizar Metadados
```typescript
async updateLicenseMetadata(machineId: string, metadata: {
  client_name?: string;
  client_email?: string;
  notes?: string;
  is_active?: boolean;
  is_lifetime?: boolean;
})
```

### Revogar Licença
```typescript
async revokeLicense(machineId: string, adminEmail: string)
```
- Define `revoked_at` com data atual
- Define `revoked_by` com email do admin
- Define `is_active` como false

### Reativar Licença Revogada
```typescript
async reactivateLicense(machineId: string)
```
- Remove `revoked_at` e `revoked_by`
- Define `is_active` como true

### Tornar Licença Vitalícia
```typescript
async setLifetimeLicense(machineId: string, isLifetime: boolean)
```
- Atualiza `is_lifetime` e `license_type`

### Estender Licença para 365 Dias
```typescript
async extendLicenseTo365Days(machineId: string)
```
- Gera novo token
- Atualiza `last_activation_date` para hoje
- Define como premium
- **Importante**: Quando uma licença é estendida pelo admin, o token de ativação não é mais solicitado ao usuário. A página de ativação redireciona automaticamente se a licença já estiver válida e ativada.

### Associar Usuário à Licença
```typescript
async associateUserToLicense(userId: string, machineId?: string)
```
- Associa um usuário à licença do `machine_id` atual
- Chamado automaticamente no login pelo `ProtectedRoute`
- Protege contra sobrescrita de associações existentes

### Resetar Período de Trial
```typescript
async resetTrialPeriod(machineId: string)
```
- Atualiza `install_date` para hoje
- Remove token de ativação
- Define como experimental

## Estrutura da Tabela `licenses`

```sql
CREATE TABLE licenses (
  id UUID PRIMARY KEY,
  machine_id TEXT UNIQUE NOT NULL,
  install_date TIMESTAMP NOT NULL,
  activation_token TEXT,
  last_activation_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  is_lifetime BOOLEAN DEFAULT false,
  license_type TEXT CHECK (license_type IN ('experimental', 'premium', 'lifetime')),
  revoked_at TIMESTAMP,
  revoked_by TEXT,
  client_name TEXT,
  client_email TEXT,
  notes TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para melhorar performance nas consultas
CREATE INDEX idx_licenses_user_id ON licenses(user_id);
```

### Campos Adicionados

- **`user_id`**: UUID opcional que referencia `auth.users(id)`
  - Permite relacionar licenças aos usuários do sistema
  - Atualizado automaticamente quando o usuário faz login
  - `ON DELETE SET NULL` garante que se um usuário for deletado, a licença não é perdida
  - Nullable para compatibilidade com licenças antigas

## Segurança

### Secret Key
- Constante `LICENSE_SECRET = 'ISF_IA_2025_SECRET'`
- Usada na geração de tokens
- Deve ser mantida em segredo

### Validação de Token
- Tokens são gerados usando hash SHA-256
- Incluem machine_id, datas e secret
- Formato padronizado facilita validação

### Proteção de Associações
- Sistema previne sobrescrita de `user_id` quando já existe associação diferente
- Logs registram tentativas de associação inválida
- Mantém integridade das relações usuário-licença

## Logs e Monitoramento

Todas as operações são logadas usando o sistema de logger:
- `logger.info()` para operações normais
- `logger.warn()` para avisos
- `logger.error()` para erros

Contexto: `'license'`

## Exceções e Tratamento de Erros

1. **Erro ao obter Machine ID**
   - Usa fallback com timestamp + random
   - Loga warning mas continua

2. **Erro ao buscar/criar licença**
   - Retorna `null`
   - Loga error
   - Sistema adota fail-open

3. **Erro na verificação de status**
   - Retorna status padrão inválido
   - Loga error
   - ProtectedRoute permite acesso temporário

## Casos de Uso

### Novo Usuário em Dispositivo Novo
1. Usuário instala app
2. Sistema gera Machine ID único
3. Usuário faz login
4. Sistema cria licença experimental com `user_id` já associado
5. 14 dias de trial começam
6. Licença aparece na página de gerenciamento vinculada ao usuário

### Novo Usuário em Dispositivo com Licença Existente (sem user_id)
1. Dispositivo já tem licença criada anteriormente (sem `user_id`)
2. Novo usuário faz login no mesmo dispositivo
3. Sistema associa automaticamente o `user_id` à licença existente
4. Licença mantém seu status (trial/premium/lifetime)
5. Agora aparece vinculada ao novo usuário

### Novo Usuário Tentando Usar Licença de Outro Usuário
1. Dispositivo tem licença já associada a outro usuário
2. Novo usuário faz login no mesmo dispositivo
3. Sistema detecta que a licença já tem `user_id` diferente
4. **NÃO sobrescreve** a associação (proteção)
5. Loga aviso mas permite que o usuário use a licença (comportamento atual)
6. Admin pode ver na página de gerenciamento qual usuário está relacionado

### Ativação Premium
1. Admin gera token
2. Token é inserido no app
3. Licença atualizada para premium
4. 365 dias começam a partir da ativação
5. Se admin estender licença de trial para 365 dias, usuário não precisa mais inserir token

### Extensão de Licença pelo Admin
1. Admin estende licença de trial para 365 dias
2. Sistema gera token automaticamente
3. Atualiza `last_activation_date` para hoje
4. Define como premium
5. **Usuário não precisa mais inserir token**: página de ativação redireciona automaticamente

### Renovação Premium
1. Admin estende licença
2. `last_activation_date` atualizado
3. Novo período de 365 dias inicia
4. `user_id` mantido (não é alterado)

### Revogação
1. Admin revoga licença
2. `revoked_at` definido
3. App redireciona para ativação
4. Usuário não pode mais acessar
5. `user_id` mantido para histórico

## Funções SQL Disponíveis

### Associar Licenças Existentes aos Usuários

```sql
-- Tenta associar licenças sem user_id baseado em critérios
SELECT * FROM associate_licenses_to_users();
```

**Métodos de Associação:**
1. Por `client_email`: Se a licença tem `client_email`, tenta encontrar usuário com mesmo email
2. Por usuário mais ativo: Se não há `client_email`, associa ao usuário mais ativo recentemente (apenas uma licença)

### Associar Todas as Licenças ao Usuário Mais Ativo

```sql
-- Associa todas as licenças sem user_id ao usuário mais ativo
-- ⚠️ Use com cuidado: apenas quando há um único usuário principal
SELECT * FROM associate_all_licenses_to_most_active_user();
```

### Associar Licença Específica a Usuário Específico

```sql
-- Associação manual de uma licença a um usuário
SELECT associate_license_to_user('machine_id_aqui', 'user_id_aqui');
```

### Listar Licenças Não Associadas

```sql
-- Lista todas as licenças que não têm usuário associado
SELECT * FROM list_unassociated_licenses();
```

## Considerações de Desenvolvimento

### Modo Desenvolvedor
- Usuários com `dev: true` no perfil têm bypass total
- Útil para desenvolvimento e testes
- Não requer licença válida
- Não associa `user_id` (não necessário)

### Ambiente de Teste
- Sistema fail-open permite desenvolvimento mesmo sem licença
- Logs ajudam a identificar problemas
- Machine ID pode ser resetado via localStorage
- Associação automática funciona normalmente em testes

### Compatibilidade com Licenças Antigas
- Licenças criadas antes da adição do campo `user_id` têm `user_id = NULL`
- São associadas automaticamente quando o usuário faz login
- Não há necessidade de migração manual
- Sistema funciona normalmente com ou sem `user_id`

