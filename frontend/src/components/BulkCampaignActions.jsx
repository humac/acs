import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Sparkles } from 'lucide-react';

export default function BulkCampaignActions({
    selectedIds,
    filteredCampaigns,
    allCampaigns,
    hasActiveFilters,
    onClearSelection,
    onBulkDelete,
    currentUser,
}) {
    const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const selectedCount = selectedIds.size;
    const isAdmin = currentUser?.role === 'admin';
    const totalCount = allCampaigns?.length || 0;
    const filteredCount = filteredCampaigns?.length || 0;

    // Ideally export should be handled via backend, but providing a placeholder or basic client-side export
    const handleExportSelected = () => {
        // Placeholder for export functionality
        // This would match the logic in AssetBulkActions if we were exporting data
        console.log('Exporting select', selectedIds);
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            if (onBulkDelete) {
                await onBulkDelete();
            }
            setBulkDeleteDialog(false);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            {/* Results Count and Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                {/* Left side: Results count */}
                <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                        {hasActiveFilters ? (
                            <>
                                <span className="font-medium text-foreground">{filteredCount}</span>
                                {' '}of {totalCount} campaigns
                            </>
                        ) : (
                            <>
                                <span className="font-medium text-foreground">{totalCount}</span>
                                {' '}campaign{totalCount === 1 ? '' : 's'}
                            </>
                        )}
                    </span>
                </div>

                {/* Right side: Selection actions */}
                {selectedCount > 0 && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 rounded-lg border px-3 py-2 bg-muted/50">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">{selectedCount} selected</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setBulkDeleteDialog(true)}
                                    disabled={isDeleting}
                                >
                                    Delete
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClearSelection}
                            >
                                Clear
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
                <DialogContent className="glass-overlay">
                    <DialogHeader>
                        <DialogTitle>Confirm Bulk Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedCount} campaign{selectedCount !== 1 ? 's' : ''}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setBulkDeleteDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
