import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShieldAlert, X, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ComplianceAlertBanner({ compliance, onNavigate }) {
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when compliance data changes significantly
  useEffect(() => {
    if (compliance) {
      setDismissed(false);
    }
  }, [compliance?.score, compliance?.atRiskAssets, compliance?.overdueAttestations]);

  if (dismissed || !compliance) {
    return null;
  }

  const alerts = [];

  // Critical: Compliance score below 60%
  if (compliance.score < 60) {
    alerts.push({
      type: 'critical',
      icon: ShieldAlert,
      title: 'Critical: Low Compliance Score',
      description: `Your compliance score is ${compliance.score}%. Immediate action required.`,
      action: 'compliance'
    });
  }

  // High: Lost assets
  if (compliance.atRiskAssets > 0) {
    const lostCount = compliance.riskIndicators?.find(r => r.type === 'Lost Assets')?.count || 0;
    const damagedCount = compliance.riskIndicators?.find(r => r.type === 'Damaged Assets')?.count || 0;

    if (lostCount > 0) {
      alerts.push({
        type: 'high',
        icon: AlertCircle,
        title: `${lostCount} Lost Asset${lostCount > 1 ? 's' : ''}`,
        description: 'Assets marked as lost require investigation and documentation.',
        action: 'compliance'
      });
    }

    if (damagedCount > 0) {
      alerts.push({
        type: 'medium',
        icon: AlertTriangle,
        title: `${damagedCount} Damaged Asset${damagedCount > 1 ? 's' : ''}`,
        description: 'Review damaged assets for repair or replacement.',
        action: 'compliance'
      });
    }
  }

  // Medium: Overdue attestations
  if (compliance.overdueAttestations > 0) {
    alerts.push({
      type: 'medium',
      icon: AlertTriangle,
      title: `${compliance.overdueAttestations} Overdue Attestation${compliance.overdueAttestations > 1 ? 's' : ''}`,
      description: 'Attestation campaigns have passed their due date.',
      action: 'compliance'
    });
  }

  if (alerts.length === 0) {
    return null;
  }

  // Show most critical alert
  const primaryAlert = alerts[0];
  const additionalCount = alerts.length - 1;

  const alertStyles = {
    critical: 'border-destructive/50 bg-destructive/10 text-destructive',
    high: 'border-destructive/40 bg-destructive/5 text-destructive',
    medium: 'border-warning/50 bg-warning/10 text-warning'
  };

  const iconStyles = {
    critical: 'text-destructive',
    high: 'text-destructive',
    medium: 'text-warning'
  };

  const Icon = primaryAlert.icon;

  return (
    <Alert className={cn('relative mb-4 rounded-xl', alertStyles[primaryAlert.type])}>
      <Icon className={cn('h-5 w-5', iconStyles[primaryAlert.type])} />
      <AlertTitle className="flex items-center gap-2 font-semibold">
        {primaryAlert.title}
        {additionalCount > 0 && (
          <span className="text-xs font-normal opacity-80">
            +{additionalCount} more alert{additionalCount > 1 ? 's' : ''}
          </span>
        )}
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>{primaryAlert.description}</span>
        <div className="flex items-center gap-2">
          {onNavigate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate(primaryAlert.action)}
              className="h-7 text-xs hover:bg-white/20"
            >
              View Details
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            className="h-7 w-7 hover:bg-white/20"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
