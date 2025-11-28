import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AssetRegistrationForm = ({ onAssetRegistered }) => {
  const { getAuthHeaders } = useAuth();
  const [formData, setFormData] = useState({
    employee_name: '',
    employee_email: '',
    manager_name: '',
    manager_email: '',
    client_name: '',
    laptop_serial_number: '',
    laptop_asset_tag: '',
    notes: ''
  });

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies/names', {
        headers: {
          ...getAuthHeaders()
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error('Error fetching companies:', err);
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
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register asset');
      }

      setSuccess(true);
      setFormData({
        employee_name: '',
        employee_email: '',
        manager_name: '',
        manager_email: '',
        client_name: '',
        laptop_serial_number: '',
        laptop_asset_tag: '',
        notes: ''
      });

      if (onAssetRegistered) {
        onAssetRegistered(data.asset);
      }

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Register New Asset</h2>

      {success && (
        <div className="alert alert-success">
          Asset registered successfully!
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="employee_name">Employee Name *</label>
          <input
            type="text"
            id="employee_name"
            name="employee_name"
            value={formData.employee_name}
            onChange={handleChange}
            required
            placeholder="John Doe"
          />
        </div>

        <div className="form-group">
          <label htmlFor="employee_email">Employee Email *</label>
          <input
            type="email"
            id="employee_email"
            name="employee_email"
            value={formData.employee_email}
            onChange={handleChange}
            required
            placeholder="john.doe@company.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="manager_name">Manager Name *</label>
          <input
            type="text"
            id="manager_name"
            name="manager_name"
            value={formData.manager_name}
            onChange={handleChange}
            required
            placeholder="Jane Smith"
          />
        </div>

        <div className="form-group">
          <label htmlFor="manager_email">Manager Email *</label>
          <input
            type="email"
            id="manager_email"
            name="manager_email"
            value={formData.manager_email}
            onChange={handleChange}
            required
            placeholder="jane.smith@company.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="client_name">Client Company *</label>
          <select
            id="client_name"
            name="client_name"
            value={formData.client_name}
            onChange={handleChange}
            required
          >
            <option value="">Select a company...</option>
            {companies.map((company) => (
              <option key={company.id} value={company.name}>
                {company.name}
              </option>
            ))}
          </select>
          {companies.length === 0 && (
            <small style={{ color: '#e53e3e', marginTop: '5px', display: 'block' }}>
              No companies available. Please add companies first in the Company Management section.
            </small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="laptop_serial_number">Laptop Serial Number *</label>
          <input
            type="text"
            id="laptop_serial_number"
            name="laptop_serial_number"
            value={formData.laptop_serial_number}
            onChange={handleChange}
            required
            placeholder="SN123456789"
          />
        </div>

        <div className="form-group">
          <label htmlFor="laptop_asset_tag">Laptop Asset Tag *</label>
          <input
            type="text"
            id="laptop_asset_tag"
            name="laptop_asset_tag"
            value={formData.laptop_asset_tag}
            onChange={handleChange}
            required
            placeholder="ASSET-001"
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes (Optional)</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional information..."
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Registering...' : 'Register Asset'}
        </button>
      </form>
    </div>
  );
};

export default AssetRegistrationForm;
