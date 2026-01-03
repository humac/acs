import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Loader2, Package, Users, Building2, 
  ClipboardCheck, User, FileBarChart, Settings, ArrowUpRight,
  CheckCircle2, AlertCircle, UserPlus, Plus
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
    campaignCompletionRate: 0
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

      // Fetch role-specific data
      if (isEmployee) {
        // Fetch my assets
        const myAssetsRes = await fetch('/api/assets', {
          headers: { ...getAuthHeaders() }
        });
        if (myAssetsRes.ok) {
          const myAssets = await myAssetsRes.json();
          stats.myAssetsCount = myAssets.length;
        }

        // Fetch my attestations
        const attestRes = await fetch('/api/attestation/my-attestations', {
          headers: { ...getAuthHeaders() }
        });
        if (attestRes.ok) {
          const attestData = await attestRes.json();
          const attestations = attestData.attestations || [];
          stats.pendingAttestationsCount = attestations.filter(a => a.status === 'pending').length;
          stats.completedAttestationsCount = attestations.filter(a => a.status === 'completed').length;
        }
      }

      if (isManager) {
        // Manager sees team assets via the same endpoint (scoped by backend)
        const teamAssetsRes = await fetch('/api/assets', {
          headers: { ...getAuthHeaders() }
        });
        if (teamAssetsRes.ok) {
          const teamAssets = await teamAssetsRes.json();
          stats.teamAssetsCount = teamAssets.length;
        }

        // Fetch team members count
        const usersRes = await fetch('/api/users', {
          headers: { ...getAuthHeaders() }
        });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          // Count users where this manager is their manager
          const teamMembers = usersData.users?.filter(u => u.manager_email === user.email) || [];
          stats.teamMembersCount = teamMembers.length;
        }
      }

      if (isCoordinator || isAdmin) {
        // Fetch campaign stats
        const campaignsRes = await fetch('/api/attestation/campaigns', {
          headers: { ...getAuthHeaders() }
        });
        if (campaignsRes.ok) {
          const campaignData = await campaignsRes.json();
          const campaigns = campaignData.campaigns || [];
          stats.activeCampaignsCount = campaigns.filter(c => c.status === 'active').length;
        }
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
    <div className="space-y-8 p-1 md:p-2 animate-fade-in bg-surface/30 min-h-screen rounded-2xl">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient mb-2">
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

      {/* Main Bento Grid Layout - EMPLOYEE VIEW */}
      {isEmployee && (
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:gap-6 min-h-[600px]">
          
          {/* Featured Stat: My Assets (Large Bento Item) */}
          <Card className="bento-card md:col-span-2 md:row-span-2 group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Package size={140} />
            </div>
            <CardContent className="p-8 relative z-10 flex flex-col h-full justify-between">
              <div className="space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-glow mb-6">
                  <Package className="text-primary h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold text-muted-foreground uppercase tracking-widest">My Assets</h2>
                <div className="text-7xl font-bold tracking-tighter text-gradient leading-none">
                  {dashboardStats.myAssetsCount}
                </div>
              </div>
              <button 
                onClick={() => navigate('/assets')}
                className="flex items-center gap-2 text-primary font-bold group/btn mt-8"
              >
                View My Assets <ArrowUpRight className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </button>
            </CardContent>
          </Card>

          {/* Medium Stat: Pending Attestations */}
          <Card className="bento-card md:col-span-2 md:row-span-1 group">
            <CardContent className="p-6 flex items-center justify-between h-full">
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Pending Attestations</p>
                <div className="text-4xl font-bold">{dashboardStats.pendingAttestationsCount}</div>
                {dashboardStats.pendingAttestationsCount === 0 ? (
                  <p className="text-xs text-success font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> All complete
                  </p>
                ) : (
                  <p className="text-xs text-warning font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Action required
                  </p>
                )}
              </div>
              <div className={cn(
                "h-16 w-16 rounded-3xl flex items-center justify-center border group-hover:scale-110 transition-transform",
                dashboardStats.pendingAttestationsCount === 0 ? "bg-success/10 border-success/20" : "bg-warning/10 border-warning/20"
              )}>
                <ClipboardCheck className={dashboardStats.pendingAttestationsCount === 0 ? "text-success h-8 w-8" : "text-warning h-8 w-8"} />
              </div>
            </CardContent>
          </Card>

          {/* Small Stat: My Profile */}
          <Card 
            className="glass-panel md:col-span-1 md:row-span-1 cursor-pointer hover:bg-white/5 transition-colors group"
            onClick={() => navigate('/profile')}
          >
            <CardContent className="p-6 flex flex-col justify-between h-full">
               <User className="text-muted-foreground h-6 w-6 group-hover:text-primary transition-colors" />
               <div className="flex items-center justify-between">
                  <span className="font-semibold tracking-tight">My Profile</span>
                  <ArrowUpRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
               </div>
            </CardContent>
          </Card>

          {/* Quick Access: Recent Activity */}
          <Card className="bento-card md:col-span-1 md:row-span-1 group">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="h-10 w-10 rounded-xl bg-info/10 flex items-center justify-center border border-info/20 mb-4">
                <FileBarChart className="text-info h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-muted-foreground uppercase mb-1">Activity</div>
                <p className="text-xs text-muted-foreground">Recent actions</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Bento Grid Layout - MANAGER VIEW */}
      {isManager && (
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:gap-6 min-h-[600px]">
          
          {/* Featured Stat: Team Assets (Large Bento Item) */}
          <Card className="bento-card md:col-span-2 md:row-span-2 group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Package size={140} />
            </div>
            <CardContent className="p-8 relative z-10 flex flex-col h-full justify-between">
              <div className="space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-glow mb-6">
                  <Package className="text-primary h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold text-muted-foreground uppercase tracking-widest">Team Assets</h2>
                <div className="text-7xl font-bold tracking-tighter text-gradient leading-none">
                  {dashboardStats.teamAssetsCount}
                </div>
              </div>
              <button 
                onClick={() => navigate('/assets')}
                className="flex items-center gap-2 text-primary font-bold group/btn mt-8"
              >
                View Team Assets <ArrowUpRight className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </button>
            </CardContent>
          </Card>

          {/* Medium Stat: Team Members */}
          <Card className="bento-card md:col-span-2 md:row-span-1 group">
            <CardContent className="p-6 flex items-center justify-between h-full">
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Team Members</p>
                <div className="text-4xl font-bold">{dashboardStats.teamMembersCount}</div>
                <p className="text-xs text-success font-medium">Direct reports</p>
              </div>
              <div className="h-16 w-16 rounded-3xl bg-success/10 flex items-center justify-center border border-success/20 group-hover:scale-110 transition-transform">
                <Users className="text-success h-8 w-8" />
              </div>
            </CardContent>
          </Card>

          {/* Small Stat: Pending Reviews */}
          <Card className="bento-card md:col-span-1 md:row-span-1 group">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20 mb-4">
                <AlertCircle className="text-warning h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold leading-none mb-1">-</div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Reviews</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Access: Audit Logs */}
          <Card 
            className="glass-panel md:col-span-1 md:row-span-1 cursor-pointer hover:bg-white/5 transition-colors group"
            onClick={() => navigate('/audit')}
          >
            <CardContent className="p-6 flex flex-col justify-between h-full">
               <FileBarChart className="text-muted-foreground h-6 w-6 group-hover:text-primary transition-colors" />
               <div className="flex items-center justify-between">
                  <span className="font-semibold tracking-tight">Audit Logs</span>
                  <ArrowUpRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
               </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Bento Grid Layout - COORDINATOR VIEW */}
      {isCoordinator && (
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:gap-6 min-h-[600px]">
          
          {/* Featured Stat: Active Campaigns (Large Bento Item) */}
          <Card className="bento-card md:col-span-2 md:row-span-2 group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <ClipboardCheck size={140} />
            </div>
            <CardContent className="p-8 relative z-10 flex flex-col h-full justify-between">
              <div className="space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-glow mb-6">
                  <ClipboardCheck className="text-primary h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold text-muted-foreground uppercase tracking-widest">Active Campaigns</h2>
                <div className="text-7xl font-bold tracking-tighter text-gradient leading-none">
                  {dashboardStats.activeCampaignsCount}
                </div>
              </div>
              <button 
                onClick={() => navigate('/attestation')}
                className="flex items-center gap-2 text-primary font-bold group/btn mt-8"
              >
                Manage Campaigns <ArrowUpRight className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </button>
            </CardContent>
          </Card>

          {/* Medium Stat: Pending Responses */}
          <Card className="bento-card md:col-span-2 md:row-span-1 group">
            <CardContent className="p-6 flex items-center justify-between h-full">
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Pending Responses</p>
                <div className="text-4xl font-bold">-</div>
                <p className="text-xs text-muted-foreground font-medium">Campaign status</p>
              </div>
              <div className="h-16 w-16 rounded-3xl bg-warning/10 flex items-center justify-center border border-warning/20 group-hover:scale-110 transition-transform">
                <AlertCircle className="text-warning h-8 w-8" />
              </div>
            </CardContent>
          </Card>

          {/* Small Stat: Companies */}
          <Card className="bento-card md:col-span-1 md:row-span-1 group">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20 mb-4">
                <Building2 className="text-warning h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold leading-none mb-1">{dashboardStats.companiesCount}</div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Companies</p>
              </div>
            </CardContent>
          </Card>

          {/* Small Stat: Assets Overview */}
          <Card className="bento-card md:col-span-1 md:row-span-1 group">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="h-10 w-10 rounded-xl bg-info/10 flex items-center justify-center border border-info/20 mb-4">
                <Package className="text-info h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold leading-none mb-1">{dashboardStats.assetsCount}</div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Assets</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Bento Grid Layout - ADMIN VIEW */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:gap-6 min-h-[600px]">
          
          {/* Featured Stat: Total Assets (Large Bento Item) */}
          <Card className="bento-card md:col-span-2 md:row-span-2 group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Package size={140} />
            </div>
            <CardContent className="p-8 relative z-10 flex flex-col h-full justify-between">
              <div className="space-y-2">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-glow mb-6">
                  <Package className="text-primary h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold text-muted-foreground uppercase tracking-widest">Total Assets</h2>
                <div className="text-7xl font-bold tracking-tighter text-gradient leading-none">
                  {dashboardStats.assetsCount}
                </div>
              </div>
              <button 
                onClick={() => navigate('/assets')}
                className="flex items-center gap-2 text-primary font-bold group/btn mt-8"
              >
                View Full Inventory <ArrowUpRight className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </button>
            </CardContent>
          </Card>

          {/* Medium Stat: Users */}
          <Card className="bento-card md:col-span-2 md:row-span-1 group">
            <CardContent className="p-6 flex items-center justify-between h-full">
              <div className="space-y-1">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Users</p>
                <div className="text-4xl font-bold">{dashboardStats.employeesCount}</div>
                <p className="text-xs text-success font-medium">Synced across all departments</p>
              </div>
              <div className="h-16 w-16 rounded-3xl bg-success/10 flex items-center justify-center border border-success/20 group-hover:scale-110 transition-transform">
                <Users className="text-success h-8 w-8" />
              </div>
            </CardContent>
          </Card>

          {/* Small Stat: Companies */}
          <Card className="bento-card md:col-span-1 md:row-span-1 group">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20 mb-4">
                <Building2 className="text-warning h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold leading-none mb-1">{dashboardStats.companiesCount}</div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Companies</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Access: My Account */}
          <Card 
            className="glass-panel md:col-span-1 md:row-span-1 cursor-pointer hover:bg-white/5 transition-colors group"
            onClick={() => navigate('/profile')}
          >
            <CardContent className="p-6 flex flex-col justify-between h-full">
               <User className="text-muted-foreground h-6 w-6 group-hover:text-primary transition-colors" />
               <div className="flex items-center justify-between">
                  <span className="font-semibold tracking-tight">My Account</span>
                  <ArrowUpRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
               </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions Grid - EMPLOYEE */}
      {isEmployee && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="md:col-span-3">
            <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <ClipboardCheck className="text-primary" /> Quick Actions
            </h2>
          </div>
          
          {[
            { label: 'Register New Asset', icon: Plus, path: '/assets', color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'My Attestations', icon: ClipboardCheck, path: '/attestation', color: 'text-info', bg: 'bg-info/10' },
            { label: 'My Profile', icon: User, path: '/profile', color: 'text-success', bg: 'bg-success/10' }
          ].map((item) => (
            <Card 
              key={item.label}
              className="glass-panel cursor-pointer hover:scale-[1.02] transition-transform duration-base group overflow-hidden relative"
              onClick={() => navigate(item.path)}
            >
              <div className={cn("absolute inset-y-0 left-0 w-1", item.bg.replace('/10', ''))} />
              <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border border-white/5", item.bg)}>
                  <item.icon className={cn("h-6 w-6", item.color)} />
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
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="md:col-span-3">
            <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <ClipboardCheck className="text-primary" /> Quick Actions
            </h2>
          </div>
          
          {[
            { label: 'View Team Assets', icon: Package, path: '/assets', color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Audit Logs', icon: FileBarChart, path: '/audit', color: 'text-info', bg: 'bg-info/10' },
            { label: 'My Profile', icon: User, path: '/profile', color: 'text-success', bg: 'bg-success/10' }
          ].map((item) => (
            <Card 
              key={item.label}
              className="glass-panel cursor-pointer hover:scale-[1.02] transition-transform duration-base group overflow-hidden relative"
              onClick={() => navigate(item.path)}
            >
              <div className={cn("absolute inset-y-0 left-0 w-1", item.bg.replace('/10', ''))} />
              <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border border-white/5", item.bg)}>
                  <item.icon className={cn("h-6 w-6", item.color)} />
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
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
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
              <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border border-white/5", item.bg)}>
                  <item.icon className={cn("h-6 w-6", item.color)} />
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
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="md:col-span-3">
            <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
              <ClipboardCheck className="text-primary" /> Operational Controls
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
              <CardContent className="p-5 flex items-center gap-4">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border border-white/5", item.bg)}>
                  <item.icon className={cn("h-6 w-6", item.color)} />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight">{item.label}</h3>
                  <p className="text-xs text-muted-foreground font-medium italic">Execute system procedures</p>
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
