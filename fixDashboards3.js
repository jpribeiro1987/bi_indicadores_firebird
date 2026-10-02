const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

const originalSelectDashboard = `const selectDashboard = async (dash) => {
    setActiveDash(dash);
    
    // Parse layout from db
    const newLayout = dash.indicadores.map(di => ({
      i: di.indicadorId.toString(),
      x: di.pos_x,
      y: di.pos_y,
      w: di.largura,
      h: di.altura,
    }));
    setLayout(newLayout);`;

const newSelectDashboard = `const selectDashboard = async (dash, sector = null) => {
    setActiveDash(dash);
    const targetSector = sector || selectedSectorId;
    
    // Find layout for this sector
    let newLayout = [];
    const parsedSectorId = targetSector === 'ALL' ? null : parseInt(targetSector);
    const customLayout = dash.layouts?.find(l => l.setorId === parsedSectorId);
    
    if (customLayout) {
      newLayout = JSON.parse(customLayout.layout_json);
    } else {
      newLayout = dash.indicadores.map(di => ({
        i: di.indicadorId.toString(),
        x: di.pos_x,
        y: di.pos_y,
        w: di.largura,
        h: di.altura,
      }));
    }
    setLayout(newLayout);`;

code = code.replace(originalSelectDashboard, newSelectDashboard);

// Fix handle change
const originalSelectSector = `setSelectedSectorId(e.target.value);`;
const newSelectSector = `setSelectedSectorId(e.target.value);\n            if (dashboards.length > 0) selectDashboard(dashboards[0], e.target.value);`;
code = code.replace(originalSelectSector, newSelectSector);

// Fix saveLayout
const originalSave = `await axios.put(\`/api/dashboards/\${activeDash.id}/layout\`, { layout: payload });`;
const newSave = `await axios.put(\`/api/dashboards/\${activeDash.id}/layout\`, { layout: payload, setorId: selectedSectorId });`;
code = code.replace(originalSave, newSave);

fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
