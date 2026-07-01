import "server-only";

import type {
  OnboardingState,
  OnboardingStatus,
  OnboardingStep,
  Prisma,
} from "@prisma/client";

import { getPrisma } from "@/lib/db";

export async function ensureOnboardingState(userId: string): Promise<OnboardingState> {
  const prisma = getPrisma();

  const existing = await prisma.onboardingState.findUnique({
    where: { userId },
  });

  if (existing) {
    return existing;
  }

  return prisma.onboardingState.create({
    data: {
      userId,
      status: "NOT_STARTED",
      currentStep: "ADD_WEBSITE",
    },
  });
}

export async function patchOnboardingState(input: {
  userId: string;
  data: Prisma.OnboardingStateUpdateInput;
}) {
  const prisma = getPrisma();
  await ensureOnboardingState(input.userId);

  return prisma.onboardingState.update({
    where: { userId: input.userId },
    data: input.data,
  });
}

export async function markUserOnboardingCompleted(userId: string) {
  const prisma = getPrisma();
  const now = new Date();

  await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompletedAt: now },
  });

  return patchOnboardingState({
    userId,
    data: {
      status: "COMPLETED" satisfies OnboardingStatus,
      currentStep: "COMPLETE" satisfies OnboardingStep,
      completedAt: now,
    },
  });
}
