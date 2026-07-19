import "server-only";

import { Prisma } from "@prisma/client";

import { getPrisma } from "@/lib/db";

import type { ActivationState } from "./activation-types";
import {
  readActivationFromMetadata,
  writeActivationIntoMetadata,
} from "./activation-state-pure";
import { ensureOnboardingState } from "./update-onboarding-state";

export {
  readActivationFromMetadata,
  writeActivationIntoMetadata,
} from "./activation-state-pure";

export async function getActivationStateForUser(
  userId: string
): Promise<ActivationState | null> {
  const prisma = getPrisma();
  const row = await prisma.onboardingState.findUnique({
    where: { userId },
    select: { metadata: true },
  });
  return readActivationFromMetadata(row?.metadata);
}

export async function saveActivationState(input: {
  userId: string;
  activation: ActivationState;
}): Promise<ActivationState> {
  const prisma = getPrisma();
  await ensureOnboardingState(input.userId);

  const current = await prisma.onboardingState.findUnique({
    where: { userId: input.userId },
    select: { metadata: true },
  });

  const nextMetadata = writeActivationIntoMetadata(
    current?.metadata,
    input.activation
  );

  await prisma.onboardingState.update({
    where: { userId: input.userId },
    data: {
      metadata: nextMetadata as Prisma.InputJsonValue,
    },
  });

  return input.activation;
}
