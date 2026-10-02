const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const units = [
    { nome: 'Percentual', simbolo: '%' },
    { nome: 'Moeda (Real)', simbolo: 'R$' },
    { nome: 'Quantidade', simbolo: 'Qtd' },
    { nome: 'Horas', simbolo: 'h' },
    { nome: 'Dias', simbolo: 'dias' }
  ];

  for (const u of units) {
    await prisma.unidadeMedida.upsert({
      where: { simbolo: u.simbolo },
      update: {},
      create: u
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
