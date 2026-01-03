import React, { memo, useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Edit, Trash2, ChevronDown, ChevronRight, Loader2, Laptop, User, Calendar, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatEmployeeName } from '@/utils/user';
import { ASSET_STATUS_OPTIONS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Status variants mapping to the new semantic system
 */
const statusVariants = {
  active: 'bg-success/15 text-success border-success/20',
  returned: 'bg-muted/20 text-muted-foreground border-transparent',
  lost: 'bg-destructive/15 text-destructive border-destructive/20',
  damaged: 'bg-warning/15 text-warning border-warning/20',
  retired: 'bg-secondary/30 text-secondary-foreground border-transparent'
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
};

const AssetTableRow = memo(function AssetTableRow({
  asset,
  isSelected,
  canEdit,
  canDelete,
  onToggleSelect,
  onEdit,
  onDelete,
  onStatusUpdated,
  index = 0, // Used for staggered animation delay
}) {
  const { getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(asset.status || 'active');
  const [returnedDate, setReturnedDate] = useState(asset.returned_date || '');
  const [saving, setSaving] = useState(false);

  const statusKey = (asset.status || '').toLowerCase();

  const handleStatusChange = async () => {
    if (pendingStatus === 'returned' && !returnedDate) {
      toast({
        title: "Validation Error",
        description: "Returned date is required for status 'Returned'",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...asset,
        status: pendingStatus,
        returned_date: pendingStatus === 'returned' ? returnedDate : null,
      };

      const res = await fetch(`/api/assets/${asset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text() || 'Save failed');

      const updated = await res.json();
      toast({ title: "Success", description: "Asset status updated", variant: "success" });
      setStatusPopoverOpen(false);
      if (onStatusUpdated) onStatusUpdated(updated.asset || updated);
    } catch (err) {
      toast({ title: "Error", description: err.message || 'Update failed', variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TableRow
        className={cn(
          "group border-b border-white/5 transition-all duration-base hover:bg-white/[0.02] animate-slide-up",
          isSelected && 'bg-primary/5 border-primary/20',
          isExpanded && 'bg-surface/30'
        )}
        style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
      >
        <TableCell className="w-12 px-4">
          <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
        </TableCell>

        <TableCell className="w-10 px-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary/10 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </Button>
        </TableCell>

        <TableCell className="py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
              <User size={16} className="text-primary" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground leading-tight truncate">
                {formatEmployeeName(asset, 'N/A')}
              </div>
              <div className="text-xs text-muted-foreground truncate">{asset.employee_email || 'N/A'}</div>
            </div>
          </div>
        </TableCell>

        <TableCell className="font-medium">
          <span className="truncate block max-w-[120px]">{asset.company_name || '-'}</span>
        </TableCell>

        <TableCell>
          <Badge variant="secondary" className="bg-surface/50 font-medium capitalize">
            {asset.asset_type?.replace('_', ' ') || '-'}
          </Badge>
        </TableCell>

        <TableCell>
          <code className="text-xs bg-muted/50 px-2 py-1 rounded font-mono">{asset.asset_tag || '-'}</code>
        </TableCell>

        <TableCell>
          {canEdit ? (
            <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                  <Badge className={cn(
                    "rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:opacity-80 transition-opacity",
                    statusVariants[statusKey] || 'outline'
                  )}>
                    {asset.status || 'unknown'}
                  </Badge>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 glass-panel border-glass" align="start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-tighter opacity-70">Update Status</Label>
                    <Select value={pendingStatus} onValueChange={setPendingStatus}>
                      <SelectTrigger className="bg-surface/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {pendingStatus === 'returned' && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-tighter opacity-70">Returned Date *</Label>
                      <Input type="date" className="bg-surface/50" value={returnedDate} onChange={(e) => setReturnedDate(e.target.value)} />
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                    <Button variant="ghost" size="sm" onClick={() => setStatusPopoverOpen(false)}>Cancel</Button>
                    <Button size="sm" variant="glow" onClick={handleStatusChange} disabled={saving}>
                      {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Badge className={cn("rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest", statusVariants[statusKey])}>
              {asset.status || 'unknown'}
            </Badge>
          )}
        </TableCell>

        <TableCell className="text-right pr-4">
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit} disabled={!canEdit} className="h-8 w-8 hover:text-primary">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} disabled={!canDelete} className="h-8 w-8 text-destructive/60 hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded Details Row */}
      {isExpanded && (
        <TableRow className="bg-surface/40 border-none animate-in fade-in slide-in-from-top-2 duration-300">
          <TableCell colSpan={8} className="p-0">
            <div className="px-16 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <User size={12} /> Management
                </h4>
                <div className="glass-panel p-4 rounded-xl space-y-1">
                  <div className="text-sm font-bold">{asset._managerDisplayName || 'Unassigned'}</div>
                  <div className="text-xs text-muted-foreground truncate">{asset._managerEmail || 'No contact info'}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Laptop size={12} /> Make / Model / SN
                </h4>
                <div className="glass-panel p-4 rounded-xl space-y-1">
                  <div className="text-sm font-bold">{asset.make || 'Unknown'} {asset.model || ''}</div>
                  <div className="text-xs text-primary/70 font-mono tracking-tighter">{asset.serial_number || 'No Serial'}</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Calendar size={12} /> Timeline
                </h4>
                <div className="glass-panel p-4 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="opacity-50">Issued:</span>
                    <span className="font-medium">{formatDate(asset.issued_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-50">Returned:</span>
                    <span className="font-medium">{formatDate(asset.returned_date)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <FileText size={12} /> Notes
                </h4>
                <div className="glass-panel p-4 rounded-xl min-h-[60px] text-xs leading-relaxed opacity-80 italic">
                  {asset.notes || 'No additional notes provided for this asset.'}
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
});

export default AssetTableRow;
