import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Business,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const CompanyManagement = () => {
  const { getAuthHeaders } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, company: null });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/companies', {
        headers: {
          ...getAuthHeaders()
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      const data = await response.json();
      setCompanies(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    try {
      const url = editingCompany
        ? `/api/companies/${editingCompany.id}`
        : '/api/companies';

      const method = editingCompany ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save company');
      }

      setFormSuccess(true);
      setFormData({ name: '', description: '' });
      setShowForm(false);
      setEditingCompany(null);
      fetchCompanies();

      setTimeout(() => setFormSuccess(false), 3000);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      description: company.description || ''
    });
    setShowForm(true);
    setFormError(null);
  };

  const handleDeleteClick = (company) => {
    setDeleteDialog({ open: true, company });
  };

  const handleDeleteConfirm = async () => {
    const company = deleteDialog.company;
    setDeleteDialog({ open: false, company: null });

    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders()
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete company');
      }

      fetchCompanies();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, company: null });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCompany(null);
    setFormData({ name: '', description: '' });
    setFormError(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card sx={{ p: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" py={5}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading companies...
          </Typography>
        </Box>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business color="primary" />
            <Typography variant="h5" fontWeight={600}>
              Company Management ({companies.length} companies)
            </Typography>
          </Box>
          {!showForm && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowForm(true)}
            >
              Add Company
            </Button>
          )}
        </Box>

        {/* Success Message */}
        {formSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Company {editingCompany ? 'updated' : 'added'} successfully!
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}

        {/* Form */}
        {showForm && (
          <Box sx={{ mb: 4, p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              {editingCompany ? 'Edit Company' : 'Add New Company'}
            </Typography>

            {formError && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {formError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    id="name"
                    name="name"
                    label="Company Name"
                    placeholder="Acme Corporation"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    id="description"
                    name="description"
                    label="Description (Optional)"
                    placeholder="Brief description of the company..."
                    value={formData.description}
                    onChange={handleChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button type="submit" variant="contained">
                      {editingCompany ? 'Update Company' : 'Add Company'}
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}

        {/* Companies Table */}
        {companies.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Business sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No companies registered yet. Add your first company to get started.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: '100%' }}>
            <Table size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Company Name</strong></TableCell>
                  {!isMobile && <TableCell><strong>Description</strong></TableCell>}
                  {!isMobile && <TableCell><strong>Created Date</strong></TableCell>}
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight={600}>
                        {company.name}
                      </Typography>
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {company.description || '-'}
                        </Typography>
                      </TableCell>
                    )}
                    {!isMobile && <TableCell>{formatDate(company.created_date)}</TableCell>}
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEdit(company)}
                          title="Edit"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(company)}
                          title="Delete"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.company?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CompanyManagement;
