import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { Plus, Search, Edit2, Play, CheckCircle2, XCircle, FileText, Download } from 'lucide-react';

const Trips = ({ showToast }) => {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  
  // Trip management states
  const [selectedTrip, setSelectedTrip] = useState(null);
  
  // Create Form states
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');
  const [revenue, setRevenue] = useState('0');

  // Complete Form states
  const [actualDistance, setActualDistance] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [finalOdometer, setFinalOdometer] = useState('');

  useEffect(() => {
    fetchTrips();
    fetchSelectionResources();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await api.get('/api/trips/');
      setTrips(response.data);
    } catch (error) {
      console.error(error);
      showToast('Failed to fetch trips', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectionResources = async () => {
    try {
      const [vehiclesRes, driversRes] = await Promise.all([
        api.get('/api/vehicles/'),
        api.get('/api/drivers/')
      ]);
      setVehicles(vehiclesRes.data);
      setDrivers(driversRes.data);
    } catch (error) {
      console.error(error);
      showToast('Failed to fetch available vehicles/drivers', 'danger');
    }
  };

  // Check license expiry date
  const isLicenseValid = (expiryDateStr) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0,0,0,0);
    return expiry.getTime() >= today.getTime();
  };

  // Filter lists for available options in creation dropdown
  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE');
  const availableDrivers = drivers.filter(d => d.status === 'AVAILABLE' && isLicenseValid(d.license_expiry_date));

  const resetCreateForm = () => {
    setVehicleId('');
    setDriverId('');
    setSource('');
    setDestination('');
    setCargoWeight('');
    setPlannedDistance('');
    setRevenue('0');
  };

  const handleOpenCreateModal = () => {
    resetCreateForm();
    fetchSelectionResources(); // Refresh to ensure correct availability
    setIsCreateModalOpen(true);
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();

    // Validations
    if (parseFloat(cargoWeight) <= 0) {
      showToast('Cargo weight must be greater than 0.', 'warning');
      return;
    }
    if (parseFloat(plannedDistance) <= 0) {
      showToast('Planned distance must be greater than 0.', 'warning');
      return;
    }
    if (parseFloat(revenue) < 0) {
      showToast('Revenue cannot be negative.', 'warning');
      return;
    }

    const selectedVehicle = vehicles.find(v => v.id === parseInt(vehicleId));
    if (selectedVehicle && parseFloat(cargoWeight) > parseFloat(selectedVehicle.maximum_load_capacity)) {
      showToast(`Cargo weight exceeds the maximum load capacity (${selectedVehicle.maximum_load_capacity} kg) of this vehicle.`, 'warning');
      return;
    }

    try {
      await api.post('/api/trips/', {
        vehicle: vehicleId,
        driver: driverId,
        source,
        destination,
        cargo_weight: cargoWeight,
        planned_distance: plannedDistance,
        revenue,
        status: 'DRAFT',
      });
      showToast('Trip created successfully as DRAFT!', 'success');
      setIsCreateModalOpen(false);
      fetchTrips();
    } catch (error) {
      console.error(error);
      const errors = error.response?.data;
      const errorMsg = errors ? Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join(' ') : 'Failed to create trip.';
      showToast(errorMsg, 'danger');
    }
  };

  const handleDispatch = async (trip) => {
    try {
      await api.post(`/api/trips/${trip.id}/dispatch/`);
      showToast(`Trip #${trip.id} has been dispatched! Driver and Vehicle are now On Trip.`, 'success');
      fetchTrips();
      fetchSelectionResources();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.error || 'Failed to dispatch trip';
      showToast(errorMsg, 'danger');
    }
  };

  const handleCancel = async (trip) => {
    if (window.confirm('Are you sure you want to cancel this trip?')) {
      try {
        await api.post(`/api/trips/${trip.id}/cancel/`);
        showToast(`Trip #${trip.id} was cancelled successfully.`, 'success');
        fetchTrips();
        fetchSelectionResources();
      } catch (error) {
        console.error(error);
        const errorMsg = error.response?.data?.error || 'Failed to cancel trip';
        showToast(errorMsg, 'danger');
      }
    }
  };

  const handleOpenCompleteModal = (trip) => {
    setSelectedTrip(trip);
    setActualDistance(trip.planned_distance);
    setFuelConsumed('');
    
    // Suggest next odometer based on current vehicle odometer + planned distance
    const vObj = vehicles.find(v => v.id === trip.vehicle);
    if (vObj) {
      setFinalOdometer(vObj.odometer + Math.round(parseFloat(trip.planned_distance)));
    } else {
      setFinalOdometer('');
    }
    setIsCompleteModalOpen(true);
  };

  const handleCompleteTrip = async (e) => {
    e.preventDefault();

    if (parseFloat(actualDistance) <= 0 || parseFloat(fuelConsumed) <= 0) {
      showToast('Distance and fuel consumed must be greater than 0.', 'warning');
      return;
    }

    try {
      await api.post(`/api/trips/${selectedTrip.id}/complete/`, {
        actual_distance: actualDistance,
        fuel_consumed: fuelConsumed,
        final_odometer: finalOdometer || undefined,
      });
      showToast(`Trip #${selectedTrip.id} completed successfully!`, 'success');
      setIsCompleteModalOpen(false);
      fetchTrips();
      fetchSelectionResources();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.error || 'Failed to complete trip';
      showToast(errorMsg, 'danger');
    }
  };

  const handleDeleteDraft = async (id) => {
    if (window.confirm('Are you sure you want to delete this draft trip?')) {
      try {
        await api.delete(`/api/trips/${id}/`);
        showToast('Draft trip deleted.', 'success');
        fetchTrips();
      } catch (error) {
        console.error(error);
        showToast('Failed to delete trip', 'danger');
      }
    }
  };

  const getStatusBadge = (stat) => {
    switch (stat) {
      case 'DRAFT': return <span className="badge badge-secondary">Draft</span>;
      case 'DISPATCHED': return <span className="badge badge-info">Dispatched</span>;
      case 'COMPLETED': return <span className="badge badge-success">Completed</span>;
      case 'CANCELLED': return <span className="badge badge-danger">Cancelled</span>;
      default: return <span className="badge badge-secondary">{stat}</span>;
    }
  };

  // Helper names
  const getVehicleName = (id) => {
    const v = vehicles.find(item => item.id === id);
    return v ? `${v.registration_number} (${v.vehicle_name})` : `Vehicle #${id}`;
  };

  const getDriverName = (id) => {
    const d = drivers.find(item => item.id === id);
    return d ? d.name : `Driver #${id}`;
  };

  // Filtering
  const filteredTrips = trips.filter((t) => {
    const searchStr = `${t.source} ${t.destination}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    if (filteredTrips.length === 0) {
      showToast('No trips to export', 'warning');
      return;
    }
    const headers = ['Trip ID', 'Vehicle', 'Driver', 'Source', 'Destination', 'Cargo Weight (kg)', 'Planned Distance (km)', 'Actual Distance (km)', 'Fuel Consumed (L)', 'Revenue (INR)', 'Status'];
    const rows = filteredTrips.map(t => [
      t.id,
      getVehicleName(t.vehicle),
      getDriverName(t.driver),
      t.source,
      t.destination,
      t.cargo_weight,
      t.planned_distance,
      t.actual_distance || '-',
      t.fuel_consumed || '-',
      t.revenue,
      t.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF'
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'TransitOps_Trips_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Trips data exported as CSV!', 'success');
  };

  const createModalFooter = (
    <>
      <button className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
      <button className="btn btn-primary" onClick={handleCreateTrip}>Save as Draft</button>
    </>
  );

  const completeModalFooter = (
    <>
      <button className="btn btn-secondary" onClick={() => setIsCompleteModalOpen(false)}>Cancel</button>
      <button className="btn btn-primary" onClick={handleCompleteTrip}>Submit Completion</button>
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
              placeholder="Search source/destination..."
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
            <option value="DRAFT">Draft</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={16} />
            <span>Plan Trip</span>
          </button>
        </div>
      </div>

      {/* Grid List */}
      <div className="card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '1rem' }}>Loading trips...</p>
        ) : filteredTrips.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>No trips planned yet.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Route (Src → Dest)</th>
                  <th>Cargo Weight</th>
                  <th>Distance (Planned/Actual)</th>
                  <th>Fuel Consumed</th>
                  <th>Revenue</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.map((trip) => (
                  <tr key={trip.id}>
                    <td><strong>#{trip.id}</strong></td>
                    <td style={{ fontSize: '0.8rem' }}>{getVehicleName(trip.vehicle)}</td>
                    <td>{getDriverName(trip.driver)}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{trip.source}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>to {trip.destination}</div>
                    </td>
                    <td>{parseFloat(trip.cargo_weight).toLocaleString()} kg</td>
                    <td>
                      <div>Pl: {parseFloat(trip.planned_distance).toLocaleString()} km</div>
                      {trip.actual_distance && <div style={{ color: 'var(--success)' }}>Ac: {parseFloat(trip.actual_distance).toLocaleString()} km</div>}
                    </td>
                    <td>{trip.fuel_consumed ? `${parseFloat(trip.fuel_consumed).toLocaleString()} L` : '-'}</td>
                    <td>₹{parseFloat(trip.revenue).toLocaleString()}</td>
                    <td>{getStatusBadge(trip.status)}</td>
                    <td>
                      <div className="action-buttons">
                        {trip.status === 'DRAFT' && (
                          <>
                            <button className="btn btn-primary" onClick={() => handleDispatch(trip)} title="Dispatch now" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                              <Play size={12} />
                              <span>Dispatch</span>
                            </button>
                            <button className="action-icon-btn" onClick={() => handleDeleteDraft(trip.id)} title="Delete Draft" style={{ color: 'var(--danger)' }}>
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {trip.status === 'DISPATCHED' && (
                          <>
                            <button className="btn btn-primary" onClick={() => handleOpenCompleteModal(trip)} style={{ background: 'var(--success)', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} title="Mark completed">
                              <CheckCircle2 size={12} />
                              <span>Complete</span>
                            </button>
                            <button className="btn btn-danger" onClick={() => handleCancel(trip)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} title="Cancel trip">
                              <XCircle size={12} />
                              <span>Cancel</span>
                            </button>
                          </>
                        )}
                        {(trip.status === 'COMPLETED' || trip.status === 'CANCELLED') && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Logged</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Plan New Trip"
        footer={createModalFooter}
      >
        <form onSubmit={handleCreateTrip}>
          <div className="form-group">
            <label htmlFor="vehicleId">Assign Vehicle (Available Only)</label>
            <select
              id="vehicleId"
              className="form-control"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              required
            >
              <option value="">Select a Vehicle</option>
              {availableVehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.registration_number} - {v.vehicle_name} (Max: {v.maximum_load_capacity} kg)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="driverId">Assign Driver (Available & Valid License)</label>
            <select
              id="driverId"
              className="form-control"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              required
            >
              <option value="">Select a Driver</option>
              {availableDrivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} (Safety: {d.safety_score}%)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="source">Source Location</label>
              <input
                id="source"
                type="text"
                className="form-control"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Warehouse Mumbai"
                required
              />
            </div>
            <div>
              <label htmlFor="destination">Destination Location</label>
              <input
                id="destination"
                type="text"
                className="form-control"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Retail Hub Pune"
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label htmlFor="cargoWeight">Cargo Weight (kg)</label>
              <input
                id="cargoWeight"
                type="number"
                step="0.1"
                className="form-control"
                value={cargoWeight}
                onChange={(e) => setCargoWeight(e.target.value)}
                placeholder="e.g. 1500"
                required
              />
            </div>
            <div>
              <label htmlFor="plannedDistance">Planned Distance (km)</label>
              <input
                id="plannedDistance"
                type="number"
                step="0.1"
                className="form-control"
                value={plannedDistance}
                onChange={(e) => setPlannedDistance(e.target.value)}
                placeholder="e.g. 150"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="revenue">Planned Revenue (₹)</label>
            <input
              id="revenue"
              type="number"
              step="0.01"
              className="form-control"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              placeholder="e.g. 45000"
              required
            />
          </div>
        </form>
      </Modal>

      {/* Complete Modal */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title={selectedTrip ? `Complete Trip #${selectedTrip.id}` : 'Complete Trip'}
        footer={completeModalFooter}
      >
        <form onSubmit={handleCompleteTrip}>
          <div className="form-group">
            <label htmlFor="actualDistance">Actual Travelled Distance (km)</label>
            <input
              id="actualDistance"
              type="number"
              step="0.1"
              className="form-control"
              value={actualDistance}
              onChange={(e) => setActualDistance(e.target.value)}
              placeholder="e.g. 152.3"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="fuelConsumed">Fuel Consumed (Liters)</label>
            <input
              id="fuelConsumed"
              type="number"
              step="0.1"
              className="form-control"
              value={fuelConsumed}
              onChange={(e) => setFuelConsumed(e.target.value)}
              placeholder="e.g. 45"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="finalOdometer">Final Vehicle Odometer (km)</label>
            <input
              id="finalOdometer"
              type="number"
              className="form-control"
              value={finalOdometer}
              onChange={(e) => setFinalOdometer(e.target.value)}
              placeholder="Current + distance"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Trips;
