const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', 'utf8');

code = code.replace(/fetchUnidadesList\(\);\s*\}, \[userRole, userSectors\]\);/, `fetchUnidadesList();\n    fetchFrequenciasList();\n  }, [userRole, userSectors]);`);

fs.writeFileSync('frontend/src/pages/ConstrutorIndicadores.jsx', code, 'utf8');
