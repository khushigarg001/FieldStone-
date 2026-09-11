import { NotificationType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { getIO } from "../sockets";

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  message: string;
  relatedTaskId?: string;
}) {
  const notification = await prisma.notification.create({ data: params });

  const io = getIO();
  io.to(`user:${params.userId}`).emit("notification:new", notification);
  const unread = await prisma.notification.count({ where: { userId: params.userId, isRead: false } });
  io.to(`user:${params.userId}`).emit("notification:unread_count", { count: unread });

  return notification;
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function unreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markRead(userId: string, notificationId: string) {

  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
  const count = await unreadCount(userId);
  getIO().to(`user:${userId}`).emit("notification:unread_count", { count });
  return count;
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  getIO().to(`user:${userId}`).emit("notification:unread_count", { count: 0 });
  return 0;
}
