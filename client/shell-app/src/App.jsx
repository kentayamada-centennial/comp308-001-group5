import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

const Auth = React.lazy(() => import('authApp/Auth'));
const NurseDashboard = React.lazy(() => import('nurseDashboardApp/NurseDashboard'));
const PatientDashboard = React.lazy(() => import('patientDashboardApp/PatientDashboard'));

function ShellApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('userId'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));

  const handleLogin = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    setUserRole(null);
  };

  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        {!isLoggedIn ? (
          <Auth onLogin={handleLogin} />
        ) : userRole === 'nurse' ? (
          <NurseDashboard onLogout={handleLogout} />
        ) : (
          <PatientDashboard onLogout={handleLogout} />
        )}
      </Suspense>
    </Router>
  );
}

export default ShellApp;
