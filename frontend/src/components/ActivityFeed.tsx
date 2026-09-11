import React from "react";
import { ActivityEvent } from "../types";
import { C, timeAgo } from "../theme";

export function ActivityFeed({ events, title = "Live activity" }: { events: ActivityEvent[]; title?: string }) {
  return (
    <aside
      style={{
        width: 300,
        flexShrink: 0,
        borderLeft: `1px solid ${C.border}`,
        background: C.panel,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 7 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: C.teal,
            animation: "pulse-dot 1.6s infinite",
          }}
        />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{title}</span>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "6px 12px" }}>
        {events.map((a) => (
          <div key={a.id} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12.5, lineHeight: 1.45, color: C.textDim }}>
              <strong style={{ color: C.text, fontWeight: 600 }}>{a.user.name}</strong> {stripActorName(a.message, a.user.name)}
            </div>
            <div style={{ fontSize: 10.5, color: C.textFaint, marginTop: 2, fontFamily: "ui-monospace, monospace" }}>
              {a.project?.name ? `${a.project.name} · ` : ""}
              {timeAgo(a.createdAt)}
            </div>
          </div>
        ))}
        {events.length === 0 && <div style={{ color: C.textFaint, fontSize: 12.5, padding: "10px 0" }}>No activity yet.</div>}
      </div>
    </aside>
  );
}

function stripActorName(message: string, name: string) {
  return message.startsWith(name) ? message.slice(name.length).trim() : message;
}
