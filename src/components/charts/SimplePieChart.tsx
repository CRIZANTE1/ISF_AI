interface SimplePieChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

const SimplePieChart = ({ data, size = 200 }: SimplePieChartProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const center = size / 2;
  const radius = size / 2 - 10;

  let currentAngle = -90; // Start from top
  const paths: JSX.Element[] = [];
  const labels: JSX.Element[] = [];

  data.forEach((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    
    paths.push(
      <path
        key={index}
        d={pathData}
        fill={item.color}
        stroke="white"
        strokeWidth="2"
      />
    );
    
    // Label position
    const labelAngle = (startAngle + angle / 2) * (Math.PI / 180);
    const labelRadius = radius * 0.7;
    const labelX = center + labelRadius * Math.cos(labelAngle);
    const labelY = center + labelRadius * Math.sin(labelAngle);
    
    labels.push(
      <text
        key={index}
        x={labelX}
        y={labelY}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs font-semibold fill-white"
      >
        {percentage.toFixed(0)}%
      </text>
    );
    
    currentAngle = endAngle;
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {paths}
        {labels}
      </svg>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm">{item.label}: {item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimplePieChart;

