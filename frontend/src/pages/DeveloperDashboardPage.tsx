import React, { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { ActivityFeed } from "../components/ActivityFeed";
import { TaskFiltersBar, useTaskFiltersFromUrl } from "../components/TaskFiltersBar";
import { useActivityFeed } from "../hooks/useActivityFeed";
import { useAuth } from "../context/AuthContext";
import { tasksApi } from "../api/resources";
import { Task, TaskStatus } from "../types";
import { C, PRIORITY_COLOR, STATUS_LABEL, fmtDate } from "../theme";
import { AlertTriangle } from "lucide-react";

export function DeveloperDashboardPage() {
  const { user } = useAuth();
  const filters = useTaskFiltersFromUrl();
  const [tasks, setTasks] = useState<Task[]>([]);
  const feed = useActivityFeed(); 

  useEffect(() => {
    tasksApi.list(filters as any).then(({ data }) => setTasks(data));
  }, [JSON.stringify(filters)]);

  async function move(task: Task, status: TaskStatus) {
    const prev = tasks;
    setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, status } : x))); 
    try {
      await tasksApi.updateStatus(task.id, status);
    } catch {
      setTasks(prev);
    }
  }

  return (
    <AppShell>
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 19, fontWeight: 650, margin: "0 0 4px" }}>Your tasks</h1>
          <p style={{ color: C.textDim, fontSize: 13, margin: "0 0 14px" }}>Sorted by priority, then due date.</p>
          <div style={{ marginBottom: 14 }}>
            <TaskFiltersBar />
          </div>

          <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            {tasks.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: `1px solid ${C.border}`, borderLeft: `3px solid ${PRIORITY_COLOR[t.priority]}`, background: C.panel }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                    {t.title}
                    {t.isOverdue && <AlertTriangle size={12} color={C.coral} />}
                  </div>
                  <div style={{ fontSize: 11, color: C.textFaint }}>{t.project?.name} · due {fmtDate(t.dueDate)}</div>
                </div>
                <select
                  value={t.status}
                  onChange={(e) => move(t, e.target.value as TaskStatus)}
                  style={{ background: C.panelAlt, border: `1px solid ${C.border}`, color: C.text, borderRadius: 6, padding: "5px 8px", fontSize: 12 }}
                >
                  {Object.entries(STATUS_LABEL).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            ))}
            {tasks.length === 0 && <div style={{ padding: 16, color: C.textFaint, fontSize: 12.5 }}>No tasks match these filters.</div>}
          </div>
        </div>
        <ActivityFeed events={feed} title="Your tasks — live feed" />
      </div>
    </AppShell>
  );
}
