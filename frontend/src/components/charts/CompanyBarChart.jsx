import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f97316', '#14b8a6', '#a855f7'];

export default function CompanyBarChart({ data, title = 'Assets by Company', topN = 10, onBarClick }) {
  // Transform and sort data
  const chartData = (data || [])
    .map((item, index) => ({
      name: item.name,
      count: item.count,
      fill: COLORS[index % COLORS.length]
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);

  const handleClick = (data) => {
    if (onBarClick && data?.name) {
      onBarClick(data.name);
    }
  };

  return (
    <Card className="glass-panel rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="icon-box icon-box-sm bg-info/10 border-info/20">
            <Building2 className="h-4 w-4 text-info" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <Building2 className="h-12 w-12 mb-2 opacity-30" />
            <p className="text-sm">No data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis
                dataKey="name"
                type="category"
                width={150}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.length > 20 ? value.substring(0, 17) + '...' : value}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                labelFormatter={(label) => label}
                formatter={(value) => [`${value} assets`]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} onClick={handleClick} className={onBarClick ? 'cursor-pointer' : ''}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} className={onBarClick ? 'hover:opacity-80 transition-opacity' : ''} />
                ))}
                <LabelList dataKey="count" position="right" fill="hsl(var(--foreground))" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
