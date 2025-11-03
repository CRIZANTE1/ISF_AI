interface SimpleBarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  maxValue?: number;
}

const SimpleBarChart = ({ data, height = 200, maxValue }: SimpleBarChartProps) => {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  const barHeight = height / data.length;

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <div className="relative h-full flex flex-col justify-between">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-24 text-xs text-light-text-secondary dark:text-dark-text-secondary truncate">
              {item.label}
            </div>
            <div className="flex-1 relative bg-light-surface dark:bg-dark-surface rounded-full h-6 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ 
                  backgroundColor: item.color || '#00C8FF',
                  width: `${(item.value / max) * 100}%`
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-light-text-primary dark:text-dark-text-primary">
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleBarChart;

