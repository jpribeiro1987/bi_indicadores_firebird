const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

code = code.replace("import ReactGridLayout from 'react-grid-layout';", "import { Responsive as ResponsiveGridLayout, WidthProvider } from 'react-grid-layout';\nconst ResponsiveGridLayoutWithWidth = WidthProvider(ResponsiveGridLayout);");

code = code.replace(/<ReactGridLayout/g, '<ResponsiveGridLayoutWithWidth layouts={{ lg: layout }}');
code = code.replace(/<\/ReactGridLayout>/g, '</ResponsiveGridLayoutWithWidth>');

code = code.replace(/layout=\{layout\}/, '');

code = code.replace(/cols=\{12\}/, "breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}\n          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}");

code = code.replace(/\s*width=\{1200\}/, '');

// Also change onLayoutChange
code = code.replace('const onLayoutChange = (newLayout) => {', 'const onLayoutChange = (newLayout, allLayouts) => {');

fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
