import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedFormFieldProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  'data-tour'?: string;
}

const AnimatedFormField = ({ children, delay = 0, className = '', 'data-tour': dataTour }: AnimatedFormFieldProps) => {
  return (
    <motion.div
      data-tour={dataTour}
      className={className}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay,
        ease: [0.4, 0, 0.2, 1] 
      }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedFormField;

