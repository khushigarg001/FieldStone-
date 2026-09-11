import cron from "node-cron";
import { prisma } from "../config/prisma";
import { getIO } from "../sockets";

export function startOverdueJob() {
  const task = cron.schedule("*/5 * * * *", async () => {
    try {
      const overdue = await prisma.task.findMany({
        where: { status: { not: "DONE" }, dueDate: { lt: new Date() }, isOverdue: false },
        select: { id: true, projectId: true, title: true },
      });
      if (overdue.length === 0) return;

      await prisma.task.updateMany({
        where: { id: { in: overdue.map((t) => t.id) } },
        data: { isOverdue: true },
      });

      const io = getIO();
      for (const t of overdue) {
        io.to(`project:${t.projectId}`).emit("task:overdue", { taskId: t.id, title: t.title });
      }
      console.log(`[overdue-job] flagged ${overdue.length} task(s) as overdue`);
    } catch (err) {
      console.error("[overdue-job] failed:", err);
    }
  });

  return task;
}
