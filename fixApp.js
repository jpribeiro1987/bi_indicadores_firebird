const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

code = code.replace("import Configuracoes from './pages/Configuracoes';", "import Configuracoes from './pages/Configuracoes';\nimport Logs from './pages/Logs';");
code = code.replace('<Route path="/configuracoes" element={<Configuracoes />} />', '<Route path="/configuracoes" element={<Configuracoes />} />\n            <Route path="/logs" element={<Logs />} />');

fs.writeFileSync('frontend/src/App.jsx', code, 'utf8');
