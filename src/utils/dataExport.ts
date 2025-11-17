/**
 * Utilitário para exportação de dados do usuário
 * Conforme requisitos LGPD/GDPR
 */

import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export interface UserDataExport {
  exportDate: string;
  userId: string;
  userEmail: string;
  profile: any;
  equipment: {
    extinguishers: any[];
    hoses: any[];
    scbas: any[];
    multigas: any[];
    foamChambers: any[];
    cannonMonitors: any[];
    eyewashes: any[];
    alarms: any[];
    shelters: any[];
  };
  inspections: {
    scba: any[];
    multigas: any[];
    foamChambers: any[];
    cannonMonitors: any[];
    eyewashes: any[];
    alarms: any[];
    shelters: any[];
  };
  locations: any[];
}

/**
 * Exporta todos os dados do usuário em formato JSON
 */
export async function exportUserData(user: User): Promise<UserDataExport> {
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  try {
    // Buscar perfil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    // Buscar todos os equipamentos
    const [
      extinguishers,
      hoses,
      scbas,
      multigas,
      foamChambers,
      cannonMonitors,
      eyewashes,
      alarms,
      shelters,
    ] = await Promise.all([
      supabase.from('extintores').select('*').eq('user_id', user.id),
      supabase.from('mangueiras').select('*').eq('user_id', user.id),
      supabase.from('conjuntos_autonomos').select('*').eq('user_id', user.id),
      supabase.from('inventario_multigas').select('*').eq('user_id', user.id),
      supabase.from('inventario_camaras_espuma').select('*').eq('user_id', user.id),
      supabase.from('inventario_canhoes_monitores').select('*').eq('user_id', user.id),
      supabase.from('inventario_chuveiros_lava_olhos').select('*').eq('user_id', user.id),
      supabase.from('inventario_alarmes').select('*').eq('user_id', user.id),
      supabase.from('abrigos').select('*').eq('user_id', user.id),
    ]);

    // Buscar todas as inspeções
    const [
      scbaInspections,
      multigasInspections,
      foamChamberInspections,
      cannonMonitorInspections,
      eyewashInspections,
      alarmInspections,
      shelterInspections,
    ] = await Promise.all([
      supabase.from('inspecoes_scba').select('*').eq('user_id', user.id),
      supabase.from('inspecoes_multigas').select('*').eq('user_id', user.id),
      supabase.from('inspecoes_camaras_espuma').select('*').eq('user_id', user.id),
      supabase.from('inspecoes_canhoes_monitores').select('*').eq('user_id', user.id),
      supabase.from('inspecoes_chuveiros_lava_olhos').select('*').eq('user_id', user.id),
      supabase.from('inspecoes_alarmes').select('*').eq('user_id', user.id),
      supabase.from('inspecoes_abrigos').select('*').eq('user_id', user.id),
    ]);

    // Buscar locais
    const { data: locations } = await supabase
      .from('locais')
      .select('*')
      .eq('user_id', user.id);

    // Montar objeto de exportação
    const exportData: UserDataExport = {
      exportDate: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email || '',
      profile: profile || null,
      equipment: {
        extinguishers: extinguishers.data || [],
        hoses: hoses.data || [],
        scbas: scbas.data || [],
        multigas: multigas.data || [],
        foamChambers: foamChambers.data || [],
        cannonMonitors: cannonMonitors.data || [],
        eyewashes: eyewashes.data || [],
        alarms: alarms.data || [],
        shelters: shelters.data || [],
      },
      inspections: {
        scba: scbaInspections.data || [],
        multigas: multigasInspections.data || [],
        foamChambers: foamChamberInspections.data || [],
        cannonMonitors: cannonMonitorInspections.data || [],
        eyewashes: eyewashInspections.data || [],
        alarms: alarmInspections.data || [],
        shelters: shelterInspections.data || [],
      },
      locations: locations || [],
    };

    return exportData;
  } catch (error) {
    throw new Error(`Erro ao exportar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Converte dados exportados para JSON e faz download
 */
export function downloadUserDataAsJSON(data: UserDataExport, filename?: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `isf-ia-dados-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Converte dados exportados para CSV (apenas equipamentos)
 */
export function downloadUserDataAsCSV(data: UserDataExport, filename?: string): void {
  // Converter equipamentos para CSV
  const allEquipment: any[] = [
    ...data.equipment.extinguishers.map(e => ({ ...e, tipo: 'Extintor' })),
    ...data.equipment.hoses.map(e => ({ ...e, tipo: 'Mangueira' })),
    ...data.equipment.scbas.map(e => ({ ...e, tipo: 'SCBA' })),
    ...data.equipment.multigas.map(e => ({ ...e, tipo: 'Multigás' })),
    ...data.equipment.foamChambers.map(e => ({ ...e, tipo: 'Câmara de Espuma' })),
    ...data.equipment.cannonMonitors.map(e => ({ ...e, tipo: 'Canhão Monitor' })),
    ...data.equipment.eyewashes.map(e => ({ ...e, tipo: 'Chuveiro/Lava-olhos' })),
    ...data.equipment.alarms.map(e => ({ ...e, tipo: 'Alarme' })),
    ...data.equipment.shelters.map(e => ({ ...e, tipo: 'Abrigo' })),
  ];

  if (allEquipment.length === 0) {
    throw new Error('Nenhum equipamento para exportar');
  }

  // Obter todas as chaves únicas
  const allKeys = new Set<string>();
  allEquipment.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });

  const headers = Array.from(allKeys);
  const csvRows = [
    headers.join(','),
    ...allEquipment.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        // Escapar vírgulas e aspas
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      }).join(',')
    ),
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `isf-ia-equipamentos-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

