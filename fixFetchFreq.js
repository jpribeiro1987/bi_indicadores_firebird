const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', 'utf8');

code = code.replace(
  `fetchUnidadesList();\n  },`,
  `fetchUnidadesList();\n    fetchFrequenciasList();\n  },`
);

fs.writeFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', code, 'utf8');
