import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ASSET_STATUS_OPTIONS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ClipboardCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Package,
  Plus,
  PlayCircle,
  RefreshCw,
  Calendar,
  Clock
} from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import CompanyCombobox from '@/components/CompanyCombobox';

export default function MyAttestationsPage() {
  const { getAuthHeaders, user } = useAuth();
  const { toast } = useToast();
  const [attestations, setAttestations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAttestationModal, setShowAttestationModal] = useState(false);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [selectedAttestation, setSelectedAttestation] = useState(null);
  const [attestationDetails, setAttestationDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [completingAttestation, setCompletingAttestation] = useState(false);
  const [_attestedAssetIds, setAttestedAssetIds] = useState(new Set());
  const [certifiedAssetIds, setCertifiedAssetIds] = useState(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [newAssetForm, setNewAssetForm] = useState({
    asset_type: '',
    make: '',
    model: '',
    serial_number: '',
    asset_tag: '',
    notes: '',
    employee_first_name: '',
    employee_last_name: '',
    employee_email: '',
    manager_first_name: '',
    manager_last_name: '',
    manager_email: '',
    company_id: null,
    status: 'active',
    issued_date: '',
    returned_date: ''
  });
  const [returnedDates, setReturnedDates] = useState({});
  const [assetTypes, setAssetTypes] = useState([]);
  const [loadingAssetTypes, setLoadingAssetTypes] = useState(false);
  const [_selectedCompany, setSelectedCompany] = useState(null);

  const loadAttestations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/attestation/my-attestations', {
        headers: { ...getAuthHeaders() }
      });
      if (!res.ok) throw new Error('Failed to load attestations');
      const data = await res.json();
      setAttestations(data.attestations || []);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to load attestations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttestations();
    fetchAssetTypes();
  }, []);

  const fetchAssetTypes = async () => {
    setLoadingAssetTypes(true);
    try {
      const response = await fetch('/api/asset-types', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setAssetTypes(data);
      } else {
        console.error('Failed to fetch asset types');
      }
    } catch (error) {
      console.error('Error fetching asset types:', error);
    } finally {
      setLoadingAssetTypes(false);
    }
  };

  // fetchCompanies removed - using CompanyCombobox which handles its own data loading

  const handleOpenAddAssetModal = async () => {
    const campaign = attestationDetails?.campaign;
    const isCompanyScoped = campaign?.target_type === 'companies';

    // Get the target company ID for company-scoped campaigns
    let targetCompanyId = null;
    if (isCompanyScoped && campaign?.target_company_ids) {
      try {
        const targetCompanyIds = JSON.parse(campaign.target_company_ids);
        targetCompanyId = targetCompanyIds.length > 0 ? targetCompanyIds[0] : null;
      } catch (e) {
        console.error('Error parsing target_company_ids:', e);
      }
    }

    // Initialize form with user info
    setNewAssetForm({
      asset_type: '',
      make: '',
      model: '',
      serial_number: '',
      asset_tag: '',
      notes: '',
      employee_first_name: user?.first_name || '',
      employee_last_name: user?.last_name || '',
      employee_email: user?.email || '',
      manager_first_name: user?.manager_first_name || '',
      manager_last_name: user?.manager_last_name || '',
      manager_email: user?.manager_email || '',
      company_id: targetCompanyId,
      status: 'active',
      issued_date: '',
      returned_date: ''
    });

    // Set selected company for company-scoped campaigns
    if (targetCompanyId) {
      setSelectedCompany({ id: targetCompanyId, name: '' }); // Name will be loaded by CompanyCombobox
    } else {
      setSelectedCompany(null);
    }

    setShowAddAssetModal(true);
  };

  const handleStartAttestation = async (attestation) => {
    setSelectedAttestation(attestation);
    setShowAttestationModal(true);
    setLoadingDetails(true);

    try {
      const res = await fetch(`/api/attestation/records/${attestation.id}`, {
        headers: { ...getAuthHeaders() }
      });

      if (!res.ok) throw new Error('Failed to load attestation details');

      const data = await res.json();
      setAttestationDetails(data);

      // Track which assets have been attested
      const attestedIds = new Set(data.attestedAssets?.map(a => a.asset_id) || []);
      setAttestedAssetIds(attestedIds);
      // Note: Already attested assets from previous sessions are considered certified
      // to avoid requiring users to re-certify assets they've already confirmed
      setCertifiedAssetIds(attestedIds);

      // Initialize selected statuses with current asset statuses
      const statuses = {};
      data.assets?.forEach(asset => {
        statuses[asset.id] = asset.status;
      });
      setSelectedStatuses(statuses);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to load attestation details',
        variant: 'destructive'
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCertifyAsset = async (asset) => {
    try {
      // Get the selected status for this asset (or use current status if not changed)
      const status = selectedStatuses[asset.id] || asset.status;
      const returnedDate = returnedDates[asset.id] || '';

      // Validate returned_date is required when status is 'returned'
      if (status === 'returned' && !returnedDate) {
        toast({
          title: 'Validation Error',
          description: 'Returned date is required when status is Returned',
          variant: 'destructive'
        });
        return;
      }

      const res = await fetch(`/api/attestation/records/${selectedAttestation.id}/assets/${asset.id}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attested_status: status,
          returned_date: status === 'returned' ? returnedDate : null,
          notes: ''
        })
      });

      if (!res.ok) throw new Error('Failed to certify asset');

      toast({
        title: 'Success',
        description: 'Asset certified successfully',
        variant: 'success'
      });

      // Mark this asset as attested and certified
      setAttestedAssetIds(prev => new Set([...prev, asset.id]));
      setCertifiedAssetIds(prev => new Set([...prev, asset.id]));

      // Reload details to get updated info
      handleStartAttestation(selectedAttestation);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to certify asset',
        variant: 'destructive'
      });
    }
  };

  const handleStatusChange = (assetId, newStatus) => {
    setSelectedStatuses(prev => ({
      ...prev,
      [assetId]: newStatus
    }));
    // Clear returned_date if status is not 'returned'
    if (newStatus !== 'returned') {
      setReturnedDates(prev => {
        const updated = { ...prev };
        delete updated[assetId];
        return updated;
      });
    }
  };

  const handleReturnedDateChange = (assetId, date) => {
    setReturnedDates(prev => ({
      ...prev,
      [assetId]: date
    }));
  };

  const handleAddNewAsset = async () => {
    // Validate required fields
    if (!newAssetForm.asset_type || !newAssetForm.serial_number || !newAssetForm.asset_tag ||
      !newAssetForm.employee_first_name || !newAssetForm.employee_last_name || !newAssetForm.employee_email ||
      !newAssetForm.company_id) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    // Validate returned_date is required when status is 'returned'
    if (newAssetForm.status === 'returned' && !newAssetForm.returned_date) {
      toast({
        title: 'Validation Error',
        description: 'Returned date is required when status is Returned',
        variant: 'destructive'
      });
      return;
    }

    try {
      const res = await fetch(`/api/attestation/records/${selectedAttestation.id}/assets/new`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(newAssetForm)
      });

      if (!res.ok) throw new Error('Failed to add new asset');

      toast({
        title: 'Success',
        description: 'New asset added successfully',
        variant: 'success'
      });

      setShowAddAssetModal(false);
      setNewAssetForm({
        asset_type: '',
        make: '',
        model: '',
        serial_number: '',
        asset_tag: '',
        notes: '',
        employee_first_name: '',
        employee_last_name: '',
        employee_email: '',
        manager_first_name: '',
        manager_last_name: '',
        manager_email: '',
        company_id: null,
        status: 'active',
        issued_date: '',
        returned_date: ''
      });

      // Reload details to show the new asset
      handleStartAttestation(selectedAttestation);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to add new asset',
        variant: 'destructive'
      });
    }
  };

  const handleCompleteAttestation = async () => {
    setCompletingAttestation(true);
    try {
      const res = await fetch(`/api/attestation/records/${selectedAttestation.id}/complete`, {
        method: 'POST',
        headers: { ...getAuthHeaders() }
      });

      if (!res.ok) throw new Error('Failed to complete attestation');

      toast({
        title: 'Success',
        description: 'Attestation completed successfully',
        variant: 'success'
      });

      setShowAttestationModal(false);
      setCertifiedAssetIds(new Set());
      setSelectedStatuses({});
      loadAttestations();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to complete attestation',
        variant: 'destructive'
      });
    } finally {
      setCompletingAttestation(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
        </div>
        <span className="mt-4 text-muted-foreground font-medium tracking-tight">Loading your attestations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 md:p-2 animate-fade-in min-h-screen">
      {/* Header Card */}
      <Card variant="glass">
        <CardHeader className="space-y-3 md:space-y-4 px-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="icon-box icon-box-sm bg-primary/10 border-primary/20">
                <ClipboardCheck size={20} className="text-primary" />
              </div>
              <CardTitle className="text-lg sm:text-xl text-gradient">My Attestations ({attestations.length})</CardTitle>
            </div>
            {attestations.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {attestations.some(a => a.status === 'pending' || a.status === 'in_progress') ? (
                  <div className="glass-panel px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                    <span className="text-warning">Action Required</span>
                  </div>
                ) : (
                  <div className="glass-panel px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    <span className="text-success">All Complete</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {attestations.length === 0 ? (
            <div className="glass-panel rounded-2xl text-center py-16 animate-fade-in">
              <div className="icon-box icon-box-lg bg-primary/10 border-primary/20 mx-auto mb-6">
                <ClipboardCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No pending attestations</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You don't have any pending asset attestations at this time
              </p>
            </div>
          ) : (
            <div className="bento-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {attestations.map((attestation, index) => {
                const statusConfig = {
                  pending: { class: 'glow-warning', label: 'Pending', icon: AlertCircle },
                  in_progress: { class: 'glow-primary', label: 'In Progress', icon: RefreshCw },
                  completed: { class: 'glow-success', label: 'Completed', icon: CheckCircle2 }
                };
                const statusInfo = statusConfig[attestation.status] || statusConfig.pending;
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={attestation.id}
                    className="bento-card p-5 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Campaign Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="icon-box icon-box-sm bg-primary/10 border-primary/20">
                            <StatusIcon className="h-4 w-4 text-primary" />
                          </div>
                          <h3 className="font-bold text-lg truncate">{attestation.campaign?.name}</h3>
                        </div>
                        {attestation.campaign?.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {attestation.campaign?.description}
                          </p>
                        )}
                      </div>
                      <Badge className={cn("shrink-0", statusInfo.class)}>
                        {statusInfo.label}
                      </Badge>
                    </div>

                    {/* Date Info */}
                    <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-xl bg-surface/50">
                      <div>
                        <p className="caption-label mb-1">Started</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {new Date(attestation.campaign?.start_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="caption-label mb-1">Completed</p>
                        <div className="flex items-center gap-2">
                          {attestation.completed_at ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-success" />
                              <p className="text-sm font-medium text-success">
                                {new Date(attestation.completed_at).toLocaleDateString()}
                              </p>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <p className="text-sm font-medium text-muted-foreground">Not yet</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    {attestation.status !== 'completed' && (
                      <Button
                        onClick={() => handleStartAttestation(attestation)}
                        className="w-full btn-interactive"
                      >
                        {attestation.status === 'pending' ? (
                          <>
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Start Attestation
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Continue Attestation
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attestation Modal */}
      <Dialog open={showAttestationModal} onOpenChange={setShowAttestationModal}>
        <DialogContent className="glass-overlay max-w-[95vw] sm:max-w-2xl md:max-w-4xl max-h-[80vh] overflow-y-auto animate-scale-in">
          <DialogHeader>
            <DialogTitle>Asset Attestation: {attestationDetails?.campaign?.name}</DialogTitle>
            <DialogDescription>
              Review each asset and confirm its status. You can also add any missing assets.
            </DialogDescription>
          </DialogHeader>
          {loadingDetails ? (
            <div className="flex flex-col items-center justify-center h-32 animate-fade-in">
              <div className="relative">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
              </div>
              <span className="mt-4 text-sm text-muted-foreground">Loading attestation details...</span>
            </div>
          ) : attestationDetails ? (
            <div className="space-y-6">
              {/* Assets Table */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Your Assets
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenAddAssetModal}
                    className="btn-interactive"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Missing Asset
                  </Button>
                </div>

                {attestationDetails.assets?.length === 0 ? (
                  <div className="glass-panel rounded-2xl text-center py-12">
                    <div className="icon-box icon-box-lg bg-primary/10 border-primary/20 mx-auto mb-4">
                      <Package className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground">
                      No assets registered yet. Click "Add Missing Asset" to add one.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block glass-panel rounded-2xl overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Make/Model</TableHead>
                            <TableHead>Serial Number</TableHead>
                            <TableHead>Current Status</TableHead>
                            <TableHead>Update Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attestationDetails.assets?.map((asset) => {
                            const isCertified = certifiedAssetIds.has(asset.id);
                            const selectedStatus = selectedStatuses[asset.id] || asset.status;
                            const showReturnedDate = selectedStatus === 'returned' && !isCertified;
                            return (
                              <TableRow key={asset.id} className={isCertified ? 'bg-success/10' : ''}>
                                <TableCell className="font-medium">{asset.asset_type}</TableCell>
                                <TableCell>
                                  {asset.make} {asset.model}
                                </TableCell>
                                <TableCell>{asset.serial_number}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{asset.status}</Badge>
                                </TableCell>
                                <TableCell>
                                  {isCertified ? (
                                    <div className="space-y-1">
                                      <Badge variant="outline">{selectedStatus}</Badge>
                                      {asset.returned_date && (
                                        <div className="text-xs text-muted-foreground">
                                          Returned: {new Date(asset.returned_date).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <Select
                                        value={selectedStatus}
                                        onValueChange={(value) => handleStatusChange(asset.id, value)}
                                      >
                                        <SelectTrigger className="w-[180px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {ASSET_STATUS_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                              {option.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      {showReturnedDate && (
                                        <div className="space-y-1">
                                          <Label htmlFor={`returned-date-${asset.id}`} className="text-xs text-muted-foreground">
                                            Returned Date *
                                          </Label>
                                          <Input
                                            id={`returned-date-${asset.id}`}
                                            type="date"
                                            value={returnedDates[asset.id] || ''}
                                            onChange={(e) => handleReturnedDateChange(asset.id, e.target.value)}
                                            className="w-[180px]"
                                            required
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {isCertified ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <Badge className="glow-success">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Certified
                                      </Badge>
                                    </div>
                                  ) : (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleCertifyAsset(asset)}
                                      disabled={selectedStatus === 'returned' && !returnedDates[asset.id]}
                                      title="Certify this asset"
                                      className="btn-interactive"
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-4">
                      {attestationDetails.assets?.map((asset, index) => {
                        const isCertified = certifiedAssetIds.has(asset.id);
                        const selectedStatus = selectedStatuses[asset.id] || asset.status;
                        const showReturnedDate = selectedStatus === 'returned' && !isCertified;
                        return (
                          <div
                            key={asset.id}
                            className={cn(
                              "bento-card animate-slide-up",
                              isCertified && "border-success/30 bg-success/5"
                            )}
                            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="icon-box icon-box-sm bg-primary/10 border-primary/20">
                                    <Package className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <div className="font-semibold">{asset.asset_type}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {asset.make} {asset.model}
                                    </div>
                                  </div>
                                </div>
                                {isCertified && (
                                  <Badge className="glow-success">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Certified
                                  </Badge>
                                )}
                              </div>

                              <div className="text-xs text-muted-foreground p-2 rounded bg-muted/30">
                                SN: {asset.serial_number}
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <Label className="caption-label">Current Status</Label>
                                  <div className="mt-1">
                                    <Badge variant="secondary">{asset.status}</Badge>
                                  </div>
                                </div>

                                <div>
                                  <Label className="caption-label">Update Status</Label>
                                  {isCertified ? (
                                    <div className="mt-1 space-y-1">
                                      <Badge variant="outline">{selectedStatus}</Badge>
                                      {asset.returned_date && (
                                        <div className="text-xs text-muted-foreground">
                                          Returned: {new Date(asset.returned_date).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="mt-1 space-y-2">
                                      <Select
                                        value={selectedStatus}
                                        onValueChange={(value) => handleStatusChange(asset.id, value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {ASSET_STATUS_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                              {option.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      {showReturnedDate && (
                                        <div className="space-y-1">
                                          <Label htmlFor={`returned-date-mobile-${asset.id}`} className="text-xs text-muted-foreground">
                                            Returned Date *
                                          </Label>
                                          <Input
                                            id={`returned-date-mobile-${asset.id}`}
                                            type="date"
                                            value={returnedDates[asset.id] || ''}
                                            onChange={(e) => handleReturnedDateChange(asset.id, e.target.value)}
                                            required
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {!isCertified && (
                                <Button
                                  className="w-full btn-interactive"
                                  onClick={() => handleCertifyAsset(asset)}
                                  disabled={selectedStatus === 'returned' && !returnedDates[asset.id]}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Certify Asset
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* New Assets Added */}
              {attestationDetails.newAssets?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-success" />
                    Newly Added Assets
                  </h3>
                  <div className="glass-panel rounded-2xl overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Make/Model</TableHead>
                          <TableHead>Serial Number</TableHead>
                          <TableHead>Asset Tag</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attestationDetails.newAssets?.map((asset, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{asset.asset_type}</TableCell>
                            <TableCell>
                              {asset.make} {asset.model}
                            </TableCell>
                            <TableCell>{asset.serial_number}</TableCell>
                            <TableCell>{asset.asset_tag}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{asset.status || 'active'}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Complete Button */}
              <div className="glass-panel rounded-2xl p-4 space-y-3 border-primary/20">
                {attestationDetails.assets?.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="caption-label mb-1">Certification Progress</p>
                      <p className="font-semibold text-lg">
                        {certifiedAssetIds.size} of {attestationDetails.assets.length} assets certified
                      </p>
                    </div>
                    {certifiedAssetIds.size < attestationDetails.assets.length && (
                      <Badge className="glow-warning">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Certify all to complete
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAttestationModal(false)} className="btn-interactive">
                    Close
                  </Button>
                  <Button
                    onClick={handleCompleteAttestation}
                    disabled={
                      completingAttestation ||
                      // Disable if there are assets but not all are certified
                      (attestationDetails.assets?.length > 0 &&
                        certifiedAssetIds.size < attestationDetails.assets.length)
                    }
                    className="btn-interactive"
                  >
                    {completingAttestation ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    {completingAttestation ? 'Completing...' : 'Complete Attestation'}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Add New Asset Modal */}
      <Dialog open={showAddAssetModal} onOpenChange={setShowAddAssetModal}>
        <DialogContent className="glass-overlay max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
          <DialogHeader>
            <DialogTitle>Add Missing Asset</DialogTitle>
            <DialogDescription>
              Add an asset that you have but isn't currently registered in the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="asset_type">Asset Type *</Label>
              {loadingAssetTypes ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading asset types...
                </div>
              ) : assetTypes.length > 0 ? (
                <Select
                  value={newAssetForm.asset_type}
                  onValueChange={(value) => setNewAssetForm({ ...newAssetForm, asset_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes.map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No asset types available
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={newAssetForm.make}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, make: e.target.value })}
                  placeholder="e.g., Dell"
                />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={newAssetForm.model}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, model: e.target.value })}
                  placeholder="e.g., XPS 13"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="serial_number">Serial Number *</Label>
              <Input
                id="serial_number"
                value={newAssetForm.serial_number}
                onChange={(e) => setNewAssetForm({ ...newAssetForm, serial_number: e.target.value })}
                placeholder="Enter serial number"
              />
            </div>
            <div>
              <Label htmlFor="asset_tag">Asset Tag *</Label>
              <Input
                id="asset_tag"
                value={newAssetForm.asset_tag}
                onChange={(e) => setNewAssetForm({ ...newAssetForm, asset_tag: e.target.value })}
                placeholder="Enter asset tag"
              />
            </div>
            <div>
              <Label htmlFor="new_asset_status">Status</Label>
              <Select
                value={newAssetForm.status}
                onValueChange={(value) => {
                  // Clear returned_date if status is not 'returned'
                  if (value !== 'returned') {
                    setNewAssetForm({ ...newAssetForm, status: value, returned_date: '' });
                  } else {
                    setNewAssetForm({ ...newAssetForm, status: value });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issued_date">Issued Date</Label>
                <Input
                  id="issued_date"
                  type="date"
                  value={newAssetForm.issued_date}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, issued_date: e.target.value })}
                />
              </div>
              {newAssetForm.status === 'returned' && (
                <div>
                  <Label htmlFor="new_asset_returned_date">Returned Date *</Label>
                  <Input
                    id="new_asset_returned_date"
                    type="date"
                    value={newAssetForm.returned_date}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, returned_date: e.target.value })}
                    required
                  />
                </div>
              )}
            </div>

            {/* Employee Information */}
            <div className="space-y-2 pt-2 border-t">
              <h4 className="font-medium text-sm">Employee Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="employee_first_name">First Name *</Label>
                  <Input
                    id="employee_first_name"
                    value={newAssetForm.employee_first_name}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, employee_first_name: e.target.value })}
                    placeholder="First name"
                    readOnly={attestationDetails?.campaign?.target_type === 'companies'}
                    className={attestationDetails?.campaign?.target_type === 'companies' ? 'bg-muted' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="employee_last_name">Last Name *</Label>
                  <Input
                    id="employee_last_name"
                    value={newAssetForm.employee_last_name}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, employee_last_name: e.target.value })}
                    placeholder="Last name"
                    readOnly={attestationDetails?.campaign?.target_type === 'companies'}
                    className={attestationDetails?.campaign?.target_type === 'companies' ? 'bg-muted' : ''}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="employee_email">Email *</Label>
                <Input
                  id="employee_email"
                  type="email"
                  value={newAssetForm.employee_email}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, employee_email: e.target.value })}
                  placeholder="employee@example.com"
                  readOnly={attestationDetails?.campaign?.target_type === 'companies'}
                  className={attestationDetails?.campaign?.target_type === 'companies' ? 'bg-muted' : ''}
                />
              </div>
            </div>

            {/* Manager Information */}
            <div className="space-y-2 pt-2 border-t">
              <h4 className="font-medium text-sm">Manager Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manager_first_name">First Name</Label>
                  <Input
                    id="manager_first_name"
                    value={newAssetForm.manager_first_name}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, manager_first_name: e.target.value })}
                    placeholder="First name"
                    readOnly={attestationDetails?.campaign?.target_type === 'companies'}
                    className={attestationDetails?.campaign?.target_type === 'companies' ? 'bg-muted' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="manager_last_name">Last Name</Label>
                  <Input
                    id="manager_last_name"
                    value={newAssetForm.manager_last_name}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, manager_last_name: e.target.value })}
                    placeholder="Last name"
                    readOnly={attestationDetails?.campaign?.target_type === 'companies'}
                    className={attestationDetails?.campaign?.target_type === 'companies' ? 'bg-muted' : ''}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="manager_email">Email</Label>
                <Input
                  id="manager_email"
                  type="email"
                  value={newAssetForm.manager_email}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, manager_email: e.target.value })}
                  placeholder="manager@example.com"
                  readOnly={attestationDetails?.campaign?.target_type === 'companies'}
                  className={attestationDetails?.campaign?.target_type === 'companies' ? 'bg-muted' : ''}
                />
              </div>
            </div>

            {/* Company Selection */}
            <div className="space-y-2 pt-2 border-t">
              <h4 className="font-medium text-sm">Company</h4>
              {attestationDetails?.campaign?.target_type === 'companies' ? (
                <div>
                  <Label>Company (Auto-selected from campaign)</Label>
                  <CompanyCombobox
                    value={newAssetForm.company_id}
                    onChange={(company) => {
                      setSelectedCompany(company);
                      setNewAssetForm({ ...newAssetForm, company_id: company?.id || null });
                    }}
                    disabled={true}
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="company_id">Company *</Label>
                  <CompanyCombobox
                    value={newAssetForm.company_id}
                    onChange={(company) => {
                      setSelectedCompany(company);
                      setNewAssetForm({ ...newAssetForm, company_id: company?.id || null });
                    }}
                    placeholder="Search for a company..."
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newAssetForm.notes}
                onChange={(e) => setNewAssetForm({ ...newAssetForm, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAssetModal(false)} className="btn-interactive">
              Cancel
            </Button>
            <Button onClick={handleAddNewAsset} className="btn-interactive">
              Add Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
