import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { Plus, Search, Edit2, Trash2, ShieldAlert, Download } from 'lucide-react';

const Vehicles = ({ showToast }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  // Form states
  const [regNum, setRegNum] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('VAN');
  const [capacity, setCapacity] = useState('');
  const [odometer, setOdometer] = useState(0);
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState('AVAILABLE');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/api/vehicles/');
      setVehicles(response.data);
    } catch (error) {
      console.error(error);
      showToast('Failed to fetch vehicles list', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRegNum('');
    setName('');
    setType('VAN');
    setCapacity('');
    setOdometer(0);
    setCost('');
    setStatus('AVAILABLE');
    setEditingVehicle(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setRegNum(vehicle.registration_number);
    setName(vehicle.vehicle_name);
    setType(vehicle.vehicle_type);
    setCapacity(vehicle.maximum_load_capacity);
    setOdometer(vehicle.odometer);
    setCost(vehicle.acquisition_cost);
    setStatus(vehicle.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (parseFloat(capacity) <= 0) {
      showToast('Maximum load capacity must be greater than 0.', 'warning');
      return;
    }
    if (parseFloat(cost) <= 0) {
      showToast('Acquisition cost must be positive.', 'warning');
      return;
    }

    const payload = {
      registration_number: regNum,
      vehicle_name: name,
      vehicle_type: type,
      maximum_load_capacity: capacity,
      odometer: odometer,
      acquisition_cost: cost,
      status: status,
    };

    try {
      if (editingVehicle) {
        // Edit mode
        await api.put(`/api/vehicles/${editingVehicle.id}/`, payload);
        showToast('Vehicle updated successfully!', 'success');
      } else {
        // Add mode
        await api.post('/api/vehicles/', payload);
        showToast('Vehicle registered successfully!', 'success');
      }
      setIsModalOpen(false);
      resetForm();
      fetchVehicles();
    } catch (error) {
      console.error(error);
      const errors = error.response?.data;
      const errorMsg = errors ? Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join(' ') : 'An error occurred.';
      showToast(errorMsg, 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      try {
        await api.delete(`/api/vehicles/${id}/`);
        showToast('Vehicle deleted successfully!', 'success');
        fetchVehicles();
      } catch (error) {
        console.error(error);
        showToast('Failed to delete vehicle', 'danger');
      }
    }
  };

  // Filtering Logic
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = 
      v.vehicle_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.registration_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || v.status === statusFilter;
    const matchesType = typeFilter === '' || v.vehicle_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (stat) => {
    switch (stat) {
      case 'AVAILABLE': return <span className="badge badge-success">Available</span>;
      case 'ON_TRIP': return <span className="badge badge-info">On Trip</span>;
      case 'IN_SHOP': return <span className="badge badge-warning">In Shop</span>;
      case 'RETIRED': return <span className="badge badge-secondary">Retired</span>;
      default: return <span className="badge badge-secondary">{stat}</span>;
    }
  };

  const handleExportCSV = () => {
    if (filteredVehicles.length === 0) {
      showToast('No vehicles data to export', 'warning');
      return;
    }
    const headers = ['Registration Number', 'Model/Name', 'Type', 'Max Capacity (kg)', 'Odometer (km)', 'Acquisition Cost (INR)', 'Status'];
    const rows = filteredVehicles.map(v => [
      v.registration_number,
      v.vehicle_name,
      v.vehicle_type,
      v.maximum_load_capacity,
      v.odometer,
      v.acquisition_cost,
      v.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'TransitOps_Vehicles_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Vehicles data exported as CSV!', 'success');
  };

  const modalFooter = (
    <>
      <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
      <button className="btn btn-primary" onClick={handleSave}>Save Vehicle</button>
    </>
  );

  return (
    <div>
      {/* Search & Actions Bar */}
      <div className="filter-bar">
        <div className="filter-inputs">
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search vehicles model/reg..."
              className="form-control search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-secondary)' }} />
          </div>

          <select
            className="form-control select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="IN_SHOP">In Shop</option>
            <option value="RETIRED">Retired</option>
          </select>

          <select
            className="form-control select-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="VAN">Van</option>
            <option value="TRUCK">Truck</option>
            <option value="PICKUP">Pickup</option>
            <option value="BUS">Bus</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Main List Card */}
      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '1rem' }}>Loading vehicles data...</p>
        ) : filteredVehicles.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>No vehicles found matching filters.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Reg Number</th>
                  <th>Model / Name</th>
                  <th>Type</th>
                  <th>Max Capacity (kg)</th>
                  <th>Odometer (km)</th>
                  <th>Acquisition Cost</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td style={{ fontWeight: 600 }}>{vehicle.registration_number}</td>
                    <td>{vehicle.vehicle_name}</td>
                    <td>{vehicle.vehicle_type}</td>
                    <td>{parseFloat(vehicle.maximum_load_capacity).toLocaleString()} kg</td>
                    <td>{vehicle.odometer} km</td>
                    <td>₹{parseFloat(vehicle.acquisition_cost).toLocaleString()}</td>
                    <td>{getStatusBadge(vehicle.status)}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-icon-btn" onClick={() => handleOpenEditModal(vehicle)} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button className="action-icon-btn" onClick={() => handleDelete(vehicle.id)} title="Delete" style={{ color: 'var(--danger)' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVehicle ? 'Edit Vehicle Info' : 'Register New Vehicle'}
        footer={modalFooter}
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="regNum">Registration Number (Unique)</label>
            <input
              id="regNum"
              type="text"
              className="form-control"
              value={regNum}
              onChange={(e) => setRegNum(e.target.value)}
              placeholder="e.g. MH12AB1234"
              required
              disabled={!!editingVehicle}
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Vehicle Model Name</label>
            <input
              id="name"
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tata Ultra T.7"
              required
            />
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="type">Vehicle Type</label>
              <select
                id="type"
                className="form-control"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="VAN">Van</option>
                <option value="TRUCK">Truck</option>
                <option value="PICKUP">Pickup</option>
                <option value="BUS">Bus</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="status">Operating Status</label>
              <select
                id="status"
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="AVAILABLE">Available</option>
                <option value="ON_TRIP">On Trip</option>
                <option value="IN_SHOP">In Shop</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="capacity">Max Capacity (kg)</label>
              <input
                id="capacity"
                type="number"
                step="0.1"
                className="form-control"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="5000"
                required
              />
            </div>
            <div>
              <label htmlFor="odometer">Initial Odometer (km)</label>
              <input
                id="odometer"
                type="number"
                className="form-control"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cost">Acquisition Cost (₹)</label>
            <input
              id="cost"
              type="number"
              step="0.01"
              className="form-control"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="1200000"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Vehicles;
