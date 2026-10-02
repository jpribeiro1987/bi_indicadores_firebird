const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

code = code.replace(/<div key=\{ind\.id\.toString\(\)\} style=\{\{/g, `<div key={ind.id.toString()} data-grid={layout.find(l => l.i === ind.id.toString()) || { x: 0, y: 0, w: 6, h: 12, minW: 3, minH: 6 }} style={{`);
code = code.replace(/layouts=\{\{ lg: layout, md: layout, sm: layout \}\}/g, 'layouts={{ lg: layout }}');

fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
