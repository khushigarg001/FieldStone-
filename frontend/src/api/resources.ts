import { api } from "./client";
import { Project, Task, ActivityEvent, Notification, Client, TaskStatus, Priority } from "../types";

export const authApi = {
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),
  refresh: () => api.post("/auth/refresh"),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

export const projectsApi = {
  list: () => api.get<Project[]>("/projects"),
  get: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (data: { name: string; description?: string; clientId: string }) =>
    api.post<Project>("/projects", data),
};

export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueBefore?: string;
  dueAfter?: string;
}

export const tasksApi = {
  list: (filters: TaskFilters) => api.get<Task[]>("/tasks", { params: filters }),
  get: (id: string) => api.get<Task>(`/tasks/${id}`),
  create: (data: {
    projectId: string;
    title: string;
    description?: string;
    priority: Priority;
    dueDate: string;
    assignedToId?: string;
  }) => api.post<Task>("/tasks", data),
  updateStatus: (id: string, status: TaskStatus) =>
    api.patch<{ task: Task; activity: ActivityEvent }>(`/tasks/${id}/status`, { status }),
};

export const activityApi = {
  list: (params: { projectId?: string; limit?: number }) => api.get<ActivityEvent[]>("/activity", { params }),
  catchUp: (since?: string) => api.get<ActivityEvent[]>("/activity/catch-up", { params: { since } }),
};

export const notificationsApi = {
  list: () => api.get<Notification[]>("/notifications"),
  unreadCount: () => api.get<{ count: number }>("/notifications/unread-count"),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
};

export const metaApi = {
  clients: () => api.get<Client[]>("/meta/clients"),
  createClient: (name: string) => api.post<Client>("/meta/clients", { name }),
  developers: () => api.get<{ id: string; name: string; email: string }[]>("/meta/developers"),
};

export const dashboardApi = {
  admin: () => api.get("/dashboard/admin"),
  pm: () => api.get("/dashboard/pm"),
  developer: () => api.get("/dashboard/developer"),
};
