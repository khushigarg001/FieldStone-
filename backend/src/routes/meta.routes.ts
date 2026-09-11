import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { prisma } from "../config/prisma";

const router = Router();
router.use(requireAuth);

router.get(
  "/clients",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.client.findMany({ orderBy: { name: "asc" } }));
  })
);

router.post(
  "/clients",
  requireRole("ADMIN", "PM"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ error: { code: "BAD_REQUEST", message: "name is required" } });
    const client = await prisma.client.create({ data: { name } });
    res.status(201).json(client);
  })
);

router.get(
  "/developers",
  requireRole("ADMIN", "PM"),
  asyncHandler(async (_req, res) => {
    const devs = await prisma.user.findMany({
      where: { role: "DEVELOPER" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    res.json(devs);
  })
);

export default router;
