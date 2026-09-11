import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { ActivityFeed } from "../components/ActivityFeed";
import { NewProjectModal } from "../components/NewProjectModal";
import { useActivityFeed } from "../hooks/useActivityFeed";
import { dashboardApi } from "../api/resources";
import { C, PRIORITY_COLOR, fmtDate } from "../theme";
import { Plus } from "lucide-react";

export function PMDashboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [showNew, setShowNew] = useState(false);
  const feed = useActivityFeed(); 
  const navigate = useNavigate();

  function load() {
    dashboardApi.pm().then(({ data }) => setData(data));
  }
  useEffect(load, []);

  return (
    <AppShell>
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h1 style={{ fontSize: 19, fontWeight: 650, margin: 0 }}>Your projects</h1>
            <button
              onClick={() => setShowNew(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: C.amber, color: "#1B1404", border: "none", borderRadius: 7, padding: "7px 12px", fontWeight: 650, fontSize: 12.5 }}
            >
              <Plus size={14} /> New project
            </button>
          </div>

          <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 22 }}>
            {data?.projects?.map((p: any) => (
              <Link key={p.id} to={`/projects/${p.id}`} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderBottom: `1px solid ${C.border}`, background: C.panel, color: C.text, textDecoration: "none" }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: C.textDim }}>{p._count?.tasks ?? 0} tasks</div>
              </Link>
            ))}
            {data?.projects?.length === 0 && <div style={{ padding: 14, color: C.textFaint, fontSize: 12.5 }}>No projects yet — create one to get started.</div>}
          </div>

          {data && (
            <>
              <div style={{ fontSize: 12.5, color: C.textFaint, marginBottom: 8 }}>Tasks by priority (your projects)</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
                {Object.entries(data.tasksByPriority).map(([p, count]) => (
                  <div key={p} style={{ flex: 1, background: C.panel, border: `1px solid ${C.border}`, borderLeft: `3px solid ${PRIORITY_COLOR[p]}`, borderRadius: 8, padding: "9px 12px" }}>
                    <div style={{ fontSize: 11, color: C.textFaint }}>{p}</div>
                    <div style={{ fontSize: 18, fontWeight: 650 }}>{count as number}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 12.5, color: C.textFaint, marginBottom: 8 }}>Due this week</div>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                {data.upcomingThisWeek.map((t: any) => (
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "9px 12px", borderBottom: `1px solid ${C.border}`, background: C.panel }}>
                    <div>
                      <div style={{ fontSize: 12.5 }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: C.textFaint }}>{t.project?.name} · {t.assignedTo?.name || "Unassigned"}</div>
                    </div>
                    <div style={{ fontSize: 11.5, color: C.textDim }}>{fmtDate(t.dueDate)}</div>
                  </div>
                ))}
                {data.upcomingThisWeek.length === 0 && <div style={{ padding: 14, color: C.textFaint, fontSize: 12.5 }}>Nothing due this week.</div>}
              </div>
            </>
          )}
        </div>
        <ActivityFeed events={feed} title="Your projects — live feed" />
      </div>

      {showNew && (
        <NewProjectModal
          onClose={() => setShowNew(false)}
          onCreated={(id) => {
            setShowNew(false);
            load();
            navigate(`/projects/${id}`);
          }}
        />
      )}
    </AppShell>
  );
}
