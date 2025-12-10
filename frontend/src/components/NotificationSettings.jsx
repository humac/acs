import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Mail, Send, CheckCircle2 } from 'lucide-react';

const NotificationSettings = () => {
  const { getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testSending, setTestSending] = useState(false);
  
  const [settings, setSettings] = useState({
    enabled: false,
    smtp_host: '',
    smtp_port: 587,
    smtp_use_tls: true,
    smtp_username: '',
    smtp_password: '',
    smtp_from_name: '',
    smtp_from_email: '',
    has_password: false
  });

  const [passwordChanged, setPasswordChanged] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/notification-settings', {
        headers: { ...getAuthHeaders() }
      });
      if (!response.ok) throw new Error('Failed to load notification settings');
      const data = await response.json();
      setSettings({
        ...data,
        smtp_password: '' // Never populate password field
      });
      setTestRecipient(data.smtp_from_email || '');
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (settings.enabled) {
      if (!settings.smtp_host) {
        toast({
          title: "Validation Error",
          description: "SMTP host is required when notifications are enabled",
          variant: "destructive"
        });
        return;
      }
      if (!settings.smtp_from_email) {
        toast({
          title: "Validation Error",
          description: "From email address is required when notifications are enabled",
          variant: "destructive"
        });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(settings.smtp_from_email)) {
        toast({
          title: "Validation Error",
          description: "Invalid from email address format",
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    try {
      const payload = { ...settings };
      
      // Only include password if it was changed
      if (!passwordChanged) {
        delete payload.smtp_password;
      }
      
      const response = await fetch('/api/admin/notification-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save settings');
      
      setSettings({
        ...data,
        smtp_password: '' // Clear password field after save
      });
      setPasswordChanged(false);
      
      toast({
        title: "Success",
        description: "Notification settings saved successfully",
        variant: "success"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testRecipient) {
      toast({
        title: "Validation Error",
        description: "Recipient email address is required",
        variant: "destructive"
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testRecipient)) {
      toast({
        title: "Validation Error",
        description: "Invalid email address format",
        variant: "destructive"
      });
      return;
    }

    setTestSending(true);
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
        description: `Test email sent successfully to ${testRecipient}`,
        variant: "success"
      });
      setTestDialogOpen(false);
    } catch (err) {
      toast({
        title: "Test Email Failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Email Notifications (SMTP)</CardTitle>
          </div>
          <CardDescription className="text-sm">
            Configure SMTP settings to send email notifications from KARS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                />
                <Label htmlFor="enabled" className="text-sm font-medium cursor-pointer">
                  Enable email notifications
                </Label>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="smtp_host" className="text-sm">
                      SMTP Host <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="smtp_host"
                      placeholder="smtp.example.com"
                      value={settings.smtp_host}
                      onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                      disabled={!settings.enabled}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="smtp_port" className="text-sm">
                      SMTP Port
                    </Label>
                    <Input
                      id="smtp_port"
                      type="number"
                      placeholder="587"
                      value={settings.smtp_port}
                      onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) || 587 })}
                      disabled={!settings.enabled}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="smtp_use_tls"
                    checked={settings.smtp_use_tls}
                    onCheckedChange={(checked) => setSettings({ ...settings, smtp_use_tls: checked })}
                    disabled={!settings.enabled}
                  />
                  <Label htmlFor="smtp_use_tls" className="text-sm cursor-pointer">
                    Use TLS/SSL encryption (recommended)
                  </Label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="smtp_username" className="text-sm">
                      SMTP Username (optional)
                    </Label>
                    <Input
                      id="smtp_username"
                      placeholder="user@example.com"
                      value={settings.smtp_username}
                      onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })}
                      disabled={!settings.enabled}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="smtp_password" className="text-sm">
                      SMTP Password {settings.has_password && !passwordChanged && '(encrypted)'}
                    </Label>
                    <Input
                      id="smtp_password"
                      type="password"
                      placeholder={settings.has_password && !passwordChanged ? '••••••••' : 'Enter password'}
                      value={settings.smtp_password}
                      onChange={(e) => {
                        setSettings({ ...settings, smtp_password: e.target.value });
                        setPasswordChanged(true);
                      }}
                      disabled={!settings.enabled}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="smtp_from_name" className="text-sm">
                      From Name
                    </Label>
                    <Input
                      id="smtp_from_name"
                      placeholder="KARS Notifications"
                      value={settings.smtp_from_name}
                      onChange={(e) => setSettings({ ...settings, smtp_from_name: e.target.value })}
                      disabled={!settings.enabled}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="smtp_from_email" className="text-sm">
                      From Email Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="smtp_from_email"
                      type="email"
                      placeholder="noreply@example.com"
                      value={settings.smtp_from_email}
                      onChange={(e) => setSettings({ ...settings, smtp_from_email: e.target.value })}
                      disabled={!settings.enabled}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={loading} size="sm">
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Settings
                </Button>
                
                <Button
                  onClick={() => setTestDialogOpen(true)}
                  disabled={!settings.enabled || loading}
                  variant="outline"
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
              </div>

              {settings.enabled && (
                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                  <p><strong>Note:</strong> SMTP password is encrypted and stored securely.</p>
                  <p>Common SMTP ports: 587 (TLS), 465 (SSL), 25 (unencrypted - not recommended)</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Test Email Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Enter the recipient email address to test your SMTP configuration
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-4">
            <Label htmlFor="test_recipient">Recipient Email Address</Label>
            <Input
              id="test_recipient"
              type="email"
              placeholder="test@example.com"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTestDialogOpen(false)}
              disabled={testSending}
            >
              Cancel
            </Button>
            <Button onClick={handleTestEmail} disabled={testSending}>
              {testSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationSettings;
