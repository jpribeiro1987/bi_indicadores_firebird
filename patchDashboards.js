const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

const handleSyncCode = `
  const handleSync = async () => {
    try {
      await axios.post('/api/dashboards/sync');
      alert('Sincronização iniciada com sucesso! O processo roda em background. Atualize a tela em alguns instantes.');
    } catch (err) {
      alert('Erro ao disparar sincronização');
    }
  };

`;

code = code.replace('  return (', handleSyncCode + '  return (');

const buttonCode = `<button onClick={handleSync} style={{ background: 'var(--panel-bg)', color: 'var(--text-main)', padding: '8px 16px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Atualizar Agora
          </button>\n          `;

code = code.replace('<button onClick={() => window.print()}', buttonCode + '<button onClick={() => window.print()}');

fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
