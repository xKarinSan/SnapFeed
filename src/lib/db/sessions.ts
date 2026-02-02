import { prisma } from "./prisma";

export async function getSessionsByProject(projectId: string) {
  return prisma.feedbackSession.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { feedbacks: true, screenshots: true },
      },
    },
  });
}

export async function getSession(id: string) {
  return prisma.feedbackSession.findUnique({
    where: { id },
    include: {
      project: true,
      _count: {
        select: { feedbacks: true, screenshots: true },
      },
    },
  });
}

export async function createSession(data: { projectId: string; title: string }) {
  return prisma.feedbackSession.create({
    data,
  });
}

export async function updateSession(id: string, data: { title?: string }) {
  return prisma.feedbackSession.update({
    where: { id },
    data,
  });
}

export async function deleteSession(id: string) {
  return prisma.feedbackSession.delete({
    where: { id },
  });
}
