"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { cn } from "../../utils/cn";

interface TimelineItem {
  id: number;
  title: string;
  date?: string;
  content?: string;
  category: string;
  icon: React.ElementType;
  relatedIds?: number[];
  status?: "completed" | "in-progress" | "pending";
  energy?: number;
  link?: string;
  color?: string;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
  onItemSelect?: (item: TimelineItem) => void;
}

export default function RadialOrbitalTimeline({
  timelineData,
  onItemSelect,
}: RadialOrbitalTimelineProps) {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset, setCenterOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);

        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  const handleItemClick = (item: TimelineItem) => {
    if (item.link) {
      navigate(item.link);
    }
    if (onItemSelect) {
      onItemSelect(item);
    }
  };

  useEffect(() => {
    let rotationTimer: ReturnType<typeof setInterval>;

    if (autoRotate) {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => {
          const newAngle = (prev + 0.3) % 360;
          return Number(newAngle.toFixed(3));
        });
      }, 50);
    }

    return () => {
      if (rotationTimer) {
        clearInterval(rotationTimer);
      }
    };
  }, [autoRotate]);

  const centerViewOnNode = (nodeId: number) => {
    if (!nodeRefs.current[nodeId]) return;

    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;

    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 200;
    const radian = (angle * Math.PI) / 180;

    const x = radius * Math.cos(radian) + centerOffset.x;
    const y = radius * Math.sin(radian) + centerOffset.y;

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(
      0.4,
      Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2))
    );

    return { x, y, angle, zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem?.relatedIds || [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  const getStatusStyles = (status?: TimelineItem["status"]): string => {
    switch (status) {
      case "completed":
        return "text-white bg-black border-white";
      case "in-progress":
        return "text-black bg-white border-black";
      case "pending":
        return "text-white bg-black/40 border-white/50";
      default:
        return "text-white bg-black/40 border-white/50";
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center overflow-hidden relative"
      style={{ backgroundColor: 'transparent' }}
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{
            perspective: "1000px",
            transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
          }}
        >
          {/* Centro - adaptado para preto e branco */}
          <div className="absolute w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center z-10 border border-white/30">
            <div className="absolute w-20 h-20 rounded-full border border-white/20 animate-ping opacity-70"></div>
            <div
              className="absolute w-24 h-24 rounded-full border border-white/10 animate-ping opacity-50"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-md"></div>
          </div>

          <div className="absolute w-96 h-96 rounded-full border border-white/10"></div>

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const Icon = item.icon;

            const nodeStyle = {
              transform: `translate(${position.x}px, ${position.y}px)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              opacity: isExpanded ? 1 : position.opacity,
            };

            return (
              <div
                key={item.id}
                ref={(el) => (nodeRefs.current[item.id] = el)}
                className="absolute transition-all duration-700 cursor-pointer"
                style={nodeStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              >
                <div
                  className={cn(
                    "absolute rounded-full -inset-1",
                    isPulsing && "animate-pulse duration-1000"
                  )}
                  style={{
                    background: `radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)`,
                    width: `${(item.energy || 50) * 0.5 + 40}px`,
                    height: `${(item.energy || 50) * 0.5 + 40}px`,
                    left: `-${((item.energy || 50) * 0.5 + 40 - 40) / 2}px`,
                    top: `-${((item.energy || 50) * 0.5 + 40 - 40) / 2}px`,
                  }}
                ></div>

                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 transform",
                    isExpanded && "scale-150"
                  )}
                  style={{
                    backgroundColor: isExpanded 
                      ? 'var(--card)' 
                      : isRelated 
                        ? 'var(--accent)' 
                        : 'var(--card)',
                    color: isExpanded 
                      ? 'var(--foreground)' 
                      : 'var(--foreground)',
                    borderColor: isExpanded 
                      ? 'var(--ring)' 
                      : 'var(--border)',
                    boxShadow: isExpanded 
                      ? 'var(--shadow-lg)' 
                      : 'var(--shadow-sm)',
                  }}
                >
                  <Icon size={16} style={{ color: 'inherit' }} />
                </div>

                <div
                  className={cn(
                    "absolute top-12 whitespace-nowrap text-xs font-semibold tracking-wider transition-all duration-300",
                    isExpanded && "scale-125"
                  )}
                  style={{
                    color: isExpanded ? 'var(--foreground)' : 'var(--muted-foreground)',
                  }}
                >
                  {item.title}
                </div>

                {isExpanded && (
                  <Card 
                    className="absolute top-20 left-1/2 -translate-x-1/2 w-64 backdrop-blur-lg overflow-visible z-50"
                    style={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      boxShadow: 'var(--shadow-xl)',
                    }}
                  >
                    <div 
                      className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3"
                      style={{ backgroundColor: 'var(--border)' }}
                    ></div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        {item.status && (
                          <Badge
                            className={cn("px-2 text-xs", getStatusStyles(item.status))}
                          >
                            {item.status === "completed"
                              ? "COMPLETO"
                              : item.status === "in-progress"
                              ? "EM PROGRESSO"
                              : "PENDENTE"}
                          </Badge>
                        )}
                        {item.date && (
                          <span className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>
                            {item.date}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-sm mt-2" style={{ color: 'var(--foreground)' }}>
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {item.content && <p>{item.content}</p>}

                      {item.energy !== undefined && (
                        <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="flex items-center" style={{ color: 'var(--muted-foreground)' }}>
                              Nível
                            </span>
                            <span className="font-mono" style={{ color: 'var(--foreground)' }}>{item.energy}%</span>
                          </div>
                          <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--muted)' }}>
                            <div
                              className="h-full"
                              style={{ 
                                width: `${item.energy}%`,
                                backgroundColor: 'var(--primary)',
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {item.link && (
                        <div className="mt-4">
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemClick(item);
                            }}
                          >
                            Acessar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

