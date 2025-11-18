'use client'

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, ClipboardCheck, History, Wrench, MapPin, Shield, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';

interface DockItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  to?: string;
  onClick?: () => void;
  adminOnly?: boolean;
}

interface DockItemProps {
  item: DockItem;
  isHovered: boolean;
  isActive: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
}

const DockItemComponent: React.FC<DockItemProps> = ({ item, isHovered, isActive, onHover, onClick }) => {
  const isAddButton = item.id === 'add';
  
  return (
    <div
      className="relative group"
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        className={`
          relative flex items-center justify-center
          ${isAddButton ? 'w-10 h-10 rounded-full' : 'w-9 h-9 rounded-lg'}
          ${isAddButton 
            ? 'bg-white text-black' 
            : 'bg-white/5 backdrop-blur-[2px] border border-white/10'
          }
          transition-all duration-300 ease-out
          cursor-pointer
          shadow-none
          ${isActive && !isAddButton
            ? 'bg-white/15 border-white/30 scale-105' 
            : ''
          }
          ${isHovered 
            ? isAddButton
              ? 'scale-115 bg-white/90 -translate-y-1'
              : 'scale-110 bg-white/10 border-white/20 -translate-y-1'
            : isAddButton
              ? 'hover:scale-110 hover:bg-white/95 hover:-translate-y-0.5'
              : 'hover:scale-105 hover:bg-white/7 hover:-translate-y-0.5'
          }
        `}
        onClick={onClick}
        style={{
          transitionProperty: 'transform, background, border-color'
        }}
      >
        <div className={`
          ${isAddButton ? 'text-black' : 'text-white'} transition-all duration-300
          ${isHovered || isActive ? 'scale-105' : ''}
        `}>
          {item.icon}
        </div>
      </div>
      
      {/* Tooltip */}
      <div className={`
        absolute -top-10 left-1/2 transform -translate-x-1/2
        px-2.5 py-1 rounded-md
        bg-black/70 backdrop-blur
        text-white text-xs font-normal
        border border-white/5
        transition-all duration-200
        pointer-events-none
        whitespace-nowrap
        ${isHovered 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-1'
        }
      `}>
        {item.label}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
          <div className="w-2 h-2 bg-black/70 rotate-45 border-r border-b border-white/5"></div>
        </div>
      </div>
    </div>
  );
};

interface MinimalistDockProps {
  className?: string;
}

const MinimalistDock: React.FC<MinimalistDockProps> = ({ className }) => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const allDockItems: DockItem[] = [
    { 
      id: 'inspections', 
      icon: <ClipboardCheck size={16} />, 
      label: t('navigation.inspections'),
      to: '/inspections'
    },
    { 
      id: 'history', 
      icon: <History size={16} />, 
      label: t('navigation.history'),
      to: '/history'
    },
    { 
      id: 'action-plans', 
      icon: <FileText size={16} />, 
      label: t('navigation.actionPlans', { defaultValue: 'Planos de Ação' }),
      to: '/action-plans'
    },
    { 
      id: 'home', 
      icon: <LayoutGrid size={16} />, 
      label: t('navigation.home'),
      to: '/'
    },
    { 
      id: 'map', 
      icon: <MapPin size={16} />, 
      label: t('navigation.map'),
      to: '/map'
    },
    { 
      id: 'utilities', 
      icon: <Wrench size={16} />, 
      label: t('navigation.utilities'),
      to: '/utilities'
    },
    { 
      id: 'admin', 
      icon: <Shield size={16} />, 
      label: t('navigation.administration'),
      to: '/admin/utilities',
      adminOnly: true
    },
  ];

  const filteredItems = allDockItems.filter(item => {
    if (item.adminOnly) {
      return profile?.role === 'admin';
    }
    return true;
  });

  // Reorganizar para colocar o Home no centro
  const homeItem = filteredItems.find(item => item.id === 'home');
  const otherItems = filteredItems.filter(item => item.id !== 'home');
  const middleIndex = Math.floor(otherItems.length / 2);
  const dockItems = [
    ...otherItems.slice(0, middleIndex),
    ...(homeItem ? [homeItem] : []),
    ...otherItems.slice(middleIndex)
  ];

  const handleItemClick = (item: DockItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.to) {
      navigate(item.to);
    }
  };

  const isItemActive = (item: DockItem) => {
    if (item.to) {
      return location.pathname === item.to || 
             (item.to === '/' && location.pathname === '/');
    }
    return false;
  };

  return (
    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 ${className || ''}`}>
      <div className="relative">
        {/* Dock Container */}
        <div className={`
          flex items-end gap-2 px-4 py-3
          rounded-2xl
          bg-black/40 backdrop-blur-xl
          border border-white/10
          transition-all duration-500 ease-out
          ${hoveredItem ? 'scale-105' : ''}
        `}>
          {dockItems.map((item) => (
            <DockItemComponent
              key={item.id}
              item={item}
              isHovered={hoveredItem === item.id}
              isActive={isItemActive(item)}
              onHover={setHoveredItem}
              onClick={() => handleItemClick(item)}
            />
          ))}
        </div>
        
        {/* Reflection Effect */}
        <div className="absolute top-full left-0 right-0 h-16 overflow-hidden pointer-events-none">
          <div className={`
            flex items-start gap-2 px-4 py-3
            rounded-2xl
            bg-black/20 backdrop-blur-xl
            border border-white/5
            opacity-30
            transform scale-y-[-1]
            transition-all duration-500 ease-out
            ${hoveredItem ? 'scale-105 scale-y-[-1.05]' : ''}
          `}>
            {dockItems.map((item) => (
              <div
                key={`reflection-${item.id}`}
                className={`
                  flex items-center justify-center
                  w-9 h-9 rounded-lg
                  bg-white/5
                  transition-all duration-300 ease-out
                  ${hoveredItem === item.id 
                    ? 'scale-125 -translate-y-2' 
                    : ''
                  }
                `}
              >
                <div className="text-white/50">
                  {item.icon}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinimalistDock;

