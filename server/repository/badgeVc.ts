import { loggerError, loggerInfo } from "@/lib/logger";
import prisma, { Prisma } from "@/lib/prisma";

export const createBadgeVc = async (input: Prisma.BadgeVcCreateInput) => {
  try {
    // Ensure createdAt is set if not provided
    const data = {
      ...input,
      createdAt: input.createdAt || new Date(), // Set current date if createdAt is missing
    };

    await prisma.badgeVc.create({
      data,
    });
  } catch (e) {
    loggerError("failed to saveBadgeVc", e.message);
    throw e;
  }
};

export const deleteBadgeVc = async ({ badgeVcId, walletId }: { badgeVcId: number; walletId: number }) => {
  await prisma.badgeVc.delete({
    where: {
      badgeVcId: badgeVcId,
      walletId: walletId,
    },
  });
};
