import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function UserAttestationTableFilters({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    onClearFilters,
}) {
    const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all';

    return (
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface/30 p-4 rounded-xl border border-white/5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-surface/40 mb-6">
            <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
                {/* Search */}
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                    <Input
                        placeholder="Search campaigns..."
                        className="pl-9 bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 rounded-lg hover:bg-white/10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Status Filter */}
                <div className="w-full sm:w-[180px]">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="bg-white/5 border-white/10 hover:bg-white/10 focus:ring-primary/20 transition-all duration-300 rounded-lg">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors duration-200 shrink-0"
                >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                </Button>
            )}
        </div>
    );
}
