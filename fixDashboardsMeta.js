const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/dashboards.js', 'utf8');

code = code.replace(
  /include:\s*\{\s*indicador:\s*true\s*\}/g,
  `include: { indicador: { include: { metas: true } } }`
);

fs.writeFileSync('backend/src/routes/dashboards.js', code, 'utf8');
