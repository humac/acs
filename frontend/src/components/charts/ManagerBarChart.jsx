import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function ManagerBarChart({ data, title = 'Assets by Manager', onBarClick }) {
  // Transform data
  const chartData = (data || []).map((item, index) => ({
    name: item.name || item.email,
    email: item.email,
    count: item.count,
    fill: COLORS[index % COLORS.length]
  }));

  const handleClick = (data) => {
    if (onBarClick && data?.email) {
      onBarClick(data.email);
    }
  };

  return (
    <Card className="glass-panel rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="icon-box icon-box-sm bg-success/10 border-success/20">
            <Users className="h-4 w-4 text-success" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <Users className="h-12 w-12 mb-2 opacity-30" />
            <p className="text-sm">No data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
                tickFormatter={(value) => value.length > 15 ? value.substring(0, 12) + '...' : value}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                labelFormatter={(label) => label}
                formatter={(value) => [`${value} assets`]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} onClick={handleClick} className={onBarClick ? 'cursor-pointer' : ''}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} className={onBarClick ? 'hover:opacity-80 transition-opacity' : ''} />
                ))}
                <LabelList dataKey="count" position="top" fill="hsl(var(--foreground))" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
