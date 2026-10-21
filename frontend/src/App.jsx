import { useState, useEffect } from "react";
import "./App.css";
import { api } from "./services/api";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import VehiclesView from "./components/VehiclesView";
import TripsView from "./components/TripsView";
import DriversView from "./components/DriversView";
import MaintenanceView from "./components/MaintenanceView";
import ExpensesView from "./components/ExpensesView";
import AiAssistantWidget from "./components/AiAssistantWidget";
import LoginModal from "./components/LoginModal";

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const token = localStorage.getItem("transitops_token");
      const saved = localStorage.getItem("transitops_user");
      if (!token || !saved) return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const onAuthExpired = () => setCurrentUser(null);
    window.addEventListener("transitops_auth_expired", onAuthExpired);
    return () => window.removeEventListener("transitops_auth_expired", onAuthExpired);
  }, []);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("transitops_theme") || "dark";
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [counts, setCounts] = useState({ vehicles: 5, trips: 0, drivers: 4, maintenance: 1 });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("transitops_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Quick Role Switcher for RBAC demonstration
  const handleQuickRoleSwitch = async (targetRole) => {
    const roleCredentials = {
      FLEET_MANAGER: { email: "manager@transitops.com", password: "password123" },
      DISPATCHER: { email: "dispatcher@transitops.com", password: "password123" },
      SAFETY_OFFICER: { email: "safety@transitops.com", password: "password123" },
      FINANCIAL_ANALYST: { email: "finance@transitops.com", password: "password123" },
    };

    const creds = roleCredentials[targetRole];
    if (!creds) return;

    try {
      const data = await api.login(creds.email, creds.password);
      localStorage.setItem("transitops_token", data.token);
      localStorage.setItem("transitops_user", JSON.stringify(data));
      setCurrentUser(data);
    } catch (err) {
      console.warn("Auto-login fallback using local session:", err);
      const fallbackUser = {
        id: 1,
        name: `Demo ${targetRole}`,
        email: creds.email,
        role: targetRole,
        token: localStorage.getItem("transitops_token") || "mock-token",
      };
      localStorage.setItem("transitops_user", JSON.stringify(fallbackUser));
      setCurrentUser(fallbackUser);
    }
  };

  // Load KPI counts for sidebar badges
  useEffect(() => {
    if (currentUser) {
      api.getKPIs()
        .then((kpis) => {
          if (kpis) {
            setCounts({
              vehicles: kpis.totalVehicles ?? 5,
              trips: kpis.activeTrips ?? 0,
              drivers: kpis.totalDrivers ?? 4,
              maintenance: kpis.vehiclesInShop ?? kpis.vehiclesInMaintenance ?? 1,
            });
          }
        })
        .catch(() => {});
    }
  }, [currentUser, activeTab]);

  const handleLogout = () => {
    localStorage.removeItem("transitops_token");
    localStorage.removeItem("transitops_user");
    setCurrentUser(null);
  };

  return (
    <div className={`transitops-app theme-${theme}`} data-theme={theme}>
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
        onQuickRoleSwitch={handleQuickRoleSwitch}
      />

      <div className="app-main-layout">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          counts={counts}
          userRole={currentUser?.role}
        />

        {/* Core Operations Work Area */}
        <main className="app-content-panel">
          {activeTab === "dashboard" && (
            <DashboardView onNavigate={setActiveTab} currentUser={currentUser} />
          )}
          {activeTab === "vehicles" && <VehiclesView currentUser={currentUser} />}
          {activeTab === "trips" && <TripsView currentUser={currentUser} />}
          {activeTab === "drivers" && <DriversView currentUser={currentUser} />}
          {activeTab === "maintenance" && <MaintenanceView currentUser={currentUser} />}
          {activeTab === "expenses" && <ExpensesView currentUser={currentUser} />}
        </main>
      </div>

      {/* Floating Bottom AI RAG Chatbot Widget */}
      <AiAssistantWidget />

      {/* Login Modal (if logged out) */}
      {!currentUser && (
        <LoginModal
          onLoginSuccess={(user) => {
            setCurrentUser(user);
          }}
        />
      )}
    </div>
  );
}
