import { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';

const AuthPage = ({ initialMode = 'login' }) => {
  // Check if user arrived with an invite token — invited users bypass registration-disabled
  const hasInviteToken = new URLSearchParams(window.location.search).has('token');
  const [showLogin, setShowLogin] = useState(initialMode === 'login');
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  useEffect(() => {
    fetch('/api/auth/config')
      .then(res => res.json())
      .then(data => {
        setRegistrationEnabled(data.registration_enabled);
        // Force login view if registration is disabled and trying to register
        // BUT allow invited users (with token) to proceed to registration
        if (!data.registration_enabled && initialMode === 'register' && !hasInviteToken) {
          setShowLogin(true);
        }
      })
      .catch(err => console.error('Failed to fetch auth config:', err));
  }, [initialMode, hasInviteToken]);

  const handleSwitchToRegister = () => {
    if (registrationEnabled || hasInviteToken) {
      setShowLogin(false);
    }
  };

  return showLogin ? (
    <Login onSwitchToRegister={handleSwitchToRegister} />
  ) : (
    <Register onSwitchToLogin={() => setShowLogin(true)} />
  );
};

export default AuthPage;
