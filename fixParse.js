const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Dashboards.jsx', 'utf8');

const oldParse = `newLayout = JSON.parse(customLayout.layout_json).map(l => ({ ...l, minW: 3, minH: 6 }));`;
const newParse = `newLayout = JSON.parse(customLayout.layout_json).map(l => ({
        i: l.indicadorId ? l.indicadorId.toString() : (l.i ? l.i.toString() : ''),
        x: l.pos_x !== undefined ? l.pos_x : l.x,
        y: l.pos_y !== undefined ? l.pos_y : l.y,
        w: l.largura !== undefined ? l.largura : l.w,
        h: l.altura !== undefined ? l.altura : l.h,
        minW: 3, minH: 6 
      }));`;

code = code.replace(oldParse, newParse);

fs.writeFileSync('frontend/src/pages/Dashboards.jsx', code, 'utf8');
