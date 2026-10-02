const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Login.jsx', 'utf8');

// Use it as the logo/banner inside the card
code = code.replace(
  /<img src="\/logo\.png"/,
  '<img src="/banner_login.jpg"'
);

// Remove the max-height limit so it shows nicely (adjust to 120px if needed, it was 80px)
code = code.replace(
  /maxHeight:\s*'80px'/,
  "maxHeight: '140px', borderRadius: '8px'"
);

// We can also use it as a blurred or darkened background for an awesome effect!
// Let's add it to the main container
code = code.replace(
  /background:\s*'var\(--bg-main\)'/,
  "background: 'linear-gradient(rgba(0, 10, 20, 0.7), rgba(0, 10, 20, 0.8)), url(/banner_login.jpg) center/cover no-repeat'"
);

fs.writeFileSync('frontend/src/pages/Login.jsx', code, 'utf8');
