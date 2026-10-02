const fs = require('fs');
let code = fs.readFileSync('frontend/src/index.css', 'utf8');

// Change @page
code = code.replace(`@page {
    size: A4;
    margin: 15mm;
  }`, `@page {
    size: A4 landscape;
    margin: 15mm;
  }`);

// Make sure it matches if the regex above didn't match perfectly
if (code.includes(`size: A4;`)) {
  code = code.replace(`size: A4;`, `size: A4 landscape;`);
}

// Add .print-only
const printOnlyCSS = `
  .print-only {
    display: none;
  }
  @media print {
    .print-only {
      display: block !important;
      text-align: center;
      margin-bottom: 20px;
      font-size: 24px;
      font-weight: bold;
      color: black;
      border-bottom: 2px solid #ddd;
      padding-bottom: 10px;
    }
  }
`;
code += printOnlyCSS;

fs.writeFileSync('frontend/src/index.css', code, 'utf8');
