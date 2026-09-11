import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiErrorMessage } from "../api/client";
import { C } from "../theme";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@fieldstone.dev");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, color: C.text, fontFamily: "-apple-system, sans-serif" }}>
      <form onSubmit={submit} style={{ width: 340, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.amber }} />
          <strong style={{ fontSize: 16 }}>Fieldstone</strong>
        </div>
        <p style={{ color: C.textFaint, fontSize: 12.5, margin: "2px 0 18px" }}>Client Ops — sign in</p>

        <label style={{ fontSize: 11.5, color: C.textFaint }}>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          type="email"
          required
        />
        <label style={{ fontSize: 11.5, color: C.textFaint }}>Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          type="password"
          required
        />

        {error && <div style={{ color: C.coral, fontSize: 12.5, marginBottom: 10 }}>{error}</div>}

        <button
          disabled={busy}
          style={{ width: "100%", background: C.amber, color: "#1B1404", border: "none", padding: "9px 0", borderRadius: 7, fontWeight: 650, fontSize: 13.5, marginTop: 4 }}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <div style={{ marginTop: 16, fontSize: 11, color: C.textFaint, lineHeight: 1.6 }}>
          Seed accounts (password <code>Password123!</code>):
          <br />
          admin@fieldstone.dev · marcus.pm@fieldstone.dev · sana.dev@fieldstone.dev
        </div>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: C.panelAlt,
  border: `1px solid ${C.border}`,
  borderRadius: 7,
  padding: "8px 10px",
  color: C.text,
  fontSize: 13,
  margin: "5px 0 12px",
};
