import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Doughnut, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title 
} from 'chart.js';
import { 
  Truck, 
  Compass, 
  Users, 
  Wrench, 
  Coins, 
  TrendingUp,
  PlusCircle,
  Play
} from 'lucide-react';

ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title
);

const Dashboard = ({ setCurrentView, showToast, theme }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const textColor = theme === 'dark' ? '#f8fafc' : '#0f172a';
  const textSecondary = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/api/dashboard/');
      setStats(response.data);
    } catch (error) {
      console.error(error);
      showToast('Failed to load dashboard metrics', 'danger');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>Loading metrics...</div>;
  }

  if (!stats) {
    return <div className="card">No dashboard metrics available.</div>;
  }

  // Cost Doughnut Chart Data
  const doughnutData = {
    labels: ['Fuel Cost', 'Maintenance Cost', 'Other Cost'],
    datasets: [
      {
        data: [
          stats.fuel_cost || 0, 
          stats.maintenance_cost || 0, 
          Math.max(0, stats.total_expense_amount - (stats.fuel_cost + stats.maintenance_cost))
        ],
        backgroundColor: ['#3b82f6', '#f59e0b', '#10b981'],
        borderColor: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.1)'],
        borderWidth: 1,
      },
    ],
  };

  // Fleet Status Bar Chart Data
  const barData = {
    labels: ['Available', 'On Trip', 'In Shop'],
    datasets: [
      {
        label: 'Vehicles count',
        data: [
          stats.available_vehicles || 0,
          stats.active_vehicles || 0,
          stats.vehicles_in_shop || 0
        ],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: textColor,
        }
      }
    }
  };

  return (
    <div>
      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="card metric-card">
          <div className="metric-info">
            <h3>Utilization</h3>
            <p>{stats.fleet_utilization}%</p>
          </div>
          <div className="metric-icon icon-blue">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-info">
            <h3>Active Trips</h3>
            <p>{stats.active_trips}</p>
          </div>
          <div className="metric-icon icon-green">
            <Compass size={24} />
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-info">
            <h3>On Duty Drivers</h3>
            <p>{stats.drivers_on_duty} / {stats.total_drivers}</p>
          </div>
          <div className="metric-icon icon-orange">
            <Users size={24} />
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-info">
            <h3>Expenses Logged</h3>
            <p>₹{stats.total_expense_amount}</p>
          </div>
          <div className="metric-icon icon-red">
            <Coins size={24} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Quick Operations panel */}
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Quick Actions & Workflows</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setCurrentView('trips')} style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <PlusCircle size={20} style={{ color: 'var(--accent-primary)', marginBottom: '4px' }} />
              <span>Create New Trip</span>
            </button>
            <button className="btn btn-secondary" onClick={() => setCurrentView('maintenance')} style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={20} style={{ color: 'var(--warning)', marginBottom: '4px' }} />
              <span>Log Maintenance</span>
            </button>
            <button className="btn btn-secondary" onClick={() => setCurrentView('expenses')} style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Coins size={20} style={{ color: 'var(--success)', marginBottom: '4px' }} />
              <span>Record Expense</span>
            </button>
            <button className="btn btn-secondary" onClick={() => setCurrentView('reports')} style={{ height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} style={{ color: 'var(--accent-primary)', marginBottom: '4px' }} />
              <span>View ROI & Profit</span>
            </button>
          </div>
        </div>

        {/* Maintenance / Trip Statuses */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Operations Alert</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Vehicles in Shop:</span>
                <span className="badge badge-warning">{stats.vehicles_in_shop} in shop</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Open Maintenance Logs:</span>
                <span className="badge badge-danger">{stats.open_maintenance} open logs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Draft (Pending) Trips:</span>
                <span className="badge badge-info">{stats.pending_trips} drafts</span>
              </div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setCurrentView('trips')} style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
            <Play size={16} />
            <span>Go to Dispatch Center</span>
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Operational Cost Breakdown</h2>
          <div className="chart-container">
            <Doughnut data={doughnutData} options={chartOptions} />
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Fleet Status Allocation</h2>
          <div className="chart-container">
            <Bar data={barData} options={{
              ...chartOptions,
              scales: {
                y: {
                  ticks: { stepSize: 1, color: textSecondary },
                  grid: { color: gridColor }
                },
                x: {
                  ticks: { color: textSecondary },
                  grid: { display: false }
                }
              }
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
