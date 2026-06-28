import { describe, it, expect } from 'vitest';
import {
  flattenChecklistResults,
  groupChecklistBySection,
  extractNonConformities,
  formatChecklistStatus,
  hasSectionedChecklist,
  groupFoamChamberChecklist,
} from '../checklistPdfUtils';
import { mapInspectionForPdf } from '../inspectionMapper';
import { getMonthDateRange } from '../../monthlyExtinguisherReport';
import { PDF_CONFIGS } from '../pdfConfigRegistry';

describe('formatChecklistStatus', () => {
  it('mapeia booleanos', () => {
    expect(formatChecklistStatus(true).display).toContain('Conforme');
    expect(formatChecklistStatus(false).isNonConforme).toBe(true);
  });

  it('mapeia strings SCBA', () => {
    expect(formatChecklistStatus('Aprovado').isConforme).toBe(true);
    expect(formatChecklistStatus('Reprovado').isNonConforme).toBe(true);
    expect(formatChecklistStatus('C').isConforme).toBe(true);
  });
});

describe('flattenChecklistResults', () => {
  it('achata JSON plano', () => {
    const rows = flattenChecklistResults({
      'Corrosão': 'Conforme',
      'Selos': 'Não Conforme',
    });
    expect(rows).toHaveLength(2);
    expect(rows[1].isNonConforme).toBe(true);
  });

  it('achata JSON aninhado SCBA', () => {
    const rows = flattenChecklistResults({
      Cilindro: {
        'Integridade Cilindro': 'C',
        Observações: 'Sem avarias',
      },
      Mascara: {
        'Vedação': 'N/C',
      },
      'Testes Funcionais': {
        'Estanqueidade Alta Pressão': 'Aprovado',
      },
    });
    expect(rows.length).toBeGreaterThan(3);
    expect(rows.some((r) => r.section === 'Cilindro')).toBe(true);
    expect(rows.some((r) => r.item === 'Observações')).toBe(true);
  });
});

describe('groupChecklistBySection', () => {
  it('agrupa por seção', () => {
    const rows = flattenChecklistResults({
      Cilindro: { Item1: 'C' },
      Mascara: { Item2: 'C' },
    });
    const sections = groupChecklistBySection(rows);
    expect(sections.some((s) => s.title === 'Cilindro')).toBe(true);
    expect(sections.some((s) => s.title === 'Mascara')).toBe(true);
  });
});

describe('extractNonConformities', () => {
  it('extrai itens não conformes com seção', () => {
    const list = extractNonConformities({
      Cilindro: { 'Manômetro': 'N/C' },
      Alarme: true,
    });
    expect(list.some((item) => item.includes('Cilindro'))).toBe(true);
  });
});

describe('hasSectionedChecklist', () => {
  it('detecta estrutura aninhada', () => {
    expect(hasSectionedChecklist({ A: { b: 'C' } })).toBe(true);
    expect(hasSectionedChecklist({ A: 'Conforme' })).toBe(false);
  });
});

describe('mapInspectionForPdf', () => {
  it('mapeia extintor com CO₂ e aprovado', () => {
    const mapped = mapInspectionForPdf(
      {
        id: 1,
        data_servico: '2026-06-01',
        aprovado_inspecao: 'Sim',
        peso_medido_conjunto_kg: 12.5,
        perda_kg: 0.1,
      },
      'extintor'
    );
    expect(mapped.status_geral).toBe('Sim');
    expect((mapped as Record<string, unknown>).peso_medido_conjunto_kg).toBe(12.5);
  });

  it('mapeia mangueira com resultado', () => {
    const mapped = mapInspectionForPdf(
      { id: 2, data_inspecao: '2026-06-01', resultado: 'Aprovado' },
      'mangueira'
    );
    expect(mapped.resultado).toBe('Aprovado');
  });

  it('mapeia reserva técnica NFPA 25', () => {
    const mapped = mapInspectionForPdf(
      {
        id: 'uuid',
        inspected_at: '2026-06-01',
        level_reading: '80%',
        condition: 'OK',
        suction_clean: true,
        overall_status: 'OK',
      },
      'reserva_tecnica'
    );
    expect((mapped as Record<string, unknown>).level_reading).toBe('80%');
    expect(mapped.status_geral).toBe('OK');
  });
});

