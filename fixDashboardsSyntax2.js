const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

code = code.replace(`const fetchDashboards = async () => {
    try {
      const logsRes = await axios.get('/api/config/logs');
      const sucessos = logsRes.data.filter(l => l.status === 'SUCESSO');
      if (sucessos.length > 0) {
        setLastUpdate(new Date(sucessos[0].data).toLocaleString('pt-BR'));
      }
    } catch(e) {}
fetchDashboards = async () => {`, `const fetchDashboards = async () => {
    try {
      const logsRes = await axios.get('/api/config/logs');
      const sucessos = logsRes.data.filter(l => l.status === 'SUCESSO');
      if (sucessos.length > 0) {
        setLastUpdate(new Date(sucessos[0].data).toLocaleString('pt-BR'));
      }
    } catch(e) {}`);

fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
