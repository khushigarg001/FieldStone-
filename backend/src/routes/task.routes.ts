import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middleware/validate";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import * as taskService from "../services/task.service";
import { broadcastActivity } from "../sockets";

const router = Router();
router.use(requireAuth);

const statusEnum = z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]);
const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);


const listQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
});

const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(300),
  description: z.string().max(4000).optional(),
  priority: priorityEnum.default("MEDIUM"),
  dueDate: z.coerce.date(),
  assignedToId: z.string().uuid().optional(),
});

const statusUpdateSchema = z.object({ status: statusEnum });

router.get(
  "/",
  validate(listQuerySchema, "query"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const tasks = await taskService.listTasks(req.user!, req.query as any);
    res.json(tasks);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const task = await taskService.getTaskOrThrow(req.user!, req.params.id);
    res.json(task);
  })
);

router.post(
  "/",
  requireRole("ADMIN", "PM"),
  validate(createTaskSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
    const task = await taskService.createTask(req.user!, req.body);
    res.status(201).json(task);
  })
);

router.patch(
  "/:id/status",
  validate(statusUpdateSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { task, activity } = await taskService.updateTaskStatus(req.user!, req.params.id, req.body.status);

    broadcastActivity(
      {
        id: activity.id,
        projectId: activity.projectId,
        message: activity.message,
        createdAt: activity.createdAt,
        toStatus: activity.toStatus,
        fromStatus: activity.fromStatus,
        user: activity.user,
        task: { id: task.id, title: task.title },
      },
      { projectOwnerId: task.project.createdById, assignedToId: task.assignedToId }
    );

    res.json({ task, activity });
  })
);

export default router;
