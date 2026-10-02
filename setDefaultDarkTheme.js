const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

code = code.replace(
  /useState\(localStorage\.getItem\('theme'\) \|\| 'theme-light'\)/,
  "useState(localStorage.getItem('theme') || 'theme-dark')"
);

fs.writeFileSync('frontend/src/App.jsx', code, 'utf8');
