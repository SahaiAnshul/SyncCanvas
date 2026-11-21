import React, { useState } from "react";
import { Copy, Check, Share2, Mail } from "lucide-react";

const InviteUser = ({ roomName, roomCode, onClose }) => {
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [invited, setInvited] = useState(false);

  const inviteUrl = roomCode ? `${window.location.origin}/room/${roomCode}` : "";

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleInvite = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setInvited(true);
    setTimeout(() => {
      setEmail("");
      setInvited(false);
      onClose();
    }, 1500);
  };

  return (
    <div style={{ padding: "8px 0" }}>
      <p style={{ color: "#d1d5db", marginBottom: "16px", fontSize: "0.9rem" }}>
        Invite teammates to collaborate in <b>{roomName}</b>
      </p>

      {roomCode && (
        <div style={{ background: "#18181b", padding: "12px", borderRadius: "8px", border: "1px solid #27272a", marginBottom: "16px" }}>
          <span style={{ fontSize: "0.75rem", color: "#a1a1aa", display: "block", marginBottom: "4px" }}>
            Room Invite Code
          </span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "2px", color: "#06b6d4", fontFamily: "monospace" }}>
              {roomCode}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="secondary-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", padding: "6px 12px" }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? "Copied Link!" : "Copy Link"}</span>
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleInvite}>
        <label style={{ fontSize: "0.8rem", color: "#a1a1aa", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
          <Mail size={13} />
          <span>Or invite via email:</span>
        </label>
        <input
          type="email"
          placeholder="colleague@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rich-input"
          style={{ width: "100%", marginBottom: "16px" }}
        />

        {invited && (
          <div style={{ color: "#10b981", fontSize: "0.85rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Check size={14} />
            <span>Invitation sent to {email}!</span>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button type="button" className="secondary-btn" onClick={onClose}>
            Close
          </button>
          <button type="submit" className="primary-btn" disabled={!email.trim() || invited}>
            Send Invite
          </button>
        </div>
      </form>
    </div>
  );
};

export default InviteUser;