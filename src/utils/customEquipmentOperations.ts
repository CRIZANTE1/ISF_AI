/**
 * Utilitários para operações com equipamentos customizados
 */

import { supabase } from '../lib/supabase';
import { logger } from './logger';

export interface CustomEquipmentType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon_name?: string;
  id_field_name: string;
  id_field_label: string;
  requires_location: boolean;
  requires_gps: boolean;
  has_data_cadastro: boolean;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CustomEquipmentField {
  id: string;
  equipment_type_id: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean';
  is_required: boolean;
  placeholder?: string;
  options?: string[]; // Para campos select
  validation_rules?: Record<string, any>;
  display_order: number;
  created_at: string;
}

export interface CustomChecklist {
  id: string;
  equipment_type_id: string;
  name: string;
  description?: string;
  inspection_type?: string;
  is_default: boolean;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CustomChecklistSection {
  id: string;
  checklist_id: string;
  section_name: string;
  section_order: number;
  created_at: string;
}

export interface CustomChecklistItem {
  id: string;
  section_id: string;
  question_text: string;
  item_order: number;
  action_plan_template?: string;
  created_at: string;
}

export interface CustomEquipment {
  id: string;
  equipment_type_id: string;
  id_equipamento: string;
  data_cadastro?: string;
  latitude?: number;
  longitude?: number;
  localizacao?: string;
  numero_serie?: string;
  custom_fields: Record<string, any>;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CustomEquipmentInspection {
  id: string;
  equipment_type_id: string;
  id_equipamento: string;
  data_inspecao: string;
  tipo_inspecao?: string;
  status_geral?: string;
  plano_de_acao?: string;
  resultados_json?: Record<string, any>;
  link_foto_nao_conformidade?: string;
  inspetor?: string;
  data_proxima_inspecao?: string;
  latitude?: number;
  longitude?: number;
  user_id: string;
  created_at: string;
}

/**
 * Busca todos os tipos de equipamentos customizados do usuário
 */
export async function getAllCustomEquipmentTypes(): Promise<CustomEquipmentType[]> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar tipos customizados', 'equipment');
      return [];
    }

    const { data, error } = await supabase
      .from('custom_equipment_types')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Erro ao buscar tipos de equipamentos customizados', 'equipment', error);
    return [];
  }
}

/**
 * Busca um tipo de equipamento customizado por ID
 */
export async function getCustomEquipmentTypeById(id: string): Promise<CustomEquipmentType | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('custom_equipment_types')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Erro ao buscar tipo de equipamento customizado', 'equipment', error);
    return null;
  }
}

/**
 * Cria um novo tipo de equipamento customizado
 */
export async function createCustomEquipmentType(
  type: Omit<CustomEquipmentType, 'id' | 'created_at' | 'updated_at'>
): Promise<string | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('custom_equipment_types')
      .insert({
        ...type,
        user_id: user.id,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    logger.error('Erro ao criar tipo de equipamento customizado', 'equipment', error);
    throw error;
  }
}

/**
 * Atualiza um tipo de equipamento customizado
 */
export async function updateCustomEquipmentType(
  id: string,
  updates: Partial<Omit<CustomEquipmentType, 'id' | 'user_id' | 'created_at'>>
): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const { error } = await supabase
      .from('custom_equipment_types')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Erro ao atualizar tipo de equipamento customizado', 'equipment', error);
    throw error;
  }
}

/**
 * Busca campos customizados de um tipo de equipamento
 */
export async function getCustomEquipmentFields(equipmentTypeId: string): Promise<CustomEquipmentField[]> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar campos customizados', 'equipment');
      return [];
    }

    const { data, error } = await supabase
      .from('custom_equipment_fields')
      .select('*')
      .eq('equipment_type_id', equipmentTypeId)
      .order('display_order');

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Erro ao buscar campos customizados', 'equipment', error);
    return [];
  }
}

/**
 * Cria ou atualiza campos customizados
 */
