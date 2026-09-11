import { Prisma, Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

interface ActingUser {
  id: string;
  role: Role;
}


function projectScopeWhere(user: ActingUser): Prisma.ProjectWhereInput {
  if (user.role === "ADMIN") return {};
  if (user.role === "PM") return { createdById: user.id };

  return { tasks: { some: { assignedToId: user.id } } };
}

export async function listProjects(user: ActingUser) {
  return prisma.project.findMany({
    where: projectScopeWhere(user),
    include: {
      client: true,
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProjectOrThrow(user: ActingUser, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ...projectScopeWhere(user) },
    include: { client: true, createdBy: { select: { id: true, name: true } } },
  });
  if (!project) throw AppError.notFound("Project not found");
  return project;
}

export async function createProject(
  user: ActingUser,
  data: { name: string; description?: string; clientId: string }
) {
  return prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      clientId: data.clientId,
      createdById: user.id,
    },
    include: { client: true },
  });
}

export async function updateProject(
  user: ActingUser,
  projectId: string,
  data: { name?: string; description?: string }
) {
 
  await getProjectOrThrow(user, projectId);
  return prisma.project.update({ where: { id: projectId }, data });
}

export async function deleteProject(user: ActingUser, projectId: string) {
  await getProjectOrThrow(user, projectId);
  await prisma.project.delete({ where: { id: projectId } });
}

export { projectScopeWhere };
