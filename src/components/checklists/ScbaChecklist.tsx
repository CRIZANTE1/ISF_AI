/**
 * Checklist específico para inspeção visual periódica de SCBA
 */

import ChecklistItem from '../ChecklistItem';
import { useTranslation } from '../../hooks/useTranslation';
import { motion } from 'framer-motion';

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
          {[
            { key: 'Estanqueidade Alta Pressão', label: t('checklist.testSeal') },
            { key: 'Alarme de Baixa Pressão', label: t('checklist.testLowPressureAlarm') },
            { key: 'Vedação da Máscara', label: t('checklist.testMaskSeal') }
          ].map(({ key, label }) => {
            const resultKey = `Testes Funcionais.${key}`;
            const currentValue = results[resultKey];
            const isReprovado = currentValue === 'Reprovado';
            
            return (
              <motion.div
                key={key}
                className="p-4 rounded-lg border relative"
                style={{
                  backgroundColor: isReprovado ? 'rgba(252, 61, 57, 0.15)' : '#1A1A1A',
                  borderColor: isReprovado ? 'rgba(252, 61, 57, 0.5)' : '#2A2A2A',
                  borderWidth: isReprovado ? '2px' : '1px',
                  borderStyle: 'solid',
                }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {isReprovado && (
                  <motion.div
                    className="absolute top-2 right-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(252, 61, 57, 0.3)', color: '#FC3D39' }}>
                      ⚠
                    </span>
                  </motion.div>
                )}
                <label className="block text-sm font-medium mb-3" style={{ color: '#B0B0B0', paddingRight: isReprovado ? '60px' : '0' }}>
                  {label}
                </label>
                <div className="flex gap-4">
                  {[
                    { value: 'Aprovado', label: t('checklist.approved'), icon: '✓', color: '#53D769' },
                    { value: 'Reprovado', label: t('checklist.rejected'), icon: '✗', color: '#FC3D39' }
                  ].map(({ value, label, icon, color }) => (
                    <motion.label
                      key={value}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer"
                      style={{
                        backgroundColor: currentValue === value ? `${color}20` : 'transparent',
                        color: currentValue === value ? color : '#B0B0B0',
                        fontWeight: currentValue === value ? '600' : '400',
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <input
                        type="radio"
                        name={`teste_${key}`}
                        value={value}
                        checked={currentValue === value}
                        onChange={(e) => onResultChange(resultKey, e.target.value)}
                        className="w-4 h-4"
                        style={{ accentColor: color }}
                      />
                      {currentValue === value && <span className="text-sm font-medium">{icon}</span>}
                      <span className="text-sm">{label}</span>
                    </motion.label>
                  ))}
                </div>
                <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid' }}>
                  <p className="text-xs" style={{ color: '#9E9E9E' }}>
                    <strong>{t('guides.instructions')}</strong> {
                      key === 'Estanqueidade Alta Pressão' ? t('guides.scbaChecklist.pressureTest') :
                      key === 'Alarme de Baixa Pressão' ? t('guides.scbaChecklist.lowPressureAlarm') :
                      t('guides.scbaChecklist.maskSeal')
                    }
                  </p>
                </div>
              </motion.div>
            );
          })}
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
            {cilindroItems.map((item) => {
              const currentValue = results[`Cilindro.${item}`];
              const isNonConform = currentValue === 'N/C';
              
              return (
                <motion.div
                  key={item}
                  className="flex items-center justify-between p-3 rounded-lg border relative"
                  style={{
                    backgroundColor: isNonConform ? 'rgba(252, 61, 57, 0.15)' : '#1A1A1A',
                    borderColor: isNonConform ? 'rgba(252, 61, 57, 0.5)' : '#2A2A2A',
                    borderWidth: isNonConform ? '2px' : '1px',
                    borderStyle: 'solid',
                  }}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.01 }}
                >
                  {isNonConform && (
                    <motion.div
                      className="absolute top-2 right-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(252, 61, 57, 0.3)', color: '#FC3D39' }}>
                        ⚠
                      </span>
                    </motion.div>
                  )}
                  <span style={{ color: '#FFFFFF', paddingRight: isNonConform ? '40px' : '0' }}>{translateItem(item)}</span>
                  <div className="flex gap-2">
                    {[
                      { value: 'C', label: t('checklist.conformShort'), icon: '✓', color: '#53D769' },
                      { value: 'N/C', label: t('checklist.nonConformShort'), icon: '✗', color: '#FC3D39' },
                      { value: 'N/A', label: t('checklist.notApplicable'), icon: '—', color: '#8E8E93' }
                    ].map(({ value, label, icon, color }) => (
                      <motion.label
                        key={value}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer"
                        style={{
                          backgroundColor: currentValue === value ? `${color}20` : 'transparent',
                          color: currentValue === value ? color : '#B0B0B0',
                          fontWeight: currentValue === value ? '600' : '400',
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <input
                          type="radio"
                          name={`cil_${item}`}
                          value={value}
                          checked={currentValue === value}
                          onChange={(e) => onResultChange(`Cilindro.${item}`, e.target.value)}
                          className="w-4 h-4"
                          style={{ accentColor: color }}
                        />
                        {currentValue === value && <span className="text-xs font-medium">{icon}</span>}
                        <span className="text-xs">{label}</span>
                      </motion.label>
                    ))}
                  </div>
                </motion.div>
              );
            })}
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
            {mascaraItems.map((item) => {
              const currentValue = results[`Mascara.${item}`];
              const isNonConform = currentValue === 'N/C';
              
              return (
                <motion.div
                  key={item}
                  className="flex items-center justify-between p-3 rounded-lg border relative"
                  style={{
                    backgroundColor: isNonConform ? 'rgba(252, 61, 57, 0.15)' : '#1A1A1A',
                    borderColor: isNonConform ? 'rgba(252, 61, 57, 0.5)' : '#2A2A2A',
                    borderWidth: isNonConform ? '2px' : '1px',
                    borderStyle: 'solid',
                  }}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.01 }}
                >
                  {isNonConform && (
                    <motion.div
                      className="absolute top-2 right-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'rgba(252, 61, 57, 0.3)', color: '#FC3D39' }}>
                        ⚠
                      </span>
                    </motion.div>
                  )}
                  <span style={{ color: '#FFFFFF', paddingRight: isNonConform ? '40px' : '0' }}>{translateItem(item)}</span>
                  <div className="flex gap-2">
                    {[
                      { value: 'C', label: t('checklist.conformShort'), icon: '✓', color: '#53D769' },
                      { value: 'N/C', label: t('checklist.nonConformShort'), icon: '✗', color: '#FC3D39' },
                      { value: 'N/A', label: t('checklist.notApplicable'), icon: '—', color: '#8E8E93' }
                    ].map(({ value, label, icon, color }) => (
                      <motion.label
                        key={value}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer"
                        style={{
                          backgroundColor: currentValue === value ? `${color}20` : 'transparent',
                          color: currentValue === value ? color : '#B0B0B0',
                          fontWeight: currentValue === value ? '600' : '400',
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <input
                          type="radio"
                          name={`masc_${item}`}
                          value={value}
                          checked={currentValue === value}
                          onChange={(e) => onResultChange(`Mascara.${item}`, e.target.value)}
                          className="w-4 h-4"
                          style={{ accentColor: color }}
                        />
                        {currentValue === value && <span className="text-xs font-medium">{icon}</span>}
                        <span className="text-xs">{label}</span>
                      </motion.label>
                    ))}
                  </div>
                </motion.div>
              );
            })}
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

