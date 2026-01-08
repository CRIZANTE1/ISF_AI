/**
 * Schemas de validação usando Zod
 * Validação rigorosa de dados antes de inserir no banco de dados
 */

import { z, ZodError } from 'zod';

// Schema base para campos comuns
const baseEquipmentSchema = z.object({
  user_id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
});

// Função helper para validar formato de ID de equipamento
const equipmentIdSchema = z.string()
  .min(1, 'ID do equipamento é obrigatório')
  .max(100, 'ID deve ter no máximo 100 caracteres')
  .regex(/^[a-zA-Z0-9_-]+$/, 'O ID pode conter apenas letras, números, hífens (-) e underscores (_)')
  .refine((val) => {
    const trimmed = val.trim();
    return !trimmed.startsWith('-') && !trimmed.startsWith('_') && !trimmed.endsWith('-') && !trimmed.endsWith('_');
  }, 'O ID não pode começar ou terminar com hífen (-) ou underscore (_)')
  .refine((val) => !val.includes(' '), 'O ID não pode conter espaços');

// Schema para Extintor
export const extinguisherSchema = baseEquipmentSchema.extend({
  numero_identificacao: equipmentIdSchema,
  // numero_selo_inmetro removido - agora é registrado apenas nas inspeções de manutenção nível 2 ou 3
  tipo_agente: z.string().max(50).nullable().optional(),
  capacidade: z.number().positive().max(1000).nullable().optional(),
  marca_fabricante: z.string().max(100).nullable().optional(),
  ano_fabricacao: z.number().int().min(1900).max(new Date().getFullYear() + 1).nullable().optional(),
  tipo_servico: z.string().max(50).nullable().optional(),
  // Aceita tanto data (YYYY-MM-DD) quanto ISO string com timezone (YYYY-MM-DDTHH:mm:ss.sssZ)
  data_servico: z.string().refine(
    (val) => !val || /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?([+-]\d{2}:\d{2})?)?$/.test(val),
    { message: "Data deve estar no formato YYYY-MM-DD ou ISO string com timezone" }
  ).nullable().optional(),
  inspetor_responsavel: z.string().max(200).nullable().optional(),
  empresa_executante: z.string().max(200).nullable().optional(),
  data_proxima_inspecao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  data_proxima_manutencao_2_nivel: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  data_proxima_manutencao_3_nivel: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  data_ultimo_ensaio_hidrostatico: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  aprovado_inspecao: z.enum(['Sim', 'Não', 'Pendente']).nullable().optional(),
  observacoes_gerais: z.string().max(5000).nullable().optional(),
  plano_de_acao: z.string().max(2000).nullable().optional(),
  link_relatorio_pdf: z.string().url().max(500).nullable().optional(),
  link_foto_nao_conformidade: z.string().url().max(500).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  local_id: z.string().max(100).nullable().optional(),
});

// Schema para Multigas
export const multigasSchema = baseEquipmentSchema.extend({
  id_equipamento: equipmentIdSchema,
  marca: z.string().max(100).nullable().optional(),
  modelo: z.string().max(100).nullable().optional(),
  numero_serie: z.string().max(100).nullable().optional(),
  data_cadastro: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  lel_cilindro: z.number().min(0).max(100).nullable().optional(),
  o2_cilindro: z.number().min(0).max(100).nullable().optional(),
  h2s_cilindro: z.number().int().min(0).max(1000).nullable().optional(),
  co_cilindro: z.number().int().min(0).max(1000).nullable().optional(),
  margem_erro_cilindro: z.number().min(0).max(100).nullable().optional(),
});

// Schema para SCBA
export const scbaSchema = baseEquipmentSchema.extend({
  numero_serie_equipamento: equipmentIdSchema,
  marca: z.string().max(100).nullable().optional(),
  modelo: z.string().max(100).nullable().optional(),
  numero_serie_mascara: z.string().max(100).nullable().optional(),
  numero_serie_segundo_estagio: z.string().max(100).nullable().optional(),
  // Aceita tanto data (YYYY-MM-DD) quanto ISO string com timezone (YYYY-MM-DDTHH:mm:ss.sssZ)
  data_teste: z.string().refine(
    (val) => !val || /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?([+-]\d{2}:\d{2})?)?$/.test(val),
    { message: "Data deve estar no formato YYYY-MM-DD ou ISO string com timezone" }
  ).nullable().optional(),
  data_validade: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  resultado_final: z.string().max(50).nullable().optional(),
  vazamento_mascara_resultado: z.string().max(50).nullable().optional(),
  inspetor_responsavel: z.string().max(200).nullable().optional(),
  empresa_executante: z.string().max(200).nullable().optional(),
  link_relatorio_pdf: z.string().url().max(500).nullable().optional(),
});

