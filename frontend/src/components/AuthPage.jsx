import { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';

const AuthPage = ({ initialMode = 'login' }) => {
  const [showLogin, setShowLogin] = useState(initialMode === 'login');
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  useEffect(() => {
    fetch('/api/auth/config')
      .then(res => res.json())
      .then(data => {
        setRegistrationEnabled(data.registration_enabled);
        // Force login view if registration is disabled and trying to register
        if (!data.registration_enabled && initialMode === 'register') {
          setShowLogin(true);
        }
      })
      .catch(err => console.error('Failed to fetch auth config:', err));
  }, [initialMode]);

  const handleSwitchToRegister = () => {
    if (registrationEnabled) {
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
