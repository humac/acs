import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Building2, Plus, Edit, Trash2, Upload, Download, Loader2 } from 'lucide-react';

const CompanyManagementNew = () => {
  const { getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, company: null });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => { fetchCompanies(); }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/companies', { headers: { ...getAuthHeaders() } });
      if (!response.ok) throw new Error('Failed to fetch companies');
      setCompanies(await response.json());
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const url = editingCompany ? `/api/companies/${editingCompany.id}` : '/api/companies';
      const response = await fetch(url, {
        method: editingCompany ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save company');
      toast({ title: "Success", description: `Company ${editingCompany ? 'updated' : 'added'} successfully`, variant: "success" });
      setShowForm(false);
      setFormData({ name: '', description: '' });
      setEditingCompany(null);
      fetchCompanies();
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setFormLoading(false); }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({ name: company.name, description: company.description || '' });
    setShowForm(true);
  };

  const handleDeleteConfirm = async () => {
    const company = deleteDialog.company;
    setDeleteDialog({ open: false, company: null });
    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'DELETE', headers: { ...getAuthHeaders() }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete company');
      toast({ title: "Success", description: "Company deleted successfully", variant: "success" });
      fetchCompanies();
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    setFormLoading(true);
    setImportResult(null);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', importFile);
      const response = await fetch('/api/companies/import', {
        method: 'POST', headers: { ...getAuthHeaders() }, body: formDataUpload
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to import');
      setImportResult(data);
      toast({ title: "Success", description: data.message, variant: "success" });
      setImportFile(null);
      fetchCompanies();
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setFormLoading(false); }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const handleAddClick = () => {
    setEditingCompany(null);
    setFormData({ name: '', description: '' });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading companies...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Company Management ({companies.length})</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImportModal(true)}>
              <Upload className="h-4 w-4 mr-2" />Import
            </Button>
            <Button onClick={handleAddClick}>
              <Plus className="h-4 w-4 mr-2" />Add Company
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No companies registered yet.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{company.description || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(company.created_date)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(company)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialog({ open: true, company })}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCompany ? 'Edit Company' : 'Add New Company'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Acme Corporation" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description..." rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingCompany ? 'Update' : 'Add'} Company
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, company: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{deleteDialog.company?.name}"? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, company: null })}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImportModal} onOpenChange={(open) => { setShowImportModal(open); if (!open) { setImportFile(null); setImportResult(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Companies from CSV</DialogTitle>
            <DialogDescription>Upload a CSV file with company names and descriptions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleImport} className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant="outline" asChild>
                <label className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {importFile ? 'Change File' : 'Choose CSV'}
                  <input type="file" accept=".csv" className="hidden" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
                </label>
              </Button>
              <Button type="button" variant="ghost" asChild>
                <a href="/import_companies.csv" download><Download className="h-4 w-4 mr-2" />Example</a>
              </Button>
            </div>
            {importFile && <p className="text-sm text-muted-foreground">Selected: {importFile.name}</p>}
            {importResult && <div className="rounded-md bg-green-50 text-green-900 p-4 text-sm">{importResult.message}</div>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowImportModal(false)}>Cancel</Button>
              <Button type="submit" disabled={formLoading || !importFile}>
                {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Import
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyManagementNew;
