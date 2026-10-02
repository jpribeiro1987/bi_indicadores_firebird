const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

code = code.replace('rowHeight={30}', 'rowHeight={30}\n            margin={[24, 24]}\n            containerPadding={[0, 0]}');
code = code.replace("borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column' }}>", "borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>");

fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
