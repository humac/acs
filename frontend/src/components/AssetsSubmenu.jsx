import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function AssetsSubmenu() {
  const { pathname } = useLocation();

  function isActive(path) {
    return pathname === path;
  }

  return (
    <div className="flex items-center border-b pb-2">
      <nav className="flex space-x-4 text-sm">
        <Link to="/assets" className={`pb-2 ${isActive('/assets') ? 'border-b-2 border-sky-600 text-sky-600' : 'text-gray-600'}`}>
          Assets
        </Link>
        <Link to="/assets/dashboard" className={`pb-2 ${isActive('/assets/dashboard') ? 'border-b-2 border-sky-600 text-sky-600' : 'text-gray-600'}`}>
          Dashboard
        </Link>
      </nav>
    </div>
  );
}
