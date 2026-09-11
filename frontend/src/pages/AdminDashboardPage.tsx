import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { ActivityFeed } from "../components/ActivityFeed";
import { useActivityFeed } from "../hooks/useActivityFeed";
import { dashboardApi, projectsApi } from "../api/resources";
import { C } from "../theme";
import { Users2, FolderKanban, AlertTriangle, ListChecks } from "lucide-react";

interface AdminStats {
  totalProjects: number;
  tasksByStatus: Record<string, number>;
  overdueCount: number;
  onlineUsers: number;
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const feed = useActivityFeed(); 

  useEffect(() => {
    dashboardApi.admin().then(({ data }) => setStats(data));
  }, []);

  return (
    <AppShell>
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 19, fontWeight: 650, margin: "0 0 16px" }}>Admin overview</h1>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 22 }}>
            <StatCard icon={FolderKanban} label="Projects" value={stats?.totalProjects ?? "—"} />
            <StatCard icon={ListChecks} label="Tasks total" value={stats ? Object.values(stats.tasksByStatus).reduce((a, b) => a + b, 0) : "—"} />
            <StatCard icon={AlertTriangle} label="Overdue" value={stats?.overdueCount ?? "—"} tone={C.coral} />
            <StatCard icon={Users2} label="Online now" value={stats?.onlineUsers ?? "—"} tone={C.teal} live />
          </div>

          {stats && (
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              {Object.entries(stats.tasksByStatus).map(([status, count]) => (
                <div key={status} style={{ flex: 1, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 11, color: C.textFaint }}>{status.replace("_", " ")}</div>
                  <div style={{ fontSize: 18, fontWeight: 650, marginTop: 2 }}>{count}</div>
                </div>
              ))}
            </div>
          )}

          <ProjectsList />
        </div>
        <ActivityFeed events={feed} title="Global live feed" />
      </div>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, tone, live }: { icon: any; label: string; value: number | string; tone?: string; live?: boolean }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.textFaint, fontSize: 11.5 }}>
        <Icon size={13} /> {label}
        {live && <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.teal, marginLeft: 2, animation: "pulse-dot 1.6s infinite" }} />}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: tone || C.text }}>{value}</div>
    </div>
  );
}

function ProjectsList() {
  const [projects, setProjects] = useState<any[]>([]);
  useEffect(() => {
    projectsApi.list().then(({ data }) => setProjects(data));
  }, []);
  return (
    <div>
      <div style={{ fontSize: 12.5, color: C.textFaint, marginBottom: 8 }}>All projects</div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        {projects.map((p) => (
          <Link
            key={p.id}
            to={`/projects/${p.id}`}
            style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderBottom: `1px solid ${C.border}`, background: C.panel, color: C.text, textDecoration: "none" }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
              <div style={{ fontSize: 11.5, color: C.textFaint }}>{p.client?.name} · owner {p.createdBy?.name}</div>
            </div>
            <div style={{ fontSize: 11.5, color: C.textDim }}>{p._count?.tasks ?? 0} tasks</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
