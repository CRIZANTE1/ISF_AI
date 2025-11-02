import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Tables } from '../types/supabase';
import PageHeader from '../components/PageHeader';
import FloatingActionButton from '../components/FloatingActionButton';
import Skeleton from '../components/Skeleton';
import { ChevronRight } from 'lucide-react';

type Equipment = Tables<'equipment'>;

const EquipmentListPage = () => {
  const { type } = useParams<{ type: string }>();
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const equipmentTypeName = type ? type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ') : 'Equipamentos';

  useEffect(() => {
    const fetchEquipment = async () => {
      if (!user || !type) return;
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('user_id', user.id)
        .eq('equipment_type', type);
      
      if (error) {
        setError('Falha ao buscar equipamentos.');
        console.error(error);
      } else {
        setEquipment(data);
      }
      setLoading(false);
    };

    fetchEquipment();
  }, [user, type]);

  return (
    <div className="min-h-screen">
      <PageHeader title={equipmentTypeName} />
      <main className="p-4">
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        )}
        {error && <p className="text-center text-status-error">{error}</p>}
        {!loading && !error && equipment.length === 0 && (
          <div className="text-center py-10">
            <p className="text-light-text-secondary dark:text-dark-text-secondary">Nenhum equipamento cadastrado.</p>
          </div>
        )}
        {!loading && !error && equipment.length > 0 && (
          <ul className="space-y-3">
            {equipment.map((item) => (
              <li key={item.id}>
                <Link to={`/equipment/${item.id}`} className="flex items-center justify-between p-4 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border hover:border-brand-green transition-colors">
                  <div>
                    <p className="font-semibold">{item.equipment_id}</p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{item.localizacao}</p>
                  </div>
                  <ChevronRight size={20} className="text-light-text-secondary dark:text-dark-text-secondary" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <FloatingActionButton to={`/inspections/${type}/new`} />
    </div>
  );
};

export default EquipmentListPage;
