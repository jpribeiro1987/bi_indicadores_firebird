const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Restore internal app default to theme-light
code = code.replace(
  /const \[theme, setTheme\] = useState\(localStorage\.getItem\('theme'\) \|\| 'theme-dark'\);/,
  `const [theme, setTheme] = useState(localStorage.getItem('theme') || 'theme-light');
  const [loginTheme, setLoginTheme] = useState('theme-dark');`
);

// Apply loginTheme to the login wrapper and Login component
code = code.replace(
  /<div className=\{\`app-container \$\{theme\}\`\}>\s*<Login onLoginSuccess=\{handleLoginSuccess\} theme=\{theme\} setTheme=\{setTheme\} \/>\s*<\/div>/,
  `<div className={\`app-container \${loginTheme}\`}>
        <Login onLoginSuccess={handleLoginSuccess} theme={loginTheme} setTheme={setLoginTheme} />
      </div>`
);

fs.writeFileSync('frontend/src/App.jsx', code, 'utf8');
