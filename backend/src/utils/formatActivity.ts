import { TaskStatus } from "@prisma/client";

const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

export function formatStatusChangeMessage(params: {
  actorName: string;
  taskTitle: string;
  taskShortId: string;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
}): string {
  const { actorName, taskTitle, taskShortId, fromStatus, toStatus } = params;
  const to = STATUS_LABEL[toStatus];
  if (!fromStatus) {
    return `${actorName} created Task #${taskShortId} "${taskTitle}" in ${to}`;
  }
  const from = STATUS_LABEL[fromStatus];
  return `${actorName} moved Task #${taskShortId} "${taskTitle}" from ${from} → ${to}`;
}

export function shortTaskId(uuid: string): string {
  return uuid.slice(0, 8);
}
