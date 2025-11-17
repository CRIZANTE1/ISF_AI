import { useEffect, useState, useMemo, memo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import PageHeader from '../components/PageHeader';
import FloatingActionButton from '../components/FloatingActionButton';
import Skeleton from '../components/Skeleton';
import InstructionsPanel from '../components/InstructionsPanel';
import { ChevronRight, QrCode } from 'lucide-react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getEquipmentByType, cache } = useEquipmentCache();
  const { handleError } = useErrorHandler();
  const { t } = useTranslation();
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoizar nome do tipo de equipamento
  const equipmentTypeName = useMemo(() => {
    if (!type) return t('equipment.title');
    const typeMap: Record<string, string> = {
      extintor: t('equipment.extinguisher'),
      mangueira: t('equipment.hose'),
      camara_espuma: t('equipment.foamChamber'),
      canhao_monitor: t('equipment.cannonMonitor'),
      chuveiro_lavaolhos: t('equipment.eyewash'),
      alarme: t('equipment.alarm'),
      multigas: t('equipment.multigas'),
      scba: t('equipment.scba'),
      abrigo: t('equipment.shelter'),
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  }, [type, t]);

  // Memoizar equipamentos para evitar recálculos
  const memoizedEquipment = useMemo(() => {
    if (!user || !type) return [];
    try {
      return getEquipmentByType(type);
    } catch (err: any) {
      handleError(err, 'equipment', 'Falha ao buscar equipamentos');
      return [];
    }
  }, [user, type, getEquipmentByType, cache, handleError]);

  useEffect(() => {
    if (!user || !type) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setEquipment(memoizedEquipment);
    setLoading(false);
  }, [user, type, memoizedEquipment]);

  return (
    <div className="min-h-screen relative" style={{ zIndex: 10, position: 'relative' }}>
      <PageHeader title={equipmentTypeName} />
      <main className="px-ios-4 py-ios-4 pb-32 relative" style={{ zIndex: 10, position: 'relative', backgroundColor: '#000000' }}>
        {type && <InstructionsPanel equipmentType={type} />}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <button
            onClick={() => navigate(`/inspections/${type}/qr`)}
            className="w-full p-4 rounded-lg border-2 border-dashed flex items-center justify-center space-x-3 hover:border-white/50 transition-colors"
            style={{ 
              backgroundColor: 'rgba(26, 26, 26, 0.95)', 
              borderColor: '#2A2A2A',
              color: '#FFFFFF'
            }}
          >
            <QrCode size={24} />
            <span className="font-semibold">{t('qr.scan')}</span>
          </button>
        </motion.div>
        {loading && (
          <div className="space-y-3 relative" style={{ zIndex: 10, position: 'relative' }}>
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        )}
        {!loading && equipment.length === 0 && (
          <div className="text-center py-10 relative" style={{ zIndex: 10, position: 'relative' }}>
            <p className="text-light-text-secondary dark:text-dark-text-secondary" style={{ color: '#FFFFFF' }}>{t('equipment.noEquipment')}</p>
          </div>
        )}
        {!loading && equipment.length > 0 && (
          <EquipmentListMemoized equipment={equipment} type={type || ''} />
        )}
      </main>
      {type && <FloatingActionButton to={`/inspections/${type}/new`} />}
    </div>
  );
};

// Componente memoizado para itens de equipamento
const EquipmentListItem = memo(({ item, type, index }: { item: EquipmentItem; type: string; index: number }) => {
  const itemId = item.equipment_id || item.id_mangueira || item.numero_serie_equipamento || 
               item.id_equipamento || item.id_camara || item.id_sistema || item.id_abrigo || 
               item.numero_identificacao || String(item.id);
  const location = item.localizacao || '';
  
  return (
    <motion.li 
      key={itemId} 
      className="relative" 
      style={{ zIndex: 10, position: 'relative' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.03,
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      <Link to={`/equipment/${type}/${itemId}`} className="flex items-center justify-between p-4 bg-light-surface dark:bg-dark-surface rounded-lg border hover:border-white/30 transition-colors relative" style={{ zIndex: 10, position: 'relative', backgroundColor: 'rgba(26, 26, 26, 0.95)', borderColor: '#2A2A2A', borderWidth: '1px' }}>
        <div>
          <p className="font-semibold" style={{ color: '#FFFFFF' }}>{itemId}</p>
          {location && <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary" style={{ color: '#B0B0B0' }}>{location}</p>}
        </div>
        <ChevronRight size={20} className="text-light-text-secondary dark:text-dark-text-secondary" style={{ color: '#B0B0B0' }} />
      </Link>
    </motion.li>
  );
});

EquipmentListItem.displayName = 'EquipmentListItem';

// Componente memoizado para lista de equipamentos
const EquipmentListMemoized = memo(({ equipment, type }: { equipment: EquipmentItem[]; type: string }) => {
  return (
    <ul className="space-y-3 relative" style={{ zIndex: 10, position: 'relative' }}>
      {equipment.map((item, index) => (
        <EquipmentListItem key={item.id || index} item={item} type={type} index={index} />
      ))}
    </ul>
  );
});

EquipmentListMemoized.displayName = 'EquipmentListMemoized';

export default EquipmentListPage;
