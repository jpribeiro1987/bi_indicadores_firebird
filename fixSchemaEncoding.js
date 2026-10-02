const fs = require('fs');
let code = fs.readFileSync('backend/prisma/schema.prisma');
let str = '';
for(let i=0; i<code.length; i++) {
  if (code[i] !== 0) {
    str += String.fromCharCode(code[i]);
  }
}
str = str.replace(/model LogSincronizacao[\s\S]*/, '');
str += `\nmodel LogSincronizacao {
  id        Int      @id @default(autoincrement())
  data      DateTime @default(now())
  tipo      String   // AUTOMATICO, MANUAL
  sucesso   Boolean
  detalhes  String?
}
`;
fs.writeFileSync('backend/prisma/schema.prisma', str, 'utf8');
