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
  description,
  onClick
}) {
  const variants = {
    default: 'border-border/50',
    success: 'border-success/30 bg-success/5 dark:bg-success/10',
    warning: 'border-warning/30 bg-warning/5 dark:bg-warning/10',
    danger: 'border-destructive/30 bg-destructive/5 dark:bg-destructive/10',
    info: 'border-info/30 bg-info/5 dark:bg-info/10'
  };

  const iconVariants = {
    default: 'bg-primary/10 border-primary/20 text-primary',
    success: 'bg-success/10 border-success/20 text-success',
    warning: 'bg-warning/10 border-warning/20 text-warning',
    danger: 'bg-destructive/10 border-destructive/20 text-destructive',
    info: 'bg-info/10 border-info/20 text-info'
  };

  const trendColors = {
    up: 'text-success',
    down: 'text-destructive'
  };

  return (
    <Card
      className={cn(
        'glass-panel rounded-2xl transition-all duration-200',
        variants[variant],
        onClick && 'cursor-pointer hover:scale-[1.02] hover:shadow-lg'
      )}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="caption-label">{title}</p>
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
            <div className={cn('icon-box icon-box-md', iconVariants[variant])}>
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
