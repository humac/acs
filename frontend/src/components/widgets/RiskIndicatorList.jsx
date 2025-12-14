import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const SEVERITY_ICONS = {
  high: AlertCircle,
  medium: AlertTriangle,
  low: Clock
};

const SEVERITY_COLORS = {
  high: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950',
  medium: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950',
  low: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950'
};

const BADGE_VARIANTS = {
  high: 'destructive',
  medium: 'warning',
  low: 'secondary'
};

export default function RiskIndicatorList({ risks, title = 'Risk Indicators', onItemClick }) {
  if (!risks || risks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No risks identified</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
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
                <Badge variant={BADGE_VARIANTS[risk.severity] || 'secondary'} className="ml-2">
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
