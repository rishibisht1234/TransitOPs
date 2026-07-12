import React from 'react';
import { Sun, Moon, Menu } from 'lucide-react';

const Navbar = ({ currentView, collapsed, setCollapsed, theme, toggleTheme, user }) => {
  const getViewName = () => {
    return currentView.charAt(0).toUpperCase() + currentView.slice(1);
  };

  const formatRole = (role) => {
    if (!role) return '';
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <div className="header" style={{ marginBottom: '1.5rem', paddingBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="action-icon-btn" onClick={() => setCollapsed(!collapsed)}>
          <Menu size={18} />
        </button>
        <h1>{getViewName()}</h1>
      </div>
      
      <div className="header-actions">
        <button className="theme-btn" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        
        {user && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.name || user.email}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formatRole(user.role)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
