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
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const API_BASE = import.meta.env.VITE_API_URL || '';

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
    const [dialogOpen, setDialogOpen] = useState(null);

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

    const handleDelete = async (type, confirmPhrase, endpoint) => {
        if (confirmationText !== confirmPhrase) {
            toast({
                title: 'Invalid confirmation',
                description: `Please type "${confirmPhrase}" exactly to confirm.`,
                variant: 'destructive'
            });
            return;
        }

        setDeleting(type);
        try {
            const response = await fetch(`${API_BASE}/api/admin/danger-zone/${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ confirmation: confirmPhrase })
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: data.message,
                });
                fetchCounts();
                setDialogOpen(null);
                setConfirmationText('');
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

    const DangerCard = ({
        title,
        description,
        icon: Icon,
        count,
        countLabel,
        type,
        confirmPhrase,
        endpoint,
        extraWarning
    }) => (
        <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                        <Icon className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription className="text-destructive/70">{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-destructive/20">
                    <span className="text-sm text-muted-foreground">{countLabel}</span>
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

                <AlertDialog
                    open={dialogOpen === type}
                    onOpenChange={(open) => {
                        setDialogOpen(open ? type : null);
                        if (!open) setConfirmationText('');
                    }}
                >
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="destructive"
                            className="w-full"
                            disabled={count === 0}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete All {title.replace('Delete All ', '')}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-5 w-5" />
                                Confirm Destructive Action
                            </AlertDialogTitle>
                            <AlertDialogDescription className="space-y-4">
                                <p>
                                    You are about to permanently delete <strong>{count.toLocaleString()}</strong> {countLabel.toLowerCase()}.
                                </p>
                                <p className="text-destructive font-medium">
                                    This action cannot be undone.
                                </p>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmation">
                                        Type <code className="px-1.5 py-0.5 rounded bg-muted text-destructive font-mono text-sm">{confirmPhrase}</code> to confirm:
                                    </Label>
                                    <Input
                                        id="confirmation"
                                        value={confirmationText}
                                        onChange={(e) => setConfirmationText(e.target.value)}
                                        placeholder={confirmPhrase}
                                        className="font-mono"
                                    />
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setConfirmationText('')}>
                                Cancel
                            </AlertDialogCancel>
                            <Button
                                variant="destructive"
                                disabled={confirmationText !== confirmPhrase || deleting === type}
                                onClick={() => handleDelete(type, confirmPhrase, endpoint)}
                            >
                                {deleting === type ? (
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
            </CardContent>
        </Card>
    );

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
                <DangerCard
                    title="Delete All Companies"
                    description="Remove all companies from the system"
                    icon={Building2}
                    count={counts.companies}
                    countLabel="Companies"
                    type="companies"
                    confirmPhrase="DELETE ALL COMPANIES"
                    endpoint="companies"
                    extraWarning="This will also delete all assets as they reference companies."
                />

                <DangerCard
                    title="Delete All Assets"
                    description="Remove all registered assets from the system"
                    icon={Laptop}
                    count={counts.assets}
                    countLabel="Assets"
                    type="assets"
                    confirmPhrase="DELETE ALL ASSETS"
                    endpoint="assets"
                />

                <DangerCard
                    title="Delete All Attestations"
                    description="Remove all attestation campaigns, records, and pending invites"
                    icon={ClipboardCheck}
                    count={counts.campaigns}
                    countLabel="Campaigns"
                    type="attestations"
                    confirmPhrase="DELETE ALL ATTESTATIONS"
                    endpoint="attestations"
                    extraWarning={`This will also delete ${counts.records.toLocaleString()} records and ${counts.invites.toLocaleString()} pending invites.`}
                />
            </div>
        </div>
    );
};

export default DangerZoneSettings;
