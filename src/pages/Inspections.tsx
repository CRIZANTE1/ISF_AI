import { Flame, Waves, Droplet, Target, Bell, Gauge, Shield, Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RadialOrbitalTimeline from '../components/ui/radial-orbital-timeline';
import { Scene } from '../components/ui/hero-section';

const sciItems = [
  { name: 'Extintores', link: '/inspections/extintor', icon: Flame, color: '#FC3D39' },
  { name: 'Mangueiras', link: '/inspections/mangueira', icon: Waves, color: '#157EFB' },
  { name: 'Câmaras de Espuma', link: '/inspections/camara_espuma', icon: Droplet, color: '#53D769' },
  { name: 'Canhões Monitores', link: '/inspections/canhao_monitor', icon: Target, color: '#FC3D39' },
  { name: 'Chuveiros/Lava-olhos', link: '/inspections/chuveiro_lavaolhos', icon: Droplet, color: '#157EFB' },
  { name: 'Sistemas de Alarme', link: '/inspections/alarme', icon: Bell, color: '#FC3D39' },
];

const safetyItems = [
  { name: 'Medidores Multigás', link: '/inspections/multigas', icon: Gauge, color: '#53D769' },
  { name: 'Conjuntos Autônomos (SCBA)', link: '/inspections/scba', icon: Shield, color: '#157EFB' },
  { name: 'Abrigos de Emergência', link: '/inspections/abrigo', icon: Home, color: '#53D769' },
];

const Inspections = () => {
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0);
  
  // Combinar todos os itens para o seletor orbital
  const allItems = [...sciItems, ...safetyItems];
  
  const timelineData = allItems.map((item, index) => ({
    id: index + 1,
    title: item.name,
    category: index < sciItems.length ? 'SCI' : 'Segurança',
    icon: item.icon,
    link: item.link,
    color: item.color,
    energy: 100,
    relatedIds: index > 0 ? [index] : [],
  }));

  useEffect(() => {
    // Animação de construção do background em etapas
    const timer1 = setTimeout(() => {
      setBackgroundLoaded(true);
    }, 100);

    const timer2 = setTimeout(() => {
      setBackgroundOpacity(0.3);
    }, 300);

    const timer3 = setTimeout(() => {
      setBackgroundOpacity(0.6);
    }, 600);

    const timer4 = setTimeout(() => {
      setBackgroundOpacity(1);
    }, 900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  return (
    <div className="theme-pages dark min-h-screen relative" style={{ backgroundColor: 'transparent', color: 'var(--foreground)' }}>
      <AnimatePresence>
        {backgroundLoaded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ 
              opacity: backgroundOpacity, 
              scale: 1,
              filter: 'blur(0px)'
            }}
            transition={{ 
              duration: 1.2, 
              ease: [0.4, 0, 0.2, 1],
              opacity: {
                duration: 0.8,
                ease: [0.4, 0, 0.2, 1]
              },
              scale: {
                duration: 1.2,
                ease: [0.4, 0, 0.2, 1]
              },
              filter: {
                duration: 1.0,
                ease: [0.4, 0, 0.2, 1]
              }
            }}
            className="fixed inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
          >
            <Scene />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay gradiente para transição suave */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.5, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ 
          zIndex: 0.5,
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)'
        }}
      />
      <header className="sticky top-0 z-20 flex items-center justify-between h-14 px-ios-4 frosted-glass border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Inspeções</h1>
      </header>
      
      <div className="h-[calc(100vh-3.5rem)] relative" style={{ backgroundColor: 'transparent', zIndex: 1 }}>
        <RadialOrbitalTimeline timelineData={timelineData} />
      </div>
    </div>
  );
};

export default Inspections;
