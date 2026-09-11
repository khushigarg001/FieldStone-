export type Role = "ADMIN" | "PM" | "DEVELOPER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type NotificationType = "TASK_ASSIGNED" | "TASK_MOVED_TO_REVIEW" | "TASK_OVERDUE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Client {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  clientId: string;
  client?: Client;
  createdById: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
  _count?: { tasks: number };
}

export interface Task {
  id: string;
  projectId: string;
  project?: { id: string; name: string };
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string } | null;
  isOverdue: boolean;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  projectId: string;
  taskId: string;
  message: string;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  createdAt: string;
  user: { id: string; name: string };
  project?: { id: string; name: string };
  task?: { id: string; title: string };
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  relatedTaskId?: string | null;
  isRead: boolean;
  createdAt: string;
}
