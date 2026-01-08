import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Info, Send } from 'lucide-react';

const SMTPSettings = () => {
  const { getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    enabled: false,
    email_provider: 'smtp',
    host: '',
    port: 587,
    use_tls: true,
    username: '',
    password: '',
    auth_method: 'plain',
    brevo_api_key: '',
    from_name: 'ACS Notifications',
    from_email: '',
    default_recipient: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [hasBrevoApiKey, setHasBrevoApiKey] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testing, setTesting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/notification-settings', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setSettings({
          enabled: data.enabled === 1 || data.enabled === true,
          email_provider: data.email_provider || 'smtp',
          host: data.host || '',
          port: data.port || 587,
          use_tls: data.use_tls === 1 || data.use_tls === true,
          username: data.username || '',
          password: '',
          auth_method: data.auth_method || 'plain',
          brevo_api_key: '',
          from_name: data.from_name || 'ACS Notifications',
          from_email: data.from_email || '',
          default_recipient: data.default_recipient || ''
        });
        setHasPassword(data.has_password);
        setHasBrevoApiKey(data.has_brevo_api_key);
      }
    } catch (err) {
      toast({ title: "Error", description: 'Failed to load notification settings', variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setSettings({
      ...settings,
      [name]: value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (settings.enabled) {
      // Common validation
      if (!settings.from_email) {
        newErrors.from_email = 'From email is required when notifications are enabled';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.from_email)) {
        newErrors.from_email = 'Please enter a valid email address';
      }

      // Provider-specific validation
      if (settings.email_provider === 'smtp') {
        if (!settings.host) {
          newErrors.host = 'Host is required for SMTP';
        }
        if (!settings.port) {
          newErrors.port = 'Port is required for SMTP';
        }
      } else if (settings.email_provider === 'brevo') {
        if (!hasBrevoApiKey && !settings.brevo_api_key) {
          newErrors.brevo_api_key = 'Brevo API key is required';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: 'Please fix the errors in the form',
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        enabled: settings.enabled,
        email_provider: settings.email_provider,
        host: settings.host,
        port: parseInt(settings.port),
        use_tls: settings.use_tls,
        username: settings.username || null,
        auth_method: settings.auth_method,
        from_name: settings.from_name,
        from_email: settings.from_email,
        default_recipient: settings.default_recipient || null
      };

      // Handle SMTP password
      if (settings.password && settings.password !== '[REDACTED]') {
        payload.password = settings.password;
      }

      // Handle Brevo API key
      if (settings.brevo_api_key && settings.brevo_api_key !== '[REDACTED]') {
        payload.brevo_api_key = settings.brevo_api_key;
      }

      const response = await fetch('/api/admin/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      toast({ title: "Success", description: 'Email settings saved successfully!', variant: "success" });
      setHasPassword(!!settings.password || hasPassword);
      setHasBrevoApiKey(!!settings.brevo_api_key || hasBrevoApiKey);
      setSettings(prev => ({ ...prev, password: '', brevo_api_key: '' }));
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!settings.enabled) {
      toast({
        title: "Error",
        description: 'Please enable and save notification settings before sending a test email',
        variant: "destructive"
      });
      return;
    }

    setTestDialogOpen(true);
    setTestRecipient(settings.default_recipient || '');
  };

  const handleSendTest = async () => {
    if (!testRecipient) {
      toast({ title: "Error", description: 'Please enter a recipient email address', variant: "destructive" });
      return;
    }

    setTesting(true);
    try {
      const response = await fetch('/api/admin/notification-settings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ recipient: testRecipient })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }

      toast({
        title: "Success",
        description: data.message || 'Test email sent successfully!',
        variant: "success"
      });
      setTestDialogOpen(false);
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setTesting(false);
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
    <div className="space-y-4">
      {/* Email Notifications - Main Container */}
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Email Notifications</h3>
            <p className="text-sm text-muted-foreground">Configure email settings for sending notifications from ACS.</p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => handleChange('enabled', checked)}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Provider Selection */}
          <div className="space-y-3">
            <h4 className="caption-label">Email Provider</h4>
            <Select value={settings.email_provider} onValueChange={(value) => handleChange('email_provider', value)}>
              <SelectTrigger disabled={saving}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smtp">SMTP Server</SelectItem>
                <SelectItem value="brevo">Brevo API</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {settings.email_provider === 'smtp'
                ? 'Use your own SMTP server for sending emails.'
                : 'Use Brevo (formerly Sendinblue) transactional email API.'}
            </p>
          </div>

          {/* Brevo API Settings - shown when Brevo is selected */}
          {settings.email_provider === 'brevo' && (
            <div className="space-y-3">
              <h4 className="caption-label">Brevo API</h4>
              <div className="space-y-1.5">
                <Label htmlFor="brevo_api_key" className="text-sm">
                  API Key *
                  {hasBrevoApiKey && <span className="ml-1 text-muted-foreground text-xs">(leave blank to keep current)</span>}
                </Label>
                <Input
                  id="brevo_api_key"
                  type="password"
                  value={settings.brevo_api_key}
                  onChange={(e) => handleChange('brevo_api_key', e.target.value)}
                  placeholder={hasBrevoApiKey ? '••••••••' : 'Enter Brevo API key'}
                  disabled={saving}
                  className={errors.brevo_api_key ? 'border-destructive' : ''}
                />
                {errors.brevo_api_key && <p className="text-xs text-destructive">{errors.brevo_api_key}</p>}
                <p className="text-xs text-muted-foreground">
                  Get your API key from <a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Brevo Settings → SMTP & API</a>
                </p>
              </div>
            </div>
          )}

          {/* SMTP Server Settings - shown when SMTP is selected */}
          {settings.email_provider === 'smtp' && (
            <div className="space-y-3">
              <h4 className="caption-label">SMTP Server</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="host" className="text-sm">Host *</Label>
                  <Input
                    id="host"
                    value={settings.host}
                    onChange={(e) => handleChange('host', e.target.value)}
                    placeholder="smtp.example.com"
                    disabled={saving}
                    className={errors.host ? 'border-destructive' : ''}
                  />
                  {errors.host && <p className="text-xs text-destructive">{errors.host}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="port" className="text-sm">Port *</Label>
                  <Input
                    id="port"
                    type="number"
                    value={settings.port}
                    onChange={(e) => handleChange('port', e.target.value)}
                    placeholder="587"
                    disabled={saving}
                    className={errors.port ? 'border-destructive' : ''}
                  />
                  {errors.port && <p className="text-xs text-destructive">{errors.port}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="use_tls"
                  checked={settings.use_tls}
                  onCheckedChange={(checked) => handleChange('use_tls', checked)}
                  disabled={saving}
                />
                <Label htmlFor="use_tls" className="text-sm cursor-pointer">Use TLS/SSL (recommended)</Label>
              </div>
            </div>
          )}


          {/* Authentication - SMTP only */}
          {settings.email_provider === 'smtp' && (
            <div className="space-y-3">
              <h4 className="caption-label">Authentication</h4>
              <div className="space-y-1.5">
                <Label htmlFor="auth_method" className="text-sm">Auth Method</Label>
                <Select value={settings.auth_method} onValueChange={(value) => handleChange('auth_method', value)}>
                  <SelectTrigger id="auth_method" disabled={saving}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="plain">Plain</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="cram-md5">CRAM-MD5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {settings.auth_method !== 'none' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-sm">Username</Label>
                    <Input
                      id="username"
                      value={settings.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                      placeholder="user@example.com"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm">
                      Password
                      {hasPassword && <span className="ml-1 text-muted-foreground text-xs">(leave blank to keep current)</span>}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={settings.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder={hasPassword ? '••••••••' : 'Enter password'}
                      disabled={saving}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Email Settings */}
          <div className="space-y-3">
            <h4 className="caption-label">Email Settings</h4>
            <div className="space-y-1.5">
              <Label htmlFor="from_name" className="text-sm">From Name</Label>
              <Input
                id="from_name"
                value={settings.from_name}
                onChange={(e) => handleChange('from_name', e.target.value)}
                placeholder="ACS Notifications"
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="from_email" className="text-sm">From Email *</Label>
              <Input
                id="from_email"
                type="email"
                value={settings.from_email}
                onChange={(e) => handleChange('from_email', e.target.value)}
                placeholder="noreply@example.com"
                disabled={saving}
                className={errors.from_email ? 'border-destructive' : ''}
              />
              {errors.from_email && <p className="text-xs text-destructive">{errors.from_email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="default_recipient" className="text-sm">Default Test Recipient</Label>
              <Input
                id="default_recipient"
                type="email"
                value={settings.default_recipient}
                onChange={(e) => handleChange('default_recipient', e.target.value)}
                placeholder="admin@example.com"
                disabled={saving}
              />
              <p className="text-sm text-muted-foreground">Used as the default recipient for test emails</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving} className="btn-interactive">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Settings
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleTestEmail}
              disabled={!settings.enabled || saving}
              className="btn-interactive"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Test Email
            </Button>
          </div>
        </form>
      </div>

      {/* Security Notice */}
      <Alert className="glow-info border-0">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Security:</strong> Passwords and API keys are encrypted at rest using AES-256-GCM encryption.
          Ensure the <code className="bg-muted px-1 py-0.5 rounded">KARS_MASTER_KEY</code> environment variable is set and kept secure.
        </AlertDescription>
      </Alert>

      {/* Test Email Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="glass-overlay">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Enter an email address to receive a test notification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="test_recipient">Recipient Email</Label>
            <Input
              id="test_recipient"
              type="email"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              placeholder="user@example.com"
              disabled={testing}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTestDialogOpen(false)}
              disabled={testing}
              className="btn-interactive"
            >
              Cancel
            </Button>
            <Button onClick={handleSendTest} disabled={testing} className="btn-interactive">
              {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SMTPSettings;
