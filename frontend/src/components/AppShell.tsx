import React from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { NotificationBell } from "./NotificationBell";
import { C } from "../theme";
import { Wifi, WifiOff, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { connected, onlineCount } = useSocket();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "-apple-system, Segoe UI, Roboto, sans-serif" }}>
      <style>{`@keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:.35 } }`}</style>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          borderBottom: `1px solid ${C.border}`,
          background: C.panel,
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", color: C.text }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.amber }} />
          <strong style={{ fontSize: 14.5 }}>Fieldstone</strong>
          <span style={{ color: C.textFaint, fontSize: 13 }}>Client Ops</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: connected ? C.teal : C.coral }}>
            {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
            {connected ? `live · ${onlineCount} online` : "reconnecting…"}
          </div>
          <NotificationBell />
          <div style={{ fontSize: 12.5, color: C.textDim }}>
            {user?.name} <span style={{ color: C.textFaint }}>· {user?.role}</span>
          </div>
          <button onClick={logout} title="Log out" style={{ background: "none", border: `1px solid ${C.border}`, color: C.textDim, borderRadius: 7, padding: "6px 8px", display: "flex" }}>
            <LogOut size={14} />
          </button>
        </div>
      </header>
      <main style={{ padding: "20px 24px" }}>{children}</main>
    </div>
  );
}
