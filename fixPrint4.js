const fs = require('fs');

const cssToAppend = `
@media print {
  .app-container, .main-content {
    padding: 0 !important;
    margin: 0 !important;
    background: white !important;
  }
  
  .react-grid-item canvas {
    max-width: 100% !important;
    height: auto !important;
    object-fit: contain !important;
  }
}
`;

fs.appendFileSync('frontend/src/index.css', cssToAppend, 'utf8');
