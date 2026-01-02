import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Laptop, 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileBarChart, 
  Settings, 
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Assets', path: '/assets', icon: Laptop },
    { name: 'Team', path: '/users', icon: Users, roles: ['admin', 'manager', 'coordinator'] },
    { name: 'Companies', path: '/companies', icon: Building2, roles: ['admin', 'manager', 'coordinator'] },
    { name: 'Audit', path: '/audit', icon: FileBarChart, roles: ['admin'] },
  ];

  const filteredNav = navigation.filter(item => 
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 flex overflow-hidden">
      {/* 1. Global Background Floor */}
      <div className="fixed inset-0 bg-surface/30 pointer-events-none" aria-hidden="true" />

      {/* 2. Floating Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 m-4 hidden lg:block",
        "glass-panel rounded-2xl border-glass flex flex-col shadow-2xl animate-fade-in"
      )}>
        <div className="p-8 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-glow">
            <Laptop className="text-primary-foreground h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-gradient">ACS Admin</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-base",
                  isActive 
                    ? "bg-primary/10 text-primary shadow-sm border border-primary/20" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon size={20} className={cn(isActive ? "text-primary" : "opacity-50")} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* User Profile Summary */}
        <div className="p-4 mt-auto">
          <div className="glass-panel p-4 rounded-xl bg-surface/50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-white/10">
                <User size={18} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{user?.first_name} {user?.last_name}</p>
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-50">{user?.role}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-destructive/70 hover:text-destructive hover:bg-destructive/10 h-9"
              onClick={logout}
            >
              <LogOut size={16} className="mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* 3. Main Content Area */}
      <main className="flex-1 lg:ml-[320px] p-4 lg:p-8 relative z-10 overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-6 glass-panel p-4 rounded-2xl">
          <div className="flex items-center gap-2">
            <Laptop className="text-primary h-6 w-6" />
            <span className="font-bold tracking-tight">ACS</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu />
          </Button>
        </div>

        <div className="max-w-7xl mx-auto animate-slide-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
