import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Image, Shield, Key, Mail, Server, Database,
  Plug, Laptop, Menu, Search, ChevronRight, AlertTriangle, UserCog
} from 'lucide-react';

const navItems = [
  {
    category: 'Appearance',
    items: [
      { id: 'branding', label: 'Branding', icon: Image }
    ]
  },
  {
    category: 'Authentication & Security',
    items: [
      { id: 'auth', label: 'Authentication', icon: UserCog },
      { id: 'passkeys', label: 'Passkeys/WebAuthn', icon: Key, badge: 'Restart Required' },
      { id: 'oidc', label: 'SSO/OIDC', icon: Shield }
    ]
  },
  {
    category: 'Communications',
    items: [
      { id: 'smtp', label: 'Email Settings', icon: Mail },
      { id: 'templates', label: 'Email Templates', icon: Mail }
    ]
  },
  {
    category: 'System Configuration',
    items: [
      { id: 'asset-types', label: 'Asset Types', icon: Laptop },
      { id: 'proxy', label: 'Proxy Settings', icon: Server, badge: 'Restart Required' },
      { id: 'rate-limiting', label: 'Rate Limiting', icon: Server },
      { id: 'database', label: 'Database', icon: Database, badge: 'Restart Required' }
    ]
  },
  {
    category: 'Integrations',
    items: [
      { id: 'hubspot', label: 'HubSpot CRM', icon: Plug }
    ]
  },
  {
    category: 'Danger Zone',
    items: [
      { id: 'danger-zone', label: 'Danger Zone', icon: AlertTriangle }
    ]
  }
];

const SettingsSidebar = ({ activeSection, onSectionChange, searchQuery, onSearchChange }) => {
  // Filter items based on search
  const filteredNavItems = searchQuery
    ? navItems
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }))
      .filter(group => group.items.length > 0)
    : navItems;

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search settings..."
            className="pl-9 h-9"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-6">
          {filteredNavItems.map((group) => (
            <div key={group.category}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {group.category}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      activeSection === item.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded">
                        !
                      </span>
                    )}
                    <ChevronRight className={cn(
                      "h-4 w-4 shrink-0 transition-transform",
                      activeSection === item.id && "rotate-90"
                    )} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

const SettingsLayout = ({ children, activeSection, onSectionChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSectionChange = (section) => {
    onSectionChange(section);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-[500px] border-t border-border/50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r border-border/50">
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </aside>

      {/* Mobile Menu Button + Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild className="lg:hidden fixed bottom-4 right-4 z-50">
          <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SettingsSidebar
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default SettingsLayout;
