import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useTranslation } from '../hooks/useTranslation';
import { useHaptics } from '../hooks/useHaptics';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '../components/ui/spinner';
import {
  getWaterReservoirById,
  saveWaterReservoirInspection,
  type WaterReservoir,
} from '../utils/waterReservoirOperations';
import ChecklistLocationMap from '../components/ChecklistLocationMap';

type InspectionFormData = {
  inspected_at: string;
  level_reading?: string;
  condition: 'OK' | 'B';
  suction_clean: boolean;
  overflow_clear: boolean;
  corrective_action_needed: boolean;
  corrective_action_notes?: string;
  inspector_name?: string;
};

const inputStyle = {
  backgroundColor: '#1A1A1A',
  borderColor: '#2A2A2A',
  borderWidth: '1px' as const,
  color: '#FFFFFF',
};

const AddWaterReservoirInspectionPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { executeWithFeedback } = useErrorHandler();
  const { t } = useTranslation();
  const haptics = useHaptics();
  const [loading, setLoading] = useState(false);
  const [reservoir, setReservoir] = useState<WaterReservoir | null>(null);
  const [loadingReservoir, setLoadingReservoir] = useState(true);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<InspectionFormData>({
    defaultValues: {
      inspected_at: new Date().toISOString().split('T')[0],
      condition: 'OK',
      suction_clean: true,
      overflow_clear: true,
      corrective_action_needed: false,
      inspector_name: profile?.full_name || '',
    },
  });

  const correctiveActionNeeded = watch('corrective_action_needed');

  useEffect(() => {
    const loadReservoir = async () => {
      if (!id) return;
      setLoadingReservoir(true);
      const data = await getWaterReservoirById(id);
      setReservoir(data);
      setLoadingReservoir(false);
    };
    loadReservoir();
  }, [id]);

  const onSubmit = async (data: InspectionFormData) => {
    if (!id) return;
    setLoading(true);
    try {
      await executeWithFeedback(
        async () => {
          const success = await saveWaterReservoirInspection(
            {
              reservoir_id: id,
              inspected_at: data.inspected_at,
              level_reading: data.level_reading?.trim() || null,
              condition: data.condition,
              suction_clean: Boolean(data.suction_clean),
              overflow_clear: Boolean(data.overflow_clear),
              corrective_action_needed: Boolean(data.corrective_action_needed),
              corrective_action_notes: data.corrective_action_notes?.trim() || null,
              inspector_name: data.inspector_name?.trim() || null,
              inspection_type: 'NFPA 25',
            },
            reservoir?.inspection_periodicity
          );

          if (!success) {
            throw new Error(t('waterReservoir.inspectionSaveError'));
          }

          haptics.success();
          navigate(`/reservoir/${id}`);
        },
        'inspection',
        t('waterReservoir.inspectionSaveSuccess'),
        t('waterReservoir.inspectionSaveError')
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingReservoir) {
    return (
      <div className="theme-pages dark min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <Spinner size="lg" color="white" />
      </div>
    );
  }

  return (
    <div className="theme-pages dark min-h-screen" style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
      <PageHeader title={t('waterReservoir.inspectionTitle')} />
      <main className="px-4 py-4 pb-32">
        {reservoir && (
          <p className="text-sm text-gray-400 mb-4">
            {reservoir.name}{reservoir.code ? ` (${reservoir.code})` : ''}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="inspected_at" className="block text-sm font-medium mb-1">
              {t('inspection.dateRequired')}
            </label>
            <input
              id="inspected_at"
              type="date"
              {...register('inspected_at', { required: t('inspection.dateRequiredError') })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none"
              style={inputStyle}
            />
            {errors.inspected_at && <p className="text-red-400 text-xs mt-1">{errors.inspected_at.message}</p>}
          </div>

          <div>
            <label htmlFor="inspector_name" className="block text-sm font-medium mb-1">
              {t('inspection.inspector')}
            </label>
            <input
              id="inspector_name"
              {...register('inspector_name')}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none"
              style={inputStyle}
            />
          </div>

          <div className="p-4 rounded-lg border" style={{ ...inputStyle, backgroundColor: 'rgba(26, 26, 26, 0.95)' }}>
            <h3 className="font-semibold mb-3">{t('waterReservoir.nfpa25Checklist')}</h3>

            <div className="mb-4">
              <label htmlFor="level_reading" className="block text-sm font-medium mb-1">
                {t('waterReservoir.levelReading')}
              </label>
              <input
                id="level_reading"
                {...register('level_reading')}
                placeholder={t('waterReservoir.levelReadingPlaceholder')}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none"
                style={inputStyle}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="condition" className="block text-sm font-medium mb-1">
                {t('waterReservoir.condition')} *
              </label>
              <select
                id="condition"
                {...register('condition', { required: true })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none"
                style={inputStyle}
              >
                <option value="OK">{t('waterReservoir.conditionOk')}</option>
                <option value="B">{t('waterReservoir.conditionBad')}</option>
              </select>
            </div>

            <label className="flex items-center gap-3 mb-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('suction_clean')}
                className="w-5 h-5 rounded"
              />
              <span>{t('waterReservoir.suctionClean')}</span>
            </label>

            <label className="flex items-center gap-3 mb-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('overflow_clear')}
                className="w-5 h-5 rounded"
              />
              <span>{t('waterReservoir.overflowClear')}</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('corrective_action_needed')}
                className="w-5 h-5 rounded"
              />
              <span>{t('waterReservoir.correctiveActionNeeded')}</span>
            </label>
          </div>

          {correctiveActionNeeded && (
            <div>
              <label htmlFor="corrective_action_notes" className="block text-sm font-medium mb-1">
                {t('waterReservoir.correctiveActionNotes')} *
              </label>
              <textarea
                id="corrective_action_notes"
                rows={3}
                {...register('corrective_action_notes', {
                  required: correctiveActionNeeded ? t('waterReservoir.correctiveActionNotesRequired') : false,
                })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none resize-none"
                style={inputStyle}
              />
              {errors.corrective_action_notes && (
                <p className="text-red-400 text-xs mt-1">{errors.corrective_action_notes.message}</p>
              )}
            </div>
          )}

          <ChecklistLocationMap
            latitude={reservoir?.gps_latitude}
            longitude={reservoir?.gps_longitude}
            title={reservoir?.name}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Spinner size="sm" color="black" />}
            {t('inspection.register')}
          </button>
        </form>
      </main>
    </div>
  );
};

export default AddWaterReservoirInspectionPage;
