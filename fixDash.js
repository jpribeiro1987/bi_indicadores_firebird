const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/dashboards.js', 'utf8');
code = code.replace("syncBiData();", "syncBiData('MANUAL');");
fs.writeFileSync('backend/src/routes/dashboards.js', code, 'utf8');
