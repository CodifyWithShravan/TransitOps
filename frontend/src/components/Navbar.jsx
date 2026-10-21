import {
  BoltIcon,
  TruckIcon,
  CompassIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  SunIcon,
  MoonIcon,
  LogOutIcon,
} from "./Icons";

export default function Navbar({
  currentUser,
  onLogout,
  theme = "dark",
  onToggleTheme,
  onQuickRoleSwitch,
}) {
  const roles = [
    { key: "FLEET_MANAGER", label: "Fleet Mgr", Icon: TruckIcon },
    { key: "DISPATCHER", label: "Dispatcher", Icon: CompassIcon },
    { key: "SAFETY_OFFICER", label: "Safety Lead", Icon: ShieldCheckIcon },
    { key: "FINANCIAL_ANALYST", label: "Finance", Icon: TrendingUpIcon },
  ];

  return (
    <header className="top-navbar">
      <div className="nav-brand">
        <div className="brand-logo">
          <BoltIcon size={20} />
        </div>
        <div className="brand-text">
          <h2>TransitOps</h2>
          <span className="brand-sub">Industrial Telematics Platform</span>
        </div>
      </div>

      <div className="nav-center">
        {/* Quick Role Switcher Pillbar */}
        <div className="role-switch-pillbar" title="Instantly switch role to evaluate Role-Based Access Control (RBAC)">
          <span className="role-pill-label">RBAC Mode:</span>
          {roles.map((r) => {
            const Icon = r.Icon;
            const isActive = currentUser?.role === r.key;
            return (
              <button
                key={r.key}
                className={`role-pill-btn ${isActive ? "active" : ""}`}
                onClick={() => onQuickRoleSwitch && onQuickRoleSwitch(r.key)}
              >
                <Icon size={14} className="role-pill-icon" />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="nav-user-panel">
        {/* Dark/Light Mode Precision Toggle */}
        <button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <>
              <SunIcon size={15} />
              <span>Light</span>
            </>
          ) : (
            <>
              <MoonIcon size={15} />
              <span>Dark</span>
            </>
          )}
        </button>

        <div className="user-info">
          <span className="user-name">{currentUser?.name || "Operations Operator"}</span>
          <span className="user-role-badge">{currentUser?.role || "OPERATOR"}</span>
        </div>

        <button className="logout-btn" onClick={onLogout} title="Sign Out of Operations">
          <LogOutIcon size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
