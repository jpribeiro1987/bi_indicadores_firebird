const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

// Replace selectDashboard
code = code.replace(/const selectDashboard = async \(dash\) => \{[\s\S]*?\}\n    for/, `const selectDashboard = async (dash, sector = null) => {
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
    setLayout(newLayout);

    // Fetch data for each indicator
    const newData = {};
    for`);

// Add sector to handle change
code = code.replace("setSelectedSectorId(e.target.value);", "setSelectedSectorId(e.target.value);\n            if(dashboards.length > 0) selectDashboard(dashboards[0], e.target.value);");

// Fix saveLayout
code = code.replace(/await axios\.put\(\`\/api\/dashboards\/\$\{activeDash\.id\}\/layout\`, \{ layout: payload \}\);/, "await axios.put(`/api/dashboards/${activeDash.id}/layout`, { layout: payload, setorId: selectedSectorId });");

fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
