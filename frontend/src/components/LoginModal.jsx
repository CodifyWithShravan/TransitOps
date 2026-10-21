import { useState } from "react";
import { api } from "../services/api";
import { BoltIcon, AlertTriangleIcon } from "./Icons";

export default function LoginModal({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("FLEET_MANAGER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let data;
      if (isRegister) {
        data = await api.register({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        });
      } else {
        data = await api.login(email.trim(), password);
      }

      localStorage.setItem("transitops_token", data.token);
      localStorage.setItem("transitops_user", JSON.stringify(data));
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || (isRegister ? "Registration failed" : "Invalid email or password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-badge">
            <BoltIcon size={14} style={{ color: "var(--primary)" }} />
            <span>TransitOps Portal</span>
          </div>
          <h2>{isRegister ? "Create Operations Account" : "Sign In to Operations"}</h2>
          <p>
            {isRegister
              ? "Register a new real-time operator account with role-based access"
              : "Enter your credentials to access the live fleet dispatch system"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tab-group">
          <button
            type="button"
            className={`auth-tab-btn ${!isRegister ? "active" : ""}`}
            onClick={() => {
              setIsRegister(false);
              setError("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${isRegister ? "active" : ""}`}
            onClick={() => {
              setIsRegister(true);
              setError("");
            }}
          >
            Register Account
          </button>
        </div>

        {error && (
          <div className="modal-error">
            <AlertTriangleIcon size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <label>Full Operator Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marcus Vance"
                />
              </div>

              <div className="form-group">
                <label>Assigned Department Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="role-select"
                >
                  <option value="FLEET_MANAGER">Fleet Manager (Full Administrative Access)</option>
                  <option value="DISPATCHER">Dispatcher (Trip Scheduling & Fleet Status)</option>
                  <option value="SAFETY_OFFICER">Safety Officer (Driver Compliance & Maintenance)</option>
                  <option value="FINANCIAL_ANALYST">Financial Analyst (Ledger & Operating Costs)</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Work Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. operator@transitops.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? "Authenticating..." : isRegister ? "Create Account & Sign In" : "Sign In to Operations"}
          </button>
        </form>

        <div className="auth-footer-help">
          <small>
            Pre-seeded operational accounts (password: <code>password123</code>):
            <br />
            <code>manager@transitops.com</code> (Fleet Manager) &bull; <code>dispatcher@transitops.com</code> (Dispatcher)
            <br />
            <code>safety@transitops.com</code> (Safety Officer) &bull; <code>finance@transitops.com</code> (Financial Analyst)
          </small>
        </div>
      </div>
    </div>
  );
}
