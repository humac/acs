import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';

const SettingsField = ({ 
  label, 
  description,
  envVar, 
  managedByEnv = false,
  required = false,
  children 
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 flex-wrap">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {managedByEnv && (
        <Badge variant="secondary" className="text-xs gap-1">
          <Lock className="h-3 w-3" />
          {envVar}
        </Badge>
      )}
    </div>
    {children}
    {description && (
      <p className="text-xs text-muted-foreground">{description}</p>
    )}
  </div>
);

export default SettingsField;
