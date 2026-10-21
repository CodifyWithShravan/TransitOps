import { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  RefreshCwIcon,
  DownloadIcon,
  FileTextIcon,
  AlertTriangleIcon,
  ActivityIcon,
  TruckIcon,
  CheckCircleIcon,
  WrenchIcon,
  RouteIcon,
  ClockIcon,
  UsersIcon,
  DollarSignIcon,
  FuelIcon,
} from "./Icons";

export default function DashboardView({ onNavigate }) {
  const [kpis, setKpis] = useState(null);
  const [vehicleAnalytics, setVehicleAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mandatory Filter Requirements: vehicle type, status, and region
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");

  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    loadData();
  }, [typeFilter, statusFilter, regionFilter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (regionFilter) params.region = regionFilter;

      const [kpiRes, analyticsRes] = await Promise.all([
        api.getKPIs(params).catch(() => null),
        api.getVehicleAnalytics(params).catch(() => []),
      ]);
      setKpis(kpiRes);
      setVehicleAnalytics(analyticsRes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setDownloadingCsv(true);
    try {
      await api.downloadCsvReport();
    } catch (err) {
      alert("Failed to download CSV: " + err.message);
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handleExportPdf = async () => {
    setDownloadingPdf(true);
    try {
      await api.downloadPdfReport();
    } catch (err) {
      alert("Failed to download PDF: " + err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Chart data calculations
  const totalVehicles = kpis?.totalVehicles || 0;
  const availableVehicles = kpis?.availableVehicles || 0;
  const activeVehicles = kpis?.activeVehicles || 0;
  const inShopVehicles = kpis?.vehiclesInMaintenance || kpis?.vehiclesInShop || 0;
  const retiredVehicles = kpis?.retiredVehicles || 0;

  const fuelCost = kpis?.totalFuelCost || 0;
  const maintCost = kpis?.totalMaintenanceCost || 0;
  const otherCost = Math.max(0, (kpis?.totalOperationalCost || 0) - fuelCost - maintCost);
  const totalOpCost = kpis?.totalOperationalCost || (fuelCost + maintCost + otherCost) || 1;

  const fuelPct = Math.round((fuelCost / totalOpCost) * 100);
  const maintPct = Math.round((maintCost / totalOpCost) * 100);
  const otherPct = Math.max(0, 100 - fuelPct - maintPct);

  return (
    <div className="dashboard-view">
      <div className="view-header">
        <div>
          <h2>Operations Dashboard</h2>
          <p>Real-time fleet performance, dispatch readiness, and financial metrics</p>
        </div>
        <div className="view-actions">
          <button className="btn-secondary" onClick={loadData}>
            <RefreshCwIcon size={14} />
            <span>Refresh</span>
          </button>
          <button className="btn-secondary" onClick={handleExportCsv} disabled={downloadingCsv}>
            <DownloadIcon size={14} />
            <span>{downloadingCsv ? "Exporting CSV..." : "Export CSV"}</span>
          </button>
          <button className="btn-primary" onClick={handleExportPdf} disabled={downloadingPdf}>
            <FileTextIcon size={14} />
            <span>{downloadingPdf ? "Generating PDF..." : "Export Official PDF"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangleIcon size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Mandatory Filter Bar: Type, Status, Region */}
      <div className="filter-bar" style={{ marginBottom: "20px" }}>
        <div className="filter-group">
          <label>Vehicle Type:</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types (Van, Truck, Trailer)</option>
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
            <option value="IN_SHOP">In Shop (Maintenance)</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Region:</label>
          <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
            <option value="">All Operating Regions</option>
            <option value="North">North</option>
            <option value="Central">Central</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
          </select>
        </div>

        {(typeFilter || statusFilter || regionFilter) && (
          <button
            className="btn-secondary"
            onClick={() => {
              setTypeFilter("");
              setStatusFilter("");
              setRegionFilter("");
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* KPI Cards Grid (Mandatory Requirements: Active, Available, Maintenance, Active Trips, Pending Trips, Drivers On Duty, Fleet Utilization %) */}
      <div className="kpi-grid">
        {/* 1. Fleet Utilization (%) */}
        <div className="kpi-card highlight-card" onClick={() => onNavigate("vehicles")}>
          <div className="kpi-icon-wrap" style={{ background: "rgba(99, 102, 241, 0.15)", color: "var(--primary)" }}>
            <ActivityIcon size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-title">Fleet Utilization</span>
            <div className="kpi-value">{kpis?.fleetUtilization ?? 0}%</div>
            <span className="kpi-sub">
              Active / Usable Assets
            </span>
          </div>
        </div>

        {/* 2. Active Vehicles (On Trip) */}
        <div className="kpi-card" onClick={() => onNavigate("vehicles")}>
          <div className="kpi-icon-wrap" style={{ background: "var(--emerald-bg)", color: "var(--emerald)" }}>
            <TruckIcon size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-title">Active Vehicles</span>
            <div className="kpi-value">{kpis?.activeVehicles ?? 0}</div>
            <span className="kpi-sub">
              Currently On Trip
            </span>
          </div>
        </div>

        {/* 3. Available Vehicles */}
        <div className="kpi-card" onClick={() => onNavigate("vehicles")}>
          <div className="kpi-icon-wrap" style={{ background: "var(--sky-bg)", color: "var(--sky)" }}>
            <CheckCircleIcon size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-title">Available Vehicles</span>
            <div className="kpi-value">{kpis?.availableVehicles ?? 0}</div>
            <span className="kpi-sub">
              Ready for Dispatch Pool
            </span>
          </div>
        </div>

        {/* 4. Vehicles in Maintenance */}
        <div className="kpi-card" onClick={() => onNavigate("maintenance")}>
          <div className="kpi-icon-wrap" style={{ background: "var(--rose-bg)", color: "var(--rose)" }}>
            <WrenchIcon size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-title">In Maintenance</span>
            <div className="kpi-value">{kpis?.vehiclesInMaintenance ?? kpis?.vehiclesInShop ?? 0}</div>
            <span className="kpi-sub">
              In Shop (Barred from Dispatch)
            </span>
          </div>
        </div>

        {/* 5. Active Trips (Dispatched) */}
        <div className="kpi-card" onClick={() => onNavigate("trips")}>
          <div className="kpi-icon-wrap" style={{ background: "rgba(99, 102, 241, 0.15)", color: "var(--primary)" }}>
            <RouteIcon size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-title">Active Trips</span>
            <div className="kpi-value">{kpis?.activeTrips ?? 0}</div>
            <span className="kpi-sub">
              Dispatched En-Route
            </span>
          </div>
        </div>

        {/* 6. Pending Trips (Draft) */}
        <div className="kpi-card" onClick={() => onNavigate("trips")}>
          <div className="kpi-icon-wrap" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>
            <ClockIcon size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-title">Pending Trips</span>
            <div className="kpi-value">{kpis?.pendingTrips ?? 0}</div>
            <span className="kpi-sub">
              Drafts Scheduled
            </span>
          </div>
        </div>

        {/* 7. Drivers On Duty */}
        <div className="kpi-card" onClick={() => onNavigate("drivers")}>
          <div className="kpi-icon-wrap" style={{ background: "var(--emerald-bg)", color: "var(--emerald)" }}>
            <UsersIcon size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-title">Drivers On Duty</span>
            <div className="kpi-value">{kpis?.driversOnDuty ?? 0}</div>
            <span className="kpi-sub">
              Available: <strong>{kpis?.availableDrivers ?? 0}</strong> • Total: <strong>{kpis?.totalDrivers ?? 0}</strong>
            </span>
          </div>
        </div>

        {/* 8. Total Operational Cost */}
        <div className="kpi-card" onClick={() => onNavigate("expenses")}>
          <div className="kpi-icon-wrap" style={{ background: "var(--purple-bg)", color: "var(--purple)" }}>
            <DollarSignIcon size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-title">Operational Cost</span>
            <div className="kpi-value">${Number(kpis?.totalOperationalCost ?? 0).toLocaleString()}</div>
            <span className="kpi-sub">
              Fuel (${Number(kpis?.totalFuelCost ?? 0).toLocaleString()}) + Maint (${Number(kpis?.totalMaintenanceCost ?? 0).toLocaleString()})
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section (Bonus Feature 8) */}
      <div className="charts-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        {/* Chart 1: Fleet Status Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h4>Fleet Status Distribution</h4>
            <small>{totalVehicles} total units in scope</small>
          </div>
          <div className="chart-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-around", minHeight: "160px" }}>
            {/* SVG Donut */}
            <svg width="140" height="140" viewBox="0 0 42 42" className="donut-chart">
              <circle className="donut-hole" cx="21" cy="21" r="15.915" fill="transparent"></circle>
              <circle className="donut-ring" cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="5"></circle>
              
              {/* Available slice */}
              <circle
                cx="21" cy="21" r="15.915" fill="transparent"
                stroke="#16a34a" strokeWidth="5"
                strokeDasharray={`${totalVehicles ? (availableVehicles / totalVehicles) * 100 : 0} ${totalVehicles ? 100 - (availableVehicles / totalVehicles) * 100 : 100}`}
                strokeDashoffset="25"
              ></circle>
              {/* Active slice */}
              <circle
                cx="21" cy="21" r="15.915" fill="transparent"
                stroke="#6a5cff" strokeWidth="5"
                strokeDasharray={`${totalVehicles ? (activeVehicles / totalVehicles) * 100 : 0} ${totalVehicles ? 100 - (activeVehicles / totalVehicles) * 100 : 100}`}
                strokeDashoffset={`${25 - (totalVehicles ? (availableVehicles / totalVehicles) * 100 : 0)}`}
              ></circle>
              {/* In Shop slice */}
              <circle
                cx="21" cy="21" r="15.915" fill="transparent"
                stroke="#dc2626" strokeWidth="5"
                strokeDasharray={`${totalVehicles ? (inShopVehicles / totalVehicles) * 100 : 0} ${totalVehicles ? 100 - (inShopVehicles / totalVehicles) * 100 : 100}`}
                strokeDashoffset={`${25 - (totalVehicles ? ((availableVehicles + activeVehicles) / totalVehicles) * 100 : 0)}`}
              ></circle>

              <text x="50%" y="48%" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="bold">
                {totalVehicles}
              </text>
              <text x="50%" y="62%" textAnchor="middle" fill="var(--muted)" fontSize="4">
                VEHICLES
              </text>
            </svg>

            {/* Legend */}
            <div className="chart-legend" style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#16a34a" }}></span>
                <span>Available ({availableVehicles})</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#6a5cff" }}></span>
                <span>On Trip ({activeVehicles})</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#dc2626" }}></span>
                <span>In Shop ({inShopVehicles})</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "gray" }}></span>
                <span>Retired ({retiredVehicles})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Operational Cost Breakdown */}
        <div className="chart-card">
          <div className="chart-header">
            <h4>Operational Expenses Breakdown</h4>
            <small>Fuel vs Maintenance vs Tolls</small>
          </div>
          <div className="chart-body" style={{ padding: "10px 0" }}>
            <div style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", marginBottom: "4px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <FuelIcon size={14} style={{ color: "var(--sky)" }} /> Fuel Consumed
                </span>
                <strong>${Number(fuelCost).toLocaleString()} ({fuelPct}%)</strong>
              </div>
              <div style={{ height: "8px", background: "var(--border-subtle)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${fuelPct}%`, height: "100%", background: "var(--sky)", borderRadius: "4px" }}></div>
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", marginBottom: "4px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <WrenchIcon size={14} style={{ color: "var(--rose)" }} /> Shop Maintenance
                </span>
                <strong>${Number(maintCost).toLocaleString()} ({maintPct}%)</strong>
              </div>
              <div style={{ height: "8px", background: "var(--border-subtle)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${maintPct}%`, height: "100%", background: "var(--rose)", borderRadius: "4px" }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", marginBottom: "4px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <RouteIcon size={14} style={{ color: "var(--amber)" }} /> Tolls & Route Fees
                </span>
                <strong>${Number(otherCost).toLocaleString()} ({otherPct}%)</strong>
              </div>
              <div style={{ height: "8px", background: "var(--border-subtle)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${otherPct}%`, height: "100%", background: "var(--amber)", borderRadius: "4px" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Analytics Table with Fuel Efficiency and ROI Formula */}
      <div className="table-container">
        <div className="table-header">
          <div>
            <h3>Vehicle Performance & Asset ROI Ledger</h3>
            <span className="table-caption">
              Formula: <code>ROI = [Revenue - (Maintenance + Fuel)] / Acquisition Cost</code>
            </span>
          </div>
          <span className="table-caption">{vehicleAnalytics.length} registered vehicles</span>
        </div>

        <table className="ops-table">
          <thead>
            <tr>
              <th>Vehicle Registration</th>
              <th>Model / Make</th>
              <th>Type</th>
              <th>Region</th>
              <th>Status</th>
              <th>Odometer</th>
              <th>Fuel Efficiency</th>
              <th>Operational Cost</th>
              <th>Revenue</th>
              <th>Asset ROI (%)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: "30px" }}>
                  <div className="spinner" style={{ margin: "0 auto 10px" }}></div>
                  Loading fleet analytics ledger...
                </td>
              </tr>
            ) : vehicleAnalytics.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: "30px" }}>
                  No vehicle analytics records found for this filter.
                </td>
              </tr>
            ) : (
              vehicleAnalytics.map((v, i) => (
                <tr key={i}>
                  <td>
                    <strong>{v.registrationNumber || `VH-${v.vehicleId}`}</strong>
                  </td>
                  <td>{v.model || "Unknown Model"}</td>
                  <td>
                    <span className="type-badge">{v.type || "Van"}</span>
                  </td>
                  <td>{v.region || "Central"}</td>
                  <td>
                    <span className={`status-pill status-${(v.status || "AVAILABLE").toLowerCase()}`}>
                      {v.status || "AVAILABLE"}
                    </span>
                  </td>
                  <td>{Number(v.odometer || 0).toLocaleString()} km</td>
                  <td>
                    <strong>{v.fuelEfficiency || 0} km/L</strong>
                  </td>
                  <td>${Number(v.totalOperationalCost || v.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>${Number(v.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>
                    <span
                      style={{
                        fontWeight: "700",
                        color: (v.roiPercentage || 0) >= 0 ? "#16a34a" : "#ef4444",
                      }}
                    >
                      {(v.roiPercentage || 0) > 0 ? `+${v.roiPercentage}%` : `${v.roiPercentage || 0}%`}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
