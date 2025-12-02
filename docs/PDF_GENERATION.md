# Documentação: Geração de Relatórios PDF

## Visão Geral

O sistema de geração de relatórios PDF permite criar documentos formatados no padrão ABNT para inspeções de equipamentos. Suporta relatórios de inspeção única e relatórios de múltiplas inspeções com seleção de intervalo de datas.

## Arquitetura

### Componentes Principais

1. **pdfReportGenerator.ts** (`src/utils/pdfReportGenerator.ts`)
   - Módulo principal de geração de PDFs
   - Usa `jsPDF` e `jspdf-autotable`
   - Formato ABNT (A4, margens padrão)

2. **EquipmentDetailPage.tsx** (`src/pages/EquipmentDetailPage.tsx`)
   - Interface para gerar relatórios
   - Modal de seleção de múltiplas inspeções

## Formato ABNT

### Configurações de Página

```typescript
const PAGE_MARGINS = {
  TOP: 30,    // mm
  BOTTOM: 30, // mm
  LEFT: 30,   // mm
  RIGHT: 30,  // mm
};

const PAGE_WIDTH = 210;  // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const CONTENT_WIDTH = 150; // 210 - 30 - 30
```

### Cores

- **Preto** (`#000000`): Texto principal, títulos, bordas
- **Cinza** (`#808080`): Texto secundário, legendas
- **Cinza Claro** (`#E0E0E0`): Linhas separadoras, alternância de tabelas
- **Branco** (`#FFFFFF`): Fundo

## Estrutura do Relatório

### 1. Cabeçalho
- Título: "RELATÓRIO DE INSPEÇÃO DE EQUIPAMENTO"
- Nome da empresa (opcional)
- Linha separadora

### 2. Dados do Equipamento
- Tipo de equipamento
- ID/Identificação
- Informações específicas por tipo:
  - **Multigas**: Marca, Modelo, Nº de Série, Data de Cadastro, Margem de Erro
  - **Extintor**: Marca, Agente Extintor, Capacidade, Selo Inmetro, Ano de Fabricação
  - **SCBA**: Marca, Modelo, Nº de Série da Máscara
  - **Mangueira**: Marca, Diâmetro, Comprimento, Ano de Fabricação
  - **Outros**: Marca, Modelo, Nº de Série, Data de Cadastro
- Localização

### 3. Dados da Inspeção
- Data da Inspeção
- Tipo de Serviço
- Inspetor Responsável
- Status
- Próxima Inspeção

### 4. Resultados da Inspeção
- Tabela com checklist
- Colunas: Item Verificado | Status
- Status: "Conforme" ou "Não Conforme"

### 5. Observações e Plano de Ação
- Observações Gerais
- Plano de Ação
- Texto com quebra automática de linhas

### 6. Evidências Fotográficas
- Imagem convertida para base64
- Dimensões máximas: 150mm x 100mm
- Legenda: "Foto de evidência da inspeção"

### 7. Assinatura do Responsável
- Linha para assinatura
- Nome do responsável
- Data atual

## Tipos de Relatórios

### Relatório de Inspeção Única

```typescript
async function generateInspectionReport(data: ReportData): Promise<Blob>
```

**Interface:**
```typescript
interface ReportData {
  equipment: EquipmentData;
  inspection: InspectionData;
  companyName?: string;
  responsibleName?: string;
}
```

**Fluxo:**
1. Cria documento jsPDF (A4, portrait)
2. Adiciona cabeçalho
3. Adiciona dados do equipamento
4. Verifica se precisa nova página
5. Adiciona dados da inspeção
6. Adiciona resultados do checklist (se houver)
7. Adiciona observações e plano de ação
8. Adiciona foto (se houver)
9. Adiciona assinatura
10. Retorna Blob do PDF

### Relatório de Múltiplas Inspeções

```typescript
async function generateMultipleInspectionReport(
  data: MultipleInspectionReportData
): Promise<Blob>
```

**Interface:**
```typescript
interface MultipleInspectionReportData {
  equipment: EquipmentData;
  inspections: InspectionData[];
  companyName?: string;
  responsibleName?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
```

**Fluxo:**
1. Cria documento jsPDF
2. Adiciona cabeçalho
3. Adiciona dados completos do equipamento
4. Adiciona período de inspeções (se fornecido)
5. Lista todas as inspeções selecionadas:
   - Ordenadas por data (crescente)
   - Cada inspeção inclui:
     - Título: "Inspeção X de Y"
     - Data
     - Tipo
     - Status
     - Inspetor
     - Observações
     - Plano de Ação
     - Resultados do checklist
     - Foto (se houver)
   - Linha separadora entre inspeções
6. Adiciona assinatura final
7. Retorna Blob do PDF

## Funções Auxiliares

