import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as PieChartIcon } from 'lucide-react';

const STATUS_COLORS = {
  active: '#22c55e',
  returned: '#3b82f6',
  lost: '#ef4444',
  damaged: '#f97316',
  retired: '#6b7280'
};

export default function AssetStatusPieChart({ data, title = 'Asset Status Distribution', onSegmentClick }) {
  // Transform data object to array format for recharts
  const chartData = Object.entries(data || {}).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    status,
    fill: STATUS_COLORS[status] || '#9ca3af'
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    if (percent < 0.05) return null; // Don't show labels for small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const handleClick = (data) => {
    if (onSegmentClick && data?.status) {
      onSegmentClick(data.status);
    }
  };

  return (
    <Card className="glass-panel rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="icon-box icon-box-sm bg-primary/10 border-primary/20">
            <PieChartIcon className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <PieChartIcon className="h-12 w-12 mb-2 opacity-30" />
            <p className="text-sm">No data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                innerRadius={50}
                dataKey="value"
                onClick={handleClick}
                className={onSegmentClick ? 'cursor-pointer' : ''}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} className={onSegmentClick ? 'hover:opacity-80 transition-opacity' : ''} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [value, 'Assets']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
