import React from 'react';
import { Sun, Moon, Bell, Menu } from 'lucide-react';

const Navbar = ({ currentView, collapsed, setCollapsed, theme, toggleTheme }) => {
  const getViewName = () => {
    return currentView.charAt(0).toUpperCase() + currentView.slice(1);
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
        
        <div style={{ position: 'relative', cursor: 'pointer' }} className="action-icon-btn">
          <Bell size={18} />
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--danger)'
          }}></span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Fleet Manager</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Operator</span>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
