"use client";

/**
 * @author: @kokonutui
 * @description: Apple Activity Card
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 * 
 * Adaptado para ISF IA - Tema preto e branco
 */
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";
import { useTranslation } from "../../hooks/useTranslation";

interface ActivityData {
  label: string;
  value: number;
  color: string;
  size: number;
  current: number;
  target: number;
  unit: string;
}

interface CircleProgressProps {
  data: ActivityData;
  index: number;
}

interface AppleActivityCardProps {
  title?: string;
  className?: string;
  data?: {
    total?: number;
    ok?: number;
    vencido?: number;
    pendente?: number;
  };
}

const CircleProgress = ({ data, index }: CircleProgressProps) => {
  const strokeWidth = 16;
  const radius = (data.size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = ((100 - data.value) / 100) * circumference;
  const gradientId = `gradient-${data.label.toLowerCase()}`;
  const gradientUrl = `url(#${gradientId})`;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: index * 0.2, ease: "easeOut" }}
    >
      <div className="relative">
        <svg
          width={data.size}
          height={data.size}
          viewBox={`0 0 ${data.size} ${data.size}`}
          className="transform -rotate-90"
          aria-label={`${data.label} Activity Progress - ${data.value}%`}
        >
          <title>{`${data.label} Activity Progress - ${data.value}%`}</title>
          <defs>
            <linearGradient
              id={gradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{
                  stopColor: data.color,
                  stopOpacity: 1,
                }}
              />
              <stop
                offset="100%"
                style={{
                  stopColor: data.color === "#53D769" 
                    ? "#A3F900"  // Verde mais claro para OK
                    : data.color === "#FC3D39"
                    ? "#FF6B8B"  // Vermelho mais claro para VENCIDO
                    : "#FFE66D", // Amarelo mais claro para PENDENTE
                  stopOpacity: 1,
                }}
              />
            </linearGradient>
          </defs>
          <circle
            cx={data.size / 2}
            cy={data.size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-white/20"
          />
          <motion.circle
            cx={data.size / 2}
            cy={data.size / 2}
            r={radius}
            fill="none"
            stroke={gradientUrl}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progress }}
            transition={{
              duration: 1.8,
              delay: index * 0.2,
              ease: "easeInOut",
            }}
            strokeLinecap="round"
            style={{
              filter: "drop-shadow(0 0 6px rgba(255,255,255,0.15))",
            }}
          />
        </svg>
      </div>
    </motion.div>
  );
};

const DetailedActivityInfo = ({ activities }: { activities: ActivityData[] }) => {
  return (
    <motion.div
      className="flex flex-col gap-6 ml-8"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {activities.map((activity) => (
        <motion.div key={activity.label} className="flex flex-col">
          <span className="text-sm font-medium text-white/60">
            {activity.label}
          </span>
          <span
            className="text-2xl font-semibold text-white"
            style={{ color: activity.color }}
          >
            {activity.current}/{activity.target}
            {activity.unit && (
              <span className="text-base ml-1 text-white/60">
                {activity.unit}
              </span>
            )}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
};

export function AppleActivityCard({
  title,
  className,
  data,
}: AppleActivityCardProps) {
  const { t } = useTranslation();
  const cardTitle = title || t('activity.title');
  
  // Calcular valores baseados nos dados fornecidos ou usar valores padrão
  const total = data?.total || 0;
  const ok = data?.ok || 0;
  const vencido = data?.vencido || 0;
  const pendente = data?.pendente || 0;

  // Calcular percentuais
  const okPercent = total > 0 ? Math.round((ok / total) * 100) : 0;
  const vencidoPercent = total > 0 ? Math.round((vencido / total) * 100) : 0;
  const pendentePercent = total > 0 ? Math.round((pendente / total) * 100) : 0;

  // Cores: Verde para OK, Vermelho para VENCIDO, Amarelo para PENDENTE
  const activities: ActivityData[] = [
    {
      label: t('equipment.statusOk', { defaultValue: 'OK' }),
      value: okPercent,
      color: "#53D769", // Verde (Apple Fitness Exercise)
      size: 200,
      current: ok,
      target: total,
      unit: "",
    },
    {
      label: t('equipment.statusExpired', { defaultValue: 'VENCIDO' }),
      value: vencidoPercent,
      color: "#FC3D39", // Vermelho (Apple Fitness Move)
      size: 160,
      current: vencido,
      target: total,
      unit: "",
    },
    {
      label: t('equipment.statusPending', { defaultValue: 'PENDENTE' }),
      value: pendentePercent,
      color: "#FFD60A", // Amarelo
      size: 120,
      current: pendente,
      target: total,
      unit: "",
    },
  ];

  return (
    <div
      className={cn(
        "relative w-full max-w-3xl mx-auto p-8 rounded-3xl",
        "bg-black/50 border border-white/10",
        "text-white",
        className
      )}
    >
      <div className="flex flex-col items-center gap-8">
        <motion.h2
          className="text-2xl font-medium text-white"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {cardTitle}
        </motion.h2>
        <div className="flex items-center">
          <div className="relative w-[180px] h-[180px]">
            {activities.map((activity, index) => (
              <CircleProgress
                key={activity.label}
                data={activity}
                index={index}
              />
            ))}
          </div>
          <DetailedActivityInfo activities={activities} />
        </div>
      </div>
    </div>
  );
}

