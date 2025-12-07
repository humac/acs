import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AssetTable({ assets = [], onEdit, onDelete, currentUser }) {
  const { getAuthHeaders } = useAuth();

  async function handleDelete(asset) {
    if (!confirm(`Delete asset "${asset.employee_name}"? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/assets/${asset.id}`, { 
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
      if (!res.ok) throw new Error('Delete failed');
      onDelete(asset.id);
    } catch (err) {
      console.error(err);
      alert('Unable to delete asset.');
    }
  }

  const canEdit = (asset) => {
    if (currentUser?.roles?.includes('admin')) return true;
    if (currentUser?.roles?.includes('editor')) return true;
    return false;
  };

  return (
    <div className="shadow-sm border rounded-md overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Name</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Type</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Owner</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Status</th>
            <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {assets.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-sm text-gray-500" colSpan={5}>No assets found</td>
            </tr>
          )}
          {assets.map(asset => (
            <tr key={asset.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-800">{asset.employee_name || 'N/A'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{asset.laptop_make && asset.laptop_model ? `${asset.laptop_make} ${asset.laptop_model}` : 'N/A'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{asset.employee_email || 'N/A'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{asset.status || 'unknown'}</td>
              <td className="px-4 py-3 text-right text-sm space-x-2">
                <button
                  onClick={() => onEdit(asset)}
                  disabled={!canEdit(asset)}
                  className={`px-2 py-1 rounded text-sm ${canEdit(asset) ? 'text-sky-600 hover:bg-sky-50' : 'text-gray-300 cursor-not-allowed'}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(asset)}
                  className="px-2 py-1 rounded text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
