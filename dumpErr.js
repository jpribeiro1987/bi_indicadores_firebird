const fs = require('fs');
let code = fs.readFileSync('backend/src/routes/dashboards.js', 'utf8');
code = code.replace("console.error(error);", "console.error(error); require('fs').writeFileSync('err.txt', String(error));");
fs.writeFileSync('backend/src/routes/dashboards.js', code, 'utf8');
