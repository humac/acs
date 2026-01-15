import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Loader2, X, Search, Building2 } from 'lucide-react';

/**
 * CompanyMultiSelect - A searchable multi-select component for companies
 * Uses server-side search with debouncing for optimal performance
 * 
 * @param {Object} props
 * @param {number[]} props.value - Array of selected company IDs
 * @param {function} props.onChange - Callback when selection changes (receives array of IDs)
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {string} props.className - Additional CSS classes
 */
export default function CompanyMultiSelect({
    value = [],
    onChange,
    placeholder = 'Search companies...',
    disabled = false,
    className = ''
}) {
    const { getAuthHeaders } = useAuth();
    const [query, setQuery] = useState('');
    const [companies, setCompanies] = useState([]);
    const [selectedCompanies, setSelectedCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [_isFocused, setIsFocused] = useState(false);
    const debounceRef = useRef(null);

    // Load selected companies on mount or when value changes
    useEffect(() => {
        if (value.length > 0 && selectedCompanies.length === 0) {
            loadSelectedCompanies();
        } else if (value.length === 0) {
            setSelectedCompanies([]);
        }
    }, [value]);

    const loadSelectedCompanies = async () => {
        // Only load companies that aren't already in selectedCompanies
        const missingIds = value.filter(id => !selectedCompanies.find(c => c.id === id));
        if (missingIds.length === 0) return;

        try {
            // Fetch companies one by one (or use a batch endpoint if available)
            const fetched = [];
            for (const id of missingIds) {
                const res = await fetch(`/api/companies/${id}`, {
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    const company = await res.json();
                    fetched.push({ id: company.id, name: company.name });
                }
            }
            setSelectedCompanies(prev => {
                const existing = prev.filter(c => value.includes(c.id));
                return [...existing, ...fetched];
            });
        } catch (err) {
            console.error('Error loading selected companies:', err);
        }
    };

    const searchCompanies = useCallback(async (searchQuery) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ q: searchQuery, limit: '30' });
            const res = await fetch(`/api/companies/search?${params}`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setCompanies(data);
            }
        } catch (err) {
            console.error('Error searching companies:', err);
        } finally {
            setLoading(false);
        }
    }, [getAuthHeaders]);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            searchCompanies(query);
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, searchCompanies]);

    // Initial load
    useEffect(() => {
        searchCompanies('');
    }, []);

    const handleToggle = (company) => {
        const isSelected = value.includes(company.id);
        let newValue;
        let newSelectedCompanies;

        if (isSelected) {
            newValue = value.filter(id => id !== company.id);
            newSelectedCompanies = selectedCompanies.filter(c => c.id !== company.id);
        } else {
            newValue = [...value, company.id];
            newSelectedCompanies = [...selectedCompanies, company];
        }

        setSelectedCompanies(newSelectedCompanies);
        onChange?.(newValue);
    };

    const handleRemove = (companyId) => {
        const newValue = value.filter(id => id !== companyId);
        setSelectedCompanies(prev => prev.filter(c => c.id !== companyId));
        onChange?.(newValue);
    };

    return (
        <div className={cn('space-y-3', className)}>
            {/* Search Input */}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Search className="h-4 w-4" />
                </div>
                <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="pl-9"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                )}
            </div>

            {/* Selected Companies Badges */}
            {selectedCompanies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedCompanies.map((company) => (
                        <Badge
                            key={company.id}
                            variant="secondary"
                            className="flex items-center gap-1 px-2 py-1"
                        >
                            <Building2 className="h-3 w-3" />
                            <span className="max-w-32 truncate">{company.name}</span>
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => handleRemove(company.id)}
                                    className="ml-1 hover:text-destructive transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Company List */}
            {loading && companies.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading companies...
                </div>
            ) : companies.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                    {query ? 'No companies found' : 'No companies available'}
                </div>
            ) : (
                <div
                    className="border rounded-lg max-h-64 overflow-y-auto"
                    style={{ overscrollBehavior: 'contain' }}
                    onWheel={(e) => e.stopPropagation()}
                >
                    <div className="p-2 space-y-1">
                        {companies.map((company) => {
                            const isSelected = value.includes(company.id);
                            return (
                                <div
                                    key={company.id}
                                    className={cn(
                                        'flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors',
                                        'hover:bg-muted/50',
                                        isSelected && 'bg-primary/10'
                                    )}
                                    onClick={() => !disabled && handleToggle(company)}
                                >
                                    <Checkbox
                                        checked={isSelected}
                                        disabled={disabled}
                                        readOnly
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{company.name}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Selection Count */}
            {value.length > 0 && (
                <div className="text-sm text-muted-foreground">
                    Selected: {value.length} compan{value.length !== 1 ? 'ies' : 'y'}
                </div>
            )}
        </div>
    );
}
