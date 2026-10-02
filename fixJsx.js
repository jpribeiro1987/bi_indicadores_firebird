const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

const targetStr = `
        <div className="print-only">
          Painel de Indicadores - {selectedSectorId === 'ALL' ? 'Todos os Setores' : (availableSectors.find(s => s.id === parseInt(selectedSectorId))?.nome || 'Setor')}
        </div>
        <ResponsiveGridLayoutWithWidth`;

const replacement = `
        <>
        <div className="print-only">
          Painel de Indicadores - {selectedSectorId === 'ALL' ? 'Todos os Setores' : (availableSectors.find(s => s.id === parseInt(selectedSectorId))?.nome || 'Setor')}
        </div>
        <ResponsiveGridLayoutWithWidth`;

code = code.replace(targetStr, replacement);

const targetStr2 = `        </ResponsiveGridLayoutWithWidth>
        )}
      </div>`;

const replacement2 = `        </ResponsiveGridLayoutWithWidth>
        </>
        )}
      </div>`;
code = code.replace(targetStr2, replacement2);

fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
