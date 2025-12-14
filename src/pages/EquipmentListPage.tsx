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
  const { getEquipmentByType, cache, refreshCache } = useEquipmentCache();
  const { handleError } = useErrorHandler();
  const { t } = useTranslation();
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [customTypeName, setCustomTypeName] = useState<string | null>(null);

  // Memoizar nome do tipo de equipamento
  const equipmentTypeName = useMemo(() => {
    if (!type) return t('equipment.title');
    
    // Para tipos customizados, busca o nome do tipo
    if (type.startsWith('custom-')) {
      // Será atualizado quando o tipo for carregado
      return type.replace('custom-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
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
  // Depende diretamente dos arrays do cache para garantir reatividade
  const memoizedEquipment = useMemo(() => {
    if (!user || !type) return [];
    // Para tipos customizados, retorna array vazio aqui (será carregado no useEffect)
    if (type.startsWith('custom-')) {
      return [];
    }
    try {
      const equipment = getEquipmentByType(type);
      // Verifica se é Promise (para tipos customizados) ou array (tipos padrão)
      if (equipment instanceof Promise) {
        return [];
      }
      // Força uma nova referência para garantir que o React detecte mudanças
      return [...equipment];
    } catch (err: any) {
      handleError(err, 'equipment', 'Falha ao buscar equipamentos');
      return [];
    }
  }, [
    user, 
    type, 
    getEquipmentByType, 
    cache.extinguishers, 
    cache.hoses, 
    cache.scbas, 
    cache.multigasDetectors, 
    cache.foamChambers, 
    cache.cannonMonitors, 
    cache.eyewashStations, 
    cache.alarmSystems, 
    cache.shelters, 
    handleError
  ]);

  useEffect(() => {
    const loadEquipment = async () => {
      if (!user || !type) {
        setLoading(false);
        return;
      }
      setLoading(true);
      
      // Para tipos customizados, busca diretamente
      if (type.startsWith('custom-')) {
        try {
          const slug = type.replace('custom-', '');
          const { getAllCustomEquipmentTypes, getAllCustomEquipment } = await import('../utils/customEquipmentOperations');
          const customTypes = await getAllCustomEquipmentTypes();
          const foundType = customTypes.find(t => t.slug === slug);
          if (foundType) {
            setCustomTypeName(foundType.name);
            const customEquipments = await getAllCustomEquipment(foundType.id);
            setEquipment(customEquipments.map((eq: any) => ({
              ...eq,
              id_equipamento: eq.id_equipamento,
              equipment_id: eq.id_equipamento,
            })));
          } else {
            setEquipment([]);
          }
        } catch (err: any) {
          handleError(err, 'equipment', 'Falha ao buscar equipamentos customizados');
          setEquipment([]);
        } finally {
          setLoading(false);
        }
      } else {
        // Para tipos padrão, usa o cache
        setEquipment([...memoizedEquipment]);
        setLoading(false);
      }
    };

    loadEquipment();
  }, [user, type, memoizedEquipment, handleError]);

  // Força atualização quando a página é montada (útil após navegação)
  useEffect(() => {
    if (user && type) {
      // Pequeno delay para garantir que a navegação foi concluída
      const timer = setTimeout(() => {
        refreshCache();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [user, type]); // Não inclui refreshCache para evitar loops

  // Atualiza a lista quando a página recebe foco (útil após exclusão)
  useEffect(() => {
    const handleFocus = () => {
      refreshCache();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshCache]);

  return (
    <div className="min-h-screen relative" style={{ zIndex: 10, position: 'relative' }}>
      <PageHeader title={customTypeName || equipmentTypeName} />
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
