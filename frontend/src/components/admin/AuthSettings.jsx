import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, AlertTriangle, Info } from 'lucide-react';

const AuthSettings = () => {
  const { getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    registration_enabled: true,
    password_login_enabled: true
  });
  const [oidcEnabled, setOidcEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchOidcStatus();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/auth-settings', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSettings({
          registration_enabled: data.registration_enabled === 1,
          password_login_enabled: data.password_login_enabled === 1
        });
      }
    } catch (err) {
      toast({ title: "Error", description: 'Failed to load authentication settings', variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchOidcStatus = async () => {
    try {
      const response = await fetch('/api/auth/oidc/config');
      if (response.ok) {
        const data = await response.json();
        setOidcEnabled(data.enabled);
      }
    } catch (err) {
      console.error('Failed to fetch OIDC status:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/auth-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      toast({ title: "Success", description: 'Authentication settings saved successfully!', variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Authentication Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure user registration and login methods for your application.
        </p>
      </div>

      <div className="glass-panel rounded-xl p-4 space-y-6">
        {/* Registration Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">User Registration</h3>
            <p className="text-sm text-muted-foreground">
              Allow new users to create accounts through the registration form.
            </p>
          </div>
          <Switch
            checked={settings.registration_enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, registration_enabled: checked })}
          />
        </div>

        <div className="border-t border-border/50" />

        {/* Password Login Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Username/Password Login</h3>
            <p className="text-sm text-muted-foreground">
              Allow users to sign in with email and password.
            </p>
            {!oidcEnabled && (
              <div className="flex items-center gap-2 mt-2 text-xs text-warning">
                <AlertTriangle className="h-3 w-3" />
                <span>Enable SSO/OIDC first to disable password login</span>
              </div>
            )}
          </div>
          <Switch
            checked={settings.password_login_enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, password_login_enabled: checked })}
            disabled={!oidcEnabled}
          />
        </div>

        {!settings.password_login_enabled && (
          <div className="flex items-start gap-3 bg-info/10 border border-info/20 rounded-lg p-3">
            <Info className="h-4 w-4 text-info mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">Note:</strong> When password login is disabled,
              the "Forgot Password" link will also be hidden. Users will only be able to sign in via SSO.
            </div>
          </div>
        )}
      </div>

      <Button type="submit" disabled={saving} className="btn-interactive">
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Authentication Settings
          </>
        )}
      </Button>
    </form>
  );
};

export default AuthSettings;