### Formatação de Datas

```typescript
// Data completa: "15 de janeiro de 2024"
function formatDate(dateString: string): string

// Data curta: "15/01/2024"
function formatDateShort(dateString: string): string
```

### Conversão de Imagem

```typescript
async function imageUrlToBase64(url: string): Promise<string>
```
- Faz fetch da URL
- Converte para Blob
- Converte para base64
- Retorna string base64 ou string vazia em caso de erro

### Nome do Tipo de Equipamento

```typescript
function getEquipmentTypeName(type: string): string
```

**Mapeamento:**
- `extintor` → "Extintor de Incêndio"
- `mangueira` → "Mangueira de Incêndio"
- `scba` → "Conjunto Autônomo de Respiração (SCBA)"
- `multigas` → "Medidor Multigás"
- `camara_espuma` → "Câmara de Espuma"
- `canhao_monitor` → "Canhão Monitor"
- `chuveiro_lavaolhos` → "Chuveiro/Lava-olhos"
- `alarme` → "Sistema de Alarme"
- `abrigo` → "Abrigo de Emergência"

## Espaçamento e Layout

### Espaçamento Entre Elementos

- **Títulos de seção**: 10mm após o título
- **Linhas de texto**: 7mm entre linhas
- **Espaço extra entre seções**: 8mm
- **Linhas de observações**: 6mm por linha + 8mm de espaçamento

### Quebra de Página

O sistema verifica automaticamente se há espaço suficiente antes de adicionar conteúdo:

```typescript
if (yPos > PAGE_HEIGHT - 100) {
  doc.addPage();
  yPos = PAGE_MARGINS.TOP;
}
```

**Pontos de verificação:**
- Após dados do equipamento
- Após dados da inspeção
- Antes de adicionar foto
- Antes de adicionar assinatura

## Interface do Usuário

### Geração de Relatório Único

Na página de detalhes do equipamento:
1. Botão de ícone de arquivo ao lado de cada inspeção
2. Ao clicar, busca dados completos da inspeção
3. Gera PDF
4. Salva/compartilha no dispositivo

### Geração de Relatório Múltiplo

1. **Botão de múltiplas inspeções**
   - Aparece apenas se houver inspeções
   - Ícone de arquivo ao lado do botão "Adicionar Inspeção"

2. **Modal de seleção**
   - **Intervalo de datas** (opcional):
     - Campo "De" (data inicial)
     - Campo "Até" (data final)
   - **Lista de inspeções**:
     - Checkbox para cada inspeção
     - Mostra data e status
     - Botão "Selecionar Todas" / "Desmarcar Todas"
     - Contador: "X de Y inspeções selecionadas"
   - **Botões**:
     - Cancelar: fecha modal e limpa seleção
     - Gerar Relatório: processa e gera PDF

3. **Processamento**
   - Busca dados completos de cada inspeção selecionada
   - Ordena por data (crescente)
   - Gera PDF com todas as inspeções
   - Salva/compartilha no dispositivo

## Salvamento e Compartilhamento

### Função `savePdfToDevice`

```typescript
async function savePdfToDevice(pdfBlob: Blob, filename: string): Promise<void>
```

**Fluxo:**

1. **Plataforma Nativa (Android/iOS)**
   - Converte Blob para base64
   - Salva via Capacitor Filesystem
   - Tenta compartilhar via Capacitor Share
   - Se compartilhamento falhar, apenas salva

2. **Navegador Web**
   - Cria URL temporária do Blob
   - Cria elemento `<a>` com download
   - Simula clique para download
   - Remove elemento e revoga URL

**Nome do arquivo:**
- Único: `Relatorio_Inspecao_{equipmentName}_{date}.pdf`
- Múltiplo: `Relatorio_Multiplas_Inspecoes_{equipmentName}_{date}.pdf`

## Tratamento de Dados do Equipamento

### Mapeamento de Campos por Tipo

#### Multigas
```typescript
{
  id: equipment.id_equipamento,
  marca: equipment.marca,
  modelo: equipment.modelo,
  numero_serie: equipment.numero_serie,
  data_cadastro: equipment.data_cadastro,
  margem_erro_cilindro: equipment.margem_erro_cilindro
}
```

#### Extintor
```typescript
{
  id: equipment.numero_identificacao,
  marca_fabricante: equipment.marca_fabricante,
  tipo_agente: equipment.tipo_agente,
  capacidade: equipment.capacidade,
  numero_selo_inmetro: equipment.numero_selo_inmetro,
  ano_fabricacao: equipment.ano_fabricacao
}
```

#### SCBA
```typescript
{
  id: equipment.numero_serie_equipamento,
  marca: equipment.marca,
  modelo: equipment.modelo,
  numero_serie_mascara: equipment.numero_serie_mascara
}
```

