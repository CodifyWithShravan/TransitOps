import { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  PlusIcon,
  EyeIcon,
  RefreshCwIcon,
  MailIcon,
  AlertTriangleIcon,
  CheckIcon,
  CheckCircleIcon,
  XIcon,
  ClockIcon,
} from "./Icons";

export default function DriversView({ currentUser }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const canManageDrivers = currentUser?.role === "FLEET_MANAGER" || currentUser?.role === "SAFETY_OFFICER";

  const [formData, setFormData] = useState({
    name: "",
    licenseNumber: "",
    licenseCategory: "Commercial",
    licenseExpiryDate: "2027-12-31",
    contactNumber: "+1 555-0100",
    safetyScore: 95.0,
    status: "AVAILABLE",
  });

  useEffect(() => {
    loadDrivers();
  }, [statusFilter]);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const data = await api.getDrivers(statusFilter || undefined);
      setDrivers(data || []);
    } catch (err) {
      console.error("Failed to load drivers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    if (!canManageDrivers) {
      alert("Access Denied: Only Safety Officers and Fleet Managers can register drivers.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await api.createDriver({
        ...formData,
        safetyScore: Number(formData.safetyScore),
      });
      setIsModalOpen(false);
      setFormData({
        name: "",
        licenseNumber: "",
        licenseCategory: "Commercial",
        licenseExpiryDate: "2027-12-31",
        contactNumber: "+1 555-0100",
        safetyScore: 95.0,
        status: "AVAILABLE",
      });
      loadDrivers();
    } catch (err) {
      setFormError(err.message || "Failed to create driver");
    } finally {
      setSubmitting(false);
    }
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 30;
  };

  const handleSendReminder = async (driver) => {
    try {
      await api.sendDriverExpiryReminder(driver.id);
      setActionMessage(`Email reminder dispatched to ${driver.name} (${driver.contactNumber}) & Safety Board!`);
      setTimeout(() => setActionMessage(""), 5000);
    } catch (err) {
      alert("Failed to send reminder: " + err.message);
    }
  };

  const handleUpdateStatus = async (driver, newStatus) => {
    if (!canManageDrivers) {
      alert("Access Denied: Only Safety Officers or Fleet Managers can change driver duty status.");
      return;
    }
    try {
      await api.updateDriver(driver.id, {
        name: driver.name,
        licenseNumber: driver.licenseNumber,
        licenseCategory: driver.licenseCategory,
        licenseExpiryDate: driver.licenseExpiryDate,
        contactNumber: driver.contactNumber,
        safetyScore: driver.safetyScore,
        status: newStatus,
      });
      loadDrivers();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (d.name || "").toLowerCase().includes(q) ||
      (d.licenseNumber || "").toLowerCase().includes(q) ||
      (d.licenseCategory || "").toLowerCase().includes(q) ||
      (d.contactNumber || "").toLowerCase().includes(q) ||
      (d.status || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="drivers-view">
      <div className="view-header">
        <div>
          <h2>Driver Compliance & Safety Roster</h2>
          <p>Monitor driver safety records, license validity, contact numbers, and duty states</p>
        </div>
        {canManageDrivers ? (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <PlusIcon size={14} />
            <span>Register New Driver</span>
          </button>
        ) : (
          <div className="role-restriction-pill">
            <EyeIcon size={13} />
            <span>Read-Only Mode</span>
            <small>Requires Safety Officer or Fleet Manager</small>
          </div>
        )}
      </div>

      {actionMessage && (
        <div style={{ background: "var(--emerald-bg)", border: "1px solid var(--emerald-border)", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", color: "var(--emerald)", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircleIcon size={16} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>Status Filter:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="OFF_DUTY">Off Duty</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        <div className="filter-group" style={{ flex: 1, minWidth: "220px" }}>
          <label>Search Driver Roster:</label>
          <input
            type="text"
            placeholder="Search driver name, license #, contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="btn-secondary" onClick={loadDrivers}>
          <RefreshCwIcon size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="view-loading">
          <div className="spinner"></div>
          <p>Loading drivers roster...</p>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="empty-card">
          <p>No drivers match the selected filter or search criteria.</p>
        </div>
      ) : (
        <div className="card-grid">
          {filteredDrivers.map((d) => {
            const expired = isExpired(d.licenseExpiryDate);
            const expiringSoon = !expired && isExpiringSoon(d.licenseExpiryDate);

            return (
              <div key={d.id} className="driver-card" style={{ border: expired ? "1px solid rgba(239, 68, 68, 0.5)" : "none" }}>
                <div className="card-top">
                  <div className="driver-avatar-circle">
                    {d.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className={`status-pill status-${(d.status || "AVAILABLE").toLowerCase()}`}>
                    {d.status === "ON_TRIP" ? "ON TRIP" : d.status}
                  </span>
                </div>

                <h3 className="card-title">{d.name}</h3>
                <div className="driver-contact">{d.contactNumber || "+1 555-0000"}</div>

                <div className="safety-meter-wrap">
                  <div className="safety-meter-label">
                    <span>Safety Score</span>
                    <strong>{d.safetyScore}%</strong>
                  </div>
                  <div className="safety-meter-track">
                    <div
                      className="safety-meter-fill"
                      style={{
                        width: `${Math.min(100, d.safetyScore || 0)}%`,
                        background:
                          d.safetyScore >= 90
                            ? "#16a34a"
                            : d.safetyScore >= 75
                            ? "#f59e0b"
                            : "#ef4444",
                      }}
                    ></div>
                  </div>
                </div>

                <div className="card-specs">
                  <div className="spec-row">
                    <span>License No.</span>
                    <strong>{d.licenseNumber}</strong>
                  </div>
                  <div className="spec-row">
                    <span>Category</span>
                    <strong>{d.licenseCategory}</strong>
                  </div>
                  <div className="spec-row">
                    <span>Expiry Date</span>
                    <div>
                      <strong>{d.licenseExpiryDate}</strong>
                      {expired && (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "var(--rose)", fontWeight: "700", marginTop: "2px" }}>
                          <AlertTriangleIcon size={11} /> EXPIRED (BARRED)
                        </span>
                      )}
                      {expiringSoon && (
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "var(--amber)", fontWeight: "700", marginTop: "2px" }}>
                          <ClockIcon size={11} /> EXPIRES SOON (&lt;30d)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Compliance & Status Controls */}
                <div style={{ marginTop: "14px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(expired || expiringSoon) && (
                    <button
                      className="btn-secondary"
                      style={{ fontSize: "11px", padding: "6px 8px", background: "var(--amber-bg)", color: "var(--amber)", border: "1px solid var(--amber-border)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      onClick={() => handleSendReminder(d)}
                      title="Send automated email reminder to driver and safety officer"
                    >
                      <MailIcon size={13} />
                      <span>Send Renewal Email Notice</span>
                    </button>
                  )}

                  {canManageDrivers && (
                    <div style={{ display: "flex", gap: "6px", fontSize: "11px" }}>
                      {d.status !== "AVAILABLE" && !expired && (
                        <button
                          className="btn-action-success"
                          style={{ flex: 1, padding: "5px", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                          onClick={() => handleUpdateStatus(d, "AVAILABLE")}
                        >
                          <CheckIcon size={12} /> Set Available
                        </button>
                      )}
                      {d.status === "AVAILABLE" && (
                        <button
                          className="btn-secondary"
                          style={{ flex: 1, padding: "5px" }}
                          onClick={() => handleUpdateStatus(d, "OFF_DUTY")}
                        >
                          Off Duty
                        </button>
                      )}
                      {d.status !== "SUSPENDED" && (
                        <button
                          className="btn-action-danger"
                          style={{ flex: 1, padding: "5px" }}
                          onClick={() => handleUpdateStatus(d, "SUSPENDED")}
                        >
                          Suspend
                        </button>
                      )}
                      {d.status === "SUSPENDED" && (
                        <button
                          className="btn-action-success"
                          style={{ flex: 1, padding: "5px" }}
                          onClick={() => handleUpdateStatus(d, "AVAILABLE")}
                        >
                          Reinstate
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Driver Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Register New Operator Driver</h3>
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

            <form onSubmit={handleCreateDriver}>
              <div className="form-group">
                <label>Full Operator Name</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Alex Morgan"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>License Number</label>
                  <input
                    required
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    placeholder="DL-NY-98214"
                  />
                </div>
                <div className="form-group">
                  <label>License Category</label>
                  <select
                    value={formData.licenseCategory}
                    onChange={(e) => setFormData({ ...formData, licenseCategory: e.target.value })}
                  >
                    <option value="Commercial">Commercial</option>
                    <option value="Heavy">Heavy</option>
                    <option value="Hazmat">Hazmat</option>
                    <option value="Light">Light</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>License Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={formData.licenseExpiryDate}
                    onChange={(e) => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Initial Safety Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formData.safetyScore}
                    onChange={(e) => setFormData({ ...formData, safetyScore: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Contact Phone Number</label>
                <input
                  required
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="+1 555-0145"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Registering..." : "Confirm Driver Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
