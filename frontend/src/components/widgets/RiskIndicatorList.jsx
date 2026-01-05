import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const SEVERITY_ICONS = {
  high: AlertCircle,
  medium: AlertTriangle,
  low: Clock
};

const SEVERITY_COLORS = {
  high: 'text-destructive bg-destructive/10 border-destructive/20',
  medium: 'text-warning bg-warning/10 border-warning/20',
  low: 'text-muted-foreground bg-muted/30 border-muted/20'
};

const BADGE_CLASSES = {
  high: 'glow-destructive',
  medium: 'glow-warning',
  low: 'glow-muted'
};

export default function RiskIndicatorList({ risks, title = 'Risk Indicators', onItemClick }) {
  if (!risks || risks.length === 0) {
    return (
      <Card className="glass-panel rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="icon-box icon-box-sm bg-success/10 border-success/20">
              <ShieldAlert className="h-4 w-4 text-success" />
            </div>
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ShieldAlert className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium text-success">No risks identified</p>
            <p className="text-xs mt-1">All systems operating normally</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="icon-box icon-box-sm bg-destructive/10 border-destructive/20">
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {risks.map((risk, index) => {
            const Icon = SEVERITY_ICONS[risk.severity] || AlertCircle;
            const isClickable = !!onItemClick;

            return (
              <div
                key={index}
                onClick={() => isClickable && onItemClick(risk)}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border transition-colors',
                  SEVERITY_COLORS[risk.severity],
                  isClickable && 'cursor-pointer hover:shadow-sm'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{risk.type}</p>
                    {risk.description && (
                      <p className="text-xs opacity-80 mt-0.5">{risk.description}</p>
                    )}
                  </div>
                </div>
                <Badge className={cn('ml-2 rounded-full px-2.5 py-0.5 text-xs font-semibold', BADGE_CLASSES[risk.severity] || 'glow-muted')}>
                  {risk.count}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
