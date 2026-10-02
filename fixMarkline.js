const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

code = code.replace("markLine,\n          label: { show: true, position: 'end', formatter: 'Meta: {c}' }", "label: { show: true, position: 'end', formatter: 'Meta: {c}' }");

code = code.replace("symbolSize: config.tipo_grafico === 'SCATTER' ? 12 : 6,", "symbolSize: config.tipo_grafico === 'SCATTER' ? 12 : 6,\n          markLine: markLine,");

fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
