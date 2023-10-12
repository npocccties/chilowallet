import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import { badgeCostomerTestData } from "./testdata/badge_customer";
import { badgeIssuerSelectorTestData } from "./testdata/badge_issuer_selectors";
import { badgeVcsTestData } from "./testdata/badge_vcs";
import { submissionsTestData } from "./testdata/submissions";

const prisma = new PrismaClient();

async function main() {
  // テストデータの挿入;
  for (let i = 0; i < 10; i++) {
    await prisma.myWallet.create({
      data: {
        mywalletId: i,
        orthrosId: faker.string.uuid(),
        createdAt: faker.date.anytime(),
      },
    });
  }
  await prisma.badgeVc.createMany({
    data: badgeVcsTestData,
  });
  await prisma.badgeCustomer.createMany({
    data: badgeCostomerTestData,
  });
  await prisma.submission.createMany({
    data: submissionsTestData,
  });
  await prisma.badgeIssuerSelector.createMany({
    data: badgeIssuerSelectorTestData,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
