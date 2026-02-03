import React, { memo, useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    Edit,
    Trash2,
    ChevronDown,
    ChevronRight,
    PlayCircle,
    Eye,
    Download,
    XCircle,
    CheckCircle2,
    Clock,
    UserX,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const statusVariants = {
    draft: 'bg-muted/20 text-muted-foreground border-transparent',
    active: 'bg-success/15 text-success border-success/20',
    completed: 'bg-info/15 text-info border-info/20',
    cancelled: 'bg-destructive/15 text-destructive border-destructive/20'
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
        return new Date(dateStr).toLocaleDateString();
    } catch {
        return dateStr;
    }
};

const AttestationCampaignTableRow = memo(function AttestationCampaignTableRow({
    campaign,
    stats,
    isSelected,
    canManage,
    onToggleSelect,
    onStart,
    onEdit,
    onDelete,
    onCancel,
    onViewDashboard,
    onExport,
    index = 0,
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const statusKey = (campaign.status || '').toLowerCase();

    const getProgressPercentage = () => {
        if (!stats || stats.total === 0) return 0;
        return Math.round((stats.completed / stats.total) * 100);
    };

    const percentage = getProgressPercentage();

    return (
        <>
            <TableRow
                data-state={isSelected ? "selected" : undefined}
                className={cn(
                    "group transition-all duration-base animate-slide-up",
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

                <TableCell className="py-4 font-medium">
                    <div className="flex flex-col">
                        <span className="truncate max-w-[200px] text-foreground font-semibold">{campaign.name}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">{campaign.description}</span>
                    </div>
                </TableCell>

                <TableCell>
                    <div className="flex flex-col text-sm">
                        <div className="flex items-center gap-1.5">
                            <span className="opacity-70 text-xs uppercase tracking-wider">Start:</span>
                            <span>{formatDate(campaign.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="opacity-70 text-xs uppercase tracking-wider">End:</span>
                            <span>{campaign.end_date ? formatDate(campaign.end_date) : 'N/A'}</span>
                        </div>
                    </div>
                </TableCell>

                <TableCell className="w-[180px]">
                    {campaign.status === 'active' ? (
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span>Progress</span>
                                <span className="font-bold">{percentage}%</span>
                            </div>
                            <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-info transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <div className="text-[10px] text-muted-foreground text-right">
                                {stats?.completed || 0} / {stats?.total || 0}
                            </div>
                        </div>
                    ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                    )}
                </TableCell>

                <TableCell>
                    <Badge className={cn("rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest", statusVariants[statusKey])}>
                        {campaign.status}
                    </Badge>
                </TableCell>

                <TableCell className="text-right pr-4">
                    <div className="flex justify-end gap-1">
                        {campaign.status === 'draft' && canManage && (
                            <>
                                <Button variant="ghost" size="icon" onClick={onStart} className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10" title="Start Campaign">
                                    <PlayCircle className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8 hover:text-foreground" title="Edit Campaign">
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10" title="Delete Campaign">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        {campaign.status === 'active' && (
                            <>
                                <Button variant="ghost" size="icon" onClick={onViewDashboard} className="h-8 w-8 text-info hover:text-info hover:bg-info/10" title="View Dashboard">
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={onExport} className="h-8 w-8 hover:text-foreground" title="Export Data">
                                    <Download className="h-4 w-4" />
                                </Button>
                                {canManage && (
                                    <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10" title="Cancel Campaign">
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                )}
                            </>
                        )}
                        {(campaign.status === 'completed' || campaign.status === 'cancelled') && (
                            <>
                                <Button variant="ghost" size="icon" onClick={onExport} className="h-8 w-8 hover:text-foreground" title="Export Data">
                                    <Download className="h-4 w-4" />
                                </Button>
                                {canManage && (
                                    <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10" title="Delete Campaign">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </TableCell>
            </TableRow>

            {/* Expanded Details Row */}
            {isExpanded && (
                <TableRow className="bg-surface/40 border-none animate-in fade-in slide-in-from-top-2 duration-300">
                    <TableCell colSpan={7} className="p-0">
                        <div className="px-12 py-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Dashboard Metrics in Expanded View */}
                            <div className="glass-panel p-4 rounded-xl flex items-center gap-3 border-l-4 border-l-success">
                                <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                </div>
                                <div>
                                    <div className="text-xl font-bold">{stats?.completed || 0}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Completed</div>
                                </div>
                            </div>

                            <div className="glass-panel p-4 rounded-xl flex items-center gap-3 border-l-4 border-l-warning">
                                <div className="h-8 w-8 rounded-full bg-warning/10 flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-warning" />
                                </div>
                                <div>
                                    <div className="text-xl font-bold">{(stats?.total || 0) - (stats?.completed || 0)}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Pending</div>
                                </div>
                            </div>

                            <div className="glass-panel p-4 rounded-xl flex items-center gap-3 border-l-4 border-l-muted">
                                <div className="h-8 w-8 rounded-full bg-muted/10 flex items-center justify-center">
                                    <UserX className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <div className="text-xl font-bold">{campaign.pending_invites_count || 0}</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Unregistered</div>
                                </div>
                            </div>

                            {/* Overdue Placehoder - assuming we might calculate this later or get from stats */}
                            <div className="glass-panel p-4 rounded-xl flex items-center gap-3 border-l-4 border-l-destructive">
                                <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                </div>
                                <div>
                                    <div className="text-xl font-bold">0</div>
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Overdue</div>
                                </div>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
});

export default AttestationCampaignTableRow;
