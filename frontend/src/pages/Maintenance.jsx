import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { Plus, Search, CheckCircle2, Wrench, Download } from 'lucide-react';

const Maintenance = ({ showToast, userRole }) => {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  
  // States
  const [selectedLog, setSelectedLog] = useState(null);
  
  // Create Form
  const [vehicleId, setVehicleId] = useState('');
  const [issue, setIssue] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('0');

  // Close Form
  const [closeCost, setCloseCost] = useState('');

  useEffect(() => {
    fetchLogs();
    fetchVehicles();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await api.get('/api/maintenance/');
      setLogs(response.data);
    } catch (error) {
      console.error(error);
      showToast('Failed to fetch maintenance logs', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/api/vehicles/');
      setVehicles(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  // We can open maintenance for any vehicle except those already retired
  const eligibleVehicles = vehicles.filter(v => v.status !== 'RETIRED');

  const handleOpenCreate = () => {
    setVehicleId('');
    setIssue('');
    setDescription('');
    setCost('0');
    setIsCreateOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (parseFloat(cost) < 0) {
      showToast('Cost cannot be negative.', 'warning');
      return;
    }

    try {
      await api.post('/api/maintenance/', {
        vehicle: vehicleId,
        issue,
        description,
        cost,
        status: 'OPEN',
      });
      showToast('Maintenance log opened! Vehicle status updated to In Shop.', 'success');
      setIsCreateOpen(false);
      fetchLogs();
      fetchVehicles();
    } catch (error) {
      console.error(error);
      const errors = error.response?.data;
      const errorMsg = error.response?.status === 403 
        ? 'Permission Denied: Only Fleet Managers/Admins can modify maintenance.'
        : (errors ? Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join(' ') : 'Failed to open log.');
      showToast(errorMsg, 'danger');
    }
  };

  const handleOpenClose = (log) => {
    setSelectedLog(log);
    setCloseCost(log.cost);
    setIsCloseOpen(true);
  };

  const handleCloseLog = async (e) => {
    e.preventDefault();

    if (parseFloat(closeCost) < 0) {
      showToast('Cost cannot be negative.', 'warning');
      return;
    }

    try {
      await api.put(`/api/maintenance/${selectedLog.id}/`, {
        vehicle: selectedLog.vehicle,
        issue: selectedLog.issue,
        description: selectedLog.description,
        cost: closeCost,
        status: 'CLOSED',
      });
      showToast('Maintenance log closed! Vehicle status restored to Available.', 'success');
      setIsCloseOpen(false);
      fetchLogs();
      fetchVehicles();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.status === 403
        ? 'Permission Denied: Only Fleet Managers/Admins can close maintenance.'
        : 'Failed to close log.';
      showToast(errorMsg, 'danger');
    }
  };

  const getVehicleReg = (id) => {
    const v = vehicles.find(item => item.id === id);
    return v ? `${v.registration_number} (${v.vehicle_name})` : `Vehicle #${id}`;
  };

  // Filter
  const filteredLogs = logs.filter((log) => {
    const vReg = getVehicleReg(log.vehicle).toLowerCase();
    const matchesSearch = vReg.includes(searchTerm.toLowerCase()) || log.issue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showToast('No maintenance records to export', 'warning');
      return;
    }
    const headers = ['Log ID', 'Vehicle', 'Issue', 'Description', 'Opened Date', 'Closed Date', 'Cost (INR)', 'Status'];
    const rows = filteredLogs.map(log => [
      log.id,
      getVehicleReg(log.vehicle),
      log.issue,
      log.description,
      log.opened_date,
      log.closed_date || '-',
      log.cost,
      log.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'TransitOps_Maintenance_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Maintenance logs exported as CSV!', 'success');
  };

  const createFooter = (
    <>
      <button className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>Cancel</button>
      <button className="btn btn-primary" onClick={handleCreate}>Open Log</button>
    </>
  );

  const closeFooter = (
    <>
      <button className="btn btn-secondary" onClick={() => setIsCloseOpen(false)}>Cancel</button>
      <button className="btn btn-primary" onClick={handleCloseLog}>Close Maintenance</button>
    </>
  );

  const isOperator = userRole === 'FLEET_MANAGER' || userRole === 'ADMIN';

  return (
    <div>
      {/* Filters Bar */}
      <div className="filter-bar">
        <div className="filter-inputs">
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search vehicle/issue..."
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
            <option value="OPEN">Open (In Shop)</option>
            <option value="CLOSED">Closed (Resolved)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} />
            <span>Log Maintenance</span>
          </button>
        </div>
      </div>

      {/* Main logs list */}
      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '1rem' }}>Loading maintenance logs...</p>
        ) : filteredLogs.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>No maintenance records found.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Vehicle</th>
                  <th>Issue Description</th>
                  <th>Opened Date</th>
                  <th>Closed Date</th>
                  <th>Total Cost</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td><strong>#{log.id}</strong></td>
                    <td style={{ fontWeight: 600 }}>{getVehicleReg(log.vehicle)}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.issue}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.description}</div>
                    </td>
                    <td>{log.opened_date}</td>
                    <td>{log.closed_date || '-'}</td>
                    <td>₹{parseFloat(log.cost).toLocaleString()}</td>
                    <td>
                      {log.status === 'OPEN' ? (
                        <span className="badge badge-warning">Open (In Shop)</span>
                      ) : (
                        <span className="badge badge-success">Closed (Resolved)</span>
                      )}
                    </td>
                    <td>
                      {log.status === 'OPEN' ? (
                        <button className="btn btn-primary" onClick={() => handleOpenClose(log)} style={{ background: 'var(--success)', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                          <CheckCircle2 size={12} />
                          <span>Close Log</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Log Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Open Maintenance Log"
        footer={createFooter}
      >
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label htmlFor="m-vehicle">Select Vehicle (Will set status to In Shop)</label>
            <select
              id="m-vehicle"
              className="form-control"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              required
            >
              <option value="">Select a Vehicle</option>
              {eligibleVehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.registration_number} - {v.vehicle_name} ({v.status})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="m-issue">Issue Title</label>
            <input
              id="m-issue"
              type="text"
              className="form-control"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="e.g. Engine Oil Leakage"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="m-desc">Detailed Description</label>
            <textarea
              id="m-desc"
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide repair specifics..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="m-cost">Initial Estimated Cost (₹)</label>
            <input
              id="m-cost"
              type="number"
              step="0.01"
              className="form-control"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Close Log Modal */}
      <Modal
        isOpen={isCloseOpen}
        onClose={() => setIsCloseOpen(false)}
        title="Resolve Maintenance Log"
        footer={closeFooter}
      >
        <form onSubmit={handleCloseLog}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Completing maintenance restores the vehicle's status to <strong>Available</strong>.
          </p>
          <div className="form-group">
            <label htmlFor="close-cost">Final Repair Cost (₹)</label>
            <input
              id="close-cost"
              type="number"
              step="0.01"
              className="form-control"
              value={closeCost}
              onChange={(e) => setCloseCost(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Maintenance;
