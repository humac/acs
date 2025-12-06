import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import TablePaginationControls from '@/components/TablePaginationControls';
import { cn } from '@/lib/utils';
import { Users, Shield, Edit, Search, Sparkles, Trash2, Loader2, AlertTriangle } from 'lucide-react';

const TeamManagement = () => {
  const { getAuthHeaders, user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', manager_name: '', manager_email: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(10);
  const [bulkRole, setBulkRole] = useState('');
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/users', { headers: { ...getAuthHeaders() } });
      if (!response.ok) throw new Error('Failed to fetch users');
      setUsers(await response.json());
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`/api/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update role');
      toast({ title: 'Success', description: `Role updated to ${newRole}`, variant: 'success' });
      fetchUsers();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      manager_name: user.manager_name || '',
      manager_email: user.manager_email || '',
    });
  };

  const handleUserUpdate = async () => {
    if (!editingUser) return;

    if (!editForm.first_name || !editForm.last_name) {
      toast({ title: 'Missing info', description: 'First and last name are required', variant: 'destructive' });
      return;
    }

    if (!editForm.manager_name || !editForm.manager_email) {
      toast({ title: 'Missing info', description: 'Manager name and email are required', variant: 'destructive' });
      return;
    }

    setSavingEdit(true);

    try {
      const response = await fetch(`/api/auth/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update user');

      toast({ title: 'Success', description: `Updated ${editingUser.email}`, variant: 'success' });
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const userToDelete = deleteDialog.user;
    setDeleteDialog({ open: false, user: null });
    try {
      const response = await fetch(`/api/auth/users/${userToDelete.id}`, {
        method: 'DELETE', headers: { ...getAuthHeaders() },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete user');
      toast({ title: 'Success', description: 'User deleted', variant: 'success' });
      fetchUsers();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const toggleUserSelect = (id) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAllUsers = () => {
    setSelectedUserIds((prev) => {
      const pageIds = paginatedUsers.map((u) => u.id);
      const hasAll = pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      pageIds.forEach((id) => {
        if (hasAll) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  const clearUserSelection = () => setSelectedUserIds(new Set());

  const handleBulkRoleUpdate = async () => {
    const ids = Array.from(selectedUserIds).filter((id) => id !== user?.id);
    if (!ids.length || !bulkRole) return;
    setSavingEdit(true);
    try {
      for (const id of ids) {
        const response = await fetch(`/api/auth/users/${id}/role`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ role: bulkRole }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update role');
      }
      toast({ title: 'Success', description: `Updated ${ids.length} user roles`, variant: 'success' });
      setBulkRole('');
      clearUserSelection();
      fetchUsers();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleBulkDeleteUsers = async () => {
    const ids = Array.from(selectedUserIds).filter((id) => id !== user?.id);
    if (!ids.length) return;
    setBulkDeleting(true);
    try {
      for (const id of ids) {
        const response = await fetch(`/api/auth/users/${id}`, { method: 'DELETE', headers: { ...getAuthHeaders() } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete user');
      }
      toast({ title: 'Success', description: `Deleted ${ids.length} user${ids.length === 1 ? '' : 's'}`, variant: 'success' });
      clearUserSelection();
      fetchUsers();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setBulkDeleting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return users.filter((u) =>
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.manager_name?.toLowerCase().includes(term) ||
      u.manager_email?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / usersPageSize) || 1);

  useEffect(() => {
    setUsersPage(1);
  }, [usersPageSize, filteredUsers.length]);

  useEffect(() => {
    if (usersPage > totalUserPages) {
      setUsersPage(totalUserPages);
    }
  }, [usersPage, totalUserPages]);

  const paginatedUsers = useMemo(() => {
    const start = (usersPage - 1) * usersPageSize;
    return filteredUsers.slice(start, start + usersPageSize);
  }, [filteredUsers, usersPage, usersPageSize]);

  const isAllUsersSelected = paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedUserIds.has(u.id));
  const isSomeUsersSelected = paginatedUsers.some((u) => selectedUserIds.has(u.id)) && !isAllUsersSelected;

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Never';
  const getRoleColor = (role) => ({ admin: 'destructive', manager: 'success', employee: 'default' }[role] || 'secondary');

  if (!['admin', 'manager'].includes(user?.role)) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Access Denied - Manager or Admin access required</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-tight">Team</h1>
            <p className="text-sm text-muted-foreground">Manage teammates, roles, and manager details.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-1">
          <CardTitle className="text-lg">Team overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users">
            <TabsList className="mb-6">
              <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" />People</TabsTrigger>
              <TabsTrigger value="policies" className="gap-2"><Shield className="h-4 w-4" />Guidance</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">User Management</h3>
                <span className="text-sm text-muted-foreground">Total: {users.length}</span>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or manager"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {selectedUserIds.size > 0 && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 rounded-lg border px-3 py-2 bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{selectedUserIds.size} selected</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Select value={bulkRole} onValueChange={setBulkRole}>
                          <SelectTrigger className="w-36"><SelectValue placeholder="Bulk role" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={handleBulkRoleUpdate} disabled={!bulkRole || savingEdit}>
                          {savingEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Apply role
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={handleBulkDeleteUsers}
                          disabled={bulkDeleting}
                        >
                          {bulkDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Delete
                        </Button>
                        <Button size="sm" variant="ghost" onClick={clearUserSelection}>Clear</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <div className="space-y-3">
                  <div className="md:hidden space-y-3">
                    {filteredUsers.length === 0 && (
                      <div className="text-center text-muted-foreground border rounded-md py-6">No users match your search.</div>
                    )}
                    {paginatedUsers.map((u) => (
                      <div
                        key={u.id}
                        className={cn(
                          'border rounded-lg p-4 flex gap-3',
                          selectedUserIds.has(u.id) && 'bg-primary/5 border-primary/30'
                        )}
                      >
                        <Checkbox
                          checked={selectedUserIds.has(u.id)}
                          onCheckedChange={() => toggleUserSelect(u.id)}
                          className="mt-1"
                          disabled={u.id === user.id}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-medium truncate">{u.name}</h4>
                              <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                            </div>
                            <Badge variant={getRoleColor(u.role)} className="uppercase">{u.role}</Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium text-foreground">Manager</span>
                              <div className="text-xs">{u.manager_name || '—'}</div>
                              <div className="text-xs">{u.manager_email || '—'}</div>
                            </div>
                            <div className="text-right text-xs">Last login<br />{formatDate(u.last_login)}</div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(u)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, user: u })} disabled={u.id === user.id}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-md border hidden md:block overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-12">
                            <Checkbox
                              checked={isAllUsersSelected ? true : isSomeUsersSelected ? 'indeterminate' : false}
                              onCheckedChange={toggleSelectAllUsers}
                            />
                          </TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Manager</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-6">No users match your search.</TableCell>
                          </TableRow>
                        )}
                        {paginatedUsers.map((u) => (
                          <TableRow key={u.id} className={selectedUserIds.has(u.id) ? 'bg-primary/5' : ''} data-state={selectedUserIds.has(u.id) ? 'selected' : undefined}>
                            <TableCell>
                              <Checkbox
                                checked={selectedUserIds.has(u.id)}
                                onCheckedChange={() => toggleUserSelect(u.id)}
                                disabled={u.id === user.id}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{u.name}</div>
                                <div className="text-sm text-muted-foreground">{u.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select value={u.role} onValueChange={(value) => handleRoleChange(u.id, value)} disabled={u.id === user.id}>
                                <SelectTrigger className="w-32 uppercase"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="employee">Employee</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{u.manager_name || '—'}</div>
                                <div className="text-muted-foreground">{u.manager_email || '—'}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(u.last_login)}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button variant="outline" size="sm" onClick={() => openEditDialog(u)}>
                                <Edit className="h-4 w-4 mr-2" />Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteDialog({ open: true, user: u })}
                                disabled={u.id === user.id}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-end">
                    <TablePaginationControls
                      page={usersPage}
                      pageSize={usersPageSize}
                      totalItems={filteredUsers.length}
                      onPageChange={setUsersPage}
                      onPageSizeChange={setUsersPageSize}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="policies" className="space-y-3">
              <Card className="border-yellow-400 bg-yellow-50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-yellow-800"><Shield className="h-5 w-5" /><CardTitle className="text-base">Team management guidance</CardTitle></div>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>Review access levels regularly to keep least-privilege in place.</li>
                    <li>Keep manager contacts current so escalations reach the right people.</li>
                    <li>Deactivate accounts quickly when someone leaves the organization.</li>
                    <li>Rotate admin duties and audit activity for sensitive actions.</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Attributes</DialogTitle>
            <DialogDescription>Update name and manager information for this user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Manager Name</label>
                <Input
                  value={editForm.manager_name}
                  onChange={(e) => setEditForm({ ...editForm, manager_name: e.target.value })}
                  placeholder="Manager name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Manager Email</label>
                <Input
                  value={editForm.manager_email}
                  onChange={(e) => setEditForm({ ...editForm, manager_email: e.target.value })}
                  placeholder="manager@email.com"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={handleUserUpdate} disabled={savingEdit}>
              {savingEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete User</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the user account and remove access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null })}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamManagement;
