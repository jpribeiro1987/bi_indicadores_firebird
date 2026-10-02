const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

code = code.replace("import { Responsive as ResponsiveGridLayout, WidthProvider } from 'react-grid-layout';", "import { Responsive as ResponsiveGridLayout, WidthProvider } from 'react-grid-layout/legacy';");

fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
