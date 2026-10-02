const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

// Fix indicator filter
code = code.replace(
  `(userRole === 'ADMIN' || !di.indicador.setorId || userSectors.includes(di.indicador.setorId))`,
  `(userRole === 'ADMIN' || userRole === 'LEITURA' || !di.indicador.setorId || userSectors.includes(di.indicador.setorId))`
);

// Fix dropdown filter
code = code.replace(
  `availableSectors.filter(s => userRole === 'ADMIN' || userSectors.includes(s.id))`,
  `availableSectors.filter(s => userRole === 'ADMIN' || userRole === 'LEITURA' || userSectors.includes(s.id))`
);

// Disable save layout button for LEITURA
code = code.replace(
  /<button onClick=\{saveLayout\} style=\{\{ background: 'var\(--primary\)', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' \}\}>/g,
  `{userRole !== 'LEITURA' && <button onClick={saveLayout} style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>`
);

// The closing tag
// Find the <button onClick={saveLayout}>... </button> block
code = code.replace(
  /(<Save size=\{16\}\/> Salvar [^\n]*\n\s*)<\/button>/,
  `$1</button>}`
);

fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
