import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { TablesInsert } from '../types/supabase';

type AddInspectionFormData = Omit<TablesInsert<'inspections'>, 'user_id' | 'equipment_id'>;

const AddInspectionPage = () => {
  const { id: equipmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<AddInspectionFormData>();

  const onSubmit = async (formData: AddInspectionFormData) => {
    if (!user || !equipmentId) return;
    setLoading(true);
    setError(null);

    const dataToInsert: TablesInsert<'inspections'> = {
      ...formData,
      user_id: user.id,
      equipment_id: parseInt(equipmentId, 10),
    };

    const { error } = await supabase.from('inspections').insert(dataToInsert);

    if (error) {
      setError('Falha ao registrar inspeção.');
      console.error(error);
    } else {
      navigate(`/equipment/${equipmentId}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Registrar Inspeção" />
      <main className="p-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
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
          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium mb-1">Observações</label>
            <textarea
              id="notes"
              rows={4}
              {...register('notes')}
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-brand-green focus:outline-none"
            />
          </div>

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
