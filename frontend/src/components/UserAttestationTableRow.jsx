import React, { useState } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    ChevronDown,
    ChevronRight,
    PlayCircle,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Calendar,
    Clock,
    Laptop,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function UserAttestationTableRow({ attestation, onStartAttestation }) {
    const { getAuthHeaders } = useAuth();
    const { toast } = useToast();
    const [isExpanded, setIsExpanded] = useState(false);
    const [assets, setAssets] = useState([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [assetsLoaded, setAssetsLoaded] = useState(false);

    const statusConfig = {
        pending: { class: 'bg-warning/15 text-warning border-warning/20', label: 'Pending', icon: AlertCircle },
        in_progress: { class: 'bg-primary/15 text-primary border-primary/20', label: 'In Progress', icon: RefreshCw },
        completed: { class: 'bg-success/15 text-success border-success/20', label: 'Completed', icon: CheckCircle2 }
    };

    const assetStatusConfig = {
        active: { class: "bg-success/15 text-success border-success/20", label: "Active" },
        missing: { class: "bg-destructive/15 text-destructive border-destructive/20", label: "Missing" },
        damaged: { class: "bg-warning/15 text-warning border-warning/20", label: "Damaged" },
        returned: { class: "bg-info/15 text-info border-info/20", label: "Returned" },
        stolen: { class: "bg-destructive/15 text-destructive border-destructive/20", label: "Stolen" },
    };

    const statusInfo = statusConfig[attestation.status] || statusConfig.pending;

    // Calculate progress override based on status if no explicit progress data
    let progressValue = 0;
    if (attestation.status === 'completed') progressValue = 100;
    else if (attestation.status === 'in_progress') progressValue = 33;

    const handleExpandToggle = async () => {
        const newExpandedState = !isExpanded;
        setIsExpanded(newExpandedState);

        if (newExpandedState && !assetsLoaded) {
            setLoadingAssets(true);
            try {
                const res = await fetch(`/api/attestation/records/${attestation.id}`, {
                    headers: { ...getAuthHeaders() }
                });

                if (!res.ok) throw new Error('Failed to load assets');

                const data = await res.json();
                setAssets(data.assets || []);
                setAssetsLoaded(true);
            } catch (err) {
                console.error(err);
                toast({
                    title: 'Error',
                    description: 'Failed to load asset details',
                    variant: 'destructive'
                });
            } finally {
                setLoadingAssets(false);
            }
        }
    };

    return (
        <>
            <TableRow
                className={cn(
                    "group transition-all duration-200 hover:bg-muted/50 dark:hover:bg-surface/40",
                    isExpanded && "bg-muted/30 dark:bg-surface/50 border-b-0"
                )}
            >
                {/* Expand Toggle */}
                <TableCell className="w-10 px-1 text-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-white/10"
                        onClick={handleExpandToggle}
                    >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </Button>
                </TableCell>

                {/* Campaign Name */}
                <TableCell className="font-medium">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground/90">{attestation.campaign?.name}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                            {attestation.campaign?.description || 'No description'}
                        </span>
                    </div>
                </TableCell>

                {/* Start Date */}
                <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(attestation.campaign?.start_date).toLocaleDateString()}
                    </div>
                </TableCell>

                {/* End Date */}
                <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {attestation.campaign?.end_date ? new Date(attestation.campaign?.end_date).toLocaleDateString() : 'No Deadline'}
                    </div>
                </TableCell>

                {/* Progress */}
                <TableCell className="w-[180px]">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs px-1">
                            <span className={cn("font-medium", statusInfo.class.split(' ')[1])}>{statusInfo.label}</span>
                            <span className="text-muted-foreground">{progressValue}%</span>
                        </div>
                        <Progress value={progressValue} className={cn("h-1.5 bg-surface/80",
                            attestation.status === 'completed' ? "[&>div]:bg-success" :
                                attestation.status === 'in_progress' ? "[&>div]:bg-primary" : "[&>div]:bg-warning"
                        )} />
                    </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                    {attestation.status !== 'completed' ? (
                        <Button
                            onClick={() => onStartAttestation(attestation)}
                            size="sm"
                            variant={attestation.status === 'pending' ? "default" : "outline"}
                            className={cn(
                                "gap-2 transition-all shadow-sm",
                                attestation.status === 'pending'
                                    ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-primary"
                                    : "border-primary/20 hover:bg-primary/10 text-primary hover:border-primary/50"
                            )}
                        >
                            {attestation.status === 'pending' ? <PlayCircle size={14} /> : <RefreshCw size={14} />}
                            {attestation.status === 'pending' ? 'Start' : 'Resume'}
                        </Button>
                    ) : (
                        <Badge variant="outline" className="gap-1.5 px-3 py-1 bg-success/5 text-success border-success/20">
                            <CheckCircle2 size={12} />
                            <span>Done</span>
                        </Badge>
                    )}
                </TableCell>
            </TableRow>

            {/* Expanded Details */}
            {isExpanded && (
                <TableRow className="bg-muted/30 dark:bg-surface/30 border-t-0 animate-in fade-in slide-in-from-top-1 duration-200">
                    <TableCell colSpan={6} className="p-0">
                        <div className="p-4 sm:p-6 bg-muted/40 dark:bg-black/20">
                            <div className="flex items-center gap-2 mb-4">
                                <Laptop className="h-4 w-4 text-primary" />
                                <h4 className="font-semibold text-sm text-foreground">Assets to Certify</h4>
                                <Badge variant="secondary" className="ml-auto text-xs font-normal">
                                    {loadingAssets ? 'Loading...' : `${assets.length} items`}
                                </Badge>
                            </div>

                            {loadingAssets ? (
                                <div className="flex items-center justify-center py-8 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    Loading assets...
                                </div>
                            ) : assets.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg border-dashed border-border dark:border-white/10 bg-card/50 dark:bg-white/5">
                                    No assets found for this attestation.
                                </div>
                            ) : (
                                <div className="rounded-lg border border-border dark:border-white/10 overflow-hidden bg-background/50 dark:bg-surface/50">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-muted/50 dark:bg-muted/30 border-b border-border dark:border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
                                                <th className="px-4 py-3 font-medium">Asset Tag</th>
                                                <th className="px-4 py-3 font-medium">Type</th>
                                                <th className="px-4 py-3 font-medium">Model/Description</th>
                                                <th className="px-4 py-3 font-medium text-right">Current Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border dark:divide-white/5">
                                            {assets.map((asset) => {
                                                const statusStyle = assetStatusConfig[asset.status] || assetStatusConfig.active;
                                                return (
                                                    <tr key={asset.id} className="hover:bg-muted/50 dark:hover:bg-white/5 transition-colors">
                                                        <td className="px-4 py-3 font-mono text-xs">{asset.asset_tag || '-'}</td>
                                                        <td className="px-4 py-3 capitalize">{asset.asset_type}</td>
                                                        <td className="px-4 py-3 text-muted-foreground">
                                                            {asset.make} {asset.model}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <Badge variant="outline" className={cn("text-xs border-0", statusStyle.class)}>
                                                                {statusStyle.label}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
}
