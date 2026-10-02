const fs = require('fs');
let code = fs.readFileSync('frontend/src/index.css', 'utf8');

const printStylesToReplace = `    .app-container, .main-content {
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      display: block !important;
    }`;

const printStylesNew = `    .app-container, .main-content {
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      display: block !important;
      padding: 0 !important;
      margin: 0 !important;
      background: white !important;
    }`;

code = code.replace(printStylesToReplace, printStylesNew);

const gridItemStylesToReplace = `    .react-grid-item > div {
      height: 100% !important;
    }`;

const gridItemStylesNew = `    .react-grid-item > div {
      height: 100% !important;
    }
    
    /* Make ECharts Canvas scale proportionally in print to avoid being cut off */
    .react-grid-item canvas {
      max-width: 100% !important;
      height: auto !important;
      object-fit: contain !important;
    }`;

code = code.replace(gridItemStylesToReplace, gridItemStylesNew);

fs.writeFileSync('frontend/src/index.css', code, 'utf8');
