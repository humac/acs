import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Settings, Users, LayoutDashboard, Database, Key, Trash2, Loader2, AlertTriangle, Shield } from 'lucide-react';
import OIDCSettings from './OIDCSettings';

const AdminSettingsNew = () => {
  const { getAuthHeaders, user } = useAuth();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [dbSettings, setDbSettings] = useState({ engine: 'sqlite', postgresUrl: '', managedByEnv: false, effectiveEngine: 'sqlite' });
  const [dbLoading, setDbLoading] = useState(false);

  useEffect(() => {
    if (activeView === 'users') fetchUsers();
    if (activeView === 'settings') fetchDatabaseSettings();
  }, [activeView]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/users', { headers: { ...getAuthHeaders() } });
      if (!response.ok) throw new Error('Failed to fetch users');
      setUsers(await response.json());
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

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

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`/api/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ role: newRole })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update role');
      toast({ title: "Success", description: `Role updated to ${newRole}`, variant: "success" });
      fetchUsers();
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteConfirm = async () => {
    const userToDelete = deleteDialog.user;
    setDeleteDialog({ open: false, user: null });
    try {
      const response = await fetch(`/api/auth/users/${userToDelete.id}`, {
        method: 'DELETE', headers: { ...getAuthHeaders() }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete user');
      toast({ title: "Success", description: "User deleted", variant: "success" });
      fetchUsers();
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
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

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Never';
  const getRoleColor = (role) => ({ admin: 'destructive', manager: 'success', employee: 'default' }[role] || 'secondary');

  if (user?.role !== 'admin') {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Access Denied - Admin access required</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>Admin Settings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeView} onValueChange={setActiveView}>
            <TabsList className="mb-6">
              <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" />Users</TabsTrigger>
              <TabsTrigger value="overview" className="gap-2"><LayoutDashboard className="h-4 w-4" />Overview</TabsTrigger>
              <TabsTrigger value="settings" className="gap-2"><Database className="h-4 w-4" />Database</TabsTrigger>
              <TabsTrigger value="oidc" className="gap-2"><Key className="h-4 w-4" />OIDC/SSO</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">User Management</h3>
                <span className="text-sm text-muted-foreground">Total: {users.length}</span>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell className="hidden md:table-cell">{u.email}</TableCell>
                          <TableCell>
                            <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)} disabled={u.id === user.id}>
                              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="employee">Employee</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">{formatDate(u.last_login)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, user: u })} disabled={u.id === user.id}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <Card className="bg-muted/50">
                <CardHeader><CardTitle className="text-base">Role Descriptions</CardTitle></CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div><Badge variant="destructive">Admin</Badge><p className="text-sm text-muted-foreground mt-1">Full system access, can manage all users and settings.</p></div>
                  <div><Badge variant="success">Manager</Badge><p className="text-sm text-muted-foreground mt-1">View own + team assets, access team audit reports.</p></div>
                  <div><Badge variant="secondary">Employee</Badge><p className="text-sm text-muted-foreground mt-1">Can only view and manage own asset registrations.</p></div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overview">
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card className="bg-primary text-primary-foreground"><CardContent className="pt-6"><div className="text-3xl font-bold">{users.length}</div><p className="text-sm opacity-80">Total Users</p></CardContent></Card>
                <Card className="bg-red-500 text-white"><CardContent className="pt-6"><div className="text-3xl font-bold">{users.filter(u => u.role === 'admin').length}</div><p className="text-sm opacity-80">Administrators</p></CardContent></Card>
                <Card className="bg-green-500 text-white"><CardContent className="pt-6"><div className="text-3xl font-bold">{users.filter(u => u.role === 'manager').length}</div><p className="text-sm opacity-80">Managers</p></CardContent></Card>
                <Card className="bg-blue-500 text-white"><CardContent className="pt-6"><div className="text-3xl font-bold">{users.filter(u => u.role === 'employee').length}</div><p className="text-sm opacity-80">Employees</p></CardContent></Card>
              </div>
              <Card>
                <CardHeader><CardTitle className="text-base">System Information</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Application:</strong> ARS - Asset Registration System</p>
                  <p><strong>Purpose:</strong> SOC2 Compliance - Track and manage client assets</p>
                  <p><strong>Features:</strong> Role-based access, Asset tracking, Company management, Audit logging, CSV exports</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Database Configuration</CardTitle>
                  <CardDescription>Choose SQLite (default) or PostgreSQL for production.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={dbSettings.effectiveEngine === 'postgres' ? 'success' : 'secondary'}>{dbSettings.effectiveEngine.toUpperCase()}</Badge>
                    {dbSettings.managedByEnv && <Badge variant="warning">Managed by ENV</Badge>}
                  </div>
                  <Select value={dbSettings.engine} onValueChange={(v) => setDbSettings({ ...dbSettings, engine: v })} disabled={dbSettings.managedByEnv || dbLoading}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sqlite">SQLite (default)</SelectItem>
                      <SelectItem value="postgres">PostgreSQL</SelectItem>
                    </SelectContent>
                  </Select>
                  {dbSettings.engine === 'postgres' && (
                    <Input placeholder="postgresql://user:pass@host:5432/database" value={dbSettings.postgresUrl} onChange={(e) => setDbSettings({ ...dbSettings, postgresUrl: e.target.value })} disabled={dbSettings.managedByEnv || dbLoading} />
                  )}
                  <Button onClick={handleDatabaseSave} disabled={dbSettings.managedByEnv || dbLoading}>
                    {dbLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save Database Settings
                  </Button>
                  <p className="text-xs text-muted-foreground">Restart the backend after changing database settings.</p>
                </CardContent>
              </Card>
              <Card className="border-yellow-400 bg-yellow-50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-yellow-600" /><CardTitle className="text-base text-yellow-800">Security Best Practices</CardTitle></div>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>Regularly review user roles and permissions</li>
                    <li>Remove inactive user accounts</li>
                    <li>Monitor audit logs for suspicious activity</li>
                    <li>Keep the application updated</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="oidc">
              <OIDCSettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete User</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{deleteDialog.user?.name}"? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null })}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSettingsNew;
