import { useForm, Controller } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import PhotoUpload from '../components/PhotoUpload';
import EyewashChecklist from '../components/checklists/EyewashChecklist';
import FoamChamberChecklist from '../components/checklists/FoamChamberChecklist';
import AlarmChecklist from '../components/checklists/AlarmChecklist';
import CannonMonitorChecklist from '../components/checklists/CannonMonitorChecklist';
import { 
  generateActionPlan, 
  calculateNextDates,
  type InspectionRecord,
  type EquipmentDates,
  saveExtinguisherInspection,
  getExtinguisherById,
} from '../utils/extinguisherOperations';
import { saveEyewashInspection, generateEyewashActionPlan, getAllEyewashStations } from '../utils/eyewashOperations';
import { saveFoamChamberInspection, getAllFoamChambers } from '../utils/foamChamberOperations';
import { saveAlarmInspection, getAllAlarmSystems } from '../utils/alarmOperations';
import { saveCannonMonitorInspection, getAllCannonMonitors } from '../utils/cannonMonitorOperations';
import { uploadEvidencePhoto } from '../utils/storage';

type AddInspectionFormData = {
  data_inspecao?: string;
  tipo_servico?: string;
  tipo_inspecao?: string;
  aprovado_inspecao?: string;
  status_geral?: string;
  observacoes_gerais?: string;
  foto_nao_conformidade?: File | null;
  resultados_json?: Record<string, any>;
};

type EquipmentInfo = {
  id: string;
  name: string;
  location?: string;
  localizacao?: string;
  model?: string;
  modelo?: string;
  [key: string]: any;
};

