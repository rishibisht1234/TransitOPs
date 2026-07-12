import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { Plus, Search, Edit2, Trash2, ShieldAlert, AlertTriangle, Download } from 'lucide-react';

const Drivers = ({ showToast }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [licenseNum, setLicenseNum] = useState('');
  const [category, setCategory] = useState('LMV');
  const [expiryDate, setExpiryDate] = useState('');
  const [contact, setContact] = useState('');
  const [safetyScore, setSafetyScore] = useState(100);
  const [status, setStatus] = useState('AVAILABLE');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await api.get('/api/drivers/');
      setDrivers(response.data);
    } catch (error) {
      console.error(error);
      showToast('Failed to fetch drivers list', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setLicenseNum('');
    setCategory('LMV');
    setExpiryDate('');
    setContact('');
    setSafetyScore(100);
    setStatus('AVAILABLE');
    setEditingDriver(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (driver) => {
    setEditingDriver(driver);
    setName(driver.name);
    setLicenseNum(driver.license_number);
    setCategory(driver.license_category);
    setExpiryDate(driver.license_expiry_date);
    setContact(driver.contact_number);
    setSafetyScore(driver.safety_score);
    setStatus(driver.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (parseFloat(safetyScore) < 0 || parseFloat(safetyScore) > 100) {
      showToast('Safety score must be between 0 and 100.', 'warning');
      return;
    }

    const payload = {
      name,
      license_number: licenseNum,
      license_category: category,
      license_expiry_date: expiryDate,
      contact_number: contact,
      safety_score: safetyScore,
      status,
    };

    try {
      if (editingDriver) {
        await api.put(`/api/drivers/${editingDriver.id}/`, payload);
        showToast('Driver profile updated successfully!', 'success');
      } else {
        await api.post('/api/drivers/', payload);
        showToast('Driver registered successfully!', 'success');
      }
      setIsModalOpen(false);
      resetForm();
      fetchDrivers();
    } catch (error) {
      console.error(error);
      const errors = error.response?.data;
      const errorMsg = errors ? Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join(' ') : 'An error occurred.';
      showToast(errorMsg, 'danger');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await api.delete(`/api/drivers/${id}/`);
        showToast('Driver profile deleted!', 'success');
        fetchDrivers();
      } catch (error) {
        console.error(error);
        showToast('Failed to delete driver', 'danger');
      }
    }
  };

  // License Status Helper
  const getLicenseStatus = (expiryDateStr) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0,0,0,0);
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'EXPIRED', label: 'Expired', class: 'badge-danger' };
    } else if (diffDays <= 30) {
      return { status: 'EXPIRING_SOON', label: `Expiring soon (${diffDays}d)`, class: 'badge-warning' };
    }
    return null;
  };

  // Filtering Logic
  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch = 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.license_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (stat) => {
    switch (stat) {
      case 'AVAILABLE': return <span className="badge badge-success">Available</span>;
      case 'ON_TRIP': return <span className="badge badge-info">On Trip</span>;
      case 'OFF_DUTY': return <span className="badge badge-secondary">Off Duty</span>;
      case 'SUSPENDED': return <span className="badge badge-danger">Suspended</span>;
      default: return <span className="badge badge-secondary">{stat}</span>;
    }
  };

  // Count expiring soon or expired licenses
  const warningDrivers = drivers.filter(d => getLicenseStatus(d.license_expiry_date) !== null);

  const handleExportCSV = () => {
    if (filteredDrivers.length === 0) {
      showToast('No drivers data to export', 'warning');
      return;
    }
    const headers = ['Driver Name', 'License Number', 'Category', 'License Expiry', 'Contact Number', 'Safety Score (%)', 'Status'];
    const rows = filteredDrivers.map(d => [
      d.name,
      d.license_number,
      d.license_category,
      d.license_expiry_date,
      d.contact_number,
      d.safety_score,
      d.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'TransitOps_Drivers_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Drivers data exported as CSV!', 'success');
  };

  const modalFooter = (
    <>
      <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
      <button className="btn btn-primary" onClick={handleSave}>Save Driver</button>
    </>
  );

  return (
    <div>
      {/* Expiring Licenses Alerts */}
      {warningDrivers.length > 0 && (
        <div className="warning-banner">
          <AlertTriangle size={20} />
          <div>
            <strong>License Compliance Alert:</strong> {warningDrivers.length} driver(s) have expired or expiring licenses. Expired license holders cannot be assigned to trips.
          </div>
        </div>
      )}

      {/* Filters & Actions */}
      <div className="filter-bar">
        <div className="filter-inputs">
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search driver name/license..."
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
            <option value="OFF_DUTY">Off Duty</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} />
            <span>Add Driver</span>
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '1rem' }}>Loading drivers list...</p>
        ) : filteredDrivers.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>No drivers found.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th>License Number</th>
                  <th>Category</th>
                  <th>License Expiry</th>
                  <th>License Status</th>
                  <th>Contact</th>
                  <th>Safety Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((driver) => {
                  const licenseStatus = getLicenseStatus(driver.license_expiry_date);
                  return (
                    <tr key={driver.id}>
                      <td style={{ fontWeight: 600 }}>{driver.name}</td>
                      <td>{driver.license_number}</td>
                      <td>{driver.license_category}</td>
                      <td>{driver.license_expiry_date}</td>
                      <td>
                        {licenseStatus ? (
                          <span className={`badge ${licenseStatus.class}`}>{licenseStatus.label}</span>
                        ) : (
                          <span className="badge badge-success">Valid</span>
                        )}
                      </td>
                      <td>{driver.contact_number}</td>
                      <td style={{ fontWeight: 600, color: driver.safety_score >= 85 ? 'var(--success)' : 'var(--warning)' }}>
                        {driver.safety_score}%
                      </td>
                      <td>{getStatusBadge(driver.status)}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-icon-btn" onClick={() => handleOpenEditModal(driver)} title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button className="action-icon-btn" onClick={() => handleDelete(driver.id)} title="Delete" style={{ color: 'var(--danger)' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDriver ? 'Edit Driver Profile' : 'Register New Driver'}
        footer={modalFooter}
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="licenseNum">License Number (Unique)</label>
              <input
                id="licenseNum"
                type="text"
                className="form-control"
                value={licenseNum}
                onChange={(e) => setLicenseNum(e.target.value)}
                placeholder="DL-142011001"
                required
                disabled={!!editingDriver}
              />
            </div>
            <div>
              <label htmlFor="category">License Category</label>
              <select
                id="category"
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="LMV">Light Motor Vehicle (LMV)</option>
                <option value="HMV">Heavy Motor Vehicle (HMV)</option>
                <option value="MCWG">Motorcycle With Gear (MCWG)</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="expiryDate">License Expiry Date</label>
              <input
                id="expiryDate"
                type="date"
                className="form-control"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="status">Duty Status</label>
              <select
                id="status"
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value="AVAILABLE">Available</option>
                <option value="ON_TRIP">On Trip</option>
                <option value="OFF_DUTY">Off Duty</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="contact">Contact Number</label>
              <input
                id="contact"
                type="text"
                className="form-control"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+91 9876543210"
                required
              />
            </div>
            <div>
              <label htmlFor="safetyScore">Safety Score (0-100)</label>
              <input
                id="safetyScore"
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="form-control"
                value={safetyScore}
                onChange={(e) => setSafetyScore(e.target.value)}
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Drivers;
