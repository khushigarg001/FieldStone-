import React from "react";
import { useSearchParams } from "react-router-dom";
import { C } from "../theme";

const selectStyle: React.CSSProperties = {
  background: C.panelAlt,
  border: `1px solid ${C.border}`,
  color: C.text,
  borderRadius: 7,
  padding: "6px 9px",
  fontSize: 12.5,
};

export function TaskFiltersBar() {
  const [params, setParams] = useSearchParams();

  function set(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <select style={selectStyle} value={params.get("status") || ""} onChange={(e) => set("status", e.target.value)}>
        <option value="">All statuses</option>
        <option value="TODO">To Do</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="IN_REVIEW">In Review</option>
        <option value="DONE">Done</option>
      </select>
      <select style={selectStyle} value={params.get("priority") || ""} onChange={(e) => set("priority", e.target.value)}>
        <option value="">All priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="CRITICAL">Critical</option>
      </select>
      <label style={{ fontSize: 11.5, color: C.textFaint, display: "flex", alignItems: "center", gap: 5 }}>
        Due after
        <input type="date" style={selectStyle} value={params.get("dueAfter") || ""} onChange={(e) => set("dueAfter", e.target.value)} />
      </label>
      <label style={{ fontSize: 11.5, color: C.textFaint, display: "flex", alignItems: "center", gap: 5 }}>
        Due before
        <input type="date" style={selectStyle} value={params.get("dueBefore") || ""} onChange={(e) => set("dueBefore", e.target.value)} />
      </label>
      {(params.get("status") || params.get("priority") || params.get("dueAfter") || params.get("dueBefore")) && (
        <button
          onClick={() => setParams(new URLSearchParams(), { replace: true })}
          style={{ background: "none", border: "none", color: C.amber, fontSize: 11.5 }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

export function useTaskFiltersFromUrl() {
  const [params] = useSearchParams();
  return {
    status: params.get("status") || undefined,
    priority: params.get("priority") || undefined,
    dueAfter: params.get("dueAfter") || undefined,
    dueBefore: params.get("dueBefore") || undefined,
  };
}
