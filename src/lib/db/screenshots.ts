import { prisma } from "./prisma";

export async function createScreenshot(data: {
  sessionId: string;
  filename: string;
  pageUrl: string;
  pageTitle?: string;
}) {
  return prisma.screenshot.create({
    data: {
      sessionId: data.sessionId,
      filename: data.filename,
      pageUrl: data.pageUrl,
      pageTitle: data.pageTitle,
    },
  });
}

export async function getScreenshotsBySession(sessionId: string) {
  return prisma.screenshot.findMany({
    where: { sessionId },
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

export async function updateScreenshot(id: string, data: { pageTitle?: string }) {
  return prisma.screenshot.update({
    where: { id },
    data,
  });
}

export async function getScreenshotByFilename(filename: string) {
  return prisma.screenshot.findUnique({
    where: { filename },
  });
}
