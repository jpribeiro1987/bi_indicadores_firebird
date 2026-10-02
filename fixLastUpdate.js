const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

// Add state for lastUpdate
code = code.replace(/const \[availableSectors, setAvailableSectors\] = useState\(\[\]\);/, `const [availableSectors, setAvailableSectors] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);`);

// Fetch lastUpdate in fetchDashboards
const fetchDashboardsCode = `const fetchDashboards = async () => {`;
const fetchDashboardsReplacement = `const fetchDashboards = async () => {
    try {
      const logsRes = await axios.get('/api/config/logs');
      const sucessos = logsRes.data.filter(l => l.status === 'SUCESSO');
      if (sucessos.length > 0) {
        setLastUpdate(new Date(sucessos[0].data).toLocaleString('pt-BR'));
      }
    } catch(e) {}
`;
code = code.replace(fetchDashboardsCode, fetchDashboardsReplacement + fetchDashboardsCode.replace('const ', ''));

// Update handleSync
const syncSuccessCode = `alert('Sincronização iniciada com sucesso!');`;
const syncSuccessReplacement = `alert('Sincronização iniciada com sucesso!');
      setTimeout(() => fetchDashboards(), 2000);`;
code = code.replace(syncSuccessCode, syncSuccessReplacement);

// Render lastUpdate in the header
const headerCode = `<button onClick={handleSync}`;
const headerReplacement = `
            {lastUpdate && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', marginRight: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>Última atualização:</span>
                <strong style={{ color: 'var(--text-main)' }}>{lastUpdate}</strong>
              </div>
            )}
            <button onClick={handleSync}`;
code = code.replace(headerCode, headerReplacement);

fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
