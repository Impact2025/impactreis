'use client';

interface DataPoint {
  date: string;
  value: number;
}

interface TrendChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  showLabels?: boolean;
  label?: string;
}

export function TrendChart({
  data,
  color = '#6366f1',
  height = 120,
  showLabels = true,
  label,
}: TrendChartProps) {
  // Filter out invalid data points
  const validData = (data || []).filter(
    (d) => d && typeof d.value === 'number' && !isNaN(d.value)
  );

  if (validData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm"
        style={{ height }}
      >
        Nog geen data beschikbaar
      </div>
    );
  }

  const values = validData.map((d) => d.value);
  const maxValue = Math.max(...values, 10);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;

  // Calculate trend (up, down, stable)
  const firstHalf = validData.slice(0, Math.floor(validData.length / 2));
  const secondHalf = validData.slice(Math.floor(validData.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b.value, 0) / (firstHalf.length || 1);
  const secondAvg = secondHalf.reduce((a, b) => a + b.value, 0) / (secondHalf.length || 1);
  const trend = secondAvg > firstAvg + 0.3 ? 'up' : secondAvg < firstAvg - 0.3 ? 'down' : 'stable';

  // Create SVG path
  const padding = 20;
  const chartWidth = 100; // percentage
  const chartHeight = height - (showLabels ? 30 : 10);

  const points = validData.map((d, i) => {
    // Handle single data point edge case
    const x = validData.length === 1 ? 50 : (i / (validData.length - 1)) * 100;
    const y = chartHeight - ((d.value - minValue) / range) * (chartHeight - padding);
    return { x: isNaN(x) ? 50 : x, y: isNaN(y) ? chartHeight / 2 : y, ...d };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Area fill path (handle single point case)
  const lastPoint = points[points.length - 1];
  const areaD = points.length > 0
    ? `${pathD} L ${lastPoint?.x || 50} ${chartHeight} L 0 ${chartHeight} Z`
    : '';

  return (
    <div className="relative" style={{ height }}>
      {label && (
        <div className="absolute top-0 left-0 text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
        </div>
      )}

      <svg
        viewBox={`0 0 100 ${chartHeight}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: chartHeight }}
      >
        {/* Grid lines */}
        <line
          x1="0"
          y1={chartHeight / 2}
          x2="100"
          y2={chartHeight / 2}
          stroke="currentColor"
          strokeWidth="0.3"
          className="text-slate-200 dark:text-slate-700"
        />

        {/* Area fill */}
        <path
          d={areaD}
          fill={color}
          fillOpacity="0.1"
        />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill={color}
            className="opacity-0 hover:opacity-100 transition-opacity"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* Labels */}
      {showLabels && validData.length > 0 && (
        <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
          <span>{validData[0]?.date ? new Date(validData[0].date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : ''}</span>
          <span
            className={`font-medium ${
              trend === 'up'
                ? 'text-emerald-600 dark:text-emerald-400'
                : trend === 'down'
                ? 'text-red-500'
                : 'text-slate-500'
            }`}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {validData[validData.length - 1]?.value?.toFixed(1) || '0'}
          </span>
          <span>{validData[validData.length - 1]?.date ? new Date(validData[validData.length - 1].date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : ''}</span>
        </div>
      )}
    </div>
  );
}

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  maxValue?: number;
}

export function BarChart({ data, height = 200, maxValue }: BarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div
            className="w-full rounded-t-lg transition-all duration-500"
            style={{
              height: `${(item.value / max) * 100}%`,
              backgroundColor: item.color || '#6366f1',
              minHeight: item.value > 0 ? '4px' : '0',
            }}
          />
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-full">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
}

export function DonutChart({ data, size = 120, thickness = 20 }: DonutChartProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-400 text-sm"
        style={{ width: size, height: size }}
      >
        Geen data
      </div>
    );
  }

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {data.map((item, i) => {
          const percentage = item.value / total;
          const strokeDasharray = `${percentage * circumference} ${circumference}`;
          const strokeDashoffset = -currentOffset * circumference;
          currentOffset += percentage;

          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={thickness}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-slate-800 dark:text-white">{total}</span>
      </div>
    </div>
  );
}

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
  color = '#6366f1',
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-slate-800 dark:text-white">
          {Math.round(progress)}%
        </span>
        {label && (
          <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
        )}
      </div>
    </div>
  );
}
