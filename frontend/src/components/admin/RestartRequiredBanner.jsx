import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw } from 'lucide-react';

const RestartRequiredBanner = ({ className }) => (
  <Alert className={`glow-warning border-0 ${className || ''}`}>
    <RefreshCw className="h-4 w-4" />
    <AlertTitle className="text-sm font-semibold">Restart Required</AlertTitle>
    <AlertDescription className="text-sm">
      Changes to these settings require a backend restart to take effect.
    </AlertDescription>
  </Alert>
);

export default RestartRequiredBanner;
