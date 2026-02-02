import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Settings, Database, Loader2, AlertTriangle, Image, Shield } from 'lucide-react';
import SettingsLayout from './admin/SettingsLayout';
import RestartRequiredBanner from './admin/RestartRequiredBanner';
import PasskeySettings from './admin/PasskeySettings';
import AuthSettings from './admin/AuthSettings';
import SMTPSettings from './admin/SMTPSettings';
import ProxySettings from './admin/ProxySettings';
import RateLimitingSettings from './admin/RateLimitingSettings';
import OIDCSettings from './OIDCSettings';
import HubSpotSettings from './HubSpotSettings';
import AssetTypesSettings from './AssetTypesSettings';
import EmailTemplates from './EmailTemplates';
import DangerZoneSettings from './DangerZoneSettings';


const AdminSettingsNew = () => {
  const { getAuthHeaders, user } = useAuth();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState('branding');
  const [dbSettings, setDbSettings] = useState({ engine: 'sqlite', postgresUrl: '', managedByEnv: false, effectiveEngine: 'sqlite' });
  const [dbLoading, setDbLoading] = useState(false);
  const [brandingSettings, setBrandingSettings] = useState({ logo_data: null, logo_filename: null });
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFilename, setLogoFilename] = useState('');

  // New branding fields
  const [siteName, setSiteName] = useState('ACS');
  const [subTitle, setSubTitle] = useState('Asset Compliance System');
  const [faviconPreview, setFaviconPreview] = useState(null);
  const [faviconFilename, setFaviconFilename] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [includeLogoInEmails, setIncludeLogoInEmails] = useState(false);
  const [appUrl, setAppUrl] = useState('');
  const [footerLabel, setFooterLabel] = useState('SOC2 Compliance - KeyData Asset Registration System');

  useEffect(() => {
    if (activeView === 'database') fetchDatabaseSettings();
    if (activeView === 'branding') fetchBrandingSettings();
  }, [activeView]);

  const fetchDatabaseSettings = async () => {
    setDbLoading(true);
    try {
      const response = await fetch('/api/admin/database', { headers: { ...getAuthHeaders() } });
      if (!response.ok) throw new Error('Failed to load database settings');
      setDbSettings(await response.json());
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setDbLoading(false); }
  };

  const handleDatabaseSave = async () => {
    setDbLoading(true);
    try {
      const response = await fetch('/api/admin/database', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ engine: dbSettings.engine, postgresUrl: dbSettings.postgresUrl })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save');
      setDbSettings(data);
      toast({ title: "Success", description: "Database settings saved. Restart backend to apply.", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setDbLoading(false); }
  };

  const fetchBrandingSettings = async () => {
    setBrandingLoading(true);
    try {
      const response = await fetch('/api/branding');
      if (!response.ok) throw new Error('Failed to load branding settings');
      const data = await response.json();
      setBrandingSettings(data);
      setLogoPreview(data.logo_data || null);
      setLogoFilename(data.logo_filename || '');
      setSiteName(data.site_name || 'ACS');
      setSubTitle(data.sub_title || 'Asset Compliance System');
      setFaviconPreview(data.favicon_data || null);
      setFaviconFilename(data.favicon_filename || '');
      setPrimaryColor(data.primary_color || '#3B82F6');
      setIncludeLogoInEmails(data.include_logo_in_emails === 1 || data.include_logo_in_emails === true);
      setAppUrl(data.app_url || '');
      setFooterLabel(data.footer_label || 'SOC2 Compliance - KeyData Asset Registration System');
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setBrandingLoading(false); }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Error", description: "Image size must be less than 2MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
      setLogoFilename(file.name);
      setBrandingSettings({
        ...brandingSettings,
        logo_data: reader.result,
        logo_filename: file.name,
        logo_content_type: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(x-icon|png|vnd.microsoft.icon)$/)) {
      toast({ title: "Error", description: "Please select a .ico or .png file", variant: "destructive" });
      return;
    }

    // Validate file size (max 100KB for favicon)
    if (file.size > 100 * 1024) {
      toast({ title: "Error", description: "Favicon size must be less than 100KB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFaviconPreview(reader.result);
      setFaviconFilename(file.name);
      setBrandingSettings({
        ...brandingSettings,
        favicon_data: reader.result,
        favicon_filename: file.name,
        favicon_content_type: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleLogoRemove = () => {
    setLogoPreview(null);
    setLogoFilename('');
    setBrandingSettings({
      ...brandingSettings,
      logo_data: null,
      logo_filename: null,
      logo_content_type: null
    });
  };

  const handleFaviconRemove = () => {
    setFaviconPreview(null);
    setFaviconFilename('');
    setBrandingSettings({
      ...brandingSettings,
      favicon_data: null,
      favicon_filename: null,
      favicon_content_type: null
    });
  };

  const handleBrandingSave = async () => {
    setBrandingLoading(true);
    try {
      const response = await fetch('/api/admin/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          logo_data: logoPreview,
          logo_filename: logoFilename || null,
          logo_content_type: brandingSettings.logo_content_type || null,
          site_name: siteName,
          sub_title: subTitle,
          favicon_data: faviconPreview,
          favicon_filename: faviconFilename || null,
          favicon_content_type: brandingSettings.favicon_content_type || null,
          primary_color: primaryColor,
          include_logo_in_emails: includeLogoInEmails,
          app_url: appUrl,
          footer_label: footerLabel
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save branding settings');

      toast({ title: "Success", description: "Branding settings saved successfully", variant: "success" });

      // Trigger a custom event to notify App.jsx to reload branding
      window.dispatchEvent(new CustomEvent('brandingUpdated'));

      fetchBrandingSettings();
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setBrandingLoading(false);
    }
  };


  if (user?.role !== 'admin') {
    return (
      <div className="space-y-6 p-1 md:p-2 animate-fade-in bg-surface/30 min-h-screen rounded-2xl">
        <Card className="glass-panel rounded-2xl border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Access Denied - Admin access required</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderSectionContent = () => {
    switch (activeView) {
      case 'branding':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="icon-box icon-box-sm bg-primary/10 border-primary/20">
                <Image className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Branding Settings</h2>
            </div>
            <Card>
              <CardContent className="space-y-4 pt-6">
                {brandingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {/* Company Logo */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Company Logo</Label>
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 flex items-center justify-center rounded-lg border bg-muted/50 overflow-hidden shrink-0">
                          {logoPreview ? (
                            <img
                              src={logoPreview}
                              alt="Company Logo"
                              className="max-h-16 max-w-16 object-contain"
                            />
                          ) : (
                            <Image className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <Input id="company-logo" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => document.getElementById('company-logo')?.click()}
                              disabled={brandingLoading}
                            >
                              Choose Image
                            </Button>
                            {logoPreview && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleLogoRemove}
                                disabled={brandingLoading}
                              >
                                Remove
                              </Button>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {logoFilename || 'No file selected'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">PNG, JPG, or SVG up to 2MB. Used on login page.</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Favicon */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Favicon</Label>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 flex items-center justify-center rounded border bg-muted/50 overflow-hidden shrink-0">
                          {faviconPreview ? (
                            <img
                              src={faviconPreview}
                              alt="Favicon"
                              className="max-h-8 max-w-8 object-contain"
                            />
                          ) : (
                            <Image className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <Input id="favicon-upload" type="file" accept=".ico,.png" onChange={handleFaviconUpload} className="hidden" />
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => document.getElementById('favicon-upload')?.click()}
                              disabled={brandingLoading}
                            >
                              Choose Favicon
                            </Button>
                            {faviconPreview && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleFaviconRemove}
                                disabled={brandingLoading}
                              >
                                Remove
                              </Button>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {faviconFilename || 'No file selected'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">.ico or .png file, 32×32px recommended</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Site Name */}
                    <div className="space-y-2">
                      <Label htmlFor="site-name" className="text-sm font-semibold">Site Name</Label>
                      <Input
                        id="site-name"
                        type="text"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        placeholder="ACS"
                        disabled={brandingLoading}
                        className="max-w-md"
                      />
                      <p className="text-xs text-muted-foreground">Main application name displayed on login page and browser tab</p>
                    </div>

                    <Separator />

                    {/* Subtitle */}
                    <div className="space-y-2">
                      <Label htmlFor="sub-title" className="text-sm font-semibold">Subtitle</Label>
                      <Input
                        id="sub-title"
                        type="text"
                        value={subTitle}
                        onChange={(e) => setSubTitle(e.target.value)}
                        placeholder="KeyData Asset Registration System"
                        disabled={brandingLoading}
                        className="max-w-md"
                      />
                      <p className="text-xs text-muted-foreground">Tagline or description shown on login page</p>
                    </div>

                    <Separator />

                    {/* Primary Color */}
                    <div className="space-y-2">
                      <Label htmlFor="primary-color" className="text-sm font-semibold">Primary Brand Color</Label>
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full border-2 border-gray-300 cursor-pointer"
                          style={{ backgroundColor: primaryColor }}
                          onClick={() => document.getElementById('primary-color')?.click()}
                        />
                        <Input
                          id="primary-color"
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          disabled={brandingLoading}
                          className="w-20 h-10 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                              setPrimaryColor(val);
                            }
                          }}
                          placeholder="#3B82F6"
                          disabled={brandingLoading}
                          className="max-w-32"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Used for buttons, links, and highlights.</p>
                    </div>

                    <Separator />

                    {/* Email Logo Toggle */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="email-logo"
                          checked={includeLogoInEmails}
                          onCheckedChange={setIncludeLogoInEmails}
                          disabled={brandingLoading}
                        />
                        <Label htmlFor="email-logo" className="text-sm font-semibold cursor-pointer">
                          Include logo in email headers
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        When enabled, your company logo will appear in email notifications sent via SMTP
                      </p>
                    </div>

                    <Separator />

                    {/* App URL */}
                    <div className="space-y-2">
                      <Label htmlFor="app-url" className="text-sm font-semibold">App URL</Label>
                      <Input
                        id="app-url"
                        type="url"
                        value={appUrl}
                        onChange={(e) => setAppUrl(e.target.value)}
                        placeholder="https://your-domain.com or http://localhost:3000"
                        disabled={brandingLoading}
                        className="max-w-md"
                      />
                      <p className="text-xs text-muted-foreground">
                        Base URL used for links in email notifications (attestation links, password reset, etc.).
                        Falls back to FRONTEND_URL environment variable if not set.
                      </p>
                    </div>

                    <Separator />

                    {/* Footer Label */}
                    <div className="space-y-2">
                      <Label htmlFor="footer-label" className="text-sm font-semibold">Footer Label</Label>
                      <Input
                        id="footer-label"
                        type="text"
                        value={footerLabel}
                        onChange={(e) => setFooterLabel(e.target.value)}
                        placeholder="SOC2 Compliance - KeyData Asset Registration System"
                        disabled={brandingLoading}
                        className="max-w-md"
                      />
                      <p className="text-xs text-muted-foreground">
                        Text displayed at the bottom of the application and on login/register pages
                      </p>
                    </div>

                    <Separator />

                    {/* Save Button */}
                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={handleBrandingSave}
                        disabled={brandingLoading}
                        size="default"
                        className="btn-interactive"
                      >
                        {brandingLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save Changes
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'auth':
        return <AuthSettings />;

      case 'passkeys':
        return <PasskeySettings />;

      case 'oidc':
        return <OIDCSettings />;

      case 'smtp':
        return <SMTPSettings />;

      case 'templates':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="icon-box icon-box-sm bg-primary/10 border-primary/20">
                <Image className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Email Templates</h2>
            </div>
            <EmailTemplates />
          </div>
        );

      case 'asset-types':
        return <AssetTypesSettings />;

      case 'proxy':
        return <ProxySettings />;

      case 'rate-limiting':
        return <RateLimitingSettings />;

      case 'database':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="icon-box icon-box-sm bg-primary/10 border-primary/20">
                <Database className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Database Configuration</h2>
            </div>

            <RestartRequiredBanner />

            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center gap-2">
                  <Badge variant={dbSettings.effectiveEngine === 'postgres' ? 'success' : 'secondary'}>
                    {dbSettings.effectiveEngine.toUpperCase()}
                  </Badge>
                  {dbSettings.managedByEnv && <Badge variant="warning">Managed by ENV</Badge>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Database Engine</Label>
                  <Select
                    value={dbSettings.engine}
                    onValueChange={(v) => setDbSettings({ ...dbSettings, engine: v })}
                    disabled={dbSettings.managedByEnv || dbLoading}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sqlite">SQLite (default)</SelectItem>
                      <SelectItem value="postgres">PostgreSQL</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose SQLite for development or PostgreSQL for production
                  </p>
                </div>
                {dbSettings.engine === 'postgres' && (
                  <div className="space-y-2">
                    <Label htmlFor="postgres-url" className="text-sm font-semibold">PostgreSQL Connection URL</Label>
                    <Input
                      id="postgres-url"
                      placeholder="postgresql://user:pass@host:5432/database"
                      value={dbSettings.postgresUrl}
                      onChange={(e) => setDbSettings({ ...dbSettings, postgresUrl: e.target.value })}
                      disabled={dbSettings.managedByEnv || dbLoading}
                    />
                  </div>
                )}
                <Button
                  onClick={handleDatabaseSave}
                  disabled={dbSettings.managedByEnv || dbLoading}
                  size="sm"
                  className="btn-interactive"
                >
                  {dbLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Database Settings
                </Button>
              </CardContent>
            </Card>

            <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-600">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-yellow-600" />
                  <CardTitle className="text-sm text-yellow-800 dark:text-yellow-200">Security Best Practices</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-0.5 list-disc list-inside">
                  <li>Regularly review user roles and permissions</li>
                  <li>Remove inactive user accounts</li>
                  <li>Monitor audit logs for suspicious activity</li>
                  <li>Keep the application updated</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        );

      case 'hubspot':
        return <HubSpotSettings />;

      case 'danger-zone':
        return <DangerZoneSettings />;

      default:
        return <div>Section not found</div>;
    }
  };

  return (
    <div className="space-y-6 p-1 md:p-2 animate-fade-in bg-surface/30 min-h-screen rounded-2xl">
      <Card className="glass-panel rounded-2xl">
        <CardHeader className="space-y-3 md:space-y-4 px-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="icon-box icon-box-sm bg-primary/10 border-primary/20">
                <Settings size={20} className="text-primary" />
              </div>
              <CardTitle className="text-lg sm:text-xl text-gradient">Admin Settings</CardTitle>
            </div>
          </div>
        </CardHeader>
      </Card>

      <SettingsLayout activeSection={activeView} onSectionChange={setActiveView}>
        {renderSectionContent()}
      </SettingsLayout>
    </div>
  );
};

export default AdminSettingsNew;
