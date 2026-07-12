import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Login from './pages/Login';
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [userRole, setUserRole] = useState('DISPATCHER');
  const [user, setUser] = useState(null);
  
  // Toast notifications state
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Check initial auth status
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
      const decodedUser = decodeUserFromToken(token);
      if (decodedUser) {
        setUser(decodedUser);
        setUserRole(decodedUser.role);
      }
    }
    
    // Apply theme
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Decode JWT payload to fetch the user role and profile details
  const decodeUserFromToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      return {
        role: payload.role || 'DISPATCHER',
        email: payload.email || '',
        name: payload.first_name ? `${payload.first_name} ${payload.last_name || ''}`.trim() : ''
      };
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  };

  const handleLoginSuccess = () => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(true);
    if (token) {
      const decodedUser = decodeUserFromToken(token);
      if (decodedUser) {
        setUser(decodedUser);
        setUserRole(decodedUser.role);
      }
    }
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    setUser(null);
    setUserRole('DISPATCHER');
    showToast('Logged out successfully', 'info');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard setCurrentView={setCurrentView} showToast={showToast} theme={theme} userRole={userRole} />;
      case 'vehicles':
        return <Vehicles showToast={showToast} />;
      case 'drivers':
        return <Drivers showToast={showToast} />;
      case 'trips':
        return <Trips showToast={showToast} />;
      case 'maintenance':
        return <Maintenance showToast={showToast} userRole={userRole} />;
      case 'expenses':
        return <Expenses showToast={showToast} />;
      case 'reports':
        return <Reports showToast={showToast} theme={theme} />;
      default:
        return <Dashboard setCurrentView={setCurrentView} showToast={showToast} theme={theme} userRole={userRole} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Login onLoginSuccess={handleLoginSuccess} showToast={showToast} />
        {toast && (
          <div className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onLogout={handleLogout}
        userRole={userRole}
      />

      {/* Main Container */}
      <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Top Header */}
        <Navbar
          currentView={currentView}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          theme={theme}
          toggleTheme={toggleTheme}
          user={user}
        />

        {/* View Component */}
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          {renderView()}
        </div>
      </div>

      {/* Toast Overlay */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
