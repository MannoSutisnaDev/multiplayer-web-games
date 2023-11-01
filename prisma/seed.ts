import { PrismaClient } from "@prisma/client";

import { GameTypesData } from "@/shared/types/socket-communication/general";

const prisma = new PrismaClient();
async function main() {
  for (const data of Object.values(GameTypesData)) {
    await prisma.gameType.upsert({
      where: { name: data.name },
      update: {
        name: data.name,
        maxPlayers: data.maxPlayers,
      },
      create: {
        name: data.name,
        maxPlayers: data.maxPlayers,
      },
    });
  }
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
