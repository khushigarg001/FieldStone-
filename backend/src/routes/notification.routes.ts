import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import * as notificationService from "../services/notification.service";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await notificationService.listNotifications(req.user!.id));
  })
);

router.get(
  "/unread-count",
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ count: await notificationService.unreadCount(req.user!.id) });
  })
);

router.patch(
  "/:id/read",
  asyncHandler(async (req: AuthedRequest, res) => {
    const count = await notificationService.markRead(req.user!.id, req.params.id);
    res.json({ unreadCount: count });
  })
);

router.patch(
  "/read-all",
  asyncHandler(async (req: AuthedRequest, res) => {
    const count = await notificationService.markAllRead(req.user!.id);
    res.json({ unreadCount: count });
  })
);

export default router;
