import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";
import { env } from "../config/env";
import { markOnline, markOffline, getOnlineUserCount } from "./presence";
import { getProjectOrThrow } from "../services/project.service";
import { Role } from "@prisma/client";

let io: Server;

interface AuthedSocket extends Socket {
  data: { userId: string; role: Role };
}

export function initSockets(server: HttpServer) {
  io = new Server(server, {
    cors: { origin: env.clientOrigin, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("UNAUTHORIZED"));
    try {
      const payload = verifyAccessToken(token);
      (socket as AuthedSocket).data.userId = payload.sub;
      (socket as AuthedSocket).data.role = payload.role;
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket: AuthedSocket) => {
    const { userId, role } = socket.data;

    socket.join(`user:${userId}`);
    if (role === "ADMIN") socket.join("role:admin");
    if (role === "PM") socket.join(`pm:${userId}`);

    markOnline(userId, socket.id);
    io.emit("presence:count", { count: getOnlineUserCount() });

    socket.on("project:join", async (projectId: string, ack?: (ok: boolean) => void) => {
      try {
        await getProjectOrThrow({ id: userId, role }, projectId);
        socket.join(`project:${projectId}`);
        ack?.(true);
      } catch {
        ack?.(false);
      }
    });

    socket.on("project:leave", (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on("disconnect", () => {
      markOffline(userId, socket.id);
      io.emit("presence:count", { count: getOnlineUserCount() });
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io server accessed before initialization");
  return io;
}

export function broadcastActivity(activity: {
  id: string;
  projectId: string;
  message: string;
  createdAt: Date;
  toStatus: string;
  fromStatus: string | null;
  user: { id: string; name: string };
  task: { id: string; title: string };
}, opts: { projectOwnerId: string; assignedToId: string | null }) {
  const rooms = [
    `project:${activity.projectId}`,
    "role:admin",
    `pm:${opts.projectOwnerId}`,
    ...(opts.assignedToId ? [`user:${opts.assignedToId}`] : []),
  ];
  getIO().to(rooms).emit("activity:new", activity);
}
