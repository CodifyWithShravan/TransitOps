import { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  PlusIcon,
  EyeIcon,
  RefreshCwIcon,
  FileTextIcon,
  BanIcon,
  XIcon,
  AlertTriangleIcon,
  CheckIcon,
  PaperclipIcon,
} from "./Icons";

export default function VehiclesView({ currentUser }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Document Management Modal State (Bonus Feature)
  const [selectedVehicleForDocs, setSelectedVehicleForDocs] = useState(null);
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [vehicleDocs, setVehicleDocs] = useState({
    "Van-05": [
      { id: 1, name: "DOT Registration Certificate.pdf", type: "Registration", validUntil: "2027-05-15", status: "VALID" },
      { id: 2, name: "Comprehensive Fleet Insurance.pdf", type: "Insurance", validUntil: "2027-01-30", status: "VALID" },
      { id: 3, name: "Annual 50k Inspection Report.pdf", type: "Safety Inspection", validUntil: "2026-11-20", status: "VALID" },
    ],
    "Truck-01": [
      { id: 1, name: "Interstate Heavy Haul Permit.pdf", type: "Permit", validUntil: "2026-12-31", status: "VALID" },
      { id: 2, name: "Commercial Liability Insurance.pdf", type: "Insurance", validUntil: "2027-03-10", status: "VALID" },
    ],
  });

  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState("Insurance");

  const isManager = currentUser?.role === "FLEET_MANAGER";

  const [formData, setFormData] = useState({
    registrationNumber: "",
    model: "",
    type: "Van",
    maxCapacity: 1000,
    odometer: 10000,
    acquisitionCost: 45000,
    region: "Central",
  });

  useEffect(() => {
    loadVehicles();
  }, [typeFilter, statusFilter, regionFilter]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (regionFilter) params.region = regionFilter;
      const data = await api.getVehicles(params);
      setVehicles(data || []);
    } catch (err) {
      console.error("Failed to load vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    if (!isManager) {
      alert("Access Denied: Only Fleet Managers can register vehicles.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await api.createVehicle({
        ...formData,
        maxCapacity: Number(formData.maxCapacity),
        odometer: Number(formData.odometer),
        acquisitionCost: Number(formData.acquisitionCost),
      });
      setIsModalOpen(false);
      setFormData({
        registrationNumber: "",
        model: "",
        type: "Van",
        maxCapacity: 1000,
        odometer: 10000,
        acquisitionCost: 45000,
        region: "Central",
      });
      loadVehicles();
    } catch (err) {
      setFormError(err.message || "Failed to create vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetireVehicle = async (id, reg) => {
    if (!isManager) {
      alert("Access Denied: Only Fleet Managers can retire fleet assets.");
      return;
    }
    if (!confirm(`Are you sure you want to permanently RETIRE vehicle '${reg}'? Retired vehicles are permanently barred from trip dispatching.`)) {
      return;
    }
    try {
      await api.retireVehicle(id);
      loadVehicles();
    } catch (err) {
      alert("Failed to retire vehicle: " + err.message);
    }
  };

  const openDocumentsModal = (v) => {
    setSelectedVehicleForDocs(v);
    setDocsModalOpen(true);
    setNewDocName("");
  };

  const handleAddDocument = (e) => {
    e.preventDefault();
    if (!newDocName.trim() || !selectedVehicleForDocs) return;
    const reg = selectedVehicleForDocs.registrationNumber;
    const currentList = vehicleDocs[reg] || [];
    const newDoc = {
      id: Date.now(),
      name: newDocName.trim().endsWith(".pdf") ? newDocName.trim() : `${newDocName.trim()}.pdf`,
      type: newDocType,
      validUntil: "2027-12-31",
      status: "VALID",
    };
    setVehicleDocs({
      ...vehicleDocs,
      [reg]: [...currentList, newDoc],
    });
    setNewDocName("");
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (v.registrationNumber || "").toLowerCase().includes(q) ||
      (v.model || "").toLowerCase().includes(q) ||
      (v.type || "").toLowerCase().includes(q) ||
      (v.region || "").toLowerCase().includes(q) ||
      (v.status || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="vehicles-view">
      <div className="view-header">
        <div>
          <h2>Fleet Vehicle Master Registry</h2>
          <p>Lifecycle tracking, registration verification, load limits, and compliance documents</p>
        </div>
        {isManager ? (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <PlusIcon size={14} />
            <span>Register New Vehicle</span>
          </button>
        ) : (
          <div className="role-restriction-pill">
            <EyeIcon size={13} />
            <span>Read-Only Mode</span>
            <small>Requires Fleet Manager to modify assets</small>
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>Type:</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="Van">Van</option>
            <option value="Truck">Truck</option>
            <option value="Trailer">Trailer</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="IN_SHOP">In Shop</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Region:</label>
          <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
            <option value="">All Regions</option>
            <option value="North">North</option>
            <option value="Central">Central</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
          </select>
        </div>

        <div className="filter-group" style={{ flex: 1, minWidth: "220px" }}>
          <label>Search Fleet:</label>
          <input
            type="text"
            placeholder="Search registration, model, type, region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="btn-secondary" onClick={loadVehicles}>
          <RefreshCwIcon size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Vehicle Grid Cards */}
      {loading ? (
        <div className="view-loading">
          <div className="spinner"></div>
          <p>Loading fleet vehicles...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="empty-card">
          <p>No vehicles match the selected filter or search criteria.</p>
        </div>
      ) : (
        <div className="card-grid">
          {filteredVehicles.map((v) => (
            <div key={v.id} className="vehicle-card">
              <div className="card-top">
                <span className="card-reg">{v.registrationNumber}</span>
                <span className={`status-pill status-${(v.status || "AVAILABLE").toLowerCase()}`}>
                  {v.status === "ON_TRIP" ? "ON TRIP" : v.status}
                </span>
              </div>

              <h3 className="card-title">{v.model}</h3>

              <div className="card-specs">
                <div className="spec-row">
                  <span>Category</span>
                  <strong>{v.type}</strong>
                </div>
                <div className="spec-row">
                  <span>Max Payload</span>
                  <strong>{v.maxCapacity} kg</strong>
                </div>
                <div className="spec-row">
                  <span>Odometer</span>
                  <strong>{Number(v.odometer).toLocaleString()} km</strong>
                </div>
                <div className="spec-row">
                  <span>Assigned Region</span>
                  <strong>{v.region || "Central"}</strong>
                </div>
                <div className="spec-row">
                  <span>Acquisition Cost</span>
                  <strong>${Number(v.acquisitionCost || 0).toLocaleString()}</strong>
                </div>
              </div>

              <div className="card-actions" style={{ display: "flex", gap: "8px", marginTop: "14px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, fontSize: "12px", padding: "6px" }}
                  onClick={() => openDocumentsModal(v)}
                >
                  <FileTextIcon size={13} />
                  <span>Docs ({(vehicleDocs[v.registrationNumber] || []).length})</span>
                </button>
                {isManager && v.status !== "RETIRED" && (
                  <button
                    className="btn-action-danger"
                    style={{ fontSize: "12px", padding: "6px 10px" }}
                    onClick={() => handleRetireVehicle(v.id, v.registrationNumber)}
                    title="Retire Vehicle from Fleet"
                  >
                    <BanIcon size={13} />
                    <span>Retire</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Register New Fleet Asset</h3>
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

            <form onSubmit={handleCreateVehicle}>
              <div className="form-group">
                <label>Unique Registration Number (e.g. Van-05)</label>
                <input
                  required
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  placeholder="e.g. Van-05"
                />
              </div>

              <div className="form-group">
                <label>Make & Model</label>
                <input
                  required
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g. Ford Transit Custom / Volvo FH16"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                    <option value="Trailer">Trailer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Max Load Capacity (kg)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Initial Odometer (km)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.odometer}
                    onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Operating Region</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  >
                    <option value="North">North</option>
                    <option value="Central">Central</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Acquisition Cost ($)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.acquisitionCost}
                  onChange={(e) => setFormData({ ...formData, acquisitionCost: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Registering..." : "Confirm Asset Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Documents & Compliance Modal (Bonus Feature 8) */}
      {docsModalOpen && selectedVehicleForDocs && (
        <div className="modal-backdrop">
          <div className="modal-box" style={{ maxWidth: "580px" }}>
            <div className="modal-header">
              <div>
                <h3>Compliance Documents: {selectedVehicleForDocs.registrationNumber}</h3>
                <small style={{ color: "var(--muted)" }}>{selectedVehicleForDocs.model} • {selectedVehicleForDocs.type}</small>
              </div>
              <button className="modal-close-btn" onClick={() => setDocsModalOpen(false)}>
                <XIcon size={16} />
              </button>
            </div>

            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "10px" }}>
                Filed Official Certificates & Permits:
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
                {(vehicleDocs[selectedVehicleForDocs.registrationNumber] || []).length === 0 ? (
                  <p style={{ color: "var(--muted)", fontSize: "13px", fontStyle: "italic" }}>
                    No documents uploaded yet for this vehicle asset.
                  </p>
                ) : (
                  (vehicleDocs[selectedVehicleForDocs.registrationNumber] || []).map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "8px",
                      }}
                    >
                      <div>
                        <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <FileTextIcon size={14} />
                          {doc.name}
                        </strong>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>
                          Category: {doc.type} &bull; Valid Until: {doc.validUntil}
                        </div>
                      </div>
                      <span className="status-pill status-available" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <CheckIcon size={12} /> VERIFIED
                      </span>
                    </div>
                  ))
                )}
              </div>

              {isManager && (
                <form onSubmit={handleAddDocument} style={{ marginTop: "20px", borderTop: "1px solid var(--border-subtle)", paddingTop: "16px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "10px" }}>
                    Upload New Compliance File:
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ flex: 2 }}>
                      <label>Document Title</label>
                      <input
                        required
                        placeholder="e.g. 2026 Emissions Inspection.pdf"
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Category</label>
                      <select value={newDocType} onChange={(e) => setNewDocType(e.target.value)}>
                        <option value="Registration">Registration</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Safety Inspection">Inspection</option>
                        <option value="Permit">Permit</option>
                      </select>
                    </div>
                  </div>

                  <div className="modal-actions" style={{ marginTop: "12px" }}>
                    <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                      <PaperclipIcon size={14} />
                      <span>Attach Document</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
