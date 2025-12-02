import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Chip,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Save, Lock, Person } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user, getAuthHeaders, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    // Initialize form with user data
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess(true);

      // Update user in context
      updateUser(data.user);

      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    // Client-side validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setPasswordSuccess(true);

      // Clear password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      manager: 'warning',
      employee: 'info',
    };
    return colors[role] || 'default';
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Grid container spacing={3}>
        {/* Profile Information Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Person sx={{ mr: 1 }} color="primary" />
                <Typography variant="h5" fontWeight={600}>
                  Profile Information
                </Typography>
              </Box>

              <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {user?.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Role
                    </Typography>
                    <Chip
                      label={user?.role?.toUpperCase()}
                      color={getRoleColor(user?.role)}
                      size="small"
                      sx={{ mt: 0.5, fontWeight: 600 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Current Name
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {user?.name || 'Not set'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Profile updated successfully!
                </Alert>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      placeholder="John"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      placeholder="Doe"
                    />
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                  sx={{ mt: 3 }}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Change Password Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Lock sx={{ mr: 1 }} color="primary" />
                <Typography variant="h5" fontWeight={600}>
                  Change Password
                </Typography>
              </Box>

              {passwordSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Password changed successfully!
                </Alert>
              )}

              {passwordError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {passwordError}
                </Alert>
              )}

              <Box component="form" onSubmit={handlePasswordSubmit}>
                <TextField
                  fullWidth
                  type="password"
                  label="Current Password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Enter current password"
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  type="password"
                  label="New Password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Enter new password (min 6 characters)"
                  inputProps={{ minLength: 6 }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  type="password"
                  label="Confirm New Password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Confirm new password"
                  inputProps={{ minLength: 6 }}
                  sx={{ mb: 3 }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={passwordLoading}
                  startIcon={passwordLoading ? <CircularProgress size={20} /> : <Lock />}
                >
                  {passwordLoading ? 'Changing Password...' : 'Change Password'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
