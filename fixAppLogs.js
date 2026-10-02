const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

code = code.replace("{activeTab === 'setores' && <SetoresUsuarios />}", "{activeTab === 'setores' && <SetoresUsuarios />}\n        {activeTab === 'logs' && <Logs />}");

fs.writeFileSync('frontend/src/App.jsx', code, 'utf8');
