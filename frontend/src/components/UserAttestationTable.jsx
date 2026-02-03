import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { SearchX } from 'lucide-react';
import UserAttestationTableRow from './UserAttestationTableRow';
import UserAttestationTableFilters from './UserAttestationTableFilters';

export default function UserAttestationTable({ attestations = [], onStartAttestation }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredAttestations = attestations.filter(attestation => {
        const matchesSearch = !searchTerm ||
            attestation.campaign?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || attestation.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-4">
            <UserAttestationTableFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                onClearFilters={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                }}
            />

            {filteredAttestations.length === 0 ? (
                <div className="glass-panel rounded-2xl flex flex-col items-center justify-center py-20 text-muted-foreground animate-fade-in">
                    <SearchX className="h-12 w-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No campaigns found matching your criteria</p>
                </div>
            ) : (
                <div className="glass-panel rounded-2xl overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                        <Table className="min-w-[800px]">
                            <TableHeader className="bg-muted/50 dark:bg-muted/20 border-b border-border dark:border-white/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-10"></TableHead>
                                    <TableHead className="caption-label">Campaign</TableHead>
                                    <TableHead className="caption-label">Start Date</TableHead>
                                    <TableHead className="caption-label">End Date</TableHead>
                                    <TableHead className="caption-label w-[180px]">Progress</TableHead>
                                    <TableHead className="text-right pr-4 caption-label">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAttestations.map((attestation, index) => (
                                    <UserAttestationTableRow
                                        key={attestation.id}
                                        attestation={attestation}
                                        onStartAttestation={onStartAttestation}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    );
}