## Tabelas de Resultados

### Formatação

- **Tema**: striped (linhas alternadas)
- **Cabeçalho**: Preto com texto branco, negrito
- **Corpo**: Texto preto
- **Linhas alternadas**: Cinza claro (#E0E0E0)
- **Fonte**: 9pt
- **Padding**: 3mm

### Conversão de Valores

```typescript
const status = 
  value === true || value === 'sim' || value === 'Sim' ? 'Conforme' : 
  value === false || value === 'não' || value === 'Não' ? 'Não Conforme' : 
  String(value);
```

## Tratamento de Erros

### Erro ao Converter Imagem
- Loga erro no console
- Retorna string vazia
- Mostra "Foto não disponível" no PDF

### Erro ao Gerar PDF
- Loga erro com contexto
- Mostra mensagem de erro ao usuário
- Não bloqueia interface

### Erro ao Salvar PDF
- Loga erro
- Lança exceção para tratamento superior

## Melhorias Implementadas

### 1. Dados Completos do Equipamento
- Todos os campos relevantes são incluídos
- Especial atenção para Multigas (margem de erro)
- Suporte para todos os tipos de equipamento

### 2. Espaçamento Ajustado
- Aumentado de 6mm para 7mm entre linhas
- Espaçamento extra de 8mm entre seções
- Evita sobreposição de texto

### 3. Relatórios Múltiplos
- Seleção individual de inspeções
- Intervalo de datas opcional
- Ordenação automática por data
- Separação visual entre inspeções

### 4. Layout Responsivo
- Quebra de página automática
- Verificação de espaço antes de adicionar conteúdo
- Fotos redimensionadas para caber na página

## Exemplo de Uso

### Relatório Único

```typescript
const reportData = {
  equipment: {
    id: 'MULT-001',
    name: 'MULT-001',
    type: 'multigas',
    marca: 'Industrial Scientific',
    modelo: 'Ventis Pro',
    numero_serie: 'VP001234',
    data_cadastro: '2023-01-14',
    margem_erro_cilindro: 5,
    location: 'Setor A'
  },
  inspection: {
    id: 1,
    data_inspecao: '2024-01-15',
    status_geral: 'Aprovado',
    tipo_servico: 'Teste de Calibração',
    inspetor: 'João Silva',
    observacoes_gerais: 'Equipamento em perfeito estado',
    plano_de_acao: 'Nenhuma ação necessária',
    resultados_json: {
      'Sensor LEL': true,
      'Sensor O2': true,
      'Sensor H2S': true,
      'Sensor CO': true
    }
  },
  companyName: 'Empresa XYZ',
  responsibleName: 'João Silva'
};

const pdfBlob = await generateInspectionReport(reportData);
await savePdfToDevice(pdfBlob, 'Relatorio_Inspecao_MULT-001_2024-01-15.pdf');
```

### Relatório Múltiplo

```typescript
const reportData = {
  equipment: { /* ... */ },
  inspections: [
    { /* inspeção 1 */ },
    { /* inspeção 2 */ },
    { /* inspeção 3 */ }
  ],
  dateRange: {
    start: '2024-01-01',
    end: '2024-01-31'
  },
  responsibleName: 'João Silva'
};

const pdfBlob = await generateMultipleInspectionReport(reportData);
await savePdfToDevice(pdfBlob, 'Relatorio_Multiplas_Inspecoes_MULT-001_2024-01-31.pdf');
```

## Dependências

- `jspdf`: ^3.0.4
- `jspdf-autotable`: ^5.0.2
- `date-fns`: ^3.6.0
- `@capacitor/filesystem`: ^6.0.0 (para salvar em dispositivos nativos)
- `@capacitor/share`: ^6.0.0 (para compartilhar em dispositivos nativos)

## Considerações de Performance

1. **Conversão de Imagens**
   - Imagens são convertidas para base64
   - Pode ser lento para imagens grandes
   - Considerar otimização prévia de imagens

2. **Múltiplas Inspeções**
   - Busca dados de cada inspeção individualmente
   - Pode ser lento com muitas inspeções
   - Considerar paginação ou limite de seleção

3. **Geração de PDF**
   - Processamento é síncrono
   - Pode travar UI com PDFs muito grandes
   - Considerar Web Worker para processamento assíncrono

## Melhorias Futuras

1. **Templates Personalizáveis**
   - Permitir escolher layout
   - Adicionar logo da empresa
   - Personalizar cores

2. **Exportação em Outros Formatos**
   - Excel/CSV para dados tabulares
   - HTML para visualização web

3. **Compressão de PDF**
   - Reduzir tamanho do arquivo
   - Otimizar imagens antes de incluir

4. **Assinatura Digital**
   - Integração com certificado digital
   - Validação de autenticidade

