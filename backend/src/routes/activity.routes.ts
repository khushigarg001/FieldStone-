import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { validate } from "../middleware/validate";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import * as activityService from "../services/activity.service";

const router = Router();
router.use(requireAuth);

const listQuery = z.object({
  projectId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

router.get(
  "/",
  validate(listQuery, "query"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const feed = await activityService.listActivity(req.user!, req.query as any);
    res.json(feed);
  })
);

const catchUpQuery = z.object({ since: z.coerce.date().optional() });

router.get(
  "/catch-up",
  validate(catchUpQuery, "query"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const events = await activityService.catchUpActivity(req.user!, req.query.since as unknown as Date | undefined);
    res.json(events);
  })
);

export default router;
