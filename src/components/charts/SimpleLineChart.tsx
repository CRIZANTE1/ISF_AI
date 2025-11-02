interface SimpleLineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

const SimpleLineChart = ({ data, height = 200, color = '#10B981' }: SimpleLineChartProps) => {
  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value), 0);
  const range = max - min || 1;
  const width = 100 / data.length;

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <svg viewBox={`0 0 100 ${height}`} className="w-full h-full">
        <polyline
          points={data
            .map((item, index) => {
              const x = (index * width) + (width / 2);
              const y = height - ((item.value - min) / range) * (height - 20) - 10;
              return `${x},${y}`;
            })
            .join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {data.map((item, index) => {
          const x = (index * width) + (width / 2);
          const y = height - ((item.value - min) / range) * (height - 20) - 10;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={color}
            />
          );
        })}
      </svg>
      <div className="flex justify-between text-xs text-light-text-secondary dark:text-dark-text-secondary mt-2">
        {data.map((item, index) => (
          <div key={index} className="flex-1 text-center truncate">
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleLineChart;

