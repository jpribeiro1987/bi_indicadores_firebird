const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Login.jsx', 'utf8');

// Change background to the new image
code = code.replace(
  /\/banner_login\.jpg/g,
  '/background_login.jpg'
);

// Revert the logo back to logo.png
code = code.replace(
  /<img src="\/background_login\.jpg"/, // It was replaced by /banner_login.jpg, then my first replace changed it to /background_login.jpg! So we replace it back to logo.png
  '<img src="/logo.png"'
);

// Revert the logo size
code = code.replace(
  /maxHeight:\s*'140px',\s*borderRadius:\s*'8px'/,
  "maxHeight: '80px'"
);

fs.writeFileSync('frontend/src/pages/Login.jsx', code, 'utf8');
