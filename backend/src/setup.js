const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const senhaPadrao = await bcrypt.hash('123456', 10);
  
  const emails = ['admin@admin.com', 'jpriberio01@gmail.com', 'joao@hospitalsantoantonio.org.br'];

  for (const email of emails) {
    await prisma.usuario.upsert({
      where: { email },
      update: { senha: senhaPadrao, perfil: 'ADMIN', ativo: true },
      create: { 
        email, 
        senha: senhaPadrao, 
        nome: 'Administrador', 
        perfil: 'ADMIN', 
        ativo: true 
      }
    });
    console.log(`Usuário ${email} garantido no banco! (Senha: 123456)`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
