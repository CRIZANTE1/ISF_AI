import { useForm, Controller } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { TablesInsert, Tables } from '../types/supabase';
import { 
  generateActionPlan, 
  calculateNextDates, 
  formatDate,
  type InspectionRecord,
  type EquipmentDates
} from '../utils/extinguisherOperations';

type AddInspectionFormData = Omit<TablesInsert<'inspections'>, 'user_id' | 'equipment_id'> & {
  tipo_servico?: string;
  aprovado_inspecao?: string;
  observacoes_gerais?: string;
};

type Equipment = Tables<'equipment'>;

const AddInspectionPage = () => {
  const { id: equipmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [planAction, setPlanAction] = useState<string>('');
  
  const { register, handleSubmit, formState: { errors }, watch, control } = useForm<AddInspectionFormData>({
    defaultValues: {
      tipo_servico: 'Inspeção',
      aprovado_inspecao: 'Sim',
      inspection_date: new Date().toISOString().split('T')[0],
    }
  });

  // Observa mudanças nos campos para gerar plano de ação
  const aprovado = watch('aprovado_inspecao');
  const observacoes = watch('observacoes_gerais');

  useEffect(() => {
    if (aprovado && observacoes !== undefined) {
      const record: InspectionRecord = {
        aprovado_inspecao: aprovado,
        observacoes_gerais: observacoes || ''
      };
      const plan = generateActionPlan(record);
      setPlanAction(plan);
    }
  }, [aprovado, observacoes]);

  // Busca informações do equipamento
  useEffect(() => {
    const fetchEquipment = async () => {
      if (!equipmentId) return;
      setLoadingEquipment(true);
      try {
        const { data, error } = await supabase
          .from('equipment')
          .select('*')
          .eq('id', parseInt(equipmentId, 10))
          .single();

        if (error) throw error;
        setEquipment(data);
      } catch (err: any) {
        console.error('Erro ao buscar equipamento:', err);
        setError('Falha ao buscar informações do equipamento.');
      } finally {
        setLoadingEquipment(false);
      }
    };

    fetchEquipment();
  }, [equipmentId]);

  const onSubmit = async (formData: AddInspectionFormData) => {
    if (!user || !equipmentId || !equipment) return;
    setLoading(true);
    setError(null);

    try {
      // Prepara dados da inspeção
      const statusValue = formData.aprovado_inspecao === 'Sim' ? 'aprovado' : 
                          formData.aprovado_inspecao === 'Não' ? 'reprovado' : 
                          formData.status || 'pendente';
      
      const dataToInsert: TablesInsert<'inspections'> = {
        status: statusValue as 'aprovado' | 'reprovado' | 'pendente',
        notes: formData.observacoes_gerais || formData.notes || null,
        inspection_date: formData.inspection_date || new Date().toISOString(),
        user_id: user.id,
        equipment_id: parseInt(equipmentId, 10),
      };

      // Insere inspeção
      const { error: inspectionError } = await supabase
        .from('inspections')
        .insert(dataToInsert);

      if (inspectionError) throw inspectionError;

      // Se for extintor, atualiza datas do equipamento
      if (equipment.type === 'extintor' && formData.tipo_servico) {
        const serviceDate = formData.inspection_date || new Date().toISOString().split('T')[0];
        
        // Busca últimas datas do equipamento (das specifications ou campos diretos)
        const existingDates: EquipmentDates = {};
        if (equipment.proxima_inspecao) {
          existingDates.data_proxima_inspecao = equipment.proxima_inspecao;
        }
        if (equipment.specifications && typeof equipment.specifications === 'object') {
          const specs = equipment.specifications as any;
          if (specs.data_proxima_manutencao_2_nivel) {
            existingDates.data_proxima_manutencao_2_nivel = specs.data_proxima_manutencao_2_nivel;
          }
          if (specs.data_proxima_manutencao_3_nivel) {
            existingDates.data_proxima_manutencao_3_nivel = specs.data_proxima_manutencao_3_nivel;
          }
          if (specs.data_ultimo_ensaio_hidrostatico) {
            existingDates.data_ultimo_ensaio_hidrostatico = specs.data_ultimo_ensaio_hidrostatico;
          }
        }

        // Calcula novas datas
        const newDates = calculateNextDates(
          serviceDate,
          formData.tipo_servico,
          existingDates
        );

        // Atualiza equipamento com novas datas e plano de ação
        const updatedSpecs = {
          ...(equipment.specifications && typeof equipment.specifications === 'object' 
            ? equipment.specifications 
            : {}),
          tipo_servico: formData.tipo_servico,
          data_servico: serviceDate,
          aprovado_inspecao: formData.aprovado_inspecao,
          observacoes_gerais: formData.observacoes_gerais,
          plano_de_acao: planAction,
          ...newDates
        };

        const { error: updateError } = await supabase
          .from('equipment')
          .update({
            proxima_inspecao: newDates.data_proxima_inspecao || equipment.proxima_inspecao,
            specifications: updatedSpecs,
          })
          .eq('id', parseInt(equipmentId, 10));

        if (updateError) throw updateError;
      }

      navigate(`/equipment/${equipmentId}`);
    } catch (err: any) {
      setError('Falha ao registrar inspeção.');
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

  const isExtinguisher = equipment?.type === 'extintor';

  return (
    <div className="min-h-screen">
      <PageHeader title="Registrar Inspeção" />
      <main className="p-4">
        {equipment && (
          <div className="mb-4 p-3 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border">
            <p className="font-semibold text-sm">{equipment.equipment_id}</p>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
              {equipment.localizacao || 'Sem localização'}
            </p>
            {equipment.proxima_inspecao && (
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                Próxima inspeção: {formatDate(equipment.proxima_inspecao)}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {isExtinguisher && (
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
                      className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-brand-green focus:outline-none"
                    >
                      <option value="Inspeção">Inspeção</option>
                      <option value="Manutenção Nível 2">Manutenção Nível 2</option>
                      <option value="Manutenção Nível 3">Manutenção Nível 3</option>
                      <option value="Substituição">Substituição</option>
                    </select>
                  )}
                />
                {errors.tipo_servico && (
                  <p className="text-sm text-status-error mt-1">{errors.tipo_servico.message}</p>
                )}
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
                {errors.aprovado_inspecao && (
                  <p className="text-sm text-status-error mt-1">{errors.aprovado_inspecao.message}</p>
                )}
              </div>
            </>
          )}

          <div className="mb-4">
            <label htmlFor="inspection_date" className="block text-sm font-medium mb-1">
              Data da Inspeção *
            </label>
            <input
              type="date"
              id="inspection_date"
              {...register('inspection_date', { required: 'Data é obrigatória' })}
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-brand-green focus:outline-none"
            />
            {errors.inspection_date && (
              <p className="text-sm text-status-error mt-1">{errors.inspection_date.message}</p>
            )}
          </div>

          {!isExtinguisher && (
            <div className="mb-4">
              <label htmlFor="status" className="block text-sm font-medium mb-1">Status *</label>
              <select
                id="status"
                {...register('status', { required: 'Status é obrigatório' })}
                className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-brand-green focus:outline-none"
              >
                <option value="aprovado">Aprovado</option>
                <option value="reprovado">Reprovado</option>
                <option value="pendente">Pendente</option>
              </select>
              {errors.status && <p className="text-sm text-status-error mt-1">{errors.status.message}</p>}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="observacoes_gerais" className="block text-sm font-medium mb-1">
              {isExtinguisher ? 'Observações Gerais' : 'Observações'}
            </label>
            <textarea
              id="observacoes_gerais"
              rows={4}
              {...register(isExtinguisher ? 'observacoes_gerais' : 'notes')}
              placeholder={isExtinguisher ? 'Descreva problemas encontrados, se houver...' : 'Observações...'}
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-brand-green focus:outline-none"
            />
          </div>

          {isExtinguisher && planAction && (
            <div className="mb-4 p-3 bg-light-background dark:bg-dark-background rounded-lg border border-light-border dark:border-dark-border">
              <p className="text-sm font-semibold mb-1">Plano de Ação Gerado:</p>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {planAction}
              </p>
            </div>
          )}

          {error && <p className="mb-4 text-center text-status-error">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-brand-green text-white font-bold rounded-lg hover:bg-green-600 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Salvar Inspeção'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default AddInspectionPage;
