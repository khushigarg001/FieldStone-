import { Prisma, Role, TaskStatus, Priority } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { projectScopeWhere } from "./project.service";
import { formatStatusChangeMessage, shortTaskId } from "../utils/formatActivity";
import { createNotification } from "./notification.service";

interface ActingUser {
  id: string;
  role: Role;
  name?: string;
}

export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueBefore?: Date;
  dueAfter?: Date;
}

function taskScopeWhere(user: ActingUser): Prisma.TaskWhereInput {
  if (user.role === "ADMIN") return {};
  if (user.role === "PM") return { project: { createdById: user.id } };
  return { assignedToId: user.id };
}

export async function listTasks(user: ActingUser, filters: TaskFilters) {
  const where: Prisma.TaskWhereInput = {
    AND: [
      taskScopeWhere(user),
      filters.projectId ? { projectId: filters.projectId } : {},
      filters.status ? { status: filters.status } : {},
      filters.priority ? { priority: filters.priority } : {},
      filters.dueBefore || filters.dueAfter
        ? {
            dueDate: {
              ...(filters.dueAfter ? { gte: filters.dueAfter } : {}),
              ...(filters.dueBefore ? { lte: filters.dueBefore } : {}),
            },
          }
        : {},
    ],
  };

  return prisma.task.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
  });
}

export async function getTaskOrThrow(user: ActingUser, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, ...taskScopeWhere(user) },
    include: {
      assignedTo: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, createdById: true } },
    },
  });
  if (!task) throw AppError.notFound("Task not found");
  return task;
}

export async function createTask(
  user: ActingUser,
  data: {
    projectId: string;
    title: string;
    description?: string;
    priority: Priority;
    dueDate: Date;
    assignedToId?: string;
  }
) {

  const project = await prisma.project.findFirst({
    where: { id: data.projectId, ...projectScopeWhere(user) },
  });
  if (!project) throw AppError.notFound("Project not found");
  if (user.role === "DEVELOPER") throw AppError.forbidden("Developers cannot create tasks");

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate,
        assignedToId: data.assignedToId,
        status: "TODO",
      },
      include: { assignedTo: { select: { id: true, name: true } }, project: true },
    });

    await tx.taskActivity.create({
      data: {
        taskId: created.id,
        projectId: created.projectId,
        userId: user.id,
        fromStatus: null,
        toStatus: "TODO",
        message: formatStatusChangeMessage({
          actorName: user.name || "Someone",
          taskTitle: created.title,
          taskShortId: shortTaskId(created.id),
          fromStatus: null,
          toStatus: "TODO",
        }),
      },
    });

    return created;
  });

  if (task.assignedToId) {
    await createNotification({
      userId: task.assignedToId,
      type: "TASK_ASSIGNED",
      message: `You were assigned to "${task.title}"`,
      relatedTaskId: task.id,
    });
  }

  return task;
}

export async function updateTaskStatus(user: ActingUser, taskId: string, newStatus: TaskStatus) {
  const existing = await prisma.task.findFirst({
    where: { id: taskId, ...taskScopeWhere(user) },
    include: { project: true },
  });
  if (!existing) throw AppError.notFound("Task not found");

  if (user.role === "DEVELOPER" && existing.assignedToId !== user.id) {

    throw AppError.forbidden("You can only update tasks assigned to you");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: taskId },
      data: { status: newStatus, isOverdue: newStatus === "DONE" ? false : existing.isOverdue },
      include: { assignedTo: { select: { id: true, name: true } }, project: true },
    });

    const activity = await tx.taskActivity.create({
      data: {
        taskId: updated.id,
        projectId: updated.projectId,
        userId: user.id,
        fromStatus: existing.status,
        toStatus: newStatus,
        message: formatStatusChangeMessage({
          actorName: user.name || "Someone",
          taskTitle: updated.title,
          taskShortId: shortTaskId(updated.id),
          fromStatus: existing.status,
          toStatus: newStatus,
        }),
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return { task: updated, activity };
  });

  if (newStatus === "IN_REVIEW") {
    await createNotification({
      userId: existing.project.createdById,
      type: "TASK_MOVED_TO_REVIEW",
      message: `"${result.task.title}" was moved to In Review`,
      relatedTaskId: taskId,
    });
  }

  return result;
}
