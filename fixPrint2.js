const fs = require('fs');
let code = fs.readFileSync('frontend/src/index.css', 'utf8');

const target = `@media print {`;
const replacement = `@media print {
  .app-container, .main-content {
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    display: block !important;
  }`;

code = code.replace(target, replacement);

fs.writeFileSync('frontend/src/index.css', code, 'utf8');
