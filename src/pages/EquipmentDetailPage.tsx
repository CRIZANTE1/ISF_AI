import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Tables } from '../types/supabase';
import PageHeader from '../components/PageHeader';
import Skeleton from '../components/Skeleton';
import ConfirmationModal from '../components/ConfirmationModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Edit } from 'lucide-react';

type Equipment = Tables<'equipment'>;
type Inspection = Tables<'inspections'>;

const EquipmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for deletion modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'equipment' | 'inspection'; id: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const equipmentId = parseInt(id, 10);
      if (isNaN(equipmentId)) {
        throw new Error('ID inválido');
      }

      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', equipmentId)
        .single();

      if (equipmentError) throw equipmentError;
      setEquipment(equipmentData);

      const { data: inspectionsData, error: inspectionsError } = await supabase
        .from('inspections')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('inspection_date', { ascending: false });

      if (inspectionsError) throw inspectionsError;
      setInspections(inspectionsData);

    } catch (err: any) {
      setError('Falha ao buscar detalhes do equipamento.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleDeleteClick = (type: 'equipment' | 'inspection', id: number) => {
    setItemToDelete({ type, id });
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setError(null);

    try {
      if (itemToDelete.type === 'equipment') {
        const { error } = await supabase.from('equipment').delete().eq('id', itemToDelete.id);
        if (error) throw error;
        // Navigate back to the list of the same type
        navigate(`/inspections/${equipment?.type}`);
      } else {
        const { error } = await supabase.from('inspections').delete().eq('id', itemToDelete.id);
        if (error) throw error;
        // Refresh inspections list
        setInspections(inspections.filter(insp => insp.id !== itemToDelete.id));
      }
    } catch (err) {
      setError(`Falha ao excluir o item. Tente novamente.`);
      console.error(err);
    } finally {
      setIsDeleting(false);
      setIsModalOpen(false);
      setItemToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-status-success/20 text-status-success';
      case 'reprovado': return 'bg-status-error/20 text-status-error';
      case 'pendente': return 'bg-status-warning/20 text-status-warning';
      default: return 'bg-gray-200 dark:bg-gray-700';
    }
  };

  const modalTitle = itemToDelete?.type === 'equipment' ? 'Excluir Equipamento' : 'Excluir Inspeção';
  const modalMessage = `Você tem certeza que deseja excluir este item? Esta ação é irreversível e todos os dados associados serão perdidos.`;

  return (
    <div className="min-h-screen">
      <PageHeader title={loading ? 'Carregando...' : equipment?.equipment_id ?? 'Detalhes'}>
        {!loading && equipment && (
            <div className="flex items-center gap-2">
                <Link to={`/equipment/${equipment.id}/edit`} className="p-2 text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-green transition-colors">
                    <Edit size={20} />
                </Link>
                <button onClick={() => handleDeleteClick('equipment', equipment.id)} className="p-2 text-light-text-secondary dark:text-dark-text-secondary hover:text-status-error transition-colors">
                    <Trash2 size={20} />
                </button>
            </div>
        )}
      </PageHeader>
      <main className="p-4">
        {loading && <Skeleton className="h-48 w-full" />}
        {error && <p className="mb-4 text-center text-status-error">{error}</p>}
        {!loading && equipment && (
          <>
            <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border mb-6">
              <h2 className="font-bold text-lg mb-2">Detalhes</h2>
              <p><span className="font-semibold">Localização:</span> {equipment.localizacao}</p>
              <p><span className="font-semibold">Tipo:</span> {equipment.type}</p>
              <p><span className="font-semibold">Status:</span> {equipment.status}</p>
              {equipment.specifications && (
                <div className="mt-2 text-sm">
                  <h3 className="font-semibold mb-1">Especificações:</h3>
                  <pre className="bg-light-background dark:bg-dark-background p-2 rounded overflow-x-auto text-xs">
                    {JSON.stringify(equipment.specifications, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mb-6">
              <Link
                to={`/equipment/${id}/inspections/new`}
                className="w-full text-center block p-3 bg-brand-green text-white font-bold rounded-lg hover:bg-green-600 transition-colors"
              >
                Registrar Nova Inspeção
              </Link>
            </div>

            <div>
              <h2 className="font-bold text-lg mb-2">Histórico de Inspeções</h2>
              {inspections.length > 0 ? (
                <ul className="space-y-3">
                  {inspections.map(insp => (
                    <li key={insp.id} className="p-3 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border flex justify-between items-start gap-4">
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <p className="font-semibold">{format(new Date(insp.inspection_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusBadge(insp.status)}`}>
                            {insp.status}
                          </span>
                        </div>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">{insp.notes}</p>
                      </div>
                      <button onClick={() => handleDeleteClick('inspection', insp.id)} className="p-1 text-light-text-secondary dark:text-dark-text-secondary hover:text-status-error transition-colors flex-shrink-0">
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary py-4">Nenhuma inspeção registrada.</p>
              )}
            </div>
          </>
        )}
      </main>
      <ConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={modalTitle}
        message={modalMessage}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EquipmentDetailPage;
