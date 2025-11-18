# Sistema de Validação com Zod

Este diretório contém schemas de validação usando Zod para garantir que todos os dados inseridos no banco de dados sejam válidos e seguros.

## Instalação

Para usar este sistema de validação, você precisa instalar o Zod:

```bash
npm install zod
```

## Arquivos

- `schemas.ts`: Contém todos os schemas de validação para equipamentos, inspeções e operações.

## Uso

### Validação Básica

```typescript
import { extinguisherSchema, safeValidateData } from '../utils/validation/schemas';

const data = {
  numero_identificacao: 'EXT-001',
  // ... outros campos
};

const validation = safeValidateData(extinguisherSchema, data);
if (!validation.success) {
  console.error('Dados inválidos:', validation.error);
  return;
}

// Usar validation.data que está validado e tipado
```

### Validação com Erro

```typescript
import { extinguisherSchema, validateData } from '../utils/validation/schemas';

try {
  const validatedData = validateData(extinguisherSchema, data);
  // Usar validatedData
} catch (error) {
  // Tratar erro de validação
}
```

## Schemas Disponíveis

### Equipamentos
- `extinguisherSchema`: Validação para extintores
- `multigasSchema`: Validação para detectores multigas
- `scbaSchema`: Validação para SCBA (Conjuntos Autônomos)

### Inspeções
- `extinguisherInspectionSchema`: Validação para inspeções de extintores
- `multigasInspectionSchema`: Validação para inspeções de multigas
- `scbaInspectionSchema`: Validação para inspeções de SCBA

### Outros
- `purchaseSchema`: Validação para compras (billing)
- `offlineOperationSchema`: Validação para operações offline
- `tableNameSchema`: Validação de nomes de tabelas permitidas

## Integração Automática

Os schemas são automaticamente aplicados em:
- `offlineOperations.ts`: Validação em operações offline
- `offlineSync.ts`: Validação durante sincronização
- `billingService.ts`: Validação de compras
- `AddInspectionPage.tsx`: Validação de inspeções

## Adicionando Novos Schemas

Para adicionar um novo schema:

1. Defina o schema em `schemas.ts`:
```typescript
export const meuNovoSchema = baseEquipmentSchema.extend({
  campo_obrigatorio: z.string().min(1),
  campo_opcional: z.string().max(100).nullable().optional(),
});
```

2. Adicione ao `getSchemaForTable` se for uma tabela específica:
```typescript
case 'minha_tabela':
  return meuNovoSchema;
```

3. Use o schema onde necessário:
```typescript
const validation = safeValidateData(meuNovoSchema, data);
```

## Segurança

Todos os schemas validam:
- Tipos de dados corretos
- Tamanhos máximos de strings
- Valores numéricos dentro de ranges válidos
- Formatos de datas
- URLs válidas
- UUIDs válidos para user_id

Isso previne:
- SQL Injection (através de validação de tipos)
- Buffer Overflow (através de limites de tamanho)
- Dados malformados
- Ataques de injeção de dados

