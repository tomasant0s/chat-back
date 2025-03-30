// scripts/seed-user.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      name: 'Luana',
      phone: '5524999549331',
      email: 'tomasgsantoos@gmail.com',
      // Adicione outros campos conforme definido no seu schema
    },
  });
  console.log('Usuário de teste criado:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
