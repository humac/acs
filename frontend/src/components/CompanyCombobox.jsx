import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Loader2, Check, ChevronsUpDown, Building2 } from 'lucide-react';

/**
 * CompanyCombobox - A searchable single-select combobox for companies
 * Uses server-side search with debouncing for optimal performance
 * 
 * @param {Object} props
 * @param {number|null} props.value - Selected company ID
 * @param {function} props.onChange - Callback when selection changes (receives { id, name })
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {string} props.className - Additional CSS classes
 */
export default function CompanyCombobox({
    value,
    onChange,
    placeholder = 'Search companies...',
    disabled = false,
    className = ''
}) {
    const { getAuthHeaders } = useAuth();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const debounceRef = useRef(null);
    const searchInputRef = useRef(null);

    // Fetch company by ID when value changes (for initial load)
    useEffect(() => {
        if (value && !selectedCompany) {
            fetchCompanyById(value);
        } else if (value && selectedCompany && selectedCompany.id !== value) {
            fetchCompanyById(value);
        } else if (!value) {
            setSelectedCompany(null);
            setQuery('');
        }
    }, [value]);

    // Focus search input when popover opens
    useEffect(() => {
        if (open && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 0);
        }
    }, [open]);

    const fetchCompanyById = async (id) => {
        try {
            const res = await fetch(`/api/companies/${id}`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const company = await res.json();
                setSelectedCompany({ id: company.id, name: company.name });
            }
        } catch (err) {
            console.error('Error fetching company:', err);
        }
    };

    const searchCompanies = useCallback(async (searchQuery) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ q: searchQuery, limit: '20' });
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

        if (open) {
            debounceRef.current = setTimeout(() => {
                searchCompanies(query);
            }, 300);
        }

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, open, searchCompanies]);

    const handleSelect = (company) => {
        setSelectedCompany(company);
        setQuery('');
        setOpen(false);
        onChange?.(company);
    };

    const handleInputChange = (e) => {
        setQuery(e.target.value);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild disabled={disabled}>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'w-full justify-between h-11 px-3 font-normal',
                        !selectedCompany && 'text-muted-foreground',
                        className
                    )}
                    disabled={disabled}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">
                            {selectedCompany ? selectedCompany.name : placeholder}
                        </span>
                    </div>
                    {loading ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
                sideOffset={4}
            >
                <div className="p-2 border-b border-white/10">
                    <Input
                        ref={searchInputRef}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        placeholder="Type to search..."
                        className="h-9"
                    />
                </div>
                <div
                    className="max-h-60 overflow-y-auto"
                    style={{ overscrollBehavior: 'contain' }}
                    onWheel={(e) => e.stopPropagation()}
                >
                    {loading ? (
                        <div className="flex items-center justify-center py-6 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            <span className="text-sm">Searching...</span>
                        </div>
                    ) : companies.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            {query ? 'No companies found' : 'Type to search companies'}
                        </div>
                    ) : (
                        <div className="py-1">
                            {companies.map((company) => (
                                <div
                                    key={company.id}
                                    className={cn(
                                        'flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors',
                                        'hover:bg-muted/50',
                                        selectedCompany?.id === company.id && 'bg-primary/10'
                                    )}
                                    onClick={() => handleSelect(company)}
                                >
                                    <Check
                                        className={cn(
                                            'h-4 w-4 shrink-0',
                                            selectedCompany?.id === company.id ? 'opacity-100 text-primary' : 'opacity-0'
                                        )}
                                    />
                                    <span className="text-sm truncate">{company.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
