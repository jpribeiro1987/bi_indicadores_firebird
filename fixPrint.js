const fs = require('fs');
let code = fs.readFileSync('frontend/src/index.css', 'utf8');

// Find the @media print section and add .main-content overrides
const printSection = `    .page-container { margin: 0 !important; padding: 0 !important; }`;
const printReplacement = `    .page-container { margin: 0 !important; padding: 0 !important; }
    
    .app-container, .main-content {
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      display: block !important;
    }`;

code = code.replace(printSection, printReplacement);

fs.writeFileSync('frontend/src/index.css', code, 'utf8');
