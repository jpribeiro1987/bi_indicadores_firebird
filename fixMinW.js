const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

code = code.replace(/newLayout = JSON\.parse\(customLayout\.layout_json\);/, `newLayout = JSON.parse(customLayout.layout_json).map(l => ({ ...l, minW: 3, minH: 6 }));`);

code = code.replace(/w: di\.largura,\n        h: di\.altura,/, `w: di.largura,\n        h: di.altura,\n        minW: 3,\n        minH: 6,`);

fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