// Schema para Inspeção de Extintor
export const extinguisherInspectionSchema = baseEquipmentSchema.extend({
  numero_identificacao: z.string().min(1).max(100),
  // Aceita tanto data (YYYY-MM-DD) quanto ISO string com timezone (YYYY-MM-DDTHH:mm:ss.sssZ)
  data_servico: z.string().refine(
    (val) => !val || /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?([+-]\d{2}:\d{2})?)?$/.test(val),
    { message: "Data deve estar no formato YYYY-MM-DD ou ISO string com timezone" }
  ).nullable().optional(),
  tipo_servico: z.string().max(50).nullable().optional(),
  numero_selo_inmetro: z.string().max(100).nullable().optional(), // Atualizado em manutenções nível 2 ou 3
  aprovado_inspecao: z.enum(['Sim', 'Não', 'Pendente']).nullable().optional(),
  observacoes_gerais: z.string().max(5000).nullable().optional(),
  plano_de_acao: z.string().max(2000).nullable().optional(),
  link_foto_nao_conformidade: z.string().url().max(500).nullable().optional(),
  link_relatorio_pdf: z.string().url().max(500).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

// Schema para Inspeção Multigas
export const multigasInspectionSchema = baseEquipmentSchema.extend({
  id_equipamento: z.string().min(1).max(100),
  // Aceita tanto data (YYYY-MM-DD) quanto ISO string com timezone (YYYY-MM-DDTHH:mm:ss.sssZ)
  data_teste: z.string().refine(
    (val) => !val || /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?([+-]\d{2}:\d{2})?)?$/.test(val),
    { message: "Data deve estar no formato YYYY-MM-DD ou ISO string com timezone" }
  ).nullable().optional(),
  tipo_teste: z.enum(['Periódico', 'Extraordinário']).nullable().optional(),
  resultado_teste: z.string().max(50).nullable().optional(),
  LEL_referencia: z.number().min(0).max(100).nullable().optional(),
  O2_referencia: z.number().min(0).max(100).nullable().optional(),
  H2S_referencia: z.number().int().min(0).max(1000).nullable().optional(),
  CO_referencia: z.number().int().min(0).max(1000).nullable().optional(),
  LEL_encontrado: z.number().min(0).max(100).nullable().optional(),
  O2_encontrado: z.number().min(0).max(100).nullable().optional(),
  H2S_encontrado: z.number().int().min(0).max(1000).nullable().optional(),
  CO_encontrado: z.number().int().min(0).max(1000).nullable().optional(),
  observacoes: z.string().max(5000).nullable().optional(),
  plano_de_acao: z.string().max(2000).nullable().optional(),
  inspetor: z.string().max(200).nullable().optional(),
  data_proximo_teste: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

// Schema para Inspeção SCBA
export const scbaInspectionSchema = baseEquipmentSchema.extend({
  numero_serie_equipamento: z.string().min(1).max(100),
  // Aceita tanto data (YYYY-MM-DD) quanto ISO string com timezone (YYYY-MM-DDTHH:mm:ss.sssZ)
  data_inspecao: z.string().refine(
    (val) => !val || /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?([+-]\d{2}:\d{2})?)?$/.test(val),
    { message: "Data deve estar no formato YYYY-MM-DD ou ISO string com timezone" }
  ).optional().nullable(),
  status_geral: z.string().max(50).nullable().optional(),
  resultados_json: z.record(z.string(), z.any()).nullable().optional(),
  plano_de_acao: z.string().max(2000).nullable().optional(),
  inspetor: z.string().max(200).nullable().optional(),
  data_proxima_inspecao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  link_foto_nao_conformidade: z.string().url().max(500).nullable().optional(),
});

// Schema para Compra (Billing)
export const purchaseSchema = z.object({
  user_id: z.string().uuid(),
  product_id: z.string().min(1).max(100),
  purchase_token: z.string().min(1).max(500),
  order_id: z.string().max(200).nullable().optional(),
  purchase_time: z.string().datetime(),
  purchase_state: z.number().int().min(0).max(3),
  acknowledged: z.boolean(),
  original_json: z.record(z.string(), z.any()).nullable().optional(),
});

// Schema para Operação Offline
export const offlineOperationSchema = z.object({
  id: z.number().int().positive().optional(),
  type: z.enum(['create', 'update', 'delete']),
  table: z.string().min(1).max(100),
  data: z.record(z.string(), z.any()),
  user_id: z.string().uuid(),
  retry_count: z.number().int().min(0).max(10).optional(),
  last_retry: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime().optional(),
});

// Schema genérico para validação de tabelas conhecidas
const knownTables = [
  'extintores',
  'inventario_multigas',
  'conjuntos_autonomos',
  'inspecoes_extintores',
  'inspecoes_multigas',
  'inspecoes_scba',
  'inspecoes_chuveiros_lava_olhos',
  'inspecoes_camaras_espuma',
  'inspecoes_alarmes',
  'inspecoes_canhoes_monitores',
  'inspecoes_abrigos',
  'inspecoes_mangueiras',
  'mangueiras',
  'inventario_camaras_espuma',
  'inventario_canhoes_monitores',
  'inventario_chuveiros_lava_olhos',
  'inventario_alarmes',
  'abrigos',
  'custom_equipment',
  'custom_equipment_inspections',
  'purchases',
  'log_acoes_extintores',
  'log_acoes_multigas',
  'log_acoes_scba',
  'log_acoes_chuveiros_lava_olhos',
  'log_acoes_camaras_espuma',
  'log_acoes_alarmes',
  'log_acoes_canhoes_monitores',
  'log_acoes_abrigos',
] as const;

export const tableNameSchema = z.enum(knownTables as unknown as [string, ...string[]]);

// Função helper para validar dados com schema
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const errors = error.issues?.map((e) => 
        `${(e.path || []).join('.')}: ${e.message || 'Erro'}`
      ).join(', ') || 'Erro de validação desconhecido';
      throw new Error(`Validação falhou: ${errors}`);
    }
    throw error;
  }
}

