/**
 * Checklist específico para inspeção visual periódica de SCBA
 */

import ChecklistItem from '../ChecklistItem';
import { useTranslation } from '../../hooks/useTranslation';

interface ScbaChecklistProps {
  results: Record<string, string>;
  onResultChange: (question: string, value: string) => void;
  onObservationChange: (section: string, observation: string) => void;
  observations: Record<string, string>;
}

const ScbaChecklist = ({ 
  results, 
  onResultChange, 
  onObservationChange,
  observations 
}: ScbaChecklistProps) => {
  const { t } = useTranslation();
  
  // Helper para gerar chave de tradução
  const getItemKey = (item: string): string => {
    return item
      .toLowerCase()
      .replace(/[–—]/g, '-')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };
  
  // Helper para traduzir itens
  const translateItem = (item: string): string => {
    const key = getItemKey(item);
    const questionKey = `checklist.questions.${key}`;
    
    // Tenta buscar a tradução
    const translated = t(questionKey);
    
    // Se a tradução retornou a própria chave ou contém o namespace, usar o texto original
    // Caso contrário, usar a tradução
    return (translated === questionKey || 
            (typeof translated === 'string' && translated.includes('checklist.questions.')))
      ? item 
      : translated;
  };
  
  const cilindroItems = [
    "Integridade Cilindro",
    "Registro e Valvulas",
    "Manômetro do Cilindro",
    "Pressão Manômetro",
    "Mangueiras e Conexões",
    "Correias/ Tirantes e Alças"
  ];

  const mascaraItems = [
    "Integridade da Máscara",
    "Visor ou Lente",
    "Borrachas de Vedação",
    "Conector da válvula de Inalação",
    "Correias/ Tirantes",
    "Fivelas e Alças",
    "Válvula de Exalação"
  ];

  return (
    <div className="space-y-6">
      {/* Testes Funcionais */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#FFFFFF' }}>
          {t('checklist.functionalTests')}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0B0' }}>
              {t('checklist.testSeal')}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="teste_estanqueidade"
                  value="Aprovado"
                  checked={results["Testes Funcionais.Estanqueidade Alta Pressão"] === 'Aprovado'}
                  onChange={(e) => onResultChange("Testes Funcionais.Estanqueidade Alta Pressão", e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: '#FFFFFF' }}
                />
                <span style={{ color: '#FFFFFF' }}>{t('checklist.approved')}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="teste_estanqueidade"
                  value="Reprovado"
                  checked={results["Testes Funcionais.Estanqueidade Alta Pressão"] === 'Reprovado'}
                  onChange={(e) => onResultChange("Testes Funcionais.Estanqueidade Alta Pressão", e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: '#FFFFFF' }}
                />
                <span style={{ color: '#FFFFFF' }}>{t('checklist.rejected')}</span>
              </label>
            </div>
            <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid' }}>
              <p className="text-xs" style={{ color: '#9E9E9E' }}>
                <strong>{t('guides.instructions')}</strong> {t('guides.scbaChecklist.pressureTest')}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0B0' }}>
              {t('checklist.testLowPressureAlarm')}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="teste_alarme"
                  value="Aprovado"
                  checked={results["Testes Funcionais.Alarme de Baixa Pressão"] === 'Aprovado'}
                  onChange={(e) => onResultChange("Testes Funcionais.Alarme de Baixa Pressão", e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: '#FFFFFF' }}
                />
                <span style={{ color: '#FFFFFF' }}>{t('checklist.approved')}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="teste_alarme"
                  value="Reprovado"
                  checked={results["Testes Funcionais.Alarme de Baixa Pressão"] === 'Reprovado'}
                  onChange={(e) => onResultChange("Testes Funcionais.Alarme de Baixa Pressão", e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: '#FFFFFF' }}
                />
                <span style={{ color: '#FFFFFF' }}>{t('checklist.rejected')}</span>
              </label>
            </div>
            <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid' }}>
              <p className="text-xs" style={{ color: '#9E9E9E' }}>
                <strong>{t('guides.instructions')}</strong> {t('guides.scbaChecklist.lowPressureAlarm')}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0B0' }}>
              {t('checklist.testMaskSeal')}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="teste_vedacao_mascara"
                  value="Aprovado"
                  checked={results["Testes Funcionais.Vedação da Máscara"] === 'Aprovado'}
                  onChange={(e) => onResultChange("Testes Funcionais.Vedação da Máscara", e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: '#FFFFFF' }}
                />
                <span style={{ color: '#FFFFFF' }}>{t('checklist.approved')}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="teste_vedacao_mascara"
                  value="Reprovado"
                  checked={results["Testes Funcionais.Vedação da Máscara"] === 'Reprovado'}
                  onChange={(e) => onResultChange("Testes Funcionais.Vedação da Máscara", e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: '#FFFFFF' }}
                />
                <span style={{ color: '#FFFFFF' }}>{t('checklist.rejected')}</span>
              </label>
            </div>
            <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid' }}>
              <p className="text-xs" style={{ color: '#9E9E9E' }}>
                <strong>{t('guides.instructions')}</strong> {t('guides.scbaChecklist.maskSeal')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t" style={{ borderColor: '#2A2A2A' }}></div>

      {/* Inspeção Visual dos Componentes */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#FFFFFF' }}>
          {t('checklist.visualInspection')}
        </h3>

        {/* Cilindro */}
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-3" style={{ color: '#FFFFFF' }}>
            {t('checklist.cylinder')}
          </h4>
          <div className="space-y-2">
            {cilindroItems.map((item) => (
              <div key={item} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid' }}>
                <span style={{ color: '#FFFFFF' }}>{translateItem(item)}</span>
                <div className="flex gap-2">
                  {[
                    { value: 'C', label: t('checklist.conformShort') },
                    { value: 'N/C', label: t('checklist.nonConformShort') },
                    { value: 'N/A', label: t('checklist.notApplicable') }
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name={`cil_${item}`}
                        value={value}
                        checked={results[`Cilindro.${item}`] === value}
                        onChange={(e) => onResultChange(`Cilindro.${item}`, e.target.value)}
                        className="w-4 h-4"
                        style={{ accentColor: '#FFFFFF' }}
                      />
                      <span className="text-xs" style={{ color: '#B0B0B0' }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0B0' }}>
              {t('checklist.observationsCylinderLabel')}
            </label>
            <textarea
              value={observations.Cilindro || ''}
              onChange={(e) => onObservationChange('Cilindro', e.target.value)}
              rows={2}
              className="w-full p-3 rounded-lg" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
              placeholder={t('checklist.observationsCylinder')}
            />
          </div>
        </div>

        {/* Máscara */}
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-3" style={{ color: '#FFFFFF' }}>
            {t('checklist.mask')}
          </h4>
          <div className="space-y-2">
            {mascaraItems.map((item) => (
              <div key={item} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid' }}>
                <span style={{ color: '#FFFFFF' }}>{translateItem(item)}</span>
                <div className="flex gap-2">
                  {[
                    { value: 'C', label: t('checklist.conformShort') },
                    { value: 'N/C', label: t('checklist.nonConformShort') },
                    { value: 'N/A', label: t('checklist.notApplicable') }
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name={`masc_${item}`}
                        value={value}
                        checked={results[`Mascara.${item}`] === value}
                        onChange={(e) => onResultChange(`Mascara.${item}`, e.target.value)}
                        className="w-4 h-4"
                        style={{ accentColor: '#FFFFFF' }}
                      />
                      <span className="text-xs" style={{ color: '#B0B0B0' }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0B0' }}>
              {t('checklist.observationsMaskLabel')}
            </label>
            <textarea
              value={observations.Mascara || ''}
              onChange={(e) => onObservationChange('Mascara', e.target.value)}
              rows={2}
              className="w-full p-3 rounded-lg" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
              placeholder={t('checklist.observationsMask')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScbaChecklist;

