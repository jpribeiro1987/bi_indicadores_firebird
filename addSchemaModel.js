const fs = require('fs');
let schema = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

const newModel = `
model UnidadeMedida {
  id        Int      @id @default(autoincrement())
  nome      String
  simbolo   String   @unique
  criado_em DateTime @default(now())
}
`;

fs.appendFileSync('backend/prisma/schema.prisma', newModel, 'utf8');
