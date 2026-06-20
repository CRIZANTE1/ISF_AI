/**
 * Checklist dinâmico para equipamentos customizados
 */

import { useState, useEffect } from 'react';
import ChecklistSection from '../ChecklistSection';
import { ListSkeleton } from '../skeletons';
import { getCustomChecklistFull, type CustomChecklist } from '../../utils/customEquipmentOperations';

interface CustomChecklistProps {
  equipmentTypeId: string;
  checklistId?: string;
  results: Record<string, string>;
  onResultChange: (question: string, value: string) => void;
}

const CustomChecklist = ({ equipmentTypeId, checklistId, results, onResultChange }: CustomChecklistProps) => {
  const [checklistData, setChecklistData] = useState<{
    checklist: CustomChecklist;
    sections: Array<{
      id: string;
      section_name: string;
      section_order: number;
      items: Array<{
        id: string;
        question_text: string;
        item_order: number;
      }>;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChecklist = async () => {
      if (!equipmentTypeId) {
        setLoading(false);
        return;
      }

      try {
        // Se checklistId fornecido, carrega checklist específico
        // Senão, carrega checklist padrão do tipo
        if (checklistId) {
          const full = await getCustomChecklistFull(checklistId);
          if (full) {
            setChecklistData(full);
          }
        } else {
          // Busca checklist padrão do tipo
          const { getCustomChecklists } = await import('../../utils/customEquipmentOperations');
          const checklists = await getCustomChecklists(equipmentTypeId);
          const defaultChecklist = checklists.find(c => c.is_default) || checklists[0];
          
          if (defaultChecklist) {
            const full = await getCustomChecklistFull(defaultChecklist.id);
            if (full) {
              setChecklistData(full);
            }
          }
        }
      } catch (error) {
        // Erro silencioso - checklist pode não existir ainda
      } finally {
        setLoading(false);
      }
    };

    loadChecklist();
  }, [equipmentTypeId, checklistId]);

  if (loading) {
    return <ListSkeleton count={4} itemClassName="h-12 w-full rounded-lg" />;
  }

  if (!checklistData || checklistData.sections.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: '#B0B0B0' }}>
        <p>Nenhum checklist configurado para este tipo de equipamento.</p>
        <p className="text-xs mt-2">Configure um checklist na página de administração.</p>
      </div>
    );
  }

  // Converte estrutura do checklist customizado para formato esperado pelo ChecklistSection
  const checklistBySection: Record<string, string[]> = {};
  checklistData.sections.forEach((section) => {
    checklistBySection[section.section_name] = section.items
      .sort((a, b) => a.item_order - b.item_order)
      .map(item => item.question_text);
  });

  return (
    <div>
      {Object.entries(checklistBySection).map(([category, questions]) => (
        <ChecklistSection
          key={category}
          title={category}
          questions={questions}
          results={results}
          onResultChange={onResultChange}
        />
      ))}
    </div>
  );
};

export default CustomChecklist;

