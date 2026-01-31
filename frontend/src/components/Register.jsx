import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UserPlus, Loader2, AlertCircle, Laptop, User, Briefcase, Lock, CheckCircle, KeyRound, Moon, Sun, ShieldX } from 'lucide-react';
import { applyPrimaryColor } from '@/utils/color';

const RegisterNew = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    manager_first_name: '',
    manager_last_name: '',
    manager_email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [brandingLogo, setBrandingLogo] = useState(null);
  const [inviteData, setInviteData] = useState(null);
  const [oidcConfig, setOidcConfig] = useState(null);
  const [inviteToken, setInviteToken] = useState(null);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [oidcLoading, setOidcLoading] = useState(false);
  const [footerLabel, setFooterLabel] = useState('SOC2 Compliance - KeyData Asset Registration System');

  // Dark mode state - default to light mode
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    // Apply theme
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Fetch auth config
    fetch('/api/auth/config')
      .then(res => res.json())
      .then(data => setRegistrationEnabled(data.registration_enabled))
      .catch(err => console.error('Failed to fetch auth config:', err));

    // Fetch branding settings
    fetch('/api/branding')
      .then(res => res.json())
      .then(data => {
        if (data.logo_data) {
          setBrandingLogo(data.logo_data);
        }
        if (data.footer_label) {
          setFooterLabel(data.footer_label);
        }
        if (data.primary_color) {
          applyPrimaryColor(data.primary_color);
        }
      })
      .catch(err => console.error('Failed to fetch branding:', err));

    // Check for invite token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setInviteToken(token);
      setLoadingInvite(true);
      // Validate the invite token
      fetch(`/api/attestation/validate-invite/${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setInviteData(data);
            // Pre-fill the form with invite data
            setFormData(prev => ({
              ...prev,
              email: data.email || '',
              first_name: data.firstName || '',
              last_name: data.lastName || ''
            }));
          } else {
            setError(data.error || 'Invalid or expired invite token');
          }
        })
        .catch(err => {
          console.error('Failed to validate invite:', err);
          setError('Failed to validate invite token');
        })
        .finally(() => setLoadingInvite(false));
    }

    // Fetch OIDC config
    fetch('/api/auth/oidc/config')
      .then(res => res.json())
      .then(data => {
        if (data.enabled) {
          setOidcConfig(data);
        }
      })
      .catch(err => console.error('Failed to fetch OIDC config:', err));
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const result = await register(
      formData.email,
      formData.password,
      formData.first_name,
      formData.last_name,
      formData.manager_first_name,
      formData.manager_last_name,
      formData.manager_email,
      inviteToken
    );

    if (!result.success) {
      setError(result.error);
      setLoading(false);
    } else {
      // Check if user should be redirected to attestations
      if (result.redirectToAttestations) {
        window.location.href = '/my-attestations';
      }
      // Otherwise, default navigation will occur (handled by AuthContext/App routing)
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Determine if manual registration form should be shown
  // Hide manual form when OIDC is enabled AND user has an invite token (SSO-only registration)
  const showManualForm = !(oidcConfig && inviteData);

  // Show disabled message if registration is disabled AND user does not have a valid invite
  if (!registrationEnabled && !inviteData && !loadingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4 relative overflow-hidden bg-dot-pattern">
        <div className="w-full max-w-md relative z-10 animate-fade-in">
          <Card className="glass-panel">
            <CardContent className="p-8 text-center">
              <div className="icon-box icon-box-lg glow-warning mx-auto mb-6">
                <ShieldX className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-semibold mb-3">Registration Disabled</h2>
              <p className="text-muted-foreground mb-6">
                New account registration is currently disabled. Please contact your administrator for access.
              </p>
              <Button onClick={onSwitchToLogin} className="btn-interactive">
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4 relative overflow-hidden bg-dot-pattern">
      <div className="w-full max-w-lg relative z-10 animate-fade-in">
        {/* Dark Mode Toggle */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full shadow-sm hover:shadow-md btn-interactive"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        {/* Logo/Brand */}
        <div className="text-center mb-8 animate-slide-up">
          {brandingLogo ? (
            <div className="mb-4">
              <img
                src={brandingLogo}
                alt="Company Logo"
                className="max-w-full h-auto max-h-32 object-contain mx-auto drop-shadow-lg"
              />
            </div>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary mb-4 shadow-lg hover:scale-105 transition-transform">
                <Laptop className="h-10 w-10 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">ACS</h1>
              <p className="text-muted-foreground">Asset Compliance System</p>
            </>
          )}
        </div>

        <Card className="glass-panel rounded-2xl shadow-2xl animate-scale-in">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <UserPlus className="h-6 w-6" />
              <span className="text-gradient">Create an account</span>
            </CardTitle>
            <CardDescription className="text-center text-base">
              Enter your information to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 animate-slide-up">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loadingInvite && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Validating invite...</span>
              </div>
            )}

            {inviteData && (
              <div className="glass-panel rounded-xl p-4 glow-info animate-slide-up">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Asset Attestation Required</h4>
                    <p className="text-sm opacity-90">
                      You have <strong>{inviteData.assetCount}</strong> {inviteData.assetCount === 1 ? 'asset' : 'assets'} awaiting attestation for "{inviteData.campaignName}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {oidcConfig && (
              <>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">Sign in with SSO to automatically create your account</p>
                    <Button
                      type="button"
                      onClick={async () => {
                        setOidcLoading(true);
                        setError(null);
                        
                        try {
                          // Store invite token if present so we can redirect after OIDC callback
                          if (inviteToken) {
                            sessionStorage.setItem('attestation_invite_token', inviteToken);
                          }
                          
                          const response = await fetch('/api/auth/oidc/login');
                          const data = await response.json();
                          
                          if (!response.ok) {
                            throw new Error(data.error || 'Failed to initiate SSO login');
                          }
                          
                          window.location.href = data.authUrl;
                        } catch (err) {
                          setError(err.message);
                          setOidcLoading(false);
                        }
                      }}
                      variant={oidcConfig?.button_variant || 'outline'}
                      className="w-full btn-interactive"
                      size="lg"
                      disabled={oidcLoading || loading}
                    >
                      {oidcLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Redirecting...
                        </>
                      ) : (
                        <>
                          <KeyRound className="h-4 w-4" />
                          {oidcConfig?.button_text || 'Sign In with SSO'}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">Your account will be created automatically</p>
                  </div>
                </div>

                {showManualForm && (
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or register manually</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {showManualForm && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Personal Information */}
              <div className="glass-panel rounded-xl p-4 space-y-4">
                <h4 className="caption-label flex items-center gap-2">
                  <User className="h-4 w-4" /> Your Information
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="John"
                      autoComplete="given-name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Doe"
                      autoComplete="family-name"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                    autoComplete="email"
                    readOnly={!!inviteData}
                    disabled={!!inviteData}
                    className={inviteData ? 'bg-muted cursor-not-allowed' : 'bg-surface/50 border-white/10'}
                    required
                  />
                </div>
              </div>

              <Separator className="my-6" />

              {/* Manager Information */}
              <div className="glass-panel rounded-xl p-4 space-y-4">
                <h4 className="caption-label flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Manager Information
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="manager_first_name">Manager First Name</Label>
                    <Input
                      id="manager_first_name"
                      name="manager_first_name"
                      value={formData.manager_first_name}
                      onChange={handleChange}
                      placeholder="Jane"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manager_last_name">Manager Last Name</Label>
                    <Input
                      id="manager_last_name"
                      name="manager_last_name"
                      value={formData.manager_last_name}
                      onChange={handleChange}
                      placeholder="Smith"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manager_email">Manager Email</Label>
                  <Input
                    id="manager_email"
                    name="manager_email"
                    type="email"
                    value={formData.manager_email}
                    onChange={handleChange}
                    placeholder="manager@company.com"
                    required
                  />
                </div>
              </div>

              <Separator className="my-6" />

              {/* Password */}
              <div className="glass-panel rounded-xl p-4 space-y-4">
                <h4 className="caption-label flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Set Password
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-2 btn-interactive" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
            )}

            <div className="pt-4 border-t">
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="font-semibold text-gradient hover:opacity-80 transition-opacity"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {footerLabel}
        </p>
      </div>
    </div>
  );
};

export default RegisterNew;