// Função helper para validar dados com schema (safe, retorna resultado)
export function safeValidateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const errors = error.issues?.map((e) => 
        `${(e.path || []).join('.')}: ${e.message || 'Erro'}`
      ).join(', ') || 'Erro de validação desconhecido';
      return { success: false, error: `Validação falhou: ${errors}` };
    }
    return { success: false, error: 'Erro desconhecido na validação' };
  }
}

// Função para obter schema baseado no nome da tabela
export function getSchemaForTable(table: string): z.ZodSchema<any> | null {
  switch (table) {
    case 'extintores':
      return extinguisherSchema;
    case 'inventario_multigas':
      return multigasSchema;
    case 'conjuntos_autonomos':
      return scbaSchema;
    case 'inspecoes_extintores':
      return extinguisherInspectionSchema;
    case 'inspecoes_multigas':
      return multigasInspectionSchema;
    case 'inspecoes_scba':
      return scbaInspectionSchema;
    case 'purchases':
      return purchaseSchema;
    default:
      // Para tabelas sem schema específico, valida apenas campos básicos
      return baseEquipmentSchema;
  }
}

/**
 * Cria um schema parcial de forma segura
 * Verifica se o schema é um ZodObject antes de chamar .partial()
 * @param schema Schema Zod a ser convertido em parcial
 * @returns Schema parcial ou o schema original se não for possível criar parcial
 */
export function createPartialSchema(schema: z.ZodSchema<any>): z.ZodSchema<any> {
  // Verifica se o schema é um ZodObject usando type guard
  if (schema instanceof z.ZodObject) {
    return schema.partial();
  }
  // Se não for ZodObject, retorna o schema original
  // Isso é seguro porque schemas não-Object geralmente já são opcionais ou não precisam de partial
  return schema;
}

