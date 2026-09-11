import React, { useState } from "react";
import { Task, TaskStatus, Role } from "../types";
import { C, PRIORITY_COLOR, STATUS_LABEL, fmtDate } from "../theme";
import { Clock, AlertTriangle } from "lucide-react";

const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

interface Props {
  tasks: Task[];
  currentUserId: string;
  role: Role;
  onMove: (task: Task, status: TaskStatus) => void;
}

function canMove(task: Task, role: Role, userId: string) {
  if (role === "DEVELOPER") return task.assignedToId === userId;
  return role === "PM" || role === "ADMIN";
}

export function TaskBoard({ tasks, currentUserId, role, onMove }: Props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(220px, 1fr))", gap: 14, overflowX: "auto" }}>
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col);
        return (
          <div key={col} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, display: "flex", flexDirection: "column", minHeight: 200 }}>
            <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, fontSize: 12.5, fontWeight: 600, color: C.textDim }}>
              {STATUS_LABEL[col]} <span style={{ color: C.textFaint, fontWeight: 400 }}>· {colTasks.length}</span>
            </div>
            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              {colTasks.map((t) => (
                <TaskCard key={t.id} task={t} movable={canMove(t, role, currentUserId)} onMove={(status) => onMove(t, status)} />
              ))}
              {colTasks.length === 0 && <div style={{ fontSize: 12, color: C.textFaint, padding: "10px 4px" }}>Nothing here.</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskCard({ task, movable, onMove }: { task: Task; movable: boolean; onMove: (status: TaskStatus) => void }) {
  const [expanded, setExpanded] = useState(false);
  const nextOptions = COLUMNS.filter((c) => c !== task.status);

  return (
    <div
      style={{
        background: C.panelAlt,
        border: `1px solid ${C.border}`,
        borderLeft: `3px solid ${PRIORITY_COLOR[task.priority]}`,
        borderRadius: 7,
        padding: "9px 10px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.35 }}>{task.title}</div>
        {task.isOverdue && <AlertTriangle size={13} color={C.coral} style={{ flexShrink: 0, marginTop: 1 }} />}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: task.isOverdue ? C.coral : C.textFaint }}>
          <Clock size={11} /> {fmtDate(task.dueDate)}
        </div>
        {task.assignedTo && (
          <span title={task.assignedTo.name} style={{ fontSize: 10.5, color: C.textDim, background: C.raised, borderRadius: 5, padding: "1px 6px" }}>
            {task.assignedTo.name.split(" ")[0]}
          </span>
        )}
      </div>

      {movable && (
        <div style={{ marginTop: 8 }}>
          {!expanded ? (
            <button onClick={() => setExpanded(true)} style={{ fontSize: 11, background: "none", border: `1px dashed ${C.border}`, color: C.textDim, borderRadius: 5, padding: "3px 8px", width: "100%" }}>
              Move…
            </button>
          ) : (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {nextOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onMove(s);
                    setExpanded(false);
                  }}
                  style={{ fontSize: 10.5, background: C.raised, border: `1px solid ${C.border}`, color: C.text, borderRadius: 5, padding: "3px 7px" }}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
