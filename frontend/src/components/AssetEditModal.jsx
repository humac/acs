import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ASSET_STATUS_OPTIONS } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AssetEditModal({ asset, currentUser: _currentUser, onClose, onSaved }) {
  const { getAuthHeaders, user } = useAuth();
  const { toast } = useToast();

  // Determine user permissions
  const isAdmin = user?.role === 'admin';

  // Initialize form with asset data
  const [form, setForm] = useState({
    employee_first_name: asset.employee_first_name || '',
    employee_last_name: asset.employee_last_name || '',
    employee_email: asset.employee_email || '',
    manager_first_name: asset.manager_first_name || '',
    manager_last_name: asset.manager_last_name || '',
    manager_email: asset.manager_email || '',
    company_name: asset.company_name || '',
    asset_type: asset.asset_type || 'laptop',
    make: asset.make || '',
    model: asset.model || '',
    serial_number: asset.serial_number || '',
    asset_tag: asset.asset_tag || '',
    status: asset.status || 'active',
    issued_date: asset.issued_date || '',
    returned_date: asset.returned_date || '',
    notes: asset.notes || '',
  });

  const [saving, setSaving] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [assetTypes, setAssetTypes] = useState([]);
  const [loadingAssetTypes, setLoadingAssetTypes] = useState(true);

  // Fetch companies and asset types on mount
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const response = await fetch('/api/companies/names', {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoadingCompanies(false);
      }
    }

    async function fetchAssetTypes() {
      try {
        const response = await fetch('/api/asset-types', {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          setAssetTypes(data);
        }
      } catch (error) {
        console.error('Error fetching asset types:', error);
      } finally {
        setLoadingAssetTypes(false);
      }
    }

    fetchCompanies();
    fetchAssetTypes();
  }, [getAuthHeaders]);

  // Field max length configuration
  const MAX_LENGTHS = {
    employee_first_name: 100,
    employee_last_name: 100,
    manager_first_name: 100,
    manager_last_name: 100,
    company_name: 255,
    make: 100,
    model: 100,
    serial_number: 100,
    asset_tag: 100,
    notes: 1000,
  };

  function onChange(e) {
    const { name, value } = e.target;

    // Apply max length constraints
    const maxLength = MAX_LENGTHS[name];
    const finalValue = maxLength && value.length > maxLength ? value.slice(0, maxLength) : value;

    setForm(prev => ({ ...prev, [name]: finalValue }));

    // Validate email on change
    if (name === 'employee_email') {
      if (finalValue && !EMAIL_REGEX.test(finalValue)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
    }
  }

  async function save(e) {
    e.preventDefault();

    // Validate email before saving
    if (form.employee_email && !EMAIL_REGEX.test(form.employee_email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Validate required fields
    if (!form.employee_first_name || !form.employee_last_name || !form.employee_email || !form.company_name ||
        !form.asset_type || !form.serial_number) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...asset, // Include all existing fields
        employee_first_name: form.employee_first_name,
        employee_last_name: form.employee_last_name,
        employee_email: form.employee_email,
        manager_first_name: form.manager_first_name || null,
        manager_last_name: form.manager_last_name || null,
        manager_email: form.manager_email || null,
        company_name: form.company_name,
        asset_type: form.asset_type,
        make: form.make,
        model: form.model,
        serial_number: form.serial_number,
        asset_tag: form.asset_tag.trim() || null,
        status: form.status,
        issued_date: form.issued_date || null,
        returned_date: form.status === 'returned' ? form.returned_date : null,
        notes: form.notes,
      };

      const res = await fetch(`/api/assets/${asset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Save failed');
      }

      const updated = await res.json();
      toast({
        title: "Success",
        description: "Asset updated successfully",
        variant: "success",
      });

      // The API returns { message, asset }, extract the asset
      onSaved(updated.asset || updated);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || 'Unable to save asset.',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  // Determine if fields are editable based on role
  // Employees (non-admins) who own the asset cannot edit employee or manager fields
  const canEditEmployeeFields = isAdmin;
  const canEditManagerFields = isAdmin;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="glass-overlay max-w-[95vw] sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl">Edit Asset</DialogTitle>
          <DialogDescription className="text-sm">
            {isAdmin
              ? 'Update all asset details. Fields marked with * are required.'
              : 'Update asset details. Some fields are read-only based on your permissions.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={save} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto px-4 sm:px-6 space-y-4 flex-1">
            {/* Read-only dates section */}
            <div className="glass-panel rounded-xl p-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="caption-label">Created</span>
                  <div className="font-medium mt-1">{formatDate(asset.registration_date || asset.created_at)}</div>
                </div>
                <div>
                  <span className="caption-label">Last Modified</span>
                  <div className="font-medium mt-1">{formatDate(asset.last_updated || asset.updated_at)}</div>
                </div>
              </div>
            </div>

            {/* Employee Information */}
            <div className="glass-panel rounded-xl p-4 space-y-3">
              <h4 className="caption-label">
                Employee Information
                {!canEditEmployeeFields && (
                  <span className="text-xs font-normal ml-2">(Read-only)</span>
                )}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="employee_first_name">First Name *</Label>
                  <Input
                    id="employee_first_name"
                    name="employee_first_name"
                    value={form.employee_first_name}
                    onChange={onChange}
                    maxLength={100}
                    required
                    readOnly={!canEditEmployeeFields}
                    disabled={!canEditEmployeeFields}
                    className={cn('text-base', !canEditEmployeeFields && 'bg-muted cursor-not-allowed')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee_last_name">Last Name *</Label>
                  <Input
                    id="employee_last_name"
                    name="employee_last_name"
                    value={form.employee_last_name}
                    onChange={onChange}
                    maxLength={100}
                    required
                    readOnly={!canEditEmployeeFields}
                    disabled={!canEditEmployeeFields}
                    className={cn('text-base', !canEditEmployeeFields && 'bg-muted cursor-not-allowed')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee_email">Employee Email *</Label>
                <Input
                  id="employee_email"
                  name="employee_email"
                  type="email"
                  value={form.employee_email}
                  onChange={onChange}
                  required
                  readOnly={!canEditEmployeeFields}
                  disabled={!canEditEmployeeFields}
                  className={cn(
                    'text-base',
                    emailError && 'border-destructive',
                    !canEditEmployeeFields && 'bg-muted cursor-not-allowed'
                  )}
                />
                {emailError && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{emailError}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">Company *</Label>
                {loadingCompanies ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading companies...
                  </div>
                ) : companies.length > 0 ? (
                  <Select
                    value={form.company_name}
                    onValueChange={(value) => setForm(prev => ({ ...prev, company_name: value }))}
                    disabled={!isAdmin}
                  >
                    <SelectTrigger
                      id="company_name"
                      className={!isAdmin ? 'bg-muted cursor-not-allowed' : ''}
                    >
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.name}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={form.company_name}
                    readOnly
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                )}
              </div>
            </div>

            {/* Manager Information */}
            <div className="glass-panel rounded-xl p-4 space-y-3">
              <h4 className="caption-label">
                Manager Information
                {!canEditManagerFields && (
                  <span className="text-xs font-normal ml-2">(Read-only)</span>
                )}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="manager_first_name">Manager First Name</Label>
                  <Input
                    id="manager_first_name"
                    name="manager_first_name"
                    value={form.manager_first_name}
                    onChange={onChange}
                    maxLength={100}
                    readOnly={!canEditManagerFields}
                    disabled={!canEditManagerFields}
                    className={cn('text-base', !canEditManagerFields && 'bg-muted cursor-not-allowed')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager_last_name">Manager Last Name</Label>
                  <Input
                    id="manager_last_name"
                    name="manager_last_name"
                    value={form.manager_last_name}
                    onChange={onChange}
                    maxLength={100}
                    readOnly={!canEditManagerFields}
                    disabled={!canEditManagerFields}
                    className={cn('text-base', !canEditManagerFields && 'bg-muted cursor-not-allowed')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manager_email">Manager Email</Label>
                <Input
                  id="manager_email"
                  name="manager_email"
                  type="email"
                  value={form.manager_email}
                  onChange={onChange}
                  readOnly={!canEditManagerFields}
                  disabled={!canEditManagerFields}
                  className={cn('text-base', !canEditManagerFields && 'bg-muted cursor-not-allowed')}
                />
              </div>
            </div>

            {/* Asset Information */}
            <div className="glass-panel rounded-xl p-4 space-y-3">
              <h4 className="caption-label">Asset Information</h4>

              <div className="space-y-2">
                <Label htmlFor="asset_type">Asset Type *</Label>
                {loadingAssetTypes ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading asset types...
                  </div>
                ) : assetTypes.length > 0 ? (
                  <Select
                    value={form.asset_type}
                    onValueChange={(value) => setForm(prev => ({ ...prev, asset_type: value }))}
                  >
                    <SelectTrigger id="asset_type">
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                    <SelectContent>
                      {assetTypes.map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={form.asset_type} readOnly className="bg-muted" />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    name="make"
                    value={form.make}
                    onChange={onChange}
                    maxLength={100}
                    placeholder="Dell, Apple, Samsung"
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    name="model"
                    value={form.model}
                    onChange={onChange}
                    maxLength={100}
                    placeholder="XPS 15, iPhone 15"
                    className="text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serial_number">Serial Number *</Label>
                <Input
                  id="serial_number"
                  name="serial_number"
                  value={form.serial_number}
                  onChange={onChange}
                  maxLength={100}
                  required
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset_tag">Asset Tag (Optional)</Label>
                <Input
                  id="asset_tag"
                  name="asset_tag"
                  value={form.asset_tag}
                  onChange={onChange}
                  maxLength={100}
                  placeholder="Leave blank if unknown"
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm(prev => ({
                    ...prev,
                    status: value,
                    returned_date: value !== 'returned' ? '' : prev.returned_date
                  }))}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="issued_date">Issued Date</Label>
                  <Input
                    id="issued_date"
                    name="issued_date"
                    type="date"
                    value={form.issued_date}
                    onChange={onChange}
                    className="text-base"
                  />
                </div>

                {form.status === 'returned' && (
                  <div className="space-y-2">
                    <Label htmlFor="returned_date">Returned Date (Optional)</Label>
                    <Input
                      id="returned_date"
                      name="returned_date"
                      type="date"
                      value={form.returned_date}
                      onChange={onChange}
                      className="text-base"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={onChange}
                  rows={3}
                  maxLength={1000}
                  placeholder="Add any additional notes..."
                />
                <div className="text-xs text-muted-foreground text-right">
                  {form.notes.length}/1000
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t mt-auto flex-col-reverse sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="w-full sm:w-auto btn-interactive">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !!emailError}
              className="w-full sm:w-auto btn-interactive"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
