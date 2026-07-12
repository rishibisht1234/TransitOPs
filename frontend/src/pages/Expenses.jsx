import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { Plus, Search, Coins, Download } from 'lucide-react';

const Expenses = ({ showToast }) => {
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal
  const [isOpen, setIsOpen] = useState(false);

  // Form states
  const [category, setCategory] = useState('FUEL');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [tripId, setTripId] = useState('');

  useEffect(() => {
    fetchExpenses();
    fetchSelectionResources();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/api/expenses/');
      setExpenses(response.data);
    } catch (error) {
      console.error(error);
      showToast('Failed to fetch expenses', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectionResources = async () => {
    try {
      const [vehiclesRes, tripsRes] = await Promise.all([
        api.get('/api/vehicles/'),
        api.get('/api/trips/')
      ]);
      setVehicles(vehiclesRes.data);
      setTrips(tripsRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const resetForm = () => {
    setCategory('FUEL');
    setAmount('');
    setRemarks('');
    setVehicleId('');
    setTripId('');
  };

  const handleOpenModal = () => {
    resetForm();
    fetchSelectionResources();
    setIsOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (parseFloat(amount) <= 0) {
      showToast('Expense amount must be greater than 0.', 'warning');
      return;
    }

    const payload = {
      category,
      amount,
      remarks,
      vehicle: vehicleId || null,
      trip: tripId || null,
    };

    try {
      await api.post('/api/expenses/', payload);
      showToast('Expense logged successfully!', 'success');
      setIsOpen(false);
      resetForm();
      fetchExpenses();
    } catch (error) {
      console.error(error);
      const errors = error.response?.data;
      const errorMsg = errors ? Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join(' ') : 'Failed to record expense.';
      showToast(errorMsg, 'danger');
    }
  };

  const getVehicleReg = (id) => {
    if (!id) return '-';
    const v = vehicles.find(item => item.id === id);
    return v ? `${v.registration_number}` : `Vehicle #${id}`;
  };

  const getTripDetails = (id) => {
    if (!id) return '-';
    const t = trips.find(item => item.id === id);
    return t ? `Trip #${t.id} (${t.source} → ${t.destination})` : `Trip #${id}`;
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'FUEL': return <span className="badge badge-info">Fuel</span>;
      case 'MAINTENANCE': return <span className="badge badge-warning">Maintenance</span>;
      case 'TOLL': return <span className="badge badge-secondary">Toll</span>;
      case 'PARKING': return <span className="badge badge-secondary">Parking</span>;
      case 'OTHER': return <span className="badge badge-secondary">Other</span>;
      default: return <span className="badge badge-secondary">{cat}</span>;
    }
  };

  // Filtering
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.remarks.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === '' || exp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      showToast('No expenses to export', 'warning');
      return;
    }
    const headers = ['Expense ID', 'Date', 'Category', 'Vehicle', 'Trip Details', 'Amount (INR)', 'Remarks'];
    const rows = filteredExpenses.map(exp => [
      exp.id,
      exp.date,
      exp.category,
      getVehicleReg(exp.vehicle),
      getTripDetails(exp.trip),
      exp.amount,
      exp.remarks || '-'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'TransitOps_Expenses_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Expenses data exported as CSV!', 'success');
  };

  const footer = (
    <>
      <button className="btn btn-secondary" onClick={() => setIsOpen(false)}>Cancel</button>
      <button className="btn btn-primary" onClick={handleSave}>Log Expense</button>
    </>
  );

  return (
    <div>
      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-inputs">
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search remarks..."
              className="form-control search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-secondary)' }} />
          </div>

          <select
            className="form-control select-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="FUEL">Fuel</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="TOLL">Toll</option>
            <option value="PARKING">Parking</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenModal}>
            <Plus size={16} />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* Main list */}
      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '1rem' }}>Loading expenses...</p>
        ) : filteredExpenses.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem' }}>
            <Coins size={48} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>No expenses recorded</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', maxWidth: '300px' }}>
              Log fuel, maintenance, toll, parking, or other fleet expenses to start tracking operational costs.
            </p>
            <button className="btn btn-primary" onClick={handleOpenModal}>
              <Plus size={16} />
              <span>Log Your First Expense</span>
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Vehicle</th>
                  <th>Trip</th>
                  <th>Amount</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id}>
                    <td><strong>#{exp.id}</strong></td>
                    <td>{exp.date}</td>
                    <td>{getCategoryBadge(exp.category)}</td>
                    <td>{getVehicleReg(exp.vehicle)}</td>
                    <td style={{ fontSize: '0.8rem' }}>{getTripDetails(exp.trip)}</td>
                    <td style={{ fontWeight: 600 }}>₹{parseFloat(exp.amount).toLocaleString()}</td>
                    <td>{exp.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Log Operational Expense"
        footer={footer}
      >
        <form onSubmit={handleSave}>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="exp-category">Category</label>
              <select
                id="exp-category"
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="FUEL">Fuel</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="TOLL">Toll</option>
                <option value="PARKING">Parking</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="exp-amount">Amount (₹)</label>
              <input
                id="exp-amount"
                type="number"
                step="0.01"
                className="form-control"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="₹ Amount"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="exp-vehicle">Link Vehicle (Optional)</label>
            <select
              id="exp-vehicle"
              className="form-control"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">None (Generic Expense)</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.registration_number} - {v.vehicle_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="exp-trip">Link Trip (Optional)</label>
            <select
              id="exp-trip"
              className="form-control"
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
            >
              <option value="">None</option>
              {trips.map(t => (
                <option key={t.id} value={t.id}>
                  Trip #{t.id} ({t.source} → {t.destination})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="exp-remarks">Remarks / Description</label>
            <textarea
              id="exp-remarks"
              className="form-control"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Fuel Refill 25 Liters at HP Station"
              rows={2}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;
