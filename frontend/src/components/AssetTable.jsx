import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../contexts/UsersContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TablePaginationControls from '@/components/TablePaginationControls';
import AssetTableRow from '@/components/AssetTableRow';
import AssetCard from '@/components/AssetCard';
import AssetTableFilters from '@/components/AssetTableFilters';
import BulkAssetActions from '@/components/BulkAssetActions';
import { Laptop, SearchX } from 'lucide-react';

export default function AssetTable({ assets = [], onEdit, onDelete, currentUser, onRefresh }) {
  const { getAuthHeaders } = useAuth();
  const { getFullName, getEmail } = useUsers();
  const { toast } = useToast();
  
  const [deleteDialog, setDeleteDialog] = useState({ open: false, asset: null });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState({ open: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [assetTypeFilter, setAssetTypeFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all');
  const [companies, setCompanies] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsInitialLoading(true);
      try {
        const [compRes, typeRes] = await Promise.all([
          fetch('/api/companies/names', { headers: { ...getAuthHeaders() } }),
          fetch('/api/asset-types', { headers: { ...getAuthHeaders() } })
        ]);
        if (compRes.ok) setCompanies(await compRes.json());
        if (typeRes.ok) setAssetTypes(await typeRes.json());
      } catch (err) {
        console.error('Failed to fetch filters:', err);
      } finally {
        setIsInitialLoading(false);
      }
    }
    fetchData();
  }, [getAuthHeaders]);

  const handleStatusUpdated = () => {
    if (onRefresh) onRefresh();
  };

  async function handleDeleteConfirm() {
    const asset = deleteDialog.asset;
    setDeleteDialog({ open: false, asset: null });
    try {
      const res = await fetch(`/api/assets/${asset.id}`, { 
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
      if (!res.ok) throw new Error('Delete failed');
      toast({ title: "Success", description: "Asset deleted successfully", variant: "success" });
      onDelete(asset.id);
    } catch (err) {
      toast({ title: "Error", description: 'Unable to delete asset.', variant: "destructive" });
    }
  }

  async function handleBulkDelete() {
    // Show confirmation dialog
    setBulkDeleteDialog({ open: true });
  }

  async function handleBulkDeleteConfirm() {
    setBulkDeleteDialog({ open: false });
    const ids = Array.from(selectedIds);
    
    try {
      const res = await fetch('/api/assets/bulk/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ ids })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Bulk delete failed');
      }
      
      const data = await res.json();
      toast({ 
        title: "Success", 
        description: data.message || `Deleted ${ids.length} asset${ids.length === 1 ? '' : 's'}`, 
        variant: "success" 
      });
      
      // Clear selection and refresh
      setSelectedIds(new Set());
      if (onRefresh) onRefresh();
    } catch (err) {
      toast({ 
        title: "Error", 
        description: err.message || 'Unable to delete assets.', 
        variant: "destructive" 
      });
    }
  }

  const canEdit = (asset) => currentUser?.role === 'admin' || (currentUser?.email?.toLowerCase() === asset.employee_email?.toLowerCase());
  const canDelete = (asset) => currentUser?.role === 'admin';

  const assetsWithManagerData = useMemo(() => assets.map(asset => ({
    ...asset,
    _managerDisplayName: asset.manager_first_name ? `${asset.manager_first_name} ${asset.manager_last_name}` : getFullName(asset.manager_id),
    _managerEmail: asset.manager_email || getEmail(asset.manager_id)
  })), [assets, getFullName, getEmail]);

  const filteredAssets = useMemo(() => {
    return assetsWithManagerData.filter(asset => {
      const matchesSearch = !searchTerm || [
        asset.employee_first_name, asset.employee_last_name, asset.employee_email,
        asset.serial_number, asset.asset_tag, asset.company_name, asset.make, asset.model
      ].some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()));

      const employeeName = `${asset.employee_first_name || ''} ${asset.employee_last_name || ''}`.trim();
      const managerName = `${asset.manager_first_name || ''} ${asset.manager_last_name || ''}`.trim();

      return matchesSearch &&
        (statusFilter === 'all' || asset.status === statusFilter) &&
        (companyFilter === 'all' || asset.company_name === companyFilter) &&
        (assetTypeFilter === 'all' || asset.asset_type === assetTypeFilter) &&
        (employeeFilter === 'all' || employeeName === employeeFilter) &&
        (managerFilter === 'all' || managerName === managerFilter);
    });
  }, [assetsWithManagerData, searchTerm, statusFilter, companyFilter, assetTypeFilter, employeeFilter, managerFilter]);

  const uniqueEmployees = useMemo(() => {
    const employeeMap = new Map();
    assets.forEach(asset => {
      if (asset.employee_email) {
        const name = `${asset.employee_first_name || ''} ${asset.employee_last_name || ''}`.trim();
        if (name && !employeeMap.has(asset.employee_email)) {
          employeeMap.set(asset.employee_email, { email: asset.employee_email, name });
        }
      }
    });
    return Array.from(employeeMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [assets]);

  const uniqueManagers = useMemo(() => {
    const managerMap = new Map();
    assets.forEach(asset => {
      if (asset.manager_email) {
        const name = `${asset.manager_first_name || ''} ${asset.manager_last_name || ''}`.trim();
        if (name && !managerMap.has(asset.manager_email)) {
          managerMap.set(asset.manager_email, { email: asset.manager_email, name });
        }
      }
    });
    return Array.from(managerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [assets]);

  const paginatedAssets = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAssets.slice(start, start + pageSize);
  }, [filteredAssets, page, pageSize]);

  const toggleSelectAll = () => {
    const pageIds = paginatedAssets.map(a => a.id);
    const allSelected = pageIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      pageIds.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  if (isInitialLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 w-full glass-panel shimmer rounded-lg" />
        <div className="h-64 w-full glass-panel shimmer rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="glass-panel p-4 rounded-xl border-glass">
        <AssetTableFilters
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          assetTypeFilter={assetTypeFilter} setAssetTypeFilter={setAssetTypeFilter}
          companyFilter={companyFilter} setCompanyFilter={setCompanyFilter}
          employeeFilter={employeeFilter} setEmployeeFilter={setEmployeeFilter}
          managerFilter={managerFilter} setManagerFilter={setManagerFilter}
          companies={companies} assetTypes={assetTypes}
          uniqueEmployees={uniqueEmployees}
          uniqueManagers={uniqueManagers}
          onClearFilters={() => {
            setSearchTerm(''); 
            setStatusFilter('all'); 
            setCompanyFilter('all');
            setAssetTypeFilter('all');
            setEmployeeFilter('all');
            setManagerFilter('all');
          }}
        />
      </section>

      <BulkAssetActions
        selectedIds={selectedIds}
        filteredAssets={filteredAssets}
        allAssets={assets}
        hasActiveFilters={searchTerm !== '' || statusFilter !== 'all' || companyFilter !== 'all' || assetTypeFilter !== 'all' || employeeFilter !== 'all' || managerFilter !== 'all'}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkDelete={handleBulkDelete}
        onRefresh={onRefresh}
        currentUser={currentUser}
      />

      <div className="glass-panel overflow-hidden rounded-2xl border-glass shadow-2xl">
        {filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-surface/20">
            <SearchX className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No assets found matching your criteria</p>
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-4 p-4 bg-surface/10">
              {paginatedAssets.map((asset, index) => (
                <AssetCard 
                  key={asset.id} 
                  asset={asset} 
                  isSelected={selectedIds.has(asset.id)}
                  canEdit={canEdit(asset)}
                  canDelete={canDelete(asset)}
                  onEdit={() => onEdit(asset)}
                  onDelete={() => setDeleteDialog({ open: true, asset })}
                  onStatusUpdated={handleStatusUpdated}
                  index={index}
                />
              ))}
            </div>

            <Table className="hidden md:table w-full">
              <TableHeader className="bg-muted/20 dark:bg-white/[0.02] border-b border-white/10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 px-4">
                    <Checkbox
                      checked={paginatedAssets.length > 0 && paginatedAssets.every(a => selectedIds.has(a.id))}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="caption-label">Employee / Owner</TableHead>
                  <TableHead className="caption-label">Company</TableHead>
                  <TableHead className="caption-label">Asset Type</TableHead>
                  <TableHead className="caption-label">Asset Tag</TableHead>
                  <TableHead className="caption-label">Status</TableHead>
                  <TableHead className="text-right pr-4 caption-label">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAssets.map((asset, index) => (
                  <AssetTableRow 
                    key={asset.id} 
                    asset={asset}
                    index={index}
                    isSelected={selectedIds.has(asset.id)}
                    canEdit={canEdit(asset)}
                    canDelete={canDelete(asset)}
                    onToggleSelect={() => {
                      const next = new Set(selectedIds);
                      next.has(asset.id) ? next.delete(asset.id) : next.add(asset.id);
                      setSelectedIds(next);
                    }}
                    onEdit={() => onEdit(asset)}
                    onDelete={() => setDeleteDialog({ open: true, asset })}
                    onStatusUpdated={handleStatusUpdated}
                  />
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </div>

      <TablePaginationControls
        className="glass-panel p-2 rounded-xl border-glass bg-surface/50"
        page={page} pageSize={pageSize} totalItems={filteredAssets.length}
        onPageChange={setPage} onPageSizeChange={setPageSize}
      />

      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, asset: null })}>
        <DialogContent className="glass-overlay">
          <DialogHeader>
            <DialogTitle className="text-gradient text-2xl">Confirm Permanent Deletion</DialogTitle>
            <DialogDescription className="pt-2">
              You are about to remove <span className="font-bold text-foreground">"{deleteDialog.asset?.employee_first_name} {deleteDialog.asset?.employee_last_name}"'s</span> asset from the secure registry. This cannot be reversed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteDialog({ open: false, asset: null })}>Cancel</Button>
            <Button variant="destructive" className="shadow-glow-destructive" onClick={handleDeleteConfirm}>Delete Asset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkDeleteDialog.open} onOpenChange={(open) => !open && setBulkDeleteDialog({ open: false })}>
        <DialogContent className="glass-overlay">
          <DialogHeader>
            <DialogTitle className="text-gradient text-2xl">Confirm Bulk Deletion</DialogTitle>
            <DialogDescription className="pt-2">
              You are about to permanently delete <span className="font-bold text-foreground">{selectedIds.size} asset{selectedIds.size === 1 ? '' : 's'}</span> from the secure registry. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setBulkDeleteDialog({ open: false })}>Cancel</Button>
            <Button variant="destructive" className="shadow-glow-destructive" onClick={handleBulkDeleteConfirm}>Delete {selectedIds.size} Asset{selectedIds.size === 1 ? '' : 's'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
