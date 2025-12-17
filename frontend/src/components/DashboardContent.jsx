import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Search,
  Bell,
  RefreshCw,
  AlertTriangle,
  Eye,
  Mail,
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export function DashboardContent({ campaign, compact = false, onClose = null }) {
  const { getAuthHeaders, user } = useAuth();
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');
  const [dashboardFilterTab, setDashboardFilterTab] = useState('all');
  const [selectedRecordIds, setSelectedRecordIds] = useState(new Set());
  const [sendingReminder, setSendingReminder] = useState(new Set());
  const [sendingBulkReminder, setSendingBulkReminder] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [showMyTeamOnly, setShowMyTeamOnly] = useState(false);
  const [showPendingInvitesModal, setShowPendingInvitesModal] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingPendingInvites, setLoadingPendingInvites] = useState(false);
  const [resendingInvite, setResendingInvite] = useState(new Set());

  // Table column count constant for colSpan calculations
  const DASHBOARD_TABLE_COLUMNS = 8;

  // Spacing based on compact mode
  const spacing = compact ? 'space-y-3' : 'space-y-6';
  const gap = compact ? 'gap-3' : 'gap-4';

  // Helper function to calculate days elapsed since campaign start
  const getDaysElapsed = (startDate) => {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = now - start;
    if (diffTime < 0) return 0;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper function to calculate days late for a record
  const getDaysLate = (record, campaignData) => {
    if (!record || !campaignData) return 0;
    if (record.status === 'completed') return 0;
    
    const daysElapsed = getDaysElapsed(campaignData.start_date);
    const escalationDays = campaignData.escalation_days || 0;
    const daysLate = Math.max(0, daysElapsed - escalationDays);
    return daysLate;
  };

  // Helper function to check if a record is overdue
  const isOverdue = (record, campaignData) => {
    if (!record || !campaignData) return false;
    if (record.status === 'completed') return false;
    return getDaysLate(record, campaignData) > 0;
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'secondary',
      active: 'default',
      completed: 'outline',
      cancelled: 'destructive',
      pending: 'secondary',
      in_progress: 'default'
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  // Load dashboard data
  const loadDashboard = async () => {
    if (!campaign) return;
    
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

  // Initial load
  useEffect(() => {
    if (campaign) {
      loadDashboard();
    }
  }, [campaign]);

  // Auto-refresh effect
  useEffect(() => {
    if (!campaign || !autoRefreshEnabled) return;
    
    const interval = setInterval(() => {
      loadDashboard();
      setLastRefresh(new Date());
    }, 60000); // 60 seconds
    
    return () => clearInterval(interval);
  }, [campaign, autoRefreshEnabled]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    loadDashboard();
    setLastRefresh(new Date());
  };

  // Send manual reminder to single employee
  const handleSendReminder = async (recordId) => {
    setSendingReminder(prev => new Set(prev).add(recordId));
    
    try {
      const res = await fetch(`/api/attestation/records/${recordId}/remind`, {
        method: 'POST',
        headers: { ...getAuthHeaders() }
      });
      
      if (!res.ok) throw new Error('Failed to send reminder');
      
      toast({
        title: 'Reminder Sent',
        description: 'Email reminder sent to employee'
      });
      
      loadDashboard();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to send reminder',
        variant: 'destructive'
      });
    } finally {
      setSendingReminder(prev => {
        const next = new Set(prev);
        next.delete(recordId);
        return next;
      });
    }
  };

  // Handle individual record selection
  const handleSelectRecord = (recordId) => {
    setSelectedRecordIds(prev => {
      const next = new Set(prev);
      if (next.has(recordId)) {
        next.delete(recordId);
      } else {
        next.add(recordId);
      }
      return next;
    });
  };

  // Handle select all toggle
  const handleSelectAll = (checked) => {
    if (checked) {
      const incomplete = filteredRecords
        .filter(r => r.status !== 'completed')
        .map(r => r.id);
      setSelectedRecordIds(new Set(incomplete));
    } else {
      setSelectedRecordIds(new Set());
    }
  };

  // Send bulk reminders
  const handleBulkRemind = async () => {
    if (selectedRecordIds.size === 0) return;
    
    setSendingBulkReminder(true);
    
    try {
      const res = await fetch(`/api/attestation/campaigns/${campaign.id}/bulk-remind`, {
        method: 'POST',
        headers: { 
          ...getAuthHeaders(), 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          record_ids: Array.from(selectedRecordIds) 
        })
      });
      
      if (!res.ok) throw new Error('Failed to send bulk reminders');
      
      const data = await res.json();
      
      toast({
        title: 'Bulk Reminders Sent',
        description: `${data.sent} sent successfully${data.failed > 0 ? `, ${data.failed} failed` : ''}`
      });
      
      setSelectedRecordIds(new Set());
      loadDashboard();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to send bulk reminders',
        variant: 'destructive'
      });
    } finally {
      setSendingBulkReminder(false);
    }
  };

  // Load pending invites
  const handleViewPendingInvites = async (campaignId) => {
    setShowPendingInvitesModal(true);
    setLoadingPendingInvites(true);
    
    try {
      const res = await fetch(`/api/attestation/campaigns/${campaignId}/pending-invites`, {
        headers: { ...getAuthHeaders() }
      });
      
      if (!res.ok) throw new Error('Failed to load pending invites');
      
      const data = await res.json();
      setPendingInvites(data.pending_invites);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to load pending invites',
        variant: 'destructive'
      });
    } finally {
      setLoadingPendingInvites(false);
    }
  };

  // Resend invite
  const handleResendInvite = async (inviteId) => {
    setResendingInvite(prev => new Set(prev).add(inviteId));
    
    try {
      const res = await fetch(`/api/attestation/pending-invites/${inviteId}/resend`, {
        method: 'POST',
        headers: { ...getAuthHeaders() }
      });
      
      if (!res.ok) throw new Error('Failed to resend invite');
      
      toast({
        title: 'Invite Resent',
        description: 'Registration invite email sent successfully'
      });
      
      handleViewPendingInvites(campaign.id);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to resend invite',
        variant: 'destructive'
      });
    } finally {
      setResendingInvite(prev => {
        const next = new Set(prev);
        next.delete(inviteId);
        return next;
      });
    }
  };

  // Compute filtered records and counts
  const filteredRecords = useMemo(() => {
    if (!dashboardData?.records) return [];
    
    let records = dashboardData.records;
    
    // Manager team filter (apply first, before other filters)
    if (user?.role === 'manager' && showMyTeamOnly) {
      records = records.filter(r => r.manager_email === user.email);
    }
    
    // Apply tab filter
    if (dashboardFilterTab === 'overdue') {
      records = records.filter(r => isOverdue(r, campaign));
    } else if (dashboardFilterTab === 'pending') {
      records = records.filter(r => r.status === 'pending');
    } else if (dashboardFilterTab === 'in_progress') {
      records = records.filter(r => r.status === 'in_progress');
    } else if (dashboardFilterTab === 'completed') {
      records = records.filter(r => r.status === 'completed');
    }
    
    // Apply search filter
    if (dashboardSearchQuery) {
      const query = dashboardSearchQuery.toLowerCase();
      records = records.filter(r => 
        r.user_name?.toLowerCase().includes(query) ||
        r.user_email?.toLowerCase().includes(query)
      );
    }
    
    return records;
  }, [dashboardData, dashboardFilterTab, dashboardSearchQuery, campaign, showMyTeamOnly, user]);

  // Compute counts
  const overdueCount = useMemo(() => {
    if (!dashboardData?.records || !campaign) return 0;
    return dashboardData.records.filter(r => isOverdue(r, campaign)).length;
  }, [dashboardData, campaign]);

  const pendingCount = useMemo(() => {
    if (!dashboardData?.records) return 0;
    return dashboardData.records.filter(r => r.status === 'pending').length;
  }, [dashboardData]);

  const inProgressCount = useMemo(() => {
    if (!dashboardData?.records) return 0;
    return dashboardData.records.filter(r => r.status === 'in_progress').length;
  }, [dashboardData]);

  const completedCount = useMemo(() => {
    if (!dashboardData?.records) return 0;
    return dashboardData.records.filter(r => r.status === 'completed').length;
  }, [dashboardData]);

  if (loadingDashboard) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className={spacing}>
      {/* Unregistered Users Alert */}
      {campaign?.pending_invites_count > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              {campaign.pending_invites_count} Unregistered Asset Owner{campaign.pending_invites_count !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              These employees own assets but haven't registered in KARS yet.
            </p>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleViewPendingInvites(campaign.id)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details & Resend Invites
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className={cn("grid grid-cols-2 md:grid-cols-4", gap)}>
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
                {completedCount}
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
                {pendingCount}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className={overdueCount > 0 ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-600' : ''}`}>
                {overdueCount}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manager Team Filter */}
      {user?.role === 'manager' && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <Checkbox 
            id="myTeamOnly"
            checked={showMyTeamOnly}
            onCheckedChange={setShowMyTeamOnly}
          />
          <Label htmlFor="myTeamOnly" className="text-sm font-medium cursor-pointer">
            Show only my direct reports
          </Label>
        </div>
      )}

      {/* Filter Tabs */}
      <Tabs value={dashboardFilterTab} onValueChange={setDashboardFilterTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All ({dashboardData.records?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center gap-2">
            <span>Overdue ({overdueCount})</span>
            {overdueCount > 0 && (
              <Badge 
                variant="destructive" 
                className="ml-1 h-5 w-5 p-0 flex items-center justify-center"
                aria-label={`Alert: ${overdueCount} overdue item${overdueCount !== 1 ? 's' : ''}`}
              >
                !
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({inProgressCount})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search and Count */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            id="dashboard-search"
            placeholder="Search by name or email..."
            className="pl-9"
            value={dashboardSearchQuery}
            onChange={(e) => setDashboardSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredRecords.length} of {dashboardData.records?.length || 0} employees
        </div>
      </div>

      {/* Auto-refresh controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className={cn(
            "h-3 w-3",
            autoRefreshEnabled && "animate-spin"
          )} />
          <span>
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={handleManualRefresh}
            title="Refresh now"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            title={autoRefreshEnabled ? 'Pause auto-refresh' : 'Resume auto-refresh'}
          >
            {autoRefreshEnabled ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedRecordIds.size > 0 && (
        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedRecordIds.size} selected
          </span>
          <Button 
            size="sm" 
            onClick={handleBulkRemind}
            disabled={sendingBulkReminder}
          >
            {sendingBulkReminder ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Send Reminders
              </>
            )}
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setSelectedRecordIds(new Set())}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Employee Records Table */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Employee Records</h3>
        <div className={compact ? "max-h-[400px] overflow-y-auto" : "max-h-[600px] overflow-y-auto"}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRecordIds.size > 0 && 
                             selectedRecordIds.size === filteredRecords.filter(r => r.status !== 'completed').length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Reminder</TableHead>
                <TableHead>Escalation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={DASHBOARD_TABLE_COLUMNS} className="text-center py-8 text-muted-foreground">
                    {dashboardSearchQuery || dashboardFilterTab !== 'all'
                      ? 'No employees match your filters'
                      : 'No records found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {record.status !== 'completed' && (
                        <Checkbox
                          checked={selectedRecordIds.has(record.id)}
                          onCheckedChange={() => handleSelectRecord(record.id)}
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{record.user_name}</TableCell>
                    <TableCell>{record.user_email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(record.status)}
                        {isOverdue(record, campaign) && (
                          <Badge variant="destructive" className="text-xs">
                            {getDaysLate(record, campaign)}d late
                          </Badge>
                        )}
                      </div>
                    </TableCell>
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
                    <TableCell className="text-right">
                      {record.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendReminder(record.id)}
                          disabled={sendingReminder.has(record.id)}
                          title="Send reminder email"
                        >
                          {sendingReminder.has(record.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Bell className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pending Invites Modal */}
      <Dialog open={showPendingInvitesModal} onOpenChange={setShowPendingInvitesModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Unregistered Asset Owners</DialogTitle>
            <DialogDescription>
              Employees who own assets but haven't registered in KARS yet
            </DialogDescription>
          </DialogHeader>
          {loadingPendingInvites ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingInvites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending invites - all asset owners are registered!
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Invite Sent</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">{invite.email}</TableCell>
                      <TableCell>
                        {invite.invite_sent_at 
                          ? new Date(invite.invite_sent_at).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendInvite(invite.id)}
                          disabled={resendingInvite.has(invite.id)}
                        >
                          {resendingInvite.has(invite.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-2" />
                              Resend
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