export async function saveCustomEquipmentFields(
  equipmentTypeId: string,
  fields: Omit<CustomEquipmentField, 'id' | 'equipment_type_id' | 'created_at'>[]
): Promise<boolean> {
  try {
    // Primeiro, remove campos existentes
    const { error: deleteError } = await supabase
      .from('custom_equipment_fields')
      .delete()
      .eq('equipment_type_id', equipmentTypeId);

    if (deleteError) throw deleteError;

    // Insere novos campos
    if (fields.length > 0) {
      const fieldsToInsert = fields.map(field => ({
        ...field,
        equipment_type_id: equipmentTypeId,
      }));

      const { error: insertError } = await supabase
        .from('custom_equipment_fields')
        .insert(fieldsToInsert);

      if (insertError) throw insertError;
    }

    return true;
  } catch (error) {
    logger.error('Erro ao salvar campos customizados', 'equipment', error);
    throw error;
  }
}

/**
 * Busca checklists de um tipo de equipamento
 */
export async function getCustomChecklists(equipmentTypeId: string): Promise<CustomChecklist[]> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      return [];
    }

    const { data, error } = await supabase
      .from('custom_checklists')
      .select('*')
      .eq('equipment_type_id', equipmentTypeId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Erro ao buscar checklists customizados', 'equipment', error);
    return [];
  }
}

/**
 * Busca checklist completo com seções e itens
 */
export async function getCustomChecklistFull(checklistId: string): Promise<{
  checklist: CustomChecklist;
  sections: Array<CustomChecklistSection & { items: CustomChecklistItem[] }>;
} | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar checklist completo', 'equipment');
      return null;
    }

    // Busca checklist
    const { data: checklist, error: checklistError } = await supabase
      .from('custom_checklists')
      .select('*')
      .eq('id', checklistId)
      .eq('user_id', user.id)
      .single();

    if (checklistError || !checklist) return null;

    // Busca seções
    const { data: sections, error: sectionsError } = await supabase
      .from('custom_checklist_sections')
      .select('*')
      .eq('checklist_id', checklistId)
      .order('section_order');

    if (sectionsError) throw sectionsError;

    // Busca itens de cada seção
    const sectionsWithItems = await Promise.all(
      (sections || []).map(async (section) => {
        const { data: items, error: itemsError } = await supabase
          .from('custom_checklist_items')
          .select('*')
          .eq('section_id', section.id)
          .order('item_order');

        if (itemsError) throw itemsError;

        return {
          ...section,
          items: items || [],
        };
      })
    );

    return {
      checklist,
      sections: sectionsWithItems,
    };
  } catch (error) {
    logger.error('Erro ao buscar checklist completo', 'equipment', error);
    return null;
  }
}

/**
 * Cria um novo checklist customizado
 */
export async function createCustomChecklist(
  checklist: Omit<CustomChecklist, 'id' | 'created_at' | 'updated_at'>,
  sections: Array<{
    section_name: string;
    section_order: number;
    items: Array<{
      question_text: string;
      item_order: number;
      action_plan_template?: string;
    }>;
  }>
): Promise<string | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Cria checklist
    const { data: checklistData, error: checklistError } = await supabase
      .from('custom_checklists')
      .insert({
        ...checklist,
        user_id: user.id,
      })
      .select('id')
      .single();

    if (checklistError) throw checklistError;

    // Cria seções e itens
    for (const section of sections) {
      const { data: sectionData, error: sectionError } = await supabase
        .from('custom_checklist_sections')
        .insert({
          checklist_id: checklistData.id,
          section_name: section.section_name,
          section_order: section.section_order,
        })
        .select('id')
        .single();

      if (sectionError) throw sectionError;

      // Insere itens da seção
      if (section.items.length > 0) {
        const itemsToInsert = section.items.map(item => ({
          section_id: sectionData.id,
          question_text: item.question_text,
          item_order: item.item_order,
          action_plan_template: item.action_plan_template,
        }));

        const { error: itemsError } = await supabase
          .from('custom_checklist_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }
    }

    return checklistData.id;
  } catch (error) {
    logger.error('Erro ao criar checklist customizado', 'equipment', error);
    throw error;
  }
}

