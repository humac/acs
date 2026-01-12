import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  Shield,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MFASetupModal = ({ open, onClose, onComplete, getAuthHeaders }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  const steps = ['Scan QR Code', 'Verify Setup', 'Save Backup Codes'];

  const handleStart = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/mfa/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start MFA enrollment');
      }

      setQrCode(data.qrCode);
      setSecret(data.secret);
      setActiveStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/mfa/verify-enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ token: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }

      setBackupCodes(data.backupCodes);
      setActiveStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete();
    handleReset();
  };

  const handleReset = () => {
    setActiveStep(0);
    setQrCode('');
    setSecret('');
    setVerificationCode('');
    setBackupCodes([]);
    setError('');
    setCopiedSecret(false);
    setCopiedBackupCodes(false);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedBackupCodes(true);
    setTimeout(() => setCopiedBackupCodes(false), 2000);
  };

  const handleDialogClose = () => {
    if (activeStep === 2) {
      // Force user to acknowledge backup codes
      return;
    }
    handleReset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleDialogClose()}>
      <DialogContent className="glass-overlay sm:max-w-[500px]" onEscapeKeyDown={(e) => activeStep === 2 && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Set Up Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-4">
          {steps.map((_, index) => (
            <div key={index} className="flex items-center flex-1">
              <div
                className={cn(
                  "h-2 rounded-full flex-1 transition-colors",
                  index <= activeStep ? "glow-primary bg-primary" : "glow-muted bg-muted"
                )}
              />
              {index < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
              )}
            </div>
          ))}
        </div>

        {error && (
          <Alert className="glow-destructive rounded-xl">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 0: Initial state */}
        {activeStep === 0 && (
          <div className="space-y-4">
            <p className="text-sm">
              Two-factor authentication adds an extra layer of security to your account.
            </p>
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                You'll need an authenticator app on your phone such as:
              </p>
              <ul className="ml-6 space-y-1 text-sm">
                <li>• Google Authenticator</li>
                <li>• Microsoft Authenticator</li>
                <li>• Authy</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 1: QR Code Display */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <p className="text-sm">
              Scan this QR code with your authenticator app:
            </p>

            {qrCode && (
              <div className="flex justify-center py-4">
                <div className="glass-panel rounded-xl p-6">
                  <img src={qrCode} alt="MFA QR Code" className="max-w-[200px]" />
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <Label className="caption-label">
                Or enter this code manually:
              </Label>
              <div className="glass-panel rounded-lg p-3 relative">
                <code className="text-sm break-all font-mono">{secret}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 h-7 w-7 p-0 btn-interactive"
                  onClick={handleCopySecret}
                >
                  {copiedSecret ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification-code">Enter 6-digit code from app</Label>
              <Input
                id="verification-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step 2: Backup Codes */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <Alert className="glow-warning rounded-xl">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-1">
                  Save these backup codes in a secure place!
                </p>
                <p className="text-sm mt-1 opacity-90">
                  You can use these codes to access your account if you lose access to your authenticator app.
                </p>
              </AlertDescription>
            </Alert>

            <div className="glass-panel rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <Badge
                    key={index}
                    className="font-mono text-xs justify-center py-1.5 glow-muted"
                  >
                    {code}
                  </Badge>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full btn-interactive"
                onClick={handleCopyBackupCodes}
              >
                {copiedBackupCodes ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All Codes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {activeStep === 0 && (
            <>
              <Button variant="outline" onClick={handleDialogClose} className="btn-interactive">
                Cancel
              </Button>
              <Button onClick={handleStart} disabled={loading} className="btn-interactive">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Get Started'
                )}
              </Button>
            </>
          )}

          {activeStep === 1 && (
            <>
              <Button variant="outline" onClick={handleDialogClose} className="btn-interactive">
                Cancel
              </Button>
              <Button
                onClick={handleVerify}
                disabled={loading || verificationCode.length !== 6}
                className="btn-interactive"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Enable'
                )}
              </Button>
            </>
          )}

          {activeStep === 2 && (
            <Button onClick={handleComplete} className="w-full btn-interactive">
              I've Saved My Backup Codes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MFASetupModal;
