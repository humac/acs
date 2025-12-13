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
  Users,
  CheckCircle2,
  Clock,
  AlertCircle
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

export default function AttestationPage() {
  const { getAuthHeaders, user } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    reminder_days: 7,
    escalation_days: 10,
    target_type: 'all',
    target_user_ids: []
  });
  
  const [wizardStep, setWizardStep] = useState(1);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/attestation/campaigns', {
        headers: { ...getAuthHeaders() }
      });
      if (!res.ok) throw new Error('Failed to load campaigns');
      const data = await res.json();
      setCampaigns(data.campaigns || []);
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

  useEffect(() => {
    if (user?.role === 'admin') {
      loadCampaigns();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { ...getAuthHeaders() }
      });
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setAvailableUsers(data.users || []);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    }
  };

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
        description: 'Campaign created successfully'
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
        target_type: 'all',
        target_user_ids: []
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

  const handleStartCampaign = async (campaignId) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    let confirmMessage = 'Are you sure you want to start this campaign? ';
    
    if (campaign?.target_type === 'selected' && campaign?.target_user_ids) {
      try {
        // Validate target_user_ids is a string before parsing
        if (typeof campaign.target_user_ids === 'string') {
          const targetCount = JSON.parse(campaign.target_user_ids).length;
          confirmMessage += `Emails will be sent to ${targetCount} selected employee${targetCount !== 1 ? 's' : ''}.`;
        } else {
          confirmMessage += 'Emails will be sent to selected employees.';
        }
      } catch (error) {
        console.error('Error parsing target_user_ids:', error);
        confirmMessage += 'Emails will be sent to selected employees.';
      }
    } else {
      confirmMessage += 'Emails will be sent to all employees.';
    }
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const res = await fetch(`/api/attestation/campaigns/${campaignId}/start`, {
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
    }
  };

  const handleCancelCampaign = async (campaignId) => {
    if (!confirm('Are you sure you want to cancel this campaign?')) {
      return;
    }

    try {
      const res = await fetch(`/api/attestation/campaigns/${campaignId}/cancel`, {
        method: 'POST',
        headers: { ...getAuthHeaders() }
      });

      if (!res.ok) throw new Error('Failed to cancel campaign');

      toast({
        title: 'Success',
        description: 'Campaign cancelled successfully'
      });

      loadCampaigns();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to cancel campaign',
        variant: 'destructive'
      });
    }
  };

  const handleViewDashboard = async (campaign) => {
    setSelectedCampaign(campaign);
    setShowDashboardModal(true);
    setLoadingDashboard(true);

    try {
      const res = await fetch(`/api/attestation/campaigns/${campaign.id}/dashboard`, {
        headers: { ...getAuthHeaders() }
      });

      if (!res.ok) throw new Error('Failed to load dashboard');

      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to load campaign dashboard',
        variant: 'destructive'
      });
    } finally {
      setLoadingDashboard(false);
    }
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
        description: 'Campaign exported successfully'
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

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'secondary',
      active: 'default',
      completed: 'outline',
      cancelled: 'destructive'
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-8 w-8" />
            Attestation Campaigns
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage asset attestation campaigns and track employee compliance
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first attestation campaign to get started
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Reminder</TableHead>
                  <TableHead>Escalation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>
                      {new Date(campaign.start_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {campaign.end_date 
                        ? new Date(campaign.end_date).toLocaleDateString() 
                        : '-'}
                    </TableCell>
                    <TableCell>{campaign.reminder_days} days</TableCell>
                    <TableCell>{campaign.escalation_days} days</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {campaign.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartCampaign(campaign.id)}
                          >
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {campaign.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDashboard(campaign)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Dashboard
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExportCampaign(campaign.id, campaign.name)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Export
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelCampaign(campaign.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                        {(campaign.status === 'completed' || campaign.status === 'cancelled') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExportCampaign(campaign.id, campaign.name)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Export
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
        <DialogContent className="max-w-2xl">
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
                    Send reminder after X days
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
              </div>
            </div>
          )}
          
          {/* Step 2: Target Selection */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <RadioGroup
                value={formData.target_type}
                onValueChange={(value) => {
                  setFormData({ ...formData, target_type: value, target_user_ids: [] });
                  if (value === 'selected' && availableUsers.length === 0) {
                    loadUsers();
                  }
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
            </div>
          )}
          
          <DialogFooter>
            {wizardStep === 1 ? (
              <>
                <Button variant="outline" onClick={() => {
                  setShowCreateModal(false);
                  setWizardStep(1);
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => setWizardStep(2)} 
                  disabled={!formData.name || !formData.start_date}
                >
                  Next
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setWizardStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={handleCreateCampaign}
                  disabled={formData.target_type === 'selected' && formData.target_user_ids.length === 0}
                >
                  Create Campaign
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dashboard Modal */}
      <Dialog open={showDashboardModal} onOpenChange={setShowDashboardModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Dashboard: {selectedCampaign?.name}</DialogTitle>
            <DialogDescription>
              View completion status and employee details
            </DialogDescription>
          </DialogHeader>
          {loadingDashboard ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : dashboardData ? (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Employees
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <span className="text-2xl font-bold">
                        {dashboardData.records?.length || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Completed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-2xl font-bold">
                        {dashboardData.records?.filter(r => r.status === 'completed').length || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pending
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <span className="text-2xl font-bold">
                        {dashboardData.records?.filter(r => r.status === 'pending').length || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Employee Records Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Employee Records</h3>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Reminder</TableHead>
                        <TableHead>Escalation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.records?.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.user_name}</TableCell>
                          <TableCell>{record.user_email}</TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell>
                            {record.completed_at 
                              ? new Date(record.completed_at).toLocaleString()
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {record.reminder_sent_at ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {record.escalation_sent_at ? (
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
