
import { PrismaClient, Priority, TaskStatus, User } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();


async function main() {
  const password = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@fieldstone.dev" },
    update: {},
    create: { email: "admin@fieldstone.dev", name: "Priya Menon", role: "ADMIN", passwordHash: password },
  });

  const pm1 = await prisma.user.upsert({
    where: { email: "marcus.pm@fieldstone.dev" },
    update: {},
    create: { email: "marcus.pm@fieldstone.dev", name: "Marcus Ortega", role: "PM", passwordHash: password },
  });

  const pm2 = await prisma.user.upsert({
    where: { email: "elena.pm@fieldstone.dev" },
    update: {},
    create: { email: "elena.pm@fieldstone.dev", name: "Elena Cho", role: "PM", passwordHash: password },
  });

  const devNames = [
    ["sana.dev@fieldstone.dev", "Sana Iqbal"],
    ["tobias.dev@fieldstone.dev", "Tobias Reed"],
    ["ravi.dev@fieldstone.dev", "Ravi Shankar"],
    ["nadia.dev@fieldstone.dev", "Nadia Farouk"],
  ] as const;


  const devs: User[] = [];
  for (const [email, name] of devNames) {
    devs.push(
      await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, name, role: "DEVELOPER", passwordHash: password },
      })
    );
  }
  const [sana, tobias, ravi, nadia] = devs;

  const northwind = await prisma.client.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: { id: "00000000-0000-0000-0000-000000000001", name: "Northwind Retail" },
  });
  const halcyon = await prisma.client.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: { id: "00000000-0000-0000-0000-000000000002", name: "Halcyon Health" },
  });
  const internalClient = await prisma.client.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    update: {},
    create: { id: "00000000-0000-0000-0000-000000000003", name: "Internal" },
  });

  async function upsertProject(id: string, name: string, clientId: string, ownerId: string) {
    return prisma.project.upsert({
      where: { id },
      update: {},
      create: { id, name, clientId, createdById: ownerId, description: `${name} — managed engagement.` },
    });
  }

  const siteRelaunch = await upsertProject("10000000-0000-0000-0000-000000000001", "Site Relaunch", northwind.id, pm1.id);
  const patientPortal = await upsertProject("10000000-0000-0000-0000-000000000002", "Patient Portal", halcyon.id, pm2.id);
  const brandRefresh = await upsertProject("10000000-0000-0000-0000-000000000003", "Brand Refresh", internalClient.id, pm1.id);

  const now = Date.now();
  const days = (n: number) => new Date(now + n * 24 * 60 * 60 * 1000);

  type SeedTask = {
    id: string;
    projectId: string;
    title: string;
    status: TaskStatus;
    priority: Priority;
    dueDate: Date;
    assignedToId: string;
  };

  const tasks: SeedTask[] = [
    // Site Relaunch — 5 tasks, one overdue
    { id: "20000000-0000-0000-0000-000000000001", projectId: siteRelaunch.id, title: "Migrate product catalog to new schema", status: "IN_PROGRESS", priority: "HIGH", dueDate: days(4), assignedToId: tobias.id },
    { id: "20000000-0000-0000-0000-000000000002", projectId: siteRelaunch.id, title: "Checkout flow accessibility pass", status: "IN_REVIEW", priority: "MEDIUM", dueDate: days(2), assignedToId: sana.id },
    { id: "20000000-0000-0000-0000-000000000003", projectId: siteRelaunch.id, title: "Homepage hero design v3", status: "DONE", priority: "LOW", dueDate: days(-3), assignedToId: sana.id },
    { id: "20000000-0000-0000-0000-000000000004", projectId: siteRelaunch.id, title: "Fix broken search facets", status: "TODO", priority: "CRITICAL", dueDate: days(-2), assignedToId: tobias.id }, // overdue #1
    { id: "20000000-0000-0000-0000-000000000005", projectId: siteRelaunch.id, title: "Draft Q4 hosting cost estimate", status: "TODO", priority: "LOW", dueDate: days(9), assignedToId: ravi.id },

    // Patient Portal — 6 tasks, one overdue
    { id: "20000000-0000-0000-0000-000000000006", projectId: patientPortal.id, title: "HIPAA audit log for record access", status: "IN_PROGRESS", priority: "CRITICAL", dueDate: days(1), assignedToId: ravi.id },
    { id: "20000000-0000-0000-0000-000000000007", projectId: patientPortal.id, title: "Appointment reminder SMS copy", status: "IN_REVIEW", priority: "MEDIUM", dueDate: days(3), assignedToId: nadia.id },
    { id: "20000000-0000-0000-0000-000000000008", projectId: patientPortal.id, title: "Provider dashboard empty states", status: "TODO", priority: "MEDIUM", dueDate: days(6), assignedToId: nadia.id },
    { id: "20000000-0000-0000-0000-000000000009", projectId: patientPortal.id, title: "Renegotiate scope for lab-results module", status: "TODO", priority: "HIGH", dueDate: days(-1), assignedToId: ravi.id }, // overdue #2
    { id: "20000000-0000-0000-0000-000000000010", projectId: patientPortal.id, title: "Insurance verification API integration", status: "IN_PROGRESS", priority: "HIGH", dueDate: days(5), assignedToId: tobias.id },
    { id: "20000000-0000-0000-0000-000000000011", projectId: patientPortal.id, title: "Patient intake form validation", status: "DONE", priority: "MEDIUM", dueDate: days(-5), assignedToId: nadia.id },

    // Brand Refresh — 5 tasks
    { id: "20000000-0000-0000-0000-000000000012", projectId: brandRefresh.id, title: "New type system for pitch decks", status: "IN_PROGRESS", priority: "MEDIUM", dueDate: days(8), assignedToId: sana.id },
    { id: "20000000-0000-0000-0000-000000000013", projectId: brandRefresh.id, title: "Update letterhead and email signatures", status: "DONE", priority: "LOW", dueDate: days(-8), assignedToId: sana.id },
    { id: "20000000-0000-0000-0000-000000000014", projectId: brandRefresh.id, title: "Refresh brand guidelines PDF", status: "TODO", priority: "LOW", dueDate: days(12), assignedToId: ravi.id },
    { id: "20000000-0000-0000-0000-000000000015", projectId: brandRefresh.id, title: "Social media template set", status: "TODO", priority: "MEDIUM", dueDate: days(10), assignedToId: nadia.id },
    { id: "20000000-0000-0000-0000-000000000016", projectId: brandRefresh.id, title: "Business card redesign", status: "IN_REVIEW", priority: "LOW", dueDate: days(3), assignedToId: sana.id },
  ];

  for (const t of tasks) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        projectId: t.projectId,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        assignedToId: t.assignedToId,
        isOverdue: t.dueDate < new Date() && t.status !== "DONE",
      },
    });
  }


  let activitySeeded = 0;
  for (const t of tasks) {
    const activityId = `30000000-0000-0000-0000-${(activitySeeded + 1).toString().padStart(12, "0")}`;
    const assignee = devs.find((d) => d.id === t.assignedToId)!;
    await prisma.taskActivity.upsert({
      where: { id: activityId },
      update: {},
      create: {
        id: activityId,
        taskId: t.id,
        projectId: t.projectId,
        userId: assignee.id,
        fromStatus: null,
        toStatus: "TODO",
        message: `${assignee.name} created Task #${t.id.slice(0, 8)} "${t.title}" in To Do`,
        createdAt: new Date(now - (tasks.length - activitySeeded) * 3600_000),
      },
    });
    activitySeeded++;

    if (t.status !== "TODO") {
      const activityId2 = `30000000-0000-0000-0001-${activitySeeded.toString().padStart(12, "0")}`;
      await prisma.taskActivity.upsert({
        where: { id: activityId2 },
        update: {},
        create: {
          id: activityId2,
          taskId: t.id,
          projectId: t.projectId,
          userId: assignee.id,
          fromStatus: "TODO",
          toStatus: t.status,
          message: `${assignee.name} moved Task #${t.id.slice(0, 8)} "${t.title}" from To Do → ${t.status.replace("_", " ")}`,
          createdAt: new Date(now - (tasks.length - activitySeeded) * 1800_000),
        },
      });
    }
  }

  console.log("Seed complete:");
  console.log(`  Admin:      admin@fieldstone.dev`);
  console.log(`  PMs:        marcus.pm@fieldstone.dev, elena.pm@fieldstone.dev`);
  console.log(`  Developers: sana.dev@fieldstone.dev, tobias.dev@fieldstone.dev, ravi.dev@fieldstone.dev, nadia.dev@fieldstone.dev`);
  console.log(`  Password for all seed accounts: Password123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
