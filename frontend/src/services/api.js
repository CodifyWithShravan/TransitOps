const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function getAuthHeaders(isMultipart = false) {
  const token = localStorage.getItem("transitops_token");
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

async function handleResponse(res, defaultError = "Request failed") {
  if (res.status === 401) {
    localStorage.removeItem("transitops_token");
    localStorage.removeItem("transitops_user");
    window.dispatchEvent(new Event("transitops_auth_expired"));
  }
  if (!res.ok) {
    let errMsg = defaultError;
    try {
      const err = await res.json();
      errMsg = err.message || err.error || defaultError;
    } catch {
      try {
        const text = await res.text();
        if (text) errMsg = text;
      } catch {}
    }
    throw new Error(errMsg);
  }
  return res.json();
}

export const api = {
  // --- AUTH ---
  async login(email, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res, "Invalid email or password");
  },

  async register(data) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res, "Failed to register");
  },

  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    return res.json();
  },

  // --- DASHBOARD & ANALYTICS ---
  async getKPIs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/api/dashboard/kpis${query ? `?${query}` : ""}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to load KPIs");
  },

  async getVehicleAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/api/analytics/vehicles${query ? `?${query}` : ""}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to load vehicle analytics");
  },

  async downloadCsvReport() {
    const res = await fetch(`${API_BASE}/api/analytics/export/csv`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to export CSV report");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transitops_fleet_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  async downloadPdfReport() {
    const res = await fetch(`${API_BASE}/api/analytics/export/pdf`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to export PDF report");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transitops_fleet_report_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // --- VEHICLES ---
  async getVehicles(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/api/vehicles${query ? `?${query}` : ""}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to load vehicles");
  },

  async getAvailableVehicles() {
    const res = await fetch(`${API_BASE}/api/vehicles/available`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to load available vehicles");
  },

  async createVehicle(data) {
    const res = await fetch(`${API_BASE}/api/vehicles`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res, "Failed to create vehicle");
  },

  async updateVehicle(id, data) {
    const res = await fetch(`${API_BASE}/api/vehicles/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res, "Failed to update vehicle");
  },

  async retireVehicle(id) {
    const res = await fetch(`${API_BASE}/api/vehicles/${id}/retire`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to retire vehicle");
  },

  async deleteVehicle(id) {
    const res = await fetch(`${API_BASE}/api/vehicles/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to delete vehicle");
  },

  // --- DRIVERS ---
  async getDrivers(status) {
    const url = status ? `${API_BASE}/api/drivers?status=${status}` : `${API_BASE}/api/drivers`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(res, "Failed to load drivers");
  },

  async getAvailableDrivers() {
    const res = await fetch(`${API_BASE}/api/drivers/available`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to load available drivers");
  },

  async getExpiringDrivers(days = 30) {
    const res = await fetch(`${API_BASE}/api/drivers/alerts/expiring?days=${days}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to load license expiry alerts");
  },

  async sendDriverExpiryReminder(id) {
    const res = await fetch(`${API_BASE}/api/drivers/${id}/send-expiry-reminder`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to dispatch expiry reminder");
  },

  async createDriver(data) {
    const res = await fetch(`${API_BASE}/api/drivers`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res, "Failed to create driver");
  },

  async updateDriver(id, data) {
    const res = await fetch(`${API_BASE}/api/drivers/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res, "Failed to update driver");
  },

  async updateSafetyScore(id, score) {
    const res = await fetch(`${API_BASE}/api/drivers/${id}/safety-score`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ safetyScore: score }),
    });
    return handleResponse(res, "Failed to update safety score");
  },

  // --- TRIPS ---
  async getTrips(status) {
    const url = status ? `${API_BASE}/api/trips?status=${status}` : `${API_BASE}/api/trips`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(res, "Failed to load trips");
  },

  async createTrip(data) {
    const res = await fetch(`${API_BASE}/api/trips`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res, "Failed to create trip");
  },

  async dispatchTrip(id) {
    const res = await fetch(`${API_BASE}/api/trips/${id}/dispatch`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to dispatch trip");
  },

  async completeTrip(id, data) {
    const res = await fetch(`${API_BASE}/api/trips/${id}/complete`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res, "Failed to complete trip");
  },

  async cancelTrip(id) {
    const res = await fetch(`${API_BASE}/api/trips/${id}/cancel`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to cancel trip");
  },

  // --- MAINTENANCE ---
  async getMaintenanceLogs(status) {
    const url = status ? `${API_BASE}/api/maintenance?status=${status}` : `${API_BASE}/api/maintenance`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(res, "Failed to load maintenance logs");
  },

  async createMaintenanceLog(data) {
    const res = await fetch(`${API_BASE}/api/maintenance`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res, "Failed to create maintenance log");
  },

  async completeMaintenanceLog(id, finalCost) {
    const res = await fetch(`${API_BASE}/api/maintenance/${id}/complete`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(finalCost != null ? { finalCost } : {}),
    });
    return handleResponse(res, "Failed to complete maintenance");
  },

  // --- FUEL & EXPENSES ---
  async getFuelLogs(vehicleId) {
    const url = vehicleId ? `${API_BASE}/api/fuel-logs?vehicleId=${vehicleId}` : `${API_BASE}/api/fuel-logs`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    return handleResponse(res, "Failed to load fuel logs");
  },

  async addFuelLog(data) {
    const res = await fetch(`${API_BASE}/api/fuel-logs`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res, "Failed to add fuel log");
  },

  async getExpenses(vehicleId, type) {
    const params = new URLSearchParams();
    if (vehicleId) params.append("vehicleId", vehicleId);
    if (type) params.append("type", type);
    const query = params.toString();
    const res = await fetch(`${API_BASE}/api/expenses${query ? `?${query}` : ""}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, "Failed to load expenses");
  },

  async addExpense(data) {
    const res = await fetch(`${API_BASE}/api/expenses`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res, "Failed to add expense");
  },

  // --- AI CHATBOT & RAG ---
  async sendChatMessage(message, conversationId) {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, conversationId }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Chat error");
    }
    const data = await res.json();
    return data.response;
  },

  async uploadPdfDocument(file) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/api/rag/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to upload document");
    }
    return res.text();
  },

  async sendRagChatMessage(message) {
    const res = await fetch(`${API_BASE}/api/rag/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "RAG chat error");
    }
    return res.text();
  },
};
