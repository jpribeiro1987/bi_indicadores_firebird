const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

const targetStr = `<ResponsiveGridLayout`;

const replacement = `
        <div className="print-only">
          Painel de Indicadores - {selectedSectorId === 'ALL' ? 'Todos os Setores' : (availableSectors.find(s => s.id === parseInt(selectedSectorId))?.nome || 'Setor')}
        </div>
        <ResponsiveGridLayout`;

code = code.replace(targetStr, replacement);

fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