describe('getMonthDateRange', () => {
  it('calcula intervalo do mês', () => {
    const { monthStart, monthEndExclusive } = getMonthDateRange('2026-06');
    expect(monthStart).toBe('2026-06-01');
    expect(monthEndExclusive).toBe('2026-07-01');
  });

  it('virada de ano', () => {
    const { monthEndExclusive } = getMonthDateRange('2026-12');
    expect(monthEndExclusive).toBe('2027-01-01');
  });
});

describe('PDF_CONFIGS extintor regressão', () => {
  it('mantém colunas mensais de extintor', () => {
    const cols = PDF_CONFIGS.extintor.monthlyColumns.map((c) => c.header);
    expect(cols).toEqual([
      'ID',
      'Agente',
      'Cap.',
      'Localização',
      'Data',
      'Status',
      'Peso CO₂',
      'Inspetor',
    ]);
  });

  it('buildMonthlyRow produz células esperadas', () => {
    const row = PDF_CONFIGS.extintor.buildMonthlyRow(
      {
        numero_identificacao: 'EXT-01',
        tipo_agente: 'CO2',
        capacidade: 6,
      },
      {
        data_servico: '2026-06-15',
        status_geral: 'Aprovado',
        inspetor_responsavel: 'João',
      }
    );
    expect(row.equipmentId).toBe('EXT-01');
    expect(row.cells[0]).toBe('EXT-01');
    expect(row.cells[5]).toBe('Aprovado');
  });
});

describe('groupFoamChamberChecklist', () => {
  it('agrupa itens por seção do modelo', () => {
    const sections = groupFoamChamberChecklist(
      'MCS - Selo de Vidro',
      'Visual Semestral',
      {
        'Pintura e estrutura sem corrosão ou amassados': 'Conforme',
        'Verificação de fluxo de água/espuma': 'Conforme',
      }
    );
    expect(sections.some((s) => s.title === 'Condições Gerais')).toBe(true);
    expect(sections.some((s) => s.title === 'Teste Funcional')).toBe(false);
  });

  it('inclui Teste Funcional em inspeção anual', () => {
    const sections = groupFoamChamberChecklist(
      'MCS - Selo de Vidro',
      'Funcional Anual',
      {
        'Verificação de fluxo de água/espuma': 'Conforme',
      }
    );
    expect(sections.some((s) => s.title === 'Teste Funcional')).toBe(true);
  });
});

describe('inventoryPdfUtils', () => {
  it('camara_espuma usa colunas específicas no inventário', async () => {
    const { getInventoryTableHead, buildInventoryTableRow, shouldShowInventoryDetails } =
      await import('../inventoryPdfUtils');

    const item = {
      _reportId: 'CAM-01',
      modelo: 'MCS - Selo de Vidro',
      _last_inspection_status: 'Conforme',
      _last_inspection_type: 'Funcional Anual',
      _last_inspection_date: '2026-01-15',
      _has_last_inspection: true,
      resultados_json: { 'Item A': 'Conforme' },
      link_foto_nao_conformidade: 'https://example.com/foto.jpg',
    };

    expect(getInventoryTableHead('camara_espuma')).toEqual([
      '#',
      'ID',
      'Modelo',
      'Localização',
      'Status',
      'Tipo Insp.',
      'Última Insp.',
    ]);
    expect(buildInventoryTableRow(item, 0, 'camara_espuma')[1]).toBe('CAM-01');
    expect(shouldShowInventoryDetails(item)).toBe(true);
  });
});

describe('PDF_CONFIGS cobertura por tipo', () => {
  const expectedTypes = [
    'extintor',
    'mangueira',
    'scba',
    'multigas',
    'camara_espuma',
    'canhao_monitor',
    'chuveiro_lavaolhos',
    'alarme',
    'abrigo',
    'reserva_tecnica',
  ];

  it.each(expectedTypes)('configura tipo %s', (typeKey) => {
    expect(PDF_CONFIGS[typeKey]).toBeDefined();
    expect(PDF_CONFIGS[typeKey].monthlyColumns.length).toBeGreaterThan(0);
  });

  it('SCBA usa checklist seccionado', () => {
    expect(PDF_CONFIGS.scba.sectionedChecklist).toBe(true);
  });
});
