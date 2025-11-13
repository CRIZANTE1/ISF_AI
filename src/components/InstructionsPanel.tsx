import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Info, AlertCircle, HelpCircle, X } from 'lucide-react';
import { EquipmentInstructions, getInstructions } from '../constants/instructions';

interface InstructionsPanelProps {
  equipmentType: string;
  className?: string;
}

const InstructionsPanel = ({ equipmentType, className = '' }: InstructionsPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const instructions = getInstructions(equipmentType);

  if (!instructions) {
    return null;
  }

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const getAlertIcon = (type?: string) => {
    switch (type) {
      case 'info':
        return <Info size={20} className="text-[#157EFB]" />;
      case 'success':
        return <AlertCircle size={20} className="text-[#53D769]" />;
      case 'warning':
        return <AlertCircle size={20} className="text-[#F59E0B]" />;
      default:
        return <Info size={20} className="text-[#157EFB]" />;
    }
  };

  const getAlertBgColor = (type?: string) => {
    switch (type) {
      case 'info':
        return 'rgba(21, 126, 251, 0.1)';
      case 'success':
        return 'rgba(83, 215, 105, 0.1)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.1)';
      default:
        return 'rgba(21, 126, 251, 0.1)';
    }
  };

  const getAlertBorderColor = (type?: string) => {
    switch (type) {
      case 'info':
        return 'rgba(21, 126, 251, 0.3)';
      case 'success':
        return 'rgba(83, 215, 105, 0.3)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.3)';
      default:
        return 'rgba(21, 126, 251, 0.3)';
    }
  };

  return (
    <div className={`mb-ios-6 ${className} relative`} style={{ zIndex: 10, position: 'relative' }}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-ios-4 rounded-ios-lg transition-all relative"
        style={{
          zIndex: 10,
          position: 'relative',
          backgroundColor: isOpen ? 'rgba(28, 28, 30, 0.9)' : 'rgba(28, 28, 30, 0.8)',
          borderRadius: '16px',
        }}
        whileHover={{ backgroundColor: 'rgba(28, 28, 30, 0.9)' }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-ios-2">
          <HelpCircle size={20} className="text-[#157EFB]" />
          <span className="font-semibold text-white text-base">
            {instructions.header.title}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp size={20} className="text-[#8E8E93]" />
        ) : (
          <ChevronDown size={20} className="text-[#8E8E93]" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-ios-3 apple-card p-ios-4 relative"
            style={{
              zIndex: 10,
              position: 'relative',
              backgroundColor: 'rgba(28, 28, 30, 0.95)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Subtitle */}
            {instructions.header.subtitle && (
              <p className="text-[#8E8E93] text-sm mb-ios-4">
                {instructions.header.subtitle}
              </p>
            )}

            {/* Alert */}
            {instructions.alert && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-ios-4 p-ios-3 rounded-ios-lg border-l-4"
                style={{
                  backgroundColor: getAlertBgColor(instructions.alert.type),
                  borderLeftColor: getAlertBorderColor(instructions.alert.type),
                }}
              >
                <div className="flex items-start gap-ios-2">
                  {getAlertIcon(instructions.alert.type)}
                  <p
                    className="text-sm flex-1"
                    style={{ color: '#FFFFFF' }}
                    dangerouslySetInnerHTML={{ __html: instructions.alert.message }}
                  />
                </div>
              </motion.div>
            )}

            {/* Methods */}
            {instructions.methods && (
              <div className="mb-ios-5">
                <h3 className="font-bold text-lg text-white mb-ios-3">
                  {instructions.methods.title}
                </h3>
                <div className="space-y-ios-3">
                  {instructions.methods.items.map((method, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-ios-3 rounded-ios-lg"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <h4 className="font-semibold text-white mb-ios-1">
                        {method.name}
                      </h4>
                      <p className="text-[#8E8E93] text-xs mb-ios-2">
                        {method.description}
                      </p>
                      <p className="text-[#8E8E93] text-xs mb-ios-2">
                        <strong>Tempo:</strong> {method.time}
                      </p>
                      <div className="mb-ios-2">
                        <p className="text-[#8E8E93] text-xs mb-ios-1">
                          <strong>Ideal para:</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-ios-1 ml-ios-2">
                          {method.idealFor.map((item, idx) => (
                            <li key={idx} className="text-[#8E8E93] text-xs">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mb-ios-2">
                        <p className="text-[#8E8E93] text-xs mb-ios-1">
                          <strong>Como funciona:</strong>
                        </p>
                        <ol className="list-decimal list-inside space-y-ios-1 ml-ios-2">
                          {method.howItWorks.map((step, idx) => (
                            <li key={idx} className="text-[#8E8E93] text-xs">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                      {method.advantages && (
                        <div>
                          <p className="text-[#8E8E93] text-xs mb-ios-1">
                            <strong>Vantagens:</strong>
                          </p>
                          <ul className="list-disc list-inside space-y-ios-1 ml-ios-2">
                            {method.advantages.map((item, idx) => (
                              <li key={idx} className="text-[#8E8E93] text-xs">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {method.requires && (
                        <p className="text-[#F59E0B] text-xs mt-ios-2">
                          <strong>Requer:</strong> {method.requires}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Workflow */}
            {instructions.workflow && (
              <div className="mb-ios-5">
                <h3 className="font-bold text-lg text-white mb-ios-3">
                  {instructions.workflow.title}
                </h3>
                <motion.div
                  className="p-ios-3 rounded-ios-lg border-l-4"
                  style={{
                    backgroundColor: 'rgba(21, 126, 251, 0.1)',
                    borderLeftColor: '#157EFB',
                  }}
                >
                  <ol className="list-decimal list-inside space-y-ios-2 ml-ios-2">
                    {instructions.workflow.steps.map((step, index) => (
                      <li key={index} className="text-white text-sm">
                        <span dangerouslySetInnerHTML={{ __html: step }} />
                      </li>
                    ))}
                  </ol>
                </motion.div>
              </div>
            )}

            {/* Guide Sections */}
            {instructions.guide && (
              <div className="mb-ios-5 space-y-ios-3">
                {instructions.guide.map((section, index) => {
                  const isExpanded = expandedSections[section.title] ?? section.expanded ?? false;
                  return (
                    <div key={index}>
                      <motion.button
                        onClick={() => toggleSection(section.title)}
                        className="w-full flex items-center justify-between p-ios-3 rounded-ios-lg transition-all"
                        style={{
                          backgroundColor: isExpanded
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(255, 255, 255, 0.05)',
                        }}
                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="font-semibold text-white text-sm">
                          {section.title}
                        </span>
                        {isExpanded ? (
                          <ChevronUp size={18} className="text-[#8E8E93]" />
                        ) : (
                          <ChevronDown size={18} className="text-[#8E8E93]" />
                        )}
                      </motion.button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-ios-2 p-ios-3 rounded-ios-lg"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            }}
                          >
                            <div
                              className="instructions-content"
                              dangerouslySetInnerHTML={{ __html: section.content }}
                              style={{
                                fontSize: '13px',
                                lineHeight: '1.6',
                                color: '#8E8E93',
                              }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}

            {/* FAQ */}
            {instructions.faq && (
              <div className="mb-ios-4">
                <h3 className="font-bold text-lg text-white mb-ios-3">
                  Perguntas Frequentes
                </h3>
                <div className="space-y-ios-2">
                  {instructions.faq.map((item, index) => {
                    const isExpanded = expandedSections[`faq-${index}`] ?? false;
                    return (
                      <div key={index}>
                        <motion.button
                          onClick={() => toggleSection(`faq-${index}`)}
                          className="w-full flex items-center justify-between p-ios-3 rounded-ios-lg transition-all text-left"
                          style={{
                            backgroundColor: isExpanded
                              ? 'rgba(255, 255, 255, 0.1)'
                              : 'rgba(255, 255, 255, 0.05)',
                          }}
                          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="font-medium text-white text-sm flex-1">
                            {item.question}
                          </span>
                          {isExpanded ? (
                            <ChevronUp size={18} className="text-[#8E8E93] ml-ios-2 flex-shrink-0" />
                          ) : (
                            <ChevronDown size={18} className="text-[#8E8E93] ml-ios-2 flex-shrink-0" />
                          )}
                        </motion.button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-ios-2 p-ios-3 rounded-ios-lg"
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              }}
                            >
                              <div
                                className="text-[#8E8E93] text-sm"
                                dangerouslySetInnerHTML={{ __html: item.answer }}
                                style={{
                                  lineHeight: '1.6',
                                }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer */}
            {instructions.footer && (
              <motion.div
                className="mt-ios-4 p-ios-3 rounded-ios-lg border-l-4"
                style={{
                  backgroundColor: 'rgba(83, 215, 105, 0.1)',
                  borderLeftColor: '#53D769',
                }}
              >
                <p
                  className="text-white text-sm"
                  dangerouslySetInnerHTML={{ __html: instructions.footer }}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InstructionsPanel;

