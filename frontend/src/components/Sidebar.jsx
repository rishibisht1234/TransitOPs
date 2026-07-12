import React from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Compass, 
  Wrench, 
  Receipt, 
  BarChart3, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ currentView, setCurrentView, collapsed, setCollapsed, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'vehicles', name: 'Vehicles', icon: Truck },
    { id: 'drivers', name: 'Drivers', icon: Users },
    { id: 'trips', name: 'Trips', icon: Compass },
    { id: 'maintenance', name: 'Maintenance', icon: Wrench },
    { id: 'expenses', name: 'Expenses', icon: Receipt },
    { id: 'reports', name: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <Truck className="sidebar-logo-icon" size={28} />
        {!collapsed && <span style={{ marginLeft: '8px' }}>TransitOps</span>}
      </div>

      <ul className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.id}
              className={`sidebar-item ${currentView === item.id ? 'active' : ''}`}
              onClick={() => setCurrentView(item.id)}
              title={item.name}
            >
              <Icon size={20} />
              {!collapsed && <span style={{ marginLeft: '12px' }}>{item.name}</span>}
            </li>
          );
        })}
      </ul>

      <div className="sidebar-footer">
        <button 
          className="sidebar-item" 
          onClick={onLogout} 
          style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
          title="Logout"
        >
          <LogOut size={20} />
          {!collapsed && <span style={{ marginLeft: '12px' }}>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
