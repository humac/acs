import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, XCircle, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  pass: {
    icon: CheckCircle2,
    color: 'text-success',
    bg: 'bg-success/10 border-success/20'
  },
  warn: {
    icon: AlertTriangle,
    color: 'text-warning',
    bg: 'bg-warning/10 border-warning/20'
  },
  fail: {
    icon: XCircle,
    color: 'text-destructive',
    bg: 'bg-destructive/10 border-destructive/20'
  }
};

export default function ComplianceChecklist({ items, title = 'SOC2 Compliance Checklist' }) {
  if (!items || items.length === 0) {
    return (
      <Card className="glass-panel rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="icon-box icon-box-sm bg-muted/30 border-muted/20">
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No checklist items available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compliance thresholds
  const COMPLIANCE_THRESHOLDS = {
    EXCELLENT: 80,
    GOOD: 60
  };

  // Calculate completion stats
  const passCount = items.filter(item => item.status === 'pass').length;
  const warnCount = items.filter(item => item.status === 'warn').length;
  const failCount = items.filter(item => item.status === 'fail').length;
  const total = items.length;
  const completionRate = Math.round((passCount / total) * 100);

  const getCompletionColor = () => {
    if (completionRate >= COMPLIANCE_THRESHOLDS.EXCELLENT) return 'text-success';
    if (completionRate >= COMPLIANCE_THRESHOLDS.GOOD) return 'text-warning';
    return 'text-destructive';
  };

  const getIconVariant = () => {
    if (completionRate >= COMPLIANCE_THRESHOLDS.EXCELLENT) return 'bg-success/10 border-success/20 text-success';
    if (completionRate >= COMPLIANCE_THRESHOLDS.GOOD) return 'bg-warning/10 border-warning/20 text-warning';
    return 'bg-destructive/10 border-destructive/20 text-destructive';
  };

  return (
    <Card className="glass-panel rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('icon-box icon-box-sm', getIconVariant())}>
              <ClipboardCheck className="h-4 w-4" />
            </div>
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <div className="text-sm font-medium">
            <span className="text-muted-foreground">Completion: </span>
            <span className={getCompletionColor()}>
              {completionRate}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item, index) => {
            const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.warn;
            const Icon = config.icon;

            return (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border',
                  config.bg
                )}
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.item}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-around text-center">
          <div>
            <div className="text-2xl font-bold text-success">{passCount}</div>
            <div className="caption-label">Passing</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-warning">{warnCount}</div>
            <div className="caption-label">Warnings</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-destructive">{failCount}</div>
            <div className="caption-label">Failing</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
