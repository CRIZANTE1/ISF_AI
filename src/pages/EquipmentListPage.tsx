import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import FloatingActionButton from '../components/FloatingActionButton';
import Skeleton from '../components/Skeleton';
import { ChevronRight } from 'lucide-react';
import { getAllExtinguishers } from '../utils/extinguisherOperations';
import { getAllHoses } from '../utils/hoseOperations';
import { getAllSCBAs } from '../utils/scbaOperations';
import { getAllMultigasDetectors } from '../utils/multigasOperations';
import { getAllFoamChambers } from '../utils/foamChamberOperations';
import { getAllCannonMonitors } from '../utils/cannonMonitorOperations';
import { getAllEyewashStations } from '../utils/eyewashOperations';
import { getAllAlarmSystems } from '../utils/alarmOperations';
import { getAllShelters } from '../utils/shelterOperations';

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
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const equipmentTypeName = type ? type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ') : 'Equipamentos';

  useEffect(() => {
    const fetchEquipment = async () => {
      if (!user || !type) return;
      setLoading(true);
      setError(null);
      
      try {
        let data: EquipmentItem[] = [];
        
        switch (type) {
          case 'extintor':
            data = await getAllExtinguishers();
            break;
          case 'mangueira':
            data = await getAllHoses();
            break;
          case 'scba':
            data = await getAllSCBAs();
            break;
          case 'multigas':
            data = await getAllMultigasDetectors();
            break;
          case 'camara_espuma':
            data = await getAllFoamChambers();
            break;
          case 'canhao_monitor':
            data = await getAllCannonMonitors();
            break;
          case 'chuveiro_lavaolhos':
            data = await getAllEyewashStations();
            break;
          case 'alarme':
            data = await getAllAlarmSystems();
            break;
          case 'abrigo':
            data = await getAllShelters();
            break;
          default:
            // Fallback para tabela genérica equipment
            const { data: equipmentData, error: equipmentError } = await supabase
              .from('equipment')
              .select('*')
              .eq('user_id', user.id)
              .eq('equipment_type', type);
            if (equipmentError) throw equipmentError;
            data = equipmentData || [];
        }
        
        setEquipment(data);
      } catch (err: any) {
        setError('Falha ao buscar equipamentos.');
        console.error(err);
      } finally {
        setLoading(false);
      }
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
            {equipment.map((item) => {
              const itemId = item.equipment_id || item.id_mangueira || item.numero_serie_equipamento || 
                           item.id_equipamento || item.id_camara || item.id_sistema || item.id_abrigo || 
                           item.numero_identificacao || String(item.id);
              const location = item.localizacao || '';
              
              return (
                <li key={itemId}>
                  <Link to={`/equipment/${type}/${itemId}`} className="flex items-center justify-between p-4 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border hover:border-brand-green transition-colors">
                    <div>
                      <p className="font-semibold">{itemId}</p>
                      {location && <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{location}</p>}
                    </div>
                    <ChevronRight size={20} className="text-light-text-secondary dark:text-dark-text-secondary" />
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
