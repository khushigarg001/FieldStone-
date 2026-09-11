import React, { useEffect, useState } from "react";
import { C } from "../theme";
import { metaApi, tasksApi } from "../api/resources";
import { apiErrorMessage } from "../api/client";
import { Priority } from "../types";

export function NewTaskModal({ projectId, onClose, onCreated }: { projectId: string; onClose: () => void; onCreated: () => void }) {
  const [developers, setDevelopers] = useState<{ id: string; name: string }[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [assignedToId, setAssignedToId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    metaApi.developers().then(({ data }) => {
      setDevelopers(data);
      if (data[0]) setAssignedToId(data[0].id);
    });
  }, []);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await tasksApi.create({ projectId, title, description, priority, dueDate, assignedToId: assignedToId || undefined });
      onCreated();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(6,8,12,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, width: 420, padding: 18 }}>
        <h2 style={{ margin: "0 0 14px", fontSize: 15.5 }}>New task</h2>

        <Label>Title</Label>
        <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />

        <Label>Description</Label>
        <textarea style={{ ...inputStyle, minHeight: 55 }} value={description} onChange={(e) => setDescription(e.target.value)} />

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Label>Assignee</Label>
            <select style={inputStyle} value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
              {developers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <Label>Priority</Label>
            <select style={inputStyle} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        <Label>Due date</Label>
        <input type="date" style={inputStyle} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

        {error && <div style={{ color: C.coral, fontSize: 12, marginBottom: 10 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button onClick={onClose} style={{ flex: 1, background: "none", border: `1px solid ${C.border}`, color: C.textDim, borderRadius: 7, padding: "8px 0" }}>Cancel</button>
          <button disabled={busy || !title.trim() || !dueDate} onClick={submit} style={{ flex: 1, background: C.amber, border: "none", color: "#1B1404", fontWeight: 650, borderRadius: 7, padding: "8px 0" }}>
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 4 }}>{children}</div>;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: C.panelAlt,
  border: `1px solid ${C.border}`,
  borderRadius: 7,
  padding: "8px 10px",
  color: C.text,
  fontSize: 13,
  marginBottom: 12,
};
