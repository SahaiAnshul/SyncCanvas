import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../../services/auth";
import { useAuth } from "../../context/AuthContext";
import { User, Mail, Lock, Sparkles, ArrowRight, Eye, EyeOff, AlertCircle, Loader2, Check } from "lucide-react";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasDigit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;

    if (!isPasswordValid) {
      setError("Password must have at least 8 characters, including uppercase, lowercase, and a number.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const authData = await authService.signup(name.trim(), email.trim(), password);
      login(authData);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to create your account. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rich-auth-card">
      <div className="auth-card-header">
        <div className="auth-logo-badge">
          <Sparkles size={24} className="auth-sparkle-icon" />
        </div>
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Join SyncCanvas to collaborate on real-time code & canvas</p>
      </div>

      {error && (
        <div className="auth-error-banner" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form className="auth-form-body" onSubmit={handleSubmit}>
        <div className="auth-form-group">
          <label htmlFor="signup-name" className="auth-label">
            <User size={14} />
            <span>Full Name</span>
          </label>
          <div className="auth-input-wrapper">
            <input
              id="signup-name"
              type="text"
              className="auth-input"
              placeholder="Your Name"
              aria-label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="auth-form-group">
          <label htmlFor="signup-email" className="auth-label">
            <Mail size={14} />
            <span>Email Address</span>
          </label>
          <div className="auth-input-wrapper">
            <input
              id="signup-email"
              type="email"
              className="auth-input"
              placeholder="name@company.com"
              aria-label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="auth-form-group">
          <label htmlFor="signup-password" className="auth-label">
            <Lock size={14} />
            <span>Password</span>
          </label>
          <div className="auth-input-wrapper">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              className="auth-input password-input"
              placeholder="Create a strong password (e.g. Secret123)"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {password.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px", fontSize: "0.75rem", padding: "4px 2px" }}>
              <span style={{ color: hasLength ? "#10b981" : "#9ca3af", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                {hasLength ? <Check size={12} /> : "○"} 8+ chars
              </span>
              <span style={{ color: hasUpper ? "#10b981" : "#9ca3af", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                {hasUpper ? <Check size={12} /> : "○"} 1 uppercase
              </span>
              <span style={{ color: hasLower ? "#10b981" : "#9ca3af", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                {hasLower ? <Check size={12} /> : "○"} 1 lowercase
              </span>
              <span style={{ color: hasDigit ? "#10b981" : "#9ca3af", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                {hasDigit ? <Check size={12} /> : "○"} 1 number
              </span>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="auth-submit-btn"
          disabled={isSubmitting}
          aria-label="Sign Up"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="spinning-loader" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <span>Create Free Account</span>
              <ArrowRight size={16} className="btn-arrow" />
            </>
          )}
        </button>
      </form>

      <div className="auth-card-footer">
        <span>Already have an account?</span>
        <Link to="/login" className="auth-switch-link">
          Log In
        </Link>
      </div>
    </div>
  );
};

export default Signup;
