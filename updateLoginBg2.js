const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Login.jsx', 'utf8');

// Update background image to the new one
code = code.replace(
  /\/background_login\.jpg/g,
  '/background_login2.jpg'
);

// Add more transparency to the glass-card
code = code.replace(
  /className="glass-card" style=\{\{/,
  `className="glass-card" style={{ background: theme === 'theme-light' ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.4)',`
);

fs.writeFileSync('frontend/src/pages/Login.jsx', code, 'utf8');
