# Como o Serviço de Sincronização é Ativado Automaticamente

## Fluxo Completo

### 1. Quando uma Operação é Salva Offline

Quando o app tenta salvar dados (criar, atualizar ou deletar) e não há conexão, a operação é salva no IndexedDB através da função `savePendingOperation()`.

**Arquivo: `src/utils/offlineDB.ts`**

```typescript
export async function savePendingOperation(
  type: 'create' | 'update' | 'delete',
  table: string,
  data: any
): Promise<string> {
  // ... salva no IndexedDB ...
  
  request.onsuccess = async () => {
    // 🔑 AQUI ESTÁ A MÁGICA!
    // Após salvar com sucesso, tenta iniciar o serviço
    try {
      const { backgroundSyncService } = await import('../services/backgroundSyncService');
      await backgroundSyncService.checkAndStartIfNeeded();
    } catch (error) {
      // Ignora erros (serviço pode não estar disponível ainda)
      logger.debug('Não foi possível iniciar serviço de sincronização', 'storage');
    }
    resolve(operation.id);
  };
}
```

### 2. O que Acontece Dentro de `checkAndStartIfNeeded()`

**Arquivo: `src/services/backgroundSyncService.ts`**

```typescript
async checkAndStartIfNeeded(): Promise<void> {
  // 1. Verifica se o serviço já está rodando
  if (this.status.isRunning) {
    return; // Já está ativo, não precisa fazer nada
  }

  // 2. Verifica se há operações pendentes no IndexedDB
  const stats = await getOfflineStats();
  if (stats.pendingOperations === 0) {
    return; // Não há pendências, não inicia
  }

  // 3. Há pendências! Inicia o serviço
  logger.info(`Encontradas ${stats.pendingOperations} operação(ões), iniciando serviço`);
  await this.start();
}
```

## Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│  Usuário tenta salvar uma inspeção (sem conexão)            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  offlineInsert() / offlineUpdate() / offlineDelete()        │
│  (src/utils/offlineOperations.ts)                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  savePendingOperation()                                      │
│  (src/utils/offlineDB.ts)                                    │
│                                                              │
│  1. Salva operação no IndexedDB                             │
│  2. request.onsuccess é chamado                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Importação Dinâmica do Serviço                            │
│                                                              │
│  const { backgroundSyncService } =                         │
│    await import('../services/backgroundSyncService');        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  backgroundSyncService.checkAndStartIfNeeded()              │
│                                                              │
│  1. Verifica se já está rodando → Se sim, retorna          │
│  2. Verifica pendências no IndexedDB                        │
│  3. Se há pendências → Inicia o serviço                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Serviço Ativo                                               │
│                                                              │
│  • Monitora conexão a cada 30 segundos                      │
│  • Detecta quando conexão volta                              │
│  • Sincroniza automaticamente                                │
│  • Para quando não há mais pendências                       │
└─────────────────────────────────────────────────────────────┘
```

## Por Que Usar Importação Dinâmica?

A importação dinâmica (`await import()`) é usada para evitar **dependência circular**:

- `backgroundSyncService` importa `offlineDB` (para `getOfflineStats`)
- `offlineDB` não pode importar diretamente `backgroundSyncService` (criaria dependência circular)

**Solução**: Importação dinâmica só quando necessário, após o módulo já estar carregado.

## Exemplo Prático

### Cenário: Usuário cria uma inspeção offline

1. **Usuário preenche formulário de inspeção**
   ```typescript
   // src/pages/AddInspectionPage.tsx
   await offlineInsert('inspections', inspectionData);
   ```

2. **Sistema detecta que está offline**
   ```typescript
   // src/utils/offlineOperations.ts
   // Tenta salvar online, falha por falta de conexão
   // Chama: savePendingOperation('create', 'inspections', data)
   ```

3. **Operação é salva no IndexedDB**
   ```typescript
   // src/utils/offlineDB.ts
   // Salva no banco local
   // request.onsuccess é disparado
   ```

4. **Serviço é ativado automaticamente**
   ```typescript
   // Importa dinamicamente o serviço
   const { backgroundSyncService } = await import('../services/backgroundSyncService');
   // Verifica pendências (agora há 1)
   // Inicia o serviço
   await backgroundSyncService.checkAndStartIfNeeded();
   ```

5. **Serviço começa a monitorar**
   - Verifica conexão a cada 30 segundos
   - Quando detecta conexão, sincroniza automaticamente
   - Notifica o usuário sobre o progresso

6. **Após sincronização**
   - Todas as operações foram sincronizadas
   - Serviço verifica: `stats.pendingOperations === 0`
   - Serviço para automaticamente

## Vantagens Desta Abordagem

✅ **Automático**: Não precisa chamar manualmente  
✅ **Eficiente**: Só inicia quando há trabalho  
✅ **Transparente**: Usuário não precisa fazer nada  
✅ **Sem Dependência Circular**: Usa importação dinâmica  
✅ **Resiliente**: Ignora erros se serviço não estiver disponível  

## Pontos de Entrada

O serviço pode ser ativado em 3 momentos:

1. **Ao salvar operação offline** (automático)
   - `savePendingOperation()` → `checkAndStartIfNeeded()`

2. **Ao abrir o app** (verificação inicial)
   - `App.tsx` → `checkAndStartIfNeeded()`

3. **Manual** (se necessário)
   - `backgroundSyncService.forceSync()`

## Logs para Debug

Para ver o funcionamento em ação, procure por estes logs:

```
[background_sync] Encontradas X operação(ões) pendente(s), iniciando serviço
[background_sync] Iniciando serviço de sincronização em background
[background_sync] Nenhuma operação pendente, parando serviço de sincronização
```

