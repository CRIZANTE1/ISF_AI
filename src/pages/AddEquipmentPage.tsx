import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import ExtinguisherForm from '../components/forms/ExtinguisherForm';
import HoseForm from '../components/forms/HoseForm';
import ScbaForm from '../components/forms/ScbaForm';
import { TablesInsert } from '../types/supabase';

export type AddEquipmentFormData = TablesInsert<'equipment'>;

const AddEquipmentPage = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<AddEquipmentFormData>();

  const equipmentTypeName = type ? type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ') : 'Equipamento';

  const onSubmit = async (formData: AddEquipmentFormData) => {
    if (!user || !type) return;
    setLoading(true);
    setError(null);

    const dataToInsert: TablesInsert<'equipment'> = {
      ...formData,
      user_id: user.id,
      type: type,
      status: 'ok', // Default status
    };

    const { error } = await supabase.from('equipment').insert(dataToInsert);

    if (error) {
      setError('Falha ao cadastrar equipamento. Verifique se o ID já existe.');
      console.error(error);
    } else {
      navigate(`/inspections/${type}`);
    }
    setLoading(false);
  };

  const renderSpecificForm = () => {
    switch (type) {
      case 'extintor':
        return <ExtinguisherForm register={register} errors={errors} />;
      case 'mangueira':
        return <HoseForm register={register} />;
      case 'scba':
        return <ScbaForm register={register} />;
      default:
        return <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Campos específicos para este tipo de equipamento ainda não foram implementados.</p>;
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader title={`Adicionar ${equipmentTypeName}`} />
      <main className="p-4">
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
            {loading ? 'Salvando...' : 'Salvar Equipamento'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default AddEquipmentPage;
