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

### Lógica de Acesso

```typescript
// 1. Sem usuário → redireciona para login
if (!user) return <Navigate to="/auth" />;

// 2. Desenvolvedor → acesso total
if (profile?.dev === true) return children;

// 3. Sem status de licença → permite acesso (fail-open)
if (!licenseStatus) return children;

// 4. Licença inválida e não trial → redireciona para ativação
if (!licenseStatus.valid && !licenseStatus.isTrial && licenseStatus.expired) {
  return <Navigate to="/activate-license" />;
}

// 5. Licença válida ou trial → permite acesso
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
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Segurança

### Secret Key
- Constante `LICENSE_SECRET = 'ISF_IA_2025_SECRET'`
- Usada na geração de tokens
- Deve ser mantida em segredo

### Validação de Token
- Tokens são gerados usando hash SHA-256
- Incluem machine_id, datas e secret
- Formato padronizado facilita validação

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

### Novo Usuário
1. Instala app
2. Sistema gera Machine ID
3. Cria licença experimental
4. 14 dias de trial começam

### Ativação Premium
1. Admin gera token
2. Token é inserido no app
3. Licença atualizada para premium
4. 365 dias começam a partir da ativação

### Renovação Premium
1. Admin estende licença
2. `last_activation_date` atualizado
3. Novo período de 365 dias inicia

### Revogação
1. Admin revoga licença
2. `revoked_at` definido
3. App redireciona para ativação
4. Usuário não pode mais acessar

## Considerações de Desenvolvimento

### Modo Desenvolvedor
- Usuários com `dev: true` no perfil têm bypass total
- Útil para desenvolvimento e testes
- Não requer licença válida

### Ambiente de Teste
- Sistema fail-open permite desenvolvimento mesmo sem licença
- Logs ajudam a identificar problemas
- Machine ID pode ser resetado via localStorage

