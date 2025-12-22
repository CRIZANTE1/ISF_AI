import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import { useTranslation } from '../hooks/useTranslation';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useToast } from '../contexts/ToastContext';
import {
  getAllCustomEquipmentTypes,
  getCustomEquipmentTypeById,
  createCustomEquipmentType,
  updateCustomEquipmentType,
  getCustomEquipmentFields,
  saveCustomEquipmentFields,
  getCustomChecklists,
  getCustomChecklistFull,
  createCustomChecklist,
  getAllCustomEquipment,
  type CustomEquipmentType,
  type CustomEquipmentField,
  type CustomChecklist,
} from '../utils/customEquipmentOperations';
import { Plus, Edit, Trash2, Save, X, ChevronRight, List, Settings, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from '../components/Skeleton';

type ViewMode = 'list' | 'create-type' | 'edit-type' | 'create-checklist' | 'edit-checklist';

import InstructionsPanel from '../components/InstructionsPanel';

const CustomEquipmentTypesPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { handleError, executeWithFeedback } = useErrorHandler();
  const { showSuccess, showError } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [equipmentTypes, setEquipmentTypes] = useState<CustomEquipmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<CustomEquipmentType | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(null);
  const [checklistSections, setChecklistSections] = useState<Array<{
    section_name: string;
    section_order: number;
    items: Array<{ question_text: string; item_order: number; action_plan_template?: string }>;
  }>>([{ section_name: '', section_order: 0, items: [{ question_text: '', item_order: 0 }] }]);
  const [checklistName, setChecklistName] = useState('');
  const [checklistDescription, setChecklistDescription] = useState('');
  const [checklistInspectionType, setChecklistInspectionType] = useState('');

  const { register: registerType, handleSubmit: handleSubmitType, formState: { errors: errorsType }, reset: resetType } = useForm<CustomEquipmentType>();
  const { register: registerField, handleSubmit: handleSubmitField, formState: { errors: errorsField }, watch: watchField } = useForm();

  // Carrega tipos de equipamentos
  useEffect(() => {
    loadEquipmentTypes();
  }, []);

  const loadEquipmentTypes = async () => {
    setLoading(true);
    try {
      const types = await getAllCustomEquipmentTypes();
      setEquipmentTypes(types);
    } catch (error) {
      handleError(error, 'equipment', t('utilities.customEquipmentTypes.loadingTypes'));
    } finally {
      setLoading(false);
    }
  };

  const getInstructionType = () => {
    if (viewMode === 'create-type' || viewMode === 'edit-type') return 'custom_type';
    if (viewMode === 'create-checklist' || viewMode === 'edit-checklist') return 'custom_checklist';
    return null;
  };

  const instructionType = getInstructionType();

  // Cria novo tipo de equipamento
  const onCreateType = async (data: any) => {
    if (!user) return;

    try {
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      
      const typeData = {
        name: data.name,
        slug: slug,
        description: data.description || '',
        icon_name: data.icon_name || 'Package',
        id_field_name: data.id_field_name || 'id_equipamento',
        id_field_label: data.id_field_label || 'ID do Equipamento',
        requires_location: data.requires_location || false,
        requires_gps: data.requires_gps || false,
        has_data_cadastro: data.has_data_cadastro !== undefined ? data.has_data_cadastro : true,
        is_active: true,
        user_id: user.id,
      };

      if (selectedType) {
        await updateCustomEquipmentType(selectedType.id, typeData);
        showSuccess(t('utilities.customEquipmentTypes.typeUpdated'));
      } else {
        await createCustomEquipmentType(typeData);
        showSuccess(t('utilities.customEquipmentTypes.typeCreated'));
      }

      await loadEquipmentTypes();
      setViewMode('list');
      setSelectedType(null);
      resetType();
    } catch (error: any) {
      showError(error.message || t('utilities.customEquipmentTypes.typeError'));
    }
  };

  // Edita tipo existente
  const onEditType = async (type: CustomEquipmentType) => {
    setSelectedType(type);
    resetType({
      name: type.name,
      description: type.description || '',
      icon_name: type.icon_name || 'Package',
      id_field_name: type.id_field_name,
      id_field_label: type.id_field_label,
      requires_location: type.requires_location,
      requires_gps: type.requires_gps,
      has_data_cadastro: type.has_data_cadastro,
    });
    setViewMode('edit-type');
  };

  // Adiciona nova seção ao checklist
  const addChecklistSection = () => {
    setChecklistSections([
      ...checklistSections,
      { section_name: '', section_order: checklistSections.length, items: [{ question_text: '', item_order: 0 }] }
    ]);
  };

  // Remove seção do checklist
  const removeChecklistSection = (index: number) => {
    setChecklistSections(checklistSections.filter((_, i) => i !== index));
  };

  // Adiciona item a uma seção
  const addChecklistItem = (sectionIndex: number) => {
    const updated = [...checklistSections];
    updated[sectionIndex].items.push({
      question_text: '',
      item_order: updated[sectionIndex].items.length,
    });
    setChecklistSections(updated);
  };

  // Remove item de uma seção
  const removeChecklistItem = (sectionIndex: number, itemIndex: number) => {
    const updated = [...checklistSections];
    updated[sectionIndex].items = updated[sectionIndex].items.filter((_, i) => i !== itemIndex);
    setChecklistSections(updated);
  };

  // Atualiza nome da seção
  const updateSectionName = (index: number, name: string) => {
    const updated = [...checklistSections];
    updated[index].section_name = name;
    setChecklistSections(updated);
  };

  // Atualiza pergunta do item
  const updateItemQuestion = (sectionIndex: number, itemIndex: number, question: string) => {
    const updated = [...checklistSections];
    updated[sectionIndex].items[itemIndex].question_text = question;
    setChecklistSections(updated);
  };

  // Salva checklist
  const onSaveChecklist = async () => {
    if (!selectedType || !checklistName.trim()) {
      showError(t('utilities.customEquipmentTypes.checklistNameRequired'));
      return;
    }

    // Valida seções e itens
    const validSections = checklistSections
      .filter(section => section.section_name.trim() && section.items.some(item => item.question_text.trim()))
      .map((section, index) => ({
        section_name: section.section_name.trim(),
        section_order: index,
        items: section.items
          .filter(item => item.question_text.trim())
          .map((item, itemIndex) => ({
            question_text: item.question_text.trim(),
            item_order: itemIndex,
            action_plan_template: item.action_plan_template?.trim() || undefined,
          })),
      }))
      .filter(section => section.items.length > 0);

    if (validSections.length === 0) {
      showError(t('utilities.customEquipmentTypes.addSectionError'));
      return;
    }

    try {
      await createCustomChecklist(
        {
          equipment_type_id: selectedType.id,
          name: checklistName.trim(),
          description: checklistDescription.trim() || undefined,
          inspection_type: checklistInspectionType.trim() || undefined,
          is_default: false,
          is_active: true,
          user_id: user!.id,
        },
        validSections
      );

      showSuccess(t('utilities.customEquipmentTypes.checklistCreated'));
      setViewMode('list');
      setSelectedType(null);
      setChecklistSections([{ section_name: '', section_order: 0, items: [{ question_text: '', item_order: 0 }] }]);
      setChecklistName('');
      setChecklistDescription('');
      setChecklistInspectionType('');
    } catch (error: any) {
      showError(error.message || t('utilities.customEquipmentTypes.checklistError'));
    }
  };

  // Renderiza formulário de checklist
  const renderChecklistForm = () => {
    if (!selectedType) return null;

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => {
              setViewMode('list');
              setSelectedType(null);
              setChecklistSections([{ section_name: '', section_order: 0, items: [{ question_text: '', item_order: 0 }] }]);
              setChecklistName('');
              setChecklistDescription('');
              setChecklistInspectionType('');
            }}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            style={{ color: '#FFFFFF' }}
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <h2 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>
            {t('utilities.customEquipmentTypes.createChecklistFor')} {selectedType.name}
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
              {t('utilities.customEquipmentTypes.checklistName')} <span className="text-red-500">*</span>
            </label>
            <input
              value={checklistName}
              onChange={(e) => setChecklistName(e.target.value)}
              className="w-full p-3 rounded-lg border"
              style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', color: '#FFFFFF' }}
              placeholder={t('utilities.customEquipmentTypes.checklistNamePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
              {t('utilities.customEquipmentTypes.checklistDescription')}
            </label>
            <textarea
              value={checklistDescription}
              onChange={(e) => setChecklistDescription(e.target.value)}
              rows={2}
              className="w-full p-3 rounded-lg border"
              style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', color: '#FFFFFF' }}
              placeholder={t('utilities.customEquipmentTypes.checklistDescriptionPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
              {t('utilities.customEquipmentTypes.inspectionType')}
            </label>
            <input
              value={checklistInspectionType}
              onChange={(e) => setChecklistInspectionType(e.target.value)}
              className="w-full p-3 rounded-lg border"
              style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', color: '#FFFFFF' }}
              placeholder={t('utilities.customEquipmentTypes.inspectionTypePlaceholder')}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold" style={{ color: '#FFFFFF' }}>{t('utilities.customEquipmentTypes.sections')}</h3>
              <button
                type="button"
                onClick={addChecklistSection}
                className="flex items-center gap-2 px-3 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
              >
                <Plus size={16} />
                {t('utilities.customEquipmentTypes.newSection')}
              </button>
            </div>

            {checklistSections.map((section, sectionIndex) => (
              <div
                key={sectionIndex}
                className="p-4 rounded-lg border"
                style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <input
                    value={section.section_name}
                    onChange={(e) => updateSectionName(sectionIndex, e.target.value)}
                    className="flex-1 p-2 rounded-lg border"
                    style={{ backgroundColor: '#0A0A0A', borderColor: '#2A2A2A', color: '#FFFFFF' }}
                    placeholder={t('utilities.customEquipmentTypes.sectionNamePlaceholder')}
                  />
                  {checklistSections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChecklistSection(sectionIndex)}
                      className="p-2 rounded-lg hover:bg-red-900/30 transition-colors"
                      style={{ color: '#FF6B6B' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="space-y-2 ml-4">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex gap-2 items-start">
                      <input
                        value={item.question_text}
                        onChange={(e) => updateItemQuestion(sectionIndex, itemIndex, e.target.value)}
                        className="flex-1 p-2 rounded-lg border text-sm"
                        style={{ backgroundColor: '#0A0A0A', borderColor: '#2A2A2A', color: '#FFFFFF' }}
                        placeholder={t('utilities.customEquipmentTypes.questionPlaceholder')}
                      />
                      {section.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeChecklistItem(sectionIndex, itemIndex)}
                          className="p-2 rounded-lg hover:bg-red-900/30 transition-colors"
                          style={{ color: '#FF6B6B' }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addChecklistItem(sectionIndex)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-800 transition-colors"
                    style={{ borderColor: '#2A2A2A', color: '#FFFFFF' }}
                  >
                    <Plus size={14} />
                    {t('utilities.customEquipmentTypes.addQuestion')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onSaveChecklist}
              className="flex-1 px-4 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {t('utilities.customEquipmentTypes.saveChecklist')}
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                setSelectedType(null);
                setChecklistSections([{ section_name: '', section_order: 0, items: [{ question_text: '', item_order: 0 }] }]);
                setChecklistName('');
                setChecklistDescription('');
                setChecklistInspectionType('');
              }}
              className="px-4 py-3 rounded-lg border font-semibold hover:bg-gray-800 transition-colors"
              style={{ borderColor: '#2A2A2A', color: '#FFFFFF' }}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Renderiza lista de tipos
  const renderTypeList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>{t('utilities.customEquipmentTypes.title')}</h2>
        <button
          onClick={() => {
            setSelectedType(null);
            resetType();
            setViewMode('create-type');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors"
        >
          <Plus size={20} />
          {t('utilities.customEquipmentTypes.newType')}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : equipmentTypes.length === 0 ? (
        <div className="text-center py-8" style={{ color: '#B0B0B0' }}>
          <p>{t('utilities.customEquipmentTypes.noTypes')}</p>
          <p className="text-sm mt-2">{t('utilities.customEquipmentTypes.noTypesHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {equipmentTypes.map((type) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg border"
              style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg" style={{ color: '#FFFFFF' }}>{type.name}</h3>
                  {type.description && (
                    <p className="text-sm mt-1" style={{ color: '#B0B0B0' }}>{type.description}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs" style={{ color: '#808080' }}>
                    <span>Slug: {type.slug}</span>
                    <span>ID Field: {type.id_field_label}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditType(type)}
                    className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                    style={{ color: '#FFFFFF' }}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedType(type);
                      setViewMode('create-checklist');
                    }}
                    className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                    style={{ color: '#FFFFFF' }}
                    title={t('utilities.customEquipmentTypes.createChecklist')}
                  >
                    <FileText size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  // Renderiza formulário de criação/edição de tipo
  const renderTypeForm = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => {
            setViewMode('list');
            setSelectedType(null);
            resetType();
          }}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          style={{ color: '#FFFFFF' }}
        >
          <ChevronRight size={20} className="rotate-180" />
        </button>
        <h2 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>
          {selectedType ? t('utilities.customEquipmentTypes.editType') : t('utilities.customEquipmentTypes.newTypeTitle')}
        </h2>
      </div>

      <form onSubmit={handleSubmitType(onCreateType)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
            {t('utilities.customEquipmentTypes.typeName')} <span className="text-red-500">*</span>
          </label>
          <input
            {...registerType('name', { required: t('utilities.customEquipmentTypes.typeNameRequired') })}
            className="w-full p-3 rounded-lg border"
            style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', color: '#FFFFFF' }}
            placeholder={t('utilities.customEquipmentTypes.typeNamePlaceholder')}
          />
          {errorsType.name && (
            <p className="text-sm text-red-500 mt-1">{String(errorsType.name.message)}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
            {t('utilities.customEquipmentTypes.description')}
          </label>
          <textarea
            {...registerType('description')}
            rows={3}
            className="w-full p-3 rounded-lg border"
            style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', color: '#FFFFFF' }}
            placeholder={t('utilities.customEquipmentTypes.descriptionPlaceholder')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
              {t('utilities.customEquipmentTypes.idFieldName')}
            </label>
            <input
              {...registerType('id_field_name')}
              className="w-full p-3 rounded-lg border"
              style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', color: '#FFFFFF' }}
              placeholder={t('utilities.customEquipmentTypes.idFieldNamePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#FFFFFF' }}>
              {t('utilities.customEquipmentTypes.idFieldLabel')}
            </label>
            <input
              {...registerType('id_field_label')}
              className="w-full p-3 rounded-lg border"
              style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', color: '#FFFFFF' }}
              placeholder={t('utilities.customEquipmentTypes.idFieldLabelPlaceholder')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...registerType('requires_location')}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: '#FFFFFF' }}>{t('utilities.customEquipmentTypes.requiresLocation')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...registerType('requires_gps')}
              className="w-4 h-4 rounded"
            />
            <span style={{ color: '#FFFFFF' }}>{t('utilities.customEquipmentTypes.requiresGps')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...registerType('has_data_cadastro')}
              defaultChecked
              className="w-4 h-4 rounded"
            />
            <span style={{ color: '#FFFFFF' }}>{t('utilities.customEquipmentTypes.hasDataCadastro')}</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 px-4 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {selectedType ? t('utilities.customEquipmentTypes.update') : t('utilities.customEquipmentTypes.create')}
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('list');
              setSelectedType(null);
              resetType();
            }}
            className="px-4 py-3 rounded-lg border font-semibold hover:bg-gray-800 transition-colors"
            style={{ borderColor: '#2A2A2A', color: '#FFFFFF' }}
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </motion.div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title={{ key: 'utilities.customEquipment', defaultValue: 'Equipamentos Customizados' }} />
      <main className="p-4 pb-32" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-4xl mx-auto">
          {instructionType && <InstructionsPanel equipmentType={instructionType} className="mb-6" />}
          <AnimatePresence mode="wait">
            {viewMode === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {renderTypeList()}
              </motion.div>
            )}
            {(viewMode === 'create-type' || viewMode === 'edit-type') && (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {renderTypeForm()}
              </motion.div>
            )}
            {viewMode === 'create-checklist' && (
              <motion.div
                key="checklist"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {renderChecklistForm()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default CustomEquipmentTypesPage;

