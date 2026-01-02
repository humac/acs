import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Package, Users, Building2, Laptop, ClipboardCheck, User, FileBarChart, Settings } from 'lucide-react';

const Dashboard = () => {
  const { getAuthHeaders, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    assetsCount: 0,
    employeesCount: 0,
    companiesCount: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stats', {
        headers: { ...getAuthHeaders() }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.first_name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card className="stat-card group">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Package className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
              </div>
            </div>
            <div className="text-3xl md:text-4xl font-bold text-gradient mb-1">{dashboardStats.assetsCount}</div>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">Total Assets</p>
          </CardContent>
        </Card>
        
        <Card className="stat-card group">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-success flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-success-foreground" />
              </div>
            </div>
            <div className="text-3xl md:text-4xl font-bold text-gradient mb-1">{dashboardStats.employeesCount}</div>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">Team Members</p>
          </CardContent>
        </Card>
        
        <Card className="stat-card group">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-warning/80 to-warning flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Building2 className="h-5 w-5 md:h-6 md:w-6 text-warning-foreground" />
              </div>
            </div>
            <div className="text-3xl md:text-4xl font-bold text-gradient mb-1">{dashboardStats.companiesCount}</div>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">Partners</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <div className="space-y-4 md:space-y-6">
        {/* My Actions - For All Users */}
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">My Actions</h2>
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2"
              onClick={() => navigate('/assets')}
            >
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Laptop className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">View My Assets</h3>
                    <p className="text-xs text-muted-foreground">Manage your equipment</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2"
              onClick={() => navigate('/my-attestations')}
            >
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">My Attestations</h3>
                    <p className="text-xs text-muted-foreground">Review pending attestations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2"
              onClick={() => navigate('/profile')}
            >
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">My Profile</h3>
                    <p className="text-xs text-muted-foreground">Update your information</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Management Section - For Managers, Coordinators, and Admins */}
        {(user?.role === 'manager' || user?.role === 'coordinator' || user?.role === 'admin') && (
          <div>
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Management</h2>
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2"
                onClick={() => navigate('/users')}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Manage Users</h3>
                      <p className="text-xs text-muted-foreground">User management</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2"
                onClick={() => navigate('/companies')}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">View Companies</h3>
                      <p className="text-xs text-muted-foreground">Company directory</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2"
                onClick={() => navigate('/audit')}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <FileBarChart className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Audit & Reports</h3>
                      <p className="text-xs text-muted-foreground">View system logs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2"
                onClick={() => navigate('/attestation')}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <ClipboardCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Attestation Campaigns</h3>
                      <p className="text-xs text-muted-foreground">Manage campaigns</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Administration Section - For Admins Only */}
        {user?.role === 'admin' && (
          <div>
            <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Administration</h2>
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2"
                onClick={() => navigate('/admin')}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Settings className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Admin Settings</h3>
                      <p className="text-xs text-muted-foreground">System configuration</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
