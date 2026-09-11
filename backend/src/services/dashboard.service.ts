import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { projectScopeWhere } from "./project.service";
import { getOnlineUserCount } from "../sockets/presence";

interface ActingUser {
  id: string;
  role: Role;
}

export async function adminDashboard() {
  const [totalProjects, statusCounts, overdueCount] = await Promise.all([
    prisma.project.count(),
    prisma.task.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.task.count({ where: { isOverdue: true } }),
  ]);

  return {
    totalProjects,
    tasksByStatus: Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all])),
    overdueCount,
    onlineUsers: getOnlineUserCount(),
  };
}

export async function pmDashboard(user: ActingUser) {
  const projects = await prisma.project.findMany({
    where: projectScopeWhere(user),
    include: { _count: { select: { tasks: true } } },
  });

  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [priorityCounts, upcoming] = await Promise.all([
    prisma.task.groupBy({
      by: ["priority"],
      where: { project: { createdById: user.id } },
      _count: { _all: true },
    }),
    prisma.task.findMany({
      where: { project: { createdById: user.id }, dueDate: { lte: weekFromNow }, status: { not: "DONE" } },
      orderBy: { dueDate: "asc" },
      include: { assignedTo: { select: { id: true, name: true } }, project: { select: { name: true } } },
      take: 25,
    }),
  ]);

  return {
    projects,
    tasksByPriority: Object.fromEntries(priorityCounts.map((p) => [p.priority, p._count._all])),
    upcomingThisWeek: upcoming,
  };
}

export async function developerDashboard(user: ActingUser) {
  const tasks = await prisma.task.findMany({
    where: { assignedToId: user.id },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    include: { project: { select: { id: true, name: true } } },
  });
  return { tasks };
}