const AddInspectionPage = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<EquipmentInfo | null>(null);
  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [planAction, setPlanAction] = useState<string>('');
  const [checklistResults, setChecklistResults] = useState<Record<string, string>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [foamChamberInspectionType, setFoamChamberInspectionType] = useState<'Visual Semestral' | 'Funcional Anual'>('Visual Semestral');
  const [cannonMonitorInspectionType, setCannonMonitorInspectionType] = useState<'Visual' | 'Funcional'>('Visual');
  
  const { register, handleSubmit, formState: { errors }, watch, control } = useForm<AddInspectionFormData>({
    defaultValues: {
      data_inspecao: new Date().toISOString().split('T')[0],
      tipo_servico: 'Inspeção',
      aprovado_inspecao: 'Sim',
      status_geral: 'Aprovado',
    }
  });

  const aprovado = watch('aprovado_inspecao');
  const observacoes = watch('observacoes_gerais');

  // Busca informações do equipamento baseado no tipo
  useEffect(() => {
    const fetchEquipment = async () => {
      if (!id || !type) return;
      setLoadingEquipment(true);
      setError(null);

      try {
        let equipmentData: EquipmentInfo | null = null;

        switch (type) {
          case 'extintor':
            const extData = await getExtinguisherById(id);
            if (extData) {
              equipmentData = {
                id: extData.numero_identificacao,
                name: extData.numero_identificacao,
                location: extData.local_id || undefined,
              };
            }
            break;
          case 'chuveiro_lavaolhos':
            const eyewashStations = await getAllEyewashStations();
            const eyewashData = eyewashStations.find(e => e.id_equipamento === id);
            if (eyewashData) {
              equipmentData = {
                id: eyewashData.id_equipamento,
                name: eyewashData.id_equipamento,
                location: eyewashData.localizacao,
              };
            }
            break;
          case 'camara_espuma':
            const foamChambers = await getAllFoamChambers();
            const foamData = foamChambers.find(e => e.id_camara === id);
            if (foamData) {
              equipmentData = {
                id: foamData.id_camara,
                name: foamData.id_camara,
                location: foamData.localizacao,
                model: foamData.modelo,
              };
            }
            break;
          case 'alarme':
            const alarmSystems = await getAllAlarmSystems();
            const alarmData = alarmSystems.find(e => e.id_sistema === id);
            if (alarmData) {
              equipmentData = {
                id: alarmData.id_sistema,
                name: alarmData.id_sistema,
                location: alarmData.localizacao,
              };
            }
            break;
          case 'canhao_monitor':
            const cannonMonitors = await getAllCannonMonitors();
            const cannonData = cannonMonitors.find(e => e.id_equipamento === id);
            if (cannonData) {
              equipmentData = {
                id: cannonData.id_equipamento,
                name: cannonData.id_equipamento,
                location: cannonData.localizacao,
              };
            }
            break;
        }

        if (!equipmentData) {
          setError(`Equipamento não encontrado. Verifique se o ID '${id}' está correto.`);
        } else {
          setEquipment(equipmentData);
        }
      } catch (err: any) {
        console.error('Erro ao buscar equipamento:', err);
        setError('Falha ao buscar informações do equipamento.');
      } finally {
        setLoadingEquipment(false);
      }
    };

    fetchEquipment();
  }, [id, type]);

  // Gera plano de ação para extintores
  useEffect(() => {
    if (type === 'extintor' && aprovado && observacoes !== undefined) {
      const record: InspectionRecord = {
        aprovado_inspecao: aprovado,
        observacoes_gerais: observacoes || ''
      };
      const plan = generateActionPlan(record);
      setPlanAction(plan);
    }
  }, [aprovado, observacoes, type]);

  // Gera plano de ação para equipamentos com checklist
  useEffect(() => {
    if (type === 'chuveiro_lavaolhos') {
      const nonConformities = Object.entries(checklistResults)
        .filter(([_, status]) => status === 'Não Conforme')
        .map(([question, _]) => question);
      const plan = generateEyewashActionPlan(nonConformities);
      setPlanAction(plan);
    }
  }, [checklistResults, type]);

  const handleChecklistChange = (question: string, value: string) => {
    setChecklistResults(prev => ({
      ...prev,
      [question]: value
    }));
  };

  const onSubmit = async (formData: AddInspectionFormData) => {
    if (!user || !id || !type || !equipment) return;
    setLoading(true);
    setError(null);

    try {
      const inspectionDate = formData.data_inspecao || new Date().toISOString().split('T')[0];
      let photoLink: string | null = null;

      // Faz upload da foto se houver
      if (photoFile) {
        const folderMap: Record<string, string> = {
          extintor: 'nao_conformidade_extintor',
          chuveiro_lavaolhos: 'nao_conformidade_chuveiro',
          camara_espuma: 'nao_conformidade_camara_espuma',
          alarme: 'nao_conformidade_alarme',
          canhao_monitor: 'nao_conformidade_canhao_monitor',
        };
        photoLink = await uploadEvidencePhoto(photoFile, id, folderMap[type] || 'nao_conformidade');
      }

      // Determina status geral baseado nos resultados do checklist
      const nonConformities = Object.values(checklistResults).filter(status => status === 'Não Conforme');
      const overallStatus = nonConformities.length > 0 ? 'Reprovado com Pendências' : 'Aprovado';

      switch (type) {
        case 'extintor': {
          // Busca último registro para preservar datas
          const lastRecord = await getExtinguisherById(id);
          const existingDates: EquipmentDates = {
            data_proxima_manutencao_2_nivel: lastRecord?.data_proxima_manutencao_2_nivel || null,
            data_proxima_manutencao_3_nivel: lastRecord?.data_proxima_manutencao_3_nivel || null,
            data_ultimo_ensaio_hidrostatico: lastRecord?.data_ultimo_ensaio_hidrostatico || null,
          };

          const nextDates = calculateNextDates(
            inspectionDate,
            formData.tipo_servico || 'Inspeção',
            existingDates
          );

          // Converte null para undefined nas datas
          const cleanDates = Object.fromEntries(
            Object.entries(nextDates).map(([key, value]) => [key, value ?? undefined])
          );

          const inspectionRecord = {
            numero_identificacao: id,
            tipo_servico: formData.tipo_servico || 'Inspeção',
            data_servico: inspectionDate,
            inspetor_responsavel: user.user_metadata?.full_name || user.email || 'Usuário',
            aprovado_inspecao: aprovado || 'Sim',
            observacoes_gerais: observacoes || '',
            plano_de_acao: planAction,
            link_foto_nao_conformidade: photoLink || undefined,
            ...cleanDates,
            user_id: user.id,
          };

          const success = await saveExtinguisherInspection(inspectionRecord);
          if (!success) throw new Error('Falha ao salvar inspeção');
          break;
        }

        case 'chuveiro_lavaolhos': {
          const inspectionRecord = {
            id_equipamento: id,
            data_inspecao: inspectionDate,
            status_geral: overallStatus,
            plano_de_acao: planAction,
            resultados_json: checklistResults,
            link_foto_nao_conformidade: photoLink || undefined,
            inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
            data_proxima_inspecao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            user_id: user.id,
          };

          const success = await saveEyewashInspection(inspectionRecord);
          if (!success) throw new Error('Falha ao salvar inspeção');
          break;
        }

        case 'camara_espuma': {
          const inspectionRecord = {
            id_camara: id,
            data_inspecao: inspectionDate,
            tipo_inspecao: foamChamberInspectionType,
            status_geral: overallStatus,
            plano_de_acao: planAction,
            resultados_json: checklistResults,
            link_foto_nao_conformidade: photoLink || undefined,
            inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
            data_proxima_inspecao: foamChamberInspectionType === 'Funcional Anual'
              ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            user_id: user.id,
          };

          const success = await saveFoamChamberInspection(inspectionRecord);
          if (!success) throw new Error('Falha ao salvar inspeção');
          break;
        }

        case 'alarme': {
          const inspectionRecord = {
            id_sistema: id,
            data_inspecao: inspectionDate,
            status_geral: overallStatus,
            plano_de_acao: planAction,
            resultados_json: checklistResults,
            link_foto_nao_conformidade: photoLink || undefined,
            inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
            data_proxima_inspecao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            user_id: user.id,
          };

          const success = await saveAlarmInspection(inspectionRecord);
          if (!success) throw new Error('Falha ao salvar inspeção');
          break;
        }

        case 'canhao_monitor': {
          const inspectionRecord = {
            id_equipamento: id,
            data_inspecao: inspectionDate,
            tipo_inspecao: cannonMonitorInspectionType,
            status_geral: overallStatus,
            plano_de_acao: planAction,
            resultados_json: checklistResults,
            link_foto_nao_conformidade: photoLink || undefined,
            inspetor: user.user_metadata?.full_name || user.email || 'Usuário',
            data_proxima_inspecao: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            user_id: user.id,
          };

          const success = await saveCannonMonitorInspection(inspectionRecord);
          if (!success) throw new Error('Falha ao salvar inspeção');
          break;
        }

        default:
          throw new Error(`Tipo de equipamento '${type}' não suportado para inspeção`);
      }

      navigate(`/inspections/${type}`);
    } catch (err: any) {
      setError(err.message || 'Falha ao registrar inspeção.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingEquipment) {
    return (
      <div className="min-h-screen">
        <PageHeader title="Registrar Inspeção" />
        <main className="p-4">
          <p className="text-center text-light-text-secondary dark:text-dark-text-secondary">Carregando...</p>
        </main>
      </div>
    );
  }

  const hasChecklist = ['chuveiro_lavaolhos', 'camara_espuma', 'alarme', 'canhao_monitor'].includes(type || '');
  const nonConformities = Object.values(checklistResults).filter(status => status === 'Não Conforme');
  const requiresPhoto = nonConformities.length > 0 || (type === 'camara_espuma' && foamChamberInspectionType === 'Funcional Anual');

  return (
    <div className="min-h-screen">
      <PageHeader title="Registrar Inspeção" />
      <main className="p-4">
        {equipment && (
          <div className="mb-4 p-3 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border">
            <p className="font-semibold text-sm">{equipment.name}</p>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
              {equipment.location || equipment.localizacao || 'Sem localização'}
            </p>
            {equipment.model && (
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                Modelo: {equipment.model}
              </p>
            )}
          </div>
        )}

        {error && <p className="mb-4 text-center text-status-error">{error}</p>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="data_inspecao" className="block text-sm font-medium mb-1">
              Data da Inspeção *
            </label>
            <input
              type="date"
              id="data_inspecao"
              {...register('data_inspecao', { required: 'Data é obrigatória' })}
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-accent-cyan/30 focus:outline-none"
            />
            {errors.data_inspecao && (
              <p className="text-sm text-status-error mt-1">{errors.data_inspecao.message}</p>
            )}
          </div>

          {type === 'extintor' && (
            <>
              <div className="mb-4">
                <label htmlFor="tipo_servico" className="block text-sm font-medium mb-1">
                  Tipo de Serviço *
                </label>
                <Controller
                  name="tipo_servico"
                  control={control}
                  rules={{ required: 'Tipo de serviço é obrigatório' }}
                  render={({ field }) => (
                    <select
                      {...field}
                      id="tipo_servico"
                      className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-accent-cyan/30 focus:outline-none"
                    >
                      <option value="Inspeção">Inspeção</option>
                      <option value="Manutenção Nível 2">Manutenção Nível 2</option>
                      <option value="Manutenção Nível 3">Manutenção Nível 3</option>
                      <option value="Substituição">Substituição</option>
                    </select>
                  )}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="aprovado_inspecao" className="block text-sm font-medium mb-1">
                  Aprovado na Inspeção? *
                </label>
                <Controller
                  name="aprovado_inspecao"
                  control={control}
                  rules={{ required: 'Aprovação é obrigatória' }}
                  render={({ field }) => (
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          {...field}
                          value="Sim"
                          className="w-4 h-4"
                        />
                        <span>Sim</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          {...field}
                          value="Não"
                          className="w-4 h-4"
                        />
                        <span>Não</span>
                      </label>
                    </div>
                  )}
                />
              </div>

              <div className="mb-4">
                <label htmlFor="observacoes_gerais" className="block text-sm font-medium mb-1">
                  Observações Gerais
                </label>
                <textarea
                  id="observacoes_gerais"
                  rows={4}
                  {...register('observacoes_gerais')}
                  placeholder="Descreva problemas encontrados, se houver..."
                  className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-accent-cyan/30 focus:outline-none"
                />
              </div>

              {planAction && (
                <div className="mb-4 p-3 bg-light-background dark:bg-dark-background rounded-lg border border-light-border dark:border-dark-border">
                  <p className="text-sm font-semibold mb-1">Plano de Ação Gerado:</p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {planAction}
                  </p>
                </div>
              )}

              {aprovado === 'Não' && (
                <PhotoUpload
                  value={photoFile}
                  onChange={setPhotoFile}
                  label="Foto de Não Conformidade"
                />
              )}
            </>
          )}

          {type === 'camara_espuma' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Tipo de Inspeção *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={foamChamberInspectionType === 'Visual Semestral'}
                    onChange={() => setFoamChamberInspectionType('Visual Semestral')}
                    className="w-4 h-4"
                  />
                  <span>Visual Semestral</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={foamChamberInspectionType === 'Funcional Anual'}
                    onChange={() => setFoamChamberInspectionType('Funcional Anual')}
                    className="w-4 h-4"
                  />
                  <span>Funcional Anual</span>
                </label>
              </div>
            </div>
          )}

          {type === 'canhao_monitor' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Tipo de Inspeção *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={cannonMonitorInspectionType === 'Visual'}
                    onChange={() => setCannonMonitorInspectionType('Visual')}
                    className="w-4 h-4"
                  />
                  <span>Visual</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={cannonMonitorInspectionType === 'Funcional'}
                    onChange={() => setCannonMonitorInspectionType('Funcional')}
                    className="w-4 h-4"
                  />
                  <span>Funcional</span>
                </label>
              </div>
            </div>
          )}

          {hasChecklist && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-light-text-primary dark:text-dark-text-primary">
                Checklist de Inspeção
              </h3>

              {type === 'chuveiro_lavaolhos' && (
                <EyewashChecklist
                  results={checklistResults}
                  onResultChange={handleChecklistChange}
                />
              )}

              {type === 'camara_espuma' && equipment && (
                <FoamChamberChecklist
                  model={equipment.model}
                  inspectionType={foamChamberInspectionType}
                  results={checklistResults}
                  onResultChange={handleChecklistChange}
                />
              )}

              {type === 'alarme' && (
                <AlarmChecklist
                  results={checklistResults}
                  onResultChange={handleChecklistChange}
                />
              )}

              {type === 'canhao_monitor' && (
                <CannonMonitorChecklist
                  inspectionType={cannonMonitorInspectionType}
                  results={checklistResults}
                  onResultChange={handleChecklistChange}
                />
              )}

              {planAction && (
                <div className="mt-4 p-3 bg-light-background dark:bg-dark-background rounded-lg border border-light-border dark:border-dark-border">
                  <p className="text-sm font-semibold mb-1">Plano de Ação Gerado:</p>
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {planAction}
                  </p>
                </div>
              )}
            </div>
          )}

          {requiresPhoto && (
            <div className="mb-4">
              {nonConformities.length > 0 ? (
                <div className="mb-2 p-3 bg-status-warning/20 text-status-warning rounded-lg">
                  <p className="text-sm font-semibold">
                    {nonConformities.length} não conformidade(s) encontrada(s). Foto obrigatória.
                  </p>
                </div>
              ) : type === 'camara_espuma' && foamChamberInspectionType === 'Funcional Anual' ? (
                <div className="mb-2 p-3 bg-light-background dark:bg-dark-background rounded-lg">
                  <p className="text-sm">
                    Para Testes Funcionais Anuais, anexe uma foto do equipamento durante o teste.
                  </p>
                </div>
              ) : null}
              <PhotoUpload
                value={photoFile}
                onChange={setPhotoFile}
                label="Foto de Evidência"
                required={requiresPhoto}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (requiresPhoto && !photoFile)}
            className="w-full p-3 bg-accent-cyan text-white font-bold rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Salvar Inspeção'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default AddInspectionPage;
