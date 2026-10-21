import { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  PlusIcon,
  EyeIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  XIcon,
  AlertTriangleIcon,
  CheckIcon,
  ChevronRightIcon,
  BanIcon,
  BoltIcon,
} from "./Icons";

export default function TripsView({ currentUser }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const canDispatch = currentUser?.role === "FLEET_MANAGER" || currentUser?.role === "DISPATCHER";

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [activeTripForComplete, setActiveTripForComplete] = useState(null);

  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [completeSubmitting, setCompleteSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [createData, setCreateData] = useState({
    vehicleId: "",
    driverId: "",
    source: "Depot North Hub",
    destination: "",
    cargoWeight: 450,
    plannedDistance: 120,
    revenue: 950.0,
    autoDispatch: false,
  });

  const [completeData, setCompleteData] = useState({
    finalOdometer: 0,
    fuelConsumed: 25.0,
    fuelCost: 40.0,
    actualDistance: 120.0,
  });

  useEffect(() => {
    loadTrips();
  }, [statusFilter]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const data = await api.getTrips(statusFilter || undefined);
      setTrips(data || []);
    } catch (err) {
      console.error("Failed to load trips:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = async () => {
    if (!canDispatch) {
      alert("Access Denied: Only Dispatchers and Fleet Managers can create new trips.");
      return;
    }
    setFormError("");
    try {
      const [vehicles, drivers] = await Promise.all([
        api.getAvailableVehicles(),
        api.getAvailableDrivers(),
      ]);
      setAvailableVehicles(vehicles || []);
      setAvailableDrivers(drivers || []);

      if (vehicles?.length > 0) {
        setCreateData((prev) => ({ ...prev, vehicleId: vehicles[0].id }));
      }
      if (drivers?.length > 0) {
        setCreateData((prev) => ({ ...prev, driverId: drivers[0].id }));
      }
      setIsCreateModalOpen(true);
    } catch (err) {
      alert("Failed to load available fleet/drivers: " + err.message);
    }
  };

  const selectedVehicle = availableVehicles.find(
    (v) => String(v.id) === String(createData.vehicleId)
  );

  const isOverweight =
    selectedVehicle && createData.cargoWeight > selectedVehicle.maxCapacity;

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!canDispatch) {
      alert("Access Denied: You do not have permission to dispatch trips.");
      return;
    }

    if (isOverweight) {
      setFormError(
        `Cargo weight (${createData.cargoWeight} kg) exceeds vehicle max load capacity (${selectedVehicle.maxCapacity} kg)!`
      );
      return;
    }

    setCreateSubmitting(true);
    setFormError("");
    try {
      await api.createTrip({
        vehicleId: Number(createData.vehicleId),
        driverId: Number(createData.driverId),
        source: createData.source.trim(),
        destination: createData.destination.trim(),
        cargoWeight: Number(createData.cargoWeight),
        plannedDistance: Number(createData.plannedDistance),
        revenue: Number(createData.revenue || 0),
        autoDispatch: createData.autoDispatch,
      });
      setIsCreateModalOpen(false);
      loadTrips();
    } catch (err) {
      setFormError(err.message || "Failed to create trip");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDispatchTrip = async (id) => {
    if (!canDispatch) {
      alert("Access Denied: Only Dispatchers and Fleet Managers can dispatch trips.");
      return;
    }
    try {
      await api.dispatchTrip(id);
      loadTrips();
    } catch (err) {
      alert("Failed to dispatch: " + err.message);
    }
  };

  const openCompleteModal = (trip) => {
    if (!canDispatch) {
      alert("Access Denied: Only Dispatchers and Fleet Managers can complete trips.");
      return;
    }
    setActiveTripForComplete(trip);
    const startOdo = trip.startOdometer || trip.vehicle?.odometer || 10000;
    const estDistance = trip.plannedDistance || 100;
    setCompleteData({
      finalOdometer: startOdo + estDistance,
      fuelConsumed: Math.round(estDistance * 0.18 * 10) / 10,
      fuelCost: Math.round(estDistance * 0.18 * 1.6 * 100) / 100,
      actualDistance: estDistance,
    });
    setIsCompleteModalOpen(true);
  };

  const handleCompleteTrip = async (e) => {
    e.preventDefault();
    if (!activeTripForComplete) return;
    if (!canDispatch) {
      alert("Access Denied: You do not have permission to complete trips.");
      return;
    }

    const startOdo = activeTripForComplete.startOdometer || activeTripForComplete.vehicle?.odometer || 0;
    if (Number(completeData.finalOdometer) < startOdo) {
      alert(`Final odometer reading (${completeData.finalOdometer}) cannot be less than initial odometer (${startOdo})!`);
      return;
    }

    setCompleteSubmitting(true);
    try {
      await api.completeTrip(activeTripForComplete.id, {
        finalOdometer: Number(completeData.finalOdometer),
        fuelConsumed: Number(completeData.fuelConsumed),
        fuelCost: Number(completeData.fuelCost),
        actualDistance: Number(completeData.actualDistance),
      });
      setIsCompleteModalOpen(false);
      setActiveTripForComplete(null);
      loadTrips();
    } catch (err) {
      alert("Failed to complete trip: " + err.message);
    } finally {
      setCompleteSubmitting(false);
    }
  };

  const handleCancelTrip = async (id) => {
    if (!canDispatch) {
      alert("Access Denied: Only Dispatchers and Fleet Managers can cancel trips.");
      return;
    }
    if (!confirm("Are you sure you want to cancel this trip? Asset statuses will be restored to AVAILABLE.")) {
      return;
    }
    try {
      await api.cancelTrip(id);
      loadTrips();
    } catch (err) {
      alert("Failed to cancel trip: " + err.message);
    }
  };

  const filteredTrips = trips.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.tripCode || "").toLowerCase().includes(q) ||
      (t.source || "").toLowerCase().includes(q) ||
      (t.destination || "").toLowerCase().includes(q) ||
      (t.vehicle?.registrationNumber || "").toLowerCase().includes(q) ||
      (t.driver?.name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="trips-view">
      <div className="view-header">
        <div>
          <h2>Trip Dispatch & Manifest Board</h2>
          <p>Enforce cargo limits, driver license eligibility, and automatic status transitions</p>
        </div>
        {canDispatch ? (
          <button className="btn-primary" onClick={openCreateModal}>
            <PlusIcon size={14} />
            <span>Schedule New Trip</span>
          </button>
        ) : (
          <div className="role-restriction-pill">
            <EyeIcon size={13} />
            <span>Read-Only Mode</span>
            <small>Requires Dispatcher or Fleet Manager</small>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="DISPATCHED">Dispatched (On Trip)</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="filter-group" style={{ flex: 1, minWidth: "220px" }}>
          <label>Search Manifest:</label>
          <input
            type="text"
            placeholder="Search Trip #, source, destination, vehicle, driver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="btn-secondary" onClick={loadTrips}>
          <RefreshCwIcon size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Trips Table */}
      <div className="table-container">
        <div className="table-header">
          <h3>Manifest Ledger</h3>
          <span className="table-caption">{filteredTrips.length} trips tracked</span>
        </div>

        <table className="ops-table">
          <thead>
            <tr>
              <th>Trip Code</th>
              <th>Route (Source → Destination)</th>
              <th>Vehicle Assigned</th>
              <th>Driver Assigned</th>
              <th>Cargo & Distance</th>
              <th>Revenue ($)</th>
              <th>Status</th>
              <th>Lifecycle Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "30px" }}>
                  <div className="spinner" style={{ margin: "0 auto 10px" }}></div>
                  Loading trip manifests...
                </td>
              </tr>
            ) : filteredTrips.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "30px" }}>
                  No trips match the current filter or search criteria.
                </td>
              </tr>
            ) : (
              filteredTrips.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.tripCode || `TRIP-${t.id}`}</strong>
                  </td>
                  <td>
                    <span className="route-tag">
                      {t.source || t.origin || "Origin Depot"} → {t.destination}
                    </span>
                  </td>
                  <td>
                    {t.vehicle ? (
                      <div>
                        <strong>{t.vehicle.registrationNumber}</strong>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                          {t.vehicle.model} (Max: {t.vehicle.maxCapacity} kg)
                        </div>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td>
                    {t.driver ? (
                      <div>
                        <strong>{t.driver.name}</strong>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                          {t.driver.licenseCategory} • Score: {t.driver.safetyScore}%
                        </div>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td>
                    <div>
                      <strong>{t.cargoWeight} kg</strong>
                    </div>
                    <small style={{ color: "var(--muted)" }}>
                      {t.actualDistance ? `${t.actualDistance} km (actual)` : `${t.plannedDistance} km (planned)`}
                    </small>
                  </td>
                  <td>
                    <strong>${Number(t.revenue || 0).toLocaleString()}</strong>
                  </td>
                  <td>
                    <span className={`status-pill status-${(t.status || "DRAFT").toLowerCase()}`}>
                      {t.status === "DISPATCHED" ? "ON TRIP" : t.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons-cell">
                      {canDispatch ? (
                        <>
                          {t.status === "DRAFT" && (
                            <button
                              className="btn-action-primary"
                              onClick={() => handleDispatchTrip(t.id)}
                              title="Dispatch: sets vehicle & driver to ON_TRIP"
                            >
                              <BoltIcon size={13} />
                              <span>Dispatch</span>
                            </button>
                          )}
                          {t.status === "DISPATCHED" && (
                            <button
                              className="btn-action-success"
                              onClick={() => openCompleteModal(t)}
                              title="Complete: enters final odometer & restores to AVAILABLE"
                            >
                              <CheckCircleIcon size={13} />
                              <span>Complete</span>
                            </button>
                          )}
                          {(t.status === "DRAFT" || t.status === "DISPATCHED") && (
                            <button
                              className="btn-action-danger"
                              onClick={() => handleCancelTrip(t.id)}
                              title="Cancel: restores assets to AVAILABLE"
                            >
                              <XIcon size={13} />
                              <span>Cancel</span>
                            </button>
                          )}
                          {t.status === "COMPLETED" && (
                            <span style={{ fontSize: "12px", color: "var(--emerald)", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                              <CheckIcon size={13} /> Finalized
                            </span>
                          )}
                          {t.status === "CANCELLED" && (
                            <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px" }}>
                              <BanIcon size={13} /> Cancelled
                            </span>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--muted)", fontStyle: "italic" }}>
                          Audit View Only
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Trip Modal */}
      {isCreateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h3>Schedule New Trip Manifest</h3>
              <button className="modal-close-btn" onClick={() => setIsCreateModalOpen(false)}>
                <XIcon size={16} />
              </button>
            </div>

            {formError && (
              <div className="modal-error">
                <AlertTriangleIcon size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTrip}>
              <div className="form-row">
                <div className="form-group">
                  <label>Assign Vehicle (Available Only)</label>
                  <select
                    required
                    value={createData.vehicleId}
                    onChange={(e) => setCreateData({ ...createData, vehicleId: e.target.value })}
                  >
                    {availableVehicles.length === 0 ? (
                      <option value="">No vehicles currently available</option>
                    ) : (
                      availableVehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.registrationNumber} - {v.model} (Max: {v.maxCapacity} kg)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>Assign Driver (Eligible & Valid License)</label>
                  <select
                    required
                    value={createData.driverId}
                    onChange={(e) => setCreateData({ ...createData, driverId: e.target.value })}
                  >
                    {availableDrivers.length === 0 ? (
                      <option value="">No eligible drivers available</option>
                    ) : (
                      availableDrivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.licenseCategory} - Score: {d.safetyScore}%)
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Source Location</label>
                  <input
                    required
                    value={createData.source}
                    onChange={(e) => setCreateData({ ...createData, source: e.target.value })}
                    placeholder="e.g. New York Central Hub"
                  />
                </div>
                <div className="form-group">
                  <label>Destination Location</label>
                  <input
                    required
                    value={createData.destination}
                    onChange={(e) => setCreateData({ ...createData, destination: e.target.value })}
                    placeholder="e.g. Boston Distribution Center"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cargo Weight (kg)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={createData.cargoWeight}
                    onChange={(e) => setCreateData({ ...createData, cargoWeight: Number(e.target.value) })}
                  />
                  {selectedVehicle && (
                    <small style={{ color: isOverweight ? "#ef4444" : "var(--muted)", fontWeight: isOverweight ? "bold" : "normal" }}>
                      Vehicle Max Capacity: {selectedVehicle.maxCapacity} kg
                      {isOverweight && " (EXCEEDS LIMIT!)"}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Planned Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={createData.plannedDistance}
                    onChange={(e) => setCreateData({ ...createData, plannedDistance: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>Contracted Revenue ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={createData.revenue}
                    onChange={(e) => setCreateData({ ...createData, revenue: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                <input
                  type="checkbox"
                  id="autoDispatchCheck"
                  checked={createData.autoDispatch}
                  onChange={(e) => setCreateData({ ...createData, autoDispatch: e.target.checked })}
                />
                <label htmlFor="autoDispatchCheck" style={{ margin: 0, cursor: "pointer" }}>
                  <strong>Auto-Dispatch immediately</strong> (transition vehicle & driver to ON_TRIP upon creation)
                </label>
              </div>

              <div className="modal-actions" style={{ marginTop: "20px" }}>
                <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createSubmitting || isOverweight || availableVehicles.length === 0 || availableDrivers.length === 0}
                >
                  {createSubmitting ? "Scheduling..." : "Confirm & Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {isCompleteModalOpen && activeTripForComplete && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h3>Complete Trip {activeTripForComplete.tripCode || `#${activeTripForComplete.id}`}</h3>
              <button className="modal-close-btn" onClick={() => setIsCompleteModalOpen(false)}>
                <XIcon size={16} />
              </button>
            </div>

            <div style={{ background: "var(--emerald-bg)", border: "1px solid var(--emerald-border)", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
              <p style={{ margin: 0, fontSize: "13px" }}>
                Route: <strong>{activeTripForComplete.source || activeTripForComplete.origin} → {activeTripForComplete.destination}</strong>
              </p>
              <small style={{ color: "var(--muted)" }}>
                Vehicle: <strong>{activeTripForComplete.vehicle?.registrationNumber}</strong> (Start Odometer: {activeTripForComplete.startOdometer || activeTripForComplete.vehicle?.odometer || 0} km)
                &bull; Driver: <strong>{activeTripForComplete.driver?.name}</strong>
              </small>
            </div>

            <form onSubmit={handleCompleteTrip}>
              <div className="form-group">
                <label>Final Odometer Reading (km)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  min={activeTripForComplete.startOdometer || activeTripForComplete.vehicle?.odometer || 0}
                  value={completeData.finalOdometer}
                  onChange={(e) => {
                    const finalOdo = Number(e.target.value);
                    const startOdo = activeTripForComplete.startOdometer || activeTripForComplete.vehicle?.odometer || 0;
                    const diff = Math.max(0, finalOdo - startOdo);
                    setCompleteData({
                      ...completeData,
                      finalOdometer: finalOdo,
                      actualDistance: diff,
                      fuelConsumed: Math.round(diff * 0.18 * 10) / 10,
                      fuelCost: Math.round(diff * 0.18 * 1.6 * 100) / 100,
                    });
                  }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fuel Consumed (Liters)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={completeData.fuelConsumed}
                    onChange={(e) => setCompleteData({ ...completeData, fuelConsumed: Number(e.target.value) })}
                  />
                  <small style={{ color: "var(--muted)" }}>Automatically logs to vehicle fuel ledger</small>
                </div>

                <div className="form-group">
                  <label>Fuel Expense Total ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={completeData.fuelCost}
                    onChange={(e) => setCompleteData({ ...completeData, fuelCost: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Actual Distance Traveled (km)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={completeData.actualDistance}
                  onChange={(e) => setCompleteData({ ...completeData, actualDistance: Number(e.target.value) })}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: "20px" }}>
                <button type="button" className="btn-secondary" onClick={() => setIsCompleteModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={completeSubmitting}>
                  <CheckCircleIcon size={14} />
                  <span>{completeSubmitting ? "Finalizing..." : "Finalize Trip & Restore Availability"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
