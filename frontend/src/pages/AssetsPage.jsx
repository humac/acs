import React, { useEffect, useState } from 'react';
import AssetTable from '../components/AssetTable';
import AssetsSubmenu from '../components/AssetsSubmenu';
import AssetEditModal from '../components/AssetEditModal';
import { useAuth } from '../contexts/AuthContext';

export default function AssetsPage() {
  const { getAuthHeaders, user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState({ roles: ['user'] });

  useEffect(() => {
    if (user) {
      // Map the user role to roles array for compatibility with the modal
      const roles = [];
      if (user.role === 'admin') roles.push('admin');
      if (user.role === 'editor') roles.push('editor');
      if (user.role === 'manager') roles.push('editor'); // managers can edit similar to editors
      if (user.role === 'employee') roles.push('user');
      roles.push('user'); // everyone has base user role
      
      setCurrentUser({ ...user, roles });
    }
  }, [user]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/assets', {
          headers: { ...getAuthHeaders() }
        });
        if (!res.ok) throw new Error('Failed to load assets');
        const data = await res.json();
        setAssets(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getAuthHeaders]);

  function onEdit(asset) {
    setSelectedAsset(asset);
    setShowEditModal(true);
  }

  function onDelete(id) {
    setAssets(prev => prev.filter(a => a.id !== id));
  }

  async function onSave(updated) {
    setAssets(prev => prev.map(a => (a.id === updated.id ? updated : a)));
    setShowEditModal(false);
    setSelectedAsset(null);
  }

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-4">
        <svg className="w-7 h-7 text-sky-600" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <h1 className="text-2xl font-semibold">Asset Management</h1>
      </div>

      <AssetsSubmenu />

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-gray-500">Loading assets...</div>
        ) : (
          <AssetTable
            assets={assets}
            onEdit={onEdit}
            onDelete={onDelete}
            currentUser={currentUser}
          />
        )}
      </div>

      {showEditModal && selectedAsset && (
        <AssetEditModal
          asset={selectedAsset}
          currentUser={currentUser}
          onClose={() => { setShowEditModal(false); setSelectedAsset(null); }}
          onSaved={onSave}
        />
      )}
    </div>
  );
}
