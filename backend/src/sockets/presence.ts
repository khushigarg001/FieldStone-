
const onlineUsers = new Map<string, Set<string>>();

export function markOnline(userId: string, socketId: string) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId)!.add(socketId);
}

export function markOffline(userId: string, socketId: string) {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) onlineUsers.delete(userId);
}

export function getOnlineUserCount(): number {
  return onlineUsers.size;
}

export function isOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}
