import { useState } from 'react';
import LoginNew from './LoginNew';
import RegisterNew from './RegisterNew';

const AuthPageNew = () => {
  const [showLogin, setShowLogin] = useState(true);

  return showLogin ? (
    <LoginNew onSwitchToRegister={() => setShowLogin(false)} />
  ) : (
    <RegisterNew onSwitchToLogin={() => setShowLogin(true)} />
  );
};

export default AuthPageNew;
