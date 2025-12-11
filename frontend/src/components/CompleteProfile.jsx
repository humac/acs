import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, UserCheck, Loader2 } from 'lucide-react';

const CompleteProfile = () => {
  const { user, updateUser, getAuthHeaders } = useAuth();
  const [formData, setFormData] = useState({
    manager_first_name: '',
    manager_last_name: '',
    manager_email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Apply theme from localStorage on mount
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.manager_first_name || !formData.manager_last_name || !formData.manager_email) {
      setError('All fields are required');
      return;
    }

    if (!validateEmail(formData.manager_email)) {
      setError('Please provide a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete profile');
      }

      // Update user context with new data
      updateUser(data.user);
    } catch (err) {
      console.error('Complete profile error:', err);
      setError(err.message || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <UserCheck className="h-6 w-6" />
            </div>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>
              To complete your account setup, please provide your manager's information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="manager_first_name">Manager First Name</Label>
                <Input
                  id="manager_first_name"
                  name="manager_first_name"
                  type="text"
                  value={formData.manager_first_name}
                  onChange={handleChange}
                  placeholder="John"
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager_last_name">Manager Last Name</Label>
                <Input
                  id="manager_last_name"
                  name="manager_last_name"
                  type="text"
                  value={formData.manager_last_name}
                  onChange={handleChange}
                  placeholder="Smith"
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager_email">Manager Email</Label>
                <Input
                  id="manager_email"
                  name="manager_email"
                  type="email"
                  value={formData.manager_email}
                  onChange={handleChange}
                  placeholder="john.smith@company.com"
                  disabled={loading}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing Profile...
                  </>
                ) : (
                  'Complete Profile'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompleteProfile;
