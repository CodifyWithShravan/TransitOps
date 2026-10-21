import { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  PlusIcon,
  EyeIcon,
  WrenchIcon,
  CreditCardIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  CheckIcon,
  XIcon,
  AlertTriangleIcon,
} from "./Icons";

export default function MaintenanceView({ currentUser }) {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Complete work order modal state
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedLogForComplete, setSelectedLogForComplete] = useState(null);
  const [finalCost, setFinalCost] = useState(450);

  const canManageShop = currentUser?.role === "FLEET_MANAGER" || currentUser?.role === "SAFETY_OFFICER";

  const [formData, setFormData] = useState({
    vehicleId: "",
    serviceType: "Oil Change & Filter Replacement",
    description: "Routine scheduled 50,000 km preventative maintenance and multi-point brake inspection.",
    cost: 450.0,
    startDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadLogs();
  }, [statusFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getMaintenanceLogs(statusFilter || undefined);
      setLogs(data || []);
    } catch (err) {
      console.error("Failed to load maintenance logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = async () => {
    if (!canManageShop) {
      alert("Access Denied: Only Safety Officers and Fleet Managers can schedule maintenance.");
      return;
    }
    setFormError("");
    try {
      const vList = await api.getVehicles();
      // Filter out vehicles that are already ON_TRIP or RETIRED
      const eligibleVehicles = (vList || []).filter(
        (v) => v.status === "AVAILABLE" || v.status === "IN_SHOP"
      );
      setVehicles(eligibleVehicles);
      if (eligibleVehicles.length > 0) {
        setFormData((prev) => ({ ...prev, vehicleId: eligibleVehicles[0].id }));
      }
      setIsModalOpen(true);
    } catch (err) {
      alert("Failed to load vehicles: " + err.message);
    }
  };

  const handleCreateLog = async (e) => {
    e.preventDefault();
    if (!canManageShop) {
      alert("Access Denied: Only Safety Officers and Fleet Managers can schedule maintenance.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await api.createMaintenanceLog({
        ...formData,
        vehicleId: Number(formData.vehicleId),
        cost: Number(formData.cost),
      });
      setIsModalOpen(false);
      loadLogs();
    } catch (err) {
      setFormError(err.message || "Failed to create log");
    } finally {
      setSubmitting(false);
    }
  };

  const openCompleteModal = (log) => {
    setSelectedLogForComplete(log);
    setFinalCost(log.cost || 450);
    setCompleteModalOpen(true);
  };

  const handleCompleteLog = async (e) => {
    e.preventDefault();
    if (!selectedLogForComplete) return;
    try {
      await api.completeMaintenanceLog(selectedLogForComplete.id, Number(finalCost));
      setCompleteModalOpen(false);
      setSelectedLogForComplete(null);
      loadLogs();
    } catch (err) {
      alert("Failed to complete repair: " + err.message);
    }
  };

  const filteredLogs = logs.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (l.serviceType || "").toLowerCase().includes(q) ||
      (l.description || "").toLowerCase().includes(q) ||
      (l.vehicle?.registrationNumber || "").toLowerCase().includes(q) ||
      (l.status || "").toLowerCase().includes(q)
    );
  });

  const activeRepairsCount = logs.filter((l) => l.status === "IN_PROGRESS").length;
  const totalRepairCost = logs.reduce((acc, l) => acc + (l.cost || 0), 0);

  return (
    <div className="maintenance-view">
      <div className="view-header">
        <div>
          <h2>Vehicle Maintenance & Repair Shop</h2>
          <p>Enforce mandatory vehicle downtime rules: in-shop assets are automatically hidden from trip dispatch</p>
        </div>
        {canManageShop ? (
          <button className="btn-primary" onClick={openCreateModal}>
            <PlusIcon size={14} />
            <span>Schedule Service Order</span>
          </button>
        ) : (
          <div className="role-restriction-pill">
            <EyeIcon size={13} />
            <span>Read-Only Mode</span>
            <small>Requires Safety Officer or Fleet Manager</small>
          </div>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <div className="kpi-card" style={{ padding: "16px" }}>
          <div className="kpi-icon-wrap" style={{ background: "var(--rose-bg)", color: "var(--rose)" }}>
            <WrenchIcon size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-title">Active In-Shop Repairs</span>
            <div className="kpi-value" style={{ fontSize: "24px" }}>{activeRepairsCount}</div>
            <span className="kpi-sub">Vehicles locked to In Shop</span>
          </div>
        </div>

        <div className="kpi-card" style={{ padding: "16px" }}>
          <div className="kpi-icon-wrap" style={{ background: "var(--purple-bg)", color: "var(--purple)" }}>
            <CreditCardIcon size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-title">Total Maintenance Billed</span>
            <div className="kpi-value" style={{ fontSize: "24px" }}>${Number(totalRepairCost).toLocaleString()}</div>
            <span className="kpi-sub">Auto-logged to vehicle expense ledger</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Service Orders</option>
            <option value="IN_PROGRESS">In Progress (Active in Shop)</option>
            <option value="COMPLETED">Completed (Restored)</option>
          </select>
        </div>

        <div className="filter-group" style={{ flex: 1, minWidth: "220px" }}>
          <label>Search Work Orders:</label>
          <input
            type="text"
            placeholder="Search service type, vehicle registration, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="btn-secondary" onClick={loadLogs}>
          <RefreshCwIcon size={14} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Service Work Orders</h3>
          <span className="table-caption">{filteredLogs.length} maintenance orders</span>
        </div>

        <table className="ops-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Vehicle Asset</th>
              <th>Service Performed</th>
              <th>Work Details</th>
              <th>Estimated / Invoiced Cost</th>
              <th>Start Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "30px" }}>
                  <div className="spinner" style={{ margin: "0 auto 10px" }}></div>
                  Loading service logs...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "30px" }}>
                  No maintenance work orders found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <strong>WO-#{log.id}</strong>
                  </td>
                  <td>
                    {log.vehicle ? (
                      <div>
                        <strong>{log.vehicle.registrationNumber}</strong>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                          {log.vehicle.model} ({log.vehicle.type})
                        </div>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td>
                    <strong>{log.serviceType}</strong>
                  </td>
                  <td>
                    <div style={{ maxWidth: "260px", fontSize: "12px", color: "var(--muted)" }}>
                      {log.description || "Routine shop overhaul"}
                    </div>
                  </td>
                  <td>
                    <strong>${Number(log.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                  </td>
                  <td>{log.startDate || "Today"}</td>
                  <td>
                    <span className={`status-pill status-${(log.status || "IN_PROGRESS").toLowerCase()}`}>
                      {log.status === "IN_PROGRESS" ? "IN SHOP" : log.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons-cell">
                      {canManageShop && log.status === "IN_PROGRESS" && (
                        <button
                          className="btn-action-success"
                          onClick={() => openCompleteModal(log)}
                          title="Finalize repair and restore vehicle to AVAILABLE"
                        >
                          <CheckCircleIcon size={13} />
                          <span>Close & Release</span>
                        </button>
                      )}
                      {log.status === "COMPLETED" && (
                        <span style={{ fontSize: "12px", color: "var(--emerald)", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                          <CheckIcon size={13} /> Released ({log.completedDate})
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

      {/* Schedule Order Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: "560px" }}>
            <div className="modal-header">
              <h3>Schedule Maintenance Order</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <XIcon size={16} />
              </button>
            </div>

            {formError && (
              <div className="modal-error">
                <AlertTriangleIcon size={16} />
                <span>{formError}</span>
              </div>
            )}

            <p style={{ fontSize: "12px", color: "var(--amber)", background: "var(--amber-bg)", border: "1px solid var(--amber-border)", padding: "10px", borderRadius: "6px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <AlertTriangleIcon size={15} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span><strong>Mandatory Rule Enforcement:</strong> Submitting this order will immediately transition the selected vehicle to <strong>IN_SHOP</strong> status, barring it from dispatch eligibility.</span>
            </p>

            <form onSubmit={handleCreateLog}>
              <div className="form-group">
                <label>Select Vehicle</label>
                <select
                  required
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                >
                  {vehicles.length === 0 ? (
                    <option value="">No eligible vehicles available</option>
                  ) : (
                    vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.registrationNumber} - {v.model} ({v.type} • Status: {v.status})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Service / Repair Category</label>
                <input
                  required
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                  placeholder="e.g. Engine Overhaul, Brake Pad Replacement, Oil Change"
                />
              </div>

              <div className="form-group">
                <label>Work Order Notes / Scope</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed notes on maintenance performed..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Estimated Cost ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>Work Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: "16px" }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting || vehicles.length === 0}>
                  {submitting ? "Scheduling..." : "Submit Order & Lock In Shop"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Repair Modal */}
      {completeModalOpen && selectedLogForComplete && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <h3>Finalize Work Order WO-#{selectedLogForComplete.id}</h3>
              <button className="modal-close-btn" onClick={() => setCompleteModalOpen(false)}>
                <XIcon size={16} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>
              Closing this work order for vehicle <strong>{selectedLogForComplete.vehicle?.registrationNumber}</strong> will restore its status back to <strong>AVAILABLE</strong> and file a maintenance expense.
            </p>

            <form onSubmit={handleCompleteLog}>
              <div className="form-group">
                <label>Final Invoiced Maintenance Cost ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={finalCost}
                  onChange={(e) => setFinalCost(Number(e.target.value))}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: "20px" }}>
                <button type="button" className="btn-secondary" onClick={() => setCompleteModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <CheckCircleIcon size={14} />
                  <span>Confirm & Release to Available</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
