const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');
code = code.replace("parseFloat(indicador.metas[0].valor_alvo)", "parseFloat(String(indicador.metas[0].valor_alvo).replace(',', '.'))");
fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
