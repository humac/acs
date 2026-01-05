import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Activity } from 'lucide-react';

const ACTION_COLORS = {
  CREATE: '#22c55e',
  UPDATE: '#3b82f6',
  STATUS_CHANGE: '#f59e0b',
  DELETE: '#ef4444'
};

export default function ActivityAreaChart({ data, title = 'Activity Over Time', showPeriodSelector = true }) {
  const [period, setPeriod] = useState(30);

  // Filter data by period (last N days) only if using internal period selector
  const filteredData = showPeriodSelector ? (data || []).slice(-period) : (data || []);

  return (
    <Card className="glass-panel rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="icon-box icon-box-sm bg-warning/10 border-warning/20">
              <Activity className="h-4 w-4 text-warning" />
            </div>
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          {showPeriodSelector && (
            <div className="flex gap-1">
              <Button
                variant={period === 7 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(7)}
                className="h-7 text-xs"
                aria-pressed={period === 7}
              >
                7D
              </Button>
              <Button
                variant={period === 30 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(30)}
                className="h-7 text-xs"
                aria-pressed={period === 30}
              >
                30D
              </Button>
              <Button
                variant={period === 90 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(90)}
                className="h-7 text-xs"
                aria-pressed={period === 90}
              >
                90D
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <Activity className="h-12 w-12 mb-2 opacity-30" />
            <p className="text-sm">No activity data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={filteredData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorCREATE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACTION_COLORS.CREATE} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={ACTION_COLORS.CREATE} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorUPDATE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACTION_COLORS.UPDATE} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={ACTION_COLORS.UPDATE} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSTATUS_CHANGE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACTION_COLORS.STATUS_CHANGE} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={ACTION_COLORS.STATUS_CHANGE} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDELETE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACTION_COLORS.DELETE} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={ACTION_COLORS.DELETE} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="CREATE"
                stackId="1"
                stroke={ACTION_COLORS.CREATE}
                fillOpacity={1}
                fill="url(#colorCREATE)"
              />
              <Area
                type="monotone"
                dataKey="UPDATE"
                stackId="1"
                stroke={ACTION_COLORS.UPDATE}
                fillOpacity={1}
                fill="url(#colorUPDATE)"
              />
              <Area
                type="monotone"
                dataKey="STATUS_CHANGE"
                stackId="1"
                stroke={ACTION_COLORS.STATUS_CHANGE}
                fillOpacity={1}
                fill="url(#colorSTATUS_CHANGE)"
              />
              <Area
                type="monotone"
                dataKey="DELETE"
                stackId="1"
                stroke={ACTION_COLORS.DELETE}
                fillOpacity={1}
                fill="url(#colorDELETE)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
