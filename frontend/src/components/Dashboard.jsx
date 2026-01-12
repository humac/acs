import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2, Package, Users, Building2,
  ClipboardCheck, User, FileBarChart, Settings, ArrowUpRight,
  AlertCircle, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const { getAuthHeaders, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    // Common stats
    assetsCount: 0,
    employeesCount: 0,
    companiesCount: 0,
    // Role-specific stats (populated based on role)
    myAssetsCount: 0,
    pendingAttestationsCount: 0,
    completedAttestationsCount: 0,
    teamAssetsCount: 0,
    teamMembersCount: 0,
    activeCampaignsCount: 0,
    campaignCompletionRate: 0,
    totalPendingResponses: 0
  });

  const isEmployee = user?.role === 'employee';
  const isManager = user?.role === 'manager';
  const isCoordinator = user?.role === 'coordinator';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // Fetch general stats
      const statsResponse = await fetch('/api/stats', {
        headers: { ...getAuthHeaders() }
      });

      let stats = {};
      if (statsResponse.ok) {
        stats = await statsResponse.json();
      }

      // Fetch COMMON data for ALL users (for common cards section)
      // My personal assets (where employee_email = user.email)
      const myAssetsRes = await fetch('/api/assets', {
        headers: { ...getAuthHeaders() }
      });
      if (myAssetsRes.ok) {
        const allAssets = await myAssetsRes.json();
        // For employees, this returns only their assets already
        // For managers/admins/coordinators, we filter to get personal assets
        const myPersonalAssets = isEmployee
          ? allAssets
          : allAssets.filter(asset => asset.employee_email?.toLowerCase() === user.email.toLowerCase());
        stats.myAssetsCount = myPersonalAssets.length;
      }

      // My attestations (for all users)
      const attestRes = await fetch('/api/attestation/my-attestations', {
        headers: { ...getAuthHeaders() }
      });
      if (attestRes.ok) {
        const attestData = await attestRes.json();
        const attestations = attestData.attestations || [];
        // Count attestations that need action (pending OR in_progress)
        stats.pendingAttestationsCount = attestations.filter(a =>
          a.status === 'pending' || a.status === 'in_progress'
        ).length;
        stats.completedAttestationsCount = attestations.filter(a => a.status === 'completed').length;
      }

      // Fetch role-specific data
      if (isEmployee) {
        // Employee-specific stats already handled in common section
      }

      if (isManager) {
        // Manager sees team assets via the same endpoint (scoped by backend)
        const teamAssetsRes = await fetch('/api/assets', {
          headers: { ...getAuthHeaders() }
        });
        if (teamAssetsRes.ok) {
          const teamAssets = await teamAssetsRes.json();
          // Filter to only count assets where the asset's manager_email matches the logged-in manager's email
          const managerEmail = user.email.toLowerCase();
          const filteredTeamAssets = teamAssets.filter(asset => {
            const assetManagerEmail = asset.manager_email?.toLowerCase();
            return assetManagerEmail === managerEmail;
          });
          stats.teamAssetsCount = filteredTeamAssets.length;
        }

        // Fetch team members count
        const usersRes = await fetch('/api/users', {
          headers: { ...getAuthHeaders() }
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          // Count users where this manager is their manager (case-insensitive)
          const managerEmail = user.email.toLowerCase();
          const teamMembers = usersData.users?.filter(u =>
            u.manager_email?.toLowerCase() === managerEmail
          ) || [];
          stats.teamMembersCount = teamMembers.length;
        }

        // Manager's attestations already fetched in common section
      }

      if (isCoordinator || isAdmin) {
        // Fetch campaign stats
        const campaignsRes = await fetch('/api/attestation/campaigns', {
          headers: { ...getAuthHeaders() }
        });
        if (campaignsRes.ok) {
          const campaignData = await campaignsRes.json();
          const campaigns = campaignData.campaigns || [];
          const activeCampaigns = campaigns.filter(c => c.status === 'active');
          stats.activeCampaignsCount = activeCampaigns.length;

          // Calculate total pending responses across all active campaigns
          let totalPendingResponses = 0;
          for (const campaign of activeCampaigns) {
            try {
              const dashboardRes = await fetch(`/api/attestation/campaigns/${campaign.id}/dashboard`, {
                headers: { ...getAuthHeaders() }
              });
              if (dashboardRes.ok) {
                const dashboardData = await dashboardRes.json();
                const records = dashboardData.records || [];
                // Count pending and in_progress records
                const pendingCount = records.filter(r =>
                  r.status === 'pending' || r.status === 'in_progress'
                ).length;
                totalPendingResponses += pendingCount;
              }
            } catch (err) {
              console.error(`Error fetching dashboard for campaign ${campaign.id}:`, err);
            }
          }
          stats.totalPendingResponses = totalPendingResponses;
        }
      }

      if (isCoordinator) {
        // Coordinator's attestations already fetched in common section
      }

      setDashboardStats(prev => ({ ...prev, ...stats }));
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
        </div>
        <span className="mt-4 text-muted-foreground font-medium tracking-tight">Synchronizing ACS Data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 md:p-2 animate-fade-in min-h-screen">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient mb-2 leading-tight pb-1">
            My Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Welcome back, <span className="text-foreground font-semibold">{user?.first_name}</span>. Here is your compliance status.
          </p>
        </div>
        <div className="hidden md:block">
          <div className="glass-panel px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            System Status: Operational
          </div>
        </div>
      </header>

      {/* COMMON CARDS - Shown to ALL Users */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
        <div className="md:col-span-3 mb-2">
          <h2 className="text-xl font-bold tracking-tight text-muted-foreground uppercase">
            My Information
          </h2>
        </div>

        {/* My Profile Card */}
        <Card
          className="glass-panel cursor-pointer hover:scale-[1.02] transition-all duration-200 group"
          onClick={() => navigate('/profile')}
        >
          <CardContent className="p-5 flex flex-col h-full justify-between min-h-[140px]">
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
                <User className="text-primary h-6 w-6" />
              </div>
              <ArrowUpRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg tracking-tight mb-1">My Profile</h3>
              <p className="text-xs text-muted-foreground">View and edit personal information</p>
            </div>
          </CardContent>
        </Card>

        {/* My Assets Card */}
        <Card
          className="glass-panel cursor-pointer hover:scale-[1.02] transition-all duration-200 group"
          onClick={() => navigate('/assets?view=my-assets')}
        >
          <CardContent className="p-5 flex flex-col h-full justify-between min-h-[140px]">
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-xl bg-info/10 flex items-center justify-center border border-info/20 group-hover:bg-info/20 transition-colors">
                <Package className="text-info h-6 w-6" />
              </div>
              <ArrowUpRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity text-info" />
            </div>
            <div>
              <div className="text-3xl font-bold text-gradient mb-1">{dashboardStats.myAssetsCount}</div>
              <h3 className="caption-label">My Assets</h3>
              <p className="text-xs text-muted-foreground">Assets assigned to me</p>
            </div>
          </CardContent>
        </Card>

        {/* My Attestations Card */}
        <Card
          className="glass-panel cursor-pointer hover:scale-[1.02] transition-all duration-200 group relative"
          onClick={() => navigate('/my-attestations')}
        >
          {/* Notification pulse if pending */}
          {dashboardStats.pendingAttestationsCount > 0 && (
            <div className="absolute top-4 right-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
              </span>
            </div>
          )}
          <CardContent className="p-5 flex flex-col h-full justify-between min-h-[140px]">
            <div className="flex items-start justify-between">
              <div className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center border transition-colors",
                dashboardStats.pendingAttestationsCount > 0
                  ? "bg-warning/10 border-warning/20 group-hover:bg-warning/20"
                  : "bg-success/10 border-success/20 group-hover:bg-success/20"
              )}>
                <ClipboardCheck className={cn(
                  "h-6 w-6",
                  dashboardStats.pendingAttestationsCount > 0 ? "text-warning" : "text-success"
                )} />
              </div>
              <ArrowUpRight size={18} className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity",
                dashboardStats.pendingAttestationsCount > 0 ? "text-warning" : "text-success"
              )} />
            </div>
            <div>
              <div className={cn(
                "text-3xl font-bold mb-1",
                dashboardStats.pendingAttestationsCount > 0 ? "text-warning" : "text-success"
              )}>
                {dashboardStats.pendingAttestationsCount}
              </div>
              <h3 className="caption-label">My Attestations</h3>
              <p className="text-xs text-muted-foreground">
                {dashboardStats.pendingAttestationsCount > 0 ? "Action required" : "All up to date"}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ROLE-SPECIFIC INSIGHTS SECTION */}
      <div className="md:col-span-3 mb-2 mt-6">
        <h2 className="text-xl font-bold tracking-tight text-muted-foreground uppercase">
          {isEmployee && "My Dashboard"}
          {isManager && "Team Overview"}
          {isCoordinator && "Campaign Management"}
          {isAdmin && "System Overview"}
        </h2>
      </div>

      {/* Main Bento Grid Layout - EMPLOYEE VIEW */}
      {isEmployee && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
          {/* Info Card: Activity */}
          <Card className="bento-card md:col-span-2 group cursor-pointer" onClick={() => navigate('/audit')}>
            <CardContent className="p-5 flex items-center justify-between h-full">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-info/10 flex items-center justify-center border border-info/20">
                  <FileBarChart className="text-info h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-muted-foreground uppercase tracking-widest">Recent Activity</h3>
                <p className="text-sm text-muted-foreground">View your recent actions and changes</p>
              </div>
              <ArrowUpRight className="text-info group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </CardContent>
          </Card>

          {/* Info Card: Companies */}
          <Card className="bento-card md:col-span-1 group">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center border border-warning/20 mb-2">
                <Building2 className="text-warning h-4 w-4" />
              </div>
              <div>
                <div className="text-xl font-bold leading-none mb-1">{dashboardStats.companiesCount}</div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Companies</p>
              </div>
            </CardContent>
          </Card>

          {/* Info Card: Total Assets in System */}
          <Card className="bento-card md:col-span-1 group">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 mb-2">
                <Package className="text-primary h-4 w-4" />
              </div>
              <div>
                <div className="text-xl font-bold leading-none mb-1">{dashboardStats.assetsCount}</div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Total Assets</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Bento Grid Layout - MANAGER VIEW */}
      {isManager && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
          {/* Featured Stat: Team Assets (Large Bento Item) */}
          <Card className="bento-card md:col-span-2 group relative overflow-hidden flex flex-col justify-between cursor-pointer" onClick={() => navigate('/assets')}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-15 transition-opacity">
              <Package size={100} />
            </div>
            <CardContent className="p-5 md:p-6 relative z-10 flex flex-col h-full justify-between">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-4">
                  <Package className="text-primary h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold text-muted-foreground uppercase tracking-widest">Team Assets</h2>
                <div className="text-5xl md:text-6xl font-bold tracking-tighter text-gradient leading-none">
                  {dashboardStats.teamAssetsCount}
                </div>
                <p className="text-sm text-muted-foreground">Assets managed by you</p>
              </div>
              <div className="flex items-center gap-2 text-primary font-semibold text-sm group/btn mt-4">
                View Team Assets <ArrowUpRight className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* Medium Stat: Team Members */}
          <Card className="bento-card md:col-span-1 group cursor-pointer" onClick={() => navigate('/users')}>
            <CardContent className="p-4 flex flex-col justify-between h-full min-h-[180px]">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center border border-success/20 group-hover:scale-105 transition-transform">
                <Users className="text-success h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="text-4xl font-bold text-gradient">{dashboardStats.teamMembersCount}</div>
                <p className="caption-label">Team Members</p>
                <p className="text-xs text-muted-foreground">Direct reports</p>
              </div>
            </CardContent>
          </Card>

          {/* Info Card: Companies */}
          <Card className="bento-card md:col-span-1 group">
            <CardContent className="p-4 flex flex-col justify-between h-full min-h-[180px]">
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20">
                <Building2 className="text-warning h-6 w-6" />
              </div>
              <div>
                <div className="text-4xl font-bold text-gradient">{dashboardStats.companiesCount}</div>
                <p className="caption-label">Companies</p>
                <p className="text-xs text-muted-foreground">Total client orgs</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Bento Grid Layout - COORDINATOR VIEW */}
      {isCoordinator && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
          {/* Featured Stat: Active Campaigns (Large Bento Item) */}
          <Card className="bento-card md:col-span-2 group relative overflow-hidden flex flex-col justify-between cursor-pointer" onClick={() => navigate('/attestation')}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-15 transition-opacity">
              <ClipboardCheck size={100} />
            </div>
            <CardContent className="p-5 md:p-6 relative z-10 flex flex-col h-full justify-between">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-4">
                  <ClipboardCheck className="text-primary h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold text-muted-foreground uppercase tracking-widest">Active Campaigns</h2>
                <div className="text-5xl md:text-6xl font-bold tracking-tighter text-gradient leading-none">
                  {dashboardStats.activeCampaignsCount}
                </div>
                <p className="text-sm text-muted-foreground">Attestation campaigns in progress</p>
              </div>
              <div className="flex items-center gap-2 text-primary font-semibold text-sm group/btn mt-4">
                Manage Campaigns <ArrowUpRight className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* Medium Stat: Pending Responses */}
          <Card className="bento-card md:col-span-1 group cursor-pointer" onClick={() => navigate('/attestation')}>
            <CardContent className="p-4 flex flex-col justify-between h-full min-h-[180px]">
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20 group-hover:scale-105 transition-transform">
                <AlertCircle className="text-warning h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className={cn(
                  "text-4xl font-bold",
                  dashboardStats.totalPendingResponses > 0 ? "text-warning" : "text-success"
                )}>
                  {dashboardStats.totalPendingResponses}
                </div>
                <p className="caption-label">Pending Responses</p>
                <p className="text-xs text-muted-foreground">Campaign responses needed</p>
              </div>
            </CardContent>
          </Card>

          {/* Info Card: Total Assets (Read Only) */}
          <Card className="bento-card md:col-span-1 group">
            <CardContent className="p-4 flex flex-col justify-between h-full min-h-[180px]">
              <div className="h-12 w-12 rounded-xl bg-info/10 flex items-center justify-center border border-info/20">
                <Package className="text-info h-6 w-6" />
              </div>
              <div>
                <div className="text-4xl font-bold text-gradient">{dashboardStats.assetsCount}</div>
                <p className="caption-label">Total Assets</p>
                <p className="text-xs text-muted-foreground">System-wide (view only)</p>
              </div>
            </CardContent>
          </Card>

          {/* Info Card: Companies (Read Only) */}
          <Card className="bento-card md:col-span-1 group">
            <CardContent className="p-4 flex flex-col justify-between h-full min-h-[180px]">
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20">
                <Building2 className="text-warning h-6 w-6" />
              </div>
              <div>
                <div className="text-4xl font-bold text-gradient">{dashboardStats.companiesCount}</div>
                <p className="caption-label">Companies</p>
                <p className="text-xs text-muted-foreground">Total client orgs</p>
              </div>
            </CardContent>
          </Card>

          {/* Info Card: Users (Read Only) */}
          <Card className="bento-card md:col-span-1 group">
            <CardContent className="p-4 flex flex-col justify-between h-full min-h-[180px]">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center border border-success/20">
                <Users className="text-success h-6 w-6" />
              </div>
              <div>
                <div className="text-4xl font-bold text-gradient">{dashboardStats.employeesCount}</div>
                <p className="caption-label">Users</p>
                <p className="text-xs text-muted-foreground">Total system users</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Bento Grid Layout - ADMIN VIEW */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
          {/* Featured Stat: Total Assets (Large Bento Item) */}
          <Card className="bento-card md:col-span-2 group relative overflow-hidden flex flex-col justify-between cursor-pointer" onClick={() => navigate('/assets')}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-15 transition-opacity">
              <Package size={100} />
            </div>
            <CardContent className="p-5 md:p-6 relative z-10 flex flex-col h-full justify-between">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 mb-4">
                  <Package className="text-primary h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold text-muted-foreground uppercase tracking-widest">Total Assets</h2>
                <div className="text-5xl md:text-6xl font-bold tracking-tighter text-gradient leading-none">
                  {dashboardStats.assetsCount}
                </div>
                <p className="text-sm text-muted-foreground">System-wide asset inventory</p>
              </div>
              <div className="flex items-center gap-2 text-primary font-semibold text-sm group/btn mt-4">
                View Full Inventory <ArrowUpRight className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* Medium Stat: Users */}
          <Card className="bento-card md:col-span-1 group cursor-pointer" onClick={() => navigate('/users')}>
            <CardContent className="p-4 flex flex-col justify-between h-full min-h-[180px]">
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center border border-success/20 group-hover:scale-105 transition-transform">
                <Users className="text-success h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="text-4xl font-bold text-gradient">{dashboardStats.employeesCount}</div>
                <p className="caption-label">Users</p>
                <p className="text-xs text-muted-foreground">All system users</p>
              </div>
            </CardContent>
          </Card>

          {/* Info Card: Companies */}
          <Card className="bento-card md:col-span-1 group cursor-pointer" onClick={() => navigate('/companies')}>
            <CardContent className="p-4 flex flex-col justify-between h-full min-h-[180px]">
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20 group-hover:scale-105 transition-transform">
                <Building2 className="text-warning h-6 w-6" />
              </div>
              <div>
                <div className="text-4xl font-bold text-gradient">{dashboardStats.companiesCount}</div>
                <p className="caption-label">Companies</p>
                <p className="text-xs text-muted-foreground">Client organizations</p>
              </div>
            </CardContent>
          </Card>

          {/* Info Card: Active Campaigns */}
          <Card className="bento-card md:col-span-1 group cursor-pointer" onClick={() => navigate('/attestation')}>
            <CardContent className="p-4 flex flex-col justify-between h-full min-h-[180px]">
              <div className="h-12 w-12 rounded-xl bg-info/10 flex items-center justify-center border border-info/20 group-hover:scale-105 transition-transform">
                <ClipboardCheck className="text-info h-6 w-6" />
              </div>
              <div>
                <div className="text-4xl font-bold text-gradient">{dashboardStats.activeCampaignsCount}</div>
                <p className="caption-label">Active Campaigns</p>
                <p className="text-xs text-muted-foreground">Attestation campaigns</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions Grid - EMPLOYEE */}
      {isEmployee && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="md:col-span-3">
            <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <ClipboardCheck className="text-primary" /> Quick Actions
            </h2>
          </div>

          {[
            { label: 'Register New Asset', icon: Plus, path: '/assets', color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'My Attestations', icon: ClipboardCheck, path: '/my-attestations', color: 'text-info', bg: 'bg-info/10' },
            { label: 'My Profile', icon: User, path: '/profile', color: 'text-success', bg: 'bg-success/10' }
          ].map((item) => (
            <Card
              key={item.label}
              className="glass-panel cursor-pointer hover:scale-[1.02] transition-transform duration-base group overflow-hidden relative"
              onClick={() => navigate(item.path)}
            >
              <div className={cn("absolute inset-y-0 left-0 w-1", item.bg.replace('/10', ''))} />
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center border border-white/5", item.bg)}>
                  <item.icon className={cn("h-5 w-5", item.color)} />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight">{item.label}</h3>
                  <p className="text-xs text-muted-foreground font-medium italic">Quick access</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {/* Actions Grid - MANAGER */}
      {isManager && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="md:col-span-3">
            <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <ClipboardCheck className="text-primary" /> Quick Actions
            </h2>
          </div>

          {[
            { label: 'View Team Assets', icon: Package, path: '/assets', color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'My Attestations', icon: ClipboardCheck, path: '/my-attestations', color: 'text-info', bg: 'bg-info/10' },
            { label: 'Audit Logs', icon: FileBarChart, path: '/audit', color: 'text-warning', bg: 'bg-warning/10' }
          ].map((item) => (
            <Card
              key={item.label}
              className="glass-panel cursor-pointer hover:scale-[1.02] transition-transform duration-base group overflow-hidden relative"
              onClick={() => navigate(item.path)}
            >
              <div className={cn("absolute inset-y-0 left-0 w-1", item.bg.replace('/10', ''))} />
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center border border-white/5", item.bg)}>
                  <item.icon className={cn("h-5 w-5", item.color)} />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight">{item.label}</h3>
                  <p className="text-xs text-muted-foreground font-medium italic">Quick access</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {/* Actions Grid - COORDINATOR */}
      {isCoordinator && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="md:col-span-3">
            <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <ClipboardCheck className="text-primary" /> Quick Actions
            </h2>
          </div>

          {[
            { label: 'Manage Campaigns', icon: ClipboardCheck, path: '/attestation', color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'View Assets', icon: Package, path: '/assets', color: 'text-info', bg: 'bg-info/10' },
            { label: 'View Audit Logs', icon: FileBarChart, path: '/audit', color: 'text-warning', bg: 'bg-warning/10' }
          ].map((item) => (
            <Card
              key={item.label}
              className="glass-panel cursor-pointer hover:scale-[1.02] transition-transform duration-base group overflow-hidden relative"
              onClick={() => navigate(item.path)}
            >
              <div className={cn("absolute inset-y-0 left-0 w-1", item.bg.replace('/10', ''))} />
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center border border-white/5", item.bg)}>
                  <item.icon className={cn("h-5 w-5", item.color)} />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight">{item.label}</h3>
                  <p className="text-xs text-muted-foreground font-medium italic">Quick access</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {/* Actions Grid - ADMIN */}
      {isAdmin && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="md:col-span-3">
            <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <ClipboardCheck className="text-primary" /> Quick Actions
            </h2>
          </div>

          {[
            { label: 'Audit Logs', icon: FileBarChart, path: '/audit', color: 'text-info', bg: 'bg-info/10' },
            { label: 'Attestations', icon: ClipboardCheck, path: '/attestation', color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'System Settings', icon: Settings, path: '/admin', color: 'text-warning', bg: 'bg-warning/10' }
          ].map((item) => (
            <Card
              key={item.label}
              className="glass-panel cursor-pointer hover:scale-[1.02] transition-transform duration-base group overflow-hidden relative"
              onClick={() => navigate(item.path)}
            >
              <div className={cn("absolute inset-y-0 left-0 w-1", item.bg.replace('/10', ''))} />
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center border border-white/5", item.bg)}>
                  <item.icon className={cn("h-5 w-5", item.color)} />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight">{item.label}</h3>
                  <p className="text-xs text-muted-foreground font-medium italic">Quick access</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
};

export default Dashboard;
