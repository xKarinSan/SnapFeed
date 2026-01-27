import { prisma } from "./prisma";

export async function createScreenshot(data: {
  projectId: string;
  sessionId: string;
  filename: string;
  pageUrl: string;
  pageTitle?: string;
}) {
  return prisma.screenshot.create({
    data: {
      projectId: data.projectId,
      sessionId: data.sessionId,
      filename: data.filename,
      pageUrl: data.pageUrl,
      pageTitle: data.pageTitle,
    },
  });
}

export async function getScreenshotsByProject(projectId: string) {
  return prisma.screenshot.findMany({
    where: { projectId },
    include: {
      annotations: true,
      _count: {
        select: { annotations: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getScreenshotById(id: string) {
  return prisma.screenshot.findUnique({
    where: { id },
    include: {
      annotations: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function deleteScreenshot(id: string) {
  return prisma.screenshot.delete({
    where: { id },
  });
}

export async function getScreenshotByFilename(filename: string) {
  return prisma.screenshot.findUnique({
    where: { filename },
  });
}
