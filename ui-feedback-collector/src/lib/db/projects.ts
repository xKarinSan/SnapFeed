import { prisma } from "./prisma";

export async function getProjects() {
  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { feedbacks: true },
      },
    },
  });
}

export async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      feedbacks: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { feedbacks: true, sessions: true },
      },
    },
  });
}

export async function createProject(data: { name: string; url: string }) {
  return prisma.project.create({
    data,
  });
}

export async function updateProject(
  id: string,
  data: { name?: string; url?: string }
) {
  return prisma.project.update({
    where: { id },
    data,
  });
}

export async function deleteProject(id: string) {
  return prisma.project.delete({
    where: { id },
  });
}
