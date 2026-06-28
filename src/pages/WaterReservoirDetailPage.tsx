import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { Trash2, FileText } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ConfirmationModal from '../components/ConfirmationModal';
import { DetailSkeleton, IconSkeleton } from '../components/skeletons';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useTranslation } from '../hooks/useTranslation';
import { useHaptics } from '../hooks/useHaptics';
import { useAuth } from '../contexts/AuthContext';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import {
  getWaterReservoirById,
  getWaterReservoirInspections,
  deleteWaterReservoir,
  type WaterReservoir,
  type WaterReservoirInspection,
} from '../utils/waterReservoirOperations';
import {
  generateInspectionReport,
  generateMultipleInspectionReport,
  savePdfToDevice,
  mapWaterReservoirInspectionForPdf,
  type EquipmentData,
  type InspectionData,
} from '../utils/pdfReportGenerator';

const cardStyle = {
  backgroundColor: 'rgba(26, 26, 26, 0.95)',
  borderColor: '#2A2A2A',
  borderWidth: '1px' as const,
};

const WaterReservoirDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { handleError, showSuccess } = useErrorHandler();
  const { t, currentLanguage } = useTranslation();
  const haptics = useHaptics();
  const { refreshTypes } = useEquipmentCache();
  const [reservoir, setReservoir] = useState<WaterReservoir | null>(null);
  const [inspections, setInspections] = useState<WaterReservoirInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [showMultipleReportModal, setShowMultipleReportModal] = useState(false);
  const [selectedInspections, setSelectedInspections] = useState<Set<string>>(new Set());
  const [generatingMultiplePdf, setGeneratingMultiplePdf] = useState(false);

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

  const buildEquipmentData = (): EquipmentData | null => {
    if (!reservoir) return null;
    return {
      ...reservoir,
      id: reservoir.id,
      name: reservoir.name,
      type: 'reserva_tecnica',
      location: reservoir.location || undefined,
    } as EquipmentData;
  };

  const handleGenerateReport = async (inspectionId: string) => {
    const equipmentData = buildEquipmentData();
    if (!equipmentData || !user) return;

    setGeneratingPdf(inspectionId);
    try {
      const inspection = inspections.find((insp) => insp.id === inspectionId);
      if (!inspection) throw new Error('Inspeção não encontrada');

      const reportData = {
        equipment: equipmentData,
        inspection: mapWaterReservoirInspectionForPdf(
          inspection as unknown as Record<string, unknown>
        ),
        responsibleName: profile?.full_name || inspection.inspector_name || user.email || undefined,
      };

      const pdfBlob = await generateInspectionReport(reportData);
      const dateStr = format(new Date(inspection.inspected_at), 'yyyy-MM-dd');
      const filename = `Relatorio_Inspecao_${reservoir?.name}_${dateStr}.pdf`;
      await savePdfToDevice(pdfBlob, filename);
      showSuccess(t('help.equipmentList.reportSuccess'));
    } catch (error) {
      handleError(error, 'equipment', t('help.equipmentList.reportError'));
    } finally {
      setGeneratingPdf(null);
    }
  };

  const handleToggleInspection = (inspectionId: string) => {
    const next = new Set(selectedInspections);
    if (next.has(inspectionId)) next.delete(inspectionId);
    else next.add(inspectionId);
    setSelectedInspections(next);
  };

  const handleSelectAll = () => {
    if (selectedInspections.size === inspections.length) {
      setSelectedInspections(new Set());
    } else {
      setSelectedInspections(new Set(inspections.map((insp) => insp.id)));
    }
  };

  const handleGenerateMultipleReport = async () => {
    const equipmentData = buildEquipmentData();
    if (!equipmentData || !user || selectedInspections.size === 0) return;

    setGeneratingMultiplePdf(true);
    try {
      const inspectionDataList: InspectionData[] = inspections
        .filter((insp) => selectedInspections.has(insp.id))
        .map((insp) =>
          mapWaterReservoirInspectionForPdf(insp as unknown as Record<string, unknown>)
        );

      if (inspectionDataList.length === 0) {
        throw new Error('Nenhuma inspeção válida selecionada');
      }

      inspectionDataList.sort(
        (a, b) => new Date(a.data_inspecao).getTime() - new Date(b.data_inspecao).getTime()
      );

      const pdfBlob = await generateMultipleInspectionReport({
        equipment: equipmentData,
        inspections: inspectionDataList,
        responsibleName: profile?.full_name || user.email || undefined,
      });

      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const filename = `Relatorio_Multiplas_Inspecoes_${reservoir?.name}_${dateStr}.pdf`;
      await savePdfToDevice(pdfBlob, filename);

      setShowMultipleReportModal(false);
      setSelectedInspections(new Set());
      showSuccess(t('help.equipmentList.reportSuccess'));
    } catch (error) {
      handleError(error, 'equipment', t('help.equipmentList.reportError'));
    } finally {
      setGeneratingMultiplePdf(false);
    }
  };

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
      await refreshTypes(['reserva_tecnica'], true);
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

        {inspections.length > 0 && (
          <button
            onClick={() => setShowMultipleReportModal(true)}
            className="w-full p-3 rounded-lg border flex items-center justify-center space-x-2 hover:border-white/50 transition-colors"
            style={{ ...cardStyle, color: '#FFFFFF' }}
          >
            <FileText size={20} />
            <span className="font-semibold">{t('help.equipmentList.generateReport')}</span>
          </button>
        )}

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
                    <div className="flex items-center gap-2">
                      {insp.overall_status && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusBadge(insp.overall_status)}`}>
                          {insp.overall_status}
                        </span>
                      )}
                      <button
                        onClick={() => handleGenerateReport(insp.id)}
                        disabled={generatingPdf === insp.id}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                        aria-label={t('help.equipmentList.generateReport')}
                      >
                        {generatingPdf === insp.id ? (
                          <IconSkeleton size={18} />
                        ) : (
                          <FileText size={18} />
                        )}
                      </button>
                    </div>
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

      {showMultipleReportModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
          <div
            className="w-full max-w-md rounded-lg border p-4 max-h-[80vh] overflow-y-auto"
            style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', color: '#FFFFFF' }}
          >
            <h3 className="font-bold text-lg mb-4">{t('help.equipmentList.generateReport')}</h3>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-400 mb-3 hover:underline"
            >
              {selectedInspections.size === inspections.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
            </button>
            <ul className="space-y-2 mb-4">
              {inspections.map((insp) => (
                <li key={insp.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedInspections.has(insp.id)}
                    onChange={() => handleToggleInspection(insp.id)}
                    className="rounded"
                  />
                  <span className="text-sm">
                    {format(new Date(insp.inspected_at), 'dd/MM/yyyy', { locale: dateLocale })}
                    {insp.overall_status ? ` — ${insp.overall_status}` : ''}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-400 mb-4">
              {selectedInspections.size} de {inspections.length} inspeções selecionadas
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowMultipleReportModal(false);
                  setSelectedInspections(new Set());
                }}
                className="flex-1 p-3 rounded-lg border"
                style={{ borderColor: '#2A2A2A' }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleGenerateMultipleReport}
                disabled={selectedInspections.size === 0 || generatingMultiplePdf}
                className="flex-1 p-3 rounded-lg bg-white text-black font-bold disabled:opacity-50"
              >
                {generatingMultiplePdf ? '...' : t('help.equipmentList.generateReport')}
              </button>
            </div>
          </div>
        </div>
      )}

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
