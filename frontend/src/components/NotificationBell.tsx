import React, { useState } from "react";
import { Bell, Check } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { C, timeAgo } from "../theme";

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        style={{
          background: "none",
          border: `1px solid ${C.border}`,
          color: C.textDim,
          padding: "6px 8px",
          borderRadius: 8,
          position: "relative",
          display: "flex",
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              background: C.coral,
              color: "#1B0C09",
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 10,
              padding: "1px 5px",
              minWidth: 16,
              textAlign: "center",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 320,
            maxHeight: 420,
            background: C.raised,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            boxShadow: "0 12px 28px rgba(0,0,0,.4)",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 12.5, fontWeight: 600 }}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: "none", border: "none", color: C.amber, fontSize: 11.5, display: "flex", alignItems: "center", gap: 4 }}>
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>
          <div style={{ overflow: "auto" }}>
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "9px 12px",
                  background: n.isRead ? "transparent" : "#1E2A2B",
                  border: "none",
                  borderBottom: `1px solid ${C.border}`,
                  color: C.text,
                }}
              >
                <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>{n.message}</div>
                <div style={{ fontSize: 10.5, color: C.textFaint, marginTop: 3 }}>{timeAgo(n.createdAt)}</div>
              </button>
            ))}
            {notifications.length === 0 && <div style={{ padding: "16px 12px", color: C.textFaint, fontSize: 12.5 }}>You're all caught up.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
