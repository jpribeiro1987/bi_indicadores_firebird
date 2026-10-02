const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

code = code.replace(/<\/ResponsiveGridLayoutWithWidth>\s*\)\}/, `</ResponsiveGridLayoutWithWidth>\n          </>\n        )}`);

fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
