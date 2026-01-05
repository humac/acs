import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

const SettingsSection = ({ 
  icon: Icon, 
  title, 
  description, 
  badge, // "Requires Restart", "Managed by ENV", etc.
  enabled,
  onEnabledChange,
  showToggle = false,
  children,
  actions // Buttons like "Save", "Test Connection"
}) => (
  <Card variant="glass" className="mb-6">
    <CardHeader className="pb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="icon-box icon-box-sm bg-primary/10 border-primary/20">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              {title}
              {badge && <Badge variant="warning" className="text-xs">{badge}</Badge>}
            </CardTitle>
            {description && (
              <CardDescription className="text-sm mt-1">{description}</CardDescription>
            )}
          </div>
        </div>
        {showToggle && (
          <Switch
            checked={enabled}
            onCheckedChange={onEnabledChange}
          />
        )}
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      {children}
    </CardContent>
    {actions && (
      <CardFooter className="border-t border-border/50 pt-4 flex justify-end gap-2">
        {actions}
      </CardFooter>
    )}
  </Card>
);

export default SettingsSection;
