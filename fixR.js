const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', 'utf8');

// I'll just find the exact line and replace it
code = code.replace(/const uniqueUnits = \[\.\.\.new Set\(\['%', 'R.*/, `const uniqueUnits = [...new Set(['%', 'R$', 'Qtd', 'h', 'dias', ...indicadores.map(i => i.unidade_medida).filter(Boolean)])];`);

fs.writeFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', code, 'utf8');
