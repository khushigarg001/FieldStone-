import { Prisma, Role } from "@prisma/client";
import { prisma } from "../config/prisma";

interface ActingUser {
  id: string;
  role: Role;
}

export function activityScopeWhere(user: ActingUser): Prisma.TaskActivityWhereInput {
  if (user.role === "ADMIN") return {};
  if (user.role === "PM") return { project: { createdById: user.id } };
  return { task: { assignedToId: user.id } };
}

const includeShape = {
  user: { select: { id: true, name: true } },
  project: { select: { id: true, name: true } },
  task: { select: { id: true, title: true } },
} satisfies Prisma.TaskActivityInclude;

export async function listActivity(user: ActingUser, opts: { projectId?: string; limit?: number }) {
  return prisma.taskActivity.findMany({
    where: {
      AND: [activityScopeWhere(user), opts.projectId ? { projectId: opts.projectId } : {}],
    },
    include: includeShape,
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 50,
  });
}

export async function catchUpActivity(user: ActingUser, sinceTimestamp?: Date) {
  return prisma.taskActivity.findMany({
    where: {
      AND: [activityScopeWhere(user), sinceTimestamp ? { createdAt: { gt: sinceTimestamp } } : {}],
    },
    include: includeShape,
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
