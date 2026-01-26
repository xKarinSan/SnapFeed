import { prisma } from "./prisma";

export type FeedbackType = "ui" | "non-ui";

export interface CreateFeedbackInput {
  projectId: string;
  type: FeedbackType;
  content: string;
  author: string;
  posX?: number;
  posY?: number;
  viewportW?: number;
  viewportH?: number;
  selector?: string;
}

export async function getFeedbacksByProject(projectId: string) {
  return prisma.feedback.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFeedback(id: string) {
  return prisma.feedback.findUnique({
    where: { id },
  });
}

export async function createFeedback(data: CreateFeedbackInput) {
  return prisma.feedback.create({
    data,
  });
}

export async function updateFeedback(
  id: string,
  data: { content?: string; resolved?: boolean }
) {
  return prisma.feedback.update({
    where: { id },
    data,
  });
}

export async function deleteFeedback(id: string) {
  return prisma.feedback.delete({
    where: { id },
  });
}

export async function toggleFeedbackResolved(id: string) {
  const feedback = await prisma.feedback.findUnique({ where: { id } });
  if (!feedback) throw new Error("Feedback not found");

  return prisma.feedback.update({
    where: { id },
    data: { resolved: !feedback.resolved },
  });
}
