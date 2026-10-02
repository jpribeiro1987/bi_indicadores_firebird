const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Import Manual
code = code.replace("import Logs from './pages/Logs';", "import Logs from './pages/Logs';\nimport Manual from './pages/Manual';");

// Render Manual
code = code.replace("{activeTab === 'logs' && <Logs />}", "{activeTab === 'logs' && <Logs />}\n        {activeTab === 'manual' && <Manual />}");

fs.writeFileSync('frontend/src/App.jsx', code, 'utf8');
