import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, refreshUser, user, updateUser } = useAuth();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [tokenType, setTokenType] = useState('registration');
  const [newEmail, setNewEmail] = useState(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      setStatus('loading');

      // First check if token is valid
      const checkResponse = await fetch(`/api/auth/verify-email-token/${token}`);
      const checkData = await checkResponse.json();

      if (!checkResponse.ok || !checkData.valid) {
        setStatus('error');
        setMessage(checkData.error || 'Invalid or expired verification token');
        return;
      }

      setTokenType(checkData.tokenType);

      // Verify the email
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || 'Failed to verify email');
        return;
      }

      setStatus('success');
      setMessage(data.message);
      if (data.newEmail) {
        setNewEmail(data.newEmail);
      }

      // Refresh user data if authenticated
      if (isAuthenticated && refreshUser) {
        await refreshUser();
        // Force update user state to ensure UI reflects the change immediately
        if (updateUser && user) {
          updateUser({ ...user, email_verified: true });
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('An error occurred while verifying your email');
    }
  };

  const handleContinue = () => {
    if (isAuthenticated) {
      navigate('/');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass-panel">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <div className="icon-box icon-box-lg bg-primary/10 border-primary/20">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="icon-box icon-box-lg glow-success">
                <CheckCircle className="h-8 w-8" />
              </div>
            )}
            {status === 'error' && (
              <div className="icon-box icon-box-lg glow-destructive">
                <XCircle className="h-8 w-8" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Verifying Email...'}
            {status === 'success' && (tokenType === 'email_change' ? 'Email Changed!' : 'Email Verified!')}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your email address.'}
            {status === 'success' && tokenType === 'email_change' && newEmail && (
              <>Your email has been changed to <strong>{newEmail}</strong>.</>
            )}
            {status === 'success' && tokenType === 'registration' && (
              'Your email address has been verified. You can now access all features.'
            )}
            {status === 'error' && message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <Button
              onClick={handleContinue}
              className="w-full btn-interactive"
            >
              {isAuthenticated ? 'Continue to Dashboard' : 'Go to Login'}
            </Button>
          )}
          {status === 'error' && (
            <div className="space-y-2">
              <Button
                onClick={() => verifyEmail()}
                variant="outline"
                className="w-full btn-interactive"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={handleContinue}
                variant="ghost"
                className="w-full btn-interactive"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
              </Button>
            </div>
          )}
          {status === 'loading' && (
            <div className="text-center text-muted-foreground text-sm">
              This may take a moment...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
