import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../ui/use-toast';

const SignIn = () => {
  const navigate = useNavigate();
  const { login, verifyMfaLogin } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaSessionId, setMfaSessionId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [showMfaDialog, setShowMfaDialog] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.email, formData.password);

    if (result.mfaRequired) {
      if (!result.mfaSessionId) {
        setError('Unable to start verification. Please try again.');
        setLoading(false);
        return;
      }
      setMfaSessionId(result.mfaSessionId);
      setMfaCode('');
      setUseBackupCode(false);
      setMfaError('');
      setShowMfaDialog(true);
      toast({
        title: 'Additional verification required',
        description: 'Enter your MFA code to finish signing in.',
      });
    } else if (!result.success) {
      setError(result.error || 'Unable to sign in');
    } else {
      toast({ title: 'Welcome back', description: 'Signed in successfully.' });
      navigate('/', { replace: true });
    }
    setLoading(false);
  };

  const handleVerifyMfa = async (event) => {
    event.preventDefault();
    setMfaLoading(true);
    setMfaError('');

    const result = await verifyMfaLogin(mfaSessionId, mfaCode, useBackupCode);
    if (!result.success) {
      setMfaError(result.error || 'Invalid verification code');
    } else {
      setShowMfaDialog(false);
      setMfaCode('');
      setUseBackupCode(false);
      toast({ title: 'Verification complete', description: 'Signed in successfully.' });
      navigate('/', { replace: true });
    }
    setMfaLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-primary shadow-sm ring-1 ring-slate-200">
            Modern Asset Portal
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-slate-900">
            Welcome back 👋
            <span className="block text-lg font-normal text-muted-foreground mt-3">
              Track every laptop, stay audit-ready, and keep your inventory healthy.
            </span>
          </h1>
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="font-semibold text-slate-900">Real-time visibility</p>
              <p className="mt-1 text-sm">Monitor laptop availability and assignments instantly.</p>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="font-semibold text-slate-900">Fast check-ins</p>
              <p className="mt-1 text-sm">Register and assign hardware without leaving the dashboard.</p>
            </div>
          </div>
        </div>

        <Card className="border-slate-200 shadow-xl backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Secure Access</p>
                <CardTitle className="mt-1 text-2xl">Sign in to your workspace</CardTitle>
                <CardDescription>Use your company credentials to continue.</CardDescription>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <LogIn className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 border border-rose-100">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showMfaDialog} onOpenChange={setShowMfaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Two-factor authentication</DialogTitle>
            <p className="text-sm text-muted-foreground">Enter the code from your authenticator app to continue.</p>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleVerifyMfa}>
            {mfaError && (
              <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 border border-rose-100">
                {mfaError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="mfaCode">{useBackupCode ? 'Backup code' : 'Verification code'}</Label>
              <Input
                id="mfaCode"
                name="mfaCode"
                type="text"
                inputMode={useBackupCode ? 'text' : 'numeric'}
                maxLength={useBackupCode ? 9 : 6}
                placeholder={useBackupCode ? 'XXXX-XXXX' : '123456'}
                value={mfaCode}
                onChange={(e) => {
                  const value = useBackupCode ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, '').slice(0, 6);
                  setMfaCode(value);
                }}
                required
              />
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setMfaCode('');
                }}
              >
                {useBackupCode ? 'Use authenticator code instead' : 'Use backup code instead'}
              </button>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setShowMfaDialog(false)} disabled={mfaLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={mfaLoading || !mfaCode.trim()}>
                {mfaLoading ? 'Verifying...' : 'Verify'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SignIn;
