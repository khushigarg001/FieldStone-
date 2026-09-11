import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import * as dashboardService from "../services/dashboard.service";

const router = Router();
router.use(requireAuth);

router.get(
  "/admin",
  requireRole("ADMIN"),
  asyncHandler(async (_req, res) => {
    res.json(await dashboardService.adminDashboard());
  })
);

router.get(
  "/pm",
  requireRole("PM", "ADMIN"),
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await dashboardService.pmDashboard(req.user!));
  })
);

router.get(
  "/developer",
  requireRole("DEVELOPER"),
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await dashboardService.developerDashboard(req.user!));
  })
);

export default router;
