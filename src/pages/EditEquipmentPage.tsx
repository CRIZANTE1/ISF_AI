import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import ExtinguisherForm from '../components/forms/ExtinguisherForm';
import HoseForm from '../components/forms/HoseForm';
import ScbaForm from '../components/forms/ScbaForm';
import { TablesUpdate, Tables } from '../types/supabase';
import Skeleton from '../components/Skeleton';

type EditEquipmentFormData = Tables<'equipment'>;

const EditEquipmentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [equipmentType, setEquipmentType] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<EditEquipmentFormData>();

  useEffect(() => {
    const fetchEquipment = async () => {
      if (!id) return;
      setLoadingData(true);
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) {
        setError('Equipamento não encontrado.');
        console.error(error);
      } else {
        reset(data);
        setEquipmentType(data.type);
      }
      setLoadingData(false);
    };
    fetchEquipment();
  }, [id, reset]);

  const onSubmit = async (formData: EditEquipmentFormData) => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const { created_at, user_id, ...dataToUpdate } = formData;

    const { error } = await supabase
      .from('equipment')
      .update(dataToUpdate as TablesUpdate<'equipment'>)
      .eq('id', id);

    if (error) {
      setError('Falha ao atualizar equipamento.');
      console.error(error);
    } else {
      navigate(`/equipment/${id}`);
    }
    setLoading(false);
  };

  const renderSpecificForm = () => {
    switch (equipmentType) {
      case 'extintor':
        return <ExtinguisherForm register={register} errors={errors} />;
      case 'mangueira':
        return <HoseForm register={register} />;
      case 'scba':
        return <ScbaForm register={register} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Editar Equipamento" />
      <main className="p-4">
        {loadingData ? (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-4">
                    <label htmlFor="equipment_id" className="block text-sm font-medium mb-1">ID do Equipamento</label>
                    <input
                    id="equipment_id"
                    {...register('equipment_id', { required: 'ID é obrigatório' })}
                    className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-brand-green focus:outline-none"
                    />
                    {errors.equipment_id && <p className="text-sm text-status-error mt-1">{errors.equipment_id.message}</p>}
                </div>
                <div className="mb-4">
                    <label htmlFor="localizacao" className="block text-sm font-medium mb-1">Localização</label>
                    <input
                    id="localizacao"
                    {...register('localizacao')}
                    className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-brand-green focus:outline-none"
                    />
                </div>
                
                {renderSpecificForm()}

                {error && <p className="mb-4 text-center text-status-error">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full p-3 bg-brand-green text-white font-bold rounded-lg hover:bg-green-600 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                >
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </form>
        )}
      </main>
    </div>
  );
};

export default EditEquipmentPage;
