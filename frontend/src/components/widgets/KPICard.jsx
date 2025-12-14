import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  variant = 'default',
  description
}) {
  const variants = {
    default: 'border-border',
    success: 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20',
    warning: 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20',
    danger: 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20',
    info: 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20'
  };

  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400'
  };

  return (
    <Card className={cn('hover:shadow-md transition-shadow', variants[variant])}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{value}</p>
              {trend && trendValue && (
                <div className={cn('flex items-center text-sm font-medium', trendColors[trend])}>
                  {trend === 'up' ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                  <span>{trendValue}</span>
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {Icon && (
            <div className={cn(
              'p-3 rounded-lg',
              variant === 'success' && 'bg-green-100 dark:bg-green-900/30',
              variant === 'warning' && 'bg-yellow-100 dark:bg-yellow-900/30',
              variant === 'danger' && 'bg-red-100 dark:bg-red-900/30',
              variant === 'info' && 'bg-blue-100 dark:bg-blue-900/30',
              variant === 'default' && 'bg-primary/10'
            )}>
              <Icon className={cn(
                'h-6 w-6',
                variant === 'success' && 'text-green-600 dark:text-green-400',
                variant === 'warning' && 'text-yellow-600 dark:text-yellow-400',
                variant === 'danger' && 'text-red-600 dark:text-red-400',
                variant === 'info' && 'text-blue-600 dark:text-blue-400',
                variant === 'default' && 'text-primary'
              )} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
