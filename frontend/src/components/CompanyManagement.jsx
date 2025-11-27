import { useState, useEffect } from 'react';

const CompanyManagement = () => {
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

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/companies');
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

  const handleDelete = async (company) => {
    if (!window.confirm(`Are you sure you want to delete "${company.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete company');
      }

      fetchCompanies();
    } catch (err) {
      alert(err.message);
    }
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
      <div className="card">
        <h2>Company Management</h2>
        <div className="loading">Loading companies...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Company Management ({companies.length} companies)</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
            style={{ width: 'auto', padding: '10px 20px' }}
          >
            + Add Company
          </button>
        )}
      </div>

      {formSuccess && (
        <div className="alert alert-success">
          Company {editingCompany ? 'updated' : 'added'} successfully!
        </div>
      )}

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {showForm && (
        <div style={{ marginBottom: '30px', padding: '20px', background: '#f7fafc', borderRadius: '8px' }}>
          <h3>{editingCompany ? 'Edit Company' : 'Add New Company'}</h3>

          {formError && (
            <div className="alert alert-error" style={{ marginTop: '15px' }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Company Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Acme Corporation"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the company..."
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">
                {editingCompany ? 'Update Company' : 'Add Company'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {companies.length === 0 ? (
        <div className="empty-state">
          <p>No companies registered yet. Add your first company to get started.</p>
        </div>
      ) : (
        <div className="asset-table">
          <table>
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Description</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td><strong>{company.name}</strong></td>
                  <td>{company.description || '-'}</td>
                  <td>{formatDate(company.created_date)}</td>
                  <td>
                    <div className="actions">
                      <button
                        onClick={() => handleEdit(company)}
                        className="btn btn-secondary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(company)}
                        className="btn btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CompanyManagement;
