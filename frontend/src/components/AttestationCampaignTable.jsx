import React, { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import TablePaginationControls from '@/components/TablePaginationControls';
import AttestationCampaignTableRow from '@/components/AttestationCampaignTableRow';
import AttestationCampaignTableFilters from '@/components/AttestationCampaignTableFilters';
import BulkCampaignActions from '@/components/BulkCampaignActions';
import { SearchX, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AttestationCampaignTable({
    campaigns = [],
    campaignStats = {},
    onStart,
    onEdit,
    onDelete,
    onCancel,
    onViewDashboard,
    onExport,
    currentUser,
    onBulkDelete,
}) {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const canManage = user?.role === 'admin' || user?.role === 'coordinator';

    // Filtering Logic
    const filteredCampaigns = useMemo(() => {
        return campaigns.filter(campaign => {
            const matchesSearch = !searchTerm || campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [campaigns, searchTerm, statusFilter]);

    // Pagination Logic
    const paginatedCampaigns = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredCampaigns.slice(start, start + pageSize);
    }, [filteredCampaigns, page, pageSize]);

    // Selection Logic
    const toggleSelectAll = () => {
        const pageIds = paginatedCampaigns.map(c => c.id);
        const allSelected = pageIds.every(id => selectedIds.has(id));
        setSelectedIds(prev => {
            const next = new Set(prev);
            pageIds.forEach(id => allSelected ? next.delete(id) : next.add(id));
            return next;
        });
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <AttestationCampaignTableFilters
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                onClearFilters={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                }}
            />

            <BulkCampaignActions
                selectedIds={selectedIds}
                filteredCampaigns={filteredCampaigns}
                allCampaigns={campaigns}
                hasActiveFilters={searchTerm !== '' || statusFilter !== 'all'}
                onClearSelection={() => setSelectedIds(new Set())}
                onBulkDelete={async () => {
                    if (onBulkDelete) {
                        await onBulkDelete(selectedIds);
                        setSelectedIds(new Set());
                    }
                }}
                currentUser={currentUser}
            />

            {campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-in fade-in zoom-in-95 duration-300">
                    <div className="icon-box icon-box-lg bg-primary/10 border-primary/20 mb-6">
                        <ClipboardCheck className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">No campaigns yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm text-center">
                        There are no active campaigns. Create your first campaign to get started.
                    </p>
                </div>
            ) : filteredCampaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <SearchX className="h-12 w-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No campaigns found matching your criteria</p>
                </div>
            ) : (
                <Table className="w-full">
                    <TableHeader className="bg-muted/20 dark:bg-white/[0.02] border-b border-white/10">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-12 px-4">
                                <Checkbox
                                    checked={
                                        paginatedCampaigns.length > 0 && paginatedCampaigns.every(c => selectedIds.has(c.id))
                                            ? true
                                            : paginatedCampaigns.some(c => selectedIds.has(c.id))
                                                ? "indeterminate"
                                                : false
                                    }
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="w-10"></TableHead>
                            <TableHead className="caption-label">Campaign Name / Description</TableHead>
                            <TableHead className="caption-label">Timeline</TableHead>
                            <TableHead className="caption-label">Progress</TableHead>
                            <TableHead className="caption-label">Status</TableHead>
                            <TableHead className="text-right pr-4 caption-label">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedCampaigns.map((campaign, index) => (
                            <AttestationCampaignTableRow
                                key={campaign.id}
                                campaign={campaign}
                                stats={campaignStats[campaign.id]}
                                index={index}
                                isSelected={selectedIds.has(campaign.id)}
                                canManage={canManage}
                                onToggleSelect={() => {
                                    const next = new Set(selectedIds);
                                    next.has(campaign.id) ? next.delete(campaign.id) : next.add(campaign.id);
                                    setSelectedIds(next);
                                }}
                                onStart={() => onStart(campaign)}
                                onEdit={() => onEdit(campaign)}
                                onDelete={() => onDelete(campaign)}
                                onCancel={() => onCancel(campaign)}
                                onViewDashboard={() => onViewDashboard(campaign)}
                                onExport={() => onExport(campaign.id, campaign.name)}
                            />
                        ))}
                    </TableBody>
                </Table>
            )}

            <TablePaginationControls
                className="glass-panel p-2 rounded-xl border-glass bg-surface/50"
                page={page} pageSize={pageSize} totalItems={filteredCampaigns.length}
                onPageChange={setPage} onPageSizeChange={setPageSize}
            />
        </div>
    );
}
