/**
 * Formulário dinâmico para equipamentos customizados
 */

import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import { useEffect, useState } from 'react';
import {
  getCustomEquipmentFields,
  type CustomEquipmentField,
} from '../../utils/customEquipmentOperations';

interface CustomEquipmentFormProps {
  equipmentTypeId: string;
  register: UseFormRegister<any>;
  errors?: FieldErrors<any>;
  watch?: UseFormWatch<any>;
}

const CustomEquipmentForm = ({ equipmentTypeId, register, errors, watch }: CustomEquipmentFormProps) => {
  const [fields, setFields] = useState<CustomEquipmentField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFields = async () => {
      if (!equipmentTypeId) {
        setLoading(false);
        return;
      }

      try {
        const customFields = await getCustomEquipmentFields(equipmentTypeId);
        setFields(customFields);
      } catch (error) {
        console.error('Erro ao carregar campos customizados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFields();
  }, [equipmentTypeId]);

  if (loading) {
    return <div className="text-sm" style={{ color: '#B0B0B0' }}>Carregando campos...</div>;
  }

  if (fields.length === 0) {
    return null;
  }

  return (
    <>
      {fields
        .sort((a, b) => a.display_order - b.display_order)
        .map((field) => (
          <div key={field.id} className="mb-4">
            <label
              htmlFor={`custom_${field.field_name}`}
              className="block text-sm font-medium mb-1"
              style={{ color: '#FFFFFF' }}
            >
              {field.field_label}
              {field.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.field_type === 'text' && (
              <input
                id={`custom_${field.field_name}`}
                type="text"
                {...register(`custom_fields.${field.field_name}`, {
                  required: field.is_required ? `${field.field_label} é obrigatório` : false,
                })}
                placeholder={field.placeholder || ''}
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-white/30 focus:outline-none"
                style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
              />
            )}

            {field.field_type === 'textarea' && (
              <textarea
                id={`custom_${field.field_name}`}
                rows={3}
                {...register(`custom_fields.${field.field_name}`, {
                  required: field.is_required ? `${field.field_label} é obrigatório` : false,
                })}
                placeholder={field.placeholder || ''}
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-white/30 focus:outline-none"
                style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
              />
            )}

            {field.field_type === 'number' && (
              <input
                id={`custom_${field.field_name}`}
                type="number"
                step="any"
                {...register(`custom_fields.${field.field_name}`, {
                  required: field.is_required ? `${field.field_label} é obrigatório` : false,
                  valueAsNumber: true,
                })}
                placeholder={field.placeholder || ''}
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-white/30 focus:outline-none"
                style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
              />
            )}

            {field.field_type === 'date' && (
              <input
                id={`custom_${field.field_name}`}
                type="date"
                {...register(`custom_fields.${field.field_name}`, {
                  required: field.is_required ? `${field.field_label} é obrigatório` : false,
                })}
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-white/30 focus:outline-none"
                style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
              />
            )}

            {field.field_type === 'select' && (
              <select
                id={`custom_${field.field_name}`}
                {...register(`custom_fields.${field.field_name}`, {
                  required: field.is_required ? `${field.field_label} é obrigatório` : false,
                })}
                className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-white/30 focus:outline-none"
                style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', color: '#FFFFFF' }}
              >
                <option value="">Selecione...</option>
                {field.options?.map((option) => (
                  <option key={option} value={option} style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {field.field_type === 'boolean' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id={`custom_${field.field_name}`}
                  type="checkbox"
                  {...register(`custom_fields.${field.field_name}`)}
                  className="w-4 h-4 rounded"
                />
                <span style={{ color: '#FFFFFF' }}>{field.placeholder || 'Sim'}</span>
              </label>
            )}

            {errors?.custom_fields?.[field.field_name] && (
              <p className="text-sm text-red-500 mt-1">
                {String(errors.custom_fields[field.field_name]?.message)}
              </p>
            )}
          </div>
        ))}
    </>
  );
};

export default CustomEquipmentForm;

