import React from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const AssetViewModal = ({ asset, open = true, onClose }) => {
  if (!asset) return null;

  // Map status to glow classes
  const statusClasses = {
    active: 'glow-success',
    returned: 'glow-muted',
    lost: 'glow-destructive',
    damaged: 'glow-warning',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-overlay sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-4">
            <span>Asset Details</span>
            <Badge className={cn("rounded-full px-3 py-1", statusClasses[asset.status] || 'glow-muted')}>
              {(asset.status || '').toUpperCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription className="mt-1">
            Read-only details for <span className="font-medium">{asset.employee_first_name && asset.employee_last_name ? `${asset.employee_first_name} ${asset.employee_last_name}` : 'N/A'}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="glass-panel rounded-xl p-4 space-y-3">
            <div>
              <div className="caption-label">Employee</div>
              <div className="font-medium mt-1">{asset.employee_first_name && asset.employee_last_name ? `${asset.employee_first_name} ${asset.employee_last_name}` : 'N/A'}</div>
            </div>

            <div>
              <div className="caption-label">Email</div>
              <div className="text-sm mt-1">{asset.employee_email || '-'}</div>
            </div>

            <div>
              <div className="caption-label">Company</div>
              <div className="text-sm mt-1">{asset.company_name || '-'}</div>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4 space-y-3">
            <div>
              <div className="caption-label">Asset Tag</div>
              <div className="font-mono mt-1">{asset.asset_tag || asset.laptop_asset_tag || '-'}</div>
            </div>

            <div>
              <div className="caption-label">Serial</div>
              <div className="font-mono mt-1">{asset.serial_number || asset.laptop_serial_number || '-'}</div>
            </div>

            <div>
              <div className="caption-label">Manager</div>
              <div className="text-sm mt-1">{asset.manager_first_name && asset.manager_last_name ? `${asset.manager_first_name} ${asset.manager_last_name}` : '-'}</div>
            </div>

            <div>
              <div className="caption-label">Issued Date</div>
              <div className="text-sm mt-1">{asset.issued_date ? new Date(asset.issued_date).toLocaleDateString() : '-'}</div>
            </div>

            {asset.returned_date && (
              <div>
                <div className="caption-label">Returned Date</div>
                <div className="text-sm mt-1">{new Date(asset.returned_date).toLocaleDateString()}</div>
              </div>
            )}
          </div>

          <div className="sm:col-span-2 glass-panel rounded-xl p-4">
            <div className="caption-label">Notes</div>
            <div className="text-sm max-h-36 overflow-auto mt-2">{asset.notes || '-'}</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="btn-interactive">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssetViewModal;
