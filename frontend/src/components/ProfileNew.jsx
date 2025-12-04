import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { User, Shield, Key, Loader2, Check, X, Trash2 } from 'lucide-react';
import MFASetupModal from './MFASetupModal';
import { prepareCreationOptions, uint8ArrayToBase64Url } from '@/utils/webauthn';

const ProfileNew = () => {
  const { user, getAuthHeaders, updateUser } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ first_name: '', last_name: '', manager_first_name: '', manager_last_name: '', manager_email: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('account');

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [showDisableMFA, setShowDisableMFA] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  // Passkeys state
  const [passkeys, setPasskeys] = useState([]);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState('');

  useEffect(() => {
    if (user) {
      const managerParts = user.manager_name ? user.manager_name.trim().split(' ') : ['', ''];
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        manager_first_name: managerParts[0] || '',
        manager_last_name: managerParts.slice(1).join(' ') || '',
        manager_email: user.manager_email || ''
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchMFAStatus = async () => {
      try {
        const response = await fetch('/api/auth/mfa/status', { headers: getAuthHeaders() });
        const data = await response.json();
        if (response.ok) setMfaEnabled(data.enabled);
      } catch (err) { console.error('Failed to fetch MFA status:', err); }
    };
    fetchMFAStatus();
  }, [getAuthHeaders]);

  useEffect(() => {
    if (activeTab === 'security') fetchPasskeys();
  }, [activeTab]);

  const fetchPasskeys = async () => {
    setPasskeyLoading(true);
    try {
      const response = await fetch('/api/auth/passkeys', { headers: { ...getAuthHeaders() } });
      const data = await response.json();
      if (response.ok) setPasskeys(data.passkeys || []);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load passkeys", variant: "destructive" });
    } finally { setPasskeyLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = { ...formData, manager_name: `${formData.manager_first_name} ${formData.manager_last_name}`.trim() };
      delete submitData.manager_first_name;
      delete submitData.manager_last_name;
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(submitData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update profile');
      toast({ title: "Success", description: "Profile updated successfully", variant: "success" });
      updateUser(data.user);
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setPasswordLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(passwordData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to change password');
      toast({ title: "Success", description: "Password changed successfully", variant: "success" });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setPasswordLoading(false); }
  };

  const handleMFASetupComplete = () => {
    setMfaEnabled(true);
    setShowMFASetup(false);
    toast({ title: "Success", description: "Two-factor authentication enabled", variant: "success" });
  };

  const handleDisableMFA = async () => {
    if (!disablePassword) {
      toast({ title: "Error", description: "Password is required", variant: "destructive" });
      return;
    }
    setMfaLoading(true);
    try {
      const response = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to disable MFA');
      setMfaEnabled(false);
      setShowDisableMFA(false);
      setDisablePassword('');
      toast({ title: "Success", description: "Two-factor authentication disabled", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setMfaLoading(false); }
  };

  const handlePasskeyRegistration = async () => {
    if (!window.PublicKeyCredential) {
      toast({ title: "Error", description: "Passkeys not supported in this browser", variant: "destructive" });
      return;
    }
    setPasskeyLoading(true);
    try {
      const optionsResponse = await fetch('/api/auth/passkeys/registration-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      });
      const optionsData = await optionsResponse.json();
      if (!optionsResponse.ok) throw new Error(optionsData.error || 'Unable to start passkey setup');
      const creationOptions = prepareCreationOptions(optionsData.options);
      const credential = await navigator.credentials.create({ publicKey: creationOptions });
      if (!credential) throw new Error('No credential was returned');
      const verificationPayload = {
        name: newPasskeyName.trim() || 'Passkey',
        credential: {
          id: credential.id,
          rawId: uint8ArrayToBase64Url(credential.rawId),
          type: credential.type,
          response: {
            clientDataJSON: uint8ArrayToBase64Url(credential.response.clientDataJSON),
            attestationObject: uint8ArrayToBase64Url(credential.response.attestationObject),
            transports: typeof credential.response.getTransports === 'function' ? credential.response.getTransports() : [],
          },
        },
      };
      const verifyResponse = await fetch('/api/auth/passkeys/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(verificationPayload),
      });
      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok) throw new Error(verifyData.error || 'Unable to save passkey');
      setPasskeys((prev) => [verifyData.passkey, ...prev.filter((pk) => pk.id !== verifyData.passkey.id)]);
      toast({ title: "Success", description: "Passkey added successfully", variant: "success" });
      setNewPasskeyName('');
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setPasskeyLoading(false); }
  };

  const handleDeletePasskey = async (passkeyId) => {
    setPasskeyLoading(true);
    try {
      const response = await fetch(`/api/auth/passkeys/${passkeyId}`, {
        method: 'DELETE', headers: { ...getAuthHeaders() },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete passkey');
      setPasskeys((prev) => prev.filter((pk) => pk.id !== passkeyId));
      toast({ title: "Success", description: "Passkey removed", variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setPasskeyLoading(false); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString() : 'Never';
  const getRoleColor = (role) => ({ admin: 'destructive', manager: 'success', employee: 'default' }[role] || 'secondary');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Profile Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="account" className="gap-2"><User className="h-4 w-4" />Account</TabsTrigger>
              <TabsTrigger value="update" className="gap-2"><User className="h-4 w-4" />Update Info</TabsTrigger>
              <TabsTrigger value="security" className="gap-2"><Shield className="h-4 w-4" />Security</TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <div className="grid gap-4 md:grid-cols-3">
                <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Email</p><p className="font-semibold">{user?.email}</p></CardContent></Card>
                <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Role</p><Badge variant={getRoleColor(user?.role)}>{user?.role?.toUpperCase()}</Badge></CardContent></Card>
                <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Name</p><p className="font-semibold">{user?.name}</p></CardContent></Card>
                <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Manager</p><p className="font-semibold">{user?.manager_name || 'Not set'}</p></CardContent></Card>
                <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Manager Email</p><p className="font-semibold">{user?.manager_email || 'Not set'}</p></CardContent></Card>
              </div>
            </TabsContent>

            <TabsContent value="update">
              <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>First Name</Label><Input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Last Name</Label><Input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required /></div>
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Manager First Name</Label><Input value={formData.manager_first_name} onChange={(e) => setFormData({ ...formData, manager_first_name: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Manager Last Name</Label><Input value={formData.manager_last_name} onChange={(e) => setFormData({ ...formData, manager_last_name: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Manager Email</Label><Input type="email" value={formData.manager_email} onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })} /></div>
                <Button type="submit" disabled={loading}>{loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Update Profile</Button>
              </form>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                    <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required /></div>
                    <div className="space-y-2"><Label>New Password</Label><Input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} minLength={6} required /></div>
                    <div className="space-y-2"><Label>Confirm New Password</Label><Input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} minLength={6} required /></div>
                    <Button type="submit" disabled={passwordLoading}>{passwordLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Change Password</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
                  <CardDescription>Add extra security with a verification code.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {mfaEnabled ? <><Check className="h-4 w-4 text-green-500" /><span className="text-green-600 font-semibold">Enabled</span></> : <><X className="h-4 w-4 text-red-500" /><span className="text-red-600">Disabled</span></>}
                    </div>
                    {mfaEnabled ? <Button variant="outline" onClick={() => setShowDisableMFA(true)}>Disable MFA</Button> : <Button onClick={() => setShowMFASetup(true)}>Enable MFA</Button>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2"><Key className="h-4 w-4 text-primary" /><CardTitle className="text-base">Passkeys</CardTitle></div>
                  <CardDescription>Use passkeys for passwordless sign-in.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder="Passkey name (e.g., MacBook Touch ID)" value={newPasskeyName} onChange={(e) => setNewPasskeyName(e.target.value)} className="max-w-xs" />
                    <Button onClick={handlePasskeyRegistration} disabled={passkeyLoading}>{passkeyLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}<Key className="h-4 w-4 mr-2" />Create Passkey</Button>
                  </div>
                  {passkeys.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No passkeys registered yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {passkeys.map((pk) => (
                        <div key={pk.id} className="flex items-center justify-between p-3 rounded-md border">
                          <div>
                            <p className="font-medium">{pk.name}</p>
                            <p className="text-xs text-muted-foreground">Created {formatDate(pk.created_at)} | Last used {formatDate(pk.last_used_at)}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePasskey(pk.id)} disabled={passkeyLoading}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <MFASetupModal open={showMFASetup} onClose={() => setShowMFASetup(false)} onComplete={handleMFASetupComplete} getAuthHeaders={getAuthHeaders} />

      <Dialog open={showDisableMFA} onOpenChange={(open) => { setShowDisableMFA(open); if (!open) { setDisablePassword(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>This will make your account less secure. Enter your password to confirm.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="password" placeholder="Enter your password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableMFA(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDisableMFA} disabled={mfaLoading || !disablePassword}>{mfaLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Disable MFA</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileNew;
