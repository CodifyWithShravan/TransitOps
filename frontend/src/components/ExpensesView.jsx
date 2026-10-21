import { useState, useEffect } from "react";
import { api } from "../services/api";
import {
  LockIcon,
  FuelIcon,
  CreditCardIcon,
  RouteIcon,
  DollarSignIcon,
  RefreshCwIcon,
  FileTextIcon,
  ActivityIcon,
  XIcon,
} from "./Icons";

export default function ExpensesView({ currentUser }) {
  const isFinanceOrManager = currentUser?.role === "FLEET_MANAGER" || currentUser?.role === "FINANCIAL_ANALYST";

  if (!isFinanceOrManager && currentUser?.role) {
    return (
      <div className="expenses-view">
        <div className="rbac-restricted-card">
          <div className="rbac-icon">
            <LockIcon size={32} />
          </div>
          <h3>Role-Based Access Restricted</h3>
          <p>
            The <strong>Fuel & Expenses Financial Ledger</strong> is strictly restricted to <strong>Financial Analysts</strong> and <strong>Fleet Managers</strong>.
          </p>
          <div className="rbac-current-info">
            Your active role: <span className="user-role-badge">{currentUser.role}</span>
          </div>
          <p className="rbac-hint">
            To view or log corporate expenses, switch to <strong>Financial Analyst</strong> or <strong>Fleet Manager</strong> using the quick role switcher in the top navigation bar.
          </p>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState("fuel"); // 'fuel' | 'expenses' | 'vehicle_cost'
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [fuelForm, setFuelForm] = useState({
    vehicleId: "",
    liters: 75.0,
    cost: 110.0,
    odometerReading: 15200.0,
    logDate: new Date().toISOString().split("T")[0],
  });

  const [expenseForm, setExpenseForm] = useState({
    vehicleId: "",
    expenseType: "TOLL",
    amount: 35.0,
    description: "Expressway EZPass Toll",
    expenseDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadData();
  }, [selectedVehicleFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fData, eData, vData] = await Promise.all([
        api.getFuelLogs(selectedVehicleFilter || undefined).catch(() => []),
        api.getExpenses(selectedVehicleFilter || undefined).catch(() => []),
        api.getVehicles().catch(() => []),
      ]);
      setFuelLogs(fData || []);
      setExpenses(eData || []);
      setVehicles(vData || []);
      if (vData?.length > 0 && !fuelForm.vehicleId) {
        setFuelForm((prev) => ({ ...prev, vehicleId: vData[0].id }));
        setExpenseForm((prev) => ({ ...prev, vehicleId: vData[0].id }));
      }
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFuel = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.addFuelLog({
        ...fuelForm,
        vehicleId: Number(fuelForm.vehicleId),
        liters: Number(fuelForm.liters),
        cost: Number(fuelForm.cost),
        odometerReading: Number(fuelForm.odometerReading),
      });
      setIsFuelModalOpen(false);
      loadData();
    } catch (err) {
      alert("Failed to add fuel log: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.addExpense({
        ...expenseForm,
        vehicleId: Number(expenseForm.vehicleId),
        amount: Number(expenseForm.amount),
      });
      setIsExpenseModalOpen(false);
      loadData();
    } catch (err) {
      alert("Failed to add expense: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalFuelCost = fuelLogs.reduce((acc, f) => acc + (f.cost || 0), 0);
  const totalLiters = fuelLogs.reduce((acc, f) => acc + (f.liters || 0), 0);
  const totalOtherExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const totalFleetOpCost = totalFuelCost + totalOtherExpenses;

  // Calculate cost per vehicle map
  const vehicleCostMap = {};
  vehicles.forEach((v) => {
    vehicleCostMap[v.id] = {
      vehicle: v,
      fuelCost: 0,
      fuelLiters: 0,
      maintCost: 0,
      otherCost: 0,
    };
  });

  fuelLogs.forEach((f) => {
    const vId = f.vehicle?.id || f.vehicleId;
    if (vId && vehicleCostMap[vId]) {
      vehicleCostMap[vId].fuelCost += f.cost || 0;
      vehicleCostMap[vId].fuelLiters += f.liters || 0;
    }
  });

  expenses.forEach((e) => {
    const vId = e.vehicle?.id || e.vehicleId;
    if (vId && vehicleCostMap[vId]) {
      if (e.expenseType === "MAINTENANCE") {
        vehicleCostMap[vId].maintCost += e.amount || 0;
      } else {
        vehicleCostMap[vId].otherCost += e.amount || 0;
      }
    }
  });

  const filteredFuelLogs = fuelLogs.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (f.vehicle?.registrationNumber || "").toLowerCase().includes(q) ||
      String(f.liters).includes(q) ||
      String(f.cost).includes(q)
    );
  });

  const filteredExpenses = expenses.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (e.vehicle?.registrationNumber || "").toLowerCase().includes(q) ||
      (e.description || "").toLowerCase().includes(q) ||
      (e.expenseType || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="expenses-view">
      <div className="view-header">
        <div>
          <h2>Fuel & Operating Expenses Ledger</h2>
          <p>Enforce financial tracking: fuel fills, maintenance invoices, tolls, and per-vehicle operational cost</p>
        </div>
        <div className="view-actions">
          <button className="btn-secondary" onClick={() => setIsFuelModalOpen(true)}>
            <FuelIcon size={14} />
            <span>Log Fuel Fill</span>
          </button>
          <button className="btn-primary" onClick={() => setIsExpenseModalOpen(true)}>
            <CreditCardIcon size={14} />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Financial Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        <div className="kpi-card" style={{ padding: "16px" }}>
          <div className="kpi-icon-wrap" style={{ background: "var(--sky-bg)", color: "var(--sky)" }}>
            <FuelIcon size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-title">Total Fuel Invoiced</span>
            <div className="kpi-value" style={{ fontSize: "22px" }}>${Number(totalFuelCost).toFixed(2)}</div>
            <span className="kpi-sub">{Number(totalLiters).toFixed(1)} Liters logged</span>
          </div>
        </div>

        <div className="kpi-card" style={{ padding: "16px" }}>
          <div className="kpi-icon-wrap" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>
            <RouteIcon size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-title">Tolls & Other Expenses</span>
            <div className="kpi-value" style={{ fontSize: "22px" }}>${Number(totalOtherExpenses).toFixed(2)}</div>
            <span className="kpi-sub">{expenses.length} receipts filed</span>
          </div>
        </div>

        <div className="kpi-card" style={{ padding: "16px" }}>
          <div className="kpi-icon-wrap" style={{ background: "var(--purple-bg)", color: "var(--purple)" }}>
            <DollarSignIcon size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-title">Total Operational Cost</span>
            <div className="kpi-value" style={{ fontSize: "22px" }}>${Number(totalFleetOpCost).toFixed(2)}</div>
            <span className="kpi-sub">Fuel + Maintenance + Tolls</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>Filter by Vehicle:</label>
          <select value={selectedVehicleFilter} onChange={(e) => setSelectedVehicleFilter(e.target.value)}>
            <option value="">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.registrationNumber} ({v.model})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group" style={{ flex: 1, minWidth: "220px" }}>
          <label>Search Ledger:</label>
          <input
            type="text"
            placeholder="Search registration, description, expense type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="btn-secondary" onClick={loadData}>
          <RefreshCwIcon size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-pill-bar">
        <button
          className={`tab-btn ${activeTab === "fuel" ? "active" : ""}`}
          onClick={() => setActiveTab("fuel")}
        >
          <FuelIcon size={14} />
          <span>Fuel Refueling Logs ({fuelLogs.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "expenses" ? "active" : ""}`}
          onClick={() => setActiveTab("expenses")}
        >
          <FileTextIcon size={14} />
          <span>Operating Expenses ({expenses.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "vehicle_cost" ? "active" : ""}`}
          onClick={() => setActiveTab("vehicle_cost")}
        >
          <ActivityIcon size={14} />
          <span>Per-Vehicle Operational Cost ({vehicles.length})</span>
        </button>
      </div>

      {activeTab === "fuel" && (
        <div className="table-container">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Vehicle Asset</th>
                <th>Volume (Liters)</th>
                <th>Fuel Cost ($)</th>
                <th>Odometer Reading</th>
                <th>Date Logged</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "30px" }}>
                    <div className="spinner" style={{ margin: "0 auto 10px" }}></div>
                    Loading fuel logs...
                  </td>
                </tr>
              ) : filteredFuelLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "30px" }}>
                    No fuel logs recorded yet.
                  </td>
                </tr>
              ) : (
                filteredFuelLogs.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <strong>FUEL-#{f.id}</strong>
                    </td>
                    <td>
                      {f.vehicle ? (
                        <strong>{f.vehicle.registrationNumber}</strong>
                      ) : (
                        `VH-${f.vehicleId || "N/A"}`
                      )}
                    </td>
                    <td>{f.liters} L</td>
                    <td>
                      <span className="cost-tag">${Number(f.cost || 0).toFixed(2)}</span>
                    </td>
                    <td>{Number(f.odometerReading || 0).toLocaleString()} km</td>
                    <td>{f.logDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "expenses" && (
        <div className="table-container">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Expense ID</th>
                <th>Vehicle Asset</th>
                <th>Expense Category</th>
                <th>Description / Purpose</th>
                <th>Amount ($)</th>
                <th>Expense Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "30px" }}>
                    <div className="spinner" style={{ margin: "0 auto 10px" }}></div>
                    Loading expense receipts...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "30px" }}>
                    No expense receipts recorded yet.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <strong>EXP-#{e.id}</strong>
                    </td>
                    <td>
                      {e.vehicle ? (
                        <strong>{e.vehicle.registrationNumber}</strong>
                      ) : (
                        `VH-${e.vehicleId || "N/A"}`
                      )}
                    </td>
                    <td>
                      <span className="type-badge">{e.expenseType}</span>
                    </td>
                    <td>{e.description}</td>
                    <td>
                      <span className="cost-tag">${Number(e.amount || 0).toFixed(2)}</span>
                    </td>
                    <td>{e.expenseDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Per-Vehicle Operational Cost Breakdown Table (Mandatory Section 3.7) */}
      {activeTab === "vehicle_cost" && (
        <div className="table-container">
          <div className="table-header">
            <h3>Automated Operational Cost Breakdown by Asset</h3>
            <span className="table-caption">Formula: Total Cost = Fuel Cost + Maintenance Cost + Other (Tolls/Permits)</span>
          </div>

          <table className="ops-table">
            <thead>
              <tr>
                <th>Vehicle Registration</th>
                <th>Model</th>
                <th>Type</th>
                <th>Total Fuel Consumed</th>
                <th>Fuel Cost ($)</th>
                <th>Maintenance Cost ($)</th>
                <th>Other (Tolls/Permits)</th>
                <th>Total Operational Cost ($)</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => {
                const stat = vehicleCostMap[v.id] || { fuelCost: 0, fuelLiters: 0, maintCost: 0, otherCost: 0 };
                const total = stat.fuelCost + stat.maintCost + stat.otherCost;

                return (
                  <tr key={v.id}>
                    <td>
                      <strong>{v.registrationNumber}</strong>
                    </td>
                    <td>{v.model}</td>
                    <td>
                      <span className="type-badge">{v.type}</span>
                    </td>
                    <td>{stat.fuelLiters.toFixed(1)} L</td>
                    <td>${stat.fuelCost.toFixed(2)}</td>
                    <td>${stat.maintCost.toFixed(2)}</td>
                    <td>${stat.otherCost.toFixed(2)}</td>
                    <td>
                      <strong style={{ color: "#a855f7", fontSize: "14px" }}>
                        ${total.toFixed(2)}
                      </strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Log Fuel Modal */}
      {isFuelModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Record Fuel Fill-Up</h3>
              <button className="modal-close-btn" onClick={() => setIsFuelModalOpen(false)}>
                <XIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleAddFuel}>
              <div className="form-group">
                <label>Vehicle Asset</label>
                <select
                  required
                  value={fuelForm.vehicleId}
                  onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} ({v.model})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fuel Volume (Liters)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={fuelForm.liters}
                    onChange={(e) => setFuelForm({ ...fuelForm, liters: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Total Invoice Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={fuelForm.cost}
                    onChange={(e) => setFuelForm({ ...fuelForm, cost: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Odometer Reading (km)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={fuelForm.odometerReading}
                    onChange={(e) => setFuelForm({ ...fuelForm, odometerReading: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Receipt Date</label>
                  <input
                    type="date"
                    required
                    value={fuelForm.logDate}
                    onChange={(e) => setFuelForm({ ...fuelForm, logDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsFuelModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Fuel Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Log Operational Expense</h3>
              <button className="modal-close-btn" onClick={() => setIsExpenseModalOpen(false)}>
                <XIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleAddExpense}>
              <div className="form-group">
                <label>Vehicle Asset</label>
                <select
                  required
                  value={expenseForm.vehicleId}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vehicleId: e.target.value })}
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} ({v.model})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expense Type</label>
                  <select
                    value={expenseForm.expenseType}
                    onChange={(e) => setExpenseForm({ ...expenseForm, expenseType: e.target.value })}
                  >
                    <option value="TOLL">Toll / Highway EZPass</option>
                    <option value="INSURANCE">Insurance Premium</option>
                    <option value="PERMIT">Permit / Regulatory Fee</option>
                    <option value="MAINTENANCE">Maintenance / Parts</option>
                    <option value="OTHER">Other Operating Misc</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Amount Incurred ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.5"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Receipt Description / Purpose</label>
                <input
                  required
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="e.g. Turnpike toll pass reimbursement"
                />
              </div>

              <div className="form-group">
                <label>Expense Date</label>
                <input
                  type="date"
                  required
                  value={expenseForm.expenseDate}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsExpenseModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
