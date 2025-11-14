import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import PageHeader from '../components/PageHeader';
import FloatingActionButton from '../components/FloatingActionButton';
import Skeleton from '../components/Skeleton';
import InstructionsPanel from '../components/InstructionsPanel';
import { ChevronRight } from 'lucide-react';

type EquipmentItem = {
  id: number | string;
  equipment_id?: string;
  id_mangueira?: string;
  numero_serie_equipamento?: string;
  id_equipamento?: string;
  id_camara?: string;
  id_sistema?: string;
  id_abrigo?: string;
  numero_identificacao?: string;
  localizacao?: string;
};

const EquipmentListPage = () => {
  const { type } = useParams<{ type: string }>();
  const { user } = useAuth();
  const { getEquipmentByType, cache } = useEquipmentCache();
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const equipmentTypeName = type ? type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ') : 'Equipamentos';

  useEffect(() => {
    const fetchEquipment = () => {
      if (!user || !type) return;
      setLoading(true);
      setError(null);
      
      try {
        // Usar dados do cache em vez de fazer novas chamadas
        const data = getEquipmentByType(type);
        setEquipment(data);
      } catch (err: any) {
        setError('Falha ao buscar equipamentos.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [user, type, getEquipmentByType, cache]);

  return (
    <div className="min-h-screen relative" style={{ zIndex: 10, position: 'relative' }}>
      <PageHeader title={equipmentTypeName} />
      <main className="px-ios-4 py-ios-4 pb-32 relative" style={{ zIndex: 10, position: 'relative', backgroundColor: '#000000' }}>
        {type && <InstructionsPanel equipmentType={type} />}
        {loading && (
          <div className="space-y-3 relative" style={{ zIndex: 10, position: 'relative' }}>
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        )}
        {error && <p className="text-center text-status-error relative" style={{ zIndex: 10, position: 'relative' }}>{error}</p>}
        {!loading && !error && equipment.length === 0 && (
          <div className="text-center py-10 relative" style={{ zIndex: 10, position: 'relative' }}>
            <p className="text-light-text-secondary dark:text-dark-text-secondary" style={{ color: '#FFFFFF' }}>Nenhum equipamento cadastrado.</p>
          </div>
        )}
        {!loading && !error && equipment.length > 0 && (
          <ul className="space-y-3 relative" style={{ zIndex: 10, position: 'relative' }}>
            {equipment.map((item) => {
              const itemId = item.equipment_id || item.id_mangueira || item.numero_serie_equipamento || 
                           item.id_equipamento || item.id_camara || item.id_sistema || item.id_abrigo || 
                           item.numero_identificacao || String(item.id);
              const location = item.localizacao || '';
              
              return (
                <li key={itemId} className="relative" style={{ zIndex: 10, position: 'relative' }}>
                  <Link to={`/equipment/${type}/${itemId}`} className="flex items-center justify-between p-4 bg-light-surface dark:bg-dark-surface rounded-lg border hover:border-white/30 transition-colors relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px' }}>
                    <div>
                      <p className="font-semibold" style={{ color: '#FFFFFF' }}>{itemId}</p>
                      {location && <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary" style={{ color: '#B0B0B0' }}>{location}</p>}
                    </div>
                    <ChevronRight size={20} className="text-light-text-secondary dark:text-dark-text-secondary" style={{ color: '#B0B0B0' }} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <FloatingActionButton to={`/inspections/${type}/new`} />
    </div>
  );
};

export default EquipmentListPage;
