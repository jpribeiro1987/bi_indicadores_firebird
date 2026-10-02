const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/dashboards.js', 'utf8');

// I'll just regex the block and fix it cleanly
const correctBlock = `const dashboards = await prisma.dashboard.findMany({
      include: {
        indicadores: {
          where: { indicador: { ativo: true } },
          include: { indicador: true }
        },
        layouts: true
      }
    });`;

code = code.replace(/const dashboards = await prisma\.dashboard\.findMany\(\{[\s\S]*?\}\);\s*\n/m, correctBlock + "\n");

fs.writeFileSync('backend/src/routes/dashboards.js', code, 'utf8');
