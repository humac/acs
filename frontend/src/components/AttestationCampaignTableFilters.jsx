import { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function AttestationCampaignTableFilters({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    onClearFilters,
}) {
    const [filtersExpanded, setFiltersExpanded] = useState(false);

    // Count active filters (excluding search)
    const activeFilterCount = [
        statusFilter !== 'all',
    ].filter(Boolean).length;

    const hasActiveFilters = activeFilterCount > 0 || searchTerm !== '';

    const handleClearFilters = () => {
        onClearFilters();
        setFiltersExpanded(false);
    };

    return (
        <div className="space-y-3">
            {/* Search Bar and Filter Toggle */}
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                        placeholder="Search by campaign name..."
                        className="pl-9 bg-surface/50 border-white/10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setFiltersExpanded(!filtersExpanded)}
                        className={cn(
                            "gap-2 btn-interactive",
                            activeFilterCount > 0 && "border-primary/50"
                        )}
                    >
                        <Filter className="h-4 w-4" />
                        <span className="hidden sm:inline">Filters</span>
                        {activeFilterCount > 0 && (
                            <Badge className="glow-primary h-5 px-1.5 text-xs">
                                {activeFilterCount}
                            </Badge>
                        )}
                        {filtersExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClearFilters}
                            className="text-muted-foreground hover:text-foreground btn-interactive"
                            title="Clear all filters"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Collapsible Filter Panel */}
            <div
                className={cn(
                    "grid gap-3 overflow-hidden transition-all duration-200",
                    filtersExpanded
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                )}
            >
                <div className="min-h-0">
                    <div className="glass-panel rounded-xl p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Status Filter */}
                            <div className="space-y-1.5">
                                <label className="caption-label">Status</label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
