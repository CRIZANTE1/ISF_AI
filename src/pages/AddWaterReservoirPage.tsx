import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useTranslation } from '../hooks/useTranslation';
import { useHaptics } from '../hooks/useHaptics';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import { saveNewWaterReservoir } from '../utils/waterReservoirOperations';
import { ButtonSkeleton } from '../components/skeletons';

type WaterReservoirFormData = {
  name: string;
  code?: string;
  reservoir_type: string;
  product_type: 'AGUA' | 'LGE';
  capacity_m3: number;
  location?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  inspection_periodicity: string;
  notes?: string;
};

const inputStyle = {
  backgroundColor: '#1A1A1A',
  borderColor: '#2A2A2A',
  borderWidth: '1px' as const,
  color: '#FFFFFF',
};

const AddWaterReservoirPage = () => {
  const navigate = useNavigate();
  const { executeWithFeedback } = useErrorHandler();
  const { t } = useTranslation();
  const haptics = useHaptics();
  const { refreshTypes } = useEquipmentCache();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<WaterReservoirFormData>({
    defaultValues: {
      reservoir_type: 'lago',
      product_type: 'AGUA',
      inspection_periodicity: 'Semanal',
    },
  });

  const onSubmit = async (data: WaterReservoirFormData) => {
    setLoading(true);
    try {
      await executeWithFeedback(
        async () => {
          const success = await saveNewWaterReservoir({
            name: data.name.trim(),
            code: data.code?.trim() || null,
            reservoir_type: data.reservoir_type,
            product_type: data.product_type,
            capacity_m3: Number(data.capacity_m3),
            location: data.location?.trim() || null,
            gps_latitude: data.gps_latitude ?? null,
            gps_longitude: data.gps_longitude ?? null,
            inspection_periodicity: data.inspection_periodicity,
            notes: data.notes?.trim() || null,
          });

          if (!success) {
            throw new Error(t('waterReservoir.saveError'));
          }

          await refreshTypes(['reserva_tecnica'], true);
          haptics.success();
          navigate('/inspections/reserva_tecnica');
        },
        'equipment',
        t('waterReservoir.saveSuccess'),
        t('waterReservoir.saveError')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-pages dark min-h-screen" style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
      <PageHeader title={t('waterReservoir.addTitle')} />
      <main className="px-4 py-4 pb-32">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              {t('waterReservoir.name')} *
            </label>
            <input
              id="name"
              {...register('name', { required: t('waterReservoir.nameRequired') })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none"
              style={inputStyle}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium mb-1">
              {t('waterReservoir.code')}
            </label>
            <input
              id="code"
              {...register('code')}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="reservoir_type" className="block text-sm font-medium mb-1">
              {t('waterReservoir.reservoirType')} *
            </label>
            <select
              id="reservoir_type"
              {...register('reservoir_type', { required: true })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none"
              style={inputStyle}
            >
              <option value="lago">{t('waterReservoir.typeLake')}</option>
              <option value="cisterna">{t('waterReservoir.typeCistern')}</option>
              <option value="tanque_elevado">{t('waterReservoir.typeElevatedTank')}</option>
              <option value="reservatorio_subterraneo">{t('waterReservoir.typeUnderground')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="product_type" className="block text-sm font-medium mb-1">
              {t('waterReservoir.productType')} *
            </label>
            <select
              id="product_type"
              {...register('product_type', { required: true })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none"
              style={inputStyle}
            >
              <option value="AGUA">{t('waterReservoir.productWater')}</option>
              <option value="LGE">{t('waterReservoir.productLge')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="capacity_m3" className="block text-sm font-medium mb-1">
              {t('waterReservoir.capacity')} *
            </label>
            <input
              id="capacity_m3"
              type="number"
              step="0.01"
              min="0"
              {...register('capacity_m3', {
                required: t('waterReservoir.capacityRequired'),
                valueAsNumber: true,
                min: { value: 0.01, message: t('waterReservoir.capacityMin') },
              })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none"
              style={inputStyle}
            />
            {errors.capacity_m3 && <p className="text-red-400 text-xs mt-1">{errors.capacity_m3.message}</p>}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-1">
              {t('waterReservoir.location')}
            </label>
            <input
              id="location"
              {...register('location')}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('equipment.formHints.gpsCoordinates')}</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="gps_latitude" className="block text-xs text-gray-400 mb-1">
                  {t('equipment.formHints.latitude')}
                </label>
                <input
                  id="gps_latitude"
                  type="number"
                  step="any"
                  {...register('gps_latitude', { valueAsNumber: true })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="gps_longitude" className="block text-xs text-gray-400 mb-1">
                  {t('equipment.formHints.longitude')}
                </label>
                <input
                  id="gps_longitude"
                  type="number"
                  step="any"
                  {...register('gps_longitude', { valueAsNumber: true })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="inspection_periodicity" className="block text-sm font-medium mb-1">
              {t('waterReservoir.periodicity')} *
            </label>
            <select
              id="inspection_periodicity"
              {...register('inspection_periodicity', { required: true })}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none"
              style={inputStyle}
            >
              <option value="Semanal">{t('waterReservoir.periodWeekly')}</option>
              <option value="Quinzenal">{t('waterReservoir.periodBiweekly')}</option>
              <option value="Mensal">{t('waterReservoir.periodMonthly')}</option>
              <option value="Trimestral">{t('waterReservoir.periodQuarterly')}</option>
              <option value="Semestral">{t('waterReservoir.periodSemiannual')}</option>
              <option value="Anual">{t('waterReservoir.periodAnnual')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1">
              {t('waterReservoir.notes')}
            </label>
            <textarea
              id="notes"
              rows={3}
              {...register('notes')}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none resize-none"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <ButtonSkeleton width="w-16" /> : t('common.save')}
          </button>
        </form>
      </main>
    </div>
  );
};

export default AddWaterReservoirPage;
