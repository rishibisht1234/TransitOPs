import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Bar } from 'react-chartjs-2';
import { Download, TrendingUp, DollarSign, Fuel, Award } from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend
);

const Reports = ({ showToast }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const response = await api.get('/api/reports/');
      setReportData(response.data);
    } catch (error) {
      console.error(error);
      showToast('Failed to load reports and analytics', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    // Build CSV Content
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Fuel Efficiency', `${reportData.fuel_efficiency} km/L`],
      ['Fleet Utilization', `${reportData.fleet_utilization}%`],
      ['Fuel Cost', `₹${reportData.fuel_cost}`],
      ['Maintenance Cost', `₹${reportData.maintenance_cost}`],
      ['Total Operational Cost', `₹${reportData.operational_cost}`],
      ['Total Revenue', `₹${reportData.total_revenue}`],
      ['Vehicle ROI', `${reportData.vehicle_roi}%`]
    ];

    let csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'TransitOps_Operational_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Report exported as CSV successfully!', 'success');
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>Loading reports data...</div>;
  }

  if (!reportData) {
    return <div className="card">No reports metrics available.</div>;
  }

  // Cost vs Revenue comparison chart
  const barChartData = {
    labels: ['Financial Overview'],
    datasets: [
      {
        label: 'Total Revenue',
        data: [reportData.total_revenue || 0],
        backgroundColor: '#10b981',
      },
      {
        label: 'Total Operational Cost',
        data: [reportData.operational_cost || 0],
        backgroundColor: '#ef4444',
      },
      {
        label: 'Net Profit / Savings',
        data: [(reportData.total_revenue || 0) - (reportData.operational_cost || 0)],
        backgroundColor: '#3b82f6',
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'var(--text-primary)',
        }
      }
    },
    scales: {
      y: {
        ticks: { color: 'var(--text-secondary)' },
        grid: { color: 'var(--border-color)' }
      },
      x: {
        ticks: { color: 'var(--text-secondary)' }
      }
    }
  };

  return (
    <div>
      {/* Export Header */}
      <div className="filter-bar">
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Comprehensive analytics overview of fleet utilization, fuel economy, and ROI.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleExportCSV}>
          <Download size={16} />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Grid of Report Cards */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="card metric-card">
          <div className="metric-info">
            <h3>Vehicle ROI</h3>
            <p>{reportData.vehicle_roi}%</p>
          </div>
          <div className="metric-icon icon-blue">
            <Award size={24} />
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-info">
            <h3>Fuel Economy</h3>
            <p>{reportData.fuel_efficiency} km/L</p>
          </div>
          <div className="metric-icon icon-green">
            <Fuel size={24} />
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-info">
            <h3>Operational Cost</h3>
            <p>₹{reportData.operational_cost}</p>
          </div>
          <div className="metric-icon icon-red">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-info">
            <h3>Total Revenue</h3>
            <p>₹{reportData.total_revenue}</p>
          </div>
          <div className="metric-icon icon-green">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Cost vs Revenue comparison */}
        <div className="card" style={{ height: '400px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Revenue vs Operational Costs</h2>
          <div style={{ height: '300px' }}>
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* Fleet health and cost items */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Cost Breakdown</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1, justifyContent: 'center' }}>
            <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.01)' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Fuel Expenses</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                ₹{reportData.fuel_cost.toLocaleString()}
              </div>
            </div>
            
            <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.01)' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Maintenance Expenses</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                ₹{reportData.maintenance_cost.toLocaleString()}
              </div>
            </div>
            
            <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.01)' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Fleet Utilization</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {reportData.fleet_utilization}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
