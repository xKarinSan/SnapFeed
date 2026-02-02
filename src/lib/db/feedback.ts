import { prisma } from "./prisma";

export interface CreateFeedbackInput {
  sessionId: string;
  content: string;
}

export async function getFeedbacksBySession(sessionId: string) {
  return prisma.feedback.findMany({
    where: { sessionId },
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

export async function updateFeedback(id: string, data: { content?: string }) {
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
