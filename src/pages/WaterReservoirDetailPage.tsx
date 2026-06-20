import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ConfirmationModal from '../components/ConfirmationModal';
import { DetailSkeleton } from '../components/skeletons';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useTranslation } from '../hooks/useTranslation';
import { useHaptics } from '../hooks/useHaptics';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import {
  getWaterReservoirById,
  getWaterReservoirInspections,
  deleteWaterReservoir,
  type WaterReservoir,
  type WaterReservoirInspection,
} from '../utils/waterReservoirOperations';

const cardStyle = {
  backgroundColor: 'rgba(26, 26, 26, 0.95)',
  borderColor: '#2A2A2A',
  borderWidth: '1px' as const,
};

const WaterReservoirDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { handleError, showSuccess } = useErrorHandler();
  const { t, currentLanguage } = useTranslation();
  const haptics = useHaptics();
  const { refreshCache } = useEquipmentCache();
  const [reservoir, setReservoir] = useState<WaterReservoir | null>(null);
  const [inspections, setInspections] = useState<WaterReservoirInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const dateLocale = currentLanguage === 'pt-BR' ? ptBR : enUS;

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [reservoirData, inspectionsData] = await Promise.all([
        getWaterReservoirById(id),
        getWaterReservoirInspections(id),
      ]);

      if (!reservoirData) {
        handleError(new Error(t('waterReservoir.notFound')), 'equipment', t('waterReservoir.notFound'));
        return;
      }

      setReservoir(reservoirData);
      setInspections(inspectionsData);
    } catch (error) {
      handleError(error, 'equipment', t('waterReservoir.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      const success = await deleteWaterReservoir(id);
      if (!success) {
        throw new Error(t('waterReservoir.deleteError'));
      }
      haptics.success();
      showSuccess(t('waterReservoir.deleteSuccess'));
      await refreshCache(true);
      navigate('/inspections/reserva_tecnica');
    } catch (error) {
      handleError(error, 'equipment', t('waterReservoir.deleteError'));
    } finally {
      setIsDeleting(false);
      setIsModalOpen(false);
    }
  };

  const getStatusBadge = (status?: string | null) => {
    if (!status) return 'bg-gray-600 text-white';
    if (status === 'OK') return 'bg-green-600 text-white';
    return 'bg-red-600 text-white';
  };

  if (loading) {
    return (
      <div className="theme-pages dark min-h-screen" style={{ backgroundColor: '#000000' }}>
        <PageHeader title={t('waterReservoir.detailTitle')} />
        <main className="p-4">
          <DetailSkeleton />
        </main>
      </div>
    );
  }

  if (!reservoir) {
    return (
      <div className="theme-pages dark min-h-screen" style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
        <PageHeader title={t('waterReservoir.detailTitle')} />
        <main className="px-4 py-10 text-center">
          <p>{t('waterReservoir.notFound')}</p>
        </main>
      </div>
    );
  }

  const lastInspection = inspections[0];

  return (
    <div className="theme-pages dark min-h-screen" style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
      <PageHeader title={reservoir.name}>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 text-red-400 hover:text-red-300 transition-colors"
          aria-label={t('common.delete')}
        >
          <Trash2 size={20} />
        </button>
      </PageHeader>

      <main className="px-4 py-4 pb-32 space-y-6">
        <div className="p-4 rounded-lg border" style={cardStyle}>
          <h2 className="font-bold text-lg mb-3">{t('waterReservoir.details')}</h2>
          <div className="space-y-2 text-sm">
            {reservoir.code && (
              <div className="flex justify-between">
                <span className="text-gray-400">{t('waterReservoir.code')}</span>
                <span>{reservoir.code}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">{t('waterReservoir.reservoirType')}</span>
              <span>{reservoir.reservoir_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('waterReservoir.productType')}</span>
              <span>{reservoir.product_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{t('waterReservoir.capacity')}</span>
              <span>{reservoir.capacity_m3} m³</span>
            </div>
            {reservoir.location && (
              <div className="flex justify-between">
                <span className="text-gray-400">{t('waterReservoir.location')}</span>
                <span className="text-right">{reservoir.location}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">{t('waterReservoir.periodicity')}</span>
              <span>{reservoir.inspection_periodicity}</span>
            </div>
            {lastInspection?.next_inspection_at && (
              <div className="flex justify-between">
                <span className="text-gray-400">{t('equipment.nextInspection')}</span>
                <span>{format(new Date(lastInspection.next_inspection_at), 'dd/MM/yyyy', { locale: dateLocale })}</span>
              </div>
            )}
            {reservoir.notes && (
              <div className="pt-2 border-t" style={{ borderColor: '#2A2A2A' }}>
                <span className="text-gray-400 block mb-1">{t('waterReservoir.notes')}</span>
                <p className="text-xs leading-relaxed">{reservoir.notes}</p>
              </div>
            )}
          </div>
        </div>

        <Link
          to={`/reservoir/${id}/inspection/new`}
          className="block w-full text-center p-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors"
        >
          {t('inspection.add')}
        </Link>

        <div>
          <h2 className="font-bold text-lg mb-2">{t('inspection.history')}</h2>
          {inspections.length === 0 ? (
            <p className="text-gray-400 text-sm">{t('inspection.noInspections')}</p>
          ) : (
            <ul className="space-y-3">
              {inspections.map((insp) => (
                <li key={insp.id} className="p-3 rounded-lg border" style={cardStyle}>
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold">
                      {format(new Date(insp.inspected_at), 'dd/MM/yyyy', { locale: dateLocale })}
                    </p>
                    {insp.overall_status && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusBadge(insp.overall_status)}`}>
                        {insp.overall_status}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-300 space-y-1">
                    {insp.level_reading && (
                      <p>{t('waterReservoir.levelReading')}: {insp.level_reading}</p>
                    )}
                    <p>{t('waterReservoir.condition')}: {insp.condition}</p>
                    <p>{t('waterReservoir.suctionClean')}: {insp.suction_clean ? t('common.yes') : t('common.no')}</p>
                    <p>{t('waterReservoir.overflowClear')}: {insp.overflow_clear ? t('common.yes') : t('common.no')}</p>
                    {insp.action_plan && (
                      <p className="text-gray-400 text-xs mt-1">{insp.action_plan}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title={t('waterReservoir.deleteConfirm')}
        message={t('waterReservoir.deleteMessage', { name: reservoir.name })}
        confirmText={t('common.delete')}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default WaterReservoirDetailPage;
