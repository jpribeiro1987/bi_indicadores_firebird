const fs = require('fs');
let code = fs.readFileSync('backend/src/services/alertJob.js', 'utf8');

if (!code.includes('logSincronizacao.deleteMany')) {
  code = code.replace(
    /await prisma\.logSincronizacao\.create\(\{[\s\S]*?\}\);\s*\}/,
    (match) => {
      return match.slice(0, -1) + `
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 15);
      await prisma.logSincronizacao.deleteMany({
        where: { data: { lt: dataLimite } }
      });
    }`;
    }
  );
  fs.writeFileSync('backend/src/services/alertJob.js', code, 'utf8');
}
