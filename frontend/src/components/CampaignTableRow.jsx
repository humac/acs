import React, { memo, useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Eye,
  Download,
  Edit,
  PlayCircle,
  XCircle,
  Trash2,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Users,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const statusConfig = {
  draft: { class: 'glow-muted', label: 'Draft' },
  active: { class: 'glow-success', label: 'Active' },
  completed: { class: 'glow-info', label: 'Completed' },
  cancelled: { class: 'glow-destructive', label: 'Cancelled' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'Not set';
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
};

const CampaignTableRow = memo(function CampaignTableRow({
  campaign,
  stats,
  canManageCampaigns,
  onViewDashboard,
  onExport,
  onEdit,
  onStart,
  onCancel,
  onDelete,
  index = 0,
}) {
  const { getAuthHeaders } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedStats, setExpandedStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const statusInfo = statusConfig[campaign.status] || statusConfig.draft;
  const effectiveStats = stats || expandedStats;

  const handleToggleExpand = async () => {
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);

    if (nextExpanded && !effectiveStats && campaign.status !== 'draft') {
      setLoadingStats(true);
      try {
        const res = await fetch(`/api/attestation/campaigns/${campaign.id}/dashboard`, {
          headers: { ...getAuthHeaders() },
        });
        if (res.ok) {
          const data = await res.json();
          const records = data.records || [];
          const completed = records.filter((r) => r.status === 'completed').length;
          const pending = records.filter((r) => r.status === 'pending').length;
          const unregistered = records.filter((r) => r.status === 'unregistered').length;
          const total = records.length;
          const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

          const daysElapsed = Math.floor(
            (new Date() - new Date(campaign.start_date)) / (1000 * 60 * 60 * 24)
          );
          const overdue = records.filter((r) => {
            if (r.status === 'completed') return false;
            return daysElapsed > (campaign.escalation_days || 0);
          }).length;

          setExpandedStats({ completed, pending, unregistered, overdue, total, percentage });
        }
      } catch (err) {
        console.error('Failed to load campaign stats:', err);
      } finally {
        setLoadingStats(false);
      }
    }
  };

  return (
    <>
      <TableRow
        className={cn(
          'group transition-all duration-base animate-slide-up',
          isExpanded && 'bg-surface/30'
        )}
        style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
      >
        {/* Expand toggle */}
        <TableCell className="w-10 px-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary/10 transition-colors"
            onClick={handleToggleExpand}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </Button>
        </TableCell>

        {/* Campaign Name */}
        <TableCell className="py-4">
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-sm bg-primary/10 border-primary/20 flex-shrink-0">
              <ClipboardCheck size={16} className="text-primary" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-foreground leading-tight truncate">
                {campaign.name}
              </div>
              {campaign.description && (
                <div className="text-xs text-muted-foreground truncate max-w-[250px]">
                  {campaign.description}
                </div>
              )}
            </div>
          </div>
        </TableCell>

        {/* Start Date */}
        <TableCell className="font-medium text-sm">
          {formatDate(campaign.start_date)}
        </TableCell>

        {/* End Date */}
        <TableCell className="font-medium text-sm">
          {formatDate(campaign.end_date)}
        </TableCell>

        {/* Progress */}
        <TableCell>
          {campaign.status === 'active' && effectiveStats && effectiveStats.total > 0 ? (
            <div className="flex items-center gap-2 min-w-[120px]">
              <div className="flex-1 bg-muted/50 rounded-full h-1.5 overflow-hidden border border-white/5">
                <div
                  className="h-full transition-all duration-500 rounded-full bg-gradient-to-r from-primary to-info"
                  style={{ width: `${effectiveStats.percentage}%` }}
                />
              </div>
              <span className="text-xs font-bold text-primary whitespace-nowrap">
                {effectiveStats.percentage}%
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </TableCell>

        {/* Status */}
        <TableCell>
          <Badge
            className={cn(
              'rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest',
              statusInfo.class
            )}
          >
            {statusInfo.label}
          </Badge>
        </TableCell>

        {/* Actions */}
        <TableCell className="text-right pr-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 btn-interactive">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {campaign.status === 'active' && (
                <DropdownMenuItem onClick={() => onViewDashboard(campaign)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
              )}
              {campaign.status !== 'draft' && (
                <DropdownMenuItem onClick={() => onExport(campaign.id, campaign.name)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuItem>
              )}
              {campaign.status === 'draft' && canManageCampaigns && (
                <DropdownMenuItem onClick={() => onEdit(campaign)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {canManageCampaigns && <DropdownMenuSeparator />}
              {campaign.status === 'draft' && canManageCampaigns && (
                <DropdownMenuItem onClick={() => onStart(campaign)}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Campaign
                </DropdownMenuItem>
              )}
              {campaign.status === 'active' && canManageCampaigns && (
                <DropdownMenuItem
                  onClick={() => onCancel(campaign)}
                  className="text-destructive focus:text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Campaign
                </DropdownMenuItem>
              )}
              {campaign.status !== 'active' && canManageCampaigns && (
                <DropdownMenuItem
                  onClick={() => onDelete(campaign)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Campaign
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Expanded Details Row - Mini Dashboard */}
      {isExpanded && (
        <TableRow className="bg-surface/40 border-none animate-in fade-in slide-in-from-top-2 duration-300">
          <TableCell colSpan={7} className="p-0">
            <div className="px-16 py-6">
              {campaign.status === 'draft' ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Campaign has not been started yet. Start the campaign to see statistics.
                </div>
              ) : loadingStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-muted/30 shimmer" />
                  ))}
                </div>
              ) : effectiveStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Completed */}
                  <div className="glass-panel rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="icon-box icon-box-sm bg-success/10 border-success/20">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      </div>
                      <span className="caption-label">Completed</span>
                    </div>
                    <span className="text-2xl font-bold text-success">
                      {effectiveStats.completed}
                    </span>
                  </div>

                  {/* Pending */}
                  <div className="glass-panel rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="icon-box icon-box-sm bg-warning/10 border-warning/20">
                        <Clock className="h-4 w-4 text-warning" />
                      </div>
                      <span className="caption-label">Pending</span>
                    </div>
                    <span className="text-2xl font-bold text-warning">
                      {effectiveStats.pending}
                    </span>
                  </div>

                  {/* Unregistered */}
                  <div
                    className={cn(
                      'glass-panel rounded-xl p-4',
                      effectiveStats.unregistered > 0 && 'border-warning/30'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="icon-box icon-box-sm bg-warning/10 border-warning/20">
                        <Users className="h-4 w-4 text-warning" />
                      </div>
                      <span className="caption-label">Unregistered</span>
                    </div>
                    <span className="text-2xl font-bold text-warning">
                      {effectiveStats.unregistered}
                    </span>
                  </div>

                  {/* Overdue */}
                  <div
                    className={cn(
                      'glass-panel rounded-xl p-4',
                      effectiveStats.overdue > 0 && 'border-destructive/30'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="icon-box icon-box-sm bg-destructive/10 border-destructive/20">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      </div>
                      <span className="caption-label">Overdue</span>
                    </div>
                    <span className="text-2xl font-bold text-destructive">
                      {effectiveStats.overdue}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No statistics available for this campaign.
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
});

export default CampaignTableRow;