/**
 * Salva um novo equipamento customizado
 * Verifica limite: 3 equipamentos para trial, ilimitado para premium
 */
export async function saveCustomEquipment(
  equipment: Omit<CustomEquipment, 'id' | 'created_at' | 'updated_at'>
): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Busca perfil do usuário para verificar plano
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.warn('Erro ao buscar perfil do usuário, assumindo trial', 'equipment', profileError);
    }

    const userPlan = profile?.plan || 'trial';
    const isPremium = userPlan === 'premium';

    // Se não for premium, verifica limite de 3 equipamentos
    if (!isPremium) {
      const { count, error: countError } = await supabase
        .from('custom_equipment')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        logger.warn('Erro ao contar equipamentos customizados', 'equipment', countError);
      } else {
        const equipmentCount = count || 0;
        if (equipmentCount >= 3) {
          throw new Error('Limite de 3 equipamentos customizados atingido no plano Trial. Faça upgrade para Premium para criar equipamentos ilimitados.');
        }
      }
    }

    // Verifica se já existe
    const { data: existing, error: checkError } = await supabase
      .from('custom_equipment')
      .select('id')
      .eq('equipment_type_id', equipment.equipment_type_id)
      .eq('id_equipamento', equipment.id_equipamento)
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      throw new Error(`Equipamento com ID '${equipment.id_equipamento}' já existe.`);
    }

    const { error } = await supabase
      .from('custom_equipment')
      .insert({
        ...equipment,
        user_id: user.id,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Erro ao salvar equipamento customizado', 'equipment', error);
    throw error;
  }
}

/**
 * Busca todos os equipamentos customizados de um tipo
 */
export async function getAllCustomEquipment(equipmentTypeId: string): Promise<CustomEquipment[]> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      return [];
    }

    const { data, error } = await supabase
      .from('custom_equipment')
      .select('*')
      .eq('equipment_type_id', equipmentTypeId)
      .eq('user_id', user.id)
      .order('id_equipamento');

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Erro ao buscar equipamentos customizados', 'equipment', error);
    return [];
  }
}

/**
 * Salva uma inspeção de equipamento customizado
 */
export async function saveCustomEquipmentInspection(
  inspection: Omit<CustomEquipmentInspection, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Gera plano de ação baseado em não conformidades
    let planoDeAcao = 'Manter em monitoramento periódico.';
    if (inspection.resultados_json) {
      const nonConformities: string[] = [];
      for (const [question, status] of Object.entries(inspection.resultados_json)) {
        if (status === 'Não Conforme') {
          nonConformities.push(question);
        }
      }
      if (nonConformities.length > 0) {
        planoDeAcao = `Corrigir os seguintes itens não conformes: ${nonConformities.join(', ')}.`;
      }
    }

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('custom_equipment_inspections', {
      ...inspection,
      plano_de_acao: planoDeAcao,
      user_id: user.id,
    });

    if (!result.success) {
      throw new Error('Falha ao salvar inspeção');
    }

    // Atualiza latitude/longitude no cadastro do equipamento se fornecidas na inspeção
    // NOTA: Isso sobrescreve coordenadas editadas manualmente no cadastro, pois a última inspeção tem prioridade
    // Se a inspeção não tiver GPS (null/undefined), as coordenadas do cadastro permanecem inalteradas
    if (inspection.latitude != null && inspection.longitude != null) {
      try {
        const { error: updateError } = await supabase
          .from('custom_equipment')
          .update({
            latitude: inspection.latitude,
            longitude: inspection.longitude,
          })
          .eq('equipment_type_id', inspection.equipment_type_id)
          .eq('id_equipamento', inspection.id_equipamento)
          .eq('user_id', user.id);
        
        if (updateError) {
          logger.warn('Erro ao atualizar coordenadas no cadastro do equipamento customizado', 'equipment', updateError);
        }
      } catch (updateError) {
        logger.warn('Erro ao atualizar coordenadas no cadastro do equipamento customizado', 'equipment', updateError);
      }
    }

    return true;
  } catch (error) {
    logger.error('Erro ao salvar inspeção customizada', 'equipment', error);
    throw error;
  }
}

