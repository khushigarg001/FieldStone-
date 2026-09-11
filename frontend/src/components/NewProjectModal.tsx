import React, { useEffect, useState } from "react";
import { C } from "../theme";
import { metaApi, projectsApi } from "../api/resources";
import { apiErrorMessage } from "../api/client";
import { Client } from "../types";

export function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    metaApi.clients().then(({ data }) => {
      setClients(data);
      if (data[0]) setClientId(data[0].id);
    });
  }, []);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      let finalClientId = clientId;
      if (!finalClientId && newClientName.trim()) {
        const { data } = await metaApi.createClient(newClientName.trim());
        finalClientId = data.id;
      }
      const { data } = await projectsApi.create({ name, description, clientId: finalClientId });
      onCreated(data.id);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(6,8,12,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, width: 420, padding: 18 }}>
        <h2 style={{ margin: "0 0 14px", fontSize: 15.5 }}>New project</h2>

        <Label>Name</Label>
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} autoFocus />

        <Label>Client</Label>
        <select style={inputStyle} value={clientId} onChange={(e) => setClientId(e.target.value)}>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {clients.length === 0 && (
          <>
            <Label>New client name</Label>
            <input style={inputStyle} value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="e.g. Acme Co" />
          </>
        )}

        <Label>Description</Label>
        <textarea style={{ ...inputStyle, minHeight: 60 }} value={description} onChange={(e) => setDescription(e.target.value)} />

        {error && <div style={{ color: C.coral, fontSize: 12, marginBottom: 10 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
          <button onClick={onClose} style={{ flex: 1, background: "none", border: `1px solid ${C.border}`, color: C.textDim, borderRadius: 7, padding: "8px 0" }}>Cancel</button>
          <button disabled={busy || !name.trim()} onClick={submit} style={{ flex: 1, background: C.amber, border: "none", color: "#1B1404", fontWeight: 650, borderRadius: 7, padding: "8px 0" }}>
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
