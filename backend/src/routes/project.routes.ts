import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middleware/validate";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import * as projectService from "../services/project.service";

const router = Router();
router.use(requireAuth);

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  clientId: z.string().uuid(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
});

router.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const projects = await projectService.listProjects(req.user!);
    res.json(projects);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const project = await projectService.getProjectOrThrow(req.user!, req.params.id);
    res.json(project);
  })
);

router.post(
  "/",
  requireRole("ADMIN", "PM"),
  validate(createProjectSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
    const project = await projectService.createProject(req.user!, req.body);
    res.status(201).json(project);
  })
);

router.patch(
  "/:id",
  requireRole("ADMIN", "PM"),
  validate(updateProjectSchema),
  asyncHandler(async (req: AuthedRequest, res) => {
    const project = await projectService.updateProject(req.user!, req.params.id, req.body);
    res.json(project);
  })
);

router.delete(
  "/:id",
  requireRole("ADMIN", "PM"),
  asyncHandler(async (req: AuthedRequest, res) => {
    await projectService.deleteProject(req.user!, req.params.id);
    res.status(204).send();
  })
);

export default router;
