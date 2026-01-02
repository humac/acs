import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function AssetsSubmenu() {
  const { pathname } = useLocation();

  function isActive(path) {
    return pathname === path;
  }

  return (
    <div className="glass-panel rounded-full px-2 py-1 inline-flex gap-1 border-white/10">
      <Link 
        to="/assets" 
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
          isActive('/assets') 
            ? 'bg-primary/10 text-primary' 
            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
        )}
      >
        Assets
      </Link>
      <Link 
        to="/assets/dashboard" 
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
          isActive('/assets/dashboard') 
            ? 'bg-primary/10 text-primary' 
            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
        )}
      >
        Dashboard
      </Link>
    </div>
  );
}
