import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import { activityApi } from "../api/resources";
import { ActivityEvent } from "../types";

export function useActivityFeed(projectId?: string) {
  const { socket, connected } = useSocket();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const newestSeenRef = useRef<string | null>(null);
  const wasConnectedRef = useRef(false);

  const merge = useCallback((incoming: ActivityEvent[]) => {
    if (incoming.length === 0) return;
    setEvents((prev) => {
      const byId = new Map(prev.map((e) => [e.id, e]));
      for (const e of incoming) byId.set(e.id, e);
      const merged = Array.from(byId.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return merged.slice(0, 100);
    });
    const newest = incoming.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
    if (!newestSeenRef.current || newest.createdAt > newestSeenRef.current) {
      newestSeenRef.current = newest.createdAt;
    }
  }, []);


  useEffect(() => {
    let cancelled = false;
    activityApi.list({ projectId, limit: 30 }).then(({ data }) => {
      if (cancelled) return;
      setEvents(data);
      if (data[0]) newestSeenRef.current = data[0].createdAt;
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (!socket || !projectId) return;
    socket.emit("project:join", projectId);
    return () => {
      socket.emit("project:leave", projectId);
    };
  }, [socket, projectId]);

  useEffect(() => {
    if (!socket) return;
    const handler = (event: ActivityEvent) => {
      if (projectId && event.projectId !== projectId) return;
      merge([event]);
    };
    socket.on("activity:new", handler);
    return () => {
      socket.off("activity:new", handler);
    };
  }, [socket, projectId, merge]);

  useEffect(() => {
    if (connected && wasConnectedRef.current === false && newestSeenRef.current) {
      activityApi.catchUp(newestSeenRef.current).then(({ data }) => merge(data));
    }
    wasConnectedRef.current = connected;
  }, [connected, merge]);

  return events;
}
