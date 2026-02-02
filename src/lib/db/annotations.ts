import { prisma } from "./prisma";

export async function createAnnotation(data: {
  screenshotId: string;
  content: string;
  posX: number;
  posY: number;
}) {
  return prisma.annotation.create({
    data: {
      screenshotId: data.screenshotId,
      content: data.content,
      posX: data.posX,
      posY: data.posY,
    },
  });
}

export async function getAnnotationsByScreenshot(screenshotId: string) {
  return prisma.annotation.findMany({
    where: { screenshotId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getAnnotationById(id: string) {
  return prisma.annotation.findUnique({
    where: { id },
  });
}

export async function updateAnnotation(
  id: string,
  data: { content?: string; posX?: number; posY?: number }
) {
  return prisma.annotation.update({
    where: { id },
    data,
  });
}

export async function deleteAnnotation(id: string) {
  return prisma.annotation.delete({
    where: { id },
  });
}
