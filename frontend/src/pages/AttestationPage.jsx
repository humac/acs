import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ClipboardCheck,
  Plus,
  Loader2,
  PlayCircle,
  XCircle,
  Download,
  Eye,
  Calendar,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  Bell
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DashboardContent } from '@/components/DashboardContent';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import CompanyMultiSelect from '@/components/CompanyMultiSelect';

export default function AttestationPage() {
  const { getAuthHeaders, user } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);

  // Dashboard modal state
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const [campaignStats, setCampaignStats] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    reminder_days: 7,
    escalation_days: 10,
    unregistered_reminder_days: 7,
    target_type: 'all',
    target_user_ids: [],
    target_company_ids: []
  });

  const [wizardStep, setWizardStep] = useState(1);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Alert dialog states
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [campaignToStart, setCampaignToStart] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [campaignToCancel, setCampaignToCancel] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);

  // Helper function to parse target_user_ids
  const parseTargetUserIds = (targetUserIds) => {
    if (!targetUserIds) return [];
    try {
      return typeof targetUserIds === 'string' ? JSON.parse(targetUserIds) : targetUserIds;
    } catch (error) {
      console.error('Error parsing target_user_ids:', error);
      return [];
    }
  };

  // Helper function to parse target_company_ids
  const parseTargetCompanyIds = (targetCompanyIds) => {
    if (!targetCompanyIds) return [];
    try {
      return typeof targetCompanyIds === 'string' ? JSON.parse(targetCompanyIds) : targetCompanyIds;
    } catch (error) {
      console.error('Error parsing target_company_ids:', error);
      return [];
    }
  };

  // Helper function to get user count message for campaign start
  const getStartCampaignMessage = (campaign) => {
    if (!campaign) return '';

    if (campaign.target_type === 'companies' && campaign.target_company_ids) {
      const companyIds = parseTargetCompanyIds(campaign.target_company_ids);
      const count = companyIds.length;
      return `Emails will be sent to employees with assets in ${count} selected compan${count !== 1 ? 'ies' : 'y'}.`;
    }

    if (campaign.target_type === 'selected' && campaign.target_user_ids) {
      const targetIds = parseTargetUserIds(campaign.target_user_ids);
      const count = targetIds.length;
      return `Emails will be sent to ${count} selected employee${count !== 1 ? 's' : ''}.`;
    }
    return 'Emails will be sent to all employees.';
  };

  // Helper function to format progress display with pending invites
  const getProgressDisplay = (campaign, stats) => {
    if (!stats) return '-';

    const { completed, total } = stats;
    const pending_invites_count = campaign.pending_invites_count || 0;

    if (total === 0 && pending_invites_count > 0) {
      return `0/0 (${pending_invites_count} pending invite${pending_invites_count !== 1 ? 's' : ''})`;
    }

    if (pending_invites_count > 0) {
      return `${completed}/${total} (${pending_invites_count} pending invite${pending_invites_count !== 1 ? 's' : ''})`;
    }

    return `${completed}/${total} - ${total > 0 ? Math.round((completed / total) * 100) : 0}% Complete`;
  };

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/attestation/campaigns', {
        headers: { ...getAuthHeaders() }
      });
      if (!res.ok) throw new Error('Failed to load campaigns');
      const data = await res.json();
      const campaignsData = data.campaigns || [];
      setCampaigns(campaignsData);

      // Load stats for active campaigns in parallel
      const activeCampaigns = campaignsData.filter(c => c.status === 'active');
      const statsPromises = activeCampaigns.map(async (campaign) => {
        try {
          const statsRes = await fetch(`/api/attestation/campaigns/${campaign.id}/dashboard`, {
            headers: { ...getAuthHeaders() }
          });
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            const records = statsData.records || [];
            const completed = records.filter(r => r.status === 'completed').length;
            const total = records.length;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
            return { id: campaign.id, stats: { completed, total, percentage } };
          }
        } catch (err) {
          console.error(`Error loading stats for campaign ${campaign.id}:`, err);
        }
        return null;
      });

      const statsResults = await Promise.all(statsPromises);
      const stats = {};
      statsResults.forEach(result => {
        if (result) {
          stats[result.id] = result.stats;
        }
      });
      setCampaignStats(stats);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to load attestation campaigns',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const canManageCampaigns = user?.role === 'admin' || user?.role === 'coordinator';

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'manager' || user?.role === 'coordinator') {
      loadCampaigns();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/auth/users', {
        headers: { ...getAuthHeaders() }
      });
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setAvailableUsers(data || []);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    }
  };

  // loadCompanies removed - using CompanyMultiSelect which handles its own data loading

  const handleCreateCampaign = async () => {
    try {
      const res = await fetch('/api/attestation/campaigns', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to create campaign');

      toast({
        title: 'Success',
        description: 'Campaign created successfully',
        variant: 'success'
      });

      setShowCreateModal(false);
      setWizardStep(1);
      setFormData({
        name: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        reminder_days: 7,
        escalation_days: 10,
        unregistered_reminder_days: 7,
        target_type: 'all',
        target_user_ids: [],
        target_company_ids: []
      });
      setUserSearchQuery('');

      loadCampaigns();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
        variant: 'destructive'
      });
    }
  };

  const handleStartCampaignClick = (campaign) => {
    setCampaignToStart(campaign);
    setShowStartDialog(true);
  };

  const handleStartCampaign = async () => {
    if (!campaignToStart) return;

    try {
      const res = await fetch(`/api/attestation/campaigns/${campaignToStart.id}/start`, {
        method: 'POST',
        headers: { ...getAuthHeaders() }
      });

      if (!res.ok) throw new Error('Failed to start campaign');

      const data = await res.json();
      toast({
        title: 'Campaign Started',
        description: `Created ${data.recordsCreated} attestation records and sent ${data.emailsSent} emails`
      });

      loadCampaigns();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to start campaign',
        variant: 'destructive'
      });
    } finally {
      setShowStartDialog(false);
      setCampaignToStart(null);
    }
  };

  const handleCancelCampaignClick = (campaign) => {
    setCampaignToCancel(campaign);
    setShowCancelDialog(true);
  };

  const handleCancelCampaign = async () => {
    if (!campaignToCancel) return;

    try {
      const res = await fetch(`/api/attestation/campaigns/${campaignToCancel.id}/cancel`, {
        method: 'POST',
        headers: { ...getAuthHeaders() }
      });

      if (!res.ok) throw new Error('Failed to cancel campaign');

      toast({
        title: 'Success',
        description: 'Campaign cancelled successfully',
        variant: 'success'
      });

      loadCampaigns();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to cancel campaign',
        variant: 'destructive'
      });
    } finally {
      setShowCancelDialog(false);
      setCampaignToCancel(null);
    }
  };

  const handleDeleteCampaignClick = (campaign) => {
    setCampaignToDelete(campaign);
    setShowDeleteDialog(true);
  };

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;

    try {
      const res = await fetch(`/api/attestation/campaigns/${campaignToDelete.id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });

      if (!res.ok) throw new Error('Failed to delete campaign');

      toast({
        title: 'Success',
        description: 'Campaign deleted successfully',
        variant: 'success'
      });

      loadCampaigns();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to delete campaign',
        variant: 'destructive'
      });
    } finally {
      setShowDeleteDialog(false);
      setCampaignToDelete(null);
    }
  };

  const handleEditCampaignClick = (campaign) => {
    // Parse target_user_ids and target_company_ids using helper functions
    const targetUserIds = parseTargetUserIds(campaign.target_user_ids);
    const targetCompanyIds = parseTargetCompanyIds(campaign.target_company_ids);

    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name || '',
      description: campaign.description || '',
      start_date: campaign.start_date ? new Date(campaign.start_date).toISOString().split('T')[0] : '',
      end_date: campaign.end_date ? new Date(campaign.end_date).toISOString().split('T')[0] : '',
      reminder_days: campaign.reminder_days || 7,
      escalation_days: campaign.escalation_days || 10,
      unregistered_reminder_days: campaign.unregistered_reminder_days || 7,
      target_type: campaign.target_type || 'all',
      target_user_ids: targetUserIds,
      target_company_ids: targetCompanyIds
    });
    setWizardStep(1);
    setShowEditModal(true);

    // Load users if target type is selected
    if (campaign.target_type === 'selected' && availableUsers.length === 0) {
      loadUsers();
    }

    // CompanyMultiSelect handles its own data loading
  };

  const handleUpdateCampaign = async () => {
    try {
      const res = await fetch(`/api/attestation/campaigns/${editingCampaign.id}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to update campaign');

      toast({
        title: 'Success',
        description: 'Campaign updated successfully',
        variant: 'success'
      });

      setShowEditModal(false);
      setWizardStep(1);
      setEditingCampaign(null);
      setFormData({
        name: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        reminder_days: 7,
        escalation_days: 10,
        unregistered_reminder_days: 7,
        target_type: 'all',
        target_user_ids: [],
        target_company_ids: []
      });
      setUserSearchQuery('');

      loadCampaigns();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to update campaign',
        variant: 'destructive'
      });
    }
  };

  // Simple handler to open dashboard modal
  const handleViewDashboard = (campaign) => {
    setSelectedCampaign(campaign);
    setShowDashboardModal(true);
  };

  const handleExportCampaign = async (campaignId, campaignName) => {
    try {
      const res = await fetch(`/api/attestation/campaigns/${campaignId}/export`, {
        headers: { ...getAuthHeaders() }
      });

      if (!res.ok) throw new Error('Failed to export campaign');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attestation-${campaignName.replace(/[^a-z0-9]/gi, '-')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Campaign exported successfully',
        variant: 'success'
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to export campaign',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
        </div>
        <span className="mt-4 text-muted-foreground font-medium tracking-tight">Loading campaigns...</span>
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
              <CardTitle className="text-lg sm:text-xl text-gradient">Attestation Campaigns ({campaigns.length})</CardTitle>
            </div>
            <div className="flex gap-2 flex-wrap">
              {!canManageCampaigns && (
                <div className="glass-panel px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-info" />
                  <span className="text-info">Read-Only Access</span>
                </div>
              )}
              {canManageCampaigns && (
                <Button onClick={() => setShowCreateModal(true)} className="flex-1 sm:flex-none btn-interactive">
                  <Plus size={20} className="mr-2" />Create Campaign
                </Button>
              )}
            </div>
          </div>
          {!canManageCampaigns && (
            <div className="glass-panel rounded-xl p-3 border-info/20 bg-info/5">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-info mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    You have read-only access to attestation campaigns. Contact an admin to create or modify campaigns.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        {/* Campaign Cards */}
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="glass-panel rounded-2xl text-center py-16 animate-fade-in">
              <div className="icon-box icon-box-lg bg-primary/10 border-primary/20 mx-auto mb-6">
                <ClipboardCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {canManageCampaigns
                  ? 'Create your first attestation campaign to get started'
                  : 'No attestation campaigns have been created yet'}
              </p>
              {canManageCampaigns && (
                <Button onClick={() => setShowCreateModal(true)} className="btn-interactive">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Bento Grid View */}
              <div className="bento-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.map((campaign, index) => {
                  const stats = campaignStats[campaign.id];

                  // Determine badge styling based on status
                  const statusConfig = {
                    draft: { class: 'glow-muted', label: 'Draft' },
                    active: { class: 'glow-success', label: 'Active' },
                    completed: { class: 'glow-info', label: 'Completed' },
                    cancelled: { class: 'glow-destructive', label: 'Cancelled' }
                  };
                  const statusInfo = statusConfig[campaign.status] || statusConfig.draft;

                  return (
                    <div
                      key={campaign.id}
                      className="bento-card p-5 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Campaign Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="icon-box icon-box-sm bg-primary/10 border-primary/20">
                              <ClipboardCheck className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="font-bold text-lg truncate">{campaign.name}</h3>
                          </div>
                          {campaign.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {campaign.description}
                            </p>
                          )}
                        </div>
                        <Badge className={cn("shrink-0", statusInfo.class)}>
                          {statusInfo.label}
                        </Badge>
                      </div>

                      {/* Progress Bar (for active campaigns) */}
                      {campaign.status === 'active' && stats && stats.total > 0 && (
                        <div className="space-y-2 mb-4 p-3 rounded-xl bg-muted/30">
                          <div className="flex items-center justify-between">
                            <span className="caption-label">Progress</span>
                            <span className="text-sm font-bold text-primary">{stats.percentage}%</span>
                          </div>
                          <div className="w-full bg-muted/50 rounded-full h-2.5 overflow-hidden border border-white/5">
                            <div
                              className="h-full transition-all duration-500 rounded-full bg-gradient-to-r from-primary to-info"
                              style={{ width: `${stats.percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getProgressDisplay(campaign, stats)}
                          </p>
                        </div>
                      )}

                      {/* Date Info */}
                      <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-xl bg-surface/50">
                        <div>
                          <p className="caption-label mb-1">Start Date</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <p className="text-sm font-medium">
                              {new Date(campaign.start_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="caption-label mb-1">End Date</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <p className="text-sm font-medium">
                              {campaign.end_date
                                ? new Date(campaign.end_date).toLocaleDateString()
                                : 'Not set'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Reminder & Escalation Info */}
                      <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground pb-3 border-b border-white/5">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Reminder: {campaign.reminder_days}d</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bell className="h-3 w-3" />
                          <span>Escalation: {campaign.escalation_days}d</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {campaign.status === 'draft' && canManageCampaigns && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditCampaignClick(campaign)}
                              className="flex-1 btn-interactive"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleStartCampaignClick(campaign)}
                              className="flex-1 btn-interactive"
                            >
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Start
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteCampaignClick(campaign)}
                              className="btn-interactive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {campaign.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDashboard(campaign)}
                              className="flex-1 btn-interactive"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Dashboard
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExportCampaign(campaign.id, campaign.name)}
                              className="flex-1 btn-interactive"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </Button>
                            {canManageCampaigns && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancelCampaignClick(campaign)}
                                className="btn-interactive"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                        {(campaign.status === 'completed' || campaign.status === 'cancelled') && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExportCampaign(campaign.id, campaign.name)}
                              className="flex-1 btn-interactive"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </Button>
                            {canManageCampaigns && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteCampaignClick(campaign)}
                                className="btn-interactive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Modal - Multi-Step Wizard */}
      <Dialog open={showCreateModal} onOpenChange={(open) => {
        setShowCreateModal(open);
        if (!open) {
          setWizardStep(1);
          setUserSearchQuery('');
        }
      }}>
        <DialogContent className="glass-overlay max-w-[95vw] sm:max-w-lg md:max-w-2xl animate-scale-in">
          <DialogHeader>
            <DialogTitle>Create Attestation Campaign - Step {wizardStep} of 2</DialogTitle>
            <DialogDescription>
              {wizardStep === 1 ? 'Configure campaign details' : 'Select target employees'}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Campaign Details */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Q1 2025 Asset Attestation"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide additional context for employees..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reminder_days">Reminder (days)</Label>
                  <Input
                    id="reminder_days"
                    type="number"
                    min="1"
                    value={formData.reminder_days}
                    onChange={(e) => setFormData({ ...formData, reminder_days: parseInt(e.target.value) || 7 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Send reminder to registered users after X days
                  </p>
                </div>
                <div>
                  <Label htmlFor="escalation_days">Escalation (days)</Label>
                  <Input
                    id="escalation_days"
                    type="number"
                    min="1"
                    value={formData.escalation_days}
                    onChange={(e) => setFormData({ ...formData, escalation_days: parseInt(e.target.value) || 10 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Notify manager after X days
                  </p>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="unregistered_reminder_days">Unregistered Owner Reminder (days)</Label>
                  <Input
                    id="unregistered_reminder_days"
                    type="number"
                    min="1"
                    value={formData.unregistered_reminder_days}
                    onChange={(e) => setFormData({ ...formData, unregistered_reminder_days: parseInt(e.target.value) || 7 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Send reminder to unregistered asset owners after X days
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Target Selection */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <RadioGroup
                value={formData.target_type}
                onValueChange={(value) => {
                  setFormData({ ...formData, target_type: value, target_user_ids: [], target_company_ids: [] });
                  if (value === 'selected' && availableUsers.length === 0) {
                    loadUsers();
                  }
                  // CompanyMultiSelect handles its own data loading
                }}
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="all" id="target-all" />
                  <Label htmlFor="target-all" className="flex-1 cursor-pointer">
                    <div className="font-medium">All Employees (System-wide)</div>
                    <div className="text-sm text-muted-foreground">
                      Send attestation request to all registered users
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="selected" id="target-selected" />
                  <Label htmlFor="target-selected" className="flex-1 cursor-pointer">
                    <div className="font-medium">Select Specific Employees</div>
                    <div className="text-sm text-muted-foreground">
                      Choose individual employees to receive the attestation request
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="companies" id="target-companies" />
                  <Label htmlFor="target-companies" className="flex-1 cursor-pointer">
                    <div className="font-medium">By Company</div>
                    <div className="text-sm text-muted-foreground">
                      Send attestation to employees with assets in specific companies
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {formData.target_type === 'selected' && (
                <div className="space-y-3 mt-4">
                  <div>
                    <Label htmlFor="user-search">Search Employees</Label>
                    <Input
                      id="user-search"
                      type="text"
                      placeholder="Search by name or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                    />
                  </div>

                  {availableUsers.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading users...
                    </div>
                  ) : (
                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {availableUsers
                          .filter(u =>
                            userSearchQuery === '' ||
                            u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                            u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
                          )
                          .map((u) => (
                            <div
                              key={u.id}
                              className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                              onClick={() => {
                                const isSelected = formData.target_user_ids.includes(u.id);
                                setFormData({
                                  ...formData,
                                  target_user_ids: isSelected
                                    ? formData.target_user_ids.filter(id => id !== u.id)
                                    : [...formData.target_user_ids, u.id]
                                });
                              }}
                            >
                              <Checkbox
                                checked={formData.target_user_ids.includes(u.id)}
                                readOnly
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{u.name}</div>
                                <div className="text-xs text-muted-foreground">{u.email}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {formData.target_user_ids.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Selected: {formData.target_user_ids.length} employee{formData.target_user_ids.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}

              {formData.target_type === 'companies' && (
                <div className="mt-4">
                  <Label>Select Companies</Label>
                  <CompanyMultiSelect
                    value={formData.target_company_ids}
                    onChange={(ids) => setFormData({ ...formData, target_company_ids: ids })}
                    placeholder="Search companies..."
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {wizardStep === 1 ? (
              <>
                <Button variant="outline" onClick={() => {
                  setShowCreateModal(false);
                  setWizardStep(1);
                }} className="btn-interactive">
                  Cancel
                </Button>
                <Button
                  onClick={() => setWizardStep(2)}
                  disabled={!formData.name || !formData.start_date}
                  className="btn-interactive"
                >
                  Next
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setWizardStep(1)} className="btn-interactive">
                  Back
                </Button>
                <Button
                  onClick={handleCreateCampaign}
                  disabled={
                    (formData.target_type === 'selected' && formData.target_user_ids.length === 0) ||
                    (formData.target_type === 'companies' && formData.target_company_ids.length === 0)
                  }
                  className="btn-interactive"
                >
                  Create Campaign
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dashboard Modal */}
      <Dialog
        open={showDashboardModal}
        onOpenChange={(open) => {
          setShowDashboardModal(open);
          if (!open) {
            setSelectedCampaign(null);
          }
        }}
      >
        <DialogContent className="glass-overlay w-[95vw] sm:w-[90vw] max-w-7xl h-[92vh] overflow-hidden flex flex-col p-0 animate-scale-in">
          <DialogHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <DialogTitle className="text-xl sm:text-2xl">
              Campaign Dashboard: {selectedCampaign?.name}
            </DialogTitle>
            <DialogDescription className="text-sm">
              View completion status and employee details
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
            <DashboardContent
              campaign={selectedCampaign}
              compact={false}
              onClose={() => setShowDashboardModal(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Modal - Multi-Step Wizard */}
      <Dialog open={showEditModal} onOpenChange={(open) => {
        setShowEditModal(open);
        if (!open) {
          setWizardStep(1);
          setUserSearchQuery('');

          setEditingCampaign(null);
        }
      }}>
        <DialogContent className="glass-overlay max-w-[95vw] sm:max-w-lg md:max-w-2xl animate-scale-in">
          <DialogHeader>
            <DialogTitle>Edit Campaign - Step {wizardStep} of 2</DialogTitle>
            <DialogDescription>
              {wizardStep === 1 ? 'Update campaign details' : 'Update target employees'}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Campaign Details */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Campaign Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Q1 2025 Asset Attestation"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide additional context for employees..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-start_date">Start Date *</Label>
                  <Input
                    id="edit-start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-end_date">End Date (Optional)</Label>
                  <Input
                    id="edit-end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-reminder_days">Reminder (days)</Label>
                  <Input
                    id="edit-reminder_days"
                    type="number"
                    min="1"
                    value={formData.reminder_days}
                    onChange={(e) => setFormData({ ...formData, reminder_days: parseInt(e.target.value) || 7 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Send reminder to registered users after X days
                  </p>
                </div>
                <div>
                  <Label htmlFor="edit-escalation_days">Escalation (days)</Label>
                  <Input
                    id="edit-escalation_days"
                    type="number"
                    min="1"
                    value={formData.escalation_days}
                    onChange={(e) => setFormData({ ...formData, escalation_days: parseInt(e.target.value) || 10 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Notify manager after X days
                  </p>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-unregistered_reminder_days">Unregistered Owner Reminder (days)</Label>
                  <Input
                    id="edit-unregistered_reminder_days"
                    type="number"
                    min="1"
                    value={formData.unregistered_reminder_days}
                    onChange={(e) => setFormData({ ...formData, unregistered_reminder_days: parseInt(e.target.value) || 7 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Send reminder to unregistered asset owners after X days
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Target Selection */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <RadioGroup
                value={formData.target_type}
                onValueChange={(value) => {
                  setFormData({ ...formData, target_type: value, target_user_ids: [], target_company_ids: [] });
                  if (value === 'selected' && availableUsers.length === 0) {
                    loadUsers();
                  }
                  // CompanyMultiSelect handles its own data loading
                }}
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="all" id="edit-target-all" />
                  <Label htmlFor="edit-target-all" className="flex-1 cursor-pointer">
                    <div className="font-medium">All Employees (System-wide)</div>
                    <div className="text-sm text-muted-foreground">
                      Send attestation request to all registered users
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="selected" id="edit-target-selected" />
                  <Label htmlFor="edit-target-selected" className="flex-1 cursor-pointer">
                    <div className="font-medium">Select Specific Employees</div>
                    <div className="text-sm text-muted-foreground">
                      Choose individual employees to receive the attestation request
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="companies" id="edit-target-companies" />
                  <Label htmlFor="edit-target-companies" className="flex-1 cursor-pointer">
                    <div className="font-medium">By Company</div>
                    <div className="text-sm text-muted-foreground">
                      Send attestation to employees with assets in specific companies
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {formData.target_type === 'selected' && (
                <div className="space-y-3 mt-4">
                  <div>
                    <Label htmlFor="edit-user-search">Search Employees</Label>
                    <Input
                      id="edit-user-search"
                      type="text"
                      placeholder="Search by name or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                    />
                  </div>

                  {availableUsers.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      Loading users...
                    </div>
                  ) : (
                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {availableUsers
                          .filter(u =>
                            userSearchQuery === '' ||
                            u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                            u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
                          )
                          .map((u) => (
                            <div
                              key={u.id}
                              className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                              onClick={() => {
                                const isSelected = formData.target_user_ids.includes(u.id);
                                setFormData({
                                  ...formData,
                                  target_user_ids: isSelected
                                    ? formData.target_user_ids.filter(id => id !== u.id)
                                    : [...formData.target_user_ids, u.id]
                                });
                              }}
                            >
                              <Checkbox
                                checked={formData.target_user_ids.includes(u.id)}
                                readOnly
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{u.name}</div>
                                <div className="text-xs text-muted-foreground">{u.email}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {formData.target_user_ids.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Selected: {formData.target_user_ids.length} employee{formData.target_user_ids.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}

              {formData.target_type === 'companies' && (
                <div className="mt-4">
                  <Label>Select Companies</Label>
                  <CompanyMultiSelect
                    value={formData.target_company_ids}
                    onChange={(ids) => setFormData({ ...formData, target_company_ids: ids })}
                    placeholder="Search companies..."
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {wizardStep === 1 ? (
              <>
                <Button variant="outline" onClick={() => {
                  setShowEditModal(false);
                  setWizardStep(1);
                  setEditingCampaign(null);
                }} className="btn-interactive">
                  Cancel
                </Button>
                <Button
                  onClick={() => setWizardStep(2)}
                  disabled={!formData.name || !formData.start_date}
                  className="btn-interactive"
                >
                  Next
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setWizardStep(1)} className="btn-interactive">
                  Back
                </Button>
                <Button
                  onClick={handleUpdateCampaign}
                  disabled={
                    (formData.target_type === 'selected' && formData.target_user_ids.length === 0) ||
                    (formData.target_type === 'companies' && formData.target_company_ids.length === 0)
                  }
                  className="btn-interactive"
                >
                  Update Campaign
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Campaign Confirmation Dialog */}
      <AlertDialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to start the campaign "{campaignToStart?.name}"?
              {campaignToStart && (
                <div className="mt-2 text-sm font-medium">
                  {getStartCampaignMessage(campaignToStart)}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartCampaign}>
              Start Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Campaign Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the campaign "{campaignToCancel?.name}"?
              <div className="mt-2 text-sm font-medium text-destructive">
                This action cannot be undone.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Campaign</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelCampaign} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancel Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Campaign Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the campaign "{campaignToDelete?.name}"?
              <div className="mt-2 text-sm font-medium text-destructive">
                This will also remove all attestation records associated with this campaign from all employees. This action cannot be undone.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCampaign} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
