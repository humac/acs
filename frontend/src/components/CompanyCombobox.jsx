import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
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
    const inputRef = useRef(null);

    // Fetch company by ID when value changes (for initial load)
    useEffect(() => {
        if (value && !selectedCompany) {
            fetchCompanyById(value);
        } else if (!value) {
            setSelectedCompany(null);
            setQuery('');
        }
    }, [value]);

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
        if (!open) {
            setOpen(true);
        }
    };

    const handleClear = () => {
        setSelectedCompany(null);
        setQuery('');
        onChange?.(null);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild disabled={disabled}>
                <div className={cn('relative w-full', className)}>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                    </div>
                    <Input
                        ref={inputRef}
                        type="text"
                        value={selectedCompany ? selectedCompany.name : query}
                        onChange={handleInputChange}
                        onFocus={() => !disabled && setOpen(true)}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={cn(
                            'pl-9 pr-8 cursor-pointer',
                            selectedCompany && 'text-foreground'
                        )}
                        readOnly={!!selectedCompany}
                        onClick={() => {
                            if (selectedCompany && !disabled) {
                                handleClear();
                            }
                        }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ChevronsUpDown className="h-4 w-4" />
                        )}
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
                sideOffset={4}
            >
                {!selectedCompany && (
                    <div className="p-2 border-b border-white/10">
                        <Input
                            type="text"
                            value={query}
                            onChange={handleInputChange}
                            placeholder="Type to search..."
                            className="h-9"
                            autoFocus
                        />
                    </div>
                )}
                <div className="max-h-60 overflow-y-auto">
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
