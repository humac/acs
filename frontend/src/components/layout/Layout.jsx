import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Laptop,
  Home,
  Users,
  Building2,
  FileBarChart,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  ClipboardCheck,
  Moon,
  Sun,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { usePendingAttestations } from '@/hooks/use-pending-attestations';

const Layout = ({ theme, setTheme }) => {
  const { user, logout } = useAuth();
  const { pendingCount } = usePendingAttestations();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Retrieve branding from localStorage (set in App.jsx)
  const brandingLogo = localStorage.getItem('branding_logo');
  const footerLabel = localStorage.getItem('footer_label') || 'SOC2 Compliance - Asset Compliance System';

  const navigation = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Assets', path: '/assets', icon: Laptop },
    { name: 'Attestation', path: '/attestation', icon: ClipboardCheck, roles: ['admin', 'manager', 'coordinator'] },
    { name: 'Companies', path: '/companies', icon: Building2, roles: ['admin', 'manager', 'coordinator'] },
    { name: 'Users', path: '/users', icon: Users, roles: ['admin', 'manager', 'coordinator'] },
    { name: 'Audit', path: '/audit', icon: FileBarChart, roles: ['admin', 'manager', 'coordinator'] },
    { name: 'Admin Settings', path: '/admin', icon: Settings, roles: ['admin'] },
  ];

  const filteredNav = navigation.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden relative">
      {/* 1. Global Background Floor with Ambient Gradient Orbs */}
      <div className="fixed inset-0 floor pointer-events-none" aria-hidden="true">
        {/* Ambient gradient orbs for visual depth - Obsidian Glass 2026 */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-info/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[120px]" />
      </div>

      {/* 2. Desktop Floating Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-4 left-4 z-50 w-72 hidden lg:flex flex-col",
          "glass-panel rounded-2xl shadow-2xl animate-fade-in"
        )}
        style={{ willChange: 'transform' }}
      >
        {/* Branding Area */}
        <div className="p-8 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
          {brandingLogo ? (
            <img src={brandingLogo} alt="Logo" className="h-9 w-auto object-contain" />
          ) : (
            <div className="flex items-center gap-3">
              <div className="icon-box icon-box-md bg-primary/10 border-primary/20 shadow-[0_0_20px_-5px] shadow-primary/30">
                <Laptop className="text-primary h-6 w-6" />
              </div>
              <span className="text-xl font-bold tracking-tighter text-gradient">ACS Admin</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                )}
              >
                <item.icon size={20} className={cn(
                  "transition-all duration-200",
                  isActive ? "text-primary" : "opacity-50 group-hover:opacity-100"
                )} />
                <span className="flex-1 text-left">{item.name}</span>
                {item.name === 'Attestation' && pendingCount > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 min-w-[20px] rounded-full text-[10px]">
                    {pendingCount}
                  </Badge>
                )}
                {isActive && (
                  <ChevronRight size={16} className="text-primary animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions & Profile */}
        <div className="p-4 mt-auto space-y-3 border-t border-white/5">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-xl h-12 hover:bg-white/5 transition-all duration-200"
            onClick={toggleTheme}
          >
            <div className="icon-box icon-box-sm bg-muted/30 border-muted/20">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </div>
            <span className="text-sm font-semibold">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </Button>

          <div className="glass-panel p-4 rounded-xl bg-surface/30 space-y-4 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-11 w-11 border-2 border-white/10 shadow-lg ring-2 ring-primary/10">
                  <AvatarImage src={user?.profile_image} />
                  <AvatarFallback className="bg-primary/15 text-primary font-bold text-lg">
                    {user?.first_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {pendingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-destructive rounded-full border-2 border-background animate-pulse" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate leading-snug mb-1.5 pb-0.5">{user?.first_name} {user?.last_name}</p>
                <Badge variant={user?.role === 'admin' ? 'glow-destructive' : user?.role === 'manager' ? 'glow-success' : user?.role === 'coordinator' ? 'glow-info' : 'glow-purple'} className="caption-label h-5 px-2">
                  {user?.role}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs font-bold hover:bg-primary/10 hover:text-primary transition-all duration-200"
                onClick={() => navigate('/profile')}
              >
                <User size={14} className="mr-1" />
                Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs font-bold text-destructive hover:bg-destructive/15 hover:text-destructive transition-all duration-200"
                onClick={logout}
              >
                <LogOut size={14} className="mr-1" />
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Menu Panel */}
          <aside className="glass-overlay absolute inset-y-4 left-4 right-4 rounded-2xl flex flex-col max-w-sm mx-auto animate-scale-in">
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                {brandingLogo ? (
                  <img src={brandingLogo} alt="Logo" className="h-8 w-auto" />
                ) : (
                  <>
                    <div className="icon-box icon-box-sm bg-primary/10 border-primary/20">
                      <Laptop className="text-primary h-5 w-5" />
                    </div>
                    <span className="font-bold tracking-tight text-gradient">ACS</span>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl h-10 w-10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={20} />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {filteredNav.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.name}
                    onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                    )}
                  >
                    <item.icon size={20} className={cn(
                      isActive ? "text-primary" : "opacity-50 group-hover:opacity-100"
                    )} />
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.name === 'Attestation' && pendingCount > 0 && (
                      <Badge variant="destructive" className="h-5 px-1.5 min-w-[20px] rounded-full text-[10px]">
                        {pendingCount}
                      </Badge>
                    )}
                    {isActive && (
                      <ChevronRight size={16} className="text-primary" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 space-y-3">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-xl h-12"
                onClick={toggleTheme}
              >
                <div className="icon-box icon-box-sm bg-muted/30 border-muted/20">
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </div>
                <span className="text-sm font-semibold">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </Button>

              <div className="glass-panel p-4 rounded-xl bg-surface/30 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white/10">
                    <AvatarImage src={user?.profile_image} />
                    <AvatarFallback className="bg-primary/15 text-primary font-bold">
                      {user?.first_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate leading-snug pb-0.5">{user?.first_name} {user?.last_name}</p>
                    <Badge variant={user?.role === 'admin' ? 'glow-destructive' : user?.role === 'manager' ? 'glow-success' : user?.role === 'coordinator' ? 'glow-info' : 'glow-purple'} className="caption-label h-4 px-1.5 mt-1">
                      {user?.role}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs font-bold"
                    onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}
                  >
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs font-bold text-destructive hover:bg-destructive/15"
                    onClick={logout}
                  >
                    Log Out
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* 3. Main Content Scroll Area */}
      <main className="flex-1 lg:ml-[304px] p-4 lg:p-8 relative z-10 overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-6 glass-panel p-4 rounded-2xl border-glass animate-fade-in">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            {brandingLogo ? (
              <img src={brandingLogo} className="h-6 w-auto" alt="Logo" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="icon-box icon-box-sm bg-primary/10 border-primary/20">
                  <Laptop className="text-primary h-4 w-4" />
                </div>
                <span className="font-bold tracking-tight text-gradient">ACS</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-10 w-10 btn-interactive"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        {/* Dynamic Page Content */}
        <div className="max-w-7xl mx-auto animate-slide-up pb-12">
          <Outlet />
        </div>

        {/* Global Footer */}
        <footer className="mt-auto py-8 text-center caption-label opacity-40">
          {footerLabel}
        </footer>
      </main>
    </div>
  );
};

export default Layout;
