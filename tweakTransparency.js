const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Login.jsx', 'utf8');

// Ajustar transparência do glass-card para algo menos transparente (mais opaco)
code = code.replace(
  /background:\s*theme\s*===\s*'theme-light'\s*\?\s*'rgba\(255,255,255,0\.3\)'\s*:\s*'rgba\(15,23,42,0\.4\)'/,
  "background: theme === 'theme-light' ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.7)'"
);

fs.writeFileSync('frontend/src/pages/Login.jsx', code, 'utf8');
