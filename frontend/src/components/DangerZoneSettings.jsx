/**
 * Danger Zone Settings Component
 * 
 * Provides destructive operations for bulk data deletion:
 * - Delete all companies (and assets)
 * - Delete all assets
 * - Delete all attestation data
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2, Building2, Laptop, ClipboardCheck, Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Configuration for each danger operation
const DANGER_OPERATIONS = [
    {
        type: 'companies',
        title: 'Delete All Companies',
        description: 'Remove all companies from the system',
        icon: Building2,
        countKey: 'companies',
        countLabel: 'Companies',
        confirmPhrase: 'DELETE ALL COMPANIES',
        endpoint: 'companies',
        extraWarning: 'This will also delete all assets as they reference companies.'
    },
    {
        type: 'assets',
        title: 'Delete All Assets',
        description: 'Remove all registered assets from the system',
        icon: Laptop,
        countKey: 'assets',
        countLabel: 'Assets',
        confirmPhrase: 'DELETE ALL ASSETS',
        endpoint: 'assets',
        extraWarning: null
    },
    {
        type: 'attestations',
        title: 'Delete All Attestations',
        description: 'Remove all attestation campaigns, records, and pending invites',
        icon: ClipboardCheck,
        countKey: 'campaigns',
        countLabel: 'Campaigns',
        confirmPhrase: 'DELETE ALL ATTESTATIONS',
        endpoint: 'attestations',
        extraWarning: null // Will be set dynamically
    }
];

const DangerZoneSettings = () => {
    const { token } = useAuth();
    const { toast } = useToast();

    const [counts, setCounts] = useState({
        companies: 0,
        assets: 0,
        campaigns: 0,
        records: 0,
        invites: 0
    });
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [confirmationText, setConfirmationText] = useState('');
    const [activeDialog, setActiveDialog] = useState(null);

    // Fetch counts on mount
    useEffect(() => {
        fetchCounts();
    }, []);

    const fetchCounts = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/admin/danger-zone/counts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCounts(data);
            }
        } catch (error) {
            console.error('Failed to fetch counts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (operation) => {
        setActiveDialog(operation);
        setConfirmationText('');
    };

    const handleCloseDialog = () => {
        setActiveDialog(null);
        setConfirmationText('');
    };

    const handleDelete = async () => {
        if (!activeDialog) return;

        if (confirmationText !== activeDialog.confirmPhrase) {
            toast({
                title: 'Invalid confirmation',
                description: `Please type "${activeDialog.confirmPhrase}" exactly to confirm.`,
                variant: 'destructive'
            });
            return;
        }

        setDeleting(activeDialog.type);
        try {
            const response = await fetch(`${API_BASE}/api/admin/danger-zone/${activeDialog.endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ confirmation: activeDialog.confirmPhrase })
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: data.message,
                });
                fetchCounts();
                handleCloseDialog();
            } else {
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to delete data',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete data. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setDeleting(null);
        }
    };

    const getExtraWarning = (operation) => {
        if (operation.type === 'attestations') {
            return `This will also delete ${counts.records.toLocaleString()} records and ${counts.invites.toLocaleString()} pending invites.`;
        }
        return operation.extraWarning;
    };

    return (
        <div className="space-y-6">
            {/* Warning Banner */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-semibold text-destructive">Danger Zone</h3>
                    <p className="text-sm text-destructive/80">
                        The actions on this page are destructive and cannot be undone.
                        Please proceed with extreme caution.
                    </p>
                </div>
            </div>

            {/* Danger Cards */}
            <div className="grid gap-6">
                {DANGER_OPERATIONS.map((op) => {
                    const Icon = op.icon;
                    const count = counts[op.countKey];
                    const extraWarning = getExtraWarning(op);

                    return (
                        <Card key={op.type} className="border-destructive/30 bg-destructive/5">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-destructive/10">
                                        <Icon className="h-5 w-5 text-destructive" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{op.title}</CardTitle>
                                        <CardDescription className="text-destructive/70">{op.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-destructive/20">
                                    <span className="text-sm text-muted-foreground">{op.countLabel}</span>
                                    <span className="text-2xl font-bold text-destructive">
                                        {loading ? '...' : count.toLocaleString()}
                                    </span>
                                </div>

                                {extraWarning && (
                                    <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                                        <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                                        <p className="text-xs text-warning">{extraWarning}</p>
                                    </div>
                                )}

                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    disabled={count === 0}
                                    onClick={() => handleOpenDialog(op)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete All {op.title.replace('Delete All ', '')}
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Single Shared Dialog */}
            <AlertDialog open={!!activeDialog} onOpenChange={(open) => !open && handleCloseDialog()}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Destructive Action
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-4">
                                <p>
                                    You are about to permanently delete{' '}
                                    <strong>{activeDialog ? counts[activeDialog.countKey].toLocaleString() : 0}</strong>{' '}
                                    {activeDialog?.countLabel.toLowerCase()}.
                                </p>
                                <p className="text-destructive font-medium">
                                    This action cannot be undone.
                                </p>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmation-input">
                                        Type{' '}
                                        <code className="px-1.5 py-0.5 rounded bg-muted text-destructive font-mono text-sm">
                                            {activeDialog?.confirmPhrase}
                                        </code>{' '}
                                        to confirm:
                                    </Label>
                                    <Input
                                        id="confirmation-input"
                                        value={confirmationText}
                                        onChange={(e) => setConfirmationText(e.target.value)}
                                        placeholder={activeDialog?.confirmPhrase}
                                        className="font-mono"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCloseDialog}>
                            Cancel
                        </AlertDialogCancel>
                        <Button
                            variant="destructive"
                            disabled={confirmationText !== activeDialog?.confirmPhrase || deleting === activeDialog?.type}
                            onClick={handleDelete}
                        >
                            {deleting === activeDialog?.type ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Permanently
                                </>
                            )}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default DangerZoneSettings;
