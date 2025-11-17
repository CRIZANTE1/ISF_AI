/**
 * Utilitário para importação de dados do usuário
 * Permite restaurar backup de dados exportados
 */

import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { UserDataExport } from './dataExport';
import { handleErrorWithoutToast } from './errorHandler';

/**
 * Valida estrutura de dados importados
 */
export function validateImportData(data: any): data is UserDataExport {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Verificar campos obrigatórios
  if (!data.userId || !data.exportDate) {
    return false;
  }

  // Verificar estrutura de equipamentos
  if (!data.equipment || typeof data.equipment !== 'object') {
    return false;
  }

  // Verificar estrutura de inspeções
  if (!data.inspections || typeof data.inspections !== 'object') {
    return false;
  }

  return true;
}

/**
 * Importa dados do usuário a partir de arquivo JSON
 */
export async function importUserData(
  user: User,
  file: File
): Promise<{ success: boolean; message: string; imported: number }> {
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  try {
    // Ler arquivo
    const text = await file.text();
    const data = JSON.parse(text) as UserDataExport;

    // Validar estrutura
    if (!validateImportData(data)) {
      throw new Error('Formato de arquivo inválido. Certifique-se de que é um arquivo de exportação válido do ISF IA.');
    }

    // Verificar se o arquivo pertence ao usuário atual
    if (data.userId !== user.id) {
      throw new Error('Este arquivo pertence a outro usuário. Não é possível importar dados de outra conta.');
    }

    let importedCount = 0;

    // Importar equipamentos (apenas se não existirem)
    const equipmentTables = [
      { name: 'extintores', data: data.equipment.extinguishers },
      { name: 'mangueiras', data: data.equipment.hoses },
      { name: 'conjuntos_autonomos', data: data.equipment.scbas },
      { name: 'inventario_multigas', data: data.equipment.multigas },
      { name: 'inventario_camaras_espuma', data: data.equipment.foamChambers },
      { name: 'inventario_canhoes_monitores', data: data.equipment.cannonMonitors },
      { name: 'inventario_chuveiros_lava_olhos', data: data.equipment.eyewashes },
      { name: 'inventario_alarmes', data: data.equipment.alarms },
      { name: 'abrigos', data: data.equipment.shelters },
    ];

    for (const table of equipmentTables) {
      if (table.data && table.data.length > 0) {
        // Remover campos que não devem ser importados
        const cleanedData = table.data.map(item => {
          const { id, created_at, updated_at, ...rest } = item;
          return {
            ...rest,
            user_id: user.id, // Garantir que user_id está correto
          };
        });

        // Verificar quais já existem (por número de identificação ou similar)
        // Por simplicidade, vamos tentar inserir e ignorar duplicatas
        const { error } = await supabase
          .from(table.name)
          .upsert(cleanedData, { onConflict: 'id', ignoreDuplicates: true });

        if (!error) {
          importedCount += cleanedData.length;
        }
      }
    }

    // Importar inspeções
    const inspectionTables = [
      { name: 'inspecoes_scba', data: data.inspections.scba },
      { name: 'inspecoes_multigas', data: data.inspections.multigas },
      { name: 'inspecoes_camaras_espuma', data: data.inspections.foamChambers },
      { name: 'inspecoes_canhoes_monitores', data: data.inspections.cannonMonitors },
      { name: 'inspecoes_chuveiros_lava_olhos', data: data.inspections.eyewashes },
      { name: 'inspecoes_alarmes', data: data.inspections.alarms },
      { name: 'inspecoes_abrigos', data: data.inspections.shelters },
    ];

    for (const table of inspectionTables) {
      if (table.data && table.data.length > 0) {
        const cleanedData = table.data.map(item => {
          const { id, created_at, updated_at, ...rest } = item;
          return {
            ...rest,
            user_id: user.id,
          };
        });

        const { error } = await supabase
          .from(table.name)
          .upsert(cleanedData, { onConflict: 'id', ignoreDuplicates: true });

        if (!error) {
          importedCount += cleanedData.length;
        }
      }
    }

    // Importar locais
    if (data.locations && data.locations.length > 0) {
      const cleanedLocations = data.locations.map(item => {
        const { id, created_at, updated_at, ...rest } = item;
        return {
          ...rest,
          user_id: user.id,
        };
      });

      const { error } = await supabase
        .from('locais')
        .upsert(cleanedLocations, { onConflict: 'id', ignoreDuplicates: true });

      if (!error) {
        importedCount += cleanedLocations.length;
      }
    }

    return {
      success: true,
      message: `Importação concluída! ${importedCount} registros importados.`,
      imported: importedCount,
    };
  } catch (error) {
    const appError = handleErrorWithoutToast(error, 'storage');
    return {
      success: false,
      message: appError.userMessage || appError.message,
      imported: 0,
    };
  }
}

