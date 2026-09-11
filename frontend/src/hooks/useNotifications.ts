import { useEffect, useState, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import { notificationsApi } from "../api/resources";
import { Notification } from "../types";

export function useNotifications() {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationsApi.list().then(({ data }) => setNotifications(data));
    notificationsApi.unreadCount().then(({ data }) => setUnreadCount(data.count));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onNew = (n: Notification) => setNotifications((prev) => [n, ...prev].slice(0, 50));

    const onCount = (payload: { count: number }) => setUnreadCount(payload.count);
    socket.on("notification:new", onNew);
    socket.on("notification:unread_count", onCount);
    return () => {
      socket.off("notification:new", onNew);
      socket.off("notification:unread_count", onCount);
    };
  }, [socket]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    const { data } = await notificationsApi.markRead(id);
    setUnreadCount(data.unreadCount);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await notificationsApi.markAllRead();
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, markRead, markAllRead };
}
