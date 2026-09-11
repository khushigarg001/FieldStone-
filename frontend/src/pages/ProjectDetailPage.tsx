import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { ActivityFeed } from "../components/ActivityFeed";
import { TaskBoard } from "../components/TaskBoard";
import { TaskFiltersBar, useTaskFiltersFromUrl } from "../components/TaskFiltersBar";
import { NewTaskModal } from "../components/NewTaskModal";
import { useActivityFeed } from "../hooks/useActivityFeed";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { projectsApi, tasksApi } from "../api/resources";
import { Task, TaskStatus, Project } from "../types";
import { C } from "../theme";
import { Plus } from "lucide-react";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { socket } = useSocket();
  const filters = useTaskFiltersFromUrl();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showNewTask, setShowNewTask] = useState(false);
  const feed = useActivityFeed(id); 

  const loadTasks = useCallback(() => {
    if (!id) return;
    tasksApi.list({ projectId: id, ...(filters as any) }).then(({ data }) => setTasks(data));
  }, [id, JSON.stringify(filters)]);

  useEffect(() => {
    if (!id) return;
    projectsApi.get(id).then(({ data }) => setProject(data));
  }, [id]);

  useEffect(loadTasks, [loadTasks]);

  
  useEffect(() => {
    if (!socket || !id) return;
    const handler = (event: { projectId: string }) => {
      if (event.projectId === id) loadTasks();
    };
    socket.on("activity:new", handler);
    return () => {
      socket.off("activity:new", handler);
    };
  }, [socket, id, loadTasks]);

  async function move(task: Task, status: TaskStatus) {
    const prev = tasks;
    setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, status } : x)));
    try {
      await tasksApi.updateStatus(task.id, status);
    } catch {
      setTasks(prev);
    }
  }

  const canCreateTask = user?.role === "ADMIN" || user?.role === "PM";

  return (
    <AppShell>
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
            <div>
              <h1 style={{ fontSize: 19, fontWeight: 650, margin: 0 }}>{project?.name || "…"}</h1>
              <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 2 }}>{project?.client?.name}</div>
            </div>
            {canCreateTask && (
              <button
                onClick={() => setShowNewTask(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: C.amber, color: "#1B1404", border: "none", borderRadius: 7, padding: "7px 12px", fontWeight: 650, fontSize: 12.5 }}
              >
                <Plus size={14} /> New task
              </button>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <TaskFiltersBar />
          </div>

          {user && <TaskBoard tasks={tasks} currentUserId={user.id} role={user.role} onMove={move} />}
        </div>
        <ActivityFeed events={feed} title="This project — live" />
      </div>

      {showNewTask && id && (
        <NewTaskModal
          projectId={id}
          onClose={() => setShowNewTask(false)}
          onCreated={() => {
            setShowNewTask(false);
            loadTasks();
          }}
        />
      )}
    </AppShell>
  );
}
