import {
  DashboardIcon,
  TruckIcon,
  RouteIcon,
  UsersIcon,
  WrenchIcon,
  FuelIcon,
  CompassIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  LockIcon,
} from "./Icons";

export default function Sidebar({ activeTab, onSelectTab, counts = {}, userRole = "FLEET_MANAGER" }) {
  const roleInfo = {
    FLEET_MANAGER: {
      title: "Fleet Manager",
      Icon: TruckIcon,
      badgeClass: "badge-manager",
      summary: "Full Root Authority (All Modules Unlocked)",
    },
    DISPATCHER: {
      title: "Dispatcher",
      Icon: CompassIcon,
      badgeClass: "badge-dispatcher",
      summary: "Trip Dispatching & Fleet Status",
    },
    SAFETY_OFFICER: {
      title: "Safety Officer",
      Icon: ShieldCheckIcon,
      badgeClass: "badge-safety",
      summary: "Driver Safety Scores & Maintenance",
    },
    FINANCIAL_ANALYST: {
      title: "Financial Analyst",
      Icon: TrendingUpIcon,
      badgeClass: "badge-finance",
      summary: "Operating Expenses & Cost Reports",
    },
  };

  const currentRoleConfig = roleInfo[userRole] || roleInfo.FLEET_MANAGER;
  const ActiveRoleIcon = currentRoleConfig.Icon;

  const navItems = [
    { id: "dashboard", label: "Dashboard", Icon: DashboardIcon },
    { 
      id: "vehicles", 
      label: "Fleet Vehicles", 
      Icon: TruckIcon, 
      count: counts.vehicles,
      tag: userRole === "FLEET_MANAGER" ? "Full Access" : "View Only" 
    },
    { 
      id: "trips", 
      label: "Trip Dispatch", 
      Icon: RouteIcon, 
      count: counts.trips,
      tag: (userRole === "FLEET_MANAGER" || userRole === "DISPATCHER") ? "Dispatch" : "Audit Only"
    },
    { 
      id: "drivers", 
      label: "Driver Compliance", 
      Icon: UsersIcon, 
      count: counts.drivers,
      tag: (userRole === "FLEET_MANAGER" || userRole === "SAFETY_OFFICER") ? "Safety Lead" : "View Only"
    },
    { 
      id: "maintenance", 
      label: "Maintenance Shop", 
      Icon: WrenchIcon, 
      count: counts.maintenance,
      tag: (userRole === "FLEET_MANAGER" || userRole === "SAFETY_OFFICER") ? "Shop Lead" : "View Only"
    },
    { 
      id: "expenses", 
      label: "Fuel & Expenses", 
      Icon: FuelIcon,
      isRestricted: userRole !== "FLEET_MANAGER" && userRole !== "FINANCIAL_ANALYST",
      tag: (userRole === "FLEET_MANAGER" || userRole === "FINANCIAL_ANALYST") ? "Financial Lead" : "Restricted"
    },
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-role-indicator">
        <span className="role-indicator-label">ACTIVE ROLE POLICY</span>
        <div className={`active-role-card ${currentRoleConfig.badgeClass || ""}`}>
          <div className="role-icon-box">
            <ActiveRoleIcon size={20} />
          </div>
          <div className="role-text-box">
            <strong>{currentRoleConfig.title}</strong>
            <small>{currentRoleConfig.summary}</small>
          </div>
        </div>
      </div>

      <div className="sidebar-section-title">OPERATIONS NAV</div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const ItemIcon = item.Icon;
          return (
            <button
              key={item.id}
              className={`nav-item-btn ${activeTab === item.id ? "active" : ""} ${item.isRestricted ? "restricted-btn" : ""}`}
              onClick={() => onSelectTab(item.id)}
            >
              <span className="nav-icon"><ItemIcon size={18} /></span>
              <span className="nav-label">{item.label}</span>
              {item.tag && (
                <span className={`nav-role-tag ${item.isRestricted ? "tag-locked" : "tag-active"}`}>
                  {item.isRestricted && <LockIcon size={11} style={{ marginRight: "3px" }} />}
                  {item.tag}
                </span>
              )}
              {item.count != null && !item.isRestricted && (
                <span className="nav-counter">{item.count}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-fleet-card">
        <div className="fleet-status-pill">
          <span className="pulse-dot"></span> RBAC Security Active
        </div>
        <h4>Dispatch Hub: Online</h4>
        <p>Enforcing Spring Security method rules for {userRole || "FLEET_MANAGER"}</p>
      </div>
    </aside>
  );
}
